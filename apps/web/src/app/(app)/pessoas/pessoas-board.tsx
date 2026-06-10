'use client'

import { Activity, AlertTriangle, CheckSquare, Clock, Mail, UserRound } from 'lucide-react'
import type { ComponentType } from 'react'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface PessoaResumo {
  nome: string
  email?: string
  cargo?: string
  setor?: string
  total: number
  atrasadas: number
  criticas: number
  concluidas: number
  abertas: number
  scorePressao: number
  tarefas: {
    id: string
    titulo: string
    status: string
    prioridade: string
    empreendimento: string
    dataVencimento?: string | null
  }[]
}

function pressaoClass(score: number) {
  if (score >= 70) return 'text-red-700 bg-red-50 border-red-200'
  if (score >= 40) return 'text-orange-700 bg-orange-50 border-orange-200'
  return 'text-emerald-700 bg-emerald-50 border-emerald-200'
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDENTE: 'Pendente',
    EM_ANDAMENTO: 'Em andamento',
    AGUARDANDO_APROVACAO: 'Ag. aprovação',
    CONCLUIDA: 'Concluída',
    BLOQUEADA: 'Bloqueada',
  }
  return labels[status] ?? status
}

export function PessoasBoard({ pessoas }: { pessoas: PessoaResumo[] }) {
  if (pessoas.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center animate-rise-in">
        <UserRound className="mx-auto h-10 w-10 text-muted-foreground/45" />
        <h2 className="mt-4 text-sm font-semibold">Nenhuma pessoa com carga operacional</h2>
        <p className="mt-1 text-sm text-muted-foreground">Quando tarefas tiverem responsáveis, a visão de ownership aparece aqui.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {pessoas.map((pessoa, index) => (
        <Sheet key={pessoa.nome}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                'animate-rise-in rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
                index === 1 && 'animate-stagger-1',
                index === 2 && 'animate-stagger-2',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {pessoa.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{pessoa.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{pessoa.cargo ?? pessoa.setor ?? 'Responsável operacional'}</p>
                  </div>
                </div>
                <span className={cn('rounded-full border px-2 py-1 text-xs font-semibold', pressaoClass(pessoa.scorePressao))}>
                  {pessoa.scorePressao}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2">
                <Metric icon={CheckSquare} label="Abertas" value={pessoa.abertas} />
                <Metric icon={AlertTriangle} label="Críticas" value={pessoa.criticas} />
                <Metric icon={Clock} label="Atraso" value={pessoa.atrasadas} />
                <Metric icon={Activity} label="Done" value={pessoa.concluidas} />
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-orange-400 to-red-500" style={{ width: `${Math.min(100, pessoa.scorePressao)}%` }} />
              </div>
            </button>
          </SheetTrigger>

          <SheetContent>
            <SheetHeader>
              <SheetTitle>{pessoa.nome}</SheetTitle>
              <SheetDescription>
                {pessoa.abertas} tarefas abertas, {pessoa.criticas} críticas e {pessoa.atrasadas} atrasadas.
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="space-y-5">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Pressão operacional</p>
                <p className="mt-2 text-4xl font-black tracking-tight">{pessoa.scorePressao}</p>
                {pessoa.email && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {pessoa.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Tarefas associadas</p>
                {pessoa.tarefas.length === 0 ? (
                  <p className="rounded-lg border p-4 text-sm text-muted-foreground">Sem tarefas associadas.</p>
                ) : (
                  pessoa.tarefas.slice(0, 12).map((tarefa) => (
                    <div key={tarefa.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{tarefa.titulo}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{tarefa.empreendimento}</p>
                        </div>
                        <Badge variant={tarefa.prioridade === 'CRITICA' ? 'destructive' : 'outline'}>{statusLabel(tarefa.status)}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetBody>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/55 p-2">
      <Icon className="mb-1 h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </div>
  )
}
