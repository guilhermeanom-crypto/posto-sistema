export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function diasRestantes(value: string | Date | null | undefined): number | null {
  if (!value) return null
  const d = typeof value === 'string' ? new Date(value) : value
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.floor((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export function labelDiasRestantes(value: string | Date | null | undefined): string {
  const dias = diasRestantes(value)
  if (dias === null) return '—'
  if (dias < 0) return `Vencido há ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence hoje'
  if (dias <= 30) return `${dias}d restantes`
  return formatDate(value)
}
