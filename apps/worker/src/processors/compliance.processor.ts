import { Worker } from 'bullmq'
import { prisma } from '../infra/prisma.js'
import { redis } from '../infra/redis.js'
import { calcularIndiceConformidade, determinarStatusCompliance } from '@repo/utils'

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE PROCESSOR
// Calcula e persiste o snapshot de conformidade de um empreendimento.
// ─────────────────────────────────────────────────────────────────────────────

interface ComplianceJobData {
  tenantId: string
  empreendimentoId: string
}

async function calcularCompliance(tenantId: string, empreendimentoId: string): Promise<void> {
  const hoje = new Date()

  const [
    documentosValidos, documentosTotal,
    processosRegulares, processosTotal,
    condicionantesCumpridas, condicionantesAtivas,
    licencasVigentes, licencasTotal,
    asosVigentes, asosTotal,
    treinamentosVigentes, treinamentosTotal,
    docsSSTVigentes, docsSSTTotal,
    testesVigentes, testesTotal,
    bombasCalibradas, bombasTotal,
  ] = await Promise.all([
    // ── Documentos
    prisma.documento.count({ where: { empreendimentoId, tenantId, status: 'APROVADO' } }),
    prisma.documento.count({ where: { empreendimentoId, tenantId } }),
    // ── Processos
    prisma.processo.count({ where: { empreendimentoId, tenantId, status: { in: ['DEFERIDO'] as never[] } } }),
    prisma.processo.count({ where: { empreendimentoId, tenantId, status: { notIn: ['ARQUIVADO', 'CANCELADO'] as never[] } } }),
    // ── Condicionantes
    prisma.condicionante.count({ where: { empreendimentoId, tenantId, status: 'CUMPRIDA' } }),
    prisma.condicionante.count({ where: { empreendimentoId, tenantId, status: { not: 'DISPENSADA' as never } } }),
    // ── Licenças Ambientais
    prisma.licencaAmbiental.count({ where: { empreendimentoId, status: { in: ['VIGENTE', 'A_RENOVAR'] as never[] } } }),
    prisma.licencaAmbiental.count({ where: { empreendimentoId, status: { notIn: ['CANCELADA'] as never[] } } }),
    // ── SST: ASOs vigentes
    prisma.aSO.count({ where: { empreendimentoId, tenantId, dataVencimento: { gte: hoje } } }),
    prisma.aSO.count({ where: { empreendimentoId, tenantId, dataVencimento: { not: null } } }),
    // ── SST: Treinamentos vigentes
    prisma.treinamentoExecucao.count({ where: { empreendimentoId, tenantId, status: 'REALIZADO', dataVencimento: { gte: hoje } } }),
    prisma.treinamentoExecucao.count({ where: { empreendimentoId, tenantId, status: { in: ['REALIZADO', 'VENCIDO'] } } }),
    // ── SST: Documentos SST vigentes
    prisma.documentoSST.count({ where: { empreendimentoId, tenantId, status: 'VIGENTE' } }),
    prisma.documentoSST.count({ where: { empreendimentoId, tenantId, status: { in: ['VIGENTE', 'VENCIDO', 'A_RENOVAR'] } } }),
    // ── Integridade: Testes de estanqueidade em dia
    prisma.testeEstanqueidade.count({
      where: { tanque: { empreendimentoId, tenantId }, proximoTeste: { gte: hoje } },
    }),
    prisma.testeEstanqueidade.count({
      where: { tanque: { empreendimentoId, tenantId } },
    }),
    // ── Integridade: Bombas com calibração em dia
    prisma.bombaAbastecimento.count({ where: { empreendimentoId, tenantId, proximaCalibracao: { gte: hoje }, status: 'ATIVO' } }),
    prisma.bombaAbastecimento.count({ where: { empreendimentoId, tenantId, status: 'ATIVO' } }),
  ])

  // SST consolidado: ASOs + Treinamentos + Documentos SST
  const sstConformes = asosVigentes + treinamentosVigentes + docsSSTVigentes
  const sstTotal = asosTotal + treinamentosTotal + docsSSTTotal

  // Integridade técnica consolidada: Estanqueidade + Calibração
  const integridadeConformes = testesVigentes + bombasCalibradas
  const integridadeTotal = testesTotal + bombasTotal

  const indice = calcularIndiceConformidade({
    documentosValidos,
    documentosTotal,
    processosRegulares,
    processosTotal,
    condicionantesCumpridas,
    condicionantesAtivas,
    licencasVigentes,
    licencasTotal,
    sstConformes,
    sstTotal,
    integridadeConformes,
    integridadeTotal,
  })

  const status = determinarStatusCompliance(indice)

  await prisma.complianceSnapshot.create({
    data: {
      tenantId,
      empreendimentoId,
      indiceConformidade: indice,
      statusCompliance: status,
      documentosValidos,
      documentosTotal,
      processosRegulares,
      processosTotal,
      condicionantesCumpridas,
      condicionantesAtivas,
      detalhes: {
        licencasVigentes,
        licencasTotal,
        sstConformes,
        sstTotal,
        integridadeConformes,
        integridadeTotal,
        asosVigentes,
        asosTotal,
        treinamentosVigentes,
        treinamentosTotal,
        docsSSTVigentes,
        docsSSTTotal,
        testesVigentes,
        testesTotal,
        bombasCalibradas,
        bombasTotal,
      },
    },
  })

  console.log(`[compliance] ${empreendimentoId} → índice=${indice} status=${status}`)
}

export function criarComplianceWorker(concurrency = 3) {
  return new Worker<ComplianceJobData>(
    'compliance',
    async (job) => {
      const { tenantId, empreendimentoId } = job.data
      console.log(`[compliance] Calculando para empreendimento ${empreendimentoId}`)
      await calcularCompliance(tenantId, empreendimentoId)
    },
    { connection: redis, concurrency },
  )
}
