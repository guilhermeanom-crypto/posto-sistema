import { Activity, Building2, Eye } from 'lucide-react'

export function ClientPortalMockup() {
  return (
    <div className="product-surface h-full">
      <div className="panel-chrome">
        <Eye className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold tracking-tight">Portal do Cliente</span>
        <span className="mono-tag ml-1">/portal</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Building2 className="h-3 w-3" /> Grupo Demo · 4 ativos
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: '94%', label: 'Conformidade', tone: 'text-emerald-600' },
            { val: '3', label: 'Vencendo', tone: 'text-orange-600' },
            { val: '1', label: 'Crítico', tone: 'text-red-600' },
          ].map((k) => (
            <div key={k.label} className="rounded-md border border-border/70 bg-white/75 px-2.5 py-2">
              <p className={`text-base font-black leading-none tabular-nums ${k.tone}`}>{k.val}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {k.label}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-border/70 bg-white/70 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Conformidade · 12 meses
            </p>
            <Activity className="h-3 w-3 text-primary" />
          </div>
          <div className="mt-2 flex h-12 items-end gap-1">
            {[42, 55, 60, 58, 70, 75, 72, 80, 84, 88, 90, 94].map((v, i) => (
              <span
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-primary/15 to-primary"
                style={{ height: `${v}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[8px] font-medium text-muted-foreground/70">
            <span>jun/25</span>
            <span>mai/26</span>
          </div>
        </div>

        <ul className="space-y-1.5">
          {[
            { titulo: 'Base GO-1', cidade: 'Goiânia/GO', status: 'regular' },
            { titulo: 'Posto km 312', cidade: 'Anápolis/GO', status: 'vencendo' },
            { titulo: 'Fazenda Cerrado', cidade: 'Sorriso/MT', status: 'critico' },
          ].map((row) => (
            <li
              key={row.titulo}
              className="flex items-center justify-between rounded-md border border-border/70 bg-white/65 px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-foreground">{row.titulo}</p>
                <p className="text-[9px] text-muted-foreground">{row.cidade}</p>
              </div>
              <span className={`status-pill status-${row.status}`}>
                <span className="dot" />
                {row.status === 'regular' && 'Regular'}
                {row.status === 'vencendo' && 'Vencendo'}
                {row.status === 'critico' && 'Crítico'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
