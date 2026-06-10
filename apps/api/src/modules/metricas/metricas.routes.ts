import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'

// ─────────────────────────────────────────────────────────────────────────────
// MÉTRICAS OPERACIONAIS
// Indicadores de desempenho da equipe, não de compliance dos postos.
// ─────────────────────────────────────────────────────────────────────────────

export const metricasRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  app.get('/operacional', {
    schema: { tags: ['metricas'], summary: 'Métricas operacionais da equipe' },
  }, async (request, reply) => {
    const tenantId = request.user.tenantId
    const agora = new Date()
    const inicio30d = new Date(agora); inicio30d.setDate(inicio30d.getDate() - 30)
    const inicio12m = new Date(agora); inicio12m.setMonth(inicio12m.getMonth() - 12)

    // ── Tempo médio de resolução (últimos 30 dias) ──────────────────────────
    const concluidas30d = await prisma.tarefa.findMany({
      where: { tenantId, status: 'CONCLUIDA' as never, dataConclusao: { gte: inicio30d } },
      select: { criadoEm: true, dataConclusao: true },
    })
    const tempos = concluidas30d
      .filter((t) => t.dataConclusao)
      .map((t) => (t.dataConclusao!.getTime() - t.criadoEm.getTime()) / 86_400_000)
    const tempoMedioResolucao = tempos.length > 0
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length * 10) / 10
      : 0

    // ── Taxa de resolução por semana (últimas 12 semanas) ───────────────────
    const semanas: { semana: string; criadas: number; concluidas: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const inicioSem = new Date(agora)
      inicioSem.setDate(inicioSem.getDate() - (i + 1) * 7)
      const fimSem = new Date(agora)
      fimSem.setDate(fimSem.getDate() - i * 7)

      const [criadas, concluidas] = await prisma.$transaction([
        prisma.tarefa.count({ where: { tenantId, criadoEm: { gte: inicioSem, lt: fimSem } } }),
        prisma.tarefa.count({ where: { tenantId, status: 'CONCLUIDA' as never, dataConclusao: { gte: inicioSem, lt: fimSem } } }),
      ])

      semanas.push({
        semana: `S${12 - i}`,
        criadas,
        concluidas,
      })
    }

    // ── Carga por analista ──────────────────────────────────────────────────
    const cargaRaw = await prisma.tarefa.groupBy({
      by: ['responsavelId'],
      where: { tenantId, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] }, responsavelId: { not: null } },
      _count: { id: true },
    })
    const responsavelIds = cargaRaw.map((c) => c.responsavelId!).filter(Boolean)
    const usuarios = responsavelIds.length > 0
      ? await prisma.usuario.findMany({ where: { id: { in: responsavelIds } }, select: { id: true, nome: true } })
      : []
    const userMap = new Map(usuarios.map((u) => [u.id, u.nome]))
    const cargaPorAnalista = cargaRaw.map((c) => ({
      usuarioId: c.responsavelId!,
      nome: userMap.get(c.responsavelId!) ?? 'Desconhecido',
      abertas: c._count.id,
    })).sort((a, b) => b.abertas - a.abertas)

    // ── Tarefas sem responsável ─────────────────────────────────────────────
    const semResponsavel = await prisma.tarefa.count({
      where: { tenantId, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] }, responsavelId: null },
    })

    // ── Escalamentos do mês ─────────────────────────────────────────────────
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const escalamentosMes = await prisma.tarefa.count({
      where: { tenantId, dataEscalonamento: { gte: inicioMes } },
    })

    // ── Tendência compliance (12 meses) ─────────────────────────────────────
    const snapshots = await prisma.complianceSnapshot.findMany({
      where: { tenantId, calculadoEm: { gte: inicio12m } },
      select: { indiceConformidade: true, calculadoEm: true },
      orderBy: { calculadoEm: 'asc' },
    })

    // Agrupar por mês
    const tendenciaPorMes = new Map<string, number[]>()
    for (const s of snapshots) {
      const key = `${s.calculadoEm.getFullYear()}-${String(s.calculadoEm.getMonth() + 1).padStart(2, '0')}`
      if (!tendenciaPorMes.has(key)) tendenciaPorMes.set(key, [])
      tendenciaPorMes.get(key)!.push(Number(s.indiceConformidade))
    }
    const tendenciaCompliance = [...tendenciaPorMes.entries()].map(([mes, valores]) => ({
      mes,
      indice: Math.round(valores.reduce((a, b) => a + b, 0) / valores.length * 10) / 10,
    }))

    // ── Pendências por módulo ───────────────────────────────────────────────
    const porModulo = await prisma.tarefa.groupBy({
      by: ['origem'],
      where: { tenantId, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] } },
      _count: { id: true },
    })
    const pendenciasPorModulo = porModulo.map((p) => ({
      origem: p.origem,
      count: p._count.id,
    })).sort((a, b) => b.count - a.count)

    return reply.send({
      data: {
        tempoMedioResolucao,
        taxaResolucao: semanas,
        cargaPorAnalista,
        semResponsavel,
        escalamentosMes,
        tendenciaCompliance,
        pendenciasPorModulo,
      },
    })
  })
}
