import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { loginSchema, refreshTokenSchema, magicLinkSchema } from '@repo/schemas'
import { authService } from './auth.service.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'
import { env } from '../../config/env.js'
import { emailQueue } from '../../infra/queue/bullmq.js'
import { prisma } from '../../infra/database/prisma.js'

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * POST /api/v1/auth/login
   */
  app.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      schema: {
        body: loginSchema,
        response: {
          200: z.object({
            data: z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
              expiresIn: z.number(),
              usuario: z.object({
                id: z.string(),
                nome: z.string(),
                email: z.string(),
                perfil: z.string(),
                tenantId: z.string(),
              }),
            }),
          }),
        },
        tags: ['auth'],
        summary: 'Login com e-mail e senha',
      },
    },
    async (request, reply) => {
      const { tokens, usuario } = await authService.login(request.body, {
        ip: extrairIp(request),
        userAgent: request.headers['user-agent'] ?? '',
        jwtSign: (payload) => app.jwt.sign(payload as never),
      })

      return reply.status(200).send({ data: { ...tokens, usuario } })
    },
  )

  /**
   * POST /api/v1/auth/refresh
   */
  app.post(
    '/refresh',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      schema: {
        body: refreshTokenSchema,
        response: {
          200: z.object({
            data: z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
              expiresIn: z.number(),
            }),
          }),
        },
        tags: ['auth'],
        summary: 'Renova o access token usando refresh token',
      },
    },
    async (request, reply) => {
      const tokens = await authService.refresh(request.body.refreshToken, {
        ip: extrairIp(request),
        userAgent: request.headers['user-agent'] ?? '',
        jwtSign: (payload) => app.jwt.sign(payload as never),
      })

      return reply.status(200).send({ data: tokens })
    },
  )

  /**
   * POST /api/v1/auth/logout
   */
  app.post(
    '/logout',
    {
      schema: {
        body: refreshTokenSchema,
        response: { 204: z.undefined() },
        tags: ['auth'],
        summary: 'Encerra a sessão',
      },
    },
    async (request, reply) => {
      await authService.logout(request.body.refreshToken)
      return reply.status(204).send()
    },
  )

  /**
   * GET /api/v1/auth/me
   */
  app.get(
    '/me',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Retorna o usuário autenticado',
      },
    },
    async (request, reply) => {
      return reply.status(200).send({ data: request.user })
    },
  )

  /**
   * POST /api/v1/auth/portal/magic-link
   * Gera link de acesso para representante do posto.
   */
  app.post(
    '/portal/magic-link',
    {
      preHandler: [authenticate],
      schema: {
        body: magicLinkSchema,
        response: {
          201: z.object({
            data: z.object({ mensagem: z.string() }),
          }),
        },
        tags: ['auth', 'portal'],
        summary: 'Gera magic link para o portal do cliente',
      },
    },
    async (request, reply) => {
      const link = await authService.gerarMagicLink(
        request.body,
        request.user.id,
        request.user.tenantId,
        env.WEB_URL,
      )

      const emp = await prisma.empreendimento.findUnique({
        where: { id: request.body.empreendimentoId },
        select: { nome: true },
      })
      await emailQueue.add('magic-link', {
        tipo: 'magic_link',
        email: request.body.email,
        link,
        empreendimento: emp?.nome ?? 'seu empreendimento',
        expiresIn: '24 horas',
      })
      app.log.info({ email: request.body.email }, 'Magic link gerado e enfileirado para envio')

      return reply.status(201).send({
        data: { mensagem: `Link enviado para ${request.body.email}` },
      })
    },
  )

  /**
   * POST /api/v1/auth/portal/validar
   * Valida o magic link e retorna um access token de portal.
   */
  app.post(
    '/portal/validar',
    {
      schema: {
        body: z.object({ token: z.string().min(1) }),
        response: {
          200: z.object({
            data: z.object({
              accessToken: z.string(),
              empreendimentoId: z.string(),
            }),
          }),
        },
        tags: ['auth', 'portal'],
        summary: 'Valida magic link e retorna token de acesso ao portal',
      },
    },
    async (request, reply) => {
      const result = await authService.validarMagicLink(request.body.token, {
        jwtSign: (payload) => app.jwt.sign(payload as never),
      })

      return reply.status(200).send({ data: result })
    },
  )
}
