import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// CRM ROUTES — gestão do funil de leads WhatsApp
// ─────────────────────────────────────────────────────────────────────────────

const ESTAGIOS_ORDER = ['NOVO', 'CONTATADO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO', 'GANHO', 'PERDIDO'] as const

export const crmRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  /**
   * GET /api/v1/crm/leads
   * Lista todos os leads agrupados por estágio (para o kanban)
   */
  app.get(
    '/leads',
    { schema: { tags: ['crm'], summary: 'Lista leads agrupados por estágio (kanban)' } },
    async (request, reply) => {
      const tenantId = request.user.tenantId
      const leads = await prisma.leadWhatsApp.findMany({
        where: { tenantId },
        orderBy: [{ estagio: 'asc' }, { atualizadoEm: 'desc' }],
        select: {
          id: true,
          numero: true,
          nome: true,
          empresa: true,
          quantidadePostos: true,
          estagio: true,
          valorEstimado: true,
          dataProximoContato: true,
          notas: true,
          criadoEm: true,
          atualizadoEm: true,
          _count: { select: { mensagens: true, followUps: true } },
        },
      })

      // Agrupa por estágio mantendo a ordem canônica
      const porEstagio: Record<string, typeof leads> = {}
      for (const e of ESTAGIOS_ORDER) porEstagio[e] = []
      for (const l of leads) {
        const col = porEstagio[l.estagio]
        if (col) col.push(l)
      }

      // Métricas rápidas
      const total = leads.length
      const ganhos = leads.filter((l) => l.estagio === 'GANHO').length
      const perdidos = leads.filter((l) => l.estagio === 'PERDIDO').length
      const ativos = total - ganhos - perdidos
      const taxaConversao = total > 0 ? Math.round((ganhos / total) * 100) : 0

      return reply.status(200).send({
        data: { porEstagio, metricas: { total, ativos, ganhos, perdidos, taxaConversao } },
      })
    },
  )

  /**
   * GET /api/v1/crm/leads/:id
   * Detalhe do lead com follow-ups e últimas mensagens
   */
  app.get(
    '/leads/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['crm'],
        summary: 'Detalhe do lead',
      },
    },
    async (request, reply) => {
      const lead = await prisma.leadWhatsApp.findFirst({
        where: { id: request.params.id, tenantId: request.user.tenantId },
        include: {
          mensagens: { orderBy: { criadoEm: 'desc' }, take: 20 },
          followUps: { orderBy: { realizadoEm: 'desc' }, take: 20 },
        },
      })
      if (!lead) throw new NotFoundError('Lead', request.params.id)
      return reply.status(200).send({ data: lead })
    },
  )

  /**
   * PATCH /api/v1/crm/leads/:id
   * Atualiza estágio, notas, valor, data próximo contato, responsável
   */
  app.patch(
    '/leads/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          nome: z.string().min(1).optional(),
          empresa: z.string().optional(),
          estagio: z.enum(['NOVO', 'CONTATADO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO', 'GANHO', 'PERDIDO']).optional(),
          valorEstimado: z.number().nonnegative().optional().nullable(),
          dataProximoContato: z.string().date().optional().nullable(),
          notas: z.string().max(5000).optional(),
        }),
        tags: ['crm'],
        summary: 'Atualiza lead CRM',
      },
    },
    async (request, reply) => {
      const lead = await prisma.leadWhatsApp.findFirst({ where: { id: request.params.id, tenantId: request.user.tenantId } })
      if (!lead) throw new NotFoundError('Lead', request.params.id)

      const { dataProximoContato, valorEstimado, ...rest } = request.body

      const updated = await prisma.leadWhatsApp.update({
        where: { id: request.params.id },
        data: {
          ...rest,
          ...(valorEstimado !== undefined && { valorEstimado: valorEstimado }),
          ...(dataProximoContato !== undefined && {
            dataProximoContato: dataProximoContato ? new Date(dataProximoContato) : null,
          }),
        },
      })

      return reply.status(200).send({ data: updated })
    },
  )

  /**
   * POST /api/v1/crm/leads/:id/followups
   * Registra um novo follow-up no lead
   */
  app.post(
    '/leads/:id/followups',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          tipo: z.enum(['LIGACAO', 'EMAIL', 'WHATSAPP', 'VISITA', 'REUNIAO', 'OUTROS']),
          notas: z.string().max(2000).optional(),
          realizadoEm: z.string().datetime().optional(),
        }),
        tags: ['crm'],
        summary: 'Registra follow-up no lead',
      },
    },
    async (request, reply) => {
      const lead = await prisma.leadWhatsApp.findFirst({ where: { id: request.params.id, tenantId: request.user.tenantId } })
      if (!lead) throw new NotFoundError('Lead', request.params.id)

      const followUp = await prisma.followUpLead.create({
        data: {
          leadId: request.params.id,
          autorId: request.user.id,
          tipo: request.body.tipo,
          notas: request.body.notas,
          realizadoEm: request.body.realizadoEm ? new Date(request.body.realizadoEm) : new Date(),
        },
      })

      return reply.status(201).send({ data: followUp })
    },
  )

  /**
   * GET /api/v1/crm/metricas
   * Métricas de funil: tempo médio por estágio, taxa de conversão
   */
  app.get(
    '/metricas',
    { schema: { tags: ['crm'], summary: 'Métricas do funil CRM' } },
    async (request, reply) => {
      const tenantId = request.user.tenantId
      const [contagens, leadsMaisAntigos] = await Promise.all([
        prisma.leadWhatsApp.groupBy({
          by: ['estagio'],
          where: { tenantId },
          _count: { id: true },
        }),
        prisma.leadWhatsApp.findMany({
          where: { tenantId, estagio: { notIn: ['GANHO', 'PERDIDO'] } },
          orderBy: { criadoEm: 'asc' },
          select: { estagio: true, criadoEm: true },
        }),
      ])

      const porEstagio = Object.fromEntries(
        contagens.map((c) => [c.estagio, c._count.id]),
      )

      // Tempo médio em dias no funil (leads ativos)
      const hoje = Date.now()
      const tempoMedioFunil =
        leadsMaisAntigos.length > 0
          ? Math.round(
              leadsMaisAntigos.reduce((acc, l) => acc + (hoje - l.criadoEm.getTime()) / 86_400_000, 0) /
                leadsMaisAntigos.length,
            )
          : 0

      const totalFechados = (porEstagio['GANHO'] ?? 0) + (porEstagio['PERDIDO'] ?? 0)
      const total = Object.values(porEstagio).reduce((a, b) => a + b, 0)
      const taxaConversao = totalFechados > 0
        ? Math.round(((porEstagio['GANHO'] ?? 0) / totalFechados) * 100)
        : 0

      return reply.status(200).send({
        data: { porEstagio, total, tempoMedioFunil, taxaConversao },
      })
    },
  )
}
