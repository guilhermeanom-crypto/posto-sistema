export const STATUS_ORDEM_SERVICO = [
  'PLANEJADA',
  'EM_EXECUCAO',
  'AGUARDANDO_REVISAO',
  'CONCLUIDA',
  'CANCELADA',
] as const
export type StatusOrdemServico = (typeof STATUS_ORDEM_SERVICO)[number]

export const STATUS_OS_ABERTOS = ['PLANEJADA', 'EM_EXECUCAO', 'AGUARDANDO_REVISAO'] as const

export const PRIORIDADE_ORDEM_SERVICO = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] as const
export type PrioridadeOrdemServico = (typeof PRIORIDADE_ORDEM_SERVICO)[number]

export const TIPO_ORDEM_SERVICO = [
  'VISTORIA_TECNICA',
  'COLETA_AMOSTRA',
  'RENOVACAO_LICENCA',
  'DILIGENCIA',
  'PROTOCOLO',
  'RELATORIO',
  'OUTRO',
] as const
export type TipoOrdemServico = (typeof TIPO_ORDEM_SERVICO)[number]

export interface CriarOrdemServicoInput {
  tenantId: string
  usuarioId: string
  contratoId: string
  tipo: TipoOrdemServico
  titulo: string
  escopo: string
  dataPlanejada: string
  dataPrevistaConclusao?: string | null
  prioridade?: PrioridadeOrdemServico
  responsavelId?: string | null
  localExecucao?: string | null
  observacoesInternas?: string | null
}

export interface ListarOrdensServicoInput {
  tenantId: string
  usuarioId: string
  page: number
  limit: number
  status?: StatusOrdemServico
  prioridade?: PrioridadeOrdemServico
  tipo?: TipoOrdemServico
  contratoId?: string
  empreendimentoId?: string
  responsavelId?: string
  apenasMinhas?: boolean
  apenasAbertas?: boolean
}

export interface BuscarOrdemServicoPorIdInput {
  tenantId: string
  id: string
}

export interface AtualizarOrdemServicoData {
  status?: StatusOrdemServico
  prioridade?: PrioridadeOrdemServico
  tipo?: TipoOrdemServico
  responsavelId?: string | null
  titulo?: string
  escopo?: string
  localExecucao?: string | null
  observacoesExecucao?: string | null
  observacoesInternas?: string | null
  motivoCancelamento?: string | null
  dataPlanejada?: string
  dataPrevistaConclusao?: string | null
}

export interface AtualizarOrdemServicoInput {
  tenantId: string
  id: string
  usuarioId: string
  data: AtualizarOrdemServicoData
}

export interface OrdemServicoResumo {
  id: string
  numero: string
  status: StatusOrdemServico
  tipo: TipoOrdemServico
  prioridade: PrioridadeOrdemServico
  contratoId: string
  contratoNumero: string | null
  empreendimentoId: string
  empreendimentoNome: string | null
  empreendimentoCidade: string | null
  empreendimentoEstado: string | null
  responsavelId: string | null
  responsavelNome: string | null
  titulo: string
  dataPlanejada: Date
  dataPrevistaConclusao: Date | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface OrdemServicoDetalhe extends OrdemServicoResumo {
  escopo: string
  localExecucao: string | null
  observacoesExecucao: string | null
  observacoesInternas: string | null
  motivoCancelamento: string | null
  dataInicioExecucao: Date | null
  dataConclusao: Date | null
  dataCancelamento: Date | null
  criadoPorId: string
  atualizadoPorId: string | null
}

export interface ListarOrdensServicoResult {
  items: OrdemServicoResumo[]
  page: number
  limit: number
  total: number
}

export interface OrdemServicoKpis {
  totalAbertas: number
  totalEmExecucao: number
  totalCriticas: number
  totalConcluidasMes: number
}
