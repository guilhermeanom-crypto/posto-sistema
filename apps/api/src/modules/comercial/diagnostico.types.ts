export interface DiagnosticoInput {
  cnaes: string[] // Lista de códigos CNAE (ex: "4731-8/00")
  uf: string
  municipio?: string
  porte: 'MICRO' | 'PEQUENO' | 'MEDIO' | 'GRANDE' | 'MUITO_GRANDE'
  situacao: 'PLANEJADO' | 'IMPLANTACAO' | 'OPERACAO' | 'IRREGULAR' | 'RENOVACAO'
  temLicencaAnterior?: boolean
  temOutorgaAnterior?: boolean
}

export interface RecomendacaoServico {
  servicoId: string
  codigo: string
  nome: string
  categoria: string
  decisao: 'OBRIGATORIO' | 'CONDICIONAL' | 'OPCIONAL'
  justificativa: string
  precoEstimado: number
  precoMinimo: number
  precoMaximo: number
}

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
  recomendacoes: RecomendacaoServico[]
  estimativaOrcamento: {
    minimo: number
    maximo: number
    recomendado: number
  }
  alertas: string[]
  proximosPassos: string[]
}
