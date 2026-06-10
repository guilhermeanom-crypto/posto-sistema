import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { licencasAmbientaisService } from './licencas-ambientais.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// LICENÇAS AMBIENTAIS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const tiposLicenca = ['LI', 'LP', 'LO', 'LAO', 'LAS', 'LAF', 'LAT', 'OUTRAS'] as const
const statusLicenca = ['VIGENTE', 'A_RENOVAR', 'VENCIDA', 'SUSPENSA', 'CANCELADA', 'EM_RENOVACAO'] as const

const criarLicencaSchema = z.object({
  empreendimentoId: z.string().uuid(),
  tipo: z.enum(tiposLicenca),
  numero: z.string().min(1),
  orgaoEmissor: z.string().min(1),
  responsavelTecnico: z.string().optional(),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observacoes: z.string().optional(),
})

const atualizarLicencaSchema = z.object({
  numero: z.string().min(1).optional(),
  orgaoEmissor: z.string().min(1).optional(),
  responsavelTecnico: z.string().nullable().optional(),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(statusLicenca).optional(),
  observacoes: z.string().nullable().optional(),
})

const criarCondicaoSchema = z.object({
  numero: z.string().optional(),
  descricao: z.string().min(1),
  prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['PENDENTE', 'EM_CUMPRIMENTO', 'CUMPRIDA', 'VENCIDA']).optional(),
  observacoes: z.string().optional(),
})

const atualizarCondicaoSchema = criarCondicaoSchema.partial()

const filtrosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  empreendimentoId: z.string().uuid().optional(),
  status: z.enum(statusLicenca).optional(),
  tipo: z.enum(tiposLicenca).optional(),
})

export const licencasAmbientaisRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const ctx = (req: FastifyRequest) => ({
    id: req.user.id,
    tenantId: req.user.tenantId,
    perfil: req.user.perfil,
  })

  /**
   * GET /api/v1/licencas-ambientais
   */
  app.get(
    '/',
    { schema: { querystring: filtrosSchema, tags: ['licencas-ambientais'], summary: 'Lista licenças ambientais' } },
    async (req, reply) => {
      const result = await licencasAmbientaisService.listar(ctx(req), req.query)
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
   * POST /api/v1/licencas-ambientais
   */
  app.post(
    '/',
    {
      schema: {
        body: criarLicencaSchema,
        response: { 201: z.object({ data: z.record(z.unknown()) }) },
        tags: ['licencas-ambientais'],
        summary: 'Cadastra nova licença ambiental',
      },
    },
    async (req, reply) => {
      const licenca = await licencasAmbientaisService.criar(ctx(req), req.body)
      return reply.status(201).send({ data: licenca })
    },
  )

  /**
   * GET /api/v1/licencas-ambientais/:id
   */
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['licencas-ambientais'],
        summary: 'Detalhe da licença ambiental com condições',
      },
    },
    async (req, reply) => {
      const licenca = await licencasAmbientaisService.buscarPorId(ctx(req), req.params.id)
      return reply.send({ data: licenca })
    },
  )

  /**
   * PATCH /api/v1/licencas-ambientais/:id
   */
  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarLicencaSchema,
        tags: ['licencas-ambientais'],
        summary: 'Atualiza licença ambiental',
      },
    },
    async (req, reply) => {
      const licenca = await licencasAmbientaisService.atualizar(ctx(req), req.params.id, req.body)
      return reply.send({ data: licenca })
    },
  )

  /**
   * POST /api/v1/licencas-ambientais/:id/arquivo
   */
  app.post(
    '/:id/arquivo',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ chaveS3: z.string().min(1), nomeArquivo: z.string().min(1) }),
        tags: ['licencas-ambientais'],
        summary: 'Vincula arquivo S3 à licença',
      },
    },
    async (req, reply) => {
      const licenca = await licencasAmbientaisService.vincularArquivo(
        ctx(req),
        req.params.id,
        req.body.chaveS3,
        req.body.nomeArquivo,
      )
      return reply.send({ data: licenca })
    },
  )

  // ── Condições ────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/licencas-ambientais/:id/condicoes
   */
  app.get(
    '/:id/condicoes',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['licencas-ambientais'],
        summary: 'Lista condições da licença',
      },
    },
    async (req, reply) => {
      const condicoes = await licencasAmbientaisService.listarCondicoes(ctx(req), req.params.id)
      return reply.send({ data: condicoes })
    },
  )

  /**
   * POST /api/v1/licencas-ambientais/:id/condicoes
   */
  app.post(
    '/:id/condicoes',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: criarCondicaoSchema,
        response: { 201: z.object({ data: z.record(z.unknown()) }) },
        tags: ['licencas-ambientais'],
        summary: 'Adiciona condição à licença',
      },
    },
    async (req, reply) => {
      const condicao = await licencasAmbientaisService.criarCondicao(ctx(req), req.params.id, req.body)
      return reply.status(201).send({ data: condicao })
    },
  )

  /**
   * PATCH /api/v1/licencas-ambientais/:id/condicoes/:condicaoId
   */
  app.patch(
    '/:id/condicoes/:condicaoId',
    {
      schema: {
        params: z.object({ id: z.string().uuid(), condicaoId: z.string().uuid() }),
        body: atualizarCondicaoSchema,
        tags: ['licencas-ambientais'],
        summary: 'Atualiza condição da licença',
      },
    },
    async (req, reply) => {
      const condicao = await licencasAmbientaisService.atualizarCondicao(
        ctx(req),
        req.params.id,
        req.params.condicaoId,
        req.body,
      )
      return reply.send({ data: condicao })
    },
  )
}
