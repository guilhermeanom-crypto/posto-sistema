import { evaluateAplicabilidade, type RegraAplicabilidade } from '../domain/aplicabilidade.js'
import type {
  PerfilEmpreendimento,
  PotencialPoluidor,
  Esfera,
  NivelRisco,
  StatusObrigacao,
} from '../domain/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE DIAGNÓSTICO — PURO (Blueprint 101 — Passo 4)
// diagnose(input) → resultado. Zero Prisma, zero I/O, zero new Date() interno
// (a data entra como input). Determinístico e idempotente → testável sem banco.
// A camada data/ (Passo 6) monta o input; a persistência é no service (Passo 7).
// ─────────────────────────────────────────────────────────────────────────────

export const ENGINE_VERSION = '1.0.0'

// ── Entradas (catálogo + matriz vêm do banco, montadas pela camada data/) ─────
export interface MatrizCnae {
  cnaeCodigo: string
  classeRisco: string | null
  potencialPoluidor: PotencialPoluidor | null
  licenciamentoTipo: string | null
  esfera: Esfera | null
  necessitaOutorga: boolean
  necessitaMonitoramento: boolean
  nivelRisco: number | null
}

export interface ObrigacaoCatalogo {
  codigo: string
  modulo: string
  descricao: string
  fundamentoLegal: string | null
  periodicidade: string
  criticidade: string // CRITICA | ALTA | MEDIA
  aplicabilidade: RegraAplicabilidade
  consequenciaSemFazer: string | null
  multaMaxima: string | null
  custoServicoRef: number | null
}

export interface DiagnoseInput {
  perfil: PerfilEmpreendimento
  catalogo: ObrigacaoCatalogo[]
  matriz: MatrizCnae[]
  /** uf -> órgão licenciador (LC 140/2011). */
  orgaos: Record<string, string>
  /** codigo da obrigação -> status apurado pela evidência (data/ checkers). Default: SEM_DADOS. */
  evidencias: Record<string, StatusObrigacao>
  dataRef: Date
}

// ── Saídas ────────────────────────────────────────────────────────────────────
export interface Enquadramento {
  cnae: string | null
  classeRisco: string | null
  potencialPoluidor: PotencialPoluidor | null
  esfera: Esfera | null
  orgaoCompetente: string | null
  licenciamentoTipo: string | null
}

export interface ObrigacaoDiagnosticada {
  codigo: string
  modulo: string
  descricao: string
  fundamentoLegal: string | null
  criticidade: string
  motivoAplicabilidade: string
  status: StatusObrigacao
  consequenciaSemFazer: string | null
  multaMaxima: string | null
}

export interface FatorRisco {
  descricao: string
  pontos: number
  baseNormativa: string | null
}

export interface DiagnosticoResultado {
  engineVersion: string
  enquadramento: Enquadramento
  obrigacoesAplicaveis: ObrigacaoDiagnosticada[]
  conformidadeScore: number // 0-100, maior = melhor
  riscoConformidadeScore: number // 0-100, maior = pior
  riscoNivel: NivelRisco
  fatoresRisco: FatorRisco[]
  orcamentoEstimado: { minimo: number; recomendado: number }
}

const soDigitos = (c: string) => c.replace(/\D/g, '')

/** Matching CNAE: exato → maior prefixo → grupo de 4 dígitos (subclasse). */
export function findMatrizByCnae(matriz: MatrizCnae[], cnae: string | null): MatrizCnae | null {
  if (!cnae) return null
  const n = soDigitos(cnae)
  const exato = matriz.find((r) => soDigitos(r.cnaeCodigo) === n)
  if (exato) return exato
  // maior prefixo da matriz que casa com o cnae do perfil
  const porPrefixo = matriz
    .filter((r) => n.startsWith(soDigitos(r.cnaeCodigo)))
    .sort((a, b) => soDigitos(b.cnaeCodigo).length - soDigitos(a.cnaeCodigo).length)[0]
  if (porPrefixo) return porPrefixo
  // grupo de 4 dígitos (ex.: 4731)
  const grupo = n.slice(0, 4)
  return matriz.find((r) => soDigitos(r.cnaeCodigo).startsWith(grupo)) ?? null
}

const PESO_CRITICIDADE: Record<string, number> = { CRITICA: 25, ALTA: 15, MEDIA: 8 }

export function diagnose(input: DiagnoseInput): DiagnosticoResultado {
  const { perfil, catalogo, matriz, orgaos, evidencias } = input

  // ── Estágio 1: ENQUADRAMENTO (CNAE → classe → órgão → rito) ─────────────────
  const m = findMatrizByCnae(matriz, perfil.cnaePrincipal)
  const potencial = m?.potencialPoluidor ?? perfil.potencialPoluidor ?? null
  // o perfil usado na aplicabilidade herda o potencial resolvido no enquadramento
  const perfilEnq: PerfilEmpreendimento = { ...perfil, potencialPoluidor: potencial }
  const enquadramento: Enquadramento = {
    cnae: perfil.cnaePrincipal,
    classeRisco: m?.classeRisco ?? null,
    potencialPoluidor: potencial,
    esfera: m?.esfera ?? null,
    orgaoCompetente: orgaos[perfil.uf] ?? null,
    licenciamentoTipo: m?.licenciamentoTipo ?? null,
  }

  // ── Estágio 2: OBRIGAÇÕES APLICÁVEIS (condicional) ──────────────────────────
  const obrigacoesAplicaveis: ObrigacaoDiagnosticada[] = []
  for (const o of catalogo) {
    const ap = evaluateAplicabilidade(o.aplicabilidade, perfilEnq)
    if (!ap.aplicavel) continue
    obrigacoesAplicaveis.push({
      codigo: o.codigo,
      modulo: o.modulo,
      descricao: o.descricao,
      fundamentoLegal: o.fundamentoLegal,
      criticidade: o.criticidade,
      motivoAplicabilidade: ap.motivo,
      status: evidencias[o.codigo] ?? 'SEM_DADOS',
      consequenciaSemFazer: o.consequenciaSemFazer,
      multaMaxima: o.multaMaxima,
    })
  }

  // ── Estágio 3: CONFORMIDADE (maior = melhor) ────────────────────────────────
  const total = obrigacoesAplicaveis.length
  const conformes = obrigacoesAplicaveis.filter((o) => o.status === 'CONFORME').length
  const conformidadeScore = total === 0 ? 100 : Math.round((conformes / total) * 100)

  // ── Estágio 4: RISCO DE CONFORMIDADE (maior = pior) — fatores nomeados ───────
  const fatoresRisco: FatorRisco[] = []
  let risco = 0
  for (const o of obrigacoesAplicaveis) {
    if (o.status === 'SEM_DADOS' || o.status === 'A_RENOVAR') {
      const pontos = PESO_CRITICIDADE[o.criticidade] ?? 8
      risco += pontos
      fatoresRisco.push({
        descricao: `${o.descricao} — ${o.status === 'A_RENOVAR' ? 'a renovar' : 'sem evidência'}`,
        pontos,
        baseNormativa: o.fundamentoLegal,
      })
    }
  }
  const riscoConformidadeScore = Math.min(100, risco)
  const riscoNivel: NivelRisco =
    riscoConformidadeScore >= 85
      ? 'CRITICO'
      : riscoConformidadeScore >= 60
        ? 'ALTO'
        : riscoConformidadeScore >= 30
          ? 'MEDIO'
          : 'BAIXO'

  // ── Estágio 5: ORÇAMENTO ESTIMADO (serviços p/ fechar gaps) ─────────────────
  const custoPorCodigo = new Map(catalogo.map((o) => [o.codigo, o.custoServicoRef ?? 0]))
  const gaps = obrigacoesAplicaveis.filter((o) => o.status === 'SEM_DADOS' || o.status === 'A_RENOVAR')
  const recomendado = gaps.reduce((acc, o) => acc + (custoPorCodigo.get(o.codigo) ?? 0), 0)
  const minimo = gaps
    .filter((o) => o.criticidade === 'CRITICA')
    .reduce((acc, o) => acc + (custoPorCodigo.get(o.codigo) ?? 0), 0)

  return {
    engineVersion: ENGINE_VERSION,
    enquadramento,
    obrigacoesAplicaveis,
    conformidadeScore,
    riscoConformidadeScore,
    riscoNivel,
    fatoresRisco,
    orcamentoEstimado: { minimo, recomendado },
  }
}
