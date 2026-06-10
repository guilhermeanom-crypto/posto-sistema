import crypto from 'node:crypto'
import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { ForbiddenError } from '../../shared/errors/app-errors.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'
import { integracoesItecologicaService } from './integracoes-itecologica.service.js'

/** Comparação de segredo em tempo constante (evita timing attack) */
function segredoConfere(recebido: string, esperado: string): boolean {
  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

const crmWinHeadersSchema = z.object({
  'x-integration-key': z.string().min(1),
  'x-source-system': z.string().min(1).optional(),
  'x-idempotency-key': z.string().min(1).optional(),
})

const crmWinBodySchema = z.object({
  handoff_id: z.string().uuid(),
  handoff_version: z.number().int().min(1),
  occurred_at: z.string().datetime(),
  idempotency_key: z.string().min(1),
  target_tenant_slug: z.string().min(1),
  source: z.object({
    lead_id: z.string().uuid(),
    lead_status: z.string().min(1),
    qualification_status: z.string().optional().nullable(),
    assigned_to: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    source_page: z.string().optional().nullable(),
    utm_source: z.string().optional().nullable(),
    utm_medium: z.string().optional().nullable(),
    utm_campaign: z.string().optional().nullable(),
  }),
  company: z.object({
    company_name: z.string().min(1),
    legal_name: z.string().min(1),
    cnpj: z.string().min(14),
    primary_contact_name: z.string().min(1),
    primary_contact_email: z.string().email(),
    primary_contact_phone: z.string().min(8),
  }),
  enterprise: z.object({
    enterprise_name: z.string().min(1),
    enterprise_type: z.enum(['revendedor', 'distribuidor', 'transportador', 'outros']),
    brand: z.string().optional().nullable(),
    logradouro: z.string().min(1),
    numero: z.string().min(1),
    complemento: z.string().optional().nullable(),
    bairro: z.string().min(1),
    cidade: z.string().min(1),
    estado: z.string().length(2),
    cep: z.string().min(8),
    atividades: z.array(z.string().min(1)).min(1),
    data_inicio_operacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  }),
  diagnosis: z.object({
    diagnosis_case_id: z.string().uuid(),
    diagnosis_type: z.string().min(1),
    briefing_summary: z.string().optional().nullable(),
    declared_need: z.string().optional().nullable(),
    territorial_scope: z.string().optional().nullable(),
    recommended_next_step: z.string().optional().nullable(),
    official_diagnostic_artifact_id: z.string().uuid().optional().nullable(),
    official_execution_plan_artifact_id: z.string().uuid().optional().nullable(),
    official_artifacts_generated_at: z.string().datetime().optional().nullable(),
    official_diagnostic_result: z.record(z.unknown()).optional().nullable(),
    official_execution_plan: z.record(z.unknown()).optional().nullable(),
  }),
  commercial: z.object({
    proposal_external_id: z.string().min(1),
    proposal_value: z.number().nonnegative().optional().nullable(),
    proposal_scope_summary: z.string().optional().nullable(),
    commercial_notes: z.string().optional().nullable(),
  }),
  operation: z.object({
    responsavel_tecnico_nome: z.string().optional().nullable(),
    responsavel_tecnico_crea: z.string().optional().nullable(),
    responsavel_tecnico_email: z.string().email().optional().nullable(),
    operational_owner_email: z.string().email().optional().nullable(),
    initial_task_title: z.string().min(1),
    initial_task_description: z.string().optional().nullable(),
    initial_due_date: z.string().datetime().optional().nullable(),
  }),
})

const eventosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().min(1).optional(),
  sourceSystem: z.string().min(1).optional(),
  leadId: z.string().uuid().optional(),
  handoffId: z.string().uuid().optional(),
})

function exigirLeituraIntegracao(request: FastifyRequest) {
  if (!['SUPER_ADMIN', 'ADMIN_TENANT', 'COORDENADOR', 'ANALISTA'].includes(request.user.perfil)) {
    throw new ForbiddenError('Perfil sem permissao para consultar eventos de integracao')
  }
}

export const integracoesItecologicaRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/itecologica/eventos',
    {
      preHandler: [authenticate],
      schema: {
        querystring: eventosQuerySchema,
        tags: ['integracoes'],
        summary: 'Lista eventos de integracao recebidos da ITECOLOGICA',
      },
    },
    async (request, reply) => {
      exigirLeituraIntegracao(request)

      const result = await integracoesItecologicaService.listEventos({
        tenantId: request.user.tenantId,
        page: request.query.page,
        limit: request.query.limit,
        status: request.query.status,
        sourceSystem: request.query.sourceSystem,
        leadId: request.query.leadId,
        handoffId: request.query.handoffId,
      })

      return reply.status(200).send({
        data: result.items,
        pagination: result.pagination,
      })
    },
  )

  app.get(
    '/itecologica/eventos/:id',
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['integracoes'],
        summary: 'Detalha um evento de integracao da ITECOLOGICA',
      },
    },
    async (request, reply) => {
      exigirLeituraIntegracao(request)

      const event = await integracoesItecologicaService.getEventoById({
        tenantId: request.user.tenantId,
        eventId: request.params.id,
      })

      return reply.status(200).send({ data: event })
    },
  )

  app.post(
    '/itecologica/eventos/:id/reprocessar',
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['integracoes'],
        summary: 'Reprocessa um evento de integracao da ITECOLOGICA',
      },
    },
    async (request, reply) => {
      exigirLeituraIntegracao(request)

      const result = await integracoesItecologicaService.reprocessEvento({
        tenantId: request.user.tenantId,
        eventId: request.params.id,
        requester: {
          id: request.user.id,
          nome: request.user.nome,
          email: request.user.email,
          perfil: request.user.perfil,
        },
        ipOrigem: extrairIp(request),
        userAgent: request.headers['user-agent'],
      })

      return reply.status(200).send({
        data: {
          reprocessed: !result.alreadyMaterialized,
          alreadyMaterialized: result.alreadyMaterialized,
          event: result.event,
          materialization: result.summary,
        },
      })
    },
  )

  app.post(
    '/itecologica/crm-win',
    {
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
      schema: {
        headers: crmWinHeadersSchema,
        body: crmWinBodySchema,
        tags: ['integracoes'],
        summary: 'Recebe handoff operacional da ITECOLOGICA',
      },
    },
    async (request, reply) => {
      if (!env.INTEGRATION_SHARED_SECRET) {
        return reply.status(503).send({
          error: {
            code: 'INTEGRATION_NOT_CONFIGURED',
            message: 'INTEGRATION_SHARED_SECRET não configurado no ambiente',
          },
        })
      }

      if (!segredoConfere(request.headers['x-integration-key'], env.INTEGRATION_SHARED_SECRET)) {
        return reply.status(401).send({
          error: {
            code: 'UNAUTHORIZED_INTEGRATION',
            message: 'Chave de integração inválida',
          },
        })
      }

      const sourceSystem = request.headers['x-source-system']?.trim().toLowerCase() || 'itecologica'
      if (sourceSystem !== 'itecologica') {
        return reply.status(403).send({
          error: {
            code: 'FORBIDDEN_SOURCE_SYSTEM',
            message: 'Sistema de origem não autorizado para esta rota',
          },
        })
      }

      const headerIdempotencyKey = request.headers['x-idempotency-key']?.trim()
      const bodyIdempotencyKey = request.body.idempotency_key.trim()
      if (headerIdempotencyKey && headerIdempotencyKey !== bodyIdempotencyKey) {
        return reply.status(409).send({
          error: {
            code: 'IDEMPOTENCY_KEY_MISMATCH',
            message: 'X-Idempotency-Key divergente do payload',
          },
        })
      }

      const result = await integracoesItecologicaService.receiveCrmWin({
        body: request.body,
        idempotencyKey: headerIdempotencyKey || bodyIdempotencyKey,
        sourceSystem,
        ipOrigem: request.ip,
        userAgent: request.headers['user-agent'],
      })

      if (result.existing) {
        return reply.status(200).send({
          data: {
            accepted: true,
            duplicate: true,
            materialized: result.event.status === 'materialized',
            tenant: result.tenant,
            event: result.event,
            materialization: result.summary,
          },
        })
      }

      return reply.status(200).send({
        data: {
          accepted: true,
          duplicate: false,
          materialized: result.event.status === 'materialized',
          tenant: result.tenant,
          event: result.event,
          materialization: result.summary,
        },
      })
    },
  )
}
