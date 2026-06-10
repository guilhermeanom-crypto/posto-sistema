import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckSquare, AlertTriangle } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Badge, statusTarefaBadge, prioridadeBadge, labelStatus } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, diasRestantes } from '@/lib/date'
import { TarefaDetailSheet } from './tarefa-detail-sheet'

export const metadata: Metadata = { title: 'Tarefas' }

interface Props {
  searchParams: Promise<{ status?: string; prioridade?: string; empreendimentoId?: string }>
}

export default async function TarefasPage({ searchParams }: Props) {
  const { status, prioridade, empreendimentoId } = await searchParams
  const token = await getAccessToken()
  let tarefas: any[] = []
  let total = 0

  if (token) {
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (status) params.set('status', status)
      if (prioridade) params.set('prioridade', prioridade)
      if (empreendimentoId) params.set('empreendimentoId', empreendimentoId)
      const res = await api.get<{ data: any[]; pagination: any }>(`/tarefas?${params}`, token)
      tarefas = res.data
      total = res.pagination.total
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Tarefas" description={`${total} tarefa${total !== 1 ? 's' : ''}`} />
        <Link
          href="/tarefas/nova"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Nova Tarefa
        </Link>
      </div>

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Todas', value: '' },
          { label: 'Pendentes', value: 'PENDENTE' },
          { label: 'Em andamento', value: 'EM_ANDAMENTO' },
          { label: 'Ag. aprovação', value: 'AGUARDANDO_APROVACAO' },
          { label: 'Concluídas', value: 'CONCLUIDA' },
          { label: 'Bloqueadas', value: 'BLOQUEADA' },
        ].map(({ label, value }) => {
          const active = (status ?? '') === value
          const base = empreendimentoId ? `?empreendimentoId=${empreendimentoId}` : ''
          const href = value
            ? `/tarefas${base ? base + '&' : '?'}status=${value}`
            : `/tarefas${base}`
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </Link>
          )
        })}

        {/* Filtro prioridade crítica */}
        <Link
          href={prioridade === 'CRITICA' ? '/tarefas' : '/tarefas?prioridade=CRITICA'}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            prioridade === 'CRITICA'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          🔴 Críticas
        </Link>
      </div>

      {tarefas.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-10 w-10" />}
          title="Nenhuma tarefa encontrada"
          description="As tarefas de compliance aparecerão aqui."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tarefa</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empreendimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Prioridade</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Responsável</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tarefas.map((t) => {
                const dias = diasRestantes(t.dataVencimento)
                const urgente = dias !== null && dias >= 0 && dias <= 3
                const vencido = dias !== null && dias < 0

                return (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tarefas/${t.id}`} className="hover:underline">
                        <p className="font-medium truncate max-w-[220px]">{t.titulo}</p>
                        {t.descricao && (
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">{t.descricao}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">
                      {t.empreendimento?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusTarefaBadge(t.status)}>{labelStatus(t.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={prioridadeBadge(t.prioridade)}>{labelStatus(t.prioridade)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {t.dataVencimento ? (
                        <div className="flex items-center gap-1">
                          {(urgente || vencido) && (
                            <AlertTriangle className={`h-3.5 w-3.5 ${vencido ? 'text-red-500' : 'text-yellow-500'}`} />
                          )}
                          <span className={`${vencido ? 'text-red-600 font-medium' : urgente ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
                            {formatDate(t.dataVencimento)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">
                      {t.responsavel?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <TarefaDetailSheet tarefa={t} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
