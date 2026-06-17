import { describe, it, expect } from 'vitest'
import { calcularRiscoIntrinseco, PESOS_RISCO_INTRINSECO } from './risco-intrinseco.js'
import type { PerfilEmpreendimento } from '../domain/types.js'

const base = (over: Partial<PerfilEmpreendimento> = {}): PerfilEmpreendimento => ({
  cnaePrincipal: '4731-8/00', cnaesSecundarios: [], porte: 'MEDIO', situacao: 'OPERACAO', uf: 'GO',
  potencialPoluidor: 'ALTO', areaM2: 800, possuiCaptacao: false, possuiSAO: true,
  tanques: [{ paredeSimples: false, idadeAnos: 2, combustivelComBenzeno: true }],
  ...over,
})

describe('risco intrínseco — pesos assinados (v1.0)', () => {
  it('pesos assinados → resultado NÃO marcado beta', () => {
    expect(PESOS_RISCO_INTRINSECO.assinado).toBe(true)
    expect(PESOS_RISCO_INTRINSECO.versao).toBe('1.0')
    expect(calcularRiscoIntrinseco(base()).beta).toBe(false)
  })
})

describe('risco intrínseco — AMEAÇA discrimina o tanque', () => {
  it('tanque novo parede dupla < tanque velho parede simples', () => {
    const novo = calcularRiscoIntrinseco(base()).score
    const velho = calcularRiscoIntrinseco(base({ tanques: [{ paredeSimples: true, idadeAnos: 25, combustivelComBenzeno: true }] })).score
    expect(velho).toBeGreaterThan(novo)
  })

  it('benzeno (gasolina) agrava vs sem benzeno', () => {
    const t = (b: boolean) => calcularRiscoIntrinseco(base({ tanques: [{ paredeSimples: true, idadeAnos: 25, combustivelComBenzeno: b }] })).score
    expect(t(true)).toBeGreaterThan(t(false))
  })
})

describe('risco intrínseco — VULNERABILIDADE e RECEPTOR agravam', () => {
  it('aquífero raso + solo arenoso eleva o score', () => {
    const neutro = calcularRiscoIntrinseco(base({ tanques: [{ paredeSimples: true, idadeAnos: 25 }], classeAquifero: 'CONFINADO', tipoSolo: 'ROCHOSO' })).score
    const vulneravel = calcularRiscoIntrinseco(base({ tanques: [{ paredeSimples: true, idadeAnos: 25 }], classeAquifero: 'LIVRE_RASO', tipoSolo: 'ARENOSO', profundidadeNivelAguaM: 3 })).score
    expect(vulneravel).toBeGreaterThan(neutro)
  })

  it('poço de abastecimento < 100m adiciona fator nomeado de receptor', () => {
    const r = calcularRiscoIntrinseco(base({ distanciaPocoAbastecimentoM: 40, captaParaConsumo: true }))
    expect(r.fatores.some((f) => /Poço/.test(f.descricao))).toBe(true)
    expect(r.fatores.every((f) => f.baseTecnica.length > 0)).toBe(true) // toda saída rastreável
  })
})

describe('risco intrínseco — GATILHO: o medido domina o estimado', () => {
  it('área contaminada impõe piso mesmo com tanque novo', () => {
    const semSinal = calcularRiscoIntrinseco(base()).score
    const r = calcularRiscoIntrinseco(base({ sinais: { areaContaminada: true } }))
    expect(semSinal).toBeLessThan(PESOS_RISCO_INTRINSECO.gatilho.pisoAreaContaminada)
    expect(r.score).toBe(PESOS_RISCO_INTRINSECO.gatilho.pisoAreaContaminada)
    expect(r.nivel).toBe('CRITICO')
  })
})

describe('risco intrínseco — defaults conservadores (cadastro mínimo)', () => {
  it('sem idade/benzeno/meio informados → assume conservador (score relevante, não zero)', () => {
    const r = calcularRiscoIntrinseco(base({ tanques: [{ paredeSimples: true, idadeAnos: null }] }))
    expect(r.score).toBeGreaterThan(30)
    expect(r.fatores.some((f) => /ESTIMADO/.test(f.descricao) || /ESTIMADO/.test(f.baseTecnica))).toBe(true)
  })
})

describe('risco intrínseco — determinístico (idempotente)', () => {
  it('mesma entrada → mesma saída', () => {
    const p = base({ classeAquifero: 'LIVRE_RASO', tipoSolo: 'ARENOSO', distanciaPocoAbastecimentoM: 40, sinais: { estanqueidadeReprovada: true } })
    expect(calcularRiscoIntrinseco(p)).toEqual(calcularRiscoIntrinseco(p))
  })
})
