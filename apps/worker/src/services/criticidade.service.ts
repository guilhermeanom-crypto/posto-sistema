// ─────────────────────────────────────────────────────────────────────────────
// CRITICIDADE SERVICE
// Calcula um score numérico 0-100 para cada tarefa, usado para ordenar a
// fila de trabalho unificada. Quanto maior o score, mais urgente a ação.
//
// Fórmula: pontosPrazo + pesoModulo + pontosInacao
// ─────────────────────────────────────────────────────────────────────────────

type OrigemTarefa = string

// ── Tabela de peso por módulo/origem ────────────────────────────────────────

const PESO_MODULO: Record<string, number> = {
  REGRA_VENCIMENTO_LICENCA: 18,
  REGRA_VENCIMENTO_PROC: 14,
  REGRA_CONDICIONANTE: 16,
  REGRA_VENCIMENTO_ESTANQUEIDADE: 16,
  REGRA_VENCIMENTO_PGRS: 12,
  REGRA_VENCIMENTO_ANP: 8,
  REGRA_VENCIMENTO_SST: 8,
  REGRA_VENCIMENTO_OUTORGA: 6,
  REGRA_VENCIMENTO_DOC: 6,
  WORKFLOW: 12,
  ESCALAMENTO: 10,
  REGRA_REQUISITO_PENDENTE: 8,
  MANUAL: 5,
}

// ── Pontos por prazo ────────────────────────────────────────────────────────

function pontosPrazo(dataVencimento: Date | null): number {
  if (!dataVencimento) return 5 // sem prazo = prioridade baixa
  const dias = Math.ceil((dataVencimento.getTime() - Date.now()) / 86_400_000)
  if (dias < 0) return 40   // já venceu
  if (dias === 0) return 35  // vence hoje
  if (dias <= 3) return 30
  if (dias <= 7) return 25
  if (dias <= 15) return 18
  if (dias <= 30) return 10
  if (dias <= 60) return 5
  return 0
}

// ── Pontos por inação ───────────────────────────────────────────────────────

function pontosInacao(atualizadoEm: Date): number {
  const diasSemAcao = Math.floor((Date.now() - atualizadoEm.getTime()) / 86_400_000)
  if (diasSemAcao > 15) return 10
  if (diasSemAcao > 10) return 7
  if (diasSemAcao > 5) return 4
  return 0
}

// ── Cálculo principal ───────────────────────────────────────────────────────

export interface TarefaParaScore {
  origem: OrigemTarefa
  dataVencimento: Date | null
  atualizadoEm: Date
}

/**
 * Calcula o score de criticidade de uma tarefa.
 * Retorna número de 0 a 100 (capped).
 */
export function calcularScoreCriticidade(tarefa: TarefaParaScore): number {
  const prazo = pontosPrazo(tarefa.dataVencimento)
  const modulo = PESO_MODULO[tarefa.origem] ?? 5
  const inacao = pontosInacao(tarefa.atualizadoEm)

  return Math.min(prazo + modulo + inacao, 100)
}

// ── Helpers para escalamento ────────────────────────────────────────────────

export interface RegraEscalamento {
  scoreMinimo: number
  diasSemAcaoMinimo: number
}

export const REGRAS_ESCALAMENTO: RegraEscalamento[] = [
  { scoreMinimo: 80, diasSemAcaoMinimo: 2 },
  { scoreMinimo: 60, diasSemAcaoMinimo: 5 },
  { scoreMinimo: 40, diasSemAcaoMinimo: 10 },
]

/**
 * Verifica se uma tarefa deve ser escalada com base no score e inação.
 */
export function deveEscalar(score: number, atualizadoEm: Date): boolean {
  const diasSemAcao = Math.floor((Date.now() - atualizadoEm.getTime()) / 86_400_000)
  for (const regra of REGRAS_ESCALAMENTO) {
    if (score >= regra.scoreMinimo && diasSemAcao >= regra.diasSemAcaoMinimo) {
      return true
    }
  }
  return false
}
