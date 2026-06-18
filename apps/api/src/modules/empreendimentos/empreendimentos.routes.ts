import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  criarEmpreendimentoSchema,
  atualizarEmpreendimentoSchema,
  filtrosEmpreendimentoSchema,
} from '@repo/schemas'
import { empreendimentosService } from './empreendimentos.service.js'
import { obterUltimoDiagnostico, recalcularEObterDiagnostico } from '../diagnostico/service/diagnostico.service.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// EMPREENDIMENTOS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

export const empreendimentosRoutes: FastifyPluginAsyncZod = async (app) => {
  // Autenticação obrigatória em todas as rotas deste plugin
  app.addHook('preHandler', authenticate)

  const ctx = (request: FastifyRequest) => ({
    id: request.user.id,
    tenantId: request.user.tenantId,
    perfil: request.user.perfil,
    empreendimentoIds: request.user.empreendimentoIds,
    nome: request.user.nome,
    email: request.user.email,
    ip: extrairIp(request),
  })

  const exigirGestaoEquipe = (request: FastifyRequest) => {
    if (!['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'].includes(request.user.perfil)) {
      throw new ForbiddenError('Apenas coordenadores ou administradores podem gerenciar equipe do empreendimento')
    }
  }

  /**
   * GET /api/v1/empreendimentos
   */
  app.get(
    '/',
    {
      schema: {
        querystring: filtrosEmpreendimentoSchema,
        tags: ['empreendimentos'],
        summary: 'Lista os empreendimentos do tenant com filtros e paginação',
      },
    },
    async (request, reply) => {
      const result = await empreendimentosService.listar(ctx(request), request.query)
      return reply.status(200).send({ data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) } })
    },
  )

  /**
   * POST /api/v1/empreendimentos
   */
  app.post(
    '/',
    {
      schema: {
        body: criarEmpreendimentoSchema,
        response: { 201: z.object({ data: z.record(z.unknown()) }) },
        tags: ['empreendimentos'],
        summary: 'Cria um novo empreendimento',
      },
    },
    async (request, reply) => {
      const empreendimento = await empreendimentosService.criar(ctx(request), request.body)
      return reply.status(201).send({ data: empreendimento })
    },
  )

  /**
   * GET /api/v1/empreendimentos/:id
   */
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['empreendimentos'],
        summary: 'Retorna detalhes de um empreendimento',
      },
    },
    async (request, reply) => {
      const empreendimento = await empreendimentosService.buscarPorId(ctx(request), request.params.id)
      return reply.status(200).send({ data: empreendimento })
    },
  )

  /**
   * PATCH /api/v1/empreendimentos/:id
   */
  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarEmpreendimentoSchema,
        tags: ['empreendimentos'],
        summary: 'Atualiza dados de um empreendimento',
      },
    },
    async (request, reply) => {
      const empreendimento = await empreendimentosService.atualizar(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data: empreendimento })
    },
  )

  /**
   * DELETE /api/v1/empreendimentos/:id (soft delete)
   */
  app.delete(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: { 204: z.undefined() },
        tags: ['empreendimentos'],
        summary: 'Desativa um empreendimento',
      },
    },
    async (request, reply) => {
      await empreendimentosService.desativar(ctx(request), request.params.id)
      return reply.status(204).send()
    },
  )

  // ── Equipe / Acesso ──────────────────────────────────────────────────────

  app.get(
    '/:id/equipe',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['empreendimentos'],
        summary: 'Lista usuários com acesso ao empreendimento',
      },
    },
    async (request, reply) => {
      exigirGestaoEquipe(request)
      await empreendimentosService.buscarPorId(ctx(request), request.params.id)

      const { prisma } = await import('../../infra/database/prisma.js')
      const acessos = await prisma.empreendimentoAcesso.findMany({
        where: { empreendimentoId: request.params.id },
        include: { usuario: { select: { id: true, nome: true, email: true, perfil: true, ativo: true } } },
      })
      return reply.send({ data: acessos.map((a) => ({ ...a.usuario, criadoEm: a.criadoEm })) })
    },
  )

  app.post(
    '/:id/equipe',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ usuarioId: z.string().uuid() }),
        tags: ['empreendimentos'],
        summary: 'Adiciona usuário à equipe do empreendimento',
      },
    },
    async (request, reply) => {
      exigirGestaoEquipe(request)
      await empreendimentosService.buscarPorId(ctx(request), request.params.id)

      const { prisma } = await import('../../infra/database/prisma.js')
      const usuario = await prisma.usuario.findFirst({
        where: { id: request.body.usuarioId, tenantId: request.user.tenantId, ativo: true },
        select: { id: true },
      })
      if (!usuario) throw new NotFoundError('Usuário', request.body.usuarioId)

      const existente = await prisma.empreendimentoAcesso.findUnique({
        where: {
          usuarioId_empreendimentoId: {
            usuarioId: request.body.usuarioId,
            empreendimentoId: request.params.id,
          },
        },
      })
      if (existente) throw new ConflictError('Usuário já possui acesso a este empreendimento')

      await prisma.empreendimentoAcesso.create({
        data: { empreendimentoId: request.params.id, usuarioId: request.body.usuarioId, criadoPorId: request.user.id },
      })
      return reply.status(201).send({ data: { ok: true } })
    },
  )

  app.delete(
    '/:id/equipe/:usuarioId',
    {
      schema: {
        params: z.object({ id: z.string().uuid(), usuarioId: z.string().uuid() }),
        tags: ['empreendimentos'],
        summary: 'Remove usuário da equipe do empreendimento',
      },
    },
    async (request, reply) => {
      exigirGestaoEquipe(request)
      await empreendimentosService.buscarPorId(ctx(request), request.params.id)

      const { prisma } = await import('../../infra/database/prisma.js')
      await prisma.empreendimentoAcesso.delete({
        where: { usuarioId_empreendimentoId: { usuarioId: request.params.usuarioId, empreendimentoId: request.params.id } },
      })
      return reply.status(204).send()
    },
  )

  /**
   * GET /api/v1/empreendimentos/:id/diagnostico
   * Diagnóstico vigente (fonte única — Blueprint 101). Calcula sob demanda na 1ª leitura.
   */
  app.get(
    '/:id/diagnostico',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['diagnostico'],
        summary: 'Diagnóstico regulatório vigente do empreendimento (enquadramento, conformidade, 2 eixos de risco, obrigações, orçamento)',
      },
    },
    async (request, reply) => {
      await empreendimentosService.garantirAcesso(ctx(request), request.params.id)
      const diag = await obterUltimoDiagnostico(request.user.tenantId, request.params.id)
      return reply.status(200).send({ data: diag })
    },
  )

  /**
   * POST /api/v1/empreendimentos/:id/diagnostico/recalcular
   * Recalcula agora (idempotente) e retorna o resultado. Para botão "recalcular"/onboarding síncrono.
   */
  app.post(
    '/:id/diagnostico/recalcular',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['diagnostico'],
        summary: 'Recalcula o diagnóstico do empreendimento e retorna o resultado vigente',
      },
    },
    async (request, reply) => {
      await empreendimentosService.garantirAcesso(ctx(request), request.params.id)
      const diag = await recalcularEObterDiagnostico(request.user.tenantId, request.params.id)
      return reply.status(200).send({ data: diag })
    },
  )
}
