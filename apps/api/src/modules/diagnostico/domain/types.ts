// ─────────────────────────────────────────────────────────────────────────────
// DOMÍNIO DO DIAGNÓSTICO (Blueprint 101 — Passo 2) — tipos PUROS (zero Prisma).
// O perfil é o retrato do empreendimento que ENTRA no motor. O mapeamento
// Prisma → perfil acontece na camada data/ (Passo 6), mantendo este domínio
// determinístico e testável sem banco.
// ─────────────────────────────────────────────────────────────────────────────

export type Porte = 'MEI' | 'ME' | 'EPP' | 'MEDIO' | 'GRANDE'
export type SituacaoEmpreendimento =
  | 'PLANEJADO'
  | 'IMPLANTACAO'
  | 'OPERACAO'
  | 'IRREGULAR'
  | 'RENOVACAO'
export type PotencialPoluidor = 'BAIXO' | 'MEDIO' | 'ALTO'

/** Retrato de um tanque para fins de aplicabilidade (parede + idade = fator #1 de vazamento). */
export interface TanqueSnapshot {
  paredeSimples: boolean
  idadeAnos: number | null
}

/**
 * Perfil do empreendimento — entrada do motor. Genérico por design: serve posto
 * e qualquer outro serviço (o que discrimina é o CNAE + condições físicas, não
 * um "tipo de posto" fixo).
 */
export interface PerfilEmpreendimento {
  cnaePrincipal: string | null
  cnaesSecundarios: string[]
  porte: Porte | null
  situacao: SituacaoEmpreendimento | null
  uf: string
  /** Potencial poluidor resolvido no enquadramento (estágio 1 do motor). */
  potencialPoluidor: PotencialPoluidor | null
  areaM2: number | null
  possuiCaptacao: boolean
  possuiSAO: boolean
  tanques: TanqueSnapshot[]
}
