import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─────────────────────────────────────────────────────────────────────────────
// SEED DA FUNDAÇÃO (Blueprint 101 — Passo 1) — catálogo GLOBAL
//   1) Cnae           — 1.336 CNAEs oficiais (do CSV)
//   2) OrgaoLicenciadorUF — 27 UFs (LC 140/2011), órgão real, sem fallback genérico
//   3) RegulatoryMatrix — enquadramento dos CNAEs de posto (potencial/órgão/rito)
// Idempotente (upsert). Uso: SEED rodado 1x em dev/prod.
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()
const __dirname = dirname(fileURLToPath(import.meta.url))

// ── 1) CNAEs do CSV ──────────────────────────────────────────────────────────
async function seedCnae() {
  const csv = readFileSync(join(__dirname, 'data', 'cnae_base_oficial.csv'), 'utf-8')
  const linhas = csv.split(/\r?\n/).filter(Boolean)
  linhas.shift() // header "cnae,atividade"
  const dados = linhas.map((linha) => {
    const i = linha.indexOf(',')
    const codigo = linha.slice(0, i).trim()
    const descricao = linha.slice(i + 1).trim().replace(/^"|"$/g, '')
    const num = codigo.replace(/\D/g, '')
    return { codigo, descricao, divisao: num.slice(0, 2) || null, grupo: num.slice(0, 3) || null, secao: null }
  })
  // createMany ignora duplicados; depois garante presença
  await prisma.cnae.createMany({ data: dados, skipDuplicates: true })
  return prisma.cnae.count()
}

// ── 2) Órgãos licenciadores estaduais (27 UFs) — todos ESTADUAL por padrão ────
const ORGAOS: Array<[string, string]> = [
  ['AC', 'IMAC'], ['AL', 'IMA/AL'], ['AP', 'IMAP'], ['AM', 'IPAAM'], ['BA', 'INEMA'],
  ['CE', 'SEMACE'], ['DF', 'IBRAM'], ['ES', 'IEMA'], ['GO', 'SEMAD'], ['MA', 'SEMA/MA'],
  ['MT', 'SEMA/MT'], ['MS', 'IMASUL'], ['MG', 'SEMAD/MG (FEAM)'], ['PA', 'SEMAS'], ['PB', 'SUDEMA'],
  ['PR', 'IAT'], ['PE', 'CPRH'], ['PI', 'SEMARH/PI'], ['RJ', 'INEA'], ['RN', 'IDEMA'],
  ['RS', 'FEPAM'], ['RO', 'SEDAM'], ['RR', 'FEMARH'], ['SC', 'IMA/SC'], ['SP', 'CETESB'],
  ['SE', 'ADEMA'], ['TO', 'NATURATINS'],
]
async function seedOrgaos() {
  for (const [uf, orgao] of ORGAOS) {
    await prisma.orgaoLicenciadorUF.upsert({
      where: { uf },
      update: { orgao, esferaPadrao: 'ESTADUAL' },
      create: { uf, orgao, esferaPadrao: 'ESTADUAL' },
    })
  }
  return prisma.orgaoLicenciadorUF.count()
}

// ── 3) Matriz regulatória dos CNAEs de POSTO (enquadramento) ──────────────────
// Valores fundamentados: combustíveis = potencial ALTO, licenciamento trifásico
// (CONAMA 273/2000), esfera ESTADUAL (municipal só por convênio LC 140/2011).
const MATRIZ: Array<{
  cnaeCodigo: string; classeRisco: string; potencialPoluidor: string; licenciamentoTipo: string
  orgaoCompetente: string; esfera: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL'
  necessitaEIA: boolean; necessitaOutorga: boolean; necessitaMonitoramento: boolean
  nivelRisco: number; impactos: string[]; servicosRecomendados: string[]
}> = [
  { cnaeCodigo: '4731-8/00', classeRisco: 'ALTO', potencialPoluidor: 'ALTO', licenciamentoTipo: 'Trifásico (LP/LI/LO) — CONAMA 273/2000',
    orgaoCompetente: 'Órgão Estadual', esfera: 'ESTADUAL', necessitaEIA: false, necessitaOutorga: false, necessitaMonitoramento: true,
    nivelRisco: 80, impactos: ['Contaminação de solo e água subterrânea', 'Emissões atmosféricas (BTEX)', 'Resíduos perigosos'],
    servicosRecomendados: ['LIC-004', 'LIC-008', 'LIC-011', 'MON-008', 'EST-002'] },
  { cnaeCodigo: '4732-6/00', classeRisco: 'MEDIO', potencialPoluidor: 'MEDIO', licenciamentoTipo: 'Licenciamento Ordinário/Simplificado',
    orgaoCompetente: 'Órgão Estadual', esfera: 'ESTADUAL', necessitaEIA: false, necessitaOutorga: false, necessitaMonitoramento: false,
    nivelRisco: 45, impactos: ['Resíduos oleosos', 'Embalagens contaminadas'], servicosRecomendados: ['LIC-001', 'LOG-001'] },
  { cnaeCodigo: '4681-8/01', classeRisco: 'ALTO', potencialPoluidor: 'ALTO', licenciamentoTipo: 'Trifásico (LP/LI/LO)',
    orgaoCompetente: 'Órgão Estadual', esfera: 'ESTADUAL', necessitaEIA: false, necessitaOutorga: false, necessitaMonitoramento: true,
    nivelRisco: 75, impactos: ['Grande volume armazenado', 'Contaminação de solo/água'], servicosRecomendados: ['LIC-004', 'LIC-008', 'EST-002'] },
  { cnaeCodigo: '4682-6/00', classeRisco: 'ALTO', potencialPoluidor: 'ALTO', licenciamentoTipo: 'Trifásico (LP/LI/LO) — TRR',
    orgaoCompetente: 'Órgão Estadual', esfera: 'ESTADUAL', necessitaEIA: false, necessitaOutorga: false, necessitaMonitoramento: true,
    nivelRisco: 72, impactos: ['Transbordo de combustíveis', 'Risco de derramamento'], servicosRecomendados: ['LIC-004', 'LIC-008'] },
  { cnaeCodigo: '4520-0/01', classeRisco: 'MEDIO', potencialPoluidor: 'MEDIO', licenciamentoTipo: 'Licenciamento Simplificado/Ordinário',
    orgaoCompetente: 'Órgão Municipal ou Estadual', esfera: 'MUNICIPAL', necessitaEIA: false, necessitaOutorga: false, necessitaMonitoramento: true,
    nivelRisco: 40, impactos: ['Resíduos oleosos', 'Efluentes industriais'], servicosRecomendados: ['LIC-001', 'LIC-014'] },
  { cnaeCodigo: '4520-0/05', classeRisco: 'MEDIO', potencialPoluidor: 'ALTO', licenciamentoTipo: 'Licenciamento Ambiental / Outorga de Lançamento',
    orgaoCompetente: 'Órgão Municipal', esfera: 'MUNICIPAL', necessitaEIA: false, necessitaOutorga: true, necessitaMonitoramento: true,
    nivelRisco: 50, impactos: ['Alto consumo de água', 'Efluentes com óleos e graxas'], servicosRecomendados: ['LIC-001', 'OUT-004', 'LIC-014'] },
  { cnaeCodigo: '1921-7/00', classeRisco: 'ALTO', potencialPoluidor: 'ALTO', licenciamentoTipo: 'EIA/RIMA — esfera federal/estadual',
    orgaoCompetente: 'IBAMA / Órgão Estadual', esfera: 'FEDERAL', necessitaEIA: true, necessitaOutorga: true, necessitaMonitoramento: true,
    nivelRisco: 95, impactos: ['Refino de petróleo', 'Alto potencial poluidor'], servicosRecomendados: ['LIC-004', 'MON-008'] },
]
async function seedMatriz() {
  for (const m of MATRIZ) {
    await prisma.regulatoryMatrix.upsert({ where: { cnaeCodigo: m.cnaeCodigo }, update: m, create: m })
  }
  return prisma.regulatoryMatrix.count()
}

async function main() {
  const nCnae = await seedCnae()
  const nOrgaos = await seedOrgaos()
  const nMatriz = await seedMatriz()
  console.log(`✅ Cnae: ${nCnae} | OrgaoLicenciadorUF: ${nOrgaos} | RegulatoryMatrix: ${nMatriz}`)
}

main().catch((e) => { console.error('Falha no seed da fundação:', e); process.exit(1) }).finally(() => prisma.$disconnect())
