import type { DiagnosticoInput } from './diagnostico.types.js'

export type StatusPropostaComercial =
  | 'RASCUNHO'
  | 'PRONTA'
  | 'ENVIADA'
  | 'EM_NEGOCIACAO'
  | 'APROVADA'
  | 'REJEITADA'
  | 'EXPIRADA'
  | 'CANCELADA'

export type OrigemPropostaComercial = 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL'
export type PorteDiagnosticoComercial = 'MICRO' | 'PEQUENO' | 'MEDIO' | 'GRANDE' | 'MUITO_GRANDE'
export type SituacaoDiagnosticoComercial = 'PLANEJADO' | 'IMPLANTACAO' | 'OPERACAO' | 'IRREGULAR' | 'RENOVACAO'
export type NivelRiscoComercial = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
export type PotencialPoluidorComercial = 'BAIXO' | 'MEDIO' | 'ALTO'
export type DecisaoItemProposta = 'OBRIGATORIO' | 'CONDICIONAL' | 'OPCIONAL' | 'MANUAL'
export type EsferaRegulatoria = 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL'

export interface CriarPropostaContatoInput {
  nome?: string
  empresa?: string
  documento?: string
  email?: string
  telefone?: string
}

export interface CriarPropostaItemInput {
  codigo: string
  quantidade?: number
  precoAplicadoUnitario?: number
}

export interface CriarPropostaComercialInput {
  leadWhatsAppId?: string
  empreendimentoId?: string
  contato?: CriarPropostaContatoInput
  diagnostico: DiagnosticoInput
  itens?: CriarPropostaItemInput[]
  dataValidade?: string
  observacoesComerciais?: string
}

export interface FiltrosPropostaComercial {
  page: number
  limit: number
  status?: StatusPropostaComercial
  leadWhatsAppId?: string
  empreendimentoId?: string
  busca?: string
}

export interface AtualizarPropostaComercialInput {
  status?: StatusPropostaComercial
  dataValidade?: string
  observacoesComerciais?: string | null
}

export interface PropostaComercialItemPublico {
  id: string
  ordem: number
  origem: OrigemPropostaComercial
  decisao: DecisaoItemProposta
  codigoServico: string
  nomeServico: string
  categoriaServico: string
  justificativa: string | null
  quantidade: number
  precoMinimoUnitario: number
  precoBaseUnitario: number
  precoMaximoUnitario: number
  precoAplicadoUnitario: number
  valorMinimoLinha: number
  valorBaseLinha: number
  valorMaximoLinha: number
  valorAplicadoLinha: number
  observacaoLinha: string | null
  editavel: boolean
  ativo: boolean
}

export interface DiagnosticoComercialResumoPublico {
  id: string
  origem: OrigemPropostaComercial
  cnaes: string[]
  uf: string
  municipio?: string | null
  porte: PorteDiagnosticoComercial
  situacao: SituacaoDiagnosticoComercial
  temLicencaAnterior: boolean
  temOutorgaAnterior: boolean
  cnaePrincipal: {
    codigo: string
    descricao: string
    potencialPoluidor: PotencialPoluidorComercial
  }
  riscoGeral: {
    score: number
    nivel: NivelRiscoComercial
  }
  enquadramento: {
    licenciamentoTipo: string
    orgaoCompetente: string
    esfera: EsferaRegulatoria
  }
  obrigatoriedades: {
    necessitaEIA: boolean
    necessitaOutorga: boolean
    necessitaMonitoramento: boolean
    principaisImpactos: string[]
  }
  estimativaOrcamento: {
    minimo: number
    recomendado: number
    maximo: number
  }
  alertas: string[]
  proximosPassos: string[]
  coberturaLimitada: boolean
  criadoEm: Date
}

export interface PropostaComercialResumoPublico {
  id: string
  numero: string
  status: StatusPropostaComercial
  origem: OrigemPropostaComercial
  nomeLead: string | null
  empresaLead: string | null
  municipio: string | null
  uf: string
  dataValidade: Date
  totalMinimo: number
  totalBase: number
  totalMaximo: number
  itensQuantidade: number
  riscoNivel: NivelRiscoComercial
  cnaePrincipalCodigo: string
  criadoEm: Date
  atualizadoEm: Date
  lead: {
    id: string
    nome: string | null
    empresa: string | null
    numero: string
  } | null
  empreendimento: {
    id: string
    nome: string
    nomeFantasia: string | null
    cidade: string
    estado: string
  } | null
}

export interface PropostaComercialDetalhePublico extends PropostaComercialResumoPublico {
  emailContato: string | null
  telefoneContato: string | null
  observacoesComerciais: string | null
  diagnostico: DiagnosticoComercialResumoPublico
  itens: PropostaComercialItemPublico[]
  criadoPor: {
    id: string
    nome: string
    email: string
  }
  atualizadoPor: {
    id: string
    nome: string
    email: string
  } | null
}
