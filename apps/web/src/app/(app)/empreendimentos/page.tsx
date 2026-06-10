import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, MapPin, AlertTriangle, CheckCircle2, Clock, Fuel } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Meus Postos' }

interface Props {
  searchParams: Promise<{ busca?: string }>
}

interface Empreendimento {
  id: string
  nome: string
  nomeFantasia: string | null
  cnpj: string | null
  codigoInterno: string | null
  bandeira: string | null
  tipo: string | null
  cidade: string
  estado: string
  logradouro: string | null
  numero: string | null
  complemento: string | null
  ativo: boolean
  empresa: { nome: string }
  snapshotsCompliance: Array<{
    indiceConformidade: string
    statusCompliance: string
  }>
  _count: { processos: number; tarefas: number }
}

function statusCard(status: string | undefined) {
  if (status === 'EMERGENCIA') return { bar: 'bg-red-600',    ring: 'border-l-4 border-l-red-600',    label: 'Emergência', badge: 'bg-red-100 text-red-700',    score: 'text-red-600'    }
  if (status === 'CRITICO')    return { bar: 'bg-red-500',    ring: 'border-l-4 border-l-red-500',    label: 'Crítico',    badge: 'bg-red-50 text-red-600',     score: 'text-red-500'    }
  if (status === 'ATENCAO')    return { bar: 'bg-amber-400',  ring: 'border-l-4 border-l-amber-400',  label: 'Atenção',    badge: 'bg-amber-50 text-amber-700', score: 'text-amber-600'  }
  if (status === 'REGULAR')    return { bar: 'bg-emerald-500',ring: 'border-l-4 border-l-emerald-500',label: 'Regular',    badge: 'bg-emerald-50 text-emerald-700', score: 'text-emerald-600' }
  return { bar: 'bg-gray-300', ring: '', label: 'Sem dados', badge: 'bg-gray-100 text-gray-500', score: 'text-gray-400' }
}

export default async function EmpreendimentosPage({ searchParams }: Props) {
  const { busca = '' } = await searchParams
  const token = await getAccessToken()
  let empreendimentos: Empreendimento[] = []
  let total = 0

  if (token) {
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (busca) params.set('busca', busca)
      const res = await api.get<PaginatedResponse<Empreendimento>>(`/empreendimentos?${params.toString()}`, token)
      empreendimentos = res.data
      total = res.pagination.total
    } catch { /* exibe vazio */ }
  }

  const resumo = empreendimentos.reduce(
    (acc, emp) => {
      const s = emp.snapshotsCompliance[0]?.statusCompliance
      if (s === 'REGULAR')                          acc.regulares++
      else if (s === 'ATENCAO')                     acc.atencao++
      else if (s === 'CRITICO' || s === 'EMERGENCIA') acc.criticos++
      else                                          acc.semDados++
      return acc
    },
    { regulares: 0, atencao: 0, criticos: 0, semDados: 0 },
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Postos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {busca
              ? `${empreendimentos.length} resultado${empreendimentos.length !== 1 ? 's' : ''} para "${busca}"`
              : `${total} empreendimento${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/empreendimentos/novo"
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Novo posto
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-2xl font-black text-emerald-600">{resumo.regulares}</p>
            <p className="text-xs text-muted-foreground">Regulares</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
          <Clock className="h-8 w-8 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-2xl font-black text-amber-600">{resumo.atencao}</p>
            <p className="text-xs text-muted-foreground">Atenção</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-2xl font-black text-red-600">{resumo.criticos}</p>
            <p className="text-xs text-muted-foreground">Críticos</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-muted-foreground/40 flex-shrink-0" />
          <div>
            <p className="text-2xl font-black text-muted-foreground">{resumo.semDados}</p>
            <p className="text-xs text-muted-foreground">Sem snapshot</p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <form action="/empreendimentos" className="flex gap-2">
        <input
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por nome, código ou CNPJ..."
          className="flex-1 h-10 rounded-lg border border-input bg-card px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Buscar
        </button>
        {busca && (
          <Link
            href="/empreendimentos"
            className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition"
          >
            Limpar
          </Link>
        )}
      </form>

      {/* Lista de postos */}
      {empreendimentos.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          title="Nenhum empreendimento encontrado"
          description="Cadastre o primeiro empreendimento para começar a gerenciar a conformidade."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {empreendimentos.map((emp) => {
            const snapshot = emp.snapshotsCompliance[0]
            const indice   = snapshot ? parseFloat(snapshot.indiceConformidade) : null
            const status   = snapshot?.statusCompliance
            const sc       = statusCard(status)

            return (
              <Link
                key={emp.id}
                href={`/empreendimentos/${emp.id}`}
                className={`group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all duration-200 ${sc.ring}`}
              >
                {/* Progress bar topo */}
                {indice !== null && (
                  <div className="h-0.5 w-full bg-muted">
                    <div className={`h-full ${sc.bar} transition-all`} style={{ width: `${Math.min(indice, 100)}%` }} />
                  </div>
                )}

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                        <Fuel className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                          {emp.nomeFantasia ?? emp.nome}
                        </p>
                        {emp.codigoInterno && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{emp.codigoInterno}</p>
                        )}
                      </div>
                    </div>
                    {status && (
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.badge}`}>
                        {sc.label}
                      </span>
                    )}
                  </div>

                  {/* Localização */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {emp.logradouro
                        ? `${emp.logradouro}${emp.numero ? ` ${emp.numero}` : ''}${emp.complemento ? `, ${emp.complemento}` : ''} · `
                        : ''}
                      {emp.cidade}, {emp.estado}
                      {emp.bandeira && ` · ${emp.bandeira}`}
                    </span>
                  </div>

                  {/* Barra de conformidade */}
                  {indice !== null ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Conformidade</span>
                        <span className={`font-black tabular-nums ${sc.score}`}>{indice.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${sc.bar}`}
                          style={{ width: `${Math.min(indice, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-2 w-full rounded-full bg-muted" />
                  )}

                  {/* Rodapé */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                    <span>{emp._count.processos} processo{emp._count.processos !== 1 ? 's' : ''}</span>
                    <span>{emp._count.tarefas} tarefa{emp._count.tarefas !== 1 ? 's' : ''}</span>
                    <span className="text-primary font-medium group-hover:underline">Ver hub →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
