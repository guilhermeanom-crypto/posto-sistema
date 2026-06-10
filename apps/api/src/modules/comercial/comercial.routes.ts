import type { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'
import { catalogoService } from './catalogo.service.js'
import { DiagnosticoService } from './diagnostico.service.js'
import { filtrosCatalogoSchema, servicoCatalogoPublicoSchema, servicoCatalogoAdminSchema } from './catalogo.schemas.js'
import { diagnosticoInputSchema, diagnosticoResultadoSchema } from './diagnostico.schemas.js'
import {
  atualizarPropostaComercialSchema,
  criarPropostaComercialSchema,
  filtrosPropostaComercialSchema,
  propostaComercialDetalhePublicoSchema,
  propostaComercialResumoPublicoSchema,
} from './propostas.schemas.js'
import { propostasService } from './propostas.service.js'
import {
  atualizarContratoSchema,
  contratoDetalheSchema,
  contratoKpisSchema,
  contratoResumoSchema,
  criarContratoSchema,
  filtrosContratoSchema,
} from './contratos.schemas.js'
import { contratosService } from './contratos.service.js'
import { calcularFinanceiroResumo } from './financeiro.service.js'
import { STATUS_HANDOFF_COMERCIAL } from '../operacao/handoffs.types.js'
import { handoffsService } from '../operacao/handoffs.service.js'
import { AppError, ForbiddenError } from '../../shared/errors/app-errors.js'

const PERFIS_LEITURA_CONTRATO = ['EXECUTIVO', 'COORDENADOR', 'ANALISTA', 'ADMIN_TENANT', 'SUPER_ADMIN'] as const
const PERFIS_GESTAO_CONTRATO = ['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'] as const

function assertPodeLerContratos(perfil: string) {
  if (!PERFIS_LEITURA_CONTRATO.includes(perfil as (typeof PERFIS_LEITURA_CONTRATO)[number])) {
    throw new ForbiddenError('Sem permissão para consultar contratos.')
  }
}

function assertPodeGerenciarContratos(perfil: string) {
  if (!PERFIS_GESTAO_CONTRATO.includes(perfil as (typeof PERFIS_GESTAO_CONTRATO)[number])) {
    throw new ForbiddenError('Sem permissão para criar ou atualizar contratos.')
  }
}

const diagnosticoService = new DiagnosticoService()
const PERFIS_AUTORIZADOS_HANDOFF = ['EXECUTIVO', 'COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'] as const

const servicoResumoHandoffSchema = z.object({
  itemId: z.string().uuid().optional(),
  nome: z.string(),
  categoria: z.string().optional(),
  quantidade: z.number().nullable().optional(),
  unidade: z.string().optional(),
  escopoAprovado: z.string().optional(),
  observacaoOperacional: z.string().optional(),
})

const origemSnapshotSaneadoHandoffSchema = z.object({
  schemaVersion: z.literal(1),
  proposta: z.object({
    id: z.string().uuid(),
    numero: z.string(),
    origem: z.enum(['TRIAGEM_CNAE', 'CRM', 'ONBOARDING', 'MANUAL']),
    statusOrigem: z.literal('APROVADA'),
    dataAprovacao: z.string().nullable().optional(),
    dataValidade: z.string().nullable().optional(),
  }),
  contato: z.object({
    nomeLead: z.string().nullable().optional(),
    empresaLead: z.string().nullable().optional(),
    documentoLead: z.string().nullable().optional(),
    emailContato: z.string().nullable().optional(),
    telefoneContato: z.string().nullable().optional(),
    municipio: z.string().nullable().optional(),
    uf: z.string().nullable().optional(),
  }),
  referencias: z.object({
    tenantId: z.string().uuid(),
    leadWhatsAppId: z.string().uuid().nullable().optional(),
    empreendimentoId: z.string().uuid().nullable().optional(),
    propostaComercialId: z.string().uuid(),
  }),
  diagnostico: z.object({
    cnaePrincipalCodigo: z.string().nullable().optional(),
    cnaePrincipalDescricao: z.string().nullable().optional(),
    riscoNivel: z.enum(['BAIXO', 'MEDIO', 'ALTO', 'CRITICO']).nullable().optional(),
    riscoScore: z.number().nullable().optional(),
    potencialPoluidor: z.enum(['BAIXO', 'MEDIO', 'ALTO']).nullable().optional(),
    licenciamentoTipo: z.string().nullable().optional(),
    orgaoCompetente: z.string().nullable().optional(),
    esfera: z.enum(['FEDERAL', 'ESTADUAL', 'MUNICIPAL']).nullable().optional(),
    alertasResumo: z.array(z.string()).optional(),
    proximosPassosResumo: z.array(z.string()).optional(),
  }),
  comercial: z.object({
    observacoesLiberadas: z.string().nullable().optional(),
  }),
})

const handoffComercialSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  propostaComercialId: z.string().uuid(),
  leadWhatsAppId: z.string().uuid().nullable(),
  empreendimentoId: z.string().uuid().nullable(),
  criadoPorId: z.string().uuid(),
  responsavelComercialId: z.string().uuid(),
  responsavelOperacionalId: z.string().uuid().nullable(),
  status: z.enum(STATUS_HANDOFF_COMERCIAL),
  statusPropostaOrigem: z.literal('APROVADA'),
  origemProposta: z.enum(['TRIAGEM_CNAE', 'CRM', 'ONBOARDING', 'MANUAL']),
  numeroProposta: z.string(),
  dataAprovacaoProposta: z.date().nullable(),
  dataValidadeProposta: z.date().nullable(),
  nomeLead: z.string().nullable(),
  empresaLead: z.string().nullable(),
  documentoLead: z.string().nullable(),
  emailContato: z.string().nullable(),
  telefoneContato: z.string().nullable(),
  municipio: z.string().nullable(),
  uf: z.string().nullable(),
  cnaePrincipalCodigo: z.string().nullable(),
  cnaePrincipalDescricao: z.string().nullable(),
  riscoNivel: z.enum(['BAIXO', 'MEDIO', 'ALTO', 'CRITICO']).nullable(),
  riscoScore: z.number().nullable(),
  potencialPoluidor: z.enum(['BAIXO', 'MEDIO', 'ALTO']).nullable(),
  licenciamentoTipo: z.string().nullable(),
  orgaoCompetente: z.string().nullable(),
  esfera: z.enum(['FEDERAL', 'ESTADUAL', 'MUNICIPAL']).nullable(),
  alertasResumo: z.array(z.string()),
  proximosPassosResumo: z.array(z.string()),
  observacoesLiberadas: z.string().nullable(),
  servicosResumo: z.array(servicoResumoHandoffSchema),
  origemSnapshotSaneado: origemSnapshotSaneadoHandoffSchema,
  pendenciasOperacionais: z.array(z.string()),
  observacoesOperacionais: z.string().nullable(),
  assumidoEm: z.date().nullable(),
  concluidoEm: z.date().nullable(),
  canceladoEm: z.date().nullable(),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
})

export const comercialRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const ctx = (request: FastifyRequest) => ({
    id: request.user.id,
    tenantId: request.user.tenantId,
    perfil: request.user.perfil,
    nome: request.user.nome,
    email: request.user.email,
    ip: extrairIp(request),
  })

  /**
   * GET /api/v1/comercial/catalogo
   * Listagem autenticada e sanitizada do catálogo
   */
  app.get(
    '/catalogo',
    {
      schema: {
        querystring: filtrosCatalogoSchema,
        response: {
          200: z.object({
            data: z.array(servicoCatalogoPublicoSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
        tags: ['comercial'],
        summary: 'Lista serviços do catálogo (visão autenticada/sanitizada)',
      },
    },
    async (request, reply) => {
      const result = await catalogoService.listarPublico(request.query)
      
      return reply.status(200).send({
        data: result.items,
        pagination: {
          page: request.query.page,
          limit: request.query.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / request.query.limit),
        },
      })
    }
  )

  /**
   * GET /api/v1/comercial/catalogo/admin
   * Listagem administrativa completa (requer ADMIN)
   */
  app.get(
    '/catalogo/admin',
    {
      schema: {
        querystring: filtrosCatalogoSchema,
        response: {
          200: z.object({
            data: z.array(servicoCatalogoAdminSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
        tags: ['comercial'],
        summary: 'Lista serviços do catálogo (visão administrativa/completa)',
      },
    },
    async (request, reply) => {
      // Verifica se é administrador
      if (request.user.perfil !== 'ADMIN') {
        throw new AppError('Acesso negado. Requer perfil administrativo.', 'FORBIDDEN', 403)
      }

      const result = await catalogoService.listarAdministrativo(request.query)

      return reply.status(200).send({
        data: result.items,
        pagination: {
          page: request.query.page,
          limit: request.query.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / request.query.limit),
        },
      })
    }
  )

  /**
   * GET /api/v1/comercial/catalogo/:id
   */
  app.get(
    '/catalogo/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['comercial'],
        summary: 'Retorna detalhes de um serviço do catálogo',
      },
    },
    async (request, reply) => {
      const isAdmin = request.user.perfil === 'ADMIN'
      const servico = await catalogoService.buscarPorId(request.params.id, isAdmin)

      if (!servico) {
        throw new AppError('Serviço não encontrado.', 'NOT_FOUND', 404)
      }

      return reply.status(200).send({ data: servico })
    }
  )

  /**
   * POST /api/v1/comercial/diagnostico/cnae
   * Gera um diagnóstico preliminar baseado em CNAEs e contexto
   */
  app.post(
    '/diagnostico/cnae',
    {
      schema: {
        body: diagnosticoInputSchema,
        response: {
          200: z.object({
            data: diagnosticoResultadoSchema,
          }),
        },
        tags: ['comercial'],
        summary: 'Gera diagnóstico comercial preliminar por CNAE',
      },
    },
    async (request, reply) => {
      const result = await diagnosticoService.gerarDiagnostico(request.body)
      return reply.status(200).send({ data: result })
    },
  )

  /**
   * POST /api/v1/comercial/propostas
   * Cria proposta comercial persistida a partir de um diagnóstico
   */
  app.post(
    '/propostas',
    {
      schema: {
        body: criarPropostaComercialSchema,
        response: {
          201: z.object({
            data: propostaComercialDetalhePublicoSchema,
          }),
        },
        tags: ['comercial'],
        summary: 'Cria proposta comercial persistida a partir do diagnóstico por CNAE',
      },
    },
    async (request, reply) => {
      const proposta = await propostasService.criar(ctx(request), request.body)
      return reply.status(201).send({ data: proposta })
    },
  )

  /**
   * GET /api/v1/comercial/propostas
   * Lista propostas comerciais do tenant
   */
  app.get(
    '/propostas',
    {
      schema: {
        querystring: filtrosPropostaComercialSchema,
        response: {
          200: z.object({
            data: z.array(propostaComercialResumoPublicoSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
        tags: ['comercial'],
        summary: 'Lista propostas comerciais com filtros e paginação',
      },
    },
    async (request, reply) => {
      const result = await propostasService.listar(ctx(request), request.query)
      return reply.status(200).send({
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      })
    },
  )

  /**
   * GET /api/v1/comercial/propostas/:id
   * Detalhe de uma proposta comercial
   */
  app.get(
    '/propostas/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.object({
            data: propostaComercialDetalhePublicoSchema,
          }),
        },
        tags: ['comercial'],
        summary: 'Retorna detalhes de uma proposta comercial',
      },
    },
    async (request, reply) => {
      const proposta = await propostasService.buscarPorId(ctx(request), request.params.id)
      return reply.status(200).send({ data: proposta })
    },
  )

  /**
   * GET /api/v1/comercial/propostas/:id/pdf
   * Baixa PDF da proposta comercial persistida
   */
  app.get(
    '/propostas/:id/pdf',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        tags: ['comercial'],
        summary: 'Gera e retorna o PDF da proposta comercial',
      },
    },
    async (request, reply) => {
      const pdf = await propostasService.gerarPdf(ctx(request), request.params.id)

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${pdf.fileName}"`)
        .send(pdf.content)
    },
  )

  /**
   * POST /api/v1/comercial/propostas/:id/handoff
   * Cria handoff operacional controlado a partir de proposta aprovada
   */
  app.post(
    '/propostas/:id/handoff',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: {
          201: z.object({
            data: handoffComercialSchema,
          }),
        },
        tags: ['comercial'],
        summary: 'Cria handoff comercial para operação a partir de proposta aprovada',
      },
    },
    async (request, reply) => {
      if (!PERFIS_AUTORIZADOS_HANDOFF.includes(request.user.perfil as (typeof PERFIS_AUTORIZADOS_HANDOFF)[number])) {
        throw new ForbiddenError('Sem permissão para iniciar handoff comercial')
      }

      const handoff = await handoffsService.criar({
        tenantId: request.user.tenantId,
        propostaComercialId: request.params.id,
        usuarioId: request.user.id,
      })

      return reply.status(201).send({ data: handoff })
    },
  )

  /**
   * PATCH /api/v1/comercial/propostas/:id
   * Atualiza dados comerciais simples da proposta
   */
  app.patch(
    '/propostas/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarPropostaComercialSchema,
        response: {
          200: z.object({
            data: propostaComercialDetalhePublicoSchema,
          }),
        },
        tags: ['comercial'],
        summary: 'Atualiza status, validade e observações comerciais de uma proposta',
      },
    },
    async (request, reply) => {
      const proposta = await propostasService.atualizar(ctx(request), request.params.id, request.body)
      return reply.status(200).send({ data: proposta })
    },
  )

  /**
   * POST /api/v1/comercial/contratos
   * Emite um contrato a partir de um HandoffComercial valido
   */
  app.post(
    '/contratos',
    {
      schema: {
        body: criarContratoSchema,
        response: { 201: z.object({ data: contratoDetalheSchema }) },
        tags: ['comercial', 'contratos'],
        summary: 'Cria um contrato vinculado a um handoff comercial existente',
      },
    },
    async (request, reply) => {
      assertPodeGerenciarContratos(request.user.perfil)
      const contrato = await contratosService.criar({
        tenantId: request.user.tenantId,
        usuarioId: request.user.id,
        ...request.body,
      })
      return reply.status(201).send({ data: contrato })
    },
  )

  /**
   * GET /api/v1/comercial/contratos
   * Lista contratos do tenant com filtros e paginacao
   */
  app.get(
    '/contratos',
    {
      schema: {
        querystring: filtrosContratoSchema,
        response: {
          200: z.object({
            data: z.array(contratoResumoSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
        tags: ['comercial', 'contratos'],
        summary: 'Lista contratos do tenant com filtros',
      },
    },
    async (request, reply) => {
      assertPodeLerContratos(request.user.perfil)
      const result = await contratosService.listar({
        tenantId: request.user.tenantId,
        ...request.query,
      })
      return reply.status(200).send({
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / Math.max(result.limit, 1)),
        },
      })
    },
  )

  /**
   * GET /api/v1/comercial/contratos/kpis
   * KPIs agregados de contratos (ativos, MRR, total cadastrados)
   */
  app.get(
    '/contratos/kpis',
    {
      schema: {
        response: { 200: z.object({ data: contratoKpisSchema }) },
        tags: ['comercial', 'contratos'],
        summary: 'Agrega contratos ativos, MRR e total cadastrados',
      },
    },
    async (request, reply) => {
      assertPodeLerContratos(request.user.perfil)
      const kpis = await contratosService.kpis(request.user.tenantId)
      return reply.status(200).send({ data: kpis })
    },
  )

  /**
   * GET /api/v1/comercial/contratos/:id
   * Detalhe de um contrato
   */
  app.get(
    '/contratos/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: { 200: z.object({ data: contratoDetalheSchema }) },
        tags: ['comercial', 'contratos'],
        summary: 'Detalhe de um contrato do tenant',
      },
    },
    async (request, reply) => {
      assertPodeLerContratos(request.user.perfil)
      const contrato = await contratosService.buscarPorId({
        tenantId: request.user.tenantId,
        id: request.params.id,
      })
      return reply.status(200).send({ data: contrato })
    },
  )

  /**
   * PATCH /api/v1/comercial/contratos/:id
   * Atualiza status, vigencia ou observacoes
   */
  app.patch(
    '/contratos/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: atualizarContratoSchema,
        response: { 200: z.object({ data: contratoDetalheSchema }) },
        tags: ['comercial', 'contratos'],
        summary: 'Atualiza dados controlados de um contrato',
      },
    },
    async (request, reply) => {
      assertPodeGerenciarContratos(request.user.perfil)
      const contrato = await contratosService.atualizar({
        tenantId: request.user.tenantId,
        id: request.params.id,
        usuarioId: request.user.id,
        data: request.body,
      })
      return reply.status(200).send({ data: contrato })
    },
  )

  /**
   * GET /api/v1/comercial/financeiro/resumo
   * Agregacao financeira do tenant (MRR, ARR, OSs, entregaveis)
   */
  app.get(
    '/financeiro/resumo',
    {
      schema: {
        response: {
          200: z.object({
            data: z.object({
              mrr: z.number(),
              arr: z.number(),
              totalContratosAtivos: z.number().int(),
              totalOSsAbertas: z.number().int(),
              totalOSsConcluidasMes: z.number().int(),
              totalEntregaveisPendentes: z.number().int(),
              totalEntregaveisDisponiveis: z.number().int(),
              receitaEstimadaMes: z.number(),
              moeda: z.string(),
            }),
          }),
        },
        tags: ['comercial', 'financeiro'],
        summary: 'Resumo financeiro agregado do tenant',
      },
    },
    async (request, reply) => {
      assertPodeLerContratos(request.user.perfil)
      const resumo = await calcularFinanceiroResumo(request.user.tenantId)
      return reply.status(200).send({ data: resumo })
    },
  )
}
