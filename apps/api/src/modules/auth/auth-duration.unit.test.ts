import { describe, expect, it } from 'vitest'
import { parseDurationMs, parseDurationSeconds } from './auth-duration.js'

describe('auth-duration', () => {
  it('converte durações com unidade explícita para milissegundos', () => {
    expect(parseDurationMs('15m')).toBe(900_000)
    expect(parseDurationMs('7d')).toBe(604_800_000)
    expect(parseDurationMs('250ms')).toBe(250)
  })

  it('assume segundos quando a duração não informa unidade', () => {
    expect(parseDurationMs('900')).toBe(900_000)
    expect(parseDurationSeconds('900')).toBe(900)
  })

  it('normaliza em segundos inteiros para o contrato do token', () => {
    expect(parseDurationSeconds('15m')).toBe(900)
    expect(parseDurationSeconds('1h')).toBe(3600)
  })

  it('rejeita formatos inválidos', () => {
    expect(() => parseDurationMs('15 minutos')).toThrow('Formato de duração inválido')
    expect(() => parseDurationMs('abc')).toThrow('Formato de duração inválido')
  })
})
