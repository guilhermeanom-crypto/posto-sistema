import { describe, it, expect } from 'vitest'
import {
  nivelPorDias,
  dentroDeHorizonte,
  contarStreakAlertas,
  somarFatores,
  diasAteData,
} from './alertas-campo.js'

const HORIZONTES = [30, 15, 7, 3, 1]

describe('nivelPorDias', () => {
  it('classifica por proximidade do vencimento', () => {
    expect(nivelPorDias(0)).toBe('CRITICO')
    expect(nivelPorDias(3)).toBe('CRITICO')
    expect(nivelPorDias(4)).toBe('ALTO')
    expect(nivelPorDias(7)).toBe('ALTO')
    expect(nivelPorDias(8)).toBe('MEDIO')
    expect(nivelPorDias(30)).toBe('MEDIO')
  })
})

describe('dentroDeHorizonte (L-02: tolera execução perdida)', () => {
  it('dispara no dia exato do horizonte', () => {
    for (const h of HORIZONTES) expect(dentroDeHorizonte(h, HORIZONTES)).toBe(true)
  })

  it('dispara também em H-1 (tolera 1 dia perdido)', () => {
    expect(dentroDeHorizonte(14, HORIZONTES)).toBe(true) // job perdeu o dia 15
    expect(dentroDeHorizonte(6, HORIZONTES)).toBe(true) // perdeu o dia 7
    expect(dentroDeHorizonte(0, HORIZONTES)).toBe(true) // perdeu o dia 1
  })

  it('NÃO dispara fora das faixas (evita spam)', () => {
    expect(dentroDeHorizonte(20, HORIZONTES)).toBe(false)
    expect(dentroDeHorizonte(10, HORIZONTES)).toBe(false)
    expect(dentroDeHorizonte(5, HORIZONTES)).toBe(false)
  })
})

describe('contarStreakAlertas (L-04: conforme quebra o streak)', () => {
  it('conta alertas consecutivos a partir do mais recente', () => {
    expect(contarStreakAlertas([true, true, true])).toBe(3)
    expect(contarStreakAlertas([true, true])).toBe(2)
  })

  it('uma medição conforme no meio quebra o streak', () => {
    // alerta, conforme, alerta → só o mais recente conta (não é "consecutivo")
    expect(contarStreakAlertas([true, false, true])).toBe(1)
    expect(contarStreakAlertas([true, true, false, true])).toBe(2)
  })

  it('medição mais recente conforme = streak zero (tendência normalizada)', () => {
    expect(contarStreakAlertas([false, true, true])).toBe(0)
  })

  it('sem leituras = zero', () => {
    expect(contarStreakAlertas([])).toBe(0)
  })
})

describe('somarFatores (L-01: score = Σ pontos, exibido == somado)', () => {
  it('soma os pontos dos fatores', () => {
    expect(somarFatores([{ pontos: 35 }, { pontos: 20 }, { pontos: 8 }])).toBe(63)
    expect(somarFatores([])).toBe(0)
  })

  it('um fator de N autos contribui exatamente o que exibe (pontos = 25 * autos)', () => {
    // antes do fix L-01: card exibia 25 mas score somava 25*autos -> divergência.
    // agora o score é derivado da soma dos pontos exibidos.
    const autos = 3
    const fatores = [{ descricao: `${autos} auto(s) ANP`, pontos: 25 * autos }]
    expect(somarFatores(fatores)).toBe(75) // = o que o card mostra
  })
})

describe('diasAteData (L-07: determinístico, não depende da hora)', () => {
  // Usa o construtor local new Date(ano, mêsIdx, dia, hora) para o teste não depender
  // do fuso da máquina (datetime-string é local, date-string é UTC — não misturar).
  it('mesmo dia = 0', () => {
    expect(diasAteData(new Date(2026, 6, 1, 8), new Date(2026, 6, 1, 20))).toBe(0)
  })

  it('conta dias inteiros independente da hora de execução', () => {
    const alvo = new Date(2026, 6, 10)
    // hoje de manhã e à noite -> mesmo resultado (antes podia diferir por 1)
    expect(diasAteData(alvo, new Date(2026, 6, 1, 0, 1))).toBe(9)
    expect(diasAteData(alvo, new Date(2026, 6, 1, 23, 59))).toBe(9)
  })

  it('data passada = negativo', () => {
    expect(diasAteData(new Date(2026, 5, 25), new Date(2026, 6, 1, 12))).toBe(-6)
  })
})
