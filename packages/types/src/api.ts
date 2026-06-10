// ─────────────────────────────────────────────────────────────────────────────
// CONTRATOS DE RESPOSTA DA API (wire format)
//
// Estes tipos representam EXATAMENTE o JSON que a API devolve ao cliente.
// Datas trafegam como string ISO (o backend usa Date internamente e serializa
// para string na resposta). O frontend deve importar destes tipos em vez de
// redefinir interfaces locais — fonte unica do contrato de API.
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ── Comercial / Contrato ─────────────────────────────────────────────────────

export type StatusContrato = 'RASCUNHO' | 'ATIVO' | 'SUSPENSO' | 'ENCERRADO' | 'CANCELADO'

export interface ContratoItemSnapshot {
  itemPropostaId: string
  codigoServico: string
  nomeServico: string
  categoriaServico: string
  quantidade: number
  precoAplicadoUnitario: number
  valorAplicadoLinha: number
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
  dataInicioVigencia: string
  dataFimVigencia: string | null
  diaVencimento: number
  valorMensal: number
  valorTotalEstimado: number | null
  moeda: string
  criadoEm: string
  atualizadoEm: string
}

export interface ContratoDetalhe extends ContratoResumo {
  observacoesContratuais: string | null
  observacoesInternas: string | null
  motivoEncerramento: string | null
  itensSnapshot: ContratoItemSnapshot[]
  ativadoEm: string | null
  suspensoEm: string | null
  encerradoEm: string | null
  canceladoEm: string | null
  criadoPorId: string
  atualizadoPorId: string | null
}

export interface ContratoKpis {
  totalAtivos: number
  totalCadastrados: number
  mrr: number
  moeda: string
}

// ── Operacao / Ordem de Servico ──────────────────────────────────────────────

export type StatusOrdemServico =
  | 'PLANEJADA'
  | 'EM_EXECUCAO'
  | 'AGUARDANDO_REVISAO'
  | 'CONCLUIDA'
  | 'CANCELADA'

export type PrioridadeOrdemServico = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'

export type TipoOrdemServico =
  | 'VISTORIA_TECNICA'
  | 'COLETA_AMOSTRA'
  | 'RENOVACAO_LICENCA'
  | 'DILIGENCIA'
  | 'PROTOCOLO'
  | 'RELATORIO'
  | 'OUTRO'

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
  dataPlanejada: string
  dataPrevistaConclusao: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface OrdemServicoDetalhe extends OrdemServicoResumo {
  escopo: string
  localExecucao: string | null
  observacoesExecucao: string | null
  observacoesInternas: string | null
  motivoCancelamento: string | null
  dataInicioExecucao: string | null
  dataConclusao: string | null
  dataCancelamento: string | null
  criadoPorId: string
  atualizadoPorId: string | null
}

export interface OrdemServicoKpis {
  totalAbertas: number
  totalEmExecucao: number
  totalCriticas: number
  totalConcluidasMes: number
}

// ── Operacao / Entregavel ────────────────────────────────────────────────────

export type StatusEntregavel = 'PENDENTE' | 'GERANDO' | 'DISPONIVEL' | 'ERRO' | 'CANCELADO'

export type TipoEntregavel =
  | 'LAUDO'
  | 'RELATORIO'
  | 'PROTOCOLO'
  | 'CERTIFICADO'
  | 'ATA'
  | 'EVIDENCIA'
  | 'OUTRO'

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
  empreendimentoCidade: string | null
  empreendimentoEstado: string | null
  responsavelId: string | null
  responsavelNome: string | null
  titulo: string
  s3Key: string | null
  nomeArquivo: string | null
  tamanhoBytes: number | null
  geradoEm: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface EntregavelDetalhe extends EntregavelResumo {
  descricao: string | null
  erroMsg: string | null
  canceladoEm: string | null
  criadoPorId: string
  atualizadoPorId: string | null
}

export interface EntregavelKpis {
  totalPendentes: number
  totalDisponiveis: number
  totalCadastrados: number
}

// ── Financeiro ───────────────────────────────────────────────────────────────

export interface FinanceiroResumo {
  mrr: number
  arr: number
  totalContratosAtivos: number
  totalOSsAbertas: number
  totalOSsConcluidasMes: number
  totalEntregaveisPendentes: number
  totalEntregaveisDisponiveis: number
  receitaEstimadaMes: number
  moeda: string
}
