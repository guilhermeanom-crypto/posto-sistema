import { describe, it, expect } from 'vitest'
import { evaluateAplicabilidade, regraAplicabilidadeSchema } from './aplicabilidade.js'
import type { PerfilEmpreendimento } from './types.js'

// Perfil-base: posto revendedor em GO, sem captação/SAO, com 1 tanque parede dupla novo.
const base: PerfilEmpreendimento = {
  cnaePrincipal: '4731-8/00',
  cnaesSecundarios: [],
  porte: 'MEDIO',
  situacao: 'OPERACAO',
  uf: 'GO',
  potencialPoluidor: 'ALTO',
  areaM2: 800,
  possuiCaptacao: false,
  possuiSAO: false,
  tanques: [{ paredeSimples: false, idadeAnos: 3 }],
}
const com = (p: Partial<PerfilEmpreendimento>): PerfilEmpreendimento => ({ ...base, ...p })

describe('evaluateAplicabilidade — tabela-verdade por gatilho', () => {
  it('núcleo sempre aplicável (regra vazia)', () => {
    expect(evaluateAplicabilidade({}, base).aplicavel).toBe(true)
    expect(evaluateAplicabilidade({ sempre: true }, base).aplicavel).toBe(true)
  })

  it('sempre=false desativa', () => {
    expect(evaluateAplicabilidade({ sempre: false }, base).aplicavel).toBe(false)
  })

  it('CNAE por prefixo: combustíveis (47) casa, comércio fora (45) não', () => {
    expect(evaluateAplicabilidade({ cnaePrefixos: ['4731'] }, base).aplicavel).toBe(true)
    expect(evaluateAplicabilidade({ cnaePrefixos: ['45'] }, base).aplicavel).toBe(false)
  })

  it('CNAE exato', () => {
    expect(evaluateAplicabilidade({ cnaeExatos: ['4731-8/00'] }, base).aplicavel).toBe(true)
    expect(evaluateAplicabilidade({ cnaeExatos: ['1921-7/00'] }, base).aplicavel).toBe(false)
  })

  it('CNAE casa por secundário', () => {
    const p = com({ cnaePrincipal: '6822-6/00', cnaesSecundarios: ['4731-8/00'] })
    expect(evaluateAplicabilidade({ cnaePrefixos: ['4731'] }, p).aplicavel).toBe(true)
  })

  it('porte', () => {
    expect(evaluateAplicabilidade({ portes: ['MEDIO', 'GRANDE'] }, base).aplicavel).toBe(true)
    expect(evaluateAplicabilidade({ portes: ['MEI'] }, base).aplicavel).toBe(false)
  })

  it('UF', () => {
    expect(evaluateAplicabilidade({ ufs: ['GO', 'SP'] }, base).aplicavel).toBe(true)
    expect(evaluateAplicabilidade({ ufs: ['SP'] }, base).aplicavel).toBe(false)
  })

  it('requerCaptacao → outorga só com captação (Lei 9.433/97)', () => {
    expect(evaluateAplicabilidade({ requerCaptacao: true }, base).aplicavel).toBe(false)
    const r = evaluateAplicabilidade({ requerCaptacao: true }, com({ possuiCaptacao: true }))
    expect(r.aplicavel).toBe(true)
    expect(r.motivo).toContain('9.433')
  })

  it('requerSAO', () => {
    expect(evaluateAplicabilidade({ requerSAO: true }, base).aplicavel).toBe(false)
    expect(evaluateAplicabilidade({ requerSAO: true }, com({ possuiSAO: true })).aplicavel).toBe(true)
  })

  it('requerTanqueParedeSimples (CONAMA 273)', () => {
    expect(evaluateAplicabilidade({ requerTanqueParedeSimples: true }, base).aplicavel).toBe(false)
    const p = com({ tanques: [{ paredeSimples: true, idadeAnos: 5 }] })
    expect(evaluateAplicabilidade({ requerTanqueParedeSimples: true }, p).aplicavel).toBe(true)
  })

  it('tanqueIdadeMinAnos — passivo CONAMA 420 só com tanque velho', () => {
    expect(evaluateAplicabilidade({ tanqueIdadeMinAnos: 15 }, base).aplicavel).toBe(false)
    const p = com({ tanques: [{ paredeSimples: false, idadeAnos: 20 }] })
    expect(evaluateAplicabilidade({ tanqueIdadeMinAnos: 15 }, p).aplicavel).toBe(true)
  })

  it('areaMinM2', () => {
    expect(evaluateAplicabilidade({ areaMinM2: 1000 }, base).aplicavel).toBe(false)
    expect(evaluateAplicabilidade({ areaMinM2: 500 }, base).aplicavel).toBe(true)
  })

  it('potencialPoluidorMin (ordem BAIXO<MEDIO<ALTO)', () => {
    expect(evaluateAplicabilidade({ potencialPoluidorMin: 'ALTO' }, base).aplicavel).toBe(true)
    const p = com({ potencialPoluidor: 'BAIXO' })
    expect(evaluateAplicabilidade({ potencialPoluidorMin: 'ALTO' }, p).aplicavel).toBe(false)
  })

  it('AND de múltiplas condições — todas presentes devem passar', () => {
    const regra = { cnaePrefixos: ['47'], ufs: ['GO'], requerCaptacao: true }
    // base não tem captação → falha mesmo casando CNAE+UF
    expect(evaluateAplicabilidade(regra, base).aplicavel).toBe(false)
    expect(evaluateAplicabilidade(regra, com({ possuiCaptacao: true })).aplicavel).toBe(true)
  })

  it('schema zod rejeita campo desconhecido (strict)', () => {
    expect(regraAplicabilidadeSchema.safeParse({ campoInvalido: 1 }).success).toBe(false)
    expect(regraAplicabilidadeSchema.safeParse({ cnaePrefixos: ['47'], requerCaptacao: true }).success).toBe(true)
  })
})
