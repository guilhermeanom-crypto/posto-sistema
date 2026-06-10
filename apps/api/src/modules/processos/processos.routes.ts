import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  criarProcessoSchema,
  atualizarProcessoSchema,
  filtrosProcessoSchema,
  alterarStatusProcessoSchema,
  avancarFaseProcessoSchema,
  dispensarRequisitoSchema,
} from '@repo/schemas'
import { processosService } from './processos.service.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'

// ─────────────────────────────────────────────────────────────────────────────
// PROCESSOS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

export const processosRoutes: FastifyPluginAsyncZod = async (app) => {
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
   * GET /api/v1/processos
   */
  app.get(
    '/',
    {
      schema: {
        querystring: filtrosProcessoSchema,
        tags: ['processos'],
        summary: 'Lista processos com filtros e paginação',
      },
    },
    async (request, reply) => {
      const result = await processosService.listar(ctx(request), request.query)
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
   * POST /api/v1/processos
   */
  app.post(
    '/',
    {
      schema: {
        body: criarProcessoSchema,
        response: { 201: z.object({ data: z.record(z.unknown()) }) },
        tags: ['processos'],
        summary: 'Abre um novo processo regulatório',
      },
    },
    async (request, reply) => {
      const processo = await processosService.criar(ctx(request), request.body)
      return reply.status(201).send({ data: processo })
    },
  )

  /**
   * GET /api/v1/processos/:id
   */
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['processos'],
        summary: 'Retorna detalhes de um processo',
      },
    },
    async (request, reply) => {
      const processo = await processosService.buscarPorId(ctx(request), request.params.id)
      return reply.status(200).send({ data: processo })
    },
  )

  /**
   * PATCH /api/v1/processos/:id
   */
  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarProcessoSchema,
        tags: ['processos'],
        summary: 'Atualiza dados gerais do processo',
      },
    },
    async (request, reply) => {
      const processo = await processosService.atualizar(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data: processo })
    },
  )

  /**
   * POST /api/v1/processos/:id/status
   */
  app.post(
    '/:id/status',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: alterarStatusProcessoSchema,
        tags: ['processos'],
        summary: 'Altera o status do processo (respeita máquina de estados)',
      },
    },
    async (request, reply) => {
      const processo = await processosService.alterarStatus(
        ctx(request),
        request.params.id,
        request.body.status,
        request.body.observacoes,
      )
      return reply.status(200).send({ data: processo })
    },
  )

  /**
   * POST /api/v1/processos/:id/avancar-fase
   */
  app.post(
    '/:id/avancar-fase',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: avancarFaseProcessoSchema,
        tags: ['processos'],
        summary: 'Avança o processo para a próxima fase do tipo de processo',
      },
    },
    async (request, reply) => {
      const processo = await processosService.avancarFase(ctx(request), request.params.id, {
        observacoes: request.body.observacoes,
        forcar: request.body.forcar,
      })
      return reply.status(200).send({ data: processo })
    },
  )

  /**
   * POST /api/v1/processos/:id/requisitos/:requisitoId/dispensar
   */
  app.post(
    '/:id/requisitos/:requisitoId/dispensar',
    {
      schema: {
        params: z.object({ id: z.string().uuid(), requisitoId: z.string().uuid() }),
        body: dispensarRequisitoSchema,
        tags: ['processos'],
        summary: 'Dispensa um requisito obrigatório do processo (requer COORDENADOR+)',
      },
    },
    async (request, reply) => {
      const requisito = await processosService.dispensarRequisito(
        ctx(request),
        request.params.id,
        request.params.requisitoId,
        request.body.motivoDispensa,
      )
      return reply.status(200).send({ data: requisito })
    },
  )
}
