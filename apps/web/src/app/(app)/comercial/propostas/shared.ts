export type StatusPropostaComercial =
  | 'RASCUNHO'
  | 'PRONTA'
  | 'ENVIADA'
  | 'EM_NEGOCIACAO'
  | 'APROVADA'
  | 'REJEITADA'
  | 'EXPIRADA'
  | 'CANCELADA'

export interface AtualizarPropostaComercialPayload {
  status?: StatusPropostaComercial
  dataValidade?: string
  observacoesComerciais?: string | null
}

export type OrigemPropostaComercial = 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL'

export interface ItemPropostaView {
  id: string
  ordem: number
  origem: OrigemPropostaComercial
  decisao: 'OBRIGATORIO' | 'CONDICIONAL' | 'OPCIONAL' | 'MANUAL'
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

export interface DiagnosticoComercialResumoView {
  id: string
  origem: OrigemPropostaComercial
  cnaes: string[]
  uf: string
  municipio: string | null
  porte: string
  situacao: string
  temLicencaAnterior: boolean
  temOutorgaAnterior: boolean
  cnaePrincipal: {
    codigo: string
    descricao: string
    potencialPoluidor: string
  }
  riscoGeral: {
    score: number
    nivel: string
  }
  enquadramento: {
    licenciamentoTipo: string
    orgaoCompetente: string
    esfera: string
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
  criadoEm: string
}

export interface PropostaComercialResumo {
  id: string
  numero: string
  status: StatusPropostaComercial
  origem: OrigemPropostaComercial
  nomeLead: string | null
  empresaLead: string | null
  municipio: string | null
  uf: string
  dataValidade: string
  totalMinimo: number
  totalBase: number
  totalMaximo: number
  itensQuantidade: number
  riscoNivel: string
  cnaePrincipalCodigo: string
  criadoEm: string
  atualizadoEm: string
  lead?: {
    id: string
    nome: string | null
    empresa: string | null
    numero: string
  } | null
  empreendimento?: {
    id: string
    nome: string
    nomeFantasia: string | null
    cidade: string
    estado: string
  } | null
}

export interface PropostaComercialDetalhe extends PropostaComercialResumo {
  emailContato: string | null
  telefoneContato: string | null
  observacoesComerciais: string | null
  diagnostico: DiagnosticoComercialResumoView
  itens: ItemPropostaView[]
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
