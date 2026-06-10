// ─────────────────────────────────────────────────────────────────────────────
// Lógica pura de regras de alerta/anomalia — SEM redis/prisma/side-effects.
// Extraída para ser testável isoladamente (a harness do worker importa daqui).
// ─────────────────────────────────────────────────────────────────────────────

/** Nível de alerta conforme dias até o vencimento. */
export function nivelPorDias(dias: number): 'CRITICO' | 'ALTO' | 'MEDIO' {
  return dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
}

/**
 * Decide se deve alertar no dia. Tolera UMA execução perdida disparando também em H-1
 * (antes era match exato e perdia o alerta se o job não rodasse exatamente naquele dia);
 * o dedup de 24h do processor de alertas evita duplicar em dias consecutivos.
 */
export function dentroDeHorizonte(dias: number, horizontes: number[]): boolean {
  return horizontes.some((h) => dias === h || dias === h - 1)
}

/**
 * Soma os pontos dos fatores de risco. Derivar o score DAQUI (em vez de acumular
 * `score += X` em paralelo ao `fatores.push`) garante por construção que
 * score === Σ pontos — elimina a classe do bug L-01 (pontos exibidos ≠ score somado).
 */
export function somarFatores(fatores: { pontos: number }[]): number {
  return fatores.reduce((acc, f) => acc + f.pontos, 0)
}

/**
 * Dias inteiros até a data alvo, zerando as horas dos dois lados (determinístico,
 * não depende da hora de execução — L-07). Usa ceil para alinhar com o score de risco.
 */
export function diasAteData(alvo: Date, hoje: Date = new Date()): number {
  const a = new Date(alvo); a.setHours(0, 0, 0, 0)
  const h = new Date(hoje); h.setHours(0, 0, 0, 0)
  return Math.ceil((a.getTime() - h.getTime()) / 86_400_000)
}

/**
 * Conta o streak de alertas CONSECUTIVOS a partir da medição mais recente (índice 0,
 * série em ordem decrescente de data). Uma medição conforme (false) quebra o streak —
 * é o que distingue "tendência persistente" de medições alternadas.
 */
export function contarStreakAlertas(flagsDescendente: boolean[]): number {
  let streak = 0
  for (const emAlerta of flagsDescendente) {
    if (emAlerta) streak += 1
    else break
  }
  return streak
}
