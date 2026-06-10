import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { AlertaItem } from './alerta-item'
import { marcarTodosLidos } from './actions'

export const metadata: Metadata = { title: 'Alertas' }

interface Props {
  searchParams: Promise<{ lido?: string; nivel?: string }>
}

export default async function AlertasPage({ searchParams }: Props) {
  const { lido, nivel } = await searchParams
  const token = await getAccessToken()
  let alertas: any[] = []
  let total = 0
  let naoLidos = 0

  if (token) {
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (lido !== undefined) params.set('lido', lido)
      if (nivel) params.set('nivel', nivel)
      const [res, naoLidosRes] = await Promise.all([
        api.get<{ data: any[]; pagination: any }>(`/alertas?${params}`, token),
        api.get<{ data: any[]; pagination: any }>('/alertas?lido=false&limit=1', token),
      ])
      alertas = res.data
      total = res.pagination.total
      naoLidos = naoLidosRes.pagination.total
    } catch {}
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas"
        description={naoLidos > 0 ? `${naoLidos} não lido${naoLidos !== 1 ? 's' : ''}` : `${total} alerta${total !== 1 ? 's' : ''}`}
        action={
          naoLidos > 0 ? (
            <form action={marcarTodosLidos}>
              <button
                type="submit"
                className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Marcar todos como lidos
              </button>
            </form>
          ) : undefined
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Todos', href: '/alertas' },
          { label: 'Não lidos', href: '/alertas?lido=false' },
          { label: 'Lidos', href: '/alertas?lido=true' },
        ].map(({ label, href }) => {
          const active = href === `/alertas${lido ? `?lido=${lido}` : ''}`
          return (
            <Link
              key={label}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {alertas.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="Nenhum alerta"
          description="Você está em dia! Novos alertas de conformidade aparecerão aqui."
        />
      ) : (
        <div className="rounded-lg border bg-card divide-y overflow-hidden">
          {alertas.map((alerta) => (
            <AlertaItem key={alerta.id} alerta={alerta} />
          ))}
        </div>
      )}
    </div>
  )
}
