import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { aiQueue } from '../../infra/queue/bullmq.js'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// IA ROUTES — enfileira jobs de análise e geração de documentos
// ─────────────────────────────────────────────────────────────────────────────

export const iaRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const tid = (req: FastifyRequest) => req.user.tenantId

  // ── POST /ia/licencas/:id/analisar ─────────────────────────────────────────
  app.post('/licencas/:id/analisar', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['ia'] },
  }, async (req, reply) => {
    const licenca = await prisma.licencaAmbiental.findFirst({
      where: { id: req.params.id, tenantId: tid(req) },
    })
    if (!licenca) throw new NotFoundError('LicencaAmbiental', req.params.id)
    if (!licenca.chaveS3) return reply.status(400).send({ error: 'Licença sem arquivo PDF. Faça o upload primeiro.' })

    await aiQueue.add('analisar-licenca', { licencaId: licenca.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
    })

    return reply.status(202).send({ message: 'Análise enfileirada. Aguarde alguns instantes e recarregue a página.' })
  })

  // ── GET /ia/licencas/:id/analise ───────────────────────────────────────────
  app.get('/licencas/:id/analise', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['ia'] },
  }, async (req, reply) => {
    const licenca = await prisma.licencaAmbiental.findFirst({
      where: { id: req.params.id, tenantId: tid(req) },
      select: { analiseIA: true, analisadoEm: true },
    })
    if (!licenca) throw new NotFoundError('LicencaAmbiental', req.params.id)
    return reply.send({ data: { analiseIA: licenca.analiseIA, analisadoEm: licenca.analisadoEm } })
  })

  // ── POST /ia/autos/:id/analisar ────────────────────────────────────────────
  app.post('/autos/:id/analisar', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['ia'] },
  }, async (req, reply) => {
    const auto = await prisma.autoInfracao.findFirst({
      where: { id: req.params.id, tenantId: tid(req) },
    })
    if (!auto) throw new NotFoundError('AutoInfracao', req.params.id)
    if (!auto.chaveS3) return reply.status(400).send({ error: 'Auto sem arquivo PDF. Faça o upload primeiro.' })

    await aiQueue.add('analisar-auto', { autoId: auto.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
    })

    return reply.status(202).send({ message: 'Análise enfileirada.' })
  })

  // ── POST /ia/autos/:id/gerar-defesa ───────────────────────────────────────
  app.post('/autos/:id/gerar-defesa', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['ia'] },
  }, async (req, reply) => {
    const auto = await prisma.autoInfracao.findFirst({
      where: { id: req.params.id, tenantId: tid(req) },
    })
    if (!auto) throw new NotFoundError('AutoInfracao', req.params.id)

    await aiQueue.add('gerar-defesa', { autoId: auto.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
    })

    return reply.status(202).send({ message: 'Geração de defesa enfileirada. Aguarde alguns instantes e recarregue a página.' })
  })

  // ── GET /ia/autos/:id/defesas ──────────────────────────────────────────────
  app.get('/autos/:id/defesas', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['ia'] },
  }, async (req, reply) => {
    const auto = await prisma.autoInfracao.findFirst({
      where: { id: req.params.id, tenantId: tid(req) },
    })
    if (!auto) throw new NotFoundError('AutoInfracao', req.params.id)

    const defesas = await prisma.defesaTecnica.findMany({
      where: { autoId: auto.id },
      orderBy: { geradoEm: 'desc' },
    })

    return reply.send({ data: defesas })
  })

  // ── PATCH /ia/defesas/:id ──────────────────────────────────────────────────
  app.patch('/defesas/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        revisaoHumana: z.string().optional(),
        status: z.enum(['RASCUNHO', 'REVISADO', 'ENVIADO']).optional(),
      }),
      tags: ['ia'],
    },
  }, async (req, reply) => {
    const defesa = await prisma.defesaTecnica.findUnique({ where: { id: req.params.id } })
    if (!defesa) throw new NotFoundError('DefesaTecnica', req.params.id)

    const updated = await prisma.defesaTecnica.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.revisaoHumana !== undefined && { revisaoHumana: req.body.revisaoHumana }),
        ...(req.body.status && { status: req.body.status }),
      },
    })

    return reply.send({ data: updated })
  })
}
