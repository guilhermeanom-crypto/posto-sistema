import type { StatusObrigacao } from '../domain/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// CHECKERS DE EVIDÊNCIA (Blueprint 101 — Passo 7, conjunto MÍNIMO)
// Apuram o STATUS de conformidade por obrigação a partir dos módulos existentes.
// PURO: recebe linhas já consultadas; o snapshot-builder faz as queries.
// Obrigação sem checker → fica ausente do mapa → motor assume SEM_DADOS (honesto).
// Ampliar cobertura é incremental (novos checkers aqui, sem tocar o motor).
// ─────────────────────────────────────────────────────────────────────────────

export interface DocVigenciaRow {
  tipo: string
  status: string
  dataVencimento: Date | null
}
export interface TesteEstanqueidadeRow {
  resultado: string // APROVADO | REPROVADO | INCONCLUSIVO
  proximoTeste: Date | null
}

export interface EvidenciasFonte {
  licencas: DocVigenciaRow[]
  alvaras: DocVigenciaRow[]
  /** Teste mais recente por tanque (status ATIVO/INTERDITADO). */
  testesEstanqueidade: TesteEstanqueidadeRow[]
}

const STATUS_GAP = new Set(['VENCIDA', 'SUSPENSA', 'CANCELADA', 'A_RENOVAR', 'EM_RENOVACAO'])
const DIAS_RENOVAR = 60

/** Status de um documento com vigência (licença/alvará). */
function statusVigencia(doc: DocVigenciaRow, dataRef: Date): StatusObrigacao {
  if (STATUS_GAP.has(doc.status)) return 'A_RENOVAR'
  if (doc.dataVencimento) {
    const dias = (doc.dataVencimento.getTime() - dataRef.getTime()) / 86400000
    if (dias < 0 || dias <= DIAS_RENOVAR) return 'A_RENOVAR'
  }
  return 'CONFORME' // VIGENTE e dentro do prazo
}

/** Escolhe o melhor doc de um tipo (o de vencimento mais distante) e seu status. */
function melhorDoc(docs: DocVigenciaRow[], tipos: string[], dataRef: Date): StatusObrigacao | null {
  const candidatos = docs.filter((d) => tipos.includes(d.tipo))
  if (candidatos.length === 0) return null
  const ordenados = [...candidatos].sort(
    (a, b) => (b.dataVencimento?.getTime() ?? 0) - (a.dataVencimento?.getTime() ?? 0),
  )
  return statusVigencia(ordenados[0]!, dataRef)
}

export function apurarEvidencias(fonte: EvidenciasFonte, dataRef: Date): Record<string, StatusObrigacao> {
  const ev: Record<string, StatusObrigacao> = {}

  // ── AMB-001: Licença de Operação (LO/LAO/LAS conforme rito do órgão) ─────────
  const lo = melhorDoc(fonte.licencas, ['LO', 'LAO', 'LAS'], dataRef)
  if (lo) ev['AMB-001'] = lo

  // ── AMB-004 / AMB-005: estanqueidade de tanques e tubulações ─────────────────
  if (fonte.testesEstanqueidade.length > 0) {
    const algumGap = fonte.testesEstanqueidade.some(
      (t) =>
        t.resultado !== 'APROVADO' ||
        (t.proximoTeste != null && t.proximoTeste.getTime() < dataRef.getTime()),
    )
    const status: StatusObrigacao = algumGap ? 'A_RENOVAR' : 'CONFORME'
    ev['AMB-004'] = status
    ev['AMB-005'] = status
  }

  // ── URB-001: AVCB / URB-002: Alvará de Funcionamento ─────────────────────────
  const avcb = melhorDoc(fonte.alvaras, ['AVCB', 'PPCI'], dataRef)
  if (avcb) ev['URB-001'] = avcb
  const alvara = melhorDoc(fonte.alvaras, ['ALVARA_FUNCIONAMENTO'], dataRef)
  if (alvara) ev['URB-002'] = alvara

  return ev
}
