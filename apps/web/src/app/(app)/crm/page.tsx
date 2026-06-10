import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import {
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  BarChart2,
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  UserX,
  ArrowRight,
  Building2,
  FileCheck2,
  ClipboardList,
} from 'lucide-react'
import { KanbanBoard, type LeadCard } from './kanban'

export const metadata: Metadata = { title: 'CRM — Funil de Leads' }

interface CRMData {
  porEstagio: Record<string, LeadCard[]>
  metricas: {
    total: number
    ativos: number
    ganhos: number
    perdidos: number
    taxaConversao: number
  }
}

function MetricaCard({
  label,
  value,
  sub,
  icon: Icon,
  cls,
}: {
  label: string
  value: string | number
  sub?: string
  icon: typeof TrendingUp
  cls: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

function getAllLeads(porEstagio: Record<string, LeadCard[]>): LeadCard[] {
  return Object.values(porEstagio).flat()
}

function isOverdue(lead: LeadCard) {
  if (!lead.dataProximoContato) return false
  const date = new Date(lead.dataProximoContato)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date < today
}

function isToday(lead: LeadCard) {
  if (!lead.dataProximoContato) return false
  const date = new Date(lead.dataProximoContato)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

function leadScore(lead: LeadCard) {
  let score = 0
  if (isOverdue(lead)) score += 500
  if (isToday(lead)) score += 350
  if (lead.estagio === 'NOVO' && lead._count.followUps === 0) score += 300
  if (!lead.valorEstimado) score += 90
  if (!lead.dataProximoContato && !['GANHO', 'PERDIDO'].includes(lead.estagio)) score += 80
  if (lead.quantidadePostos && lead.quantidadePostos > 1) score += 60
  return score
}

function leadSearchHref(lead: LeadCard) {
  const termo = lead.empresa ?? lead.nome ?? lead.numero
  return `/empreendimentos?busca=${encodeURIComponent(termo)}`
}

function FilaComercial({ leads }: { leads: LeadCard[] }) {
  const overdue = leads.filter(isOverdue)
  const today = leads.filter(isToday)
  const novosSemContato = leads.filter((lead) => lead.estagio === 'NOVO' && lead._count.followUps === 0)
  const semProximaAcao = leads.filter((lead) => !lead.dataProximoContato && !['GANHO', 'PERDIDO'].includes(lead.estagio))
  const prioridade = [...leads]
    .filter((lead) => !['GANHO', 'PERDIDO'].includes(lead.estagio))
    .sort((a, b) => leadScore(b) - leadScore(a))
    .slice(0, 5)

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Front office comercial</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Fila prioritária do dia</h2>
          <p className="mt-1 text-sm text-muted-foreground">Leitura operacional inspirada no CRM oficial: follow-up, primeiro contato e prontidão para operação.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <QueueCard icon={AlertTriangle} label="Atrasados" value={overdue.length} tone={overdue.length > 0 ? 'danger' : 'default'} />
        <QueueCard icon={CalendarClock} label="Para hoje" value={today.length} tone={today.length > 0 ? 'warning' : 'default'} />
        <QueueCard icon={UserX} label="Novos sem contato" value={novosSemContato.length} tone={novosSemContato.length > 0 ? 'warning' : 'default'} />
        <QueueCard icon={ClipboardCheck} label="Sem próxima ação" value={semProximaAcao.length} tone={semProximaAcao.length > 0 ? 'warning' : 'default'} />
      </div>

      {prioridade.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Atendimento recomendado</p>
          <div className="grid gap-2 lg:grid-cols-5">
            {prioridade.map((lead) => (
              <div key={lead.id} className="rounded-lg border bg-muted/25 p-3">
                <p className="truncate text-sm font-semibold">{lead.nome ?? lead.numero}</p>
                <p className="truncate text-xs text-muted-foreground">{lead.empresa ?? 'Sem empresa'}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{lead.estagio.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function HandoffOperacional({ leads }: { leads: LeadCard[] }) {
  const ganhos = leads
    .filter((lead) => lead.estagio === 'GANHO')
    .sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime())
    .slice(0, 4)

  if (ganhos.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">CRM conectado à operação</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">Nenhum lead ganho aguardando handoff</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando uma oportunidade virar cliente, ela aparece aqui com atalhos para criar o posto, contrato e OS.
            </p>
          </div>
          <Link href="/empreendimentos" className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
            Ver Meus Postos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">CRM conectado à operação</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Leads ganhos para ativar no sistema</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta é a ponte correta: comercial fecha, operação cria posto, contrato, OS e agenda de entregas.
          </p>
        </div>
        <Link href="/onboarding" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Abrir onboarding
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {ganhos.map((lead) => (
          <div key={lead.id} className="rounded-xl border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{lead.empresa ?? lead.nome ?? lead.numero}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lead.quantidadePostos ?? 1} posto{lead.quantidadePostos === 1 ? '' : 's'} · {lead.valorEstimado ? Number(lead.valorEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : 'valor não informado'}
                </p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                Ganho
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link href={leadSearchHref(lead)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors hover:border-primary/30 hover:text-primary">
                <Building2 className="h-3.5 w-3.5" />
                Meus Postos
              </Link>
              <Link href="/empreendimentos/novo" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors hover:border-primary/30 hover:text-primary">
                <Building2 className="h-3.5 w-3.5" />
                Criar posto
              </Link>
              <Link href="/contratos" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors hover:border-primary/30 hover:text-primary">
                <FileCheck2 className="h-3.5 w-3.5" />
                Contrato
              </Link>
              <Link href="/ordens-servico" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors hover:border-primary/30 hover:text-primary">
                <ClipboardList className="h-3.5 w-3.5" />
                OS
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function QueueCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof AlertTriangle
  label: string
  value: number
  tone?: 'default' | 'warning' | 'danger'
}) {
  const toneClass = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-orange-100 text-orange-700',
    danger: 'bg-red-100 text-red-700',
  }[tone]

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function CRMPage() {
  const token = await getAccessToken()

  let data: CRMData = {
    porEstagio: {},
    metricas: { total: 0, ativos: 0, ganhos: 0, perdidos: 0, taxaConversao: 0 },
  }

  if (token) {
    try {
      const res = await api.get<{ data: CRMData }>('/crm/leads', token)
      data = res.data
    } catch { /* exibe vazio */ }
  }

  const { metricas, porEstagio } = data
  const leads = getAllLeads(porEstagio)
  const valorPipeline = leads.reduce((acc, lead) => acc + (Number(lead.valorEstimado) || 0), 0)
  const prontosOperacao = leads.filter((lead) => lead.estagio === 'GANHO').length

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            CRM — Funil de Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie leads, follow-ups, qualificação comercial e handoff para a operação.
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricaCard
          label="Total de Leads"
          value={metricas.total}
          icon={Users}
          cls="bg-blue-100 text-blue-700"
        />
        <MetricaCard
          label="Em Negociação"
          value={metricas.ativos}
          sub="Excluindo ganhos/perdidos"
          icon={BarChart2}
          cls="bg-yellow-100 text-yellow-700"
        />
        <MetricaCard
          label="Ganhos"
          value={metricas.ganhos}
          icon={CheckCircle2}
          cls="bg-green-100 text-green-700"
        />
        <MetricaCard
          label="Conversão"
          value={`${metricas.taxaConversao}%`}
          sub={`${metricas.perdidos} perdidos`}
          icon={XCircle}
          cls="bg-orange-100 text-orange-700"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricaCard
          label="Pipeline estimado"
          value={valorPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          sub="Soma dos valores estimados"
          icon={TrendingUp}
          cls="bg-primary/10 text-primary"
        />
        <MetricaCard
          label="Prontos para operação"
          value={prontosOperacao}
          sub="Leads ganhos aguardando handoff"
          icon={ClipboardCheck}
          cls="bg-green-100 text-green-700"
        />
      </div>

      <FilaComercial leads={leads} />

      <HandoffOperacional leads={leads} />

      {/* Kanban */}
      <KanbanBoard porEstagio={porEstagio} />
    </div>
  )
}
