import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { registrarAuditoria, extrairIp } from '../../shared/middleware/audit.js'

// ─────────────────────────────────────────────────────────────────────────────
// FILA DE TRABALHO UNIFICADA
// Ponto de entrada operacional: todas as tarefas, todos os módulos,
// ordenadas por score de criticidade. Decisão → Priorização → Encaminhamento.
// ─────────────────────────────────────────────────────────────────────────────

export const filaRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  /**
   * GET /api/v1/fila
   * Retorna tarefas abertas ordenadas por scoreCriticidade DESC
   * + KPIs consolidados
   */
  app.get('/', {
    schema: {
      querystring: z.object({
        responsavel: z.enum(['minhas', 'equipe', 'todas']).default('minhas'),
        empreendimentoId: z.string().uuid().optional(),
        modulo: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(30),
      }),
      tags: ['fila'],
      summary: 'Fila de trabalho unificada ordenada por criticidade',
    },
  }, async (request, reply) => {
    const tenantId = request.user.tenantId
    const userId = request.user.id
    const { responsavel, empreendimentoId, modulo, page, limit } = request.query

    const baseWhere = {
      tenantId,
      status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] },
      ...(empreendimentoId && { empreendimentoId }),
      ...(modulo && { origem: modulo as never }),
    }

    // Filtro por responsabilidade
    const where = {
      ...baseWhere,
      ...(responsavel === 'minhas' && { responsavelId: userId }),
      ...(responsavel === 'equipe' && {
        empreendimentoId: {
          in: (await prisma.empreendimentoAcesso.findMany({
            where: { usuarioId: userId },
            select: { empreendimentoId: true },
          })).map((a) => a.empreendimentoId),
        },
      }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.tarefa.count({ where }),
      prisma.tarefa.findMany({
        where,
        orderBy: [{ scoreCriticidade: 'desc' }, { dataVencimento: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          responsavel: { select: { id: true, nome: true } },
          escaladoPara: { select: { id: true, nome: true } },
        },
      }),
    ])

    // KPIs
    const [totalPendentes, criticas, semResponsavel, atrasadas] = await prisma.$transaction([
      prisma.tarefa.count({ where: { ...baseWhere } }),
      prisma.tarefa.count({ where: { ...baseWhere, scoreCriticidade: { gte: 70 } } }),
      prisma.tarefa.count({ where: { ...baseWhere, responsavelId: null } }),
      prisma.tarefa.count({ where: { ...baseWhere, dataVencimento: { lt: new Date() } } }),
    ])

    return reply.send({
      data: items,
      kpis: { totalPendentes, criticas, semResponsavel, atrasadas },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  })

  /**
   * PATCH /api/v1/fila/:id/atribuir
   * Atribuição rápida de responsável
   */
  app.patch('/:id/atribuir', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ responsavelId: z.string().uuid() }),
      tags: ['fila'],
      summary: 'Atribui responsável a uma tarefa da fila',
    },
  }, async (request, reply) => {
    const tarefa = await prisma.tarefa.findFirst({
      where: { id: request.params.id, tenantId: request.user.tenantId },
    })
    if (!tarefa) return reply.status(404).send({ error: 'Tarefa não encontrada' })

    const updated = await prisma.tarefa.update({
      where: { id: request.params.id },
      data: { responsavelId: request.body.responsavelId },
      include: { responsavel: { select: { id: true, nome: true } } },
    })

    await registrarAuditoria({
      tenantId: request.user.tenantId,
      usuarioId: request.user.id,
      acao: 'tarefa.atribuida_fila',
      entidadeTipo: 'tarefa',
      entidadeId: request.params.id,
      dadosAntes: { responsavelId: tarefa.responsavelId },
      dadosDepois: { responsavelId: request.body.responsavelId },
      ipOrigem: extrairIp(request),
    })

    return reply.send({ data: updated })
  })

  /**
   * PATCH /api/v1/fila/:id/status
   * Mudança rápida de status da fila
   */
  app.patch('/:id/status', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']) }),
      tags: ['fila'],
      summary: 'Altera status de tarefa da fila',
    },
  }, async (request, reply) => {
    const tarefa = await prisma.tarefa.findFirst({
      where: { id: request.params.id, tenantId: request.user.tenantId },
    })
    if (!tarefa) return reply.status(404).send({ error: 'Tarefa não encontrada' })

    const data: Record<string, unknown> = { status: request.body.status as never }
    if (request.body.status === 'CONCLUIDA') data.dataConclusao = new Date()

    const updated = await prisma.tarefa.update({
      where: { id: request.params.id },
      data: data as never,
    })

    await registrarAuditoria({
      tenantId: request.user.tenantId,
      usuarioId: request.user.id,
      acao: 'tarefa.status_alterado_fila',
      entidadeTipo: 'tarefa',
      entidadeId: request.params.id,
      dadosAntes: { status: tarefa.status },
      dadosDepois: { status: request.body.status },
      ipOrigem: extrairIp(request),
    })

    return reply.send({ data: updated })
  })
}
