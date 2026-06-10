import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { executarGapAnalysis } from './gap-analysis.service.js'
import { gerarPreviewOrcamentoDiagnostico } from './budget-preview.service.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'
import type { Prisma } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING ROUTES
// ─────────────────────────────────────────────────────────────────────────────

export const onboardingRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  // ── Wizard de setup do tenant ────────────────────────────────────────────

  /**
   * GET /api/v1/onboarding/progresso
   * Retorna o progresso do wizard de onboarding e counts de configuração
   */
  app.get(
    '/progresso',
    { schema: { tags: ['onboarding'], summary: 'Progresso do wizard de onboarding do tenant' } },
    async (request, reply) => {
      const tenantId = request.user.tenantId

      const [tenant, empresas, empreendimentosCount, usuariosCount] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { configuracoes: true } }),
        prisma.empresa.findMany({ where: { tenantId, ativo: true }, select: { id: true, nome: true, cnpj: true } }),
        prisma.empreendimento.count({ where: { tenantId, ativo: true } }),
        prisma.usuario.count({ where: { tenantId, ativo: true } }),
      ])

      const config = (tenant?.configuracoes as Record<string, unknown>) ?? {}
      const onboarding = (config.onboarding as { etapa?: number; concluido?: boolean }) ?? {}

      return reply.status(200).send({
        data: {
          etapa: onboarding.etapa ?? 1,
          concluido: onboarding.concluido ?? false,
          empresas,
          empreendimentosCount,
          usuariosCount,
        },
      })
    },
  )

  /**
   * PATCH /api/v1/onboarding/progresso
   * Salva a etapa atual do wizard no tenant (configuracoes JSON)
   */
  app.patch(
    '/progresso',
    {
      schema: {
        body: z.object({
          etapa: z.number().int().min(1).max(5),
          concluido: z.boolean().optional(),
        }),
        tags: ['onboarding'],
        summary: 'Atualiza etapa do wizard de onboarding',
      },
    },
    async (request, reply) => {
      const tenantId = request.user.tenantId

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { configuracoes: true } })
      const config = (tenant?.configuracoes as Record<string, unknown>) ?? {}

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          configuracoes: {
            ...config,
            onboarding: {
              etapa: request.body.etapa,
              concluido: request.body.concluido ?? false,
              atualizadoEm: new Date().toISOString(),
            },
          } satisfies Prisma.InputJsonValue,
        },
      })

      return reply.status(200).send({ data: { etapa: request.body.etapa } })
    },
  )

  /**
   * POST /api/v1/onboarding/importar-empreendimentos
   * Importação em lote de empreendimentos via CSV (pré-parseado no cliente)
   */
  app.post(
    '/importar-empreendimentos',
    {
      schema: {
        body: z.object({
          empresaId: z.string().uuid(),
          empreendimentos: z.array(
            z.object({
              nome: z.string().min(2).max(200),
              nomeFantasia: z.string().max(200).optional(),
              cnpj: z.string().optional(),
              bandeira: z.string().max(100).optional(),
              tipo: z.enum(['revendedor', 'distribuidor', 'transportador', 'outros']).optional(),
              logradouro: z.string().min(2).max(300),
              numero: z.string().min(1).max(20),
              complemento: z.string().max(100).optional(),
              bairro: z.string().min(2).max(100),
              cidade: z.string().min(2).max(100),
              estado: z.string().length(2),
              cep: z.string().max(9),
            }),
          ).min(1).max(200),
        }),
        tags: ['onboarding'],
        summary: 'Importação em lote de empreendimentos (CSV)',
      },
    },
    async (request, reply) => {
      const { empresaId, empreendimentos } = request.body
      const tenantId = request.user.tenantId

      // Verifica que a empresa pertence ao tenant
      const empresa = await prisma.empresa.findFirst({ where: { id: empresaId, tenantId } })
      if (!empresa) throw new NotFoundError('Empresa', empresaId)

      let criados = 0
      const erros: { linha: number; erro: string }[] = []

      for (let i = 0; i < empreendimentos.length; i++) {
        const e = empreendimentos[i]!
        try {
          await prisma.empreendimento.create({
            data: {
              tenantId,
              empresaId,
              nome: e.nome,
              nomeFantasia: e.nomeFantasia,
              cnpj: e.cnpj,
              bandeira: e.bandeira,
              tipo: e.tipo,
              logradouro: e.logradouro,
              numero: e.numero,
              complemento: e.complemento,
              bairro: e.bairro,
              cidade: e.cidade,
              estado: e.estado,
              cep: e.cep,
              atividades: [],
            },
          })
          criados++
        } catch (err) {
          erros.push({ linha: i + 2, erro: (err as Error).message })
        }
      }

      return reply.status(200).send({
        data: { criados, erros, mensagem: `${criados} posto(s) importado(s).` },
      })
    },
  )

  /**
   * GET /api/v1/onboarding/gap-analysis/:empreendimentoId
   *
   * Retorna o gap analysis de obrigações regulatórias do posto:
   * quais obrigações estão conformes, a renovar ou sem dados cadastrados.
   */
  app.get(
    '/gap-analysis/:empreendimentoId',
    {
      schema: {
        tags: ['onboarding'],
        summary: 'Gap analysis de obrigações regulatórias do empreendimento',
        params: z.object({ empreendimentoId: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { empreendimentoId } = request.params

      const empreendimento = await prisma.empreendimento.findFirst({
        where: { id: empreendimentoId, tenantId: request.user.tenantId },
      })
      if (!empreendimento) throw new NotFoundError('Empreendimento não encontrado')

      const resultado = await executarGapAnalysis(
        prisma,
        empreendimentoId,
        request.user.tenantId,
      )

      return reply.status(200).send({ data: resultado })
    },
  )

  app.post(
    '/gap-analysis/:empreendimentoId/orcamento-preview',
    {
      schema: {
        tags: ['onboarding'],
        summary: 'Gera preview de orçamento a partir dos gaps regulatórios do empreendimento',
        params: z.object({ empreendimentoId: z.string().uuid() }),
        body: z.object({
          perfil: z.object({
            porte: z.enum(['pequeno', 'medio', 'grande']).optional(),
            situacao: z.enum(['implantacao', 'operacao', 'irregular', 'ampliacao']).optional(),
            potencialPoluidor: z.enum(['baixo', 'medio', 'alto', 'muito_alto']).optional(),
            areaM2: z.number().positive().optional(),
          }).optional(),
          incluirStatus: z.array(z.enum(['SEM_DADOS', 'A_RENOVAR', 'CONFORME'])).optional(),
          apenasCodigos: z.array(z.string()).optional(),
        }).optional(),
      },
    },
    async (request, reply) => {
      const { empreendimentoId } = request.params

      const empreendimento = await prisma.empreendimento.findFirst({
        where: { id: empreendimentoId, tenantId: request.user.tenantId },
        select: { id: true },
      })
      if (!empreendimento) throw new NotFoundError('Empreendimento não encontrado')

      const resultado = await gerarPreviewOrcamentoDiagnostico(prisma, {
        tenantId: request.user.tenantId,
        empreendimentoId,
        perfil: request.body?.perfil,
        incluirStatus: request.body?.incluirStatus,
        apenasCodigos: request.body?.apenasCodigos,
      })

      return reply.status(200).send({ data: resultado })
    },
  )

  /**
   * POST /api/v1/onboarding/gap-analysis/:empreendimentoId/gerar-tarefas
   *
   * Gera tarefas automaticamente para cada obrigação com status SEM_DADOS.
   * Idempotente: não duplica tarefas já existentes com o mesmo título.
   */
  app.post(
    '/gap-analysis/:empreendimentoId/gerar-tarefas',
    {
      schema: {
        tags: ['onboarding'],
        summary: 'Gera tarefas para cada gap regulatório identificado',
        params: z.object({ empreendimentoId: z.string().uuid() }),
        body: z.object({
          apenasModulos: z.array(z.string()).optional(),
          apenasCriticidade: z.array(z.enum(['CRITICA', 'ALTA', 'MEDIA'])).optional(),
          responsavelId: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { empreendimentoId } = request.params
      const { apenasModulos, apenasCriticidade, responsavelId } = request.body

      const empreendimento = await prisma.empreendimento.findFirst({
        where: { id: empreendimentoId, tenantId: request.user.tenantId },
      })
      if (!empreendimento) throw new NotFoundError('Empreendimento não encontrado')

      const resultado = await executarGapAnalysis(
        prisma,
        empreendimentoId,
        request.user.tenantId,
      )

      // Filtra os itens que precisam de ação
      let itensParaGerar = resultado.itens.filter(
        (i) => i.status === 'SEM_DADOS' || i.status === 'A_RENOVAR',
      )

      if (apenasModulos && apenasModulos.length > 0) {
        itensParaGerar = itensParaGerar.filter((i) => apenasModulos.includes(i.modulo))
      }

      if (apenasCriticidade && apenasCriticidade.length > 0) {
        itensParaGerar = itensParaGerar.filter((i) =>
          apenasCriticidade.includes(i.criticidade as never),
        )
      }

      const prioridadeMap: Record<string, 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'> = {
        CRITICA: 'CRITICA',
        ALTA: 'ALTA',
        MEDIA: 'MEDIA',
      }

      let criadas = 0
      let ignoradas = 0

      for (const item of itensParaGerar) {
        const titulo =
          item.status === 'A_RENOVAR'
            ? `[RENOVAR] ${item.descricao}`
            : `[REGULARIZAR] ${item.descricao}`

        const existente = await prisma.tarefa.findFirst({
          where: {
            tenantId: request.user.tenantId,
            empreendimentoId,
            titulo,
            status: { notIn: ['CONCLUIDA', 'CANCELADA'] },
          },
        })

        if (existente) {
          ignoradas++
          continue
        }

        await prisma.tarefa.create({
          data: {
            tenantId: request.user.tenantId,
            empreendimentoId,
            titulo,
            descricao: [
              item.descricao,
              item.fundamentoLegal ? `Base legal: ${item.fundamentoLegal}` : null,
              item.observacoes,
              `Periodicidade: ${item.periodicidade}`,
              item.tipoDocumentoRef ? `Documento necessário: ${item.tipoDocumentoRef}` : null,
            ]
              .filter(Boolean)
              .join('\n\n'),
            status: 'PENDENTE',
            prioridade: prioridadeMap[item.criticidade] ?? 'MEDIA',
            origem: 'REGRA_REQUISITO_PENDENTE',
            responsavelId: responsavelId ?? null,
            criadorId: request.user.id,
            metadados: {
              origem: 'gap-analysis',
              codigoObrigacao: item.codigo,
              modulo: item.modulo,
              statusGap: item.status,
            },
          },
        })

        criadas++
      }

      return reply.status(200).send({
        data: {
          empreendimentoId,
          itensAnalisados: itensParaGerar.length,
          tarefasCriadas: criadas,
          tarefasIgnoradas: ignoradas,
          mensagem: `${criadas} tarefa(s) criada(s), ${ignoradas} já existiam.`,
        },
      })
    },
  )

  /**
   * GET /api/v1/onboarding/catalogo
   *
   * Retorna o catálogo completo de obrigações regulatórias base.
   * Útil para exibir na tela de onboarding o que o sistema irá verificar.
   */
  app.get(
    '/catalogo',
    {
      schema: {
        tags: ['onboarding'],
        summary: 'Catálogo de obrigações regulatórias base',
        querystring: z.object({
          tipoEmpreendimento: z.string().optional(),
          uf: z.string().length(2).optional(),
          modulo: z.string().optional(),
          criticidade: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { tipoEmpreendimento, uf, modulo, criticidade } = request.query

      const obrigacoes = await prisma.obrigacaoRegulatoriaBase.findMany({
        where: {
          ativo: true,
          ...(tipoEmpreendimento
            ? { tipoEmpreendimento: { in: [tipoEmpreendimento, 'todos'] } }
            : {}),
          ...(uf ? { OR: [{ uf: null }, { uf }] } : {}),
          ...(modulo ? { modulo } : {}),
          ...(criticidade ? { criticidade } : {}),
        },
        orderBy: [{ modulo: 'asc' }, { codigo: 'asc' }],
      })

      // Agrupa por módulo para facilitar renderização no frontend
      const porModulo = obrigacoes.reduce<Record<string, typeof obrigacoes>>(
        (acc, o) => {
          if (!acc[o.modulo]) acc[o.modulo] = []
          acc[o.modulo]!.push(o)
          return acc
        },
        {},
      )

      return reply.status(200).send({
        data: {
          total: obrigacoes.length,
          modulos: Object.entries(porModulo).map(([nome, itens]) => ({
            nome,
            total: itens.length,
            criticas: itens.filter((i) => i.criticidade === 'CRITICA').length,
            altas: itens.filter((i) => i.criticidade === 'ALTA').length,
            medias: itens.filter((i) => i.criticidade === 'MEDIA').length,
            itens,
          })),
        },
      })
    },
  )
}
