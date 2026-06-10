export type StatusHandoffComercial =
  | 'AGUARDANDO_HANDOFF'
  | 'EM_TRIAGEM_OPERACIONAL'
  | 'AGUARDANDO_DOCUMENTOS'
  | 'EM_PLANEJAMENTO'
  | 'EM_EXECUCAO'
  | 'PAUSADO'
  | 'CANCELADO'
  | 'CONCLUIDO'

export type PrioridadeOperacionalHandoff = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'

export interface HandoffComercialResumo {
  id: string
  propostaComercialId: string
  leadWhatsAppId: string | null
  empreendimentoId: string | null
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
  criadoEm: string
  atualizadoEm: string
}

export interface ServicoResumoHandoff {
  itemId?: string
  nome: string
  categoria?: string
  quantidade?: number
  unidade?: string
  escopoAprovado?: string
  observacaoOperacional?: string
}

export interface HandoffComercialDetalhe extends HandoffComercialResumo {
  documentoLead: string | null
  emailContato: string | null
  telefoneContato: string | null
  dataAprovacaoProposta: string | null
  dataValidadeProposta: string | null
  riscoScore: number | null
  licenciamentoTipo: string | null
  orgaoCompetente: string | null
  esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | null
  alertasResumo: string[]
  proximosPassosResumo: string[]
  observacoesLiberadas: string | null
  servicosResumo: ServicoResumoHandoff[]
  pendenciasOperacionais: string[]
  observacoesOperacionais: string | null
  observacoesPlanejamento: string | null
  prioridadeOperacional: PrioridadeOperacionalHandoff | null
  necessidadeDocumentos: boolean | null
  necessidadeVisita: boolean | null
  necessidadeTerceiro: boolean | null
  assumidoEm: string | null
  concluidoEm: string | null
  canceladoEm: string | null
}

export interface ListarHandoffsOperacionaisParams {
  page?: number
  limit?: number
  status?: StatusHandoffComercial | ''
  propostaComercialId?: string
  empreendimentoId?: string
  responsavelComercialId?: string
  responsavelOperacionalId?: string
  prioridadeOperacional?: PrioridadeOperacionalHandoff | ''
  comNecessidadeDocumentos?: boolean
  comNecessidadeVisita?: boolean
  comNecessidadeTerceiro?: boolean
  apenasAtivos?: boolean
}

export interface AtualizarHandoffOperacionalPayload {
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

export interface UsuarioResponsavelOperacionalOption {
  id: string
  nome: string
  email: string
  perfil: string
  ativo: boolean
}

type OrigemProposta = HandoffComercialResumo['origemProposta']
type StatusPropostaOrigem = HandoffComercialResumo['statusPropostaOrigem']
type RiscoNivel = NonNullable<HandoffComercialResumo['riscoNivel']>
type PotencialPoluidor = NonNullable<HandoffComercialResumo['potencialPoluidor']>
type EsferaLicenciamento = NonNullable<HandoffComercialDetalhe['esfera']>

export const PRIORIDADE_OPERACIONAL_LABELS: Record<PrioridadeOperacionalHandoff, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
}

export const STATUS_HANDOFF_LABELS: Record<StatusHandoffComercial, string> = {
  AGUARDANDO_HANDOFF: 'Aguardando handoff',
  EM_TRIAGEM_OPERACIONAL: 'Em triagem operacional',
  AGUARDANDO_DOCUMENTOS: 'Aguardando documentos',
  EM_PLANEJAMENTO: 'Em planejamento',
  EM_EXECUCAO: 'Em execução',
  PAUSADO: 'Pausado',
  CANCELADO: 'Cancelado',
  CONCLUIDO: 'Concluído',
}

export const ORIGEM_PROPOSTA_LABELS: Record<OrigemProposta, string> = {
  TRIAGEM_CNAE: 'Triagem de CNAE',
  CRM: 'CRM comercial',
  ONBOARDING: 'Onboarding comercial',
  MANUAL: 'Cadastro manual',
}

export const STATUS_PROPOSTA_ORIGEM_LABELS: Record<StatusPropostaOrigem, string> = {
  APROVADA: 'Aprovada',
}

export const RISCO_NIVEL_LABELS: Record<RiscoNivel, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
}

export const POTENCIAL_POLUIDOR_LABELS: Record<PotencialPoluidor, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
}

export const ESFERA_LABELS: Record<EsferaLicenciamento, string> = {
  FEDERAL: 'Federal',
  ESTADUAL: 'Estadual',
  MUNICIPAL: 'Municipal',
}

export const PERFIL_LABELS: Record<string, string> = {
  EXECUTIVO: 'Executivo',
  COORDENADOR: 'Coordenador',
  ANALISTA: 'Analista',
  ANALISTA_CAMPO: 'Analista de campo',
  ADMIN_TENANT: 'Administrador do tenant',
  SUPER_ADMIN: 'Super administrador',
  REPRESENTANTE_POSTO: 'Representante do posto',
  ATRIBUÍDO: 'Atribuição preservada',
}

function titleCaseLabel(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ')
}

export function humanizeTechnicalLabel(value: string) {
  return titleCaseLabel(value.replaceAll('_', ' '))
}

export function formatPerfilLabel(value: string | null | undefined) {
  if (!value) return '—'
  return PERFIL_LABELS[value] ?? humanizeTechnicalLabel(value)
}
