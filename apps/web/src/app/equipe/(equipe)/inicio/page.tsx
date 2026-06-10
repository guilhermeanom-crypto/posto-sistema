import type { Metadata } from 'next'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ImagePlus,
  ListChecks,
  MapPin,
  type LucideIcon,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Painel da Equipe' }

type OsRow = {
  numero: string
  cliente: string
  uf: string
  tipo: string
  hora: string
  status: 'planejada' | 'em-deslocamento' | 'em-vistoria' | 'em-revisao'
}

const OS_HOJE: OsRow[] = [
  { numero: 'OS-2026-0184', cliente: 'Posto BR-153 km 312', uf: 'GO', tipo: 'Vistoria técnica', hora: '09:00', status: 'em-deslocamento' },
  { numero: 'OS-2026-0185', cliente: 'Base Centro-Oeste',   uf: 'GO', tipo: 'Renovação LO',    hora: '11:30', status: 'planejada' },
  { numero: 'OS-2026-0179', cliente: 'Fazenda Cerrado',     uf: 'MT', tipo: 'CAR retificação', hora: '14:00', status: 'planejada' },
]

const STATUS_LABEL: Record<OsRow['status'], string> = {
  'planejada': 'Planejada',
  'em-deslocamento': 'Em deslocamento',
  'em-vistoria': 'Em vistoria',
  'em-revisao': 'Em revisão',
}
const STATUS_TONE: Record<OsRow['status'], string> = {
  'planejada': 'bg-sky-50 text-sky-700 border-sky-200',
  'em-deslocamento': 'bg-amber-50 text-amber-700 border-amber-200',
  'em-vistoria': 'bg-orange-50 text-orange-700 border-orange-200',
  'em-revisao': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const KPIS: Array<{ label: string; value: string; sub: string; tone: 'orange' | 'red' | 'sky' | 'emerald'; href: string; icon: LucideIcon }> = [
  { label: 'OS atribuídas',  value: '8',  sub: '3 em execução · 5 planejadas', tone: 'sky',     href: '/equipe/os',         icon: ClipboardList },
  { label: 'Vistorias hoje', value: '2',  sub: 'GO-1 · BR-153',                  tone: 'orange',  href: '/equipe/os',         icon: ClipboardCheck },
  { label: 'Pendências',     value: '14', sub: '4 críticas · 6 altas',         tone: 'red',     href: '/equipe/pendencias', icon: ListChecks },
  { label: 'Evidências',     value: '23', sub: 'a validar pelo analista',         tone: 'emerald', href: '/equipe/evidencias', icon: ImagePlus },
]

const TONE: Record<'orange' | 'red' | 'sky' | 'emerald', { bar: string; val: string; bg: string; ic: string }> = {
  orange:  { bar: 'from-orange-300 to-orange-500',     val: 'text-orange-600',  bg: 'bg-orange-50',  ic: 'text-orange-600' },
  red:     { bar: 'from-red-300 to-red-500',           val: 'text-red-600',     bg: 'bg-red-50',     ic: 'text-red-600' },
  sky:     { bar: 'from-sky-300 to-sky-500',           val: 'text-sky-700',     bg: 'bg-sky-50',     ic: 'text-sky-600' },
  emerald: { bar: 'from-emerald-300 to-emerald-500',   val: 'text-emerald-700', bg: 'bg-emerald-50', ic: 'text-emerald-600' },
}

const ATIVIDADES = [
  { hora: '08:42', titulo: 'Iniciou OS-2026-0184', desc: 'Check-in registrado · BR-153 km 312' },
  { hora: '07:55', titulo: 'Validou 6 evidências',    desc: 'OS-2026-0167 · Patrimônio ferroviário' },
  { hora: '07:12', titulo: 'Encerramento aprovado',   desc: 'OS-2026-0162 · Unidade industrial DF' },
]

export default function EquipeInicioPage() {
  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Operação de campo · 15/05/2026
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Bom dia, Diego. A operação do dia está aqui.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            OS atribuídas, vistorias em andamento e pendências críticas em uma única leitura.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/equipe/checklists"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(234,88,12,0.18)]"
          >
            <ClipboardCheck className="h-3.5 w-3.5" /> Iniciar vistoria
          </Link>
          <Link
            href="/equipe/os"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary"
          >
            Ver minhas OS <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Banner crítico */}
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-red-700">
            3 pendências críticas em ativos distintos para resolver hoje
          </p>
          <p className="text-xs text-red-500/80 mt-0.5">
            Verifique a lista de pendências antes de iniciar o roteiro.
          </p>
        </div>
        <Link
          href="/equipe/pendencias"
          className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-700"
        >
          Abrir <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map(({ label, value, sub, tone, href, icon: Icon }) => {
          const c = TONE[tone]
          return (
            <Link
              key={label}
              href={href}
              className="group relative rounded-xl border bg-card p-5 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${c.bar}`} />
              <div className={`h-9 w-9 rounded-lg ${c.bg} ${c.ic} flex items-center justify-center mb-4`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className={`text-3xl font-black tracking-tight tabular-nums ${c.val}`}>{value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/80">{sub}</p>
            </Link>
          )
        })}
      </div>

      {/* OS de hoje + Atividades */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <article className="rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">OS de hoje</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                {OS_HOJE.length}
              </span>
            </div>
            <Link href="/equipe/os" className="text-xs font-semibold text-primary hover:text-primary/80">
              Ver tudo
            </Link>
          </header>

          <ul className="divide-y">
            {OS_HOJE.map((os) => (
              <li key={os.numero} className="flex items-center gap-3 px-5 py-3.5">
                <div className="grid h-10 w-12 place-items-center rounded-md border border-border bg-white text-[10px] font-bold tabular-nums text-muted-foreground">
                  {os.uf}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tracking-tight text-foreground">{os.cliente}</p>
                    <span className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                      {os.numero}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {os.tipo} · {os.hora}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[os.status]}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {STATUS_LABEL[os.status]}
                </span>
                <Link
                  href="/equipe/checklists"
                  className="hidden rounded-md border border-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:border-primary/40 hover:text-primary md:inline-flex"
                >
                  Abrir
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <aside className="rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">Atividades recentes</h2>
            </div>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Últimas 24h
            </span>
          </header>
          <ul className="divide-y">
            {ATIVIDADES.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-orange-50 text-orange-600">
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-tight text-foreground">{a.titulo}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{a.desc}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
                  {a.hora}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Roteiro do dia */}
      <article className="rounded-xl border bg-card">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Roteiro do dia</h2>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            Total estimado de deslocamento: 312 km · ~5h
          </span>
        </header>
        <ol className="divide-y">
          {OS_HOJE.map((os, i) => (
            <li key={os.numero} className="flex items-center gap-3 px-5 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight text-foreground">{os.cliente}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {os.tipo} · {os.uf}
                </p>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-foreground">
                {os.hora}
              </span>
            </li>
          ))}
        </ol>
      </article>
    </div>
  )
}
