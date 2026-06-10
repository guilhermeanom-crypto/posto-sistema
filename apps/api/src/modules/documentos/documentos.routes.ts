import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  criarDocumentoSchema,
  filtrosDocumentoSchema,
  solicitarUploadUrlSchema,
  confirmarUploadSchema,
  reprovarVersaoSchema,
} from '@repo/schemas'
import { documentosService } from './documentos.service.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTOS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

export const documentosRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const ctx = (request: FastifyRequest) => ({
    id: request.user.id,
    tenantId: request.user.tenantId,
    perfil: request.user.perfil,
    nome: request.user.nome,
    email: request.user.email,
    ip: extrairIp(request),
  })

  /**
   * GET /api/v1/documentos
   */
  app.get(
    '/',
    {
      schema: {
        querystring: filtrosDocumentoSchema,
        tags: ['documentos'],
        summary: 'Lista documentos com filtros e paginação',
      },
    },
    async (request, reply) => {
      const result = await documentosService.listar(ctx(request), request.query)
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

  /**
   * POST /api/v1/documentos
   */
  app.post(
    '/',
    {
      schema: {
        body: criarDocumentoSchema,
        response: { 201: z.object({ data: z.record(z.unknown()) }) },
        tags: ['documentos'],
        summary: 'Cria um registro de documento (sem arquivo ainda)',
      },
    },
    async (request, reply) => {
      const documento = await documentosService.criar(ctx(request), request.body)
      return reply.status(201).send({ data: documento })
    },
  )

  /**
   * GET /api/v1/documentos/:id
   */
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['documentos'],
        summary: 'Retorna detalhes de um documento com todas as versões',
      },
    },
    async (request, reply) => {
      const documento = await documentosService.buscarPorId(ctx(request), request.params.id)
      return reply.status(200).send({ data: documento })
    },
  )

  /**
   * POST /api/v1/documentos/:id/upload/solicitar
   * Fase 1: obtém URL presignada para o cliente fazer PUT direto no S3
   */
  app.post(
    '/:id/upload/solicitar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: solicitarUploadUrlSchema,
        response: {
          200: z.object({
            data: z.object({
              versaoId: z.string().uuid(),
              uploadUrl: z.string().url(),
              chaveS3: z.string(),
              expiresIn: z.number(),
            }),
          }),
        },
        tags: ['documentos'],
        summary: 'Solicita URL presignada para upload direto ao storage',
      },
    },
    async (request, reply) => {
      const result = await documentosService.solicitarUrlUpload(
        ctx(request),
        request.params.id,
        request.body,
      )
      return reply.status(200).send({ data: result })
    },
  )

  /**
   * POST /api/v1/documentos/:id/upload/confirmar
   * Fase 2: confirma que o upload foi concluído pelo cliente
   */
  app.post(
    '/:id/upload/confirmar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: confirmarUploadSchema,
        response: { 200: z.object({ data: z.record(z.unknown()) }) },
        tags: ['documentos'],
        summary: 'Confirma que o arquivo foi enviado ao storage',
      },
    },
    async (request, reply) => {
      const versao = await documentosService.confirmarUpload(
        ctx(request),
        request.params.id,
        request.body,
      )
      return reply.status(200).send({ data: versao })
    },
  )

  /**
   * POST /api/v1/documentos/:id/versoes/:versaoId/aprovar
   */
  app.post(
    '/:id/versoes/:versaoId/aprovar',
    {
      schema: {
        params: z.object({ id: z.string().uuid(), versaoId: z.string().uuid() }),
        response: { 200: z.object({ data: z.record(z.unknown()) }) },
        tags: ['documentos'],
        summary: 'Aprova uma versão de documento (requer ANALISTA+)',
      },
    },
    async (request, reply) => {
      const versao = await documentosService.aprovarVersao(
        ctx(request),
        request.params.id,
        request.params.versaoId,
      )
      return reply.status(200).send({ data: versao })
    },
  )

  /**
   * POST /api/v1/documentos/:id/versoes/:versaoId/reprovar
   */
  app.post(
    '/:id/versoes/:versaoId/reprovar',
    {
      schema: {
        params: z.object({ id: z.string().uuid(), versaoId: z.string().uuid() }),
        body: reprovarVersaoSchema,
        response: { 200: z.object({ data: z.record(z.unknown()) }) },
        tags: ['documentos'],
        summary: 'Reprova uma versão de documento (requer ANALISTA+)',
      },
    },
    async (request, reply) => {
      await documentosService.reprovarVersao(
        ctx(request),
        request.params.id,
        request.params.versaoId,
        request.body,
      )
      return reply.status(200).send({ data: { mensagem: 'Versão reprovada.' } })
    },
  )

  /**
   * GET /api/v1/documentos/:id/versoes/:versaoId/download
   */
  app.get(
    '/:id/versoes/:versaoId/download',
    {
      schema: {
        params: z.object({ id: z.string().uuid(), versaoId: z.string().uuid() }),
        response: {
          200: z.object({
            data: z.object({ url: z.string().url(), expiresIn: z.number() }),
          }),
        },
        tags: ['documentos'],
        summary: 'Gera URL de download temporária para uma versão',
      },
    },
    async (request, reply) => {
      const result = await documentosService.gerarUrlDownload(
        ctx(request),
        request.params.id,
        request.params.versaoId,
      )
      return reply.status(200).send({ data: result })
    },
  )
}
