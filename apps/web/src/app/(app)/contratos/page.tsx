import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarClock, FileCheck2 } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { StatusContrato, ContratoResumo, ContratoKpis, ApiPagination } from '@repo/types'

export const metadata: Metadata = { title: 'Contratos' }

interface ContratosListResponse {
  data: ContratoResumo[]
  pagination: ApiPagination
}

interface ContratoKpisResponse {
  data: ContratoKpis
}

const STATUS_LABEL: Record<StatusContrato, string> = {
  RASCUNHO: 'Rascunho',
  ATIVO: 'Ativo',
  SUSPENSO: 'Suspenso',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado',
}

const STATUS_BADGE_CLASS: Record<StatusContrato, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-700',
  ATIVO: 'bg-emerald-100 text-emerald-800',
  SUSPENSO: 'bg-amber-100 text-amber-800',
  ENCERRADO: 'bg-slate-200 text-slate-600',
  CANCELADO: 'bg-red-100 text-red-800',
}

function formatMoeda(value: number, moeda = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function clienteLabel(c: ContratoResumo) {
  if (c.empreendimentoNome) return c.empreendimentoNome
  if (c.empresaLead) return c.empresaLead
  if (c.nomeLead) return c.nomeLead
  return 'Cliente não informado'
}

function localidadeLabel(c: ContratoResumo) {
  if (c.empreendimentoCidade && c.empreendimentoEstado) {
    return `${c.empreendimentoCidade}/${c.empreendimentoEstado}`
  }
  return '—'
}

export default async function ContratosPage() {
  const token = await getAccessToken()

  let contratos: ContratoResumo[] = []
  let kpis = { totalAtivos: 0, totalCadastrados: 0, mrr: 0, moeda: 'BRL' }
  let erro: string | null = null

  if (token) {
    try {
      const [lista, kpisResponse] = await Promise.all([
        api.get<ContratosListResponse>('/comercial/contratos?limit=50', token),
        api.get<ContratoKpisResponse>('/comercial/contratos/kpis', token),
      ])
      contratos = lista.data
      kpis = kpisResponse.data
    } catch {
      erro = 'Não foi possível carregar os contratos no momento.'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Gestão comercial
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contratos emitidos a partir de propostas aprovadas com handoff concluído.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Kpi label="Ativos" value={kpis.totalAtivos} />
          <Kpi label="MRR" value={formatMoeda(kpis.mrr, kpis.moeda)} />
          <Kpi label="Cadastrados" value={kpis.totalCadastrados} />
        </div>
      </div>

      {erro ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {erro}
        </div>
      ) : null}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          <span>Número</span>
          <span>Cliente / posto</span>
          <span>Status</span>
          <span>Vigência</span>
          <span className="text-right">Valor mensal</span>
        </div>
        <div className="divide-y">
          {contratos.map((contrato) => (
            <Link
              key={contrato.id}
              href={
                contrato.empreendimentoId
                  ? `/empreendimentos/${contrato.empreendimentoId}`
                  : `/operacao/handoffs/${contrato.handoffComercialId}`
              }
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-4 text-sm transition-colors hover:bg-muted/20"
            >
              <span className="self-center font-mono text-xs font-semibold text-slate-700">
                {contrato.numero}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{clienteLabel(contrato)}</p>
                <p className="text-xs text-muted-foreground">{localidadeLabel(contrato)}</p>
              </div>
              <span
                className={`self-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  STATUS_BADGE_CLASS[contrato.status]
                }`}
              >
                {STATUS_LABEL[contrato.status]}
              </span>
              <span className="self-center text-xs text-muted-foreground">
                {formatDate(contrato.dataInicioVigencia)}
                {contrato.dataFimVigencia ? ` → ${formatDate(contrato.dataFimVigencia)}` : ' → sem prazo'}
              </span>
              <span className="self-center text-right font-semibold">
                {formatMoeda(contrato.valorMensal, contrato.moeda)}/mês
              </span>
            </Link>
          ))}
          {contratos.length === 0 && !erro ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhum contrato cadastrado. Contratos são emitidos a partir de handoffs aprovados em{' '}
              <Link href="/operacao/handoffs" className="text-primary underline">
                /operacao/handoffs
              </Link>
              .
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <FileCheck2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Próxima evolução</p>
            <p className="text-sm text-muted-foreground">
              Geração automática de Ordens de Serviço a partir dos contratos ativos.
            </p>
          </div>
          <CalendarClock className="ml-auto h-5 w-5 text-muted-foreground" />
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
