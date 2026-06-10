import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { ForbiddenError } from '../../shared/errors/app-errors.js'
import { handoffsService } from './handoffs.service.js'
import {
  atualizarHandoffComercialSchema,
  filtrosHandoffComercialSchema,
  handoffComercialDetalheSchema,
  handoffComercialResumoSchema,
} from './handoffs.schemas.js'

const PERFIS_AUTORIZADOS_LEITURA_HANDOFF = [
  'EXECUTIVO',
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

const PERFIS_AUTORIZADOS_ATUALIZACAO_HANDOFF = [
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

function assertPodeLerHandoffs(perfil: string) {
  if (!PERFIS_AUTORIZADOS_LEITURA_HANDOFF.includes(perfil as (typeof PERFIS_AUTORIZADOS_LEITURA_HANDOFF)[number])) {
    throw new ForbiddenError('Sem permissão para visualizar handoffs comerciais')
  }
}

function assertPodeAtualizarHandoffs(perfil: string) {
  if (!PERFIS_AUTORIZADOS_ATUALIZACAO_HANDOFF.includes(perfil as (typeof PERFIS_AUTORIZADOS_ATUALIZACAO_HANDOFF)[number])) {
    throw new ForbiddenError('Sem permissão para atualizar handoffs comerciais')
  }
}

export const handoffsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  app.get(
    '/',
    {
      schema: {
        querystring: filtrosHandoffComercialSchema,
        response: {
          200: z.object({
            data: z.array(handoffComercialResumoSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
        tags: ['operacao', 'handoffs'],
        summary: 'Lista handoffs comerciais do tenant com filtros básicos',
      },
    },
    async (request, reply) => {
      assertPodeLerHandoffs(request.user.perfil)

      const result = await handoffsService.listar({
        tenantId: request.user.tenantId,
        ...request.query,
      })

      return reply.status(200).send({
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      })
    },
  )

  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.object({
            data: handoffComercialDetalheSchema,
          }),
        },
        tags: ['operacao', 'handoffs'],
        summary: 'Retorna o detalhe saneado de um handoff comercial',
      },
    },
    async (request, reply) => {
      assertPodeLerHandoffs(request.user.perfil)

      const handoff = await handoffsService.buscarPorId({
        tenantId: request.user.tenantId,
        id: request.params.id,
      })

      return reply.status(200).send({ data: handoff })
    },
  )

  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarHandoffComercialSchema,
        response: {
          200: z.object({
            data: handoffComercialDetalheSchema,
          }),
        },
        tags: ['operacao', 'handoffs'],
        summary: 'Atualiza dados operacionais controlados de um handoff comercial',
      },
    },
    async (request, reply) => {
      if (!PERFIS_AUTORIZADOS_ATUALIZACAO_HANDOFF.includes(
        request.user.perfil as (typeof PERFIS_AUTORIZADOS_ATUALIZACAO_HANDOFF)[number],
      )) {
        if (request.body.status === 'EM_PLANEJAMENTO') {
          throw new ForbiddenError('Seu perfil não possui permissão para aceitar este handoff operacional.')
        }

        assertPodeAtualizarHandoffs(request.user.perfil)
      }

      const handoff = await handoffsService.atualizar({
        tenantId: request.user.tenantId,
        id: request.params.id,
        usuarioId: request.user.id,
        data: request.body,
      })

      return reply.status(200).send({ data: handoff })
    },
  )
}
