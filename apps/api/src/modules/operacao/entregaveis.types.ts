export const STATUS_ENTREGAVEL = [
  'PENDENTE',
  'GERANDO',
  'DISPONIVEL',
  'ERRO',
  'CANCELADO',
] as const
export type StatusEntregavel = (typeof STATUS_ENTREGAVEL)[number]

export const TIPO_ENTREGAVEL = [
  'LAUDO',
  'RELATORIO',
  'PROTOCOLO',
  'CERTIFICADO',
  'ATA',
  'EVIDENCIA',
  'OUTRO',
] as const
export type TipoEntregavel = (typeof TIPO_ENTREGAVEL)[number]

export interface CriarEntregavelInput {
  tenantId: string
  usuarioId: string
  ordemServicoId: string
  tipo: TipoEntregavel
  titulo: string
  descricao?: string | null
}

export interface ListarEntregaveisInput {
  tenantId: string
  page: number
  limit: number
  status?: StatusEntregavel
  tipo?: TipoEntregavel
  ordemServicoId?: string
  contratoId?: string
  empreendimentoId?: string
  busca?: string
}

export interface BuscarEntregavelPorIdInput {
  tenantId: string
  id: string
}

export interface CancelarEntregavelInput {
  tenantId: string
  id: string
  usuarioId: string
}

export interface EntregavelResumo {
  id: string
  numero: string
  status: StatusEntregavel
  tipo: TipoEntregavel
  ordemServicoId: string
  osNumero: string | null
  contratoId: string | null
  empreendimentoId: string
  empreendimentoNome: string | null
  titulo: string
  s3Key: string | null
  nomeArquivo: string | null
  tamanhoBytes: number | null
  geradoEm: Date | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface EntregavelDetalhe extends EntregavelResumo {
  descricao: string | null
  erroMsg: string | null
  canceladoEm: Date | null
  criadoPorId: string
  atualizadoPorId: string | null
}

export interface EntregavelKpis {
  totalPendentes: number
  totalDisponiveis: number
  totalCadastrados: number
}

export interface ListarEntregaveisResult {
  items: EntregavelResumo[]
  page: number
  limit: number
  total: number
}
