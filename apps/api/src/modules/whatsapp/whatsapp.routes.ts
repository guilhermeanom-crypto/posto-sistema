import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { whatsappQueue } from '../../infra/queue/bullmq.js'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { env } from '../../config/env.js'

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Payload do webhook Z-API
const zapiWebhookSchema = z.object({
  phone: z.string(),
  isGroup: z.boolean().default(false),
  type: z.string().optional(),
  message: z.object({
    conversation: z.string().optional(),
    imageMessage: z.object({ caption: z.string().optional() }).optional(),
    documentMessage: z.object({ caption: z.string().optional() }).optional(),
  }).optional(),
  text: z.object({ message: z.string() }).optional(),
}).passthrough()

export const whatsappRoutes: FastifyPluginAsyncZod = async (app) => {
  // ── Webhook Z-API (sem autenticação JWT — usa Client-Token header) ──────────
  app.post('/webhook', {
    schema: {
      querystring: z.object({ tenantId: z.string().uuid().optional() }),
      body: zapiWebhookSchema.optional(),
      tags: ['whatsapp'],
    },
  }, async (req, reply) => {
    // Verifica token do webhook. Fail-closed: em produção, sem token configurado o
    // webhook NÃO pode ficar público (evita injeção de leads/jobs em qualquer tenant).
    const clientToken = req.headers['client-token']
    if (!env.ZAPI_CLIENT_TOKEN) {
      if (env.NODE_ENV === 'production') {
        return reply.status(503).send({ error: 'Webhook do WhatsApp não configurado' })
      }
    } else if (clientToken !== env.ZAPI_CLIENT_TOKEN) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const body = req.body as z.infer<typeof zapiWebhookSchema> | undefined
    if (!body) return reply.send({ ok: true })

    // Ignora grupos e mensagens de saída
    if (body.isGroup) return reply.send({ ok: true })
    if (body.type === 'DeliveryCallback' || body.type === 'ReadCallback') return reply.send({ ok: true })

    const numero = body.phone?.replace(/\D/g, '')
    const texto = body.message?.conversation
      ?? body.message?.imageMessage?.caption
      ?? body.message?.documentMessage?.caption
      ?? body.text?.message

    if (!numero || !texto) return reply.send({ ok: true })

    // Determina tipo de mensagem
    const tipo = body.message?.imageMessage ? 'IMAGEM'
      : body.message?.documentMessage ? 'DOCUMENTO'
      : 'TEXTO'

    // tenantId opcional — necessário para criação de leads comerciais.
    // Cada tenant configura Z-API com ?tenantId=<uuid> na URL do webhook.
    const tenantId = req.query.tenantId

    // Enfileira processamento assíncrono
    await whatsappQueue.add('mensagem-recebida', { numero, texto, tipo, tenantId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    })

    return reply.send({ ok: true })
  })

  // ── Rotas autenticadas — configuração de contatos ──────────────────────────
  app.addHook('preHandler', authenticate)
  const tid = (req: FastifyRequest) => req.user.tenantId

  // GET /contatos — lista contatos cadastrados
  app.get('/contatos', { schema: { tags: ['whatsapp'] } }, async (req, reply) => {
    const contatos = await prisma.contatoWhatsApp.findMany({
      where: { tenantId: tid(req) },
      include: { empreendimento: { select: { id: true, nome: true } } },
      orderBy: { criadoEm: 'desc' },
    })
    return reply.send({ data: contatos })
  })

  // POST /contatos — cadastra contato
  app.post('/contatos', {
    schema: {
      body: z.object({
        numero: z.string().regex(/^\d{10,15}$/, 'Número inválido — informe apenas dígitos (ex: 5511999999999)'),
        nome: z.string().optional(),
        empreendimentoId: z.string().uuid().optional(),
      }),
      tags: ['whatsapp'],
    },
  }, async (req, reply) => {
    const contato = await prisma.contatoWhatsApp.upsert({
      where: { tenantId_numero: { tenantId: tid(req), numero: req.body.numero } },
      update: { nome: req.body.nome, empreendimentoId: req.body.empreendimentoId, ativo: true },
      create: {
        tenantId: tid(req),
        numero: req.body.numero,
        nome: req.body.nome,
        empreendimentoId: req.body.empreendimentoId,
      },
    })
    return reply.status(201).send({ data: contato })
  })

  // DELETE /contatos/:id — remove contato
  app.delete('/contatos/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['whatsapp'] },
  }, async (req, reply) => {
    await prisma.contatoWhatsApp.updateMany({
      where: { id: req.params.id, tenantId: tid(req) },
      data: { ativo: false },
    })
    return reply.send({ ok: true })
  })

  // GET /mensagens — histórico de mensagens
  app.get('/mensagens', {
    schema: {
      querystring: z.object({
        numero: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      }),
      tags: ['whatsapp'],
    },
  }, async (req, reply) => {
    const mensagens = await prisma.mensagemWhatsApp.findMany({
      where: {
        tenantId: tid(req),
        ...(req.query.numero ? { numero: req.query.numero } : {}),
      },
      orderBy: { criadoEm: 'desc' },
      take: req.query.limit,
    })
    return reply.send({ data: mensagens })
  })

  // POST /enviar — envia mensagem manual
  app.post('/enviar', {
    schema: {
      body: z.object({
        numero: z.string().regex(/^\d{10,15}$/),
        mensagem: z.string().min(1).max(4096),
      }),
      tags: ['whatsapp'],
    },
  }, async (req, reply) => {
    await whatsappQueue.add('enviar-texto', { numero: req.body.numero, mensagem: req.body.mensagem }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    })

    await prisma.mensagemWhatsApp.create({
      data: {
        tenantId: tid(req),
        numero: req.body.numero,
        direcao: 'ENVIADA',
        tipo: 'TEXTO',
        conteudo: req.body.mensagem,
      },
    })

    return reply.status(202).send({ message: 'Mensagem enfileirada.' })
  })

  // ── Leads comerciais (prospects via WhatsApp) ──────────────────────────────

  // GET /leads — lista leads com filtro opcional de status
  app.get('/leads', {
    schema: {
      querystring: z.object({
        status: z.enum(['NOVO', 'EM_CONVERSA', 'QUALIFICADO', 'DESCARTADO']).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      }),
      tags: ['whatsapp'],
    },
  }, async (req, reply) => {
    const tenantId = tid(req)
    const leads = await prisma.leadWhatsApp.findMany({
      where: { tenantId, ...(req.query.status ? { status: req.query.status } : {}) },
      orderBy: { criadoEm: 'desc' },
      take: req.query.limit,
      include: {
        mensagens: {
          orderBy: { criadoEm: 'desc' },
          take: 1,
          select: { conteudo: true, criadoEm: true, direcao: true },
        },
        _count: { select: { mensagens: true } },
      },
    })
    return reply.send({ data: leads })
  })

  // GET /leads/:id/mensagens — histórico completo de um lead
  app.get('/leads/:id/mensagens', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      tags: ['whatsapp'],
    },
  }, async (req, reply) => {
    const lead = await prisma.leadWhatsApp.findFirst({
      where: { id: req.params.id, tenantId: tid(req) },
      select: { id: true },
    })
    if (!lead) return reply.status(404).send({ error: 'Lead não encontrado' })
    const mensagens = await prisma.mensagemLead.findMany({
      where: { leadId: lead.id },
      orderBy: { criadoEm: 'asc' },
    })
    return reply.send({ data: mensagens })
  })

  // PATCH /leads/:id — atualiza status ou notas de um lead
  app.patch('/leads/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        status: z.enum(['NOVO', 'EM_CONVERSA', 'QUALIFICADO', 'DESCARTADO']).optional(),
        notas: z.string().max(2000).optional(),
      }),
      tags: ['whatsapp'],
    },
  }, async (req, reply) => {
    const lead = await prisma.leadWhatsApp.updateMany({
      where: { id: req.params.id, tenantId: tid(req) },
      data: {
        ...(req.body.status ? { status: req.body.status } : {}),
        ...(req.body.notas !== undefined ? { notas: req.body.notas } : {}),
      },
    })
    if (lead.count === 0) return reply.status(404).send({ error: 'Lead não encontrado' })
    return reply.send({ ok: true })
  })

  // POST /leads/:id/mensagem — envia mensagem manual para um lead
  app.post('/leads/:id/mensagem', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ mensagem: z.string().min(1).max(4096) }),
      tags: ['whatsapp'],
    },
  }, async (req, reply) => {
    const lead = await prisma.leadWhatsApp.findFirst({ where: { id: req.params.id, tenantId: tid(req) } })
    if (!lead) return reply.status(404).send({ error: 'Lead não encontrado' })

    await whatsappQueue.add('enviar-texto', { numero: lead.numero, mensagem: req.body.mensagem }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    })

    await prisma.mensagemLead.create({
      data: { leadId: lead.id, direcao: 'ENVIADA', conteudo: req.body.mensagem },
    })

    return reply.status(202).send({ message: 'Mensagem enfileirada.' })
  })
}
