import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { fiscalizacoesService } from './fiscalizacoes.service.js'
import type { StatusAutoInfracao } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// FISCALIZAÇÕES ROUTES — Autos de Infração + Recursos Administrativos
// ─────────────────────────────────────────────────────────────────────────────

const statusValues = [
  'RECEBIDO', 'EM_DEFESA', 'AGUARDANDO_JULGAMENTO',
  'JULGADO_FAVORAVEL', 'JULGADO_DESFAVORAVEL', 'EM_RECURSO', 'ENCERRADO', 'PAGO',
] as const

const instanciaValues = ['PRIMEIRA', 'SEGUNDA', 'TERCEIRA', 'JUDICIAL'] as const

const criarAutoSchema = z.object({
  empreendimentoId: z.string().uuid(),
  orgao: z.string().min(1),
  numeroAuto: z.string().min(1),
  dataLavratura: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataRecebimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  artigo: z.string().optional(),
  descricao: z.string().min(1),
  valorMulta: z.number().positive().optional(),
  prazoDefesa: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observacoes: z.string().optional(),
})

const criarRecursoSchema = z.object({
  instancia: z.enum(instanciaValues),
  dataProtocolo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  prazoResposta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  numeroProtocolo: z.string().optional(),
  observacoes: z.string().optional(),
})

const atualizarRecursoSchema = z.object({
  resultado: z.string().optional(),
  dataJulgamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  numeroProtocolo: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
})

export const fiscalizacoesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({ id: req.user.id, tenantId: req.user.tenantId, perfil: req.user.perfil })

  // GET / — list autos
  app.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        empreendimentoId: z.string().uuid().optional(),
        status: z.string().optional(),
        orgao: z.string().optional(),
      }),
      tags: ['fiscalizacoes'],
    },
  }, async (req, reply) => {
    const result = await fiscalizacoesService.listar(ctx(req), req.query)
    return reply.send({ data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) } })
  })

  // POST / — create auto
  app.post('/', {
    schema: { body: criarAutoSchema, tags: ['fiscalizacoes'] },
  }, async (req, reply) => {
    const auto = await fiscalizacoesService.criar(ctx(req), req.body)
    return reply.status(201).send({ data: auto })
  })

  // GET /:id — detail with recursos
  app.get('/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['fiscalizacoes'] },
  }, async (req, reply) => {
    const auto = await fiscalizacoesService.buscarPorId(ctx(req), req.params.id)
    return reply.send(auto)
  })

  // PATCH /:id/status — update status
  app.patch('/:id/status', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        status: z.enum(statusValues),
        observacoes: z.string().optional(),
      }),
      tags: ['fiscalizacoes'],
    },
  }, async (req, reply) => {
    const auto = await fiscalizacoesService.atualizarStatus(ctx(req), req.params.id, req.body.status as StatusAutoInfracao, req.body.observacoes)
    return reply.send(auto)
  })

  // POST /:id/recursos — create recurso (atomic)
  app.post('/:id/recursos', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: criarRecursoSchema,
      tags: ['fiscalizacoes'],
    },
  }, async (req, reply) => {
    const recurso = await fiscalizacoesService.criarRecurso(ctx(req), req.params.id, req.body)
    return reply.status(201).send({ data: recurso })
  })

  // PATCH /:id/recursos/:rid — update recurso result
  app.patch('/:id/recursos/:rid', {
    schema: {
      params: z.object({ id: z.string().uuid(), rid: z.string().uuid() }),
      body: atualizarRecursoSchema,
      tags: ['fiscalizacoes'],
    },
  }, async (req, reply) => {
    const recurso = await fiscalizacoesService.atualizarRecurso(ctx(req), req.params.id, req.params.rid, req.body)
    return reply.send(recurso)
  })
}
