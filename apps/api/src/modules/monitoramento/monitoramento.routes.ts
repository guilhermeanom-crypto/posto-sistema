import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { monitoramentoService } from './monitoramento.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// MONITORAMENTO ROUTES — Campanhas + Poços
// ─────────────────────────────────────────────────────────────────────────────

const pagSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  empreendimentoId: z.string().uuid().optional(),
})

const tiposCampanha = ['SOLO', 'AGUA_SUBTERRANEA', 'VAPOR', 'AR'] as const
const resultados = ['CONFORME', 'ATENCAO', 'NAO_CONFORME'] as const

const parametroSchema = z.object({
  nome: z.string().min(1),
  valorMedido: z.coerce.number(),
  limiteVMP: z.coerce.number().optional(),
  unidade: z.string().min(1),
  emAlerta: z.boolean().default(false),
})

const criarCampanhaSchema = z.object({
  empreendimentoId: z.string().uuid(),
  pocoMonitoramentoId: z.string().uuid().optional(),
  tipo: z.enum(tiposCampanha),
  dataColeta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  laboratorio: z.string().min(1),
  resultado: z.enum(resultados),
  observacoes: z.string().optional(),
  parametros: z.array(parametroSchema).optional(),
})

const criarPocoSchema = z.object({
  empreendimentoId: z.string().uuid(),
  codigo: z.string().min(1),
  profundidade: z.coerce.number().positive().optional(),
  coordenadas: z.string().optional(),
  dataInstalacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const monitoramentoRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({ id: req.user.id, tenantId: req.user.tenantId, perfil: req.user.perfil })

  // ── Campanhas ─────────────────────────────────────────────────────────────────

  app.get('/campanhas', {
    schema: {
      querystring: pagSchema.extend({ tipo: z.enum(tiposCampanha).optional(), resultado: z.enum(resultados).optional() }),
      tags: ['monitoramento'],
    },
  }, async (req, reply) => {
    const result = await monitoramentoService.listarCampanhas(ctx(req), req.query)
    return reply.send({ data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) } })
  })

  app.post('/campanhas', {
    schema: { body: criarCampanhaSchema, response: { 201: z.object({ data: z.record(z.unknown()) }) }, tags: ['monitoramento'] },
  }, async (req, reply) => {
    const campanha = await monitoramentoService.criarCampanha(ctx(req), req.body)
    return reply.status(201).send({ data: campanha })
  })

  app.get('/campanhas/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['monitoramento'] },
  }, async (req, reply) => {
    const campanha = await monitoramentoService.buscarCampanhaPorId(ctx(req), req.params.id)
    return reply.send({ data: campanha })
  })

  // ── Poços de Monitoramento ────────────────────────────────────────────────────

  app.get('/pocos', {
    schema: { querystring: pagSchema, tags: ['monitoramento'] },
  }, async (req, reply) => {
    const result = await monitoramentoService.listarPocos(ctx(req), req.query)
    return reply.send({ data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) } })
  })

  app.post('/pocos', {
    schema: { body: criarPocoSchema, response: { 201: z.object({ data: z.record(z.unknown()) }) }, tags: ['monitoramento'] },
  }, async (req, reply) => {
    const poco = await monitoramentoService.criarPoco(ctx(req), req.body)
    return reply.status(201).send({ data: poco })
  })

  app.get('/pocos/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['monitoramento'] },
  }, async (req, reply) => {
    const poco = await monitoramentoService.buscarPocoPorId(ctx(req), req.params.id)
    return reply.send({ data: poco })
  })

  app.patch('/pocos/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        periodicidade: z.enum(['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']).nullable().optional(),
        proximaColeta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        status: z.enum(['ATIVO', 'INATIVO', 'DANIFICADO']).optional(),
        observacoes: z.string().nullable().optional(),
      }),
      tags: ['monitoramento'],
    },
  }, async (req, reply) => {
    const poco = await monitoramentoService.atualizarPoco(ctx(req), req.params.id, {
      periodicidade: req.body.periodicidade ?? undefined,
      proximaColeta: req.body.proximaColeta ?? undefined,
      status: req.body.status,
      observacoes: req.body.observacoes ?? undefined,
    })
    return reply.send({ data: poco })
  })

  app.get('/pocos/:id/tendencia', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['monitoramento'] },
  }, async (req, reply) => {
    const data = await monitoramentoService.tendenciaParametros(ctx(req), req.params.id)
    return reply.send({ data })
  })

  // ── Limites de Parâmetros ──────────────────────────────────────────────────

  const limiteSchema = z.object({
    nomeParametro: z.string().min(1),
    tipoMedio: z.enum(['SOLO', 'AGUA_SUBTERRANEA', 'VAPOR', 'AR']),
    limiteVMP: z.coerce.number().positive(),
    unidade: z.string().min(1),
    referencia: z.string().optional(),
  })

  app.get('/limites', {
    schema: {
      querystring: z.object({ tipoMedio: z.enum(['SOLO', 'AGUA_SUBTERRANEA', 'VAPOR', 'AR']).optional() }),
      tags: ['monitoramento'],
    },
  }, async (req, reply) => {
    const data = await monitoramentoService.listarLimites(ctx(req), req.query.tipoMedio)
    return reply.send({ data })
  })

  app.put('/limites', {
    schema: { body: limiteSchema, tags: ['monitoramento'] },
  }, async (req, reply) => {
    const data = await monitoramentoService.upsertLimite(ctx(req), req.body)
    return reply.send({ data })
  })

  app.delete('/limites/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['monitoramento'] },
  }, async (req, reply) => {
    await monitoramentoService.deletarLimite(ctx(req), req.params.id)
    return reply.status(204).send()
  })
}
