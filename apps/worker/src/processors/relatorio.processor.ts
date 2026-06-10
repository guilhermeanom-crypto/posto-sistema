import { Worker, Queue } from 'bullmq'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { redis } from '../infra/redis.js'
import { prisma } from '../infra/prisma.js'
import { env } from '../config/env.js'
import { s3 } from '../infra/s3.js'
import type { TipoRelatorio } from '@prisma/client'
import { logger } from "../lib/logger.js"

// ─────────────────────────────────────────────────────────────────────────────
// RELATORIO PROCESSOR — geração assíncrona de PDF e Excel
// ─────────────────────────────────────────────────────────────────────────────

const emailQueue = new Queue('email', { connection: redis })

// ── Helpers ──────────────────────────────────────────────────────────────────

function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

function formatDate(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

async function uploadS3(key: string, buffer: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
}

// ── Renderers ─────────────────────────────────────────────────────────────────

async function renderComplianceGeral(tenantId: string, params: Record<string, unknown>) {
  const empreendimentoId = params.empreendimentoId as string | undefined

  const snapshots = await prisma.complianceSnapshot.findMany({
    where: {
      tenantId,
      ...(empreendimentoId && { empreendimentoId }),
    },
    select: {
      empreendimentoId: true,
      indiceConformidade: true,
      empreendimento: { select: { nome: true } },
    },
    orderBy: { calculadoEm: 'desc' },
    take: 100,
  })

  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  doc.fontSize(18).text('Relatório de Compliance Geral', { align: 'center' })
  doc.moveDown()
  doc.fontSize(10).text(`Gerado em: ${formatDate(new Date())}`, { align: 'right' })
  doc.moveDown()

  if (snapshots.length === 0) {
    doc.fontSize(11).text('Nenhum dado de compliance encontrado.')
  } else {
    // Agrupar por empreendimento — último snapshot de cada
    const porEmp = new Map<string, typeof snapshots[0]>()
    for (const s of snapshots) {
      if (!porEmp.has(s.empreendimentoId)) porEmp.set(s.empreendimentoId, s)
    }

    doc.fontSize(12).text('Índice de Compliance por Empreendimento')
    doc.moveDown(0.5)

    for (const s of porEmp.values()) {
      const pct = s.indiceConformidade != null ? `${Number(s.indiceConformidade).toFixed(1)}%` : '—'
      doc.fontSize(10).text(`${s.empreendimento.nome}`, { continued: true }).text(`  ${pct}`, { align: 'right' })
    }
  }

  return pdfToBuffer(doc)
}

async function renderVencimentos(tenantId: string, params: Record<string, unknown>) {
  const diasHorizonte = (params.dias as number) ?? 30

  const limite = new Date()
  limite.setDate(limite.getDate() + diasHorizonte)

  const [processos, documentos, condicionantes, empreendimentos, tiposProcesso] = await Promise.all([
    prisma.processo.findMany({
      where: { tenantId, dataVencimento: { lte: limite }, status: { notIn: ['CANCELADO', 'ARQUIVADO'] } },
      orderBy: { dataVencimento: 'asc' },
    }),
    prisma.documento.findMany({
      where: { tenantId, dataValidade: { lte: limite }, status: { notIn: ['SUBSTITUIDO', 'DISPENSADO'] } },
      orderBy: { dataValidade: 'asc' },
    }),
    prisma.condicionante.findMany({
      where: { tenantId, proximoVencimento: { lte: limite }, status: { notIn: ['CUMPRIDA', 'DISPENSADA'] } },
      orderBy: { proximoVencimento: 'asc' },
    }),
    prisma.empreendimento.findMany({ where: { tenantId }, select: { id: true, nome: true } }),
    prisma.tipoProcesso.findMany({ select: { id: true, nome: true } }),
  ])

  const empMap = new Map(empreendimentos.map((e) => [e.id, e.nome]))
  const tipoMap = new Map(tiposProcesso.map((t) => [t.id, t.nome]))

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Sistema Posto'

  function addSheet(name: string, rows: { empreendimento: string; descricao: string; vencimento: Date | null | undefined }[]) {
    const ws = wb.addWorksheet(name)
    ws.columns = [
      { header: 'Empreendimento', key: 'emp', width: 35 },
      { header: 'Descrição', key: 'desc', width: 50 },
      { header: 'Vencimento', key: 'venc', width: 15 },
    ]
    ws.getRow(1).font = { bold: true }
    for (const r of rows) {
      ws.addRow({ emp: r.empreendimento, desc: r.descricao, venc: r.vencimento ? formatDate(r.vencimento) : '—' })
    }
  }

  addSheet('Processos', processos.map((p) => ({ empreendimento: empMap.get(p.empreendimentoId) ?? p.empreendimentoId, descricao: (tipoMap.get(p.tipoProcessoId) ?? '') + (p.numeroProtocolo ? ` — ${p.numeroProtocolo}` : ''), vencimento: p.dataVencimento })))
  addSheet('Documentos', documentos.map((d) => ({ empreendimento: empMap.get(d.empreendimentoId) ?? d.empreendimentoId, descricao: d.nome, vencimento: d.dataValidade })))
  addSheet('Condicionantes', condicionantes.map((c) => ({ empreendimento: empMap.get(c.empreendimentoId) ?? c.empreendimentoId, descricao: c.descricao, vencimento: c.proximoVencimento ?? c.prazoCumprimento })))

  const buffer = Buffer.from(await wb.xlsx.writeBuffer())
  return buffer
}

async function renderSST(tenantId: string) {
  const hoje = new Date()
  const limite90 = new Date(hoje)
  limite90.setDate(hoje.getDate() + 90)

  const [asos, treinamentos, empreendimentosSST, tiposTreino] = await Promise.all([
    prisma.aSO.findMany({
      where: { tenantId, dataVencimento: { lte: limite90 } },
      orderBy: { dataVencimento: 'asc' },
    }),
    prisma.treinamentoExecucao.findMany({
      where: { tenantId, dataVencimento: { lte: limite90 } },
      orderBy: { dataVencimento: 'asc' },
    }),
    prisma.empreendimento.findMany({ where: { tenantId }, select: { id: true, nome: true } }),
    prisma.treinamentoTipo.findMany({ select: { id: true, nome: true } }),
  ])

  const empSSTMap = new Map(empreendimentosSST.map((e) => [e.id, e.nome]))
  const tipoTreinoMap = new Map(tiposTreino.map((t) => [t.id, t.nome]))

  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  doc.fontSize(18).text('Relatório SST — Vencimentos', { align: 'center' })
  doc.moveDown()
  doc.fontSize(10).text(`Horizonte: próximos 90 dias | Gerado em: ${formatDate(new Date())}`, { align: 'right' })
  doc.moveDown()

  doc.fontSize(12).text('ASOs a Vencer')
  doc.moveDown(0.5)
  if (asos.length === 0) {
    doc.fontSize(10).text('Nenhum ASO vencendo nos próximos 90 dias.')
  } else {
    for (const a of asos) {
      doc.fontSize(10).text(`${a.funcionarioNome} (${a.cargo ?? '—'}) — ${empSSTMap.get(a.empreendimentoId) ?? a.empreendimentoId} — Vence: ${formatDate(a.dataVencimento)}`)
    }
  }

  doc.moveDown()
  doc.fontSize(12).text('Treinamentos a Realizar')
  doc.moveDown(0.5)
  if (treinamentos.length === 0) {
    doc.fontSize(10).text('Nenhum treinamento pendente nos próximos 90 dias.')
  } else {
    for (const t of treinamentos) {
      doc.fontSize(10).text(`${tipoTreinoMap.get(t.tipoId) ?? t.tipoId} — ${empSSTMap.get(t.empreendimentoId) ?? t.empreendimentoId} — Vence: ${formatDate(t.dataVencimento)}`)
    }
  }

  return pdfToBuffer(doc)
}

async function renderLogisticaReversa(tenantId: string) {
  const [metas, empreendimentosLR] = await Promise.all([
    prisma.metaResiduoAnual.findMany({
      where: { tenantId },
      orderBy: [{ ano: 'desc' }, { tipoResiduo: 'asc' }],
    }),
    prisma.empreendimento.findMany({ where: { tenantId }, select: { id: true, nome: true } }),
  ])
  const empLRMap = new Map(empreendimentosLR.map((e) => [e.id, e.nome]))

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Metas')
  ws.columns = [
    { header: 'Empreendimento', key: 'emp', width: 35 },
    { header: 'Ano', key: 'ano', width: 8 },
    { header: 'Tipo Resíduo', key: 'residuo', width: 25 },
    { header: 'Unidade', key: 'unidade', width: 10 },
    { header: 'Meta', key: 'meta', width: 14 },
  ]
  ws.getRow(1).font = { bold: true }

  for (const m of metas) {
    ws.addRow({ emp: empLRMap.get(m.empreendimentoId) ?? m.empreendimentoId, ano: m.ano, residuo: m.tipoResiduo, unidade: m.unidade, meta: Number(m.metaQuantidade) })
  }

  const buffer = Buffer.from(await wb.xlsx.writeBuffer())
  return buffer
}

async function renderAutuacoes(tenantId: string) {
  const [autos, empreendimentosAI] = await Promise.all([
    prisma.autoInfracao.findMany({
      where: { tenantId, status: { notIn: ['ENCERRADO', 'PAGO'] } },
      orderBy: { prazoDefesa: 'asc' },
    }),
    prisma.empreendimento.findMany({ where: { tenantId }, select: { id: true, nome: true } }),
  ])
  const empAIMap = new Map(empreendimentosAI.map((e) => [e.id, e.nome]))

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Autos em Aberto')
  ws.columns = [
    { header: 'Nº Auto', key: 'num', width: 20 },
    { header: 'Empreendimento', key: 'emp', width: 30 },
    { header: 'Órgão', key: 'orgao', width: 15 },
    { header: 'Status', key: 'status', width: 22 },
    { header: 'Prazo Defesa', key: 'prazo', width: 15 },
    { header: 'Valor Multa (R$)', key: 'valor', width: 18 },
  ]
  ws.getRow(1).font = { bold: true }

  for (const a of autos) {
    ws.addRow({
      num: a.numeroAuto,
      emp: empAIMap.get(a.empreendimentoId) ?? a.empreendimentoId,
      orgao: a.orgao,
      status: a.status,
      prazo: formatDate(a.prazoDefesa),
      valor: a.valorMulta ? Number(a.valorMulta) : 0,
    })
  }

  const buffer = Buffer.from(await wb.xlsx.writeBuffer())
  return buffer
}

async function renderMonitoramentoAmbiental(tenantId: string) {
  const [campanhas, pocos, empreendimentos] = await Promise.all([
    prisma.campanhaMonitoramento.findMany({
      where: { tenantId },
      orderBy: { dataColeta: 'desc' },
      take: 100,
    }),
    prisma.pocoMonitoramento.findMany({
      where: { tenantId },
      select: { id: true, codigo: true, status: true, empreendimentoId: true },
    }),
    prisma.empreendimento.findMany({ where: { tenantId }, select: { id: true, nome: true } }),
  ])

  const empMap = new Map(empreendimentos.map((e) => [e.id, e.nome]))

  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  doc.fontSize(18).text('Relatório de Monitoramento Ambiental', { align: 'center' })
  doc.moveDown()
  doc.fontSize(10).text(`Gerado em: ${formatDate(new Date())}`, { align: 'right' })
  doc.moveDown()

  // Poços de monitoramento
  doc.fontSize(12).text(`Poços de Monitoramento: ${pocos.length}`)
  doc.moveDown(0.5)
  const pocosAtivos = pocos.filter((p) => p.status === 'ATIVO').length
  const pocosDanificados = pocos.filter((p) => p.status === 'DANIFICADO').length
  doc.fontSize(10).text(`Ativos: ${pocosAtivos} | Inativos: ${pocos.length - pocosAtivos - pocosDanificados} | Danificados: ${pocosDanificados}`)
  doc.moveDown()

  // Campanhas recentes
  doc.fontSize(12).text(`Últimas Campanhas: ${campanhas.length}`)
  doc.moveDown(0.5)
  if (campanhas.length === 0) {
    doc.fontSize(10).text('Nenhuma campanha registrada.')
  } else {
    for (const c of campanhas.slice(0, 20)) {
      const emp = empMap.get(c.empreendimentoId) ?? c.empreendimentoId
      doc.fontSize(10).text(`${formatDate(c.dataColeta)} — ${emp} — ${c.resultado} — ${c.laboratorio}`)
    }
  }

  return pdfToBuffer(doc)
}

async function renderAuditLog(tenantId: string) {
  const agora = new Date()
  const ultimos30Dias = new Date(agora.getTime() - 30 * 86_400_000)

  const logs = await prisma.auditLog.findMany({
    where: { tenantId, criadoEm: { gte: ultimos30Dias } },
    orderBy: { criadoEm: 'desc' },
    take: 500,
    select: {
      acao: true,
      entidadeTipo: true,
      entidadeId: true,
      usuarioNome: true,
      criadoEm: true,
    },
  })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Sistema Posto'
  const ws = wb.addWorksheet('Audit Log — 30 dias')

  ws.columns = [
    { header: 'Data/Hora', key: 'data', width: 20 },
    { header: 'Usuário', key: 'usuario', width: 25 },
    { header: 'Ação', key: 'acao', width: 30 },
    { header: 'Entidade', key: 'entidade', width: 20 },
    { header: 'ID', key: 'entidadeId', width: 38 },
  ]
  ws.getRow(1).font = { bold: true }

  for (const log of logs) {
    ws.addRow({
      data: log.criadoEm.toLocaleString('pt-BR'),
      usuario: log.usuarioNome ?? '—',
      acao: log.acao,
      entidade: log.entidadeTipo ?? '—',
      entidadeId: log.entidadeId ?? '—',
    })
  }

  return Buffer.from(await wb.xlsx.writeBuffer())
}

// ── Processor ─────────────────────────────────────────────────────────────────

export function criarRelatorioWorker(concurrency = 2) {
  return new Worker(
    'relatorio',
    async (job) => {
      if (job.name !== 'gerar-relatorio') return

      const { relatorioId } = job.data as { relatorioId: string }

      const rel = await prisma.relatorioGerado.findUnique({ where: { id: relatorioId } })
      if (!rel) throw new Error(`Relatório ${relatorioId} não encontrado`)

      await prisma.relatorioGerado.update({ where: { id: relatorioId }, data: { status: 'PROCESSANDO' } })

      try {
        const tipo = rel.tipo as TipoRelatorio
        const params = rel.parametros as Record<string, unknown>
        let buffer: Buffer
        let ext: string
        let contentType: string

        switch (tipo) {
          case 'COMPLIANCE_GERAL':
            buffer = await renderComplianceGeral(rel.tenantId, params)
            ext = 'pdf'; contentType = 'application/pdf'
            break
          case 'VENCIMENTOS':
            buffer = await renderVencimentos(rel.tenantId, params)
            ext = 'xlsx'; contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            break
          case 'SST':
            buffer = await renderSST(rel.tenantId)
            ext = 'pdf'; contentType = 'application/pdf'
            break
          case 'LOGISTICA_REVERSA':
            buffer = await renderLogisticaReversa(rel.tenantId)
            ext = 'xlsx'; contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            break
          case 'AUTOS_INFRACAO':
            buffer = await renderAutuacoes(rel.tenantId)
            ext = 'xlsx'; contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            break
          case 'MONITORAMENTO_AMBIENTAL':
            buffer = await renderMonitoramentoAmbiental(rel.tenantId)
            ext = 'pdf'; contentType = 'application/pdf'
            break
          case 'AUDIT_LOG':
            buffer = await renderAuditLog(rel.tenantId)
            ext = 'xlsx'; contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            break
          default:
            throw new Error(`Tipo de relatório não suportado: ${tipo}`)
        }

        const s3Key = `${rel.tenantId}/relatorios/${relatorioId}.${ext}`
        await uploadS3(s3Key, buffer, contentType)

        await prisma.relatorioGerado.update({
          where: { id: relatorioId },
          data: { status: 'CONCLUIDO', s3Key, geradoEm: new Date() },
        })

        // Notificar usuário por email
        const usuario = await prisma.usuario.findUnique({ where: { id: rel.solicitadoPor }, select: { email: true, nome: true } })
        if (usuario) {
          await emailQueue.add('relatorio-pronto', {
            tipo: 'relatorio_pronto',
            email: usuario.email,
            nome: usuario.nome,
            tipoRelatorio: tipo,
          })
        }

        logger.info(`[relatorio] ${tipo} gerado: ${s3Key}`)
      } catch (err) {
        await prisma.relatorioGerado.update({
          where: { id: relatorioId },
          data: { status: 'ERRO', erroMsg: (err as Error).message },
        })
        throw err
      }
    },
    { connection: redis, concurrency },
  )
}
