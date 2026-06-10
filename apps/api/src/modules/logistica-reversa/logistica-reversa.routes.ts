import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { logisticaReversaService } from './logistica-reversa.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// LOGÍSTICA REVERSA ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const pagSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const residuoSchema = z.object({
  tipo: z.string().min(1),
  quantidade: z.coerce.number().positive(),
  unidade: z.string().min(1),
  destinacao: z.string().optional(),
})

const criarTransportadoraSchema = z.object({
  nome: z.string().min(1),
  cnpj: z.string().min(14),
  licencaAmbiental: z.string().optional(),
  validadeLicenca: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
})

const criarMTRSchema = z.object({
  empreendimentoId: z.string().uuid(),
  transportadoraId: z.string().uuid().optional(),
  numeroMTR: z.string().optional(),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataColeta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  residuos: z.array(residuoSchema).min(1),
  observacoes: z.string().optional(),
})

const statusMTRSchema = z.object({
  status: z.enum(['ABERTO', 'COLETADO', 'DESTINADO', 'ENCERRADO']),
  dataColeta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const logisticaReversaRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({ id: req.user.id, tenantId: req.user.tenantId, perfil: req.user.perfil })

  // ── Transportadoras ───────────────────────────────────────────────────────────

  app.get('/transportadoras', {
    schema: { querystring: pagSchema.extend({ ativo: z.coerce.boolean().optional() }), tags: ['logistica-reversa'] },
  }, async (req, reply) => {
    const result = await logisticaReversaService.listarTransportadoras(ctx(req), req.query)
    return reply.send({ data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) } })
  })

  app.post('/transportadoras', {
    schema: { body: criarTransportadoraSchema, response: { 201: z.object({ data: z.record(z.unknown()) }) }, tags: ['logistica-reversa'] },
  }, async (req, reply) => {
    const t = await logisticaReversaService.criarTransportadora(ctx(req), req.body)
    return reply.status(201).send({ data: t })
  })

  // ── MTRs ──────────────────────────────────────────────────────────────────────

  app.get('/mtrs', {
    schema: {
      querystring: pagSchema.extend({
        empreendimentoId: z.string().uuid().optional(),
        status: z.enum(['ABERTO', 'COLETADO', 'DESTINADO', 'ENCERRADO']).optional(),
      }),
      tags: ['logistica-reversa'],
    },
  }, async (req, reply) => {
    const result = await logisticaReversaService.listarMTRs(ctx(req), req.query)
    return reply.send({ data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) } })
  })

  app.post('/mtrs', {
    schema: { body: criarMTRSchema, response: { 201: z.object({ data: z.record(z.unknown()) }) }, tags: ['logistica-reversa'] },
  }, async (req, reply) => {
    const mtr = await logisticaReversaService.criarMTR(ctx(req), req.body)
    return reply.status(201).send({ data: mtr })
  })

  app.get('/mtrs/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['logistica-reversa'] },
  }, async (req, reply) => {
    const mtr = await logisticaReversaService.buscarMTRPorId(ctx(req), req.params.id)
    return reply.send({ data: mtr })
  })

  app.patch('/mtrs/:id/status', {
    schema: { params: z.object({ id: z.string().uuid() }), body: statusMTRSchema, tags: ['logistica-reversa'] },
  }, async (req, reply) => {
    const mtr = await logisticaReversaService.atualizarStatusMTR(ctx(req), req.params.id, req.body.status, req.body.dataColeta)
    return reply.send({ data: mtr })
  })

  // ── CCRs ─────────────────────────────────────────────────────────────────────

  const criarCCRSchema = z.object({
    numeroCCR: z.string().optional(),
    tipoResiduo: z.string().min(1),
    quantidadeKg: z.coerce.number().positive(),
    destinador: z.string().min(1),
    cnpjDestinador: z.string().optional(),
    dataDestinacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tecnologiaUso: z.enum(['COPROCESSAMENTO', 'RECICLAGEM', 'INCINERACAO', 'ATERRO', 'OUTROS']).optional(),
  })

  app.get('/mtrs/:id/ccrs', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['logistica-reversa'] },
  }, async (req, reply) => {
    const result = await logisticaReversaService.listarCCRs(ctx(req), { mtrId: req.params.id, page: 1, limit: 100 })
    return reply.send({ data: result.items })
  })

  app.post('/mtrs/:id/ccrs', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: criarCCRSchema,
      response: { 201: z.object({ data: z.record(z.unknown()) }) },
      tags: ['logistica-reversa'],
    },
  }, async (req, reply) => {
    const ccr = await logisticaReversaService.criarCCR(ctx(req), req.params.id, req.body)
    return reply.status(201).send({ data: ccr })
  })

  app.delete('/ccrs/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['logistica-reversa'] },
  }, async (req, reply) => {
    await logisticaReversaService.deletarCCR(ctx(req), req.params.id)
    return reply.status(204).send()
  })

  // ── Metas de Resíduo ──────────────────────────────────────────────────────────

  const metaSchema = z.object({
    empreendimentoId: z.string().uuid(),
    ano: z.coerce.number().int().min(2020).max(2100),
    tipoResiduo: z.string().min(1),
    unidade: z.enum(['KG', 'LITRO', 'UNIDADE', 'TON']),
    metaQuantidade: z.coerce.number().positive(),
    observacoes: z.string().optional(),
  })

  app.get('/metas', {
    schema: {
      querystring: z.object({
        empreendimentoId: z.string().uuid().optional(),
        ano: z.coerce.number().int().optional(),
      }),
      tags: ['logistica-reversa'],
    },
  }, async (req, reply) => {
    const metas = await logisticaReversaService.listarMetas(ctx(req), req.query)
    return reply.send({ data: metas })
  })

  app.put('/metas', {
    schema: {
      body: metaSchema,
      response: { 200: z.object({ data: z.record(z.unknown()) }) },
      tags: ['logistica-reversa'],
    },
  }, async (req, reply) => {
    const meta = await logisticaReversaService.upsertMeta(ctx(req), req.body)
    return reply.send({ data: meta })
  })

  app.delete('/metas/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['logistica-reversa'] },
  }, async (req, reply) => {
    await logisticaReversaService.deletarMeta(ctx(req), req.params.id)
    return reply.status(204).send()
  })

  app.get('/metas/relatorio', {
    schema: {
      querystring: z.object({
        empreendimentoId: z.string().uuid(),
        ano: z.coerce.number().int().min(2020).max(2100),
      }),
      tags: ['logistica-reversa'],
    },
  }, async (req, reply) => {
    const data = await logisticaReversaService.relatorioMetas(ctx(req), req.query.empreendimentoId, req.query.ano)
    return reply.send({ data })
  })
}
