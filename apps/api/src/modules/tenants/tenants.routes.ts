import crypto from 'node:crypto'
import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import argon2 from 'argon2'
import { prisma } from '../../infra/database/prisma.js'
import { emailQueue } from '../../infra/queue/bullmq.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { registrarAuditoria, extrairIp } from '../../shared/middleware/audit.js'
import { ForbiddenError, NotFoundError, ConflictError } from '../../shared/errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// TENANTS ROUTES — apenas SUPER_ADMIN
// ─────────────────────────────────────────────────────────────────────────────

function exigirSuperAdmin(request: FastifyRequest) {
  if (request.user.perfil !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Apenas SUPER_ADMIN pode gerenciar tenants')
  }
}

const ctx = (request: FastifyRequest) => ({
  id: request.user.id,
  tenantId: request.user.tenantId,
  perfil: request.user.perfil,
  nome: request.user.nome,
  email: request.user.email,
  ip: extrairIp(request),
})

const filtrosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().optional(),
  status: z.enum(['ATIVO', 'SUSPENSO', 'CANCELADO']).optional(),
  plano: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).optional(),
})

const criarTenantSchema = z.object({
  nome: z.string().min(2).max(120),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug deve ser lowercase, sem espaços (use hífens)'),
  plano: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).default('STARTER'),
  limiteEmpreendimentos: z.number().int().min(1).max(9999).default(100),
  adminNome: z.string().min(2).max(120),
  adminEmail: z.string().email(),
})

const atualizarTenantSchema = z.object({
  nome: z.string().min(2).max(120).optional(),
  plano: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).optional(),
  status: z.enum(['ATIVO', 'SUSPENSO', 'CANCELADO']).optional(),
  limiteEmpreendimentos: z.number().int().min(1).max(9999).optional(),
  dataExpiracao: z.string().datetime().optional().nullable(),
})

export const tenantsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  // ── LIST ──────────────────────────────────────────────────────────────────
  app.get(
    '/',
    { schema: { querystring: filtrosSchema, tags: ['tenants'], summary: 'Lista todos os tenants (SUPER_ADMIN)' } },
    async (request, reply) => {
      exigirSuperAdmin(request)

      const { page, limit, busca, status, plano } = request.query

      const where = {
        ...(status && { status }),
        ...(plano && { plano }),
        ...(busca && {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' as const } },
            { slug: { contains: busca, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [total, items] = await prisma.$transaction([
        prisma.tenant.count({ where }),
        prisma.tenant.findMany({
          where,
          select: {
            id: true,
            nome: true,
            slug: true,
            plano: true,
            status: true,
            ativo: true,
            limiteEmpreendimentos: true,
            dataAtivacao: true,
            dataExpiracao: true,
            criadoEm: true,
            _count: {
              select: {
                usuarios: true,
                empresas: true,
              },
            },
          },
          orderBy: { criadoEm: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      return reply.status(200).send({
        data: items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    },
  )

  // ── CREATE ─────────────────────────────────────────────────────────────────
  app.post(
    '/',
    { schema: { body: criarTenantSchema, tags: ['tenants'], summary: 'Cria um novo tenant e usuário admin inicial (SUPER_ADMIN)' } },
    async (request, reply) => {
      exigirSuperAdmin(request)

      const { nome, slug, plano, limiteEmpreendimentos, adminNome, adminEmail } = request.body

      // Unicidade do slug
      const existente = await prisma.tenant.findUnique({ where: { slug } })
      if (existente) {
        throw new ConflictError(`Slug "${slug}" já está em uso por outro tenant`)
      }

      // Verificar se email já existe
      const emailExistente = await prisma.usuario.findFirst({ where: { email: adminEmail.toLowerCase() } })
      if (emailExistente) {
        throw new ConflictError(`E-mail "${adminEmail}" já está cadastrado`)
      }

      // Gerar senha temporária
      const senhaTemporaria = crypto.randomBytes(9).toString('base64url').slice(0, 12)
      const senhaHash = await argon2.hash(senhaTemporaria, { type: argon2.argon2id })

      const agora = new Date()

      // Criar tenant + admin em transação
      const { tenant, admin } = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            nome,
            slug,
            plano,
            limiteEmpreendimentos,
            status: 'ATIVO',
            ativo: true,
            dataAtivacao: agora,
          },
        })

        const admin = await tx.usuario.create({
          data: {
            tenantId: tenant.id,
            nome: adminNome,
            email: adminEmail.toLowerCase(),
            senhaHash,
            perfil: 'ADMIN_TENANT',
            ativo: true,
          },
          select: { id: true, nome: true, email: true, perfil: true },
        })

        return { tenant, admin }
      })

      // Enfileirar email de boas-vindas
      await emailQueue.add('boas-vindas-tenant', {
        tipo: 'boas_vindas',
        usuarioNome: adminNome,
        email: adminEmail.toLowerCase(),
      })

      // Auditoria
      await registrarAuditoria({
        ...ctx(request),
        acao: 'TENANT_CRIADO',
        entidadeTipo: 'Tenant',
        entidadeId: tenant.id,
        dadosDepois: { nome, slug, plano, limiteEmpreendimentos, adminEmail },
      })

      return reply.status(201).send({
        data: {
          ...tenant,
          adminCriado: admin,
        },
      })
    },
  )

  // ── GET BY ID ──────────────────────────────────────────────────────────────
  app.get(
    '/:id',
    { schema: { params: z.object({ id: z.string().uuid() }), tags: ['tenants'], summary: 'Detalha um tenant com estatísticas (SUPER_ADMIN)' } },
    async (request, reply) => {
      exigirSuperAdmin(request)

      const { id } = request.params

      const tenant = await prisma.tenant.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          slug: true,
          plano: true,
          status: true,
          ativo: true,
          limiteEmpreendimentos: true,
          configuracoes: true,
          dataAtivacao: true,
          dataExpiracao: true,
          criadoEm: true,
          atualizadoEm: true,
          _count: {
            select: {
              usuarios: true,
              empresas: true,
            },
          },
          usuarios: {
            orderBy: { criadoEm: 'desc' },
            take: 5,
            select: {
              id: true,
              nome: true,
              email: true,
              perfil: true,
              ativo: true,
              criadoEm: true,
              ultimoAcesso: true,
            },
          },
        },
      })

      if (!tenant) throw new NotFoundError('Tenant', id)

      // Contar empreendimentos separadamente (via empresas -> empreendimentos)
      const totalEmpreendimentos = await prisma.empreendimento.count({
        where: { empresa: { tenantId: id } },
      })

      return reply.status(200).send({
        data: {
          ...tenant,
          _stats: {
            totalUsuarios: tenant._count.usuarios,
            totalEmpresas: tenant._count.empresas,
            totalEmpreendimentos,
          },
        },
      })
    },
  )

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  app.patch(
    '/:id',
    { schema: { params: z.object({ id: z.string().uuid() }), body: atualizarTenantSchema, tags: ['tenants'], summary: 'Atualiza dados do tenant (SUPER_ADMIN)' } },
    async (request, reply) => {
      exigirSuperAdmin(request)

      const { id } = request.params

      const tenantAtual = await prisma.tenant.findUnique({ where: { id } })
      if (!tenantAtual) throw new NotFoundError('Tenant', id)

      const { dataExpiracao, ...resto } = request.body

      const atualizado = await prisma.tenant.update({
        where: { id },
        data: {
          ...resto,
          ...(dataExpiracao !== undefined && {
            dataExpiracao: dataExpiracao ? new Date(dataExpiracao) : null,
          }),
          // Se suspendendo/cancelando e ainda está ativo, marcar ativo=false
          ...(resto.status && resto.status !== 'ATIVO' && { ativo: false }),
          // Se reativando, marcar ativo=true
          ...(resto.status === 'ATIVO' && { ativo: true }),
        },
        select: {
          id: true,
          nome: true,
          slug: true,
          plano: true,
          status: true,
          ativo: true,
          limiteEmpreendimentos: true,
          dataAtivacao: true,
          dataExpiracao: true,
          atualizadoEm: true,
        },
      })

      await registrarAuditoria({
        ...ctx(request),
        acao: 'TENANT_ATUALIZADO',
        entidadeTipo: 'Tenant',
        entidadeId: id,
        dadosAntes: { status: tenantAtual.status, plano: tenantAtual.plano, ativo: tenantAtual.ativo },
        dadosDepois: request.body,
      })

      return reply.status(200).send({ data: atualizado })
    },
  )

  // ── SOFT DELETE ────────────────────────────────────────────────────────────
  app.delete(
    '/:id',
    { schema: { params: z.object({ id: z.string().uuid() }), tags: ['tenants'], summary: 'Desativa (soft-delete) um tenant (SUPER_ADMIN)' } },
    async (request, reply) => {
      exigirSuperAdmin(request)

      const { id } = request.params

      const tenant = await prisma.tenant.findUnique({ where: { id } })
      if (!tenant) throw new NotFoundError('Tenant', id)

      if (!tenant.ativo) {
        throw new ConflictError('Tenant já está desativado')
      }

      await prisma.tenant.update({
        where: { id },
        data: { ativo: false, status: 'CANCELADO' },
      })

      await registrarAuditoria({
        ...ctx(request),
        acao: 'TENANT_DESATIVADO',
        entidadeTipo: 'Tenant',
        entidadeId: id,
        dadosAntes: { ativo: true, status: tenant.status },
        dadosDepois: { ativo: false, status: 'CANCELADO' },
      })

      return reply.status(204).send()
    },
  )
}
