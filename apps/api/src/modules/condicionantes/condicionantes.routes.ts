import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  criarCondicionanteSchema,
  cumpirCondicionanteSchema,
  dispensarCondicionanteSchema,
} from '@repo/schemas'
import { condicionantesService } from './condicionantes.service.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'

// ─────────────────────────────────────────────────────────────────────────────
// CONDICIONANTES ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const filtrosCondicionanteSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  empreendimentoId: z.string().uuid().optional(),
  processoId: z.string().uuid().optional(),
  status: z.string().optional(),
})

export const condicionantesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const ctx = (request: FastifyRequest) => ({
    id: request.user.id,
    tenantId: request.user.tenantId,
    perfil: request.user.perfil,
    nome: request.user.nome,
    email: request.user.email,
    ip: extrairIp(request),
  })

  /**
   * GET /api/v1/condicionantes
   */
  app.get(
    '/',
    {
      schema: {
        querystring: filtrosCondicionanteSchema,
        tags: ['condicionantes'],
        summary: 'Lista condicionantes com filtros e paginação',
      },
    },
    async (request, reply) => {
      const result = await condicionantesService.listar(ctx(request), request.query)
      return reply.status(200).send({
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      })
    },
  )

  /**
   * POST /api/v1/condicionantes
   */
  app.post(
    '/',
    {
      schema: {
        body: criarCondicionanteSchema,
        response: { 201: z.object({ data: z.record(z.unknown()) }) },
        tags: ['condicionantes'],
        summary: 'Cria uma nova condicionante',
      },
    },
    async (request, reply) => {
      const condicionante = await condicionantesService.criar(ctx(request), request.body)
      return reply.status(201).send({ data: condicionante })
    },
  )

  /**
   * GET /api/v1/condicionantes/:id
   */
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['condicionantes'],
        summary: 'Retorna detalhes de uma condicionante com histórico de ciclos',
      },
    },
    async (request, reply) => {
      const condicionante = await condicionantesService.buscarPorId(ctx(request), request.params.id)
      return reply.status(200).send({ data: condicionante })
    },
  )

  /**
   * POST /api/v1/condicionantes/:id/cumprir
   */
  app.post(
    '/:id/cumprir',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: cumpirCondicionanteSchema,
        response: { 200: z.object({ data: z.record(z.unknown()) }) },
        tags: ['condicionantes'],
        summary: 'Registra o cumprimento de uma condicionante e agenda o próximo ciclo',
      },
    },
    async (request, reply) => {
      const condicionante = await condicionantesService.cumprir(
        ctx(request),
        request.params.id,
        request.body,
      )
      return reply.status(200).send({ data: condicionante })
    },
  )

  /**
   * POST /api/v1/condicionantes/:id/dispensar
   */
  app.post(
    '/:id/dispensar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: dispensarCondicionanteSchema,
        response: { 200: z.object({ data: z.object({ mensagem: z.string() }) }) },
        tags: ['condicionantes'],
        summary: 'Dispensa uma condicionante (requer COORDENADOR+)',
      },
    },
    async (request, reply) => {
      await condicionantesService.dispensar(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data: { mensagem: 'Condicionante dispensada.' } })
    },
  )
}
