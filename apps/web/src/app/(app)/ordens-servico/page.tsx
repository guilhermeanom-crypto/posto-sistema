import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardCheck, FileText, ShieldCheck } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/date'
import type {
  StatusOrdemServico,
  PrioridadeOrdemServico,
  TipoOrdemServico,
  OrdemServicoResumo,
  OrdemServicoKpis,
  ApiPagination,
} from '@repo/types'

export const metadata: Metadata = { title: 'Ordens de Serviço' }

type StatusOS = StatusOrdemServico
type PrioridadeOS = PrioridadeOrdemServico
type TipoOS = TipoOrdemServico

interface OSListResponse {
  data: OrdemServicoResumo[]
  pagination: ApiPagination
}

interface OSKpisResponse {
  data: OrdemServicoKpis
}

const STATUS_LABEL: Record<StatusOS, string> = {
  PLANEJADA: 'Planejada',
  EM_EXECUCAO: 'Em execução',
  AGUARDANDO_REVISAO: 'Aguardando revisão',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

const STATUS_BADGE: Record<StatusOS, string> = {
  PLANEJADA: 'bg-sky-100 text-sky-800 border-sky-200',
  EM_EXECUCAO: 'bg-amber-100 text-amber-800 border-amber-200',
  AGUARDANDO_REVISAO: 'bg-violet-100 text-violet-800 border-violet-200',
  CONCLUIDA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELADA: 'bg-red-100 text-red-800 border-red-200',
}

const PRIORIDADE_LABEL: Record<PrioridadeOS, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
}

const PRIORIDADE_BADGE: Record<PrioridadeOS, string> = {
  BAIXA: 'bg-slate-100 text-slate-700',
  MEDIA: 'bg-sky-100 text-sky-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
}

const TIPO_LABEL: Record<TipoOS, string> = {
  VISTORIA_TECNICA: 'Vistoria técnica',
  COLETA_AMOSTRA: 'Coleta de amostra',
  RENOVACAO_LICENCA: 'Renovação de licença',
  DILIGENCIA: 'Diligência',
  PROTOCOLO: 'Protocolo',
  RELATORIO: 'Relatório',
  OUTRO: 'Outro',
}

export default async function OrdensServicoPage() {
  const token = await getAccessToken()

  let ordens: OrdemServicoResumo[] = []
  let kpis = { totalAbertas: 0, totalEmExecucao: 0, totalCriticas: 0, totalConcluidasMes: 0 }
  let erro: string | null = null

  if (token) {
    try {
      const [lista, kpisResp] = await Promise.all([
        api.get<OSListResponse>('/operacao/ordens-servico?limit=50', token),
        api.get<OSKpisResponse>('/operacao/ordens-servico/kpis', token),
      ])
      ordens = lista.data
      kpis = kpisResp.data
    } catch {
      erro = 'Não foi possível carregar as OSs no momento.'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Execução interna
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            OSs emitidas a partir de contratos ativos, executadas pela equipe de operação.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Kpi label="Abertas" value={kpis.totalAbertas} />
          <Kpi label="Em execução" value={kpis.totalEmExecucao} />
          <Kpi label="Críticas" value={kpis.totalCriticas} />
          <Kpi label="Concluídas (mês)" value={kpis.totalConcluidasMes} />
        </div>
      </div>

      {erro ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{erro}</div>
      ) : null}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          <span>Número</span>
          <span>Título / Cliente</span>
          <span>Tipo</span>
          <span>Responsável</span>
          <span>Status</span>
          <span>Prazo</span>
        </div>
        <div className="divide-y">
          {ordens.map((os) => (
            <Link
              key={os.id}
              href={`/empreendimentos/${os.empreendimentoId}`}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-4 text-sm transition-colors hover:bg-muted/20"
            >
              <span className="self-center font-mono text-xs font-semibold text-slate-700">{os.numero}</span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{os.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {os.empreendimentoNome || 'Sem empreendimento'}
                  {os.empreendimentoCidade && os.empreendimentoEstado
                    ? ` · ${os.empreendimentoCidade}/${os.empreendimentoEstado}`
                    : ''}
                </p>
              </div>
              <span className="self-center text-xs text-muted-foreground">{TIPO_LABEL[os.tipo]}</span>
              <span className="self-center text-xs text-muted-foreground">
                {os.responsavelNome ?? 'Sem responsável'}
              </span>
              <div className="self-center flex flex-col items-start gap-1">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[os.status]}`}
                >
                  {STATUS_LABEL[os.status]}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORIDADE_BADGE[os.prioridade]}`}
                >
                  {PRIORIDADE_LABEL[os.prioridade]}
                </span>
              </div>
              <span className="self-center text-xs text-muted-foreground">{formatDate(os.dataPlanejada)}</span>
            </Link>
          ))}
          {ordens.length === 0 && !erro ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhuma OS emitida. OSs são geradas a partir de{' '}
              <Link href="/contratos" className="text-primary underline">
                contratos ativos
              </Link>
              .
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Hint icon={ClipboardCheck} title="OS real" text="Entidade própria com contrato, escopo, prioridade, responsável e status governado." />
        <Hint icon={ShieldCheck} title="Origem técnica" text="Cada OS nasce de um contrato ATIVO e herda o empreendimento de execução." />
        <Hint icon={FileText} title="Fechamento" text="Próxima evolução: anexar entregáveis e gerar PDF da OS quando concluída." />
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

function Hint({ icon: Icon, title, text }: { icon: typeof ClipboardCheck; title: string; text: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
