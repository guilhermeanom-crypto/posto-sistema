import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  FileText,
  FolderTree,
  Home,
  MapPin,
  Radar,
  Scale,
  Search,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { HabilisWordmark } from './habilis-wordmark'
import { cn } from '@/lib/cn'

interface SystemMockupProps {
  /** Modo compacto (sem sidebar) — usar em CTAs ou breakpoints estreitos. */
  compact?: boolean
  className?: string
}

/**
 * Mockup do sistema Hábilis (cockpit regulatório).
 * 100% React/Tailwind — sempre nítido, em sync com o tom de produto real.
 */
export function SystemMockup({ compact = false, className }: SystemMockupProps) {
  const NAV_OPS = [
    { label: 'Dashboard', icon: Home, active: true },
    { label: 'Empreendimentos', icon: Briefcase },
    { label: 'Licenças', icon: ShieldCheck },
    { label: 'Condicionantes', icon: CalendarClock },
    { label: 'Documentos', icon: FileText },
    { label: 'Território', icon: MapPin },
    { label: 'Campo', icon: ClipboardCheck },
  ]

  return (
    <div
      className={cn(
        'product-surface product-surface-grid overflow-hidden ring-1 ring-black/[0.03]',
        className,
      )}
    >
      {/* App chrome */}
      <div className="panel-chrome">
        <div className="flex gap-1.5">
          <span className="panel-dot bg-red-400" />
          <span className="panel-dot bg-amber-400" />
          <span className="panel-dot bg-emerald-400" />
        </div>
        <div className="ml-3 flex flex-1 items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 py-1 text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
          <span className="font-mono">sistema.habilis.com.br / dashboard</span>
        </div>
        <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground">
          ⌘K
        </span>
      </div>

      <div className={cn('flex', compact ? '' : 'min-h-[460px]')}>
        {/* Sidebar */}
        {!compact ? (
          <aside className="hidden w-48 flex-none border-r border-border/70 bg-white/60 p-3 sm:block">
            <div className="px-1 pb-3">
              <HabilisWordmark compact />
            </div>
            <p className="px-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
              Operação
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {NAV_OPS.map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.label}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px]',
                      item.active
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {item.label}
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 px-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
              Inteligência
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {[
                { label: 'Alertas', icon: AlertTriangle },
                { label: 'Calendário', icon: CalendarClock },
                { label: 'Auditoria', icon: Scale },
                { label: 'Portal cliente', icon: FolderTree },
              ].map((it) => {
                const Icon = it.icon
                return (
                  <li
                    key={it.label}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] text-muted-foreground"
                  >
                    <Icon className="h-3 w-3" />
                    {it.label}
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
                Score Operação
              </p>
              <p className="mt-0.5 text-base font-black tabular-nums text-foreground">94,2%</p>
              <div className="meter-track mt-1">
                <div className="meter-fill" style={{ width: '94%' }} />
              </div>
            </div>
          </aside>
        ) : null}

        {/* Main */}
        <main className="flex-1 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Cockpit Multiempreendimento
              </p>
              <p className="text-sm font-bold tracking-tight text-foreground">
                Olá, Guilherme · 12 ativos sob gestão
              </p>
            </div>
            <div className="hidden items-center gap-1 rounded-md border border-border/80 bg-white px-2 py-1 text-[9px] text-muted-foreground sm:flex">
              <Search className="h-2.5 w-2.5" />
              Buscar empreendimento, licença, doc.
            </div>
          </div>

          {/* Critical banner */}
          <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50/80 px-2.5 py-1.5">
            <span className="grid h-5 w-5 flex-none place-items-center rounded-md bg-red-100">
              <TriangleAlert className="h-2.5 w-2.5 text-red-600" />
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-bold text-red-700">
                3 vencimentos críticos em ativos distintos nos próximos 30 dias
              </p>
              <p className="text-[9px] text-red-500/80">Ação imediata requerida</p>
            </div>
            <button className="ml-auto inline-flex items-center gap-0.5 rounded-md bg-red-600 px-1.5 py-1 text-[9px] font-bold text-white">
              Abrir <ArrowRight className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* KPI cards */}
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { Icon: Activity, val: '94,2%', label: 'Conformidade', tone: 'emerald' },
              { Icon: CalendarClock, val: '12', label: 'Vencendo 30d', tone: 'orange' },
              { Icon: AlertTriangle, val: '3', label: 'Críticos', tone: 'red' },
              { Icon: Radar, val: '127', label: 'Licenças ativas', tone: 'sky' },
            ].map(({ Icon, val, label, tone }) => {
              const toneMap: Record<string, { bar: string; valColor: string; iconBg: string; iconColor: string }> = {
                emerald: { bar: 'from-emerald-400 to-emerald-600', valColor: 'text-emerald-700', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                orange:  { bar: 'from-orange-300 to-orange-500', valColor: 'text-orange-600', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
                red:     { bar: 'from-red-300 to-red-500', valColor: 'text-red-600', iconBg: 'bg-red-50', iconColor: 'text-red-500' },
                sky:     { bar: 'from-sky-300 to-sky-500', valColor: 'text-sky-600', iconBg: 'bg-sky-50', iconColor: 'text-sky-500' },
              }
              const c = toneMap[tone]!
              return (
                <div
                  key={label}
                  className="relative overflow-hidden rounded-md border border-border/80 bg-white p-2.5"
                >
                  <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', c.bar)} />
                  <div className={cn('mb-1 grid h-5 w-5 place-items-center rounded', c.iconBg)}>
                    <Icon className={cn('h-2.5 w-2.5', c.iconColor)} />
                  </div>
                  <p className={cn('text-lg font-black leading-none tracking-tight tabular-nums', c.valColor)}>
                    {val}
                  </p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {label}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Grid: Vencimentos + Ranking */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.6fr_1fr]">
            <div className="overflow-hidden rounded-md border border-border/80 bg-white">
              <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
                <p className="text-[10px] font-bold text-foreground">Próximos vencimentos</p>
                <div className="flex gap-1">
                  {['30d', '60d', '90d'].map((d, i) => (
                    <span
                      key={d}
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[8px] font-bold',
                        i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <ul className="divide-y divide-border/60">
                {[
                  { badge: 'Hoje', tone: 'critico', mod: 'LIC', desc: 'Renovação de licença operacional', posto: 'Base logística — GO' },
                  { badge: '3d', tone: 'vencendo', mod: 'CAR', desc: 'Entrega complementar de cadastro territorial', posto: 'Ativo rural — MT' },
                  { badge: '12d', tone: 'atencao', mod: 'IPH', desc: 'Protocolo de peça patrimonial junto ao IPHAN', posto: 'Corredor ferroviário — BA' },
                  { badge: '21d', tone: 'atencao', mod: 'OUT', desc: 'Renovação de outorga hídrica', posto: 'Unidade industrial — DF' },
                ].map((row) => (
                  <li key={row.desc} className="flex items-center gap-2 px-3 py-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`status-pill status-${row.tone}`}>
                          <span className="dot" />
                          {row.badge}
                        </span>
                        <span className="mono-tag">{row.mod}</span>
                      </div>
                      <p className="mt-1 truncate text-[10px] font-semibold text-foreground">{row.desc}</p>
                      <p className="truncate text-[9px] text-muted-foreground">{row.posto}</p>
                    </div>
                    <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-md border border-border/80 bg-white">
              <div className="border-b border-border/70 px-3 py-2">
                <p className="text-[10px] font-bold text-foreground">Ranking de conformidade</p>
              </div>
              <ul className="divide-y divide-border/60">
                {[
                  { nome: 'Complexo logístico CO', score: 98.2, color: 'bg-emerald-600' },
                  { nome: 'Rodoviário federal', score: 94.5, color: 'bg-emerald-500' },
                  { nome: 'Multiunidade urbana', score: 87.1, color: 'bg-emerald-500' },
                  { nome: 'Rural em regularização', score: 72.4, color: 'bg-orange-400' },
                  { nome: 'Patrimonial linear', score: 64.8, color: 'bg-red-500' },
                ].map((emp, i) => (
                  <li key={emp.nome} className="flex items-center gap-2 px-3 py-1.5">
                    <span className="w-3 text-right text-[9px] font-bold tabular-nums text-muted-foreground/50">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-foreground">{emp.nome}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="meter-track">
                          <div className={cn('h-full rounded-full', emp.color)} style={{ width: `${emp.score}%` }} />
                        </div>
                        <span className="w-7 text-right text-[9px] tabular-nums font-medium text-muted-foreground">
                          {emp.score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
