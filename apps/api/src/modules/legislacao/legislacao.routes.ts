import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { schedulerQueue } from '../../infra/queue/bullmq.js'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { registrarAuditoria, extrairIp } from '../../shared/middleware/audit.js'

// ─────────────────────────────────────────────────────────────────────────────
// LEGISLAÇÃO ROUTES — publicações do Diário Oficial classificadas por IA
// ─────────────────────────────────────────────────────────────────────────────

export const legislacaoRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  // GET / — lista publicações relevantes
  app.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(30),
        relevante: z.enum(['true', 'false', 'all']).default('true'),
        impacto: z.string().optional(),
        classificacao: z.string().optional(),
        dias: z.coerce.number().int().min(1).max(365).default(30),
      }),
      tags: ['legislacao'],
    },
  }, async (req, reply) => {
    const { page, limit, relevante, impacto, classificacao, dias } = req.query
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)

    const where = {
      dataPublicacao: { gte: desde },
      ...(relevante !== 'all' && { relevante: relevante === 'true' }),
      ...(impacto && { impacto }),
      ...(classificacao && { classificacao }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.publicacaoDO.count({ where }),
      prisma.publicacaoDO.findMany({
        where,
        orderBy: [{ dataPublicacao: 'desc' }, { impacto: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fonte: true,
          dataPublicacao: true,
          secao: true,
          titulo: true,
          url: true,
          keywordsMatch: true,
          relevante: true,
          classificacao: true,
          impacto: true,
          resumoIA: true,
          criadoEm: true,
        },
      }),
    ])

    return reply.send({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  })

  // POST /:id/tarefa — cria tarefa de análise a partir de uma publicação
  app.post('/:id/tarefa', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        empreendimentoId: z.string().uuid(),
        dataVencimento: z.string().datetime().optional(),
        prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']).default('MEDIA'),
      }),
      tags: ['legislacao'],
      summary: 'Cria tarefa de análise a partir de publicação do DOU',
    },
  }, async (req, reply) => {
    const { tenantId, id: criadorId } = req.user
    const { id } = req.params
    const { empreendimentoId, dataVencimento, prioridade } = req.body

    const publicacao = await prisma.publicacaoDO.findUnique({ where: { id } })
    if (!publicacao) return reply.status(404).send({ error: 'Publicação não encontrada' })

    const emp = await prisma.empreendimento.findFirst({ where: { id: empreendimentoId, tenantId } })
    if (!emp) return reply.status(404).send({ error: 'Empreendimento não encontrado' })

    const linhasDescricao: string[] = []
    if (publicacao.resumoIA) linhasDescricao.push(`Resumo IA: ${publicacao.resumoIA}`)
    if (publicacao.url) linhasDescricao.push(`Fonte: ${publicacao.url}`)
    linhasDescricao.push(`Publicação: ${publicacao.fonte} — ${publicacao.dataPublicacao.toISOString().split('T')[0]}`)

    const tarefa = await prisma.tarefa.create({
      data: {
        tenantId,
        empreendimentoId,
        criadorId,
        titulo: `Analisar: ${publicacao.titulo}`.slice(0, 300),
        descricao: linhasDescricao.join('\n\n'),
        prioridade,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        metadados: { publicacaoId: publicacao.id, fonte: publicacao.fonte },
      },
      select: { id: true, titulo: true, prioridade: true, criadoEm: true },
    })

    await registrarAuditoria({
      tenantId,
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      usuarioEmail: req.user.email,
      usuarioPerfil: req.user.perfil,
      acao: 'tarefa.criada_via_legislacao',
      entidadeTipo: 'Tarefa',
      entidadeId: tarefa.id,
      ipOrigem: extrairIp(req),
      contexto: { empreendimentoId, publicacaoId: publicacao.id, fonte: publicacao.fonte },
    })

    return reply.status(201).send({ data: tarefa })
  })

  // POST /monitorar — dispara o job imediatamente (admin/debug)
  app.post('/monitorar', {
    schema: { tags: ['legislacao'] },
  }, async (req, reply) => {
    if (!['ADMIN_TENANT', 'SUPER_ADMIN'].includes(req.user.perfil)) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
    await schedulerQueue.add('monitorar-diario-oficial', {}, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 30000 },
    })
    return reply.status(202).send({ message: 'Job de monitoramento do DOU enfileirado.' })
  })
}
