import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  criarTarefaSchema,
  atualizarTarefaSchema,
  concluirTarefaSchema,
  reatribuirTarefaSchema,
  cancelarTarefaSchema,
} from '@repo/schemas'
import { tarefasService } from './tarefas.service.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'

// ─────────────────────────────────────────────────────────────────────────────
// TAREFAS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const filtrosTarefaSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  empreendimentoId: z.string().uuid().optional(),
  responsavelId: z.string().uuid().optional(),
  status: z.string().optional(),
  prioridade: z.string().optional(),
  origem: z.string().optional(),
})

export const tarefasRoutes: FastifyPluginAsyncZod = async (app) => {
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
   * GET /api/v1/tarefas
   */
  app.get(
    '/',
    {
      schema: {
        querystring: filtrosTarefaSchema,
        tags: ['tarefas'],
        summary: 'Lista tarefas com filtros e paginação',
      },
    },
    async (request, reply) => {
      const result = await tarefasService.listar(ctx(request), request.query)
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
   * POST /api/v1/tarefas
   */
  app.post(
    '/',
    {
      schema: {
        body: criarTarefaSchema,
        response: { 201: z.object({ data: z.record(z.unknown()) }) },
        tags: ['tarefas'],
        summary: 'Cria uma nova tarefa',
      },
    },
    async (request, reply) => {
      const tarefa = await tarefasService.criar(ctx(request), request.body)
      return reply.status(201).send({ data: tarefa })
    },
  )

  /**
   * GET /api/v1/tarefas/:id
   */
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['tarefas'],
        summary: 'Retorna detalhes de uma tarefa com evidências',
      },
    },
    async (request, reply) => {
      const tarefa = await tarefasService.buscarPorId(ctx(request), request.params.id)
      return reply.status(200).send({ data: tarefa })
    },
  )

  /**
   * PATCH /api/v1/tarefas/:id
   */
  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarTarefaSchema,
        tags: ['tarefas'],
        summary: 'Atualiza dados de uma tarefa',
      },
    },
    async (request, reply) => {
      const tarefa = await tarefasService.atualizar(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data: tarefa })
    },
  )

  /**
   * POST /api/v1/tarefas/:id/iniciar
   */
  app.post(
    '/:id/iniciar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['tarefas'],
        summary: 'Inicia o trabalho em uma tarefa pendente',
      },
    },
    async (request, reply) => {
      const tarefa = await tarefasService.iniciar(ctx(request), request.params.id)
      return reply.status(200).send({ data: tarefa })
    },
  )

  /**
   * POST /api/v1/tarefas/:id/concluir
   */
  app.post(
    '/:id/concluir',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: concluirTarefaSchema,
        response: { 200: z.object({ data: z.record(z.unknown()) }) },
        tags: ['tarefas'],
        summary: 'Conclui a tarefa, opcionalmente com evidência',
      },
    },
    async (request, reply) => {
      const tarefa = await tarefasService.concluir(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data: tarefa })
    },
  )

  /**
   * POST /api/v1/tarefas/:id/reatribuir
   */
  app.post(
    '/:id/reatribuir',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: reatribuirTarefaSchema,
        response: { 200: z.object({ data: z.record(z.unknown()) }) },
        tags: ['tarefas'],
        summary: 'Reatribui a tarefa para outro usuário (requer COORDENADOR+)',
      },
    },
    async (request, reply) => {
      const tarefa = await tarefasService.reatribuir(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data: tarefa })
    },
  )

  /**
   * POST /api/v1/tarefas/:id/cancelar
   */
  app.post(
    '/:id/cancelar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: cancelarTarefaSchema,
        response: { 200: z.object({ data: z.object({ mensagem: z.string() }) }) },
        tags: ['tarefas'],
        summary: 'Cancela uma tarefa com justificativa',
      },
    },
    async (request, reply) => {
      await tarefasService.cancelar(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data: { mensagem: 'Tarefa cancelada.' } })
    },
  )
}
