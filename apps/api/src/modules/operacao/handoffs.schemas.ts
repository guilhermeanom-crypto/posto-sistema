import { z } from 'zod'
import { PRIORIDADE_OPERACIONAL_HANDOFF, STATUS_HANDOFF_COMERCIAL } from './handoffs.types.js'

export const servicoResumoHandoffSchema = z.object({
  itemId: z.string().uuid().optional(),
  nome: z.string(),
  categoria: z.string().optional(),
  quantidade: z.number().optional(),
  unidade: z.string().optional(),
  escopoAprovado: z.string().optional(),
  observacaoOperacional: z.string().optional(),
})

export const origemSnapshotSaneadoHandoffSchema = z.object({
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

export const handoffComercialResumoSchema = z.object({
  id: z.string().uuid(),
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
  nomeLead: z.string().nullable(),
  empresaLead: z.string().nullable(),
  municipio: z.string().nullable(),
  uf: z.string().nullable(),
  cnaePrincipalCodigo: z.string().nullable(),
  cnaePrincipalDescricao: z.string().nullable(),
  riscoNivel: z.enum(['BAIXO', 'MEDIO', 'ALTO', 'CRITICO']).nullable(),
  potencialPoluidor: z.enum(['BAIXO', 'MEDIO', 'ALTO']).nullable(),
  prioridadeOperacional: z.enum(PRIORIDADE_OPERACIONAL_HANDOFF).nullable(),
  necessidadeDocumentos: z.boolean().nullable(),
  necessidadeVisita: z.boolean().nullable(),
  necessidadeTerceiro: z.boolean().nullable(),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
})

export const handoffComercialDetalheSchema = z.object({
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
  observacoesPlanejamento: z.string().nullable(),
  prioridadeOperacional: z.enum(PRIORIDADE_OPERACIONAL_HANDOFF).nullable(),
  necessidadeDocumentos: z.boolean().nullable(),
  necessidadeVisita: z.boolean().nullable(),
  necessidadeTerceiro: z.boolean().nullable(),
  assumidoEm: z.date().nullable(),
  concluidoEm: z.date().nullable(),
  canceladoEm: z.date().nullable(),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
})

const booleanQueryParam = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => (typeof value === 'boolean' ? value : value === 'true'))

export const filtrosHandoffComercialSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(STATUS_HANDOFF_COMERCIAL).optional(),
  propostaComercialId: z.string().uuid().optional(),
  empreendimentoId: z.string().uuid().optional(),
  responsavelComercialId: z.string().uuid().optional(),
  responsavelOperacionalId: z.string().uuid().optional(),
  prioridadeOperacional: z.enum(PRIORIDADE_OPERACIONAL_HANDOFF).optional(),
  comNecessidadeDocumentos: booleanQueryParam.optional(),
  comNecessidadeVisita: booleanQueryParam.optional(),
  comNecessidadeTerceiro: booleanQueryParam.optional(),
  apenasAtivos: booleanQueryParam.optional(),
})

export const atualizarHandoffComercialSchema = z
  .object({
    status: z.enum(STATUS_HANDOFF_COMERCIAL).optional(),
    responsavelOperacionalId: z.string().uuid().optional(),
    pendenciasOperacionais: z.array(z.string().trim().min(1)).optional(),
    observacoesOperacionais: z.string().trim().nullable().optional(),
    observacoesPlanejamento: z.string().trim().nullable().optional(),
    prioridadeOperacional: z.enum(PRIORIDADE_OPERACIONAL_HANDOFF).nullable().optional(),
    necessidadeDocumentos: z.boolean().nullable().optional(),
    necessidadeVisita: z.boolean().nullable().optional(),
    necessidadeTerceiro: z.boolean().nullable().optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Informe ao menos um campo permitido para atualização do handoff.',
  })
