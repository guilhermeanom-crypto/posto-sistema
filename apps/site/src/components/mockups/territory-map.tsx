import { MapPin, Layers } from 'lucide-react'

const POLYGONS = [
  { d: 'M40,60 L120,40 L180,90 L150,150 L70,150 Z', tone: 'rgba(0,158,60,0.18)', stroke: 'rgba(0,158,60,0.65)' },
  { d: 'M200,110 L260,80 L300,140 L240,180 Z', tone: 'rgba(243,146,0,0.18)', stroke: 'rgba(243,146,0,0.65)' },
  { d: 'M70,180 L150,170 L170,220 L90,230 Z', tone: 'rgba(220,38,38,0.14)', stroke: 'rgba(220,38,38,0.55)' },
]

const PINS = [
  { x: 110, y: 95, status: 'regular' },
  { x: 230, y: 140, status: 'vencendo' },
  { x: 130, y: 200, status: 'critico' },
  { x: 260, y: 90, status: 'atencao' },
]

const PIN_COLOR: Record<string, string> = {
  regular: '#10b981',
  vencendo: '#f97316',
  critico: '#ef4444',
  atencao: '#f59e0b',
}

export function TerritoryMapMockup() {
  return (
    <div className="product-surface h-full">
      <div className="panel-chrome">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold tracking-tight">Leitura Territorial</span>
        <span className="mono-tag ml-1">/territorio</span>
        <div className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          <Layers className="h-3 w-3" />
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">CAR</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5">APP</span>
          <span className="hidden rounded-full bg-muted px-1.5 py-0.5 sm:inline-flex">RL</span>
        </div>
      </div>

      <div className="relative dotted-canvas">
        <svg viewBox="0 0 340 260" className="block h-56 w-full" aria-hidden>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56,46,27,0.07)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="340" height="260" fill="url(#grid)" />
          {POLYGONS.map((p, i) => (
            <path key={i} d={p.d} fill={p.tone} stroke={p.stroke} strokeWidth="1.4" strokeDasharray="3 2" />
          ))}
          <path
            d="M0,130 C60,110 100,150 160,140 C220,130 260,160 340,130"
            fill="none"
            stroke="rgba(8,145,178,0.55)"
            strokeWidth="1.6"
          />
          {PINS.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="8" fill={PIN_COLOR[p.status]} fillOpacity="0.22" />
              <circle cx={p.x} cy={p.y} r="4" fill={PIN_COLOR[p.status]} stroke="#fff" strokeWidth="1.5" />
            </g>
          ))}
        </svg>

        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          <span className="status-pill status-regular bg-white/90"><span className="dot" />4 regular</span>
          <span className="status-pill status-atencao bg-white/90"><span className="dot" />3 atenção</span>
          <span className="status-pill status-critico bg-white/90"><span className="dot" />1 crítico</span>
        </div>
        <div className="absolute right-2 top-2 rounded-md border border-border/70 bg-white/95 px-2 py-1 text-[9px] font-semibold tabular-nums text-muted-foreground shadow-sm">
          12 polígonos · 2 conflitos APP
        </div>
      </div>
    </div>
  )
}
