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

export type ClasseAquifero = 'LIVRE_RASO' | 'LIVRE_PROFUNDO' | 'CONFINADO' | 'DESCONHECIDO'
export type TipoSolo = 'ARENOSO' | 'ARGILOSO' | 'MISTO' | 'ROCHOSO' | 'DESCONHECIDO'

/** Retrato de um tanque para fins de aplicabilidade (parede + idade = fator #1 de vazamento). */
export interface TanqueSnapshot {
  paredeSimples: boolean
  idadeAnos: number | null
  /** Gasolina/etanol contêm benzeno (cancerígeno). undefined => assume true (ESTIMADO conservador). */
  combustivelComBenzeno?: boolean
}

/** Sinais de evidência medida (o medido domina o estimado). Vêm da camada data/. */
export interface SinaisEvidencia {
  areaContaminada?: boolean
  estanqueidadeReprovada?: boolean
  monitoramentoNaoConforme?: boolean
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

  // ── Eixo ecológico (opcionais; ausente => default conservador "ESTIMADO") ────
  /** Vulnerabilidade do meio (DRASTIC simplificado). */
  classeAquifero?: ClasseAquifero | null
  profundidadeNivelAguaM?: number | null
  tipoSolo?: TipoSolo | null
  /** Receptores próximos (alvo do dano). */
  distanciaPocoAbastecimentoM?: number | null
  distanciaCorpoHidricoM?: number | null
  emAPP?: boolean
  captaParaConsumo?: boolean
  /** Evidência medida (domina o estimado). */
  sinais?: SinaisEvidencia
}

export type StatusObrigacao = 'CONFORME' | 'A_RENOVAR' | 'SEM_DADOS' | 'NAO_APLICAVEL'
export type Esfera = 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL'
export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
