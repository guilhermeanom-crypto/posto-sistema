import { CalendarClock } from 'lucide-react'

const WEEKS = ['S-12', 'S-8', 'S-4', 'S-2', 'Agora', 'D-7', 'D-30', 'D-60']

const EVENTS = [
  { id: 'A', label: 'Vistoria SEMAD', x: 18, status: 'regular' as const },
  { id: 'B', label: 'Renovação LO', x: 48, status: 'critico' as const },
  { id: 'C', label: 'Outorga · Poço', x: 70, status: 'vencendo' as const },
  { id: 'D', label: 'PGPA semestral', x: 88, status: 'atencao' as const },
]

const STATUS_COLOR: Record<'regular' | 'atencao' | 'vencendo' | 'critico', string> = {
  regular: 'bg-emerald-500',
  atencao: 'bg-amber-500',
  vencendo: 'bg-orange-500',
  critico: 'bg-red-500',
}

export function RegulatoryTimelineMockup() {
  return (
    <div className="product-surface h-full">
      <div className="panel-chrome">
        <CalendarClock className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold tracking-tight">Cronograma Regulatório</span>
        <span className="mono-tag ml-1">/calendario</span>
        <span className="ml-auto text-[10px] font-medium text-muted-foreground tabular-nums">
          14/05 · 2026
        </span>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
          <span>Hoje</span>
          <span>Próximos 60 dias</span>
        </div>

        <div className="relative">
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-orange-500" />
          </div>
          {EVENTS.map((e) => (
            <div
              key={e.id}
              className="absolute -top-1.5 -translate-x-1/2"
              style={{ left: `${e.x}%` }}
            >
              <span className={`grid h-4 w-4 place-items-center rounded-full ring-2 ring-white ${STATUS_COLOR[e.status]}`}>
                <span className="text-[8px] font-black text-white">{e.id}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-between text-[9px] font-medium text-muted-foreground/70 tabular-nums">
          {WEEKS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <ul className="mt-4 space-y-1.5">
          {EVENTS.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-2 rounded-md border border-border/70 bg-white/70 px-2 py-1.5"
            >
              <span className={`grid h-5 w-5 place-items-center rounded-md text-[9px] font-black text-white ${STATUS_COLOR[e.status]}`}>
                {e.id}
              </span>
              <span className="flex-1 text-[11px] font-semibold text-foreground">{e.label}</span>
              <span className={`status-pill status-${e.status}`}>
                <span className="dot" />
                {e.status === 'regular' && 'Regular'}
                {e.status === 'atencao' && 'Atenção'}
                {e.status === 'vencendo' && 'Vencendo'}
                {e.status === 'critico' && 'Crítico'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
