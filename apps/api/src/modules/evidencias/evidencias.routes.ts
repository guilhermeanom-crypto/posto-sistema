import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { NotFoundError, ForbiddenError } from '../../shared/errors/app-errors.js'
import { storageService } from '../../infra/storage/storage.service.js'
import { montarFiltroEscopoEmpreendimento } from '../../shared/security/empreendimento-access.js'

// ─────────────────────────────────────────────────────────────────────────────
// EVIDÊNCIAS DE CAMPO — registros/fotos de vistoria (app da equipe).
// Foto opcional (upload presigned). Validação pelo analista. Tudo tenant-scoped.
// ─────────────────────────────────────────────────────────────────────────────

const tid = (req: FastifyRequest) => req.user.tenantId
const STATUS_VALIDACAO = z.enum(['PENDENTE', 'VALIDADA', 'REJEITADA'])
const PERFIS_CAMPO = new Set(['ANALISTA_CAMPO', 'ANALISTA', 'COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'])
const PERFIS_VALIDACAO = ['ANALISTA', 'ANALISTA_CAMPO', 'COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN']

export const evidenciasRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const exigirAcessoCampo = (req: FastifyRequest) => {
    if (!PERFIS_CAMPO.has(req.user.perfil)) {
      throw new ForbiddenError('Sem permissão para acessar evidências de campo')
    }
  }

  // ── GET /evidencias ───────────────────────────────────────────────────────────
  app.get(
    '/',
    {
      schema: {
        querystring: z.object({
          ordemServicoId: z.string().uuid().optional(),
          empreendimentoId: z.string().uuid().optional(),
          statusValidacao: STATUS_VALIDACAO.optional(),
          limit: z.coerce.number().int().min(1).max(100).default(50),
        }),
        tags: ['evidencias'],
      },
    },
    async (req, reply) => {
      exigirAcessoCampo(req)
      const { ordemServicoId, empreendimentoId, statusValidacao, limit } = req.query
      const itens = await prisma.evidenciaCampo.findMany({
        where: {
          tenantId: tid(req),
          ...montarFiltroEscopoEmpreendimento(req.user, 'empreendimentoId', empreendimentoId),
          ...(ordemServicoId && { ordemServicoId }),
          ...(statusValidacao && { statusValidacao }),
        },
        include: {
          ordemServico: { select: { id: true, numero: true } },
          capturadoPor: { select: { id: true, nome: true } },
          validadoPor: { select: { id: true, nome: true } },
        },
        orderBy: { capturadoEm: 'desc' },
        take: limit,
      })
      return reply.send({ data: itens })
    },
  )

  // ── POST /evidencias ──────────────────────────────────────────────────────────
  app.post(
    '/',
    {
      schema: {
        body: z.object({
          ordemServicoId: z.string().uuid(),
          setor: z.string().min(1),
          nota: z.string().min(1),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        }),
        tags: ['evidencias'],
      },
    },
    async (req, reply) => {
      exigirAcessoCampo(req)
      const os = await prisma.ordemServico.findFirst({
        where: {
          id: req.body.ordemServicoId,
          tenantId: tid(req),
          ...montarFiltroEscopoEmpreendimento(req.user, 'empreendimentoId'),
        },
        select: { id: true, empreendimentoId: true },
      })
      if (!os) throw new NotFoundError('OrdemServico', req.body.ordemServicoId)

      const evidencia = await prisma.evidenciaCampo.create({
        data: {
          tenantId: tid(req),
          ordemServicoId: os.id,
          empreendimentoId: os.empreendimentoId,
          setor: req.body.setor,
          nota: req.body.nota,
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          capturadoPorId: req.user.id,
        },
      })
      return reply.status(201).send({ data: evidencia })
    },
  )

  // ── POST /evidencias/:id/foto ─ gera URL de upload e anexa metadados da foto ────
  app.post(
    '/:id/foto',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          nomeArquivo: z.string().min(1),
          mimeType: z.string().regex(/^image\//, 'A evidência aceita apenas imagens'),
        }),
        tags: ['evidencias'],
      },
    },
    async (req, reply) => {
      exigirAcessoCampo(req)
      const evidencia = await prisma.evidenciaCampo.findFirst({
        where: {
          id: req.params.id,
          tenantId: tid(req),
          ...montarFiltroEscopoEmpreendimento(req.user, 'empreendimentoId'),
        },
        select: { id: true },
      })
      if (!evidencia) throw new NotFoundError('EvidenciaCampo', req.params.id)

      const ext = req.body.nomeArquivo.split('.').pop() ?? 'jpg'
      const chaveS3 = `evidencias/${tid(req)}/${evidencia.id}.${ext}`
      const { uploadUrl, expiraEm } = await storageService.gerarUrlUpload(chaveS3, req.body.mimeType)

      await prisma.evidenciaCampo.update({
        where: { id: evidencia.id },
        data: { chaveS3, arquivoNome: req.body.nomeArquivo, arquivoMime: req.body.mimeType },
      })

      const expiresIn = Math.floor((expiraEm.getTime() - Date.now()) / 1000)
      return reply.send({ data: { uploadUrl, chaveS3, expiresIn } })
    },
  )

  // ── PATCH /evidencias/:id/validar ─ analista valida/rejeita ────────────────────
  app.patch(
    '/:id/validar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ statusValidacao: z.enum(['VALIDADA', 'REJEITADA']) }),
        tags: ['evidencias'],
      },
    },
    async (req, reply) => {
      if (!PERFIS_VALIDACAO.includes(req.user.perfil)) {
        throw new ForbiddenError('Sem permissão para validar evidências.')
      }
      const evidencia = await prisma.evidenciaCampo.findFirst({
        where: {
          id: req.params.id,
          tenantId: tid(req),
          ...montarFiltroEscopoEmpreendimento(req.user, 'empreendimentoId'),
        },
        select: { id: true },
      })
      if (!evidencia) throw new NotFoundError('EvidenciaCampo', req.params.id)

      const updated = await prisma.evidenciaCampo.update({
        where: { id: evidencia.id },
        data: {
          statusValidacao: req.body.statusValidacao,
          validadoPorId: req.user.id,
          validadoEm: new Date(),
        },
      })
      return reply.send({ data: updated })
    },
  )
}
