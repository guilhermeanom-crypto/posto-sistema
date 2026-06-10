import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { schedulerQueue } from '../../infra/queue/bullmq.js'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'

// ─────────────────────────────────────────────────────────────────────────────
// RISCO ROUTES — scores de risco de fiscalização por empreendimento/órgão
// ─────────────────────────────────────────────────────────────────────────────

export const riscoRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const tid = (req: FastifyRequest) => req.user.tenantId

  // GET / — todos os scores do tenant (visão da rede)
  app.get('/', { schema: { tags: ['risco'] } }, async (req, reply) => {
    const scores = await prisma.scoreRisco.findMany({
      where: { tenantId: tid(req) },
      orderBy: [{ score: 'desc' }, { empreendimentoId: 'asc' }],
      include: { empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } } },
    })

    // Agrupa por empreendimento
    const mapa = new Map<string, typeof scores>()
    for (const s of scores) {
      const arr = mapa.get(s.empreendimentoId) ?? []
      arr.push(s)
      mapa.set(s.empreendimentoId, arr)
    }

    const resultado = Array.from(mapa.entries()).map(([, list]) => {
      const scoreGeral = Math.round(list.reduce((sum, s) => sum + s.score, 0) / list.length)
      const nivelGeral = scoreGeral >= 75 ? 'CRITICO' : scoreGeral >= 50 ? 'ALTO' : scoreGeral >= 25 ? 'MEDIO' : 'BAIXO'
      const primeiro = list[0]!
      return {
        empreendimento: primeiro.empreendimento,
        scoreGeral,
        nivelGeral,
        calculadoEm: primeiro.calculadoEm,
        orgaos: list.map((s) => ({
          orgao: s.orgao,
          score: s.score,
          nivel: s.nivel,
          recomendacoes: s.recomendacoes,
          fatores: s.fatores,
        })),
      }
    }).sort((a, b) => b.scoreGeral - a.scoreGeral)

    return reply.send({ data: resultado })
  })

  // GET /:empreendimentoId — scores de um empreendimento
  app.get('/:empreendimentoId', {
    schema: { params: z.object({ empreendimentoId: z.string().uuid() }), tags: ['risco'] },
  }, async (req, reply) => {
    const scores = await prisma.scoreRisco.findMany({
      where: { tenantId: tid(req), empreendimentoId: req.params.empreendimentoId },
      orderBy: { score: 'desc' },
    })
    return reply.send({ data: scores })
  })

  // POST /calcular — dispara recálculo imediato
  app.post('/calcular', { schema: { tags: ['risco'] } }, async (_req, reply) => {
    await schedulerQueue.add('calcular-scores-risco', {}, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 15000 },
    })
    return reply.status(202).send({ message: 'Cálculo de scores de risco enfileirado.' })
  })
}
