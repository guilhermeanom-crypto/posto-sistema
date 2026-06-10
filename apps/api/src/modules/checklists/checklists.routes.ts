import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { checklistsService } from './checklists.service.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLISTS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const criarTemplateSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  modulo: z.enum(['AMBIENTAL', 'SST', 'OPERACIONAL', 'ANP', 'ESTANQUEIDADE', 'GERAL']),
  periodicidade: z.enum(['DIARIO', 'SEMANAL', 'MENSAL', 'TRIMESTRAL', 'ANUAL']),
  itens: z.array(z.object({
    ordem: z.number().int().min(1),
    descricao: z.string().min(1),
    obrigatorio: z.boolean().optional(),
    categoria: z.string().optional(),
  })).min(1),
})

const atualizarTemplateSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  periodicidade: z.enum(['DIARIO', 'SEMANAL', 'MENSAL', 'TRIMESTRAL', 'ANUAL']).optional(),
  ativo: z.boolean().optional(),
})

const iniciarExecucaoSchema = z.object({
  templateId: z.string().uuid(),
  empreendimentoId: z.string().uuid(),
})

const responderItemSchema = z.object({
  status: z.enum(['OK', 'ATENCAO', 'CRITICO', 'NA']),
  observacao: z.string().optional(),
})

const finalizarExecucaoSchema = z.object({
  observacoes: z.string().optional(),
})

export const checklistsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const ctx = (request: FastifyRequest) => ({
    id: request.user.id,
    tenantId: request.user.tenantId,
    perfil: request.user.perfil,
    nome: request.user.nome,
    email: request.user.email,
    ip: extrairIp(request),
  })

  // ── Templates ──────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/checklists/templates
   */
  app.get(
    '/templates',
    {
      schema: {
        querystring: z.object({
          modulo: z.string().optional(),
          ativo: z.coerce.boolean().optional(),
        }),
        tags: ['checklists'],
        summary: 'Lista templates de checklist',
      },
    },
    async (request, reply) => {
      const data = await checklistsService.listarTemplates(ctx(request), request.query)
      return reply.status(200).send({ data })
    },
  )

  /**
   * GET /api/v1/checklists/templates/:id
   */
  app.get(
    '/templates/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['checklists'],
        summary: 'Obtém template com seus itens',
      },
    },
    async (request, reply) => {
      const data = await checklistsService.obterTemplate(ctx(request), request.params.id)
      return reply.status(200).send({ data })
    },
  )

  /**
   * POST /api/v1/checklists/templates
   */
  app.post(
    '/templates',
    {
      schema: {
        body: criarTemplateSchema,
        tags: ['checklists'],
        summary: 'Cria novo template de checklist com itens',
      },
    },
    async (request, reply) => {
      const data = await checklistsService.criarTemplate(ctx(request), request.body)
      return reply.status(201).send({ data })
    },
  )

  /**
   * PATCH /api/v1/checklists/templates/:id
   */
  app.patch(
    '/templates/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarTemplateSchema,
        tags: ['checklists'],
        summary: 'Atualiza metadados do template',
      },
    },
    async (request, reply) => {
      const data = await checklistsService.atualizarTemplate(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data })
    },
  )

  // ── Execuções ──────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/checklists/execucoes
   */
  app.get(
    '/execucoes',
    {
      schema: {
        querystring: z.object({
          empreendimentoId: z.string().uuid().optional(),
          templateId: z.string().uuid().optional(),
          status: z.string().optional(),
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(20),
        }),
        tags: ['checklists'],
        summary: 'Lista execuções de checklist',
      },
    },
    async (request, reply) => {
      const result = await checklistsService.listarExecucoes(ctx(request), request.query)
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
   * GET /api/v1/checklists/execucoes/:id
   */
  app.get(
    '/execucoes/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['checklists'],
        summary: 'Obtém execução com respostas',
      },
    },
    async (request, reply) => {
      const data = await checklistsService.obterExecucao(ctx(request), request.params.id)
      return reply.status(200).send({ data })
    },
  )

  /**
   * POST /api/v1/checklists/execucoes
   */
  app.post(
    '/execucoes',
    {
      schema: {
        body: iniciarExecucaoSchema,
        tags: ['checklists'],
        summary: 'Inicia uma nova execução de checklist',
      },
    },
    async (request, reply) => {
      const data = await checklistsService.iniciarExecucao(ctx(request), request.body)
      return reply.status(201).send({ data })
    },
  )

  /**
   * PUT /api/v1/checklists/execucoes/:id/itens/:itemId
   */
  app.put(
    '/execucoes/:id/itens/:itemId',
    {
      schema: {
        params: z.object({ id: z.string().uuid(), itemId: z.string().uuid() }),
        body: responderItemSchema,
        tags: ['checklists'],
        summary: 'Registra ou atualiza resposta de um item',
      },
    },
    async (request, reply) => {
      const data = await checklistsService.responderItem(
        ctx(request),
        request.params.id,
        request.params.itemId,
        request.body,
      )
      return reply.status(200).send({ data })
    },
  )

  /**
   * POST /api/v1/checklists/execucoes/:id/finalizar
   */
  app.post(
    '/execucoes/:id/finalizar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: finalizarExecucaoSchema,
        tags: ['checklists'],
        summary: 'Finaliza execução e calcula status (CONFORME/NAO_CONFORME/PARCIAL)',
      },
    },
    async (request, reply) => {
      const data = await checklistsService.finalizarExecucao(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data })
    },
  )
}
