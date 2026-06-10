import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { anpInmetroService } from './anp-inmetro.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// ANP / INMETRO ROUTES — Bombas de abastecimento
// ─────────────────────────────────────────────────────────────────────────────

const filtrosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  empreendimentoId: z.string().uuid().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'MANUTENCAO']).optional(),
})

const criarBombaSchema = z.object({
  empreendimentoId: z.string().uuid(),
  numero: z.coerce.number().int().positive(),
  fabricante: z.string().min(1),
  modelo: z.string().optional(),
  numeroDeSerie: z.string().optional(),
  combustiveis: z.array(z.string()).min(1),
  ultimaCalibracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  proximaCalibracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  stickerInmetro: z.string().optional(),
  observacoes: z.string().optional(),
})

const atualizarBombaSchema = z.object({
  fabricante: z.string().min(1).optional(),
  modelo: z.string().nullable().optional(),
  numeroDeSerie: z.string().nullable().optional(),
  combustiveis: z.array(z.string()).optional(),
  ultimaCalibracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  proximaCalibracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  stickerInmetro: z.string().nullable().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'MANUTENCAO']).optional(),
  observacoes: z.string().nullable().optional(),
})

const calibracaoSchema = z.object({
  dataExecucao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  proximaCalibracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stickerInmetro: z.string().optional(),
})

export const anpInmetroRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({ id: req.user.id, tenantId: req.user.tenantId, perfil: req.user.perfil })

  app.get('/', {
    schema: { querystring: filtrosSchema, tags: ['anp-inmetro'], summary: 'Lista bombas de abastecimento' },
  }, async (req, reply) => {
    const result = await anpInmetroService.listar(ctx(req), req.query)
    return reply.send({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })

  app.post('/', {
    schema: { body: criarBombaSchema, response: { 201: z.object({ data: z.record(z.unknown()) }) }, tags: ['anp-inmetro'] },
  }, async (req, reply) => {
    const bomba = await anpInmetroService.criar(ctx(req), req.body)
    return reply.status(201).send({ data: bomba })
  })

  app.get('/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['anp-inmetro'] },
  }, async (req, reply) => {
    const bomba = await anpInmetroService.buscarPorId(ctx(req), req.params.id)
    return reply.send({ data: bomba })
  })

  app.patch('/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), body: atualizarBombaSchema, tags: ['anp-inmetro'] },
  }, async (req, reply) => {
    const bomba = await anpInmetroService.atualizar(ctx(req), req.params.id, req.body)
    return reply.send({ data: bomba })
  })

  app.post('/:id/calibracao', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: calibracaoSchema,
      tags: ['anp-inmetro'],
      summary: 'Registra nova calibração INMETRO',
    },
  }, async (req, reply) => {
    const bomba = await anpInmetroService.registrarCalibracao(
      ctx(req),
      req.params.id,
      req.body.dataExecucao,
      req.body.proximaCalibracao,
      req.body.stickerInmetro,
    )
    return reply.send({ data: bomba })
  })
}
