export const STATUS_CONTRATO = ['RASCUNHO', 'ATIVO', 'SUSPENSO', 'ENCERRADO', 'CANCELADO'] as const
export type StatusContrato = (typeof STATUS_CONTRATO)[number]

export const STATUS_CONTRATO_VIGENTES = ['ATIVO', 'SUSPENSO'] as const
export type StatusContratoVigente = (typeof STATUS_CONTRATO_VIGENTES)[number]

export interface ContratoItemSnapshot {
  itemPropostaId: string
  codigoServico: string
  nomeServico: string
  categoriaServico: string
  quantidade: number
  precoAplicadoUnitario: number
  valorAplicadoLinha: number
}

export interface CriarContratoInput {
  tenantId: string
  usuarioId: string
  handoffComercialId: string
  objeto: string
  dataInicioVigencia: string
  dataFimVigencia?: string | null
  diaVencimento: number
  observacoesContratuais?: string | null
  observacoesInternas?: string | null
}

export interface ListarContratosInput {
  tenantId: string
  page: number
  limit: number
  status?: StatusContrato
  empreendimentoId?: string
  handoffComercialId?: string
  busca?: string
}

export interface BuscarContratoPorIdInput {
  tenantId: string
  id: string
}

export interface AtualizarContratoData {
  status?: StatusContrato
  dataFimVigencia?: string | null
  observacoesContratuais?: string | null
  observacoesInternas?: string | null
  motivoEncerramento?: string | null
}

export interface AtualizarContratoInput {
  tenantId: string
  id: string
  usuarioId: string
  data: AtualizarContratoData
}

export interface ContratoResumo {
  id: string
  numero: string
  status: StatusContrato
  handoffComercialId: string
  propostaComercialId: string
  empreendimentoId: string | null
  empreendimentoNome: string | null
  empreendimentoCidade: string | null
  empreendimentoEstado: string | null
  nomeLead: string | null
  empresaLead: string | null
  objeto: string
  dataInicioVigencia: Date
  dataFimVigencia: Date | null
  diaVencimento: number
  valorMensal: number
  valorTotalEstimado: number | null
  moeda: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface ContratoDetalhe extends ContratoResumo {
  observacoesContratuais: string | null
  observacoesInternas: string | null
  motivoEncerramento: string | null
  itensSnapshot: ContratoItemSnapshot[]
  ativadoEm: Date | null
  suspensoEm: Date | null
  encerradoEm: Date | null
  canceladoEm: Date | null
  criadoPorId: string
  atualizadoPorId: string | null
}

export interface ListarContratosResult {
  items: ContratoResumo[]
  page: number
  limit: number
  total: number
}

export interface ContratoKpis {
  totalAtivos: number
  totalCadastrados: number
  mrr: number
  moeda: string
}
