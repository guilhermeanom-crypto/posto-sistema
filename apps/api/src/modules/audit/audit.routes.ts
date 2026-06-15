import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { ForbiddenError } from '../../shared/errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG ROUTES — leitura da trilha de auditoria
// ─────────────────────────────────────────────────────────────────────────────

const PERFIS_AUDITORIA = ['ADMIN_TENANT', 'COORDENADOR', 'SUPER_ADMIN']

export const auditRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  // A trilha expõe IPs, e-mails e ações de TODOS os usuários do tenant — restrita
  // a perfis de gestão (antes qualquer autenticado conseguia ler tudo).
  app.addHook('preHandler', async (request) => {
    if (!PERFIS_AUDITORIA.includes(request.user.perfil)) {
      throw new ForbiddenError('Acesso à trilha de auditoria restrito a gestores')
    }
  })

  /**
   * GET /api/v1/audit-log
   * Lista eventos de auditoria com filtros.
   * Restrito a ADMIN_TENANT, COORDENADOR, SUPER_ADMIN.
   */
  app.get(
    '/',
    {
      schema: {
        querystring: z.object({
          page:            z.coerce.number().int().min(1).default(1),
          limit:           z.coerce.number().int().min(1).max(100).default(30),
          usuarioId:       z.string().uuid().optional(),
          entidadeTipo:    z.string().optional(),
          entidadeId:      z.string().uuid().optional(),
          acao:            z.string().optional(),
          empreendimentoId: z.string().uuid().optional(),
          de:              z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          ate:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        }),
        tags: ['auditoria'],
        summary: 'Lista eventos de auditoria com filtros',
      },
    },
    async (request, reply) => {
      const { tenantId } = request.user
      const q = request.query

      const where: Record<string, unknown> = { tenantId }

      if (q.usuarioId)    where['usuarioId']    = q.usuarioId
      if (q.entidadeTipo) where['entidadeTipo'] = q.entidadeTipo
      if (q.entidadeId)   where['entidadeId']   = q.entidadeId
      if (q.acao)         where['acao']          = { contains: q.acao, mode: 'insensitive' }
      if (q.empreendimentoId) {
        where['contexto'] = { path: ['empreendimentoId'], equals: q.empreendimentoId }
      }
      if (q.de || q.ate) {
        where['criadoEm'] = {
          ...(q.de  ? { gte: new Date(q.de)  } : {}),
          ...(q.ate ? { lte: new Date(`${q.ate}T23:59:59Z`) } : {}),
        }
      }

      const [total, items] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { criadoEm: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          select: {
            id: true,
            acao: true,
            entidadeTipo: true,
            entidadeId: true,
            usuarioNome: true,
            usuarioEmail: true,
            usuarioPerfil: true,
            ipOrigem: true,
            dadosAntes: true,
            dadosDepois: true,
            contexto: true,
            criadoEm: true,
          },
        }),
      ])

      return reply.send({
        data: items,
        pagination: {
          page: q.page,
          limit: q.limit,
          total,
          totalPages: Math.ceil(total / q.limit),
        },
      })
    },
  )

  /**
   * GET /api/v1/audit-log/entidade/:tipo/:id
   * Timeline completa de uma entidade específica.
   */
  app.get(
    '/entidade/:tipo/:id',
    {
      schema: {
        params: z.object({ tipo: z.string(), id: z.string() }),
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(200).default(50),
        }),
        tags: ['auditoria'],
        summary: 'Timeline de auditoria de uma entidade',
      },
    },
    async (request, reply) => {
      const { tenantId } = request.user
      const { tipo, id } = request.params

      const items = await prisma.auditLog.findMany({
        where: { tenantId, entidadeTipo: tipo, entidadeId: id },
        orderBy: { criadoEm: 'desc' },
        take: request.query.limit,
        select: {
          id: true,
          acao: true,
          usuarioNome: true,
          usuarioPerfil: true,
          ipOrigem: true,
          dadosAntes: true,
          dadosDepois: true,
          contexto: true,
          criadoEm: true,
        },
      })

      return reply.send({ data: items })
    },
  )

  /**
   * GET /api/v1/audit-log/resumo
   * Contagens agrupadas por ação e entidade — para o painel de auditoria.
   */
  app.get(
    '/resumo',
    {
      schema: {
        querystring: z.object({
          de:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        }),
        tags: ['auditoria'],
        summary: 'Resumo de eventos por tipo de entidade',
      },
    },
    async (request, reply) => {
      const { tenantId } = request.user
      const { de, ate } = request.query

      const where: Record<string, unknown> = { tenantId }
      if (de || ate) {
        where['criadoEm'] = {
          ...(de  ? { gte: new Date(de)  } : {}),
          ...(ate ? { lte: new Date(`${ate}T23:59:59Z`) } : {}),
        }
      }

      // Group by entidadeTipo
      const porEntidade = await prisma.auditLog.groupBy({
        by: ['entidadeTipo'],
        where,
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
      })

      // Top usuários
      const porUsuario = await prisma.auditLog.groupBy({
        by: ['usuarioNome', 'usuarioEmail'],
        where: { ...where, usuarioId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      })

      // Total no período
      const total = await prisma.auditLog.count({ where })

      return reply.send({
        data: {
          total,
          porEntidade: porEntidade.map((e) => ({
            entidadeTipo: e.entidadeTipo,
            total: e._count._all,
          })),
          topUsuarios: porUsuario.map((u) => ({
            nome: u.usuarioNome,
            email: u.usuarioEmail,
            total: u._count._all,
          })),
        },
      })
    },
  )
}
