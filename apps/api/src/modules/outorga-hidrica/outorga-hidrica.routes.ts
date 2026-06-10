import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { outorgaHidricaService } from './outorga-hidrica.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// OUTORGA HÍDRICA ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const pagSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  empreendimentoId: z.string().uuid().optional(),
})

const criarPocoSchema = z.object({
  empreendimentoId: z.string().uuid(),
  codigo: z.string().min(1),
  profundidade: z.coerce.number().positive().optional(),
  coordenadas: z.string().optional(),
  outorgaDAEE: z.string().optional(),
  validadeOutorga: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vazaoAutorizada: z.coerce.number().positive().optional(),
  dataPerforacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  observacoes: z.string().optional(),
})

const parametroSchema = z.object({
  nome: z.string().min(1),
  valorMedido: z.coerce.number(),
  limiteVMP: z.coerce.number().optional(),
  unidade: z.string().min(1),
  conforme: z.boolean(),
})

const criarLaudoSchema = z.object({
  dataCampanha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  laboratorio: z.string().min(1),
  resultado: z.enum(['CONFORME', 'ATENCAO', 'NAO_CONFORME']),
  parametros: z.array(parametroSchema).min(1),
  observacoes: z.string().optional(),
})

export const outorgaHidricaRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({ id: req.user.id, tenantId: req.user.tenantId, perfil: req.user.perfil })

  app.get('/', {
    schema: {
      querystring: pagSchema.extend({ status: z.enum(['ATIVO', 'INATIVO', 'INTERDITADO', 'SELADO']).optional() }),
      tags: ['outorga-hidrica'],
      summary: 'Lista poços artesianos',
    },
  }, async (req, reply) => {
    const result = await outorgaHidricaService.listarPocos(ctx(req), req.query)
    return reply.send({ data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) } })
  })

  app.post('/', {
    schema: { body: criarPocoSchema, response: { 201: z.object({ data: z.record(z.unknown()) }) }, tags: ['outorga-hidrica'] },
  }, async (req, reply) => {
    const poco = await outorgaHidricaService.criarPoco(ctx(req), req.body)
    return reply.status(201).send({ data: poco })
  })

  app.get('/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['outorga-hidrica'] },
  }, async (req, reply) => {
    const poco = await outorgaHidricaService.buscarPocoPorId(ctx(req), req.params.id)
    return reply.send({ data: poco })
  })

  app.post('/:id/laudos', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: criarLaudoSchema,
      response: { 201: z.object({ data: z.record(z.unknown()) }) },
      tags: ['outorga-hidrica'],
      summary: 'Registra laudo de análise de água do poço',
    },
  }, async (req, reply) => {
    const laudo = await outorgaHidricaService.criarLaudo(ctx(req), req.params.id, req.body)
    return reply.status(201).send({ data: laudo })
  })
}
