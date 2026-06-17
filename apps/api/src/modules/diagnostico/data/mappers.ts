import { regraAplicabilidadeSchema, type RegraAplicabilidade } from '../domain/aplicabilidade.js'
import type {
  PerfilEmpreendimento,
  TanqueSnapshot,
  SinaisEvidencia,
  Porte,
  SituacaoEmpreendimento,
  ClasseAquifero,
  TipoSolo,
  PotencialPoluidor,
  Esfera,
} from '../domain/types.js'
import type { MatrizCnae, ObrigacaoCatalogo } from '../engine/diagnose.js'

// ─────────────────────────────────────────────────────────────────────────────
// CAMADA DATA — MAPPERS (Blueprint 101 — Passo 6)
// Traduzem LINHAS do banco (já com Decimal convertido p/ number pelo builder) →
// tipos PUROS do domínio que entram no motor. São funções puras: testáveis sem
// banco. A query real e a conversão de Decimal vivem no snapshot-builder.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shapes de entrada (subconjunto das linhas Prisma que o motor consome) ─────
export interface TanqueRow {
  materialTanque: string | null // enum MaterialTanque
  dataInstalacao: Date | null
  combustivel: string
  status?: string | null
}

export interface EmpreendimentoRow {
  cnaePrincipal: string | null
  cnaesSecundarios: string[]
  porte: string | null
  situacaoEmpreendimento: string | null
  estado: string
  areaM2: number | null
  possuiCaptacao: boolean | null
  possuiSAO: boolean | null
  classeAquifero: string | null
  profundidadeNivelAguaM: number | null
  tipoSolo: string | null
  distanciaPocoAbastecimentoM: number | null
  distanciaCorpoHidricoM: number | null
  emAPP: boolean | null
  captaParaConsumo: boolean | null
  classificacaoAreaContaminada: string | null
}

export interface MatrizRow {
  cnaeCodigo: string
  classeRisco: string | null
  potencialPoluidor: string | null
  licenciamentoTipo: string | null
  esfera: string | null
  necessitaOutorga: boolean
  necessitaMonitoramento: boolean
  nivelRisco: number | null
}

export interface ObrigacaoRow {
  codigo: string
  modulo: string
  descricao: string
  fundamentoLegal: string | null
  periodicidade: string
  criticidade: string
  aplicabilidade: unknown // Json do banco
  consequenciaSemFazer: string | null
  multaMaxima: string | null
  custoServicoRef: number | null
  ativo?: boolean
}

export interface OrgaoRow {
  uf: string
  orgao: string
}

/** Sinais já apurados pelo builder (estanqueidade/monitoramento vêm de outras tabelas). */
export interface FontesSinais {
  estanqueidadeReprovada?: boolean
  monitoramentoNaoConforme?: boolean
}

// ── Helpers de enum: aceita só valores conhecidos, senão null (não inventa) ───
const set = (xs: string[]) => new Set(xs)
const PORTES = set(['MEI', 'ME', 'EPP', 'MEDIO', 'GRANDE'])
const SITUACOES = set(['PLANEJADO', 'IMPLANTACAO', 'OPERACAO', 'IRREGULAR', 'RENOVACAO'])
const CLASSES_AQ = set(['LIVRE_RASO', 'LIVRE_PROFUNDO', 'CONFINADO', 'DESCONHECIDO'])
const SOLOS = set(['ARENOSO', 'ARGILOSO', 'MISTO', 'ROCHOSO', 'DESCONHECIDO'])
const POTENCIAIS = set(['BAIXO', 'MEDIO', 'ALTO'])
const ESFERAS = set(['MUNICIPAL', 'ESTADUAL', 'FEDERAL'])
const TANQUE_RELEVANTE = set(['ATIVO', 'INTERDITADO']) // INATIVO/REMOVIDO não contam como fonte

const asEnum = <T extends string>(valid: Set<string>, v: string | null): T | null =>
  v && valid.has(v) ? (v as T) : null

// Parede simples = enums que NÃO têm contenção secundária (maior risco de vazamento).
const PAREDE_SIMPLES = set(['ACO_PAREDE_SIMPLES', 'FIBRA_PAREDE_SIMPLES'])

export function materialParedeSimples(material: string | null): boolean {
  // ESTIMADO conservador: sem material conhecido → trata como parede simples (pior caso).
  if (!material) return true
  return PAREDE_SIMPLES.has(material)
}

export function combustivelTemBenzeno(combustivel: string): boolean {
  // Gasolina e etanol/álcool carregam benzeno (cancerígeno); diesel/GNV não.
  return /gasolin|etanol|álcool|alcool/i.test(combustivel)
}

export function idadeEmAnos(dataInstalacao: Date | null, dataRef: Date): number | null {
  if (!dataInstalacao) return null
  const ms = dataRef.getTime() - dataInstalacao.getTime()
  if (ms < 0) return 0
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000))
}

export function mapTanque(t: TanqueRow, dataRef: Date): TanqueSnapshot {
  return {
    paredeSimples: materialParedeSimples(t.materialTanque),
    idadeAnos: idadeEmAnos(t.dataInstalacao, dataRef),
    combustivelComBenzeno: combustivelTemBenzeno(t.combustivel),
  }
}

export function mapPerfil(
  emp: EmpreendimentoRow,
  tanques: TanqueRow[],
  dataRef: Date,
  sinaisFonte: FontesSinais = {},
): PerfilEmpreendimento {
  const relevantes = tanques.filter((t) => !t.status || TANQUE_RELEVANTE.has(t.status))
  const sinais: SinaisEvidencia = {
    areaContaminada: emp.classificacaoAreaContaminada === 'CONTAMINADA',
    estanqueidadeReprovada: !!sinaisFonte.estanqueidadeReprovada,
    monitoramentoNaoConforme: !!sinaisFonte.monitoramentoNaoConforme,
  }
  return {
    cnaePrincipal: emp.cnaePrincipal,
    cnaesSecundarios: emp.cnaesSecundarios ?? [],
    porte: asEnum<Porte>(PORTES, emp.porte),
    situacao: asEnum<SituacaoEmpreendimento>(SITUACOES, emp.situacaoEmpreendimento),
    uf: emp.estado,
    potencialPoluidor: null, // resolvido no enquadramento (estágio 1 do motor)
    areaM2: emp.areaM2,
    possuiCaptacao: emp.possuiCaptacao ?? false,
    possuiSAO: emp.possuiSAO ?? false,
    tanques: relevantes.map((t) => mapTanque(t, dataRef)),
    classeAquifero: asEnum<ClasseAquifero>(CLASSES_AQ, emp.classeAquifero),
    profundidadeNivelAguaM: emp.profundidadeNivelAguaM,
    tipoSolo: asEnum<TipoSolo>(SOLOS, emp.tipoSolo),
    distanciaPocoAbastecimentoM: emp.distanciaPocoAbastecimentoM,
    distanciaCorpoHidricoM: emp.distanciaCorpoHidricoM,
    emAPP: emp.emAPP ?? false,
    captaParaConsumo: emp.captaParaConsumo ?? false,
    sinais,
  }
}

export function mapMatriz(rows: MatrizRow[]): MatrizCnae[] {
  return rows.map((r) => ({
    cnaeCodigo: r.cnaeCodigo,
    classeRisco: r.classeRisco,
    potencialPoluidor: asEnum<PotencialPoluidor>(POTENCIAIS, r.potencialPoluidor),
    licenciamentoTipo: r.licenciamentoTipo,
    esfera: asEnum<Esfera>(ESFERAS, r.esfera),
    necessitaOutorga: r.necessitaOutorga,
    necessitaMonitoramento: r.necessitaMonitoramento,
    nivelRisco: r.nivelRisco,
  }))
}

export function mapCatalogo(rows: ObrigacaoRow[]): ObrigacaoCatalogo[] {
  return rows
    .filter((r) => r.ativo !== false)
    .map((r) => {
      // Aplicabilidade ausente/inválida → { sempre:false }: não aplica obrigação
      // sem regra explícita (evita falso-positivo em outros CNAEs/serviços).
      const parsed = regraAplicabilidadeSchema.safeParse(r.aplicabilidade)
      const aplicabilidade: RegraAplicabilidade = parsed.success ? parsed.data : { sempre: false }
      return {
        codigo: r.codigo,
        modulo: r.modulo,
        descricao: r.descricao,
        fundamentoLegal: r.fundamentoLegal,
        periodicidade: r.periodicidade,
        criticidade: r.criticidade,
        aplicabilidade,
        consequenciaSemFazer: r.consequenciaSemFazer,
        multaMaxima: r.multaMaxima,
        custoServicoRef: r.custoServicoRef,
      }
    })
}

export function mapOrgaos(rows: OrgaoRow[]): Record<string, string> {
  const m: Record<string, string> = {}
  for (const r of rows) m[r.uf] = r.orgao
  return m
}
