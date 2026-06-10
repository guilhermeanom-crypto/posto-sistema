import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { estanqueidadeService } from './estanqueidade.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// ESTANQUEIDADE ROUTES — Tanques + Testes anuais
// ─────────────────────────────────────────────────────────────────────────────

const filtrosBase = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  empreendimentoId: z.string().uuid().optional(),
})

const criarTanqueSchema = z.object({
  empreendimentoId: z.string().uuid(),
  numero: z.coerce.number().int().positive(),
  capacidadeLitros: z.coerce.number().int().positive(),
  combustivel: z.string().min(1),
  material: z.enum(['FIBRA', 'ACO', 'DUPLA_PAREDE', 'OUTRO']).optional(),
  dataInstalacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  observacoes: z.string().optional(),
})

const atualizarTanqueSchema = z.object({
  combustivel: z.string().optional(),
  material: z.enum(['FIBRA', 'ACO', 'DUPLA_PAREDE', 'OUTRO']).optional(),
  dataInstalacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'INTERDITADO', 'REMOVIDO']).optional(),
  observacoes: z.string().nullable().optional(),
})

const criarTesteSchema = z.object({
  empresa: z.string().min(1),
  responsavel: z.string().optional(),
  dataExecucao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  resultado: z.enum(['APROVADO', 'REPROVADO', 'INCONCLUSIVO']),
  metodo: z.string().optional(),
  proximoTeste: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observacoes: z.string().optional(),
})

export const estanqueidadeRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({ id: req.user.id, tenantId: req.user.tenantId, perfil: req.user.perfil })

  // ── Tanques ───────────────────────────────────────────────────────────────────

  app.get('/tanques', {
    schema: {
      querystring: filtrosBase.extend({ status: z.enum(['ATIVO', 'INATIVO', 'INTERDITADO', 'REMOVIDO']).optional() }),
      tags: ['estanqueidade'],
      summary: 'Lista tanques do parque',
    },
  }, async (req, reply) => {
    const result = await estanqueidadeService.listarTanques(ctx(req), req.query)
    return reply.send({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })

  app.post('/tanques', {
    schema: { body: criarTanqueSchema, response: { 201: z.object({ data: z.record(z.unknown()) }) }, tags: ['estanqueidade'] },
  }, async (req, reply) => {
    const tanque = await estanqueidadeService.criarTanque(ctx(req), req.body)
    return reply.status(201).send({ data: tanque })
  })

  app.get('/tanques/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['estanqueidade'] },
  }, async (req, reply) => {
    const tanque = await estanqueidadeService.buscarTanquePorId(ctx(req), req.params.id)
    return reply.send({ data: tanque })
  })

  app.patch('/tanques/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), body: atualizarTanqueSchema, tags: ['estanqueidade'] },
  }, async (req, reply) => {
    const tanque = await estanqueidadeService.atualizarTanque(ctx(req), req.params.id, req.body)
    return reply.send({ data: tanque })
  })

  // ── Testes ────────────────────────────────────────────────────────────────────

  app.get('/testes', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        tanqueId: z.string().uuid().optional(),
        resultado: z.enum(['APROVADO', 'REPROVADO', 'INCONCLUSIVO']).optional(),
      }),
      tags: ['estanqueidade'],
      summary: 'Lista testes de estanqueidade',
    },
  }, async (req, reply) => {
    const result = await estanqueidadeService.listarTestes(ctx(req), req.query)
    return reply.send({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })

  app.post('/tanques/:id/testes', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: criarTesteSchema,
      response: { 201: z.object({ data: z.record(z.unknown()) }) },
      tags: ['estanqueidade'],
      summary: 'Registra novo teste de estanqueidade para o tanque',
    },
  }, async (req, reply) => {
    const teste = await estanqueidadeService.criarTeste(ctx(req), req.params.id, req.body)
    return reply.status(201).send({ data: teste })
  })
}
