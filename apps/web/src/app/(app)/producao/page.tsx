import type { Metadata } from 'next'
import { Gauge, Timer, UserRound } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'Produção' }

type Pessoa = {
  nome: string
  abertas: number
  atrasadas: number
  criticas: number
  concluidas: number
}

function isAtrasada(tarefa: any) {
  return tarefa.dataVencimento && new Date(tarefa.dataVencimento).getTime() < Date.now() && tarefa.status !== 'CONCLUIDA'
}

export default async function ProducaoPage() {
  const token = await getAccessToken()
  let tarefas: any[] = []

  if (token) {
    try {
      const res = await api.get<{ data: any[] }>('/tarefas?limit=150', token)
      tarefas = res.data
    } catch {}
  }

  const pessoas = new Map<string, Pessoa>()
  for (const tarefa of tarefas) {
    const nome = tarefa.responsavel?.nome ?? 'Sem responsável'
    const pessoa = pessoas.get(nome) ?? { nome, abertas: 0, atrasadas: 0, criticas: 0, concluidas: 0 }
    if (tarefa.status === 'CONCLUIDA') pessoa.concluidas += 1
    else pessoa.abertas += 1
    if (isAtrasada(tarefa)) pessoa.atrasadas += 1
    if (tarefa.prioridade === 'CRITICA' || tarefa.status === 'BLOQUEADA') pessoa.criticas += 1
    pessoas.set(nome, pessoa)
  }

  const ranking = [...pessoas.values()].sort((a, b) => (b.abertas + b.criticas * 2 + b.atrasadas * 2) - (a.abertas + a.criticas * 2 + a.atrasadas * 2))
  const abertas = ranking.reduce((acc, p) => acc + p.abertas, 0)
  const atrasadas = ranking.reduce((acc, p) => acc + p.atrasadas, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Capacidade interna</p>
          <h1 className="text-2xl font-bold tracking-tight">Produção</h1>
          <p className="mt-1 text-sm text-muted-foreground">Carga de trabalho por responsável, atrasos e pressão operacional.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Kpi label="Abertas" value={abertas} />
          <Kpi label="Atrasadas" value={atrasadas} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {ranking.map((pessoa) => {
          const pressao = Math.min(100, pessoa.abertas * 7 + pessoa.criticas * 20 + pessoa.atrasadas * 14)
          return (
            <article key={pessoa.nome} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{pessoa.nome}</p>
                  <p className="text-xs text-muted-foreground">Pressão {pressao}/100</p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pressao}%` }} />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                <Small label="Abertas" value={pessoa.abertas} />
                <Small label="Críticas" value={pessoa.criticas} />
                <Small label="Atraso" value={pessoa.atrasadas} />
                <Small label="Done" value={pessoa.concluidas} />
              </div>
            </article>
          )
        })}
        {ranking.length === 0 && (
          <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground lg:col-span-3">
            Nenhuma tarefa encontrada para medir produção.
          </div>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-right">
      <Gauge className="ml-auto mb-1 h-4 w-4 text-primary" />
      <p className="text-xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  )
}

function Small({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/25 p-2">
      <Timer className="mb-1 h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </div>
  )
}
