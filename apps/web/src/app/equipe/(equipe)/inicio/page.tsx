import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  ImagePlus,
  ListChecks,
  MapPin,
  type LucideIcon,
} from 'lucide-react'
import { getAccessToken, getSessao } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/date'
import type { OrdemServicoResumo, StatusOrdemServico } from '@repo/types'

export const metadata = { title: 'Painel da Equipe' }

interface Pendencia {
  id: string
  descricao: string
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
  status: string
  ordemServico?: { numero: string } | null
}
interface Evidencia {
  id: string
  setor: string
  nota: string
  capturadoEm: string
  ordemServico?: { numero: string } | null
}

const STATUS_LABEL: Record<StatusOrdemServico, string> = {
  PLANEJADA: 'Planejada',
  EM_EXECUCAO: 'Em execução',
  AGUARDANDO_REVISAO: 'Aguardando revisão',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}
const STATUS_TONE: Record<StatusOrdemServico, string> = {
  PLANEJADA: 'bg-sky-50 text-sky-700 border-sky-200',
  EM_EXECUCAO: 'bg-amber-50 text-amber-700 border-amber-200',
  AGUARDANDO_REVISAO: 'bg-violet-50 text-violet-700 border-violet-200',
  CONCLUIDA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADA: 'bg-red-50 text-red-700 border-red-200',
}
const TONE: Record<'orange' | 'red' | 'sky' | 'emerald', { bar: string; val: string; bg: string; ic: string }> = {
  orange: { bar: 'from-orange-300 to-orange-500', val: 'text-orange-600', bg: 'bg-orange-50', ic: 'text-orange-600' },
  red: { bar: 'from-red-300 to-red-500', val: 'text-red-600', bg: 'bg-red-50', ic: 'text-red-600' },
  sky: { bar: 'from-sky-300 to-sky-500', val: 'text-sky-700', bg: 'bg-sky-50', ic: 'text-sky-600' },
  emerald: { bar: 'from-emerald-300 to-emerald-500', val: 'text-emerald-700', bg: 'bg-emerald-50', ic: 'text-emerald-600' },
}

function isHoje(iso: string): boolean {
  const d = new Date(iso)
  const hoje = new Date()
  return d.toDateString() === hoje.toDateString()
}

export default async function EquipeInicioPage() {
  const token = await getAccessToken()
  const sessao = await getSessao()
  const primeiroNome = sessao?.nome?.split(' ')[0] ?? 'equipe'

  let ordens: OrdemServicoResumo[] = []
  let pendencias: Pendencia[] = []
  let evidencias: Evidencia[] = []

  if (token) {
    const [resOS, resPend, resEvid] = await Promise.allSettled([
      api.get<{ data: OrdemServicoResumo[] }>('/operacao/ordens-servico?apenasMinhas=true&apenasAbertas=true&limit=50', token),
      api.get<{ data: Pendencia[] }>('/pendencias?limit=100', token),
      api.get<{ data: Evidencia[] }>('/evidencias?statusValidacao=PENDENTE&limit=100', token),
    ])
    if (resOS.status === 'fulfilled') ordens = resOS.value.data
    if (resPend.status === 'fulfilled') pendencias = resPend.value.data
    if (resEvid.status === 'fulfilled') evidencias = resEvid.value.data
  }

  const emExecucao = ordens.filter((o) => o.status === 'EM_EXECUCAO').length
  const planejadas = ordens.filter((o) => o.status === 'PLANEJADA').length
  const vistoriasHoje = ordens.filter((o) => isHoje(o.dataPlanejada)).length
  const pendenciasAbertas = pendencias.filter((p) => p.status !== 'RESOLVIDA' && p.status !== 'CANCELADA')
  const criticas = pendenciasAbertas.filter((p) => p.prioridade === 'CRITICA').length

  const KPIS: Array<{ label: string; value: number; sub: string; tone: keyof typeof TONE; href: string; icon: LucideIcon }> = [
    { label: 'OS atribuídas', value: ordens.length, sub: `${emExecucao} em execução · ${planejadas} planejadas`, tone: 'sky', href: '/equipe/os', icon: ClipboardList },
    { label: 'Vistorias hoje', value: vistoriasHoje, sub: 'planejadas para hoje', tone: 'orange', href: '/equipe/os', icon: ClipboardCheck },
    { label: 'Pendências', value: pendenciasAbertas.length, sub: `${criticas} crítica${criticas === 1 ? '' : 's'}`, tone: 'red', href: '/equipe/pendencias', icon: ListChecks },
    { label: 'Evidências', value: evidencias.length, sub: 'a validar pelo analista', tone: 'emerald', href: '/equipe/evidencias', icon: ImagePlus },
  ]

  const recentes = evidencias.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Operação de campo · {formatDate(new Date().toISOString())}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Olá, {primeiroNome}. A operação do dia está aqui.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            OS atribuídas, pendências e evidências a validar em uma única leitura.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/equipe/evidencias" className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(234,88,12,0.18)]">
            <ImagePlus className="h-3.5 w-3.5" /> Registrar evidência
          </Link>
          <Link href="/equipe/os" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary">
            Ver minhas OS <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {criticas > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-700">
              {criticas} pendência{criticas === 1 ? '' : 's'} crítica{criticas === 1 ? '' : 's'} para resolver
            </p>
            <p className="text-xs text-red-500/80 mt-0.5">Verifique a lista de pendências antes de iniciar o roteiro.</p>
          </div>
          <Link href="/equipe/pendencias" className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-700">
            Abrir <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map(({ label, value, sub, tone, href, icon: Icon }) => {
          const c = TONE[tone]
          return (
            <Link key={label} href={href} className="group relative rounded-xl border bg-card p-5 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${c.bar}`} />
              <div className={`h-9 w-9 rounded-lg ${c.bg} ${c.ic} flex items-center justify-center mb-4`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className={`text-3xl font-black tracking-tight tabular-nums ${c.val}`}>{value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">{sub}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <article className="rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">Minhas OS abertas</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">{ordens.length}</span>
            </div>
            <Link href="/equipe/os" className="text-xs font-semibold text-primary hover:text-primary/80">Ver tudo</Link>
          </header>
          <ul className="divide-y">
            {ordens.map((os) => (
              <li key={os.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="grid h-10 w-12 place-items-center rounded-md border border-border bg-white text-[10px] font-bold tabular-nums text-muted-foreground">
                  {os.empreendimentoEstado ?? '—'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tracking-tight text-foreground truncate">{os.empreendimentoNome ?? os.titulo}</p>
                    <span className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{os.numero}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(os.dataPlanejada)}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[os.status]}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {STATUS_LABEL[os.status]}
                </span>
              </li>
            ))}
            {ordens.length === 0 ? (
              <li className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhuma OS atribuída a você no momento.</li>
            ) : null}
          </ul>
        </article>

        <aside className="rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">Evidências a validar</h2>
            </div>
            <Link href="/equipe/evidencias" className="text-[10px] uppercase tracking-[0.14em] text-primary hover:text-primary/80">Ver</Link>
          </header>
          <ul className="divide-y">
            {recentes.map((e) => (
              <li key={e.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-amber-50 text-amber-600 text-[9px] font-bold">{e.setor.slice(0, 3)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-tight text-foreground">{e.ordemServico?.numero ?? '—'} · {e.setor}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{e.nota}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground tabular-nums">{formatDate(e.capturadoEm)}</span>
              </li>
            ))}
            {recentes.length === 0 ? (
              <li className="px-5 py-10 text-center text-xs text-muted-foreground">Nenhuma evidência pendente.</li>
            ) : null}
          </ul>
        </aside>
      </div>

      <article className="rounded-xl border bg-card">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Roteiro do dia</h2>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">{vistoriasHoje} parada{vistoriasHoje === 1 ? '' : 's'} hoje</span>
        </header>
        <ol className="divide-y">
          {ordens.filter((o) => isHoje(o.dataPlanejada)).map((os, i) => (
            <li key={os.id} className="flex items-center gap-3 px-5 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight text-foreground truncate">{os.empreendimentoNome ?? os.titulo}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{os.empreendimentoCidade ?? ''} {os.empreendimentoEstado ? `· ${os.empreendimentoEstado}` : ''}</p>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{os.numero}</span>
            </li>
          ))}
          {vistoriasHoje === 0 ? (
            <li className="px-5 py-8 text-center text-xs text-muted-foreground">Nenhuma parada planejada para hoje.</li>
          ) : null}
        </ol>
      </article>
    </div>
  )
}
