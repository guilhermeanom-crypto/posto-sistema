import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { pgrsService } from './pgrs.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// PGRS ROUTES — Plano de Gerenciamento de Resíduos Sólidos
// ─────────────────────────────────────────────────────────────────────────────

const statusValues = ['EM_ELABORACAO', 'VIGENTE', 'A_RENOVAR', 'VENCIDO', 'CANCELADO'] as const
const statusExigValues = ['PENDENTE', 'EM_CUMPRIMENTO', 'COMPROVADO', 'VENCIDO', 'NAO_APLICAVEL'] as const
const periodicidadeValues = ['UNICA', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'BIENAL', 'PERSONALIZADA'] as const

const criarPGRSSchema = z.object({
  empreendimentoId: z.string().uuid(),
  versao: z.string().min(1),
  responsavelTecnico: z.string().min(1),
  artNumero: z.string().optional(),
  dataAprovacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  documentoId: z.string().uuid().optional(),
  observacoes: z.string().optional(),
})

const criarExigenciaSchema = z.object({
  descricao: z.string().min(1),
  tipoResiduo: z.string().min(1),
  periodicidade: z.enum(periodicidadeValues),
  prazoComprovacaoDias: z.number().int().min(1),
})

const vincularEvidenciaSchema = z.object({
  documentoId: z.string().uuid(),
  periodoRef: z.string().min(1),
})

export const pgrsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({
    id: req.user.id,
    tenantId: req.user.tenantId,
    perfil: req.user.perfil,
    nome: req.user.nome,
    email: req.user.email,
    ip: req.ip,
  })

  // GET / — listar PGRS
  app.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        empreendimentoId: z.string().uuid().optional(),
        status: z.string().optional(),
      }),
      tags: ['pgrs'],
      summary: 'Lista PGRS com filtros e paginação',
    },
  }, async (req, reply) => {
    const result = await pgrsService.listar(ctx(req), req.query)
    return reply.send({
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    })
  })

  // GET /:id — detalhe com exigências e evidências
  app.get('/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['pgrs'] },
  }, async (req, reply) => {
    const pgrs = await pgrsService.buscarPorId(ctx(req), req.params.id)
    return reply.send(pgrs)
  })

  // POST / — criar PGRS
  app.post('/', {
    schema: { body: criarPGRSSchema, tags: ['pgrs'] },
  }, async (req, reply) => {
    const pgrs = await pgrsService.criar(ctx(req), req.body)
    return reply.status(201).send({ data: pgrs })
  })

  // PATCH /:id — atualizar PGRS
  app.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: criarPGRSSchema.partial().extend({
        status: z.enum(statusValues).optional(),
      }),
      tags: ['pgrs'],
    },
  }, async (req, reply) => {
    const pgrs = await pgrsService.atualizar(ctx(req), req.params.id, req.body)
    return reply.send(pgrs)
  })

  // ── Exigências ────────────────────────────────────────────────────────────

  // POST /:id/exigencias — criar exigência
  app.post('/:id/exigencias', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: criarExigenciaSchema,
      tags: ['pgrs'],
    },
  }, async (req, reply) => {
    const exigencia = await pgrsService.criarExigencia(ctx(req), req.params.id, req.body)
    return reply.status(201).send({ data: exigencia })
  })

  // PATCH /:id/exigencias/:eid — atualizar status/NA
  app.patch('/:id/exigencias/:eid', {
    schema: {
      params: z.object({ id: z.string().uuid(), eid: z.string().uuid() }),
      body: z.object({
        status: z.enum(statusExigValues).optional(),
        naoAplicavel: z.boolean().optional(),
        naoAplicavelJustificativa: z.string().optional(),
      }),
      tags: ['pgrs'],
    },
  }, async (req, reply) => {
    const exigencia = await pgrsService.atualizarExigencia(ctx(req), req.params.id, req.params.eid, req.body)
    return reply.send(exigencia)
  })

  // ── Evidências ────────────────────────────────────────────────────────────

  // POST /:id/exigencias/:eid/evidencias — vincular evidência
  app.post('/:id/exigencias/:eid/evidencias', {
    schema: {
      params: z.object({ id: z.string().uuid(), eid: z.string().uuid() }),
      body: vincularEvidenciaSchema,
      tags: ['pgrs'],
    },
  }, async (req, reply) => {
    const evidencia = await pgrsService.vincularEvidencia(ctx(req), req.params.id, req.params.eid, req.body)
    return reply.status(201).send({ data: evidencia })
  })
}
