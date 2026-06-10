import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { ForbiddenError } from '../../shared/errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG ROUTES — Tipos de processo, tipos de documento, órgãos, fases
// ─────────────────────────────────────────────────────────────────────────────

export const configRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  // ── Órgãos reguladores ────────────────────────────────────────────────────

  app.get('/orgaos', { schema: { tags: ['config'], summary: 'Lista órgãos reguladores do tenant' } }, async (request, reply) => {
    const orgaos = await prisma.orgaoRegulador.findMany({
      where: { tenantId: request.user.tenantId },
      orderBy: { nome: 'asc' },
    })
    return reply.status(200).send({ data: orgaos })
  })

  app.post(
    '/orgaos',
    {
      schema: {
        body: z.object({
          nome: z.string().min(2),
          sigla: z.string().min(2).max(20),
          esfera: z.enum(['FEDERAL', 'ESTADUAL', 'MUNICIPAL']),
          tipo: z.enum(['AMBIENTAL', 'SEGURANCA', 'COMERCIAL', 'SANITARIO', 'METROLOGIA', 'TRANSPORTE', 'TRIBUTARIO', 'OUTROS']),
          uf: z.string().length(2).optional(),
          municipio: z.string().optional(),
          site: z.string().url().optional(),
        }),
        response: { 201: z.object({ data: z.record(z.unknown()) }) },
        tags: ['config'],
        summary: 'Cadastra um órgão regulador (requer ADMIN)',
      },
    },
    async (request, reply) => {
      if (!['ADMIN_TENANT', 'SUPER_ADMIN'].includes(request.user.perfil)) {
        throw new ForbiddenError('Apenas administradores podem cadastrar órgãos')
      }
      const { uf, ...rest } = request.body
      const orgao = await prisma.orgaoRegulador.create({
        data: { tenantId: request.user.tenantId, ...rest, estadoUf: uf },
      })
      return reply.status(201).send({ data: orgao })
    },
  )

  // ── Tipos de documento ────────────────────────────────────────────────────

  app.get('/tipos-documento', { schema: { tags: ['config'], summary: 'Lista tipos de documento' } }, async (request, reply) => {
    const tipos = await prisma.tipoDocumento.findMany({
      where: { tenantId: request.user.tenantId, ativo: true },
      orderBy: { nome: 'asc' },
    })
    return reply.status(200).send({ data: tipos })
  })

  // ── Tipos de processo ─────────────────────────────────────────────────────

  app.get('/tipos-processo', { schema: { tags: ['config'], summary: 'Lista tipos de processo' } }, async (request, reply) => {
    const tipos = await prisma.tipoProcesso.findMany({
      where: { tenantId: request.user.tenantId, ativo: true },
      include: {
        orgao: { select: { id: true, nome: true, sigla: true } },
        fases: { orderBy: { ordem: 'asc' } },
        _count: { select: { requisitos: true } },
      },
      orderBy: { nome: 'asc' },
    })
    return reply.status(200).send({ data: tipos })
  })

  app.get('/tipos-processo/:id', { schema: { params: z.object({ id: z.string().uuid() }), tags: ['config'], summary: 'Retorna tipo de processo com fases e requisitos' } }, async (request, reply) => {
    const tipo = await prisma.tipoProcesso.findFirst({
      where: { id: request.params.id, tenantId: request.user.tenantId },
      include: {
        orgao: true,
        fases: { orderBy: { ordem: 'asc' } },
        requisitos: { include: { tipoDocumento: true }, orderBy: { ordem: 'asc' } },
      },
    })
    return reply.status(200).send({ data: tipo })
  })

  // ── Regras de notificação automática ──────────────────────────────────────

  const regraBodySchema = z.object({
    nome: z.string().min(3).max(200),
    descricao: z.string().max(500).optional(),
    tipo: z.enum(['vencimento_doc', 'vencimento_proc', 'condicionante', 'requisito', 'escalamento']),
    gatilho: z.object({ diasAntes: z.number().int().min(1).max(365) }),
    acao: z.enum(['criar_tarefa', 'enviar_alerta', 'escalonar']).default('enviar_alerta'),
    parametros: z.object({
      perfis: z.array(z.string()).min(1, 'Selecione ao menos um perfil'),
      canais: z.array(z.string()).min(1, 'Selecione ao menos um canal'),
    }),
  })

  app.get(
    '/regras',
    { schema: { tags: ['config'], summary: 'Lista regras de notificação do tenant' } },
    async (request, reply) => {
      const regras = await prisma.regraAutomatica.findMany({
        where: { tenantId: request.user.tenantId },
        orderBy: [{ tipo: 'asc' }, { ordemExecucao: 'asc' }],
      })
      return reply.send({ data: regras })
    },
  )

  app.post(
    '/regras',
    { schema: { body: regraBodySchema, tags: ['config'], summary: 'Cria regra de notificação (admin)' } },
    async (request, reply) => {
      if (!['ADMIN_TENANT', 'SUPER_ADMIN'].includes(request.user.perfil)) {
        throw new ForbiddenError('Apenas administradores podem gerenciar regras')
      }
      const { gatilho, parametros, ...rest } = request.body
      const regra = await prisma.regraAutomatica.create({
        data: {
          tenantId: request.user.tenantId,
          gatilho: gatilho as never,
          parametros: parametros as never,
          ...rest,
        },
      })
      return reply.status(201).send({ data: regra })
    },
  )

  app.patch(
    '/regras/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ ativo: z.boolean().optional() }).merge(regraBodySchema.partial()),
        tags: ['config'],
        summary: 'Atualiza regra de notificação (admin)',
      },
    },
    async (request, reply) => {
      if (!['ADMIN_TENANT', 'SUPER_ADMIN'].includes(request.user.perfil)) {
        throw new ForbiddenError('Apenas administradores podem gerenciar regras')
      }
      const { gatilho, parametros, ...rest } = request.body
      await prisma.regraAutomatica.updateMany({
        where: { id: request.params.id, tenantId: request.user.tenantId },
        data: {
          ...(gatilho && { gatilho: gatilho as never }),
          ...(parametros && { parametros: parametros as never }),
          ...rest,
        },
      })
      return reply.status(204).send()
    },
  )

  app.delete(
    '/regras/:id',
    { schema: { params: z.object({ id: z.string().uuid() }), tags: ['config'], summary: 'Remove regra de notificação (admin)' } },
    async (request, reply) => {
      if (!['ADMIN_TENANT', 'SUPER_ADMIN'].includes(request.user.perfil)) {
        throw new ForbiddenError('Apenas administradores podem gerenciar regras')
      }
      await prisma.regraAutomatica.deleteMany({
        where: { id: request.params.id, tenantId: request.user.tenantId },
      })
      return reply.status(204).send()
    },
  )
}
