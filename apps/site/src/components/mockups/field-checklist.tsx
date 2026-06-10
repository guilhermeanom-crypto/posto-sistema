import { Camera, Check, ClipboardCheck, MapPin } from 'lucide-react'

const ITEMS = [
  { label: 'Tanques · estanqueidade', done: true },
  { label: 'SAO · limpeza periódica', done: true },
  { label: 'Resíduos · MTR/CDF', done: true },
  { label: 'OLUC · destinação', done: false },
  { label: 'Sinalização ambiental', done: false },
]

export function FieldChecklistMockup() {
  return (
    <div className="product-surface h-full">
      <div className="panel-chrome">
        <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold tracking-tight">Campo & Evidências</span>
        <span className="mono-tag ml-1">/campo</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          em campo
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between rounded-md border border-border/70 bg-white/70 px-3 py-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Vistoria #2841
            </p>
            <p className="mt-0.5 text-[12px] font-semibold tracking-tight text-foreground">
              Posto BR-153 · km 312
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="tabular-nums">-16.674, -49.265</span>
          </div>
        </div>

        <ul className="space-y-1.5">
          {ITEMS.map((it) => (
            <li
              key={it.label}
              className="flex items-center gap-2 rounded-md border border-border/70 bg-white/65 px-2.5 py-1.5"
            >
              <span
                className={`grid h-4 w-4 place-items-center rounded ${
                  it.done ? 'bg-emerald-500 text-white' : 'border border-dashed border-border bg-white'
                }`}
              >
                {it.done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
              </span>
              <span
                className={`flex-1 text-[11px] ${
                  it.done ? 'text-muted-foreground line-through' : 'font-medium text-foreground'
                }`}
              >
                {it.label}
              </span>
              {it.done ? <span className="mono-tag">FOTO ✓</span> : null}
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="relative aspect-[4/3] overflow-hidden rounded-md border border-border/70 bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.45),transparent_55%)]" />
              <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded bg-black/55 px-1 py-0.5 text-[8px] font-semibold text-white">
                <Camera className="h-2 w-2" />
                IMG-{i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
