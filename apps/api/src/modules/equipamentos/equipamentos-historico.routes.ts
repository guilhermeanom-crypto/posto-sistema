import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { equipamentosHistoricoService } from './equipamentos-historico.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPAMENTOS HISTÓRICO ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const tipoEquipValues = ['TANQUE', 'BOMBA', 'LINHA', 'SENSOR', 'CAIXA_SEPARADORA', 'SRV', 'OUTROS'] as const
const tipoEventoValues = [
  'MANUTENCAO_PREVENTIVA', 'MANUTENCAO_CORRETIVA', 'CALIBRACAO', 'SUBSTITUICAO',
  'OCORRENCIA', 'DESATIVACAO', 'REATIVACAO', 'INSTALACAO', 'VISTORIA',
] as const

const registrarEventoSchema = z.object({
  empreendimentoId: z.string().uuid(),
  equipamentoTipo: z.enum(tipoEquipValues),
  equipamentoId: z.string().uuid(),
  tipoEvento: z.enum(tipoEventoValues),
  dataEvento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descricao: z.string().min(1),
  responsavel: z.string().optional(),
  custo: z.number().positive().optional(),
  documentoId: z.string().uuid().optional(),
  observacoes: z.string().optional(),
})

export const equipamentosHistoricoRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({
    id: req.user.id,
    tenantId: req.user.tenantId,
    nome: req.user.nome,
    email: req.user.email,
    ip: req.ip,
  })

  // GET /:tipo/:equipId — listar histórico de um equipamento
  app.get('/:tipo/:equipId', {
    schema: {
      params: z.object({
        tipo: z.enum(tipoEquipValues),
        equipId: z.string().uuid(),
      }),
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      }),
      tags: ['equipamentos-historico'],
      summary: 'Histórico técnico de um equipamento',
    },
  }, async (req, reply) => {
    const result = await equipamentosHistoricoService.listar(
      ctx(req),
      req.params.tipo,
      req.params.equipId,
      req.query,
    )
    return reply.send({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })

  // POST / — registrar evento
  app.post('/', {
    schema: { body: registrarEventoSchema, tags: ['equipamentos-historico'] },
  }, async (req, reply) => {
    const evento = await equipamentosHistoricoService.registrar(ctx(req), req.body)
    return reply.status(201).send({ data: evento })
  })

  // GET /empreendimento/:empId — histórico por empreendimento
  app.get('/empreendimento/:empId', {
    schema: {
      params: z.object({ empId: z.string().uuid() }),
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        tipo: z.enum(tipoEquipValues).optional(),
      }),
      tags: ['equipamentos-historico'],
      summary: 'Histórico de todos os equipamentos de um empreendimento',
    },
  }, async (req, reply) => {
    const result = await equipamentosHistoricoService.listarPorEmpreendimento(ctx(req), req.params.empId, req.query)
    return reply.send({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })
}
