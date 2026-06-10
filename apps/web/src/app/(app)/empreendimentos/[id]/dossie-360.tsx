import Link from 'next/link'
import type { ComponentType } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileText,
  ShieldCheck,
  Timer,
  TrendingUp,
} from 'lucide-react'

interface Dossie360Props {
  empreendimentoId: string
  data: {
    documentos: any[]
    condicionantes: any[]
    tarefas: any[]
    alertas: any[]
    licencas: any[]
    processos?: any[]
  }
}

type Acao = {
  id: string
  titulo: string
  origem: string
  href: string
  dias: number | null
  nivel: 'critico' | 'atencao' | 'ok'
}

function diasRestantes(iso: string | null | undefined): number | null {
  if (!iso) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(iso)
  alvo.setHours(0, 0, 0, 0)
  return Math.floor((alvo.getTime() - hoje.getTime()) / 86400000)
}

function nivelPorDias(dias: number | null): Acao['nivel'] {
  if (dias === null) return 'ok'
  if (dias < 0 || dias <= 7) return 'critico'
  if (dias <= 30) return 'atencao'
  return 'ok'
}

function prazoLabel(dias: number | null) {
  if (dias === null) return 'Sem prazo'
  if (dias < 0) return `Vencido há ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence hoje'
  return `${dias}d`
}

function nivelClass(nivel: Acao['nivel']) {
  if (nivel === 'critico') return 'border-red-200 bg-red-50 text-red-700'
  if (nivel === 'atencao') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export function Dossie360({ empreendimentoId, data }: Dossie360Props) {
  const processos = data.processos ?? []
  const condicionantesAbertas = data.condicionantes.filter((c) => !['CUMPRIDA', 'DISPENSADA'].includes(c.status))
  const tarefasAbertas = data.tarefas.filter((t) => !['CONCLUIDA', 'CANCELADA'].includes(t.status))
  const documentosValidos = data.documentos.filter((d) => d.status === 'APROVADO').length
  const documentosPendentes = data.documentos.filter((d) => ['PENDENTE', 'EM_ANALISE', 'A_RENOVAR', 'VENCIDO'].includes(d.status)).length
  const processosAtivos = processos.filter((p) => !['DEFERIDO', 'INDEFERIDO', 'CANCELADO', 'ARQUIVADO'].includes(p.status)).length
  const alertasCriticos = data.alertas.filter((a) => !a.lido && a.nivel === 'CRITICO').length
  const recorrentes = condicionantesAbertas.filter((c) => c.periodicidade && c.periodicidade !== 'UNICA').length

  const acoes: Acao[] = [
    ...data.alertas
      .filter((a) => !a.lido)
      .map((a) => ({
        id: `alerta-${a.id}`,
        titulo: a.titulo ?? a.mensagem ?? 'Alerta pendente',
        origem: 'Alerta',
        href: a.referenciaHref ?? `/alertas?empreendimentoId=${empreendimentoId}`,
        dias: 0,
        nivel: a.nivel === 'CRITICO' ? 'critico' as const : 'atencao' as const,
      })),
    ...condicionantesAbertas.map((c) => {
      const dias = diasRestantes(c.proximoVencimento)
      return {
        id: `cond-${c.id}`,
        titulo: c.descricao,
        origem: 'Condicionante',
        href: `/condicionantes/${c.id}`,
        dias,
        nivel: nivelPorDias(dias),
      }
    }),
    ...tarefasAbertas.map((t) => {
      const dias = diasRestantes(t.dataVencimento)
      return {
        id: `tarefa-${t.id}`,
        titulo: t.titulo,
        origem: 'Tarefa',
        href: `/tarefas/${t.id}`,
        dias,
        nivel: t.prioridade === 'CRITICA' ? 'critico' as const : nivelPorDias(dias),
      }
    }),
    ...data.documentos
      .filter((d) => ['A_RENOVAR', 'VENCIDO', 'PENDENTE', 'EM_ANALISE'].includes(d.status))
      .map((d) => {
        const dias = diasRestantes(d.dataValidade)
        return {
          id: `doc-${d.id}`,
          titulo: d.tipoDocumento?.nome ?? d.nome ?? 'Documento',
          origem: 'Documento',
          href: `/documentos/${d.id}`,
          dias,
          nivel: d.status === 'VENCIDO' ? 'critico' as const : nivelPorDias(dias),
        }
      }),
  ]
    .sort((a, b) => {
      const peso = { critico: 0, atencao: 1, ok: 2 }
      if (peso[a.nivel] !== peso[b.nivel]) return peso[a.nivel] - peso[b.nivel]
      return (a.dias ?? 9999) - (b.dias ?? 9999)
    })
    .slice(0, 6)

  return (
    <section className="animate-panel-in rounded-xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Dossiê 360</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">Mapa operacional do posto</h2>
          </div>
          <Link
            href={`/relatorios?empreendimentoId=${empreendimentoId}`}
            className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >
            Gerar relatório
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-0 divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
        <DossieMetric
          icon={ShieldCheck}
          label="Obrigações abertas"
          value={condicionantesAbertas.length + tarefasAbertas.length}
          detail={`${recorrentes} recorrentes`}
          tone={alertasCriticos > 0 ? 'danger' : 'default'}
        />
        <DossieMetric
          icon={FileText}
          label="Provas documentais"
          value={documentosValidos}
          detail={`${documentosPendentes} pendentes`}
          tone={documentosPendentes > 0 ? 'warning' : 'default'}
        />
        <DossieMetric
          icon={ClipboardList}
          label="Fluxo regulatório"
          value={processosAtivos}
          detail={`${processos.length} processos`}
          tone={processosAtivos > 0 ? 'warning' : 'default'}
        />
        <DossieMetric
          icon={AlertTriangle}
          label="Alertas críticos"
          value={alertasCriticos}
          detail={alertasCriticos > 0 ? 'ação imediata' : 'sem críticos'}
          tone={alertasCriticos > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="border-t px-5 py-4">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Jornada do cliente</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Atalhos para conectar este posto com a origem comercial, proposta, contrato, execução e financeiro.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          <JourneyLink href="/crm" icon={TrendingUp} label="CRM" detail="origem comercial" />
          <JourneyLink href={`/motor-orcamento?empreendimentoId=${empreendimentoId}`} icon={BadgeDollarSign} label="Orçamento" detail="proposta" />
          <JourneyLink href="/contratos" icon={BriefcaseBusiness} label="Contratos" detail="formalização" />
          <JourneyLink href="/ordens-servico" icon={ClipboardList} label="OS" detail="execução" />
          <JourneyLink href="/financeiro" icon={Building2} label="Financeiro" detail="cobrança" />
        </div>
      </div>

      <div className="border-t px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Próximas ações recomendadas</p>
          <Link href={`/tarefas?empreendimentoId=${empreendimentoId}`} className="text-xs font-medium text-primary hover:underline">
            Ver operação
          </Link>
        </div>
        {acoes.length === 0 ? (
          <div className="rounded-lg border bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Nenhuma ação urgente encontrada para este posto.
          </div>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {acoes.map((acao) => (
              <Link
                key={acao.id}
                href={acao.href}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/25"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${nivelClass(acao.nivel)}`}>
                      {acao.origem}
                    </span>
                    <span className="text-xs text-muted-foreground">{prazoLabel(acao.dias)}</span>
                  </div>
                  <p className="truncate text-sm font-medium">{acao.titulo}</p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function JourneyLink({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
  detail: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-background px-3 py-3 transition-colors hover:border-primary/30 hover:bg-muted/25"
    >
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
    </Link>
  )
}

function DossieMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default',
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
  detail: string
  tone?: 'default' | 'warning' | 'danger'
}) {
  const iconClass = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  }[tone]

  return (
    <div className="p-5">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Timer className="h-3.5 w-3.5" />
        {detail}
      </p>
    </div>
  )
}
