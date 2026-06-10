import { FileText, Filter } from 'lucide-react'

type Row = {
  doc: string
  cliente: string
  status: 'regular' | 'atencao' | 'vencendo' | 'critico'
  prazo: string
}

const ROWS: Row[] = [
  { doc: 'LO · Renovação 2026', cliente: 'Base GO-1 · Distribuição', status: 'critico', prazo: 'Hoje' },
  { doc: 'CAR · Retificação', cliente: 'Fazenda Vale do Cerrado · MT', status: 'vencendo', prazo: '3 dias' },
  { doc: 'PGPA · Relatório semestral', cliente: 'Ferrovia BA-Piauí', status: 'atencao', prazo: '12 dias' },
  { doc: 'Outorga · Poço P-04', cliente: 'Indústria Centro-Oeste', status: 'atencao', prazo: '21 dias' },
  { doc: 'AVCB · Vistoria', cliente: 'Posto BR-153 km 312', status: 'regular', prazo: '90 dias' },
  { doc: 'FCA · Patrimônio', cliente: 'LT 500 kV Norte', status: 'regular', prazo: '120 dias' },
]

export function DocumentMatrixMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="product-surface h-full">
      <div className="panel-chrome">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold tracking-tight">Matriz Documental</span>
        </div>
        <span className="mono-tag ml-2">/documentos</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="status-pill status-critico"><span className="dot" />1</span>
          <span className="status-pill status-vencendo"><span className="dot" />1</span>
          <span className="status-pill status-atencao"><span className="dot" />2</span>
          <span className="hidden status-pill status-regular sm:inline-flex"><span className="dot" />2</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border/70 bg-white/60 px-3 py-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
          <Filter className="h-3 w-3" />
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Vencimento ↓</span>
          <span className="rounded-full bg-muted px-2 py-0.5">Tipo</span>
          <span className="hidden rounded-full bg-muted px-2 py-0.5 sm:inline-flex">Cliente</span>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
          {ROWS.length} de 312
        </span>
      </div>

      <ul className="divide-y divide-border/60">
        {ROWS.slice(0, compact ? 4 : ROWS.length).map((r) => (
          <li key={r.doc} className="row-cell justify-between !py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`status-pill status-${r.status}`}>
                  <span className="dot" />
                  {r.prazo}
                </span>
                <span className="mono-tag">DOC</span>
              </div>
              <p className="mt-1 truncate text-[11px] font-semibold text-foreground">{r.doc}</p>
              <p className="truncate text-[10px] text-muted-foreground">{r.cliente}</p>
            </div>
            <div className="hidden flex-none items-center gap-1.5 sm:flex">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-muted/80 text-[9px] font-bold text-muted-foreground">
                PDF
              </span>
              <span className="grid h-6 w-6 place-items-center rounded-md bg-muted/80 text-[9px] font-bold text-muted-foreground">
                DOC
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
