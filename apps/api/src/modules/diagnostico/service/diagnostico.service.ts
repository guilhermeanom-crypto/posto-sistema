import { Prisma, type Diagnostico } from '@prisma/client'
import { prisma } from '../../../infra/database/prisma.js'
import { diagnose } from '../engine/diagnose.js'
import { buildDiagnoseInput } from '../data/snapshot-builder.js'
import type { NivelRisco } from '../domain/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE DE DIAGNÓSTICO (Blueprint 101 — Passo 7)
// Orquestra: snapshot (data/) → motor (engine/) → persistência versionada.
// IDEMPOTENTE: se o snapshotHash não mudou desde o último diagnóstico, NÃO cria
// versão nova (a menos de force). É a ÚNICA porta que grava a fonte única.
// ─────────────────────────────────────────────────────────────────────────────

const asJson = (x: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(x ?? null))

const ORDEM_NIVEL: Record<NivelRisco, number> = { BAIXO: 0, MEDIO: 1, ALTO: 2, CRITICO: 3 }
/** Headline para triagem: o pior dos dois eixos (NÃO é soma — só escolhe o mais grave). */
function piorNivel(a: NivelRisco, b: NivelRisco): NivelRisco {
  return ORDEM_NIVEL[a] >= ORDEM_NIVEL[b] ? a : b
}

export interface RecalcularOpts {
  dataRef?: Date
  /** Força nova versão mesmo se o snapshot não mudou. */
  force?: boolean
}

/**
 * Dispara o recálculo de forma NÃO-BLOQUEANTE (fire-and-forget). Não atrasa nem
 * derruba o request que o originou: o diagnóstico é idempotente e recomputável,
 * então uma falha aqui apenas loga — a próxima edição re-dispara. Use após criar/
 * editar empreendimento, tanque, licença, etc. (a fonte única se mantém fresca).
 * Quando o motor for extraído para pacote compartilhado, isto migra para o worker.
 */
export function agendarRecalculoDiagnostico(empreendimentoId: string): void {
  setImmediate(() => {
    recalcularDiagnostico(empreendimentoId).catch((err) => {
      console.error(`[diagnostico] recálculo falhou p/ ${empreendimentoId}:`, (err as Error).message)
    })
  })
}

/**
 * Recalcula e persiste o diagnóstico de um empreendimento. Retorna o Diagnostico
 * (novo ou o último existente, se idempotente). Versão monotônica por empreendimento.
 */
export async function recalcularDiagnostico(
  empreendimentoId: string,
  opts: RecalcularOpts = {},
): Promise<Diagnostico> {
  const dataRef = opts.dataRef ?? new Date()
  const snap = await buildDiagnoseInput(empreendimentoId, dataRef)

  const ultimo = await prisma.diagnostico.findFirst({
    where: { empreendimentoId },
    orderBy: { versao: 'desc' },
  })

  // Idempotência: nada relevante mudou → devolve o último (sem nova versão).
  if (ultimo && ultimo.snapshotHash === snap.snapshotHash && !opts.force) {
    return ultimo
  }

  const resultado = diagnose(snap.input)
  const versao = (ultimo?.versao ?? 0) + 1
  const riscoNivel = piorNivel(resultado.riscoNivel, resultado.riscoIntrinseco.nivel)

  // Custo/periodicidade vêm do catálogo (o resultado puro não os carrega).
  const meta = new Map(snap.input.catalogo.map((o) => [o.codigo, o]))

  return prisma.diagnostico.create({
    data: {
      tenantId: snap.tenantId,
      empreendimentoId: snap.empreendimentoId,
      versao,
      snapshotHash: snap.snapshotHash,
      engineVersion: snap.engineVersion,
      rulesVersion: snap.rulesVersion,
      riscoConformidadeScore: resultado.riscoConformidadeScore,
      riscoIntrinsecoScore: resultado.riscoIntrinseco.score,
      riscoNivel,
      conformidadeScore: resultado.conformidadeScore,
      enquadramento: asJson(resultado.enquadramento),
      fatoresRisco: asJson({
        conformidade: resultado.fatoresRisco,
        intrinseco: { score: resultado.riscoIntrinseco.score, beta: resultado.riscoIntrinseco.beta, fatores: resultado.riscoIntrinseco.fatores },
      }),
      orcamento: asJson(resultado.orcamentoEstimado),
      inputSnapshot: asJson(snap.input.perfil),
      obrigacoes: {
        create: resultado.obrigacoesAplicaveis.map((o) => {
          const m = meta.get(o.codigo)
          return {
            codigo: o.codigo,
            aplicavel: true,
            motivoAplicabilidade: o.motivoAplicabilidade,
            status: o.status,
            consequencia: o.consequenciaSemFazer,
            multaMaxima: o.multaMaxima,
            custoServico: m?.custoServicoRef ?? null,
            periodicidadeDerivada: m?.periodicidade ?? null,
          }
        }),
      },
    },
  })
}
