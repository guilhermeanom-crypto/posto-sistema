// ─────────────────────────────────────────────────────────────────────────────
// UTILITÁRIOS DE DATA — sem dependência de biblioteca externa
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna a diferença em dias inteiros entre hoje e uma data futura.
 * Resultado positivo: data no futuro. Negativo: data no passado.
 */
export function diasAteVencimento(dataVencimento: Date | string): number {
  const vencimento = typeof dataVencimento === 'string' ? new Date(dataVencimento) : dataVencimento
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  vencimento.setHours(0, 0, 0, 0)
  return Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Verifica se uma data está vencida (antes de hoje).
 */
export function estaVencido(data: Date | string): boolean {
  return diasAteVencimento(data) < 0
}

/**
 * Adiciona N dias a uma data.
 */
export function adicionarDias(data: Date, dias: number): Date {
  const resultado = new Date(data)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

/**
 * Adiciona N meses a uma data, respeitando o calendário.
 */
export function adicionarMeses(data: Date, meses: number): Date {
  const resultado = new Date(data)
  resultado.setMonth(resultado.getMonth() + meses)
  return resultado
}

/**
 * Adiciona N anos a uma data.
 */
export function adicionarAnos(data: Date, anos: number): Date {
  const resultado = new Date(data)
  resultado.setFullYear(resultado.getFullYear() + anos)
  return resultado
}

/**
 * Formata uma data no padrão brasileiro (dd/mm/aaaa).
 */
export function formatarDataBR(data: Date | string | null | undefined): string {
  if (!data) return '—'
  const d = typeof data === 'string' ? new Date(data) : data
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

/**
 * Retorna o início do dia em UTC.
 */
export function inicioDoDia(data?: Date): Date {
  const d = data ? new Date(data) : new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * Retorna o fim do dia em UTC.
 */
export function fimDoDia(data?: Date): Date {
  const d = data ? new Date(data) : new Date()
  d.setUTCHours(23, 59, 59, 999)
  return d
}

/**
 * Converte string YYYY-MM-DD para objeto Date sem timezone shift.
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

/**
 * Formata Date para string YYYY-MM-DD.
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]!
}
