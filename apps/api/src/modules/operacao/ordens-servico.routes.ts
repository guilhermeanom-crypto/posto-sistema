import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { ForbiddenError } from '../../shared/errors/app-errors.js'
import { ordensServicoService } from './ordens-servico.service.js'
import {
  atualizarOrdemServicoSchema,
  criarOrdemServicoSchema,
  filtrosOrdemServicoSchema,
  ordemServicoDetalheSchema,
  ordemServicoKpisSchema,
  ordemServicoResumoSchema,
} from './ordens-servico.schemas.js'

const PERFIS_LEITURA_OS = [
  'EXECUTIVO',
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

const PERFIS_CRIACAO_OS = ['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'] as const

const PERFIS_ATUALIZACAO_OS = [
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

function assertPodeLerOS(perfil: string) {
  if (!PERFIS_LEITURA_OS.includes(perfil as (typeof PERFIS_LEITURA_OS)[number])) {
    throw new ForbiddenError('Sem permissão para consultar ordens de serviço.')
  }
}

function assertPodeCriarOS(perfil: string) {
  if (!PERFIS_CRIACAO_OS.includes(perfil as (typeof PERFIS_CRIACAO_OS)[number])) {
    throw new ForbiddenError('Sem permissão para criar ordens de serviço.')
  }
}

function assertPodeAtualizarOS(perfil: string) {
  if (!PERFIS_ATUALIZACAO_OS.includes(perfil as (typeof PERFIS_ATUALIZACAO_OS)[number])) {
    throw new ForbiddenError('Sem permissão para atualizar ordens de serviço.')
  }
}

export const ordensServicoRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  app.post(
    '/',
    {
      schema: {
        body: criarOrdemServicoSchema,
        response: { 201: z.object({ data: ordemServicoDetalheSchema }) },
        tags: ['operacao', 'ordens-servico'],
        summary: 'Cria uma OS a partir de um contrato ativo',
      },
    },
    async (request, reply) => {
      assertPodeCriarOS(request.user.perfil)
      const os = await ordensServicoService.criar({
        tenantId: request.user.tenantId,
        usuarioId: request.user.id,
        ...request.body,
      })
      return reply.status(201).send({ data: os })
    },
  )

  app.get(
    '/',
    {
      schema: {
        querystring: filtrosOrdemServicoSchema,
        response: {
          200: z.object({
            data: z.array(ordemServicoResumoSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
        tags: ['operacao', 'ordens-servico'],
        summary: 'Lista ordens de serviço com filtros',
      },
    },
    async (request, reply) => {
      assertPodeLerOS(request.user.perfil)
      const result = await ordensServicoService.listar({
        tenantId: request.user.tenantId,
        usuarioId: request.user.id,
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
        response: { 200: z.object({ data: ordemServicoKpisSchema }) },
        tags: ['operacao', 'ordens-servico'],
        summary: 'KPIs agregados de OSs do tenant',
      },
    },
    async (request, reply) => {
      assertPodeLerOS(request.user.perfil)
      const kpis = await ordensServicoService.kpis(request.user.tenantId)
      return reply.status(200).send({ data: kpis })
    },
  )

  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: { 200: z.object({ data: ordemServicoDetalheSchema }) },
        tags: ['operacao', 'ordens-servico'],
        summary: 'Detalhe de uma OS do tenant',
      },
    },
    async (request, reply) => {
      assertPodeLerOS(request.user.perfil)
      const os = await ordensServicoService.buscarPorId({
        tenantId: request.user.tenantId,
        id: request.params.id,
      })
      return reply.status(200).send({ data: os })
    },
  )

  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarOrdemServicoSchema,
        response: { 200: z.object({ data: ordemServicoDetalheSchema }) },
        tags: ['operacao', 'ordens-servico'],
        summary: 'Atualiza dados controlados de uma OS',
      },
    },
    async (request, reply) => {
      assertPodeAtualizarOS(request.user.perfil)
      const os = await ordensServicoService.atualizar({
        tenantId: request.user.tenantId,
        id: request.params.id,
        usuarioId: request.user.id,
        data: request.body,
      })
      return reply.status(200).send({ data: os })
    },
  )
}
