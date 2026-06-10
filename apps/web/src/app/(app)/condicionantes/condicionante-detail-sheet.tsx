'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, CalendarClock, ShieldCheck } from 'lucide-react'
import { Badge, labelStatus, statusCondicionanteBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { formatDate } from '@/lib/date'

interface Props {
  condicionante: any
  periodicidadeLabel: string
}

export function CondicionanteDetailSheet({ condicionante, periodicidadeLabel }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">Detalhes</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Condicionante</SheetTitle>
          <SheetDescription>{condicionante.empreendimento?.nome ?? 'Sem empreendimento'}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-5">
          <div className="rounded-xl border bg-muted/25 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-6">{condicionante.descricao}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {condicionante.processo?.tipoProcesso?.nome ?? condicionante.processo?.orgao?.sigla ?? 'Processo não informado'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info label="Status">
              <Badge variant={statusCondicionanteBadge(condicionante.status)}>{labelStatus(condicionante.status)}</Badge>
            </Info>
            <Info label="Periodicidade">{periodicidadeLabel}</Info>
            <Info label="Próximo vencimento">{formatDate(condicionante.proximoVencimento)}</Info>
            <Info label="Empreendimento">{condicionante.empreendimento?.nome ?? '—'}</Info>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Cadência operacional
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Use esta condicionante como ponto de controle recorrente para evidências, responsáveis e próximos marcos no calendário.
            </p>
          </div>

          <Button asChild className="w-full">
            <Link href={`/condicionantes/${condicionante.id}`}>
              Abrir registro completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold">{children}</div>
    </div>
  )
}
