import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'

// ─────────────────────────────────────────────────────────────────────────────
// ALERTAS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const filtrosAlertaSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  empreendimentoId: z.string().uuid().optional(),
  tipo: z.string().optional(),
  nivel: z.string().optional(),
  lido: z.coerce.boolean().optional(),
})

export const alertasRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  app.get(
    '/',
    { schema: { querystring: filtrosAlertaSchema, tags: ['alertas'], summary: 'Lista alertas do tenant' } },
    async (request, reply) => {
      const { page, limit, empreendimentoId, tipo, nivel, lido } = request.query
      const usuarioId = request.user.id
      const tenantId = request.user.tenantId

      // Query via AlertaDestinatario para filtrar por lido
      const whereDestinatario = {
        usuarioId,
        ...(lido !== undefined && { lido }),
        alerta: {
          tenantId,
          ...(empreendimentoId && { empreendimentoId }),
          ...(tipo && { tipo: tipo as never }),
          ...(nivel && { nivel: nivel as never }),
        },
      }

      const [total, destinatarios] = await prisma.$transaction([
        prisma.alertaDestinatario.count({ where: whereDestinatario }),
        prisma.alertaDestinatario.findMany({
          where: whereDestinatario,
          include: {
            alerta: {
              include: { empreendimento: { select: { id: true, nome: true } } },
            },
          },
          orderBy: { alerta: { criadoEm: 'desc' } },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      const entidadeHref: Record<string, (id: string) => string> = {
        // UPPER_SNAKE (legado)
        DOCUMENTO:        (id) => `/documentos/${id}`,
        CONDICIONANTE:    (id) => `/condicionantes/${id}`,
        TAREFA:           (id) => `/tarefas/${id}`,
        LICENCA_AMBIENTAL:(id) => `/licencas-ambientais/${id}`,
        AUTO_INFRACAO:    (id) => `/fiscalizacoes/${id}`,
        PROCESSO:         (id) => `/processos/${id}`,
        EMPREENDIMENTO:   (id) => `/empreendimentos/${id}`,
        // camelCase (scheduler/worker)
        documento:           (id) => `/documentos/${id}`,
        condicionante:       (id) => `/condicionantes/${id}`,
        tarefa:              (id) => `/tarefas/${id}`,
        licencaAmbiental:    (id) => `/licencas-ambientais/${id}`,
        autoInfracao:        (id) => `/fiscalizacoes/${id}`,
        processo:            (id) => `/processos/${id}`,
        aso:                 ()   => `/sst`,
        testeEstanqueidade:  (id) => `/estanqueidade/${id}`,
        bombaAbastecimento:  (id) => `/anp-inmetro/${id}`,
        pocoArtesiano:       (id) => `/outorga-hidrica/${id}`,
        treinamentoExecucao: ()   => `/sst/treinamentos`,
        documentoSST:        ()   => `/sst`,
        entregaEPI:          ()   => `/sst/epis`,
        pgrs:                (id) => `/pgrs/${id}`,
        pgrsExigencia:       ()   => `/pgrs`,
        recursoAdministrativo: (id) => `/fiscalizacoes/${id}`,
      }

      const items = destinatarios.map((d) => {
        const { entidadeTipo, entidadeId } = d.alerta
        const fn = entidadeTipo ? entidadeHref[entidadeTipo] : null
        const referenciaHref = fn && entidadeId ? fn(entidadeId) : null
        return { ...d.alerta, lido: d.lido, lidoEm: d.lidoEm, referenciaHref }
      })

      return reply.status(200).send({
        data: items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    },
  )

  app.patch(
    '/:id/ler',
    { schema: { params: z.object({ id: z.string().uuid() }), tags: ['alertas'], summary: 'Marca alerta como lido' } },
    async (request, reply) => {
      await prisma.alertaDestinatario.updateMany({
        where: { alertaId: request.params.id, usuarioId: request.user.id },
        data: { lido: true, lidoEm: new Date() },
      })
      return reply.status(204).send()
    },
  )

  app.patch(
    '/ler-todos',
    { schema: { tags: ['alertas'], summary: 'Marca todos os alertas como lidos' } },
    async (request, reply) => {
      await prisma.alertaDestinatario.updateMany({
        where: { usuarioId: request.user.id, lido: false },
        data: { lido: true, lidoEm: new Date() },
      })
      return reply.status(204).send()
    },
  )
}
