// Server Component — sem 'use client'
import Link from 'next/link'
import {
  Leaf, ShieldCheck, CheckSquare, Droplets, Fuel,
  Waves, HardHat, FileText, AlertTriangle, CalendarDays,
  ClipboardList,
} from 'lucide-react'

// ─── tipos ────────────────────────────────────────────────────────────────────

export interface TimelineItem {
  id: string
  modulo: 'LICENCA' | 'CONDICIONANTE' | 'TAREFA' | 'PROCESSO' | 'ESTANQUEIDADE' | 'ANP' | 'OUTORGA' | 'SST_ASO' | 'SST_DOC' | 'DOCUMENTO'
  titulo: string
  subtitulo?: string
  dias: number          // negativo = vencido
  status: string
  href?: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const moduloConfig: Record<TimelineItem['modulo'], { label: string; icon: React.ElementType; color: string }> = {
  LICENCA:       { label: 'Licença',        icon: Leaf,          color: 'text-emerald-600' },
  CONDICIONANTE: { label: 'Condicionante',  icon: ShieldCheck,   color: 'text-blue-600'    },
  TAREFA:        { label: 'Tarefa',         icon: CheckSquare,   color: 'text-violet-600'  },
  PROCESSO:      { label: 'Processo',       icon: ClipboardList, color: 'text-slate-700'   },
  ESTANQUEIDADE: { label: 'Estanqueidade',  icon: Droplets,      color: 'text-cyan-600'    },
  ANP:           { label: 'Bomba/ANP',      icon: Fuel,          color: 'text-orange-600'  },
  OUTORGA:       { label: 'Outorga',        icon: Waves,         color: 'text-sky-600'     },
  SST_ASO:       { label: 'ASO',            icon: HardHat,       color: 'text-amber-600'   },
  SST_DOC:       { label: 'Doc. SST',       icon: HardHat,       color: 'text-amber-500'   },
  DOCUMENTO:     { label: 'Documento',      icon: FileText,      color: 'text-slate-600'   },
}

function urgencyConfig(dias: number): {
  dot: string; bar: string; bg: string; border: string; text: string; label: string
} {
  if (dias < 0)    return { dot: 'bg-red-500',    bar: 'bg-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    label: `Vencido há ${Math.abs(dias)}d` }
  if (dias === 0)  return { dot: 'bg-red-500',    bar: 'bg-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    label: 'Vence HOJE'           }
  if (dias <= 7)   return { dot: 'bg-red-400',    bar: 'bg-red-400',    bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    label: `${dias}d restantes`  }
  if (dias <= 30)  return { dot: 'bg-orange-400', bar: 'bg-orange-400', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: `${dias}d restantes`  }
  if (dias <= 90)  return { dot: 'bg-amber-400',  bar: 'bg-amber-400',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  label: `${dias}d restantes`  }
  if (dias <= 180) return { dot: 'bg-yellow-400', bar: 'bg-yellow-400', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: `${dias}d restantes`  }
  return              { dot: 'bg-emerald-400', bar: 'bg-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: `${dias}d restantes` }
}

type Grupo = {
  id: string
  label: string
  cor: string
  items: TimelineItem[]
}

function agrupar(items: TimelineItem[]): Grupo[] {
  const g: Record<string, Grupo> = {
    vencido:   { id: 'vencido',   label: 'Vencidos',         cor: 'text-red-600',          items: [] },
    hoje:      { id: 'hoje',      label: 'Vence hoje',        cor: 'text-red-600',          items: [] },
    semana:    { id: 'semana',    label: 'Próximos 7 dias',   cor: 'text-orange-600',       items: [] },
    mes:       { id: 'mes',       label: 'Próximos 30 dias',  cor: 'text-amber-600',        items: [] },
    trimestre: { id: 'trimestre', label: 'Próximos 90 dias',  cor: 'text-yellow-700',       items: [] },
    semestre:  { id: 'semestre',  label: 'Próximos 6 meses',  cor: 'text-muted-foreground', items: [] },
    futuro:    { id: 'futuro',    label: 'Mais de 6 meses',   cor: 'text-muted-foreground', items: [] },
  }

  for (const item of items) {
    const { dias } = item
    const key =
      dias < 0   ? 'vencido'   :
      dias === 0 ? 'hoje'      :
      dias <= 7  ? 'semana'    :
      dias <= 30 ? 'mes'       :
      dias <= 90 ? 'trimestre' :
      dias <= 180? 'semestre'  : 'futuro'
    g[key]!.items.push(item)
  }

  return ['vencido','hoje','semana','mes','trimestre','semestre','futuro']
    .map((k) => g[k]!)
    .filter((grp) => grp.items.length > 0)
}

// ─── sub-componentes ──────────────────────────────────────────────────────────

function TimelineRow({ item }: { item: TimelineItem }) {
  const mc = moduloConfig[item.modulo]
  const uc = urgencyConfig(item.dias)
  const Icon = mc.icon

  const inner = (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${uc.bg} ${uc.border} hover:brightness-95 transition-all`}>
      {/* Dot + icon */}
      <div className="relative flex-shrink-0">
        <div className={`h-2.5 w-2.5 rounded-full ${uc.dot} mt-0.5`} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${mc.color}`} />
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {mc.label}
          </span>
        </div>
        <p className="text-sm font-semibold mt-0.5 truncate">{item.titulo}</p>
        {item.subtitulo && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.subtitulo}</p>
        )}
      </div>

      {/* Prazo */}
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-black tabular-nums ${uc.text}`}>{uc.label}</p>
        <p className="text-[10px] text-muted-foreground">
          {item.status.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  )

  return item.href ? (
    <Link href={item.href}>{inner}</Link>
  ) : (
    inner
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

interface Props {
  items: TimelineItem[]
  empreendimentoId: string
}

export function Timeline({ items, empreendimentoId }: Props) {
  if (items.length === 0) return null

  const grupos = agrupar(items)

  const vencidos   = items.filter((i) => i.dias < 0).length
  const criticos   = items.filter((i) => i.dias >= 0 && i.dias <= 30).length
  const proximo    = items.filter((i) => i.dias >= 0).sort((a, b) => a.dias - b.dias)[0]

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Cabeçalho */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${vencidos > 0 ? 'bg-red-50' : criticos > 0 ? 'bg-amber-50' : 'bg-muted/20'}`}>
        <div className="flex items-center gap-3">
          <CalendarDays className={`h-5 w-5 ${vencidos > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          <div>
            <p className="text-sm font-bold">Linha do Tempo de Vencimentos</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length} prazo{items.length !== 1 ? 's' : ''} monitorado{items.length !== 1 ? 's' : ''}
              {vencidos > 0 && (
                <span className="text-red-600 font-semibold ml-2">· {vencidos} vencido{vencidos !== 1 ? 's' : ''}</span>
              )}
              {proximo && proximo.dias > 0 && (
                <span className="ml-2">· próximo em {proximo.dias}d ({proximo.titulo})</span>
              )}
            </p>
          </div>
        </div>

        {/* Mini legenda */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground">
          {vencidos > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {vencidos} vencido{vencidos !== 1 ? 's' : ''}
            </span>
          )}
          {criticos > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              {criticos} urgente{criticos !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Grupos */}
      <div className="divide-y">
        {grupos.map((grupo) => (
          <div key={grupo.id} className="px-5 py-4 space-y-2">
            {/* Header do grupo */}
            <div className="flex items-center gap-2 mb-3">
              {grupo.id === 'vencido' && (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              )}
              <p className={`text-xs font-bold uppercase tracking-wider ${grupo.cor}`}>
                {grupo.label}
              </p>
              <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-medium">
                {grupo.items.length}
              </span>
              {/* Linha */}
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Items */}
            <div className="space-y-2">
              {grupo.items
                .sort((a, b) => a.dias - b.dias)
                .map((item) => (
                  <TimelineRow key={`${item.modulo}-${item.id}`} item={item} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t bg-muted/10 text-xs text-muted-foreground flex items-center justify-between">
        <span>Monitorando: licenças · condicionantes · tarefas · estanqueidade · ASOs · outorga</span>
        <Link
          href={`/tarefas?empreendimentoId=${empreendimentoId}`}
          className="text-primary hover:underline font-medium"
        >
          Ver tarefas →
        </Link>
      </div>
    </div>
  )
}
