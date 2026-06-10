import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { relatoriosService } from './relatorios.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIOS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const tipoValues = [
  'COMPLIANCE_GERAL', 'VENCIMENTOS', 'SST',
  'MONITORAMENTO_AMBIENTAL', 'LOGISTICA_REVERSA', 'AUTOS_INFRACAO', 'AUDIT_LOG',
] as const

export const relatoriosRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({ id: req.user.id, tenantId: req.user.tenantId })

  // POST / — solicitar geração
  app.post('/', {
    schema: {
      body: z.object({
        tipo: z.enum(tipoValues),
        parametros: z.record(z.unknown()).default({}),
      }),
      tags: ['relatorios'],
    },
  }, async (req, reply) => {
    const result = await relatoriosService.solicitar(ctx(req), req.body)
    return reply.status(result.aguardando ? 200 : 202).send({ data: result.relatorio, aguardando: result.aguardando })
  })

  // GET / — listar relatórios do tenant
  app.get('/', {
    schema: { tags: ['relatorios'] },
  }, async (req, reply) => {
    const relatorios = await relatoriosService.listar(ctx(req))
    return reply.send({ data: relatorios })
  })

  // GET /:id/download — URL de download temporária
  app.get('/:id/download', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      tags: ['relatorios'],
    },
  }, async (req, reply) => {
    const result = await relatoriosService.obterDownload(ctx(req), req.params.id)
    return reply.send(result)
  })

  // DELETE /:id — remover relatório + arquivo S3
  app.delete('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      tags: ['relatorios'],
    },
  }, async (req, reply) => {
    await relatoriosService.remover(ctx(req), req.params.id)
    return reply.status(204).send()
  })
}
