import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { determinarStatusCompliance } from '@repo/utils'

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE ROUTES
// ─────────────────────────────────────────────────────────────────────────────

export const complianceRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  /**
   * GET /api/v1/compliance/rede
   * Visão consolidada de conformidade da rede
   */
  app.get(
    '/rede',
    { schema: { tags: ['compliance'], summary: 'Retorna o índice de conformidade consolidado da rede' } },
    async (request, reply) => {
      const snapshots = await prisma.complianceSnapshot.findMany({
        where: {
          empreendimento: { tenantId: request.user.tenantId, ativo: true },
        },
        orderBy: [{ empreendimentoId: 'asc' }, { calculadoEm: 'desc' }],
        distinct: ['empreendimentoId'],
        include: { empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } } },
      })

      const indices = snapshots.map((s) => Number(s.indiceConformidade))
      // Sem empreendimentos com snapshot, a rede não está em EMERGÊNCIA — está
      // SEM_DADOS. Antes média=0 virava status alarmista em tenant novo/vazio.
      const semDados = indices.length === 0
      const media = semDados ? 0 : indices.reduce((a, b) => a + b, 0) / indices.length
      const statusRede = semDados ? 'SEM_DADOS' : determinarStatusCompliance(media)

      return reply.status(200).send({
        data: {
          indiceConformidadeRede: semDados ? null : Math.round(media * 10) / 10,
          statusRede,
          totalEmpreendimentos: snapshots.length,
          empreendimentos: snapshots.map((s) => ({
            id: s.empreendimento.id,
            nome: s.empreendimento.nome,
            cidade: s.empreendimento.cidade,
            estado: s.empreendimento.estado,
            indiceConformidade: s.indiceConformidade,
            statusCompliance: s.statusCompliance,
            calculadoEm: s.calculadoEm,
          })),
        },
      })
    },
  )

  /**
   * GET /api/v1/compliance/empreendimentos/:id
   * Detalhe de conformidade de um empreendimento
   */
  app.get(
    '/empreendimentos/:id',
    { schema: { params: z.object({ id: z.string().uuid() }), tags: ['compliance'], summary: 'Retorna histórico de compliance de um empreendimento' } },
    async (request, reply) => {
      const snapshots = await prisma.complianceSnapshot.findMany({
        where: {
          empreendimentoId: request.params.id,
          empreendimento: { tenantId: request.user.tenantId },
        },
        orderBy: { calculadoEm: 'desc' },
        take: 12, // últimos 12 cálculos
      })

      return reply.status(200).send({ data: snapshots })
    },
  )
}
