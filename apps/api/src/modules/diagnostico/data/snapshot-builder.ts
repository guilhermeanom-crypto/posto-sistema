import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../infra/database/prisma.js'
import { ENGINE_VERSION, type DiagnoseInput } from '../engine/diagnose.js'
import { PESOS_RISCO_INTRINSECO } from '../engine/risco-intrinseco.js'
import {
  mapPerfil,
  mapMatriz,
  mapCatalogo,
  mapOrgaos,
  type EmpreendimentoRow,
  type TanqueRow,
  type MatrizRow,
  type ObrigacaoRow,
  type FontesSinais,
} from './mappers.js'
import { apurarEvidencias } from './evidencias.js'

// ─────────────────────────────────────────────────────────────────────────────
// SNAPSHOT-BUILDER (Blueprint 101 — Passo 6)
// Lê o estado real do banco e monta o DiagnoseInput PURO. Converte Decimal→number,
// apura sinais de evidência (estanqueidade/monitoramento) e calcula um hash estável
// do input — usado pelo service (Passo 7) para versionar e evitar recálculo redundante.
// As evidências de conformidade (status por obrigação) entram no Passo 7.
// ─────────────────────────────────────────────────────────────────────────────

/** Versão das REGRAS (distinta da do ENGINE): muda quando pesos/aplicabilidade mudam. */
export const RULES_VERSION = `risco@${PESOS_RISCO_INTRINSECO.versao}`

export interface SnapshotResult {
  tenantId: string
  empreendimentoId: string
  input: DiagnoseInput
  snapshotHash: string
  rulesVersion: string
  engineVersion: string
}

const dec = (v: Prisma.Decimal | null | undefined): number | null => (v == null ? null : Number(v))

/** Hash estável do que determina o resultado (perfil + evidências + versões). Detecta "precisa recalcular". */
function hashSnapshot(input: DiagnoseInput, rulesVersion: string): string {
  const evidenciasOrdenadas = Object.fromEntries(
    Object.entries(input.evidencias).sort(([a], [b]) => a.localeCompare(b)),
  )
  const canonical = JSON.stringify({
    perfil: input.perfil,
    evidencias: evidenciasOrdenadas,
    engine: ENGINE_VERSION,
    rules: rulesVersion,
  })
  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Monta o DiagnoseInput de um empreendimento real. dataRef permite reprodutibilidade
 * (idade dos tanques é calculada nela). Lança se o empreendimento não existir.
 */
export async function buildDiagnoseInput(
  empreendimentoId: string,
  dataRef: Date = new Date(),
): Promise<SnapshotResult> {
  const emp = await prisma.empreendimento.findUnique({
    where: { id: empreendimentoId },
    include: {
      tanques: { include: { testes: { orderBy: { dataExecucao: 'desc' }, take: 1 } } },
      campanhasMonitoramento: { orderBy: { dataColeta: 'desc' }, take: 1 },
      licencasAmbientais: true,
      alvarasUrbanisticos: true,
    },
  })
  if (!emp) throw new Error(`Empreendimento ${empreendimentoId} não encontrado`)

  // ── Sinais de evidência (o medido domina o estimado) ────────────────────────
  const estanqueidadeReprovada = emp.tanques.some((t) => t.testes[0]?.resultado === 'REPROVADO')
  const monitoramentoNaoConforme = emp.campanhasMonitoramento[0]?.resultado === 'NAO_CONFORME'
  const sinaisFonte: FontesSinais = { estanqueidadeReprovada, monitoramentoNaoConforme }

  // ── Evidências de conformidade por obrigação (checkers mínimos) ─────────────
  const evidencias = apurarEvidencias(
    {
      licencas: emp.licencasAmbientais.map((l) => ({ tipo: l.tipo, status: l.status, dataVencimento: l.dataVencimento })),
      alvaras: emp.alvarasUrbanisticos.map((a) => ({ tipo: a.tipo, status: a.status, dataVencimento: a.dataVencimento })),
      testesEstanqueidade: emp.tanques.flatMap((t) => t.testes.map((te) => ({ resultado: te.resultado, proximoTeste: te.proximoTeste }))),
    },
    dataRef,
  )

  // ── Linhas → tipos do domínio (Decimal já convertido) ───────────────────────
  const empRow: EmpreendimentoRow = {
    cnaePrincipal: emp.cnaePrincipal,
    cnaesSecundarios: emp.cnaesSecundarios,
    porte: emp.porte,
    situacaoEmpreendimento: emp.situacaoEmpreendimento,
    estado: emp.estado,
    areaM2: dec(emp.areaM2),
    possuiCaptacao: emp.possuiCaptacao,
    possuiSAO: emp.possuiSAO,
    classeAquifero: emp.classeAquifero,
    profundidadeNivelAguaM: dec(emp.profundidadeNivelAguaM),
    tipoSolo: emp.tipoSolo,
    distanciaPocoAbastecimentoM: emp.distanciaPocoAbastecimentoM,
    distanciaCorpoHidricoM: emp.distanciaCorpoHidricoM,
    emAPP: emp.emAPP,
    captaParaConsumo: emp.captaParaConsumo,
    classificacaoAreaContaminada: emp.classificacaoAreaContaminada,
  }
  const tanqueRows: TanqueRow[] = emp.tanques.map((t) => ({
    materialTanque: t.materialTanque,
    dataInstalacao: t.dataInstalacao,
    combustivel: t.combustivel,
    status: t.status,
  }))

  const [matrizRaw, catalogoRaw, orgaosRaw] = await Promise.all([
    prisma.regulatoryMatrix.findMany(),
    prisma.obrigacaoRegulatoriaBase.findMany({ where: { ativo: true } }),
    prisma.orgaoLicenciadorUF.findMany(),
  ])

  const matrizRows: MatrizRow[] = matrizRaw.map((r) => ({
    cnaeCodigo: r.cnaeCodigo,
    classeRisco: r.classeRisco,
    potencialPoluidor: r.potencialPoluidor,
    licenciamentoTipo: r.licenciamentoTipo,
    esfera: r.esfera,
    necessitaOutorga: r.necessitaOutorga,
    necessitaMonitoramento: r.necessitaMonitoramento,
    nivelRisco: r.nivelRisco,
  }))
  const obrigacaoRows: ObrigacaoRow[] = catalogoRaw.map((r) => ({
    codigo: r.codigo,
    modulo: r.modulo,
    descricao: r.descricao,
    fundamentoLegal: r.fundamentoLegal,
    periodicidade: r.periodicidade,
    criticidade: r.criticidade,
    aplicabilidade: r.aplicabilidade,
    consequenciaSemFazer: r.consequenciaSemFazer,
    multaMaxima: r.multaMaxima,
    custoServicoRef: dec(r.custoServicoRef),
    ativo: r.ativo,
  }))

  const input: DiagnoseInput = {
    perfil: mapPerfil(empRow, tanqueRows, dataRef, sinaisFonte),
    catalogo: mapCatalogo(obrigacaoRows),
    matriz: mapMatriz(matrizRows),
    orgaos: mapOrgaos(orgaosRaw.map((o) => ({ uf: o.uf, orgao: o.orgao }))),
    evidencias,
    dataRef,
  }

  return {
    tenantId: emp.tenantId,
    empreendimentoId: emp.id,
    input,
    snapshotHash: hashSnapshot(input, RULES_VERSION),
    rulesVersion: RULES_VERSION,
    engineVersion: ENGINE_VERSION,
  }
}
