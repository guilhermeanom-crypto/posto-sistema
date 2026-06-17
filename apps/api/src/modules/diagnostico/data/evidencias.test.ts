import { describe, it, expect } from 'vitest'
import { apurarEvidencias, type EvidenciasFonte } from './evidencias.js'

const DATA_REF = new Date('2026-06-17T00:00:00Z')
const fonte = (over: Partial<EvidenciasFonte> = {}): EvidenciasFonte => ({
  licencas: [], alvaras: [], testesEstanqueidade: [], ...over,
})
const dataEmDias = (d: number) => new Date(DATA_REF.getTime() + d * 86400000)

describe('evidências — LO (AMB-001)', () => {
  it('LO vigente e longe do vencimento → CONFORME', () => {
    const ev = apurarEvidencias(fonte({ licencas: [{ tipo: 'LO', status: 'VIGENTE', dataVencimento: dataEmDias(400) }] }), DATA_REF)
    expect(ev['AMB-001']).toBe('CONFORME')
  })
  it('LO vencida ou vencendo em < 60d → A_RENOVAR', () => {
    expect(apurarEvidencias(fonte({ licencas: [{ tipo: 'LO', status: 'VENCIDA', dataVencimento: dataEmDias(-10) }] }), DATA_REF)['AMB-001']).toBe('A_RENOVAR')
    expect(apurarEvidencias(fonte({ licencas: [{ tipo: 'LO', status: 'VIGENTE', dataVencimento: dataEmDias(30) }] }), DATA_REF)['AMB-001']).toBe('A_RENOVAR')
  })
  it('sem LO → ausente (motor assume SEM_DADOS)', () => {
    expect(apurarEvidencias(fonte(), DATA_REF)['AMB-001']).toBeUndefined()
  })
})

describe('evidências — estanqueidade (AMB-004/005)', () => {
  it('todos APROVADO e em dia → CONFORME nos dois códigos', () => {
    const ev = apurarEvidencias(fonte({ testesEstanqueidade: [{ resultado: 'APROVADO', proximoTeste: dataEmDias(200) }] }), DATA_REF)
    expect(ev['AMB-004']).toBe('CONFORME')
    expect(ev['AMB-005']).toBe('CONFORME')
  })
  it('algum REPROVADO ou vencido → A_RENOVAR', () => {
    expect(apurarEvidencias(fonte({ testesEstanqueidade: [{ resultado: 'APROVADO', proximoTeste: dataEmDias(200) }, { resultado: 'REPROVADO', proximoTeste: dataEmDias(200) }] }), DATA_REF)['AMB-004']).toBe('A_RENOVAR')
    expect(apurarEvidencias(fonte({ testesEstanqueidade: [{ resultado: 'APROVADO', proximoTeste: dataEmDias(-5) }] }), DATA_REF)['AMB-005']).toBe('A_RENOVAR')
  })
})

describe('evidências — alvarás (URB-001 AVCB / URB-002 funcionamento)', () => {
  it('mapeia AVCB e alvará de funcionamento por tipo', () => {
    const ev = apurarEvidencias(fonte({ alvaras: [
      { tipo: 'AVCB', status: 'VIGENTE', dataVencimento: dataEmDias(300) },
      { tipo: 'ALVARA_FUNCIONAMENTO', status: 'VENCIDA', dataVencimento: dataEmDias(-1) },
    ] }), DATA_REF)
    expect(ev['URB-001']).toBe('CONFORME')
    expect(ev['URB-002']).toBe('A_RENOVAR')
  })
})

describe('evidências — só apura o que tem dado (honesto)', () => {
  it('fonte vazia → mapa vazio (tudo SEM_DADOS no motor)', () => {
    expect(apurarEvidencias(fonte(), DATA_REF)).toEqual({})
  })
})
