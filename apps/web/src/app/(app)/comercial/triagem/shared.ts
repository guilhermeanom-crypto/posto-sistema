export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export const PORTE_OPTIONS = [
  { value: 'MICRO', label: 'Micro' },
  { value: 'PEQUENO', label: 'Pequeno' },
  { value: 'MEDIO', label: 'Médio' },
  { value: 'GRANDE', label: 'Grande' },
  { value: 'MUITO_GRANDE', label: 'Muito grande' },
] as const

export const SITUACAO_OPTIONS = [
  { value: 'PLANEJADO', label: 'Planejado' },
  { value: 'IMPLANTACAO', label: 'Implantação' },
  { value: 'OPERACAO', label: 'Operação' },
  { value: 'IRREGULAR', label: 'Irregular' },
  { value: 'RENOVACAO', label: 'Renovação' },
] as const

export const DECISAO_LABEL: Record<string, string> = {
  OBRIGATORIO: 'Obrigatório',
  CONDICIONAL: 'Condicional',
  OPCIONAL: 'Opcional',
}

export const CONTEXTO_EXTRA_LABELS = {
  licencaVencida: 'Licença vencida',
  possuiPgrs: 'Possui PGRS',
  possuiAutoInfracao: 'Possui auto de infração',
} as const

export interface DiagnosticoResultado {
  cnaePrincipal: {
    codigo: string
    descricao: string
    riscoNivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
    potencialPoluidor: 'BAIXO' | 'MEDIO' | 'ALTO'
  }
  enquadramento: {
    licenciamentoTipo: string
    orgaoCompetente: string
    esfera: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL'
  }
  riscoGeral: {
    score: number
    nivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
    justificativa: string
  }
  obrigatoriedades: {
    necessitaEIA: boolean
    necessitaOutorga: boolean
    necessitaMonitoramento: boolean
    principaisImpactos: string[]
  }
  recomendacoes: Array<{
    servicoId: string
    codigo: string
    nome: string
    categoria: string
    decisao: 'OBRIGATORIO' | 'CONDICIONAL' | 'OPCIONAL'
    justificativa: string
    precoEstimado: number
    precoMinimo: number
    precoMaximo: number
  }>
  estimativaOrcamento: {
    minimo: number
    maximo: number
    recomendado: number
  }
  alertas: string[]
  proximosPassos: string[]
}

export interface TriagemPayload {
  cnaes: string[]
  uf: string
  municipio?: string
  porte: 'MICRO' | 'PEQUENO' | 'MEDIO' | 'GRANDE' | 'MUITO_GRANDE'
  situacao: 'PLANEJADO' | 'IMPLANTACAO' | 'OPERACAO' | 'IRREGULAR' | 'RENOVACAO'
  temLicencaAnterior?: boolean
  temOutorgaAnterior?: boolean
}

export interface TriagemContextoExtra {
  licencaVencida: boolean
  possuiPgrs: boolean
  possuiAutoInfracao: boolean
}

export interface PropostaCriada {
  id: string
  numero: string
  status: string
  totalBase: number
  totalMinimo: number
  totalMaximo: number
}

export interface TriagemActionState {
  error?: string
  propostaError?: string
  limitedCoverage?: boolean
  payload?: TriagemPayload
  contextoExtra?: TriagemContextoExtra
  resultado?: DiagnosticoResultado
  proposta?: PropostaCriada
}
