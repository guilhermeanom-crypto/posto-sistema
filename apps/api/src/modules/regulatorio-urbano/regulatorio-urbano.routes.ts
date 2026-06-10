import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { regulatorioUrbanoService } from './regulatorio-urbano.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// REGULATÓRIO URBANO ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const tiposAlvara = ['AVCB', 'HABITE_SE', 'ALVARA_FUNCIONAMENTO', 'PPCI', 'LICENCA_SANITARIA', 'ALVARA_OBRAS', 'OUTROS'] as const
const statusLicenca = ['VIGENTE', 'A_RENOVAR', 'VENCIDA', 'SUSPENSA', 'CANCELADA', 'EM_RENOVACAO'] as const

const criarAlvaraSchema = z.object({
  empreendimentoId: z.string().uuid(),
  tipo: z.enum(tiposAlvara),
  numero: z.string().optional(),
  orgaoEmissor: z.string().min(1),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  observacoes: z.string().optional(),
})

const atualizarAlvaraSchema = z.object({
  numero: z.string().nullable().optional(),
  orgaoEmissor: z.string().min(1).optional(),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(statusLicenca).optional(),
  observacoes: z.string().nullable().optional(),
})

const filtrosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  empreendimentoId: z.string().uuid().optional(),
  status: z.enum(statusLicenca).optional(),
  tipo: z.enum(tiposAlvara).optional(),
})

export const regulatorioUrbanoRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const ctx = (req: FastifyRequest) => ({
    id: req.user.id,
    tenantId: req.user.tenantId,
    perfil: req.user.perfil,
  })

  /**
   * GET /api/v1/regulatorio-urbano
   */
  app.get(
    '/',
    { schema: { querystring: filtrosSchema, tags: ['regulatorio-urbano'], summary: 'Lista alvarás e documentos urbanos' } },
    async (req, reply) => {
      const result = await regulatorioUrbanoService.listar(ctx(req), req.query)
      return reply.send({
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
   * POST /api/v1/regulatorio-urbano
   */
  app.post(
    '/',
    {
      schema: {
        body: criarAlvaraSchema,
        response: { 201: z.object({ data: z.record(z.unknown()) }) },
        tags: ['regulatorio-urbano'],
        summary: 'Cadastra alvará ou documento urbano',
      },
    },
    async (req, reply) => {
      const alvara = await regulatorioUrbanoService.criar(ctx(req), req.body)
      return reply.status(201).send({ data: alvara })
    },
  )

  /**
   * GET /api/v1/regulatorio-urbano/:id
   */
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['regulatorio-urbano'],
        summary: 'Detalhe do alvará/documento',
      },
    },
    async (req, reply) => {
      const alvara = await regulatorioUrbanoService.buscarPorId(ctx(req), req.params.id)
      return reply.send({ data: alvara })
    },
  )

  /**
   * PATCH /api/v1/regulatorio-urbano/:id
   */
  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarAlvaraSchema,
        tags: ['regulatorio-urbano'],
        summary: 'Atualiza alvará/documento',
      },
    },
    async (req, reply) => {
      const alvara = await regulatorioUrbanoService.atualizar(ctx(req), req.params.id, req.body)
      return reply.send({ data: alvara })
    },
  )

  /**
   * POST /api/v1/regulatorio-urbano/:id/arquivo
   */
  app.post(
    '/:id/arquivo',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ chaveS3: z.string().min(1), nomeArquivo: z.string().min(1) }),
        tags: ['regulatorio-urbano'],
        summary: 'Vincula arquivo S3 ao alvará',
      },
    },
    async (req, reply) => {
      const alvara = await regulatorioUrbanoService.vincularArquivo(
        ctx(req),
        req.params.id,
        req.body.chaveS3,
        req.body.nomeArquivo,
      )
      return reply.send({ data: alvara })
    },
  )
}
