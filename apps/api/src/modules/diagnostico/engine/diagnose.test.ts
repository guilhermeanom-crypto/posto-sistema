import { describe, it, expect } from 'vitest'
import { diagnose, findMatrizByCnae, type DiagnoseInput, type ObrigacaoCatalogo, type MatrizCnae } from './diagnose.js'
import type { PerfilEmpreendimento } from '../domain/types.js'

// ── Fixtures (puro, sem banco) ────────────────────────────────────────────────
const MATRIZ: MatrizCnae[] = [
  {
    cnaeCodigo: '4731-8/00',
    classeRisco: 'ALTO',
    potencialPoluidor: 'ALTO',
    licenciamentoTipo: 'Trifásico (LP/LI/LO)',
    esfera: 'ESTADUAL',
    necessitaOutorga: false,
    necessitaMonitoramento: true,
    nivelRisco: 80,
  },
]
const ORGAOS = { GO: 'SEMAD', SP: 'CETESB' }

const CATALOGO: ObrigacaoCatalogo[] = [
  { codigo: 'AMB-001', modulo: 'AMBIENTAL', descricao: 'Licença de Operação', fundamentoLegal: 'CONAMA 273/2000', periodicidade: 'QUADRIENAL', criticidade: 'CRITICA', aplicabilidade: { cnaePrefixos: ['4731'] }, consequenciaSemFazer: 'Embargo', multaMaxima: 'R$ 10mi', custoServicoRef: 5000 },
  { codigo: 'ANP-001', modulo: 'ANP', descricao: 'Registro ANP', fundamentoLegal: 'Lei 9.847/99', periodicidade: 'UNICA', criticidade: 'CRITICA', aplicabilidade: { cnaePrefixos: ['4731'] }, consequenciaSemFazer: 'Interdição', multaMaxima: 'R$ 5mi', custoServicoRef: 1500 },
  { codigo: 'MON-004', modulo: 'MONITORAMENTO', descricao: 'Outorga hídrica', fundamentoLegal: 'Lei 9.433/97', periodicidade: 'ANUAL', criticidade: 'ALTA', aplicabilidade: { cnaePrefixos: ['4731'], requerCaptacao: true }, consequenciaSemFazer: 'Embargo da captação', multaMaxima: 'R$ 10mi', custoServicoRef: 3000 },
  { codigo: 'AMB-006', modulo: 'AMBIENTAL', descricao: 'Investigação de passivo', fundamentoLegal: 'CONAMA 420/2009', periodicidade: 'ANUAL', criticidade: 'ALTA', aplicabilidade: { cnaePrefixos: ['4731'], tanqueIdadeMinAnos: 15 }, consequenciaSemFazer: 'Remediação', multaMaxima: 'R$ 10mi', custoServicoRef: 8000 },
]

// Posto A: novo, parede dupla, SEM captação → só núcleo (LO + ANP)
const postoA: PerfilEmpreendimento = {
  cnaePrincipal: '4731-8/00', cnaesSecundarios: [], porte: 'MEDIO', situacao: 'IMPLANTACAO', uf: 'GO',
  potencialPoluidor: null, areaM2: 800, possuiCaptacao: false, possuiSAO: false,
  tanques: [{ paredeSimples: false, idadeAnos: 2 }],
}
// Posto B: MESMO endereço (GO), 12a parede simples + captação → núcleo + outorga + passivo
const postoB: PerfilEmpreendimento = {
  ...postoA, situacao: 'OPERACAO', possuiCaptacao: true,
  tanques: [{ paredeSimples: true, idadeAnos: 18 }],
}

const input = (perfil: PerfilEmpreendimento, evidencias: Record<string, never> | Record<string, 'CONFORME'> = {}): DiagnoseInput => ({
  perfil, catalogo: CATALOGO, matriz: MATRIZ, orgaos: ORGAOS, evidencias: evidencias as never, dataRef: new Date('2026-06-16T00:00:00Z'),
})

describe('findMatrizByCnae — exato → prefixo → grupo', () => {
  it('casa exato', () => expect(findMatrizByCnae(MATRIZ, '4731-8/00')?.cnaeCodigo).toBe('4731-8/00'))
  it('casa por grupo de 4 dígitos', () => expect(findMatrizByCnae(MATRIZ, '4731-8/02')?.cnaeCodigo).toBe('4731-8/00'))
  it('não casa CNAE de outro ramo', () => expect(findMatrizByCnae(MATRIZ, '6822-6/00')).toBeNull())
})

describe('diagnose — enquadramento', () => {
  it('resolve potencial/esfera/órgão pelo CNAE+UF', () => {
    const r = diagnose(input(postoA))
    expect(r.enquadramento.potencialPoluidor).toBe('ALTO')
    expect(r.enquadramento.esfera).toBe('ESTADUAL')
    expect(r.enquadramento.orgaoCompetente).toBe('SEMAD')
  })
})

describe('diagnose — TESTE DE DISCRIMINAÇÃO (o coração da calibragem)', () => {
  it('mesmo endereço, perfis físicos diferentes → obrigações DIFERENTES', () => {
    const codigosA = diagnose(input(postoA)).obrigacoesAplicaveis.map((o) => o.codigo).sort()
    const codigosB = diagnose(input(postoB)).obrigacoesAplicaveis.map((o) => o.codigo).sort()
    expect(codigosA).toEqual(['AMB-001', 'ANP-001']) // só núcleo
    expect(codigosB).toEqual(['AMB-001', 'AMB-006', 'ANP-001', 'MON-004']) // + outorga + passivo
    expect(codigosA).not.toEqual(codigosB)
  })
})

describe('diagnose — TESTE DE OURO (determinístico)', () => {
  it('mesma entrada → mesma saída (idempotente)', () => {
    expect(diagnose(input(postoB))).toEqual(diagnose(input(postoB)))
  })
})

describe('diagnose — conformidade e risco', () => {
  it('posto sem evidência: conformidade 0, risco alto, fatores nomeados', () => {
    const r = diagnose(input(postoB))
    expect(r.conformidadeScore).toBe(0)
    expect(r.riscoConformidadeScore).toBeGreaterThan(0)
    expect(r.fatoresRisco.length).toBe(4)
    expect(r.fatoresRisco[0]!.baseNormativa).toBeTruthy() // toda saída rastreável
  })

  it('posto com tudo conforme: conformidade 100, risco 0', () => {
    const ev = { 'AMB-001': 'CONFORME', 'ANP-001': 'CONFORME', 'MON-004': 'CONFORME', 'AMB-006': 'CONFORME' } as Record<string, 'CONFORME'>
    const r = diagnose(input(postoB, ev))
    expect(r.conformidadeScore).toBe(100)
    expect(r.riscoConformidadeScore).toBe(0)
    expect(r.riscoNivel).toBe('BAIXO')
  })

  it('orçamento soma custo dos gaps (mínimo = só críticas)', () => {
    const r = diagnose(input(postoB))
    // gaps: AMB-001(5000,CRIT) ANP-001(1500,CRIT) MON-004(3000) AMB-006(8000)
    expect(r.orcamentoEstimado.recomendado).toBe(17500)
    expect(r.orcamentoEstimado.minimo).toBe(6500) // só CRITICA
  })
})
