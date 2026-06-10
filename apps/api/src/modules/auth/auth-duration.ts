const DURATION_MULTIPLIERS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const

export function parseDurationMs(value: string) {
  const normalized = value.trim()
  const match = normalized.match(/^(\d+)(ms|s|m|h|d)?$/)

  if (!match) {
    throw new Error(`Formato de duração inválido: "${value}"`)
  }

  const amount = Number(match[1])
  const unit = (match[2] ?? 's') as keyof typeof DURATION_MULTIPLIERS
  return amount * DURATION_MULTIPLIERS[unit]
}

export function parseDurationSeconds(value: string) {
  return Math.floor(parseDurationMs(value) / 1000)
}
