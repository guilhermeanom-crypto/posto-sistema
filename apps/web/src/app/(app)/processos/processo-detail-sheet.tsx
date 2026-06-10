'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, ClipboardList } from 'lucide-react'
import { Badge, labelStatus, statusProcessoBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { formatDate } from '@/lib/date'

export function ProcessoDetailSheet({ processo }: { processo: any }) {
  const nome = processo.tipoProcesso?.nome ?? processo.numeroProcesso ?? 'Processo regulatório'

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">Detalhes</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{nome}</SheetTitle>
          <SheetDescription>{processo.empreendimento?.nome ?? 'Sem empreendimento'}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-5">
          <div className="rounded-xl border bg-muted/25 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{nome}</p>
                <p className="mt-1 text-xs text-muted-foreground">{processo.orgao?.sigla ?? processo.orgao?.nome ?? 'Órgão não informado'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info label="Status"><Badge variant={statusProcessoBadge(processo.status)}>{labelStatus(processo.status)}</Badge></Info>
            <Info label="Vencimento">{formatDate(processo.dataVencimento)}</Info>
            <Info label="Responsável">{processo.responsavel?.nome ?? '—'}</Info>
            <Info label="Cidade">{processo.empreendimento?.cidade ? `${processo.empreendimento.cidade}/${processo.empreendimento.estado}` : '—'}</Info>
          </div>

          <Button asChild className="w-full">
            <Link href={`/processos/${processo.id}`}>
              Abrir processo completo
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
