import { Prisma } from '@prisma/client'
import { prisma } from '../../infra/database/prisma.js'

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  return Number(value.toString())
}

export interface FinanceiroResumo {
  mrr: number
  arr: number
  totalContratosAtivos: number
  totalOSsAbertas: number
  totalOSsConcluidasMes: number
  totalEntregaveisPendentes: number
  totalEntregaveisDisponiveis: number
  receitaEstimadaMes: number
  moeda: string
}

export async function calcularFinanceiroResumo(tenantId: string): Promise<FinanceiroResumo> {
  const [contratosRow, osRow, entregaveisRow] = await Promise.all([
    prisma.$queryRaw<
      Array<{ total_ativos: bigint; mrr: Prisma.Decimal | null }>
    >(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'ATIVO')::bigint AS total_ativos,
        COALESCE(SUM(valor_mensal) FILTER (WHERE status = 'ATIVO'), 0) AS mrr
      FROM contratos
      WHERE tenant_id = ${tenantId}
    `),
    prisma.$queryRaw<
      Array<{ total_abertas: bigint; total_concluidas_mes: bigint }>
    >(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('PLANEJADA', 'EM_EXECUCAO', 'AGUARDANDO_REVISAO'))::bigint AS total_abertas,
        COUNT(*) FILTER (WHERE status = 'CONCLUIDA' AND data_conclusao >= date_trunc('month', NOW()))::bigint AS total_concluidas_mes
      FROM ordens_servico
      WHERE tenant_id = ${tenantId}
    `),
    prisma.$queryRaw<
      Array<{ total_pendentes: bigint; total_disponiveis: bigint }>
    >(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('PENDENTE', 'GERANDO'))::bigint AS total_pendentes,
        COUNT(*) FILTER (WHERE status = 'DISPONIVEL')::bigint AS total_disponiveis
      FROM entregaveis
      WHERE tenant_id = ${tenantId}
    `),
  ])

  const c = contratosRow[0]
  const o = osRow[0]
  const e = entregaveisRow[0]
  const mrr = decimalToNumber(c?.mrr ?? 0)

  return {
    mrr,
    arr: mrr * 12,
    totalContratosAtivos: Number(c?.total_ativos ?? 0),
    totalOSsAbertas: Number(o?.total_abertas ?? 0),
    totalOSsConcluidasMes: Number(o?.total_concluidas_mes ?? 0),
    totalEntregaveisPendentes: Number(e?.total_pendentes ?? 0),
    totalEntregaveisDisponiveis: Number(e?.total_disponiveis ?? 0),
    receitaEstimadaMes: mrr,
    moeda: 'BRL',
  }
}
