import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { ForbiddenError } from '../../shared/errors/app-errors.js'
import { entregaveisService } from './entregaveis.service.js'
import {
  cancelarEntregavelSchema,
  criarEntregavelSchema,
  entregavelDetalheSchema,
  entregavelKpisSchema,
  entregavelResumoSchema,
  filtrosEntregavelSchema,
} from './entregaveis.schemas.js'

const PERFIS_LEITURA_ENTREGAVEL = [
  'EXECUTIVO',
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

const PERFIS_GERENCIAMENTO_ENTREGAVEL = ['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'] as const

function assertPodeLer(perfil: string) {
  if (!PERFIS_LEITURA_ENTREGAVEL.includes(perfil as (typeof PERFIS_LEITURA_ENTREGAVEL)[number])) {
    throw new ForbiddenError('Sem permissão para consultar entregáveis.')
  }
}

function assertPodeGerenciar(perfil: string) {
  if (
    !PERFIS_GERENCIAMENTO_ENTREGAVEL.includes(
      perfil as (typeof PERFIS_GERENCIAMENTO_ENTREGAVEL)[number],
    )
  ) {
    throw new ForbiddenError('Sem permissão para gerenciar entregáveis.')
  }
}

export const entregaveisRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  app.post(
    '/',
    {
      schema: {
        body: criarEntregavelSchema,
        response: { 201: z.object({ data: entregavelDetalheSchema }) },
        tags: ['operacao', 'entregaveis'],
        summary: 'Cria um entregável a partir de uma ordem de serviço',
      },
    },
    async (request, reply) => {
      assertPodeGerenciar(request.user.perfil)
      const entregavel = await entregaveisService.criar({
        tenantId: request.user.tenantId,
        usuarioId: request.user.id,
        ...request.body,
      })
      return reply.status(201).send({ data: entregavel })
    },
  )

  app.get(
    '/',
    {
      schema: {
        querystring: filtrosEntregavelSchema,
        response: {
          200: z.object({
            data: z.array(entregavelResumoSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
        tags: ['operacao', 'entregaveis'],
        summary: 'Lista entregáveis com filtros',
      },
    },
    async (request, reply) => {
      assertPodeLer(request.user.perfil)
      const result = await entregaveisService.listar({
        tenantId: request.user.tenantId,
        ...request.query,
      })
      return reply.status(200).send({
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / Math.max(result.limit, 1)),
        },
      })
    },
  )

  app.get(
    '/kpis',
    {
      schema: {
        response: { 200: z.object({ data: entregavelKpisSchema }) },
        tags: ['operacao', 'entregaveis'],
        summary: 'KPIs agregados de entregáveis do tenant',
      },
    },
    async (request, reply) => {
      assertPodeLer(request.user.perfil)
      const kpis = await entregaveisService.kpis(request.user.tenantId)
      return reply.status(200).send({ data: kpis })
    },
  )

  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: { 200: z.object({ data: entregavelDetalheSchema }) },
        tags: ['operacao', 'entregaveis'],
        summary: 'Detalhe de um entregável do tenant',
      },
    },
    async (request, reply) => {
      assertPodeLer(request.user.perfil)
      const entregavel = await entregaveisService.buscarPorId({
        tenantId: request.user.tenantId,
        id: request.params.id,
      })
      return reply.status(200).send({ data: entregavel })
    },
  )

  app.patch(
    '/:id/cancelar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: cancelarEntregavelSchema,
        response: { 200: z.object({ data: entregavelDetalheSchema }) },
        tags: ['operacao', 'entregaveis'],
        summary: 'Cancela um entregável',
      },
    },
    async (request, reply) => {
      assertPodeGerenciar(request.user.perfil)
      const entregavel = await entregaveisService.cancelar({
        tenantId: request.user.tenantId,
        id: request.params.id,
        usuarioId: request.user.id,
      })
      return reply.status(200).send({ data: entregavel })
    },
  )
}
