'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, CheckSquare } from 'lucide-react'
import { Badge, labelStatus, prioridadeBadge, statusTarefaBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { formatDate } from '@/lib/date'

export function TarefaDetailSheet({ tarefa }: { tarefa: any }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">Detalhes</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{tarefa.titulo}</SheetTitle>
          <SheetDescription>{tarefa.empreendimento?.nome ?? 'Sem empreendimento'}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-5">
          <div className="rounded-xl border bg-muted/25 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{tarefa.titulo}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{tarefa.descricao ?? 'Sem descrição registrada.'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info label="Status"><Badge variant={statusTarefaBadge(tarefa.status)}>{labelStatus(tarefa.status)}</Badge></Info>
            <Info label="Prioridade"><Badge variant={prioridadeBadge(tarefa.prioridade)}>{labelStatus(tarefa.prioridade)}</Badge></Info>
            <Info label="Vencimento">{formatDate(tarefa.dataVencimento)}</Info>
            <Info label="Responsável">{tarefa.responsavel?.nome ?? '—'}</Info>
          </div>

          <Button asChild className="w-full">
            <Link href={`/tarefas/${tarefa.id}`}>
              Abrir tarefa completa
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
