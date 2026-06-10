import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Badge, statusCondicionanteBadge, labelStatus } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, diasRestantes } from '@/lib/date'
import { CondicionanteDetailSheet } from './condicionante-detail-sheet'
import { RecorrenciaPanel } from './recorrencia-panel'

export const metadata: Metadata = { title: 'Condicionantes' }

interface Props {
  searchParams: Promise<{ empreendimentoId?: string; status?: string }>
}

const periodicidadeLabel: Record<string, string> = {
  UNICA: 'Única',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  BIENAL: 'Bienal',
  PERSONALIZADA: 'Personalizada',
}

export default async function CondicionantesPage({ searchParams }: Props) {
  const { empreendimentoId, status } = await searchParams
  const token = await getAccessToken()
  let condicionantes: any[] = []
  let total = 0

  if (token) {
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (empreendimentoId) params.set('empreendimentoId', empreendimentoId)
      if (status) params.set('status', status)
      const res = await api.get<{ data: any[]; pagination: any }>(`/condicionantes?${params}`, token)
      condicionantes = res.data
      total = res.pagination.total
    } catch {}
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Condicionantes"
        description={`${total} condicionante${total !== 1 ? 's' : ''}`}
      />

      <RecorrenciaPanel condicionantes={condicionantes} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Todas', value: '' },
          { label: 'Pendentes', value: 'PENDENTE' },
          { label: 'Em cumprimento', value: 'EM_CUMPRIMENTO' },
          { label: 'Ag. evidência', value: 'AGUARDANDO_EVIDENCIA' },
          { label: 'Vencidas', value: 'VENCIDA' },
          { label: 'Cumpridas', value: 'CUMPRIDA' },
        ].map(({ label, value }) => {
          const active = (status ?? '') === value
          const href = value
            ? `/condicionantes?status=${value}${empreendimentoId ? `&empreendimentoId=${empreendimentoId}` : ''}`
            : `/condicionantes${empreendimentoId ? `?empreendimentoId=${empreendimentoId}` : ''}`
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
      </div>

      {condicionantes.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10" />}
          title="Nenhuma condicionante encontrada"
          description="As condicionantes das licenças aparecerão aqui para acompanhamento."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condicionante</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empreendimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Periodicidade</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Próx. Vencimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {condicionantes.map((c) => {
                const dias = diasRestantes(c.proximoVencimento)
                const urgente = dias !== null && dias >= 0 && dias <= 30
                const vencido = dias !== null && dias < 0

                return (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/condicionantes/${c.id}`} className="hover:underline">
                        <p className="font-medium truncate max-w-[240px]">{c.descricao}</p>
                        <p className="text-xs text-muted-foreground">{c.processo?.tipoProcesso?.nome ?? c.processo?.orgao?.sigla}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">
                      {c.empreendimento?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusCondicionanteBadge(c.status)}>{labelStatus(c.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {periodicidadeLabel[c.periodicidade] ?? c.periodicidade ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.proximoVencimento ? (
                        <div className="flex items-center gap-1.5">
                          {(urgente || vencido) && (
                            <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${vencido ? 'text-red-500' : 'text-yellow-500'}`} />
                          )}
                          <div>
                            <span className={`text-sm ${vencido ? 'text-red-600 font-medium' : urgente ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
                              {formatDate(c.proximoVencimento)}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {dias === null ? '' : dias < 0 ? `Vencido há ${Math.abs(dias)}d` : dias === 0 ? 'Hoje' : `${dias}d`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CondicionanteDetailSheet
                        condicionante={c}
                        periodicidadeLabel={periodicidadeLabel[c.periodicidade] ?? c.periodicidade ?? '—'}
                      />
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
