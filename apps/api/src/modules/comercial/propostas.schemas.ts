import { z } from 'zod'
import { diagnosticoInputSchema } from './diagnostico.schemas.js'

export const statusPropostaComercialSchema = z.enum([
  'RASCUNHO',
  'PRONTA',
  'ENVIADA',
  'EM_NEGOCIACAO',
  'APROVADA',
  'REJEITADA',
  'EXPIRADA',
  'CANCELADA',
])

export const origemPropostaComercialSchema = z.enum(['TRIAGEM_CNAE', 'CRM', 'ONBOARDING', 'MANUAL'])
export const porteDiagnosticoComercialSchema = z.enum(['MICRO', 'PEQUENO', 'MEDIO', 'GRANDE', 'MUITO_GRANDE'])
export const situacaoDiagnosticoComercialSchema = z.enum(['PLANEJADO', 'IMPLANTACAO', 'OPERACAO', 'IRREGULAR', 'RENOVACAO'])
export const nivelRiscoComercialSchema = z.enum(['BAIXO', 'MEDIO', 'ALTO', 'CRITICO'])
export const potencialPoluidorComercialSchema = z.enum(['BAIXO', 'MEDIO', 'ALTO'])
export const decisaoItemPropostaSchema = z.enum(['OBRIGATORIO', 'CONDICIONAL', 'OPCIONAL', 'MANUAL'])
export const esferaRegulatoriaSchema = z.enum(['FEDERAL', 'ESTADUAL', 'MUNICIPAL'])

export const criarPropostaContatoSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  empresa: z.string().min(1).max(255).optional(),
  documento: z.string().min(1).max(32).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(8).max(30).optional(),
})

export const criarPropostaItemSchema = z.object({
  codigo: z.string().min(1),
  quantidade: z.number().int().positive().default(1),
  precoAplicadoUnitario: z.number().positive().optional(),
})

export const criarPropostaComercialSchema = z.object({
  leadWhatsAppId: z.string().uuid().optional(),
  empreendimentoId: z.string().uuid().optional(),
  contato: criarPropostaContatoSchema.optional(),
  diagnostico: diagnosticoInputSchema,
  itens: z.array(criarPropostaItemSchema).min(1).optional(),
  dataValidade: z.string().date().optional(),
  observacoesComerciais: z.string().max(5000).optional(),
})

export const filtrosPropostaComercialSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: statusPropostaComercialSchema.optional(),
  leadWhatsAppId: z.string().uuid().optional(),
  empreendimentoId: z.string().uuid().optional(),
  busca: z.string().min(1).optional(),
})

export const atualizarPropostaComercialSchema = z.object({
  status: statusPropostaComercialSchema.optional(),
  dataValidade: z.string().date().optional(),
  observacoesComerciais: z.string().max(5000).nullable().optional(),
}).refine(
  (payload) =>
    payload.status !== undefined
    || payload.dataValidade !== undefined
    || payload.observacoesComerciais !== undefined,
  {
    message: 'Informe ao menos um campo para atualização da proposta.',
  },
)

export const propostaComercialItemPublicoSchema = z.object({
  id: z.string().uuid(),
  ordem: z.number().int(),
  origem: origemPropostaComercialSchema,
  decisao: decisaoItemPropostaSchema,
  codigoServico: z.string(),
  nomeServico: z.string(),
  categoriaServico: z.string(),
  justificativa: z.string().nullable(),
  quantidade: z.number().int(),
  precoMinimoUnitario: z.number(),
  precoBaseUnitario: z.number(),
  precoMaximoUnitario: z.number(),
  precoAplicadoUnitario: z.number(),
  valorMinimoLinha: z.number(),
  valorBaseLinha: z.number(),
  valorMaximoLinha: z.number(),
  valorAplicadoLinha: z.number(),
  observacaoLinha: z.string().nullable(),
  editavel: z.boolean(),
  ativo: z.boolean(),
})

export const diagnosticoComercialResumoPublicoSchema = z.object({
  id: z.string().uuid(),
  origem: origemPropostaComercialSchema,
  cnaes: z.array(z.string()),
  uf: z.string().length(2),
  municipio: z.string().nullable().optional(),
  porte: porteDiagnosticoComercialSchema,
  situacao: situacaoDiagnosticoComercialSchema,
  temLicencaAnterior: z.boolean(),
  temOutorgaAnterior: z.boolean(),
  cnaePrincipal: z.object({
    codigo: z.string(),
    descricao: z.string(),
    potencialPoluidor: potencialPoluidorComercialSchema,
  }),
  riscoGeral: z.object({
    score: z.number().int(),
    nivel: nivelRiscoComercialSchema,
  }),
  enquadramento: z.object({
    licenciamentoTipo: z.string(),
    orgaoCompetente: z.string(),
    esfera: esferaRegulatoriaSchema,
  }),
  obrigatoriedades: z.object({
    necessitaEIA: z.boolean(),
    necessitaOutorga: z.boolean(),
    necessitaMonitoramento: z.boolean(),
    principaisImpactos: z.array(z.string()),
  }),
  estimativaOrcamento: z.object({
    minimo: z.number(),
    recomendado: z.number(),
    maximo: z.number(),
  }),
  alertas: z.array(z.string()),
  proximosPassos: z.array(z.string()),
  coberturaLimitada: z.boolean(),
  criadoEm: z.date(),
})

export const leadResumoPropostaSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().nullable(),
  empresa: z.string().nullable(),
  numero: z.string(),
})

export const empreendimentoResumoPropostaSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  nomeFantasia: z.string().nullable(),
  cidade: z.string(),
  estado: z.string(),
})

export const propostaComercialResumoPublicoSchema = z.object({
  id: z.string().uuid(),
  numero: z.string(),
  status: statusPropostaComercialSchema,
  origem: origemPropostaComercialSchema,
  nomeLead: z.string().nullable(),
  empresaLead: z.string().nullable(),
  municipio: z.string().nullable(),
  uf: z.string().length(2),
  dataValidade: z.date(),
  totalMinimo: z.number(),
  totalBase: z.number(),
  totalMaximo: z.number(),
  itensQuantidade: z.number().int(),
  riscoNivel: nivelRiscoComercialSchema,
  cnaePrincipalCodigo: z.string(),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
  lead: leadResumoPropostaSchema.nullable(),
  empreendimento: empreendimentoResumoPropostaSchema.nullable(),
})

export const propostaComercialDetalhePublicoSchema = propostaComercialResumoPublicoSchema.extend({
  emailContato: z.string().nullable(),
  telefoneContato: z.string().nullable(),
  observacoesComerciais: z.string().nullable(),
  diagnostico: diagnosticoComercialResumoPublicoSchema,
  itens: z.array(propostaComercialItemPublicoSchema),
  criadoPor: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().email(),
  }),
  atualizadoPor: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().email(),
  }).nullable(),
})

export type CriarPropostaComercialSchema = z.infer<typeof criarPropostaComercialSchema>
export type FiltrosPropostaComercialSchema = z.infer<typeof filtrosPropostaComercialSchema>
export type AtualizarPropostaComercialSchema = z.infer<typeof atualizarPropostaComercialSchema>
