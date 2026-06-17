import { describe, it, expect } from 'vitest'
import {
  materialParedeSimples,
  combustivelTemBenzeno,
  idadeEmAnos,
  mapTanque,
  mapPerfil,
  mapMatriz,
  mapCatalogo,
  mapOrgaos,
  type EmpreendimentoRow,
  type ObrigacaoRow,
} from './mappers.js'

const DATA_REF = new Date('2026-06-17T00:00:00Z')

describe('mappers — material → parede simples', () => {
  it('aço/fibra parede simples → true; dupla/jaquetado → false', () => {
    expect(materialParedeSimples('ACO_PAREDE_SIMPLES')).toBe(true)
    expect(materialParedeSimples('FIBRA_PAREDE_SIMPLES')).toBe(true)
    expect(materialParedeSimples('ACO_PAREDE_DUPLA')).toBe(false)
    expect(materialParedeSimples('JAQUETADO')).toBe(false)
  })
  it('material desconhecido → true (ESTIMADO conservador)', () => {
    expect(materialParedeSimples(null)).toBe(true)
  })
})

describe('mappers — combustível → benzeno', () => {
  it('gasolina e etanol carregam benzeno; diesel/GNV não', () => {
    expect(combustivelTemBenzeno('GASOLINA_COMUM')).toBe(true)
    expect(combustivelTemBenzeno('Etanol')).toBe(true)
    expect(combustivelTemBenzeno('DIESEL_S10')).toBe(false)
    expect(combustivelTemBenzeno('GNV')).toBe(false)
  })
})

describe('mappers — idade do tanque', () => {
  it('calcula anos inteiros; sem data → null; futuro → 0', () => {
    expect(idadeEmAnos(new Date('2006-01-01'), DATA_REF)).toBe(20)
    expect(idadeEmAnos(null, DATA_REF)).toBeNull()
    expect(idadeEmAnos(new Date('2030-01-01'), DATA_REF)).toBe(0)
  })
})

describe('mappers — mapTanque', () => {
  it('compõe parede + idade + benzeno', () => {
    const t = mapTanque({ materialTanque: 'ACO_PAREDE_SIMPLES', dataInstalacao: new Date('2010-06-17'), combustivel: 'GASOLINA' }, DATA_REF)
    expect(t).toEqual({ paredeSimples: true, idadeAnos: 16, combustivelComBenzeno: true })
  })
})

const emp = (over: Partial<EmpreendimentoRow> = {}): EmpreendimentoRow => ({
  cnaePrincipal: '4731-8/00', cnaesSecundarios: [], porte: 'MEDIO', situacaoEmpreendimento: 'OPERACAO',
  estado: 'GO', areaM2: 800, possuiCaptacao: true, possuiSAO: true,
  classeAquifero: 'LIVRE_RASO', profundidadeNivelAguaM: 4, tipoSolo: 'ARENOSO',
  distanciaPocoAbastecimentoM: 40, distanciaCorpoHidricoM: null, emAPP: false, captaParaConsumo: true,
  classificacaoAreaContaminada: 'SEM_INDICIO', ...over,
})

describe('mappers — mapPerfil', () => {
  it('traduz empreendimento + tanques (só ATIVO/INTERDITADO contam como fonte)', () => {
    const p = mapPerfil(emp(), [
      { materialTanque: 'ACO_PAREDE_SIMPLES', dataInstalacao: new Date('2008-06-17'), combustivel: 'GASOLINA', status: 'ATIVO' },
      { materialTanque: 'ACO_PAREDE_DUPLA', dataInstalacao: new Date('2020-06-17'), combustivel: 'DIESEL', status: 'REMOVIDO' },
    ], DATA_REF)
    expect(p.uf).toBe('GO')
    expect(p.porte).toBe('MEDIO')
    expect(p.tanques.length).toBe(1) // REMOVIDO não conta
    expect(p.tanques[0]!.paredeSimples).toBe(true)
    expect(p.classeAquifero).toBe('LIVRE_RASO')
    expect(p.potencialPoluidor).toBeNull() // resolvido só no enquadramento
  })

  it('enum desconhecido vira null (não inventa)', () => {
    const p = mapPerfil(emp({ porte: 'XPTO', situacaoEmpreendimento: null }), [], DATA_REF)
    expect(p.porte).toBeNull()
    expect(p.situacao).toBeNull()
  })

  it('área CONTAMINADA vira sinal; estanqueidade/monitoramento vêm do builder', () => {
    const p = mapPerfil(emp({ classificacaoAreaContaminada: 'CONTAMINADA' }), [], DATA_REF, { estanqueidadeReprovada: true })
    expect(p.sinais?.areaContaminada).toBe(true)
    expect(p.sinais?.estanqueidadeReprovada).toBe(true)
    expect(p.sinais?.monitoramentoNaoConforme).toBe(false)
  })
})

describe('mappers — mapMatriz / mapOrgaos', () => {
  it('mapeia matriz e dicionário UF→órgão', () => {
    const m = mapMatriz([{ cnaeCodigo: '4731-8/00', classeRisco: 'ALTO', potencialPoluidor: 'ALTO', licenciamentoTipo: 'Trifásico', esfera: 'ESTADUAL', necessitaOutorga: false, necessitaMonitoramento: true, nivelRisco: 80 }])
    expect(m[0]!.esfera).toBe('ESTADUAL')
    expect(m[0]!.potencialPoluidor).toBe('ALTO')
    expect(mapOrgaos([{ uf: 'GO', orgao: 'SEMAD' }, { uf: 'SP', orgao: 'CETESB' }])).toEqual({ GO: 'SEMAD', SP: 'CETESB' })
  })
})

describe('mappers — mapCatalogo (aplicabilidade Json)', () => {
  const row = (over: Partial<ObrigacaoRow> = {}): ObrigacaoRow => ({
    codigo: 'AMB-001', modulo: 'AMBIENTAL', descricao: 'LO', fundamentoLegal: 'CONAMA 273', periodicidade: 'QUADRIENAL',
    criticidade: 'CRITICA', aplicabilidade: { cnaePrefixos: ['4731'] }, consequenciaSemFazer: null, multaMaxima: null, custoServicoRef: 5000, ...over,
  })
  it('parseia aplicabilidade válida', () => {
    expect(mapCatalogo([row()])[0]!.aplicabilidade).toEqual({ cnaePrefixos: ['4731'] })
  })
  it('aplicabilidade ausente/inválida → { sempre:false } (não vira universal)', () => {
    expect(mapCatalogo([row({ aplicabilidade: null })])[0]!.aplicabilidade).toEqual({ sempre: false })
    expect(mapCatalogo([row({ aplicabilidade: { foo: 1 } })])[0]!.aplicabilidade).toEqual({ sempre: false })
  })
  it('obrigação inativa é descartada', () => {
    expect(mapCatalogo([row({ ativo: false })]).length).toBe(0)
  })
})
