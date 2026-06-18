import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { ForbiddenError, NotFoundError } from '../../shared/errors/app-errors.js'
import { montarFiltroEscopoEmpreendimento } from '../../shared/security/empreendimento-access.js'

// ─────────────────────────────────────────────────────────────────────────────
// PENDÊNCIAS DE CAMPO — itens a resolver levantados em vistoria (app da equipe).
// Sempre vinculadas a uma Ordem de Serviço; tudo tenant-scoped.
// ─────────────────────────────────────────────────────────────────────────────

const tid = (req: FastifyRequest) => req.user.tenantId
const PERFIS_CAMPO = new Set(['ANALISTA_CAMPO', 'ANALISTA', 'COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'])

const PRIORIDADE = z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'])
const STATUS = z.enum(['ABERTA', 'EM_ANDAMENTO', 'ENVIADA_CLIENTE', 'RESOLVIDA', 'CANCELADA'])
const dataStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use formato AAAA-MM-DD')

export const pendenciasRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const exigirAcessoCampo = (req: FastifyRequest) => {
    if (!PERFIS_CAMPO.has(req.user.perfil)) {
      throw new ForbiddenError('Sem permissão para acessar pendências de campo')
    }
  }

  // ── GET /pendencias ─────────────────────────────────────────────────────────
  app.get(
    '/',
    {
      schema: {
        querystring: z.object({
          ordemServicoId: z.string().uuid().optional(),
          empreendimentoId: z.string().uuid().optional(),
          status: STATUS.optional(),
          limit: z.coerce.number().int().min(1).max(100).default(50),
        }),
        tags: ['pendencias'],
      },
    },
    async (req, reply) => {
      exigirAcessoCampo(req)
      const { ordemServicoId, empreendimentoId, status, limit } = req.query
      const itens = await prisma.pendenciaCampo.findMany({
        where: {
          tenantId: tid(req),
          ...montarFiltroEscopoEmpreendimento(req.user, 'empreendimentoId', empreendimentoId),
          ...(ordemServicoId && { ordemServicoId }),
          ...(status && { status }),
        },
        include: {
          ordemServico: { select: { id: true, numero: true } },
          responsavel: { select: { id: true, nome: true } },
        },
        orderBy: [{ status: 'asc' }, { prazo: 'asc' }, { criadoEm: 'desc' }],
        take: limit,
      })
      return reply.send({ data: itens })
    },
  )

  // ── POST /pendencias ────────────────────────────────────────────────────────
  app.post(
    '/',
    {
      schema: {
        body: z.object({
          ordemServicoId: z.string().uuid(),
          descricao: z.string().min(3),
          prioridade: PRIORIDADE.default('MEDIA'),
          prazo: dataStr.optional(),
          responsavelId: z.string().uuid().optional(),
          observacao: z.string().optional(),
        }),
        tags: ['pendencias'],
      },
    },
    async (req, reply) => {
      exigirAcessoCampo(req)
      // Valida que a OS pertence ao tenant e deriva o empreendimento dela
      const os = await prisma.ordemServico.findFirst({
        where: {
          id: req.body.ordemServicoId,
          tenantId: tid(req),
          ...montarFiltroEscopoEmpreendimento(req.user, 'empreendimentoId'),
        },
        select: { id: true, empreendimentoId: true },
      })
      if (!os) throw new NotFoundError('OrdemServico', req.body.ordemServicoId)

      const pendencia = await prisma.pendenciaCampo.create({
        data: {
          tenantId: tid(req),
          ordemServicoId: os.id,
          empreendimentoId: os.empreendimentoId,
          descricao: req.body.descricao,
          prioridade: req.body.prioridade,
          prazo: req.body.prazo ? new Date(`${req.body.prazo}T00:00:00.000Z`) : undefined,
          responsavelId: req.body.responsavelId,
          observacao: req.body.observacao,
          criadoPorId: req.user.id,
        },
      })
      return reply.status(201).send({ data: pendencia })
    },
  )

  // ── PATCH /pendencias/:id ─────────────────────────────────────────────────────
  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          status: STATUS.optional(),
          prioridade: PRIORIDADE.optional(),
          responsavelId: z.string().uuid().nullable().optional(),
          observacao: z.string().optional(),
        }),
        tags: ['pendencias'],
      },
    },
    async (req, reply) => {
      exigirAcessoCampo(req)
      const pendencia = await prisma.pendenciaCampo.findFirst({
        where: {
          id: req.params.id,
          tenantId: tid(req),
          ...montarFiltroEscopoEmpreendimento(req.user, 'empreendimentoId'),
        },
      })
      if (!pendencia) throw new NotFoundError('PendenciaCampo', req.params.id)

      const resolvendoAgora = req.body.status === 'RESOLVIDA' && pendencia.status !== 'RESOLVIDA'
      const updated = await prisma.pendenciaCampo.update({
        where: { id: pendencia.id },
        data: {
          ...(req.body.status && { status: req.body.status }),
          ...(req.body.prioridade && { prioridade: req.body.prioridade }),
          ...(req.body.responsavelId !== undefined && { responsavelId: req.body.responsavelId }),
          ...(req.body.observacao !== undefined && { observacao: req.body.observacao }),
          ...(resolvendoAgora && { resolvidoEm: new Date() }),
        },
      })
      return reply.send({ data: updated })
    },
  )
}
