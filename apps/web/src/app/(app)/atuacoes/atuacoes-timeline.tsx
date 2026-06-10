'use client'

import { CheckCircle2, ClipboardList, FileText, RadioTower, TriangleAlert } from 'lucide-react'
import type { ComponentType } from 'react'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface AtuacaoItem {
  id: string
  tipo: 'processo' | 'documento' | 'tarefa' | 'alerta'
  titulo: string
  status: string
  empreendimento: string
  responsavel?: string
  data?: string | null
  descricao?: string | null
  href?: string
}

const iconMap: Record<AtuacaoItem['tipo'], ComponentType<{ className?: string }>> = {
  processo: ClipboardList,
  documento: FileText,
  tarefa: CheckCircle2,
  alerta: TriangleAlert,
}

const labelMap: Record<AtuacaoItem['tipo'], string> = {
  processo: 'Processo',
  documento: 'Documento',
  tarefa: 'Tarefa',
  alerta: 'Alerta',
}

function urgencyClass(item: AtuacaoItem) {
  const isCritical = ['CRITICO', 'CRITICA', 'VENCIDO', 'BLOQUEADA'].includes(item.status)
  if (isCritical || item.tipo === 'alerta') return 'border-red-200 bg-red-50/80 text-red-700'
  if (['PENDENTE', 'EM_ANALISE', 'AGUARDANDO_APROVACAO'].includes(item.status)) return 'border-orange-200 bg-orange-50/80 text-orange-700'
  return 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
}

function formatDate(iso?: string | null) {
  if (!iso) return 'Sem data'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function AtuacoesTimeline({ itens }: { itens: AtuacaoItem[] }) {
  if (itens.length === 0) {
    return (
      <div className="animate-rise-in rounded-xl border bg-card p-12 text-center">
        <RadioTower className="mx-auto h-10 w-10 text-muted-foreground/45" />
        <h2 className="mt-4 text-sm font-semibold">Nenhuma atuação técnica recente</h2>
        <p className="mt-1 text-sm text-muted-foreground">Protocolos, tarefas, documentos e alertas entram aqui quando houver movimentação.</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-3">
      <div className="absolute left-5 top-3 h-[calc(100%-24px)] w-px bg-border" />
      {itens.map((item, index) => {
        const Icon = iconMap[item.tipo]
        return (
          <Sheet key={`${item.tipo}-${item.id}`}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  'animate-rise-in relative grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
                  index === 1 && 'animate-stagger-1',
                  index === 2 && 'animate-stagger-2',
                  index >= 3 && 'animate-stagger-3',
                )}
              >
                <div className={cn('z-10 flex h-10 w-10 items-center justify-center rounded-xl border', urgencyClass(item))}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{labelMap[item.tipo]}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(item.data)}</span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold">{item.titulo}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.empreendimento}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', urgencyClass(item))}>
                    {item.status}
                  </span>
                  {item.responsavel && <p className="mt-2 max-w-[150px] truncate text-xs text-muted-foreground">{item.responsavel}</p>}
                </div>
              </button>
            </SheetTrigger>

            <SheetContent>
              <SheetHeader>
                <SheetTitle>{item.titulo}</SheetTitle>
                <SheetDescription>{labelMap[item.tipo]} em {item.empreendimento}</SheetDescription>
              </SheetHeader>
              <SheetBody className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Status" value={item.status} />
                  <Info label="Data" value={formatDate(item.data)} />
                  <Info label="Tipo" value={labelMap[item.tipo]} />
                  <Info label="Responsável" value={item.responsavel ?? 'Sem responsável'} />
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Descrição técnica</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.descricao ?? 'Atuação registrada no fluxo operacional do posto.'}
                  </p>
                </div>
              </SheetBody>
            </SheetContent>
          </Sheet>
        )
      })}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}
