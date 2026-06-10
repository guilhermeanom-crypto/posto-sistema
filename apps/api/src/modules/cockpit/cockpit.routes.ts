import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'

// ─────────────────────────────────────────────────────────────────────────────
// COCKPIT ROUTES — Dashboard executivo consolidado
// ─────────────────────────────────────────────────────────────────────────────

interface VencimentoItem {
  id: string
  modulo: string
  descricao: string
  empreendimento: string
  empreendimentoId: string
  dataVencimento: Date
  diasRestantes: number
  registroHref: string
}

const moduloHref: Record<string, (id: string, empId: string) => string> = {
  'Licença Ambiental': (id) => `/licencas-ambientais/${id}`,
  'Reg. Urbano':       (id) => `/regulatorio-urbano/${id}`,
  'SST':               (_id, empId) => `/sst?empreendimentoId=${empId}`,
  'ANP/INMETRO':       (_id, empId) => `/anp-inmetro?empreendimentoId=${empId}`,
  'Estanqueidade':     (_id, empId) => `/estanqueidade?empreendimentoId=${empId}`,
  'Outorga Hídrica':   (_id, empId) => `/outorga-hidrica?empreendimentoId=${empId}`,
  'Fiscalização':      (id) => `/fiscalizacoes/${id}`,
}

function dias(dataVencimento: Date): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(dataVencimento)
  alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000)
}

function urgencia(d: number): 'CRITICO' | 'ALTO' | 'MEDIO' | 'OK' {
  if (d <= 0) return 'CRITICO'
  if (d <= 7) return 'CRITICO'
  if (d <= 30) return 'ALTO'
  if (d <= 60) return 'MEDIO'
  return 'OK'
}

export const cockpitRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const tid = (req: FastifyRequest) => req.user.tenantId

  // ── GET /resumo ────────────────────────────────────────────────────────────
  app.get('/resumo', { schema: { tags: ['cockpit'] } }, async (req, reply) => {
    const tenantId = tid(req)
    const hoje = new Date()
    const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30)
    const em90 = new Date(hoje); em90.setDate(em90.getDate() + 90)

    const [
      alertasCriticos,
      snapshots,
      autosAtivos,
      empRiscoCritico,
      licencasVencendo,
      alvarasVencendo,
      docsSSTVencendo,
      bombasVencendo,
      outorgasVencendo,
    ] = await Promise.all([
      // Alertas críticos e altos não lidos (últimos 90 dias)
      prisma.alerta.count({
        where: {
          tenantId,
          nivel: { in: ['CRITICO', 'ALTO'] },
          criadoEm: { gte: new Date(hoje.getTime() - 90 * 86400000) },
        },
      }),

      // Snapshots de compliance (mais recente por empreendimento)
      prisma.complianceSnapshot.findMany({
        where: { empreendimento: { tenantId, ativo: true } },
        orderBy: [{ empreendimentoId: 'asc' }, { calculadoEm: 'desc' }],
        distinct: ['empreendimentoId'],
        select: {
          indiceConformidade: true,
          statusCompliance: true,
          empreendimento: { select: { id: true, nome: true } },
        },
      }),

      // Autos de infração ativos
      prisma.autoInfracao.count({
        where: {
          tenantId,
          status: { notIn: ['ENCERRADO', 'PAGO'] },
        },
      }),

      // Empreendimentos com risco CRITICO ou ALTO (score geral)
      prisma.scoreRisco.groupBy({
        by: ['empreendimentoId'],
        where: { tenantId, nivel: { in: ['CRITICO', 'ALTO'] } },
        _count: { orgao: true },
      }),

      // Licenças ambientais vencendo em 30 dias
      prisma.licencaAmbiental.count({
        where: { tenantId, dataVencimento: { gte: hoje, lte: em30 } },
      }),

      // Alvarás vencendo em 30 dias
      prisma.alvaraUrbanistico.count({
        where: { tenantId, dataVencimento: { gte: hoje, lte: em30 } },
      }),

      // Docs SST vencendo em 30 dias
      prisma.documentoSST.count({
        where: { tenantId, dataVencimento: { gte: hoje, lte: em30 } },
      }),

      // Bombas com calibração vencendo em 30 dias
      prisma.bombaAbastecimento.count({
        where: { tenantId, proximaCalibracao: { gte: hoje, lte: em30 }, status: 'ATIVO' },
      }),

      // Outorgas hídricas vencendo em 30 dias
      prisma.pocoArtesiano.count({
        where: { tenantId, validadeOutorga: { gte: hoje, lte: em30 } },
      }),
    ])

    const totalVencimentos30d = licencasVencendo + alvarasVencendo + docsSSTVencendo + bombasVencendo + outorgasVencendo

    const indices = snapshots.map((s) => Number(s.indiceConformidade))
    const mediaConformidade = indices.length > 0 ? indices.reduce((a, b) => a + b, 0) / indices.length : null

    return reply.send({
      data: {
        mediaConformidadeRede: mediaConformidade !== null ? Math.round(mediaConformidade * 10) / 10 : null,
        totalEmpreendimentos: snapshots.length,
        empreendimentosCriticos: snapshots.filter((s) => s.statusCompliance === 'CRITICO').length,
        alertasCriticos,
        autosAtivos,
        empreendimentosRiscoCritico: empRiscoCritico.length,
        vencimentos30d: totalVencimentos30d,
        ranking: snapshots
          .sort((a, b) => Number(a.indiceConformidade) - Number(b.indiceConformidade))
          .map((s) => ({
            id: s.empreendimento.id,
            nome: s.empreendimento.nome,
            indiceConformidade: Number(s.indiceConformidade),
            statusCompliance: s.statusCompliance,
          })),
      },
    })
  })

  // ── GET /vencimentos ───────────────────────────────────────────────────────
  app.get('/vencimentos', {
    schema: {
      querystring: z.object({ dias: z.coerce.number().int().min(7).max(365).default(90) }),
      tags: ['cockpit'],
    },
  }, async (req, reply) => {
    const tenantId = tid(req)
    const hoje = new Date()
    const diasHorizonte = (req.query as { dias: number }).dias
    const em90 = new Date(hoje); em90.setDate(em90.getDate() + diasHorizonte)

    const [licencas, alvaras, docSST, bombas, testes, outorgas, autos] = await Promise.all([
      prisma.licencaAmbiental.findMany({
        where: { tenantId, dataVencimento: { lte: em90 } },
        select: { id: true, tipo: true, orgaoEmissor: true, dataVencimento: true, empreendimento: { select: { id: true, nome: true } } },
        orderBy: { dataVencimento: 'asc' },
        take: 50,
      }),

      prisma.alvaraUrbanistico.findMany({
        where: { tenantId, dataVencimento: { not: null, lte: em90 } },
        select: { id: true, tipo: true, orgaoEmissor: true, dataVencimento: true, empreendimento: { select: { id: true, nome: true } } },
        orderBy: { dataVencimento: 'asc' },
        take: 50,
      }),

      prisma.documentoSST.findMany({
        where: { tenantId, dataVencimento: { not: null, lte: em90 } },
        select: { id: true, tipo: true, dataVencimento: true, empreendimento: { select: { id: true, nome: true } } },
        orderBy: { dataVencimento: 'asc' },
        take: 50,
      }),

      prisma.bombaAbastecimento.findMany({
        where: { tenantId, status: 'ATIVO', proximaCalibracao: { not: null, lte: em90 } },
        select: { id: true, numero: true, proximaCalibracao: true, empreendimento: { select: { id: true, nome: true } } },
        orderBy: { proximaCalibracao: 'asc' },
        take: 50,
      }),

      prisma.testeEstanqueidade.findMany({
        where: { tanque: { tenantId }, proximoTeste: { lte: em90 } },
        select: { id: true, proximoTeste: true, tanque: { select: { numero: true, empreendimentoId: true, empreendimento: { select: { id: true, nome: true } } } } },
        orderBy: { proximoTeste: 'asc' },
        take: 50,
      }),

      prisma.pocoArtesiano.findMany({
        where: { tenantId, status: 'ATIVO', validadeOutorga: { not: null, lte: em90 } },
        select: { id: true, codigo: true, validadeOutorga: true, empreendimento: { select: { id: true, nome: true } } },
        orderBy: { validadeOutorga: 'asc' },
        take: 50,
      }),

      prisma.autoInfracao.findMany({
        where: {
          tenantId,
          status: { in: ['RECEBIDO', 'EM_DEFESA'] },
          prazoDefesa: { lte: em90 },
        },
        select: { id: true, numeroAuto: true, orgao: true, prazoDefesa: true, empreendimento: { select: { id: true, nome: true } } },
        orderBy: { prazoDefesa: 'asc' },
        take: 50,
      }),
    ])

    const itens: VencimentoItem[] = []

    function push(item: Omit<VencimentoItem, 'registroHref'>) {
      const fn = moduloHref[item.modulo]
      itens.push({ ...item, registroHref: fn ? fn(item.id, item.empreendimentoId) : `/empreendimentos/${item.empreendimentoId}` })
    }

    for (const l of licencas) {
      push({ id: l.id, modulo: 'Licença Ambiental', descricao: `${l.tipo} — ${l.orgaoEmissor}`, empreendimento: l.empreendimento.nome, empreendimentoId: l.empreendimento.id, dataVencimento: l.dataVencimento, diasRestantes: dias(l.dataVencimento) })
    }
    for (const a of alvaras) {
      if (!a.dataVencimento) continue
      push({ id: a.id, modulo: 'Reg. Urbano', descricao: `${a.tipo} — ${a.orgaoEmissor}`, empreendimento: a.empreendimento.nome, empreendimentoId: a.empreendimento.id, dataVencimento: a.dataVencimento, diasRestantes: dias(a.dataVencimento) })
    }
    for (const d of docSST) {
      if (!d.dataVencimento) continue
      push({ id: d.id, modulo: 'SST', descricao: d.tipo, empreendimento: d.empreendimento.nome, empreendimentoId: d.empreendimento.id, dataVencimento: d.dataVencimento, diasRestantes: dias(d.dataVencimento) })
    }
    for (const b of bombas) {
      if (!b.proximaCalibracao) continue
      push({ id: b.id, modulo: 'ANP/INMETRO', descricao: `Bomba #${b.numero} — calibração`, empreendimento: b.empreendimento.nome, empreendimentoId: b.empreendimento.id, dataVencimento: b.proximaCalibracao, diasRestantes: dias(b.proximaCalibracao) })
    }
    for (const t of testes) {
      push({ id: t.id, modulo: 'Estanqueidade', descricao: `Tanque #${t.tanque.numero} — teste`, empreendimento: t.tanque.empreendimento.nome, empreendimentoId: t.tanque.empreendimento.id, dataVencimento: t.proximoTeste, diasRestantes: dias(t.proximoTeste) })
    }
    for (const o of outorgas) {
      if (!o.validadeOutorga) continue
      push({ id: o.id, modulo: 'Outorga Hídrica', descricao: `Poço ${o.codigo} — outorga DAEE`, empreendimento: o.empreendimento.nome, empreendimentoId: o.empreendimento.id, dataVencimento: o.validadeOutorga, diasRestantes: dias(o.validadeOutorga) })
    }
    for (const au of autos) {
      push({ id: au.id, modulo: 'Fiscalização', descricao: `Auto ${au.numeroAuto} — ${au.orgao}`, empreendimento: au.empreendimento.nome, empreendimentoId: au.empreendimento.id, dataVencimento: au.prazoDefesa, diasRestantes: dias(au.prazoDefesa) })
    }

    itens.sort((a, b) => a.diasRestantes - b.diasRestantes)

    return reply.send({
      data: itens.map((i) => ({
        ...i,
        dataVencimento: i.dataVencimento.toISOString().slice(0, 10),
        urgencia: urgencia(i.diasRestantes),
      })),
    })
  })

  // ── GET /diagnostico/:empreendimentoId ────────────────────────────────────
  app.get(
    '/diagnostico/:empreendimentoId',
    { schema: { tags: ['cockpit'], summary: 'Score de conformidade por eixo do empreendimento' } },
    async (req: FastifyRequest<{ Params: { empreendimentoId: string } }>, reply) => {
      const tenantId = tid(req)
      const { empreendimentoId } = req.params
      const hoje = new Date()

      const [
        licencas,
        condicionantes,
        asos,
        docsSST,
        bombas,
        tanques,
        alvaras,
        pocos,
        documentos,
        autos,
      ] = await Promise.all([
        // Ambiental — licenças
        prisma.licencaAmbiental.findMany({
          where: { tenantId, empreendimentoId },
          select: { status: true, dataVencimento: true },
        }),
        // Ambiental — condicionantes
        prisma.condicionante.findMany({
          where: { tenantId, empreendimentoId },
          select: { status: true },
        }),
        // SST — ASOs
        prisma.aSO.findMany({
          where: { tenantId, empreendimentoId },
          select: { aptidao: true, dataVencimento: true },
        }),
        // SST — documentos
        prisma.documentoSST.findMany({
          where: { tenantId, empreendimentoId },
          select: { status: true, dataVencimento: true },
        }),
        // ANP — bombas
        prisma.bombaAbastecimento.findMany({
          where: { tenantId, empreendimentoId, status: 'ATIVO' },
          select: { proximaCalibracao: true },
        }),
        // Estanqueidade — tanques ativos com último teste
        prisma.tanque.findMany({
          where: { tenantId, empreendimentoId, status: 'ATIVO' },
          select: { testes: { orderBy: { dataExecucao: 'desc' }, take: 1, select: { proximoTeste: true } } },
        }),
        // Urbano — alvarás
        prisma.alvaraUrbanistico.findMany({
          where: { tenantId, empreendimentoId },
          select: { status: true, dataVencimento: true },
        }),
        // Outorga — poços
        prisma.pocoArtesiano.findMany({
          where: { tenantId, empreendimentoId, status: 'ATIVO' },
          select: { validadeOutorga: true },
        }),
        // Documentos gerais
        prisma.documento.findMany({
          where: { tenantId, empreendimentoId },
          select: { status: true },
        }),
        // Fiscalização — autos em aberto
        prisma.autoInfracao.findMany({
          where: { tenantId, empreendimentoId },
          select: { status: true },
        }),
      ])

      function pct(ok: number, total: number) {
        if (total === 0) return null
        return Math.round((ok / total) * 100)
      }

      // Ambiental: licenças vigentes + condicionantes cumpridas
      const licencasVigentes = licencas.filter((l) =>
        ['VIGENTE', 'APROVADO'].includes(l.status) &&
        (!l.dataVencimento || l.dataVencimento > hoje)
      ).length
      const condsOk = condicionantes.filter((c) => ['CUMPRIDA', 'DISPENSADA'].includes(c.status)).length
      const totalAmbiental = licencas.length + condicionantes.length
      const okAmbiental = licencasVigentes + condsOk
      const scoreAmbiental = pct(okAmbiental, totalAmbiental)

      // SST: ASOs aptos e vigentes + docs SST válidos
      const asosOk = asos.filter((a) =>
        a.aptidao === 'APTO' && (!a.dataVencimento || a.dataVencimento > hoje)
      ).length
      const docsSSTOk = docsSST.filter((d) =>
        ['APROVADO', 'VIGENTE'].includes(d.status) && (!d.dataVencimento || d.dataVencimento > hoje)
      ).length
      const scoreSST = pct(asosOk + docsSSTOk, asos.length + docsSST.length)

      // ANP/INMETRO: bombas com calibração vigente
      const bombasOk = bombas.filter((b) => b.proximaCalibracao && b.proximaCalibracao > hoje).length
      const scoreANP = pct(bombasOk, bombas.length)

      // Estanqueidade: tanques com próximo teste no futuro
      const tanquesOk = tanques.filter((t) => {
        const prox = t.testes[0]?.proximoTeste
        return prox && prox > hoje
      }).length
      const scoreEstanqueidade = pct(tanquesOk, tanques.length)

      // Urbano: alvarás vigentes
      const alvarasOk = alvaras.filter((a) =>
        ['VIGENTE', 'APROVADO', 'DEFERIDO'].includes(a.status) &&
        (!a.dataVencimento || a.dataVencimento > hoje)
      ).length
      const scoreUrbano = pct(alvarasOk, alvaras.length)

      // Outorga: poços com outorga vigente
      const pocosOk = pocos.filter((p) => p.validadeOutorga && p.validadeOutorga > hoje).length
      const scoreOutorga = pct(pocosOk, pocos.length)

      // Documentos gerais
      const docsOk = documentos.filter((d) => ['APROVADO', 'VIGENTE'].includes(d.status)).length
      const scoreDocumentos = pct(docsOk, documentos.length)

      // Fiscalização: sem autos em aberto = 100%
      const autosAbertos = autos.filter((a) => !['ENCERRADO', 'PAGO', 'JULGADO_FAVORAVEL'].includes(a.status)).length
      const scoreFiscalizacao = autos.length === 0 ? null : Math.round(((autos.length - autosAbertos) / autos.length) * 100)

      const eixos = [
        { id: 'documentos',    nome: 'Documentos',    score: scoreDocumentos,   total: documentos.length,                   ok: docsOk,                     abaHub: 'documentos' },
        { id: 'ambiental',     nome: 'Ambiental',     score: scoreAmbiental,    total: totalAmbiental,                      ok: okAmbiental,                abaHub: 'licencas' },
        { id: 'sst',           nome: 'SST',           score: scoreSST,          total: asos.length + docsSST.length,        ok: asosOk + docsSSTOk,         abaHub: 'sst' },
        { id: 'anp',           nome: 'ANP/INMETRO',   score: scoreANP,          total: bombas.length,                       ok: bombasOk,                   abaHub: 'anp' },
        { id: 'estanqueidade', nome: 'Estanqueidade', score: scoreEstanqueidade,total: tanques.length,                       ok: tanquesOk,                  abaHub: 'estanqueidade' },
        { id: 'urbano',        nome: 'Urbano',        score: scoreUrbano,       total: alvaras.length,                      ok: alvarasOk,                  abaHub: 'licencas' },
        { id: 'outorga',       nome: 'Outorga',       score: scoreOutorga,      total: pocos.length,                        ok: pocosOk,                    abaHub: 'outorga' },
        { id: 'fiscalizacao',  nome: 'Fiscalização',  score: scoreFiscalizacao, total: autos.length,                        ok: autos.length - autosAbertos,abaHub: 'fiscalizacoes' },
      ]

      return reply.send({ data: { empreendimentoId, eixos } })
    },
  )

  // ── GET /executivo ────────────────────────────────────────────────────────
  app.get('/executivo', { schema: { tags: ['cockpit'], summary: 'Painel executivo consolidado' } }, async (req, reply) => {
    const tenantId = tid(req)
    const hoje = new Date()
    const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30)
    const em90 = new Date(hoje); em90.setDate(em90.getDate() + 90)

    function pct(ok: number, total: number) { return total === 0 ? null : Math.round((ok / total) * 100) }

    const [
      licencas, alvaras, docsSST, asos, bombas, tanques,
      outorgas, condicionantes, documentos, autos,
      snapshots, riscos,
    ] = await Promise.all([
      prisma.licencaAmbiental.findMany({ where: { tenantId }, select: { status: true, dataVencimento: true } }),
      prisma.alvaraUrbanistico.findMany({ where: { tenantId }, select: { status: true, dataVencimento: true } }),
      prisma.documentoSST.findMany({ where: { tenantId }, select: { status: true, dataVencimento: true } }),
      prisma.aSO.findMany({ where: { tenantId }, select: { aptidao: true, dataVencimento: true } }),
      prisma.bombaAbastecimento.findMany({ where: { tenantId, status: 'ATIVO' }, select: { proximaCalibracao: true } }),
      prisma.tanque.findMany({ where: { tenantId, status: 'ATIVO' }, select: { testes: { orderBy: { dataExecucao: 'desc' }, take: 1, select: { proximoTeste: true } } } }),
      prisma.pocoArtesiano.findMany({ where: { tenantId, status: 'ATIVO' }, select: { validadeOutorga: true } }),
      prisma.condicionante.findMany({ where: { tenantId }, select: { status: true } }),
      prisma.documento.findMany({ where: { tenantId }, select: { status: true } }),
      prisma.autoInfracao.findMany({ where: { tenantId }, select: { status: true } }),
      prisma.complianceSnapshot.findMany({
        where: { empreendimento: { tenantId, ativo: true } },
        orderBy: [{ empreendimentoId: 'asc' }, { calculadoEm: 'desc' }],
        distinct: ['empreendimentoId'],
        select: {
          indiceConformidade: true,
          statusCompliance: true,
          empreendimento: { select: { id: true, nome: true, nomeFantasia: true } },
        },
      }),
      prisma.scoreRisco.findMany({
        where: { tenantId, nivel: { in: ['CRITICO', 'ALTO'] } },
        orderBy: { score: 'desc' },
        take: 15,
        select: {
          score: true, nivel: true, orgao: true, recomendacoes: true,
          empreendimento: { select: { id: true, nome: true, nomeFantasia: true } },
        },
      }),
    ])

    const licVig = licencas.filter((l) => ['VIGENTE', 'APROVADO'].includes(l.status) && (!l.dataVencimento || l.dataVencimento > hoje))
    const licVenc30 = licencas.filter((l) => l.dataVencimento && l.dataVencimento >= hoje && l.dataVencimento <= em30)

    const alvarasOkArr = alvaras.filter((a) => ['VIGENTE', 'APROVADO', 'DEFERIDO'].includes(a.status) && (!a.dataVencimento || a.dataVencimento > hoje))
    const alvarasVenc30 = alvaras.filter((a) => a.dataVencimento && a.dataVencimento >= hoje && a.dataVencimento <= em30)

    const condsOk = condicionantes.filter((c) => ['CUMPRIDA', 'DISPENSADA'].includes(c.status))
    const docsOk = documentos.filter((d) => ['APROVADO', 'VIGENTE'].includes(d.status))
    const asosOk = asos.filter((a) => a.aptidao === 'APTO' && (!a.dataVencimento || a.dataVencimento > hoje))
    const docsSSTOk = docsSST.filter((d) => ['APROVADO', 'VIGENTE'].includes(d.status) && (!d.dataVencimento || d.dataVencimento > hoje))
    const docsSSTVenc30 = docsSST.filter((d) => d.dataVencimento && d.dataVencimento >= hoje && d.dataVencimento <= em30)
    const bombasOk = bombas.filter((b) => b.proximaCalibracao && b.proximaCalibracao > hoje)
    const bombasVenc30 = bombas.filter((b) => b.proximaCalibracao && b.proximaCalibracao >= hoje && b.proximaCalibracao <= em30)
    const tanquesOk = tanques.filter((t) => { const p = t.testes[0]?.proximoTeste; return p && p > hoje })
    const pocosOk = outorgas.filter((p) => p.validadeOutorga && p.validadeOutorga > hoje)
    const pocosVenc30 = outorgas.filter((p) => p.validadeOutorga && p.validadeOutorga >= hoje && p.validadeOutorga <= em30)
    const autosAbertos = autos.filter((a) => !['ENCERRADO', 'PAGO', 'JULGADO_FAVORAVEL'].includes(a.status))

    const porModulo = [
      {
        id: 'documentos', nome: 'Documentos',
        total: documentos.length, conformes: docsOk.length,
        vencendo30d: 0,
        score: pct(docsOk.length, documentos.length),
      },
      {
        id: 'ambiental', nome: 'Ambiental (Licenças)',
        total: licencas.length + condicionantes.length,
        conformes: licVig.length + condsOk.length,
        vencendo30d: licVenc30.length,
        score: pct(licVig.length + condsOk.length, licencas.length + condicionantes.length),
      },
      {
        id: 'urbano', nome: 'Regulatório Urbano',
        total: alvaras.length, conformes: alvarasOkArr.length,
        vencendo30d: alvarasVenc30.length,
        score: pct(alvarasOkArr.length, alvaras.length),
      },
      {
        id: 'sst', nome: 'SST',
        total: asos.length + docsSST.length,
        conformes: asosOk.length + docsSSTOk.length,
        vencendo30d: docsSSTVenc30.length,
        score: pct(asosOk.length + docsSSTOk.length, asos.length + docsSST.length),
      },
      {
        id: 'anp', nome: 'ANP / INMETRO',
        total: bombas.length, conformes: bombasOk.length,
        vencendo30d: bombasVenc30.length,
        score: pct(bombasOk.length, bombas.length),
      },
      {
        id: 'estanqueidade', nome: 'Estanqueidade',
        total: tanques.length, conformes: tanquesOk.length,
        vencendo30d: 0,
        score: pct(tanquesOk.length, tanques.length),
      },
      {
        id: 'outorga', nome: 'Outorga Hídrica',
        total: outorgas.length, conformes: pocosOk.length,
        vencendo30d: pocosVenc30.length,
        score: pct(pocosOk.length, outorgas.length),
      },
      {
        id: 'fiscalizacao', nome: 'Fiscalização',
        total: autos.length, conformes: autos.length - autosAbertos.length,
        vencendo30d: 0,
        score: autos.length === 0 ? null : Math.round(((autos.length - autosAbertos.length) / autos.length) * 100),
      },
    ]

    const empreendimentosCriticos = snapshots
      .filter((s) => ['CRITICO', 'ATENCAO'].includes(s.statusCompliance))
      .sort((a, b) => Number(a.indiceConformidade) - Number(b.indiceConformidade))
      .slice(0, 12)
      .map((s) => ({
        id: s.empreendimento.id,
        nome: s.empreendimento.nomeFantasia ?? s.empreendimento.nome,
        indiceConformidade: Number(s.indiceConformidade),
        statusCompliance: s.statusCompliance,
      }))

    const topRiscos = riscos.map((r) => ({
      empreendimentoId: r.empreendimento.id,
      nome: r.empreendimento.nomeFantasia ?? r.empreendimento.nome,
      orgao: r.orgao,
      score: r.score,
      nivel: r.nivel,
      recomendacoes: r.recomendacoes.slice(0, 2),
    }))

    return reply.send({ data: { porModulo, empreendimentosCriticos, topRiscos } })
  })

  // ── GET /diagnostico/rede ─────────────────────────────────────────────────
  app.get(
    '/diagnostico/rede',
    { schema: { tags: ['cockpit'], summary: 'Score médio por eixo de toda a rede' } },
    async (req, reply) => {
      const tenantId = tid(req)
      const hoje = new Date()

      // Busca todos os empreendimentos ativos
      const emps = await prisma.empreendimento.findMany({
        where: { tenantId, ativo: true },
        select: { id: true },
      })
      const ids = emps.map((e) => e.id)
      if (ids.length === 0) return reply.send({ data: { eixos: [] } })

      const [licencas, condicionantes, asos, docsSST, bombas, tanques, alvaras, pocos, documentos, autos] = await Promise.all([
        prisma.licencaAmbiental.findMany({ where: { tenantId }, select: { status: true, dataVencimento: true } }),
        prisma.condicionante.findMany({ where: { tenantId }, select: { status: true } }),
        prisma.aSO.findMany({ where: { tenantId }, select: { aptidao: true, dataVencimento: true } }),
        prisma.documentoSST.findMany({ where: { tenantId }, select: { status: true, dataVencimento: true } }),
        prisma.bombaAbastecimento.findMany({ where: { tenantId, status: 'ATIVO' }, select: { proximaCalibracao: true } }),
        prisma.tanque.findMany({ where: { tenantId, status: 'ATIVO' }, select: { testes: { orderBy: { dataExecucao: 'desc' }, take: 1, select: { proximoTeste: true } } } }),
        prisma.alvaraUrbanistico.findMany({ where: { tenantId }, select: { status: true, dataVencimento: true } }),
        prisma.pocoArtesiano.findMany({ where: { tenantId, status: 'ATIVO' }, select: { validadeOutorga: true } }),
        prisma.documento.findMany({ where: { tenantId }, select: { status: true } }),
        prisma.autoInfracao.findMany({ where: { tenantId }, select: { status: true } }),
      ])

      function pct(ok: number, total: number) { return total === 0 ? null : Math.round((ok / total) * 100) }

      const licVig = licencas.filter((l) => ['VIGENTE', 'APROVADO'].includes(l.status) && (!l.dataVencimento || l.dataVencimento > hoje)).length
      const condsOk = condicionantes.filter((c) => ['CUMPRIDA', 'DISPENSADA'].includes(c.status)).length
      const asosOk = asos.filter((a) => a.aptidao === 'APTO' && (!a.dataVencimento || a.dataVencimento > hoje)).length
      const docsSSTOk = docsSST.filter((d) => ['APROVADO', 'VIGENTE'].includes(d.status) && (!d.dataVencimento || d.dataVencimento > hoje)).length
      const bombasOk = bombas.filter((b) => b.proximaCalibracao && b.proximaCalibracao > hoje).length
      const tanquesOk = tanques.filter((t) => { const p = t.testes[0]?.proximoTeste; return p && p > hoje }).length
      const alvarasOk = alvaras.filter((a) => ['VIGENTE', 'APROVADO', 'DEFERIDO'].includes(a.status) && (!a.dataVencimento || a.dataVencimento > hoje)).length
      const pocosOk = pocos.filter((p) => p.validadeOutorga && p.validadeOutorga > hoje).length
      const docsOk = documentos.filter((d) => ['APROVADO', 'VIGENTE'].includes(d.status)).length
      const autosAbertos = autos.filter((a) => !['ENCERRADO', 'PAGO', 'JULGADO_FAVORAVEL'].includes(a.status)).length

      const eixos = [
        { id: 'documentos',    nome: 'Documentos',    score: pct(docsOk, documentos.length) },
        { id: 'ambiental',     nome: 'Ambiental',     score: pct(licVig + condsOk, licencas.length + condicionantes.length) },
        { id: 'sst',           nome: 'SST',           score: pct(asosOk + docsSSTOk, asos.length + docsSST.length) },
        { id: 'anp',           nome: 'ANP/INMETRO',   score: pct(bombasOk, bombas.length) },
        { id: 'estanqueidade', nome: 'Estanqueidade', score: pct(tanquesOk, tanques.length) },
        { id: 'urbano',        nome: 'Urbano',        score: pct(alvarasOk, alvaras.length) },
        { id: 'outorga',       nome: 'Outorga',       score: pct(pocosOk, pocos.length) },
        { id: 'fiscalizacao',  nome: 'Fiscalização',  score: autos.length === 0 ? null : Math.round(((autos.length - autosAbertos) / autos.length) * 100) },
      ]

      return reply.send({ data: { eixos } })
    },
  )
}
