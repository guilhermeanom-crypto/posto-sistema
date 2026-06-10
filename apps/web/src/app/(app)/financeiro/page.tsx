import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeDollarSign, TrendingUp } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { FinanceiroResumo } from '@repo/types'

export const metadata: Metadata = { title: 'Financeiro' }

interface FinanceiroResponse {
  data: FinanceiroResumo
}

function formatMoeda(value: number, moeda = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(value)
}

export default async function FinanceiroPage() {
  const token = await getAccessToken()

  let resumo: FinanceiroResumo = {
    mrr: 0,
    arr: 0,
    totalContratosAtivos: 0,
    totalOSsAbertas: 0,
    totalOSsConcluidasMes: 0,
    totalEntregaveisPendentes: 0,
    totalEntregaveisDisponiveis: 0,
    receitaEstimadaMes: 0,
    moeda: 'BRL',
  }
  let erro: string | null = null

  if (token) {
    try {
      const resp = await api.get<FinanceiroResponse>('/comercial/financeiro/resumo', token)
      resumo = resp.data
    } catch {
      erro = 'Não foi possível carregar o resumo financeiro no momento.'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Resultado operacional
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão consolidada de receita recorrente, operação e produção de entregáveis.
          </p>
        </div>
      </div>

      {erro ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{erro}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="MRR" value={formatMoeda(resumo.mrr, resumo.moeda)} />
        <Kpi label="ARR" value={formatMoeda(resumo.arr, resumo.moeda)} />
        <Kpi label="Receita estimada/mês" value={formatMoeda(resumo.receitaEstimadaMes, resumo.moeda)} />
        <Kpi label="Contratos ativos" value={resumo.totalContratosAtivos} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Operação</p>
              <p className="text-xs text-muted-foreground">
                Status das ordens de serviço e entregáveis do tenant.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MiniKpi label="OSs abertas" value={resumo.totalOSsAbertas} href="/ordens-servico" />
            <MiniKpi label="OSs concluídas (mês)" value={resumo.totalOSsConcluidasMes} href="/ordens-servico" />
            <MiniKpi label="Entregáveis pendentes" value={resumo.totalEntregaveisPendentes} href="/entregaveis" />
            <MiniKpi label="Entregáveis disponíveis" value={resumo.totalEntregaveisDisponiveis} href="/entregaveis" />
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <p className="text-sm font-semibold">Receita recorrente</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {resumo.totalContratosAtivos > 0
              ? `${resumo.totalContratosAtivos} contrato${resumo.totalContratosAtivos !== 1 ? 's' : ''} ativo${resumo.totalContratosAtivos !== 1 ? 's' : ''} gerando ${formatMoeda(resumo.mrr, resumo.moeda)}/mês de receita recorrente.`
              : 'Nenhum contrato ativo. Contratos geram receita recorrente mensal (MRR).'}
          </p>
          <div className="mt-5 space-y-3">
            {resumo.mrr > 0 ? (
              <>
                <Bar label="MRR" value={resumo.mrr} total={resumo.arr} />
                <Bar label="ARR projetado" value={resumo.arr} total={resumo.arr} />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ative contratos em{' '}
                <Link href="/contratos" className="text-primary underline">
                  /contratos
                </Link>{' '}
                para ver a receita aqui.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <BadgeDollarSign className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Próxima evolução</p>
            <p className="text-sm text-muted-foreground">
              Detalhamento de receita/custo por contrato, faturamento individual e integração com NF-e.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-right">
      <p className="text-xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  )
}

function MiniKpi({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border bg-muted/25 p-3 transition-colors hover:bg-muted/50">
      <p className="text-lg font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </Link>
  )
}

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
