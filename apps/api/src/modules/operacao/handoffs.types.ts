export const STATUS_HANDOFF_COMERCIAL = [
  'AGUARDANDO_HANDOFF',
  'EM_TRIAGEM_OPERACIONAL',
  'AGUARDANDO_DOCUMENTOS',
  'EM_PLANEJAMENTO',
  'EM_EXECUCAO',
  'PAUSADO',
  'CANCELADO',
  'CONCLUIDO',
] as const

export const STATUS_HANDOFF_ATIVOS = [
  'AGUARDANDO_HANDOFF',
  'EM_TRIAGEM_OPERACIONAL',
  'AGUARDANDO_DOCUMENTOS',
  'EM_PLANEJAMENTO',
  'EM_EXECUCAO',
  'PAUSADO',
] as const

export type StatusHandoffComercial = (typeof STATUS_HANDOFF_COMERCIAL)[number]
export type StatusHandoffAtivo = (typeof STATUS_HANDOFF_ATIVOS)[number]
export const PRIORIDADE_OPERACIONAL_HANDOFF = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] as const
export type PrioridadeOperacionalHandoff = (typeof PRIORIDADE_OPERACIONAL_HANDOFF)[number]

export interface CriarHandoffComercialInput {
  tenantId: string
  propostaComercialId: string
  usuarioId: string
}

export interface ListarHandoffsComerciaisInput {
  tenantId: string
  page: number
  limit: number
  status?: StatusHandoffComercial
  propostaComercialId?: string
  empreendimentoId?: string
  responsavelComercialId?: string
  responsavelOperacionalId?: string
  prioridadeOperacional?: PrioridadeOperacionalHandoff
  comNecessidadeDocumentos?: boolean
  comNecessidadeVisita?: boolean
  comNecessidadeTerceiro?: boolean
  apenasAtivos?: boolean
}

export interface BuscarHandoffComercialPorIdInput {
  tenantId: string
  id: string
}

export interface AtualizarHandoffComercialData {
  status?: StatusHandoffComercial
  responsavelOperacionalId?: string
  pendenciasOperacionais?: string[]
  observacoesOperacionais?: string | null
  observacoesPlanejamento?: string | null
  prioridadeOperacional?: PrioridadeOperacionalHandoff | null
  necessidadeDocumentos?: boolean | null
  necessidadeVisita?: boolean | null
  necessidadeTerceiro?: boolean | null
}

export interface AtualizarHandoffComercialInput {
  tenantId: string
  id: string
  usuarioId: string
  data: AtualizarHandoffComercialData
}

export type ServicosResumoHandoff = Array<{
  itemId?: string
  nome: string
  categoria?: string
  quantidade?: number
  unidade?: string
  escopoAprovado?: string
  observacaoOperacional?: string
}>

export type OrigemSnapshotSaneadoHandoff = {
  schemaVersion: 1
  proposta: {
    id: string
    numero: string
    origem: 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL'
    statusOrigem: 'APROVADA'
    dataAprovacao?: string | null
    dataValidade?: string | null
  }
  contato: {
    nomeLead?: string | null
    empresaLead?: string | null
    documentoLead?: string | null
    emailContato?: string | null
    telefoneContato?: string | null
    municipio?: string | null
    uf?: string | null
  }
  referencias: {
    tenantId: string
    leadWhatsAppId?: string | null
    empreendimentoId?: string | null
    propostaComercialId: string
  }
  diagnostico: {
    cnaePrincipalCodigo?: string | null
    cnaePrincipalDescricao?: string | null
    riscoNivel?: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' | null
    riscoScore?: number | null
    potencialPoluidor?: 'BAIXO' | 'MEDIO' | 'ALTO' | null
    licenciamentoTipo?: string | null
    orgaoCompetente?: string | null
    esfera?: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | null
    alertasResumo?: string[]
    proximosPassosResumo?: string[]
  }
  comercial: {
    observacoesLiberadas?: string | null
  }
}

export interface HandoffComercialDetalhe {
  id: string
  tenantId: string
  propostaComercialId: string
  leadWhatsAppId: string | null
  empreendimentoId: string | null
  criadoPorId: string
  responsavelComercialId: string
  responsavelOperacionalId: string | null
  status: StatusHandoffComercial
  statusPropostaOrigem: 'APROVADA'
  origemProposta: 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL'
  numeroProposta: string
  dataAprovacaoProposta: Date | null
  dataValidadeProposta: Date | null
  nomeLead: string | null
  empresaLead: string | null
  documentoLead: string | null
  emailContato: string | null
  telefoneContato: string | null
  municipio: string | null
  uf: string | null
  cnaePrincipalCodigo: string | null
  cnaePrincipalDescricao: string | null
  riscoNivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' | null
  riscoScore: number | null
  potencialPoluidor: 'BAIXO' | 'MEDIO' | 'ALTO' | null
  licenciamentoTipo: string | null
  orgaoCompetente: string | null
  esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | null
  alertasResumo: string[]
  proximosPassosResumo: string[]
  observacoesLiberadas: string | null
  servicosResumo: ServicosResumoHandoff
  origemSnapshotSaneado: OrigemSnapshotSaneadoHandoff
  pendenciasOperacionais: string[]
  observacoesOperacionais: string | null
  observacoesPlanejamento: string | null
  prioridadeOperacional: PrioridadeOperacionalHandoff | null
  necessidadeDocumentos: boolean | null
  necessidadeVisita: boolean | null
  necessidadeTerceiro: boolean | null
  assumidoEm: Date | null
  concluidoEm: Date | null
  canceladoEm: Date | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface HandoffComercialResumo {
  id: string
  propostaComercialId: string
  leadWhatsAppId: string | null
  empreendimentoId: string | null
  criadoPorId: string
  responsavelComercialId: string
  responsavelOperacionalId: string | null
  status: StatusHandoffComercial
  statusPropostaOrigem: 'APROVADA'
  origemProposta: 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL'
  numeroProposta: string
  nomeLead: string | null
  empresaLead: string | null
  municipio: string | null
  uf: string | null
  cnaePrincipalCodigo: string | null
  cnaePrincipalDescricao: string | null
  riscoNivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' | null
  potencialPoluidor: 'BAIXO' | 'MEDIO' | 'ALTO' | null
  prioridadeOperacional: PrioridadeOperacionalHandoff | null
  necessidadeDocumentos: boolean | null
  necessidadeVisita: boolean | null
  necessidadeTerceiro: boolean | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface ListarHandoffsComerciaisResult {
  items: HandoffComercialResumo[]
  page: number
  limit: number
  total: number
}

export type HandoffComercialCriado = HandoffComercialDetalhe
