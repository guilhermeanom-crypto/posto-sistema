import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, AlertTriangle } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Badge, statusDocumentoBadge, labelStatus } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, diasRestantes } from '@/lib/date'
import { AprovacaoInline } from './aprovacao-inline'
import { DocumentoDetailSheet } from './documento-detail-sheet'

export const metadata: Metadata = { title: 'Documentos' }

interface Props {
  searchParams: Promise<{ empreendimentoId?: string; status?: string }>
}

export default async function DocumentosPage({ searchParams }: Props) {
  const { empreendimentoId, status } = await searchParams
  const token = await getAccessToken()
  let documentos: any[] = []
  let total = 0

  if (token) {
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (empreendimentoId) params.set('empreendimentoId', empreendimentoId)
      if (status) params.set('status', status)
      const res = await api.get<{ data: any[]; pagination: any }>(`/documentos?${params}`, token)
      documentos = res.data
      total = res.pagination.total
    } catch {}
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Documentos" description={`${total} documento${total !== 1 ? 's' : ''}`} />

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Todos', value: '' },
          { label: 'Pendentes', value: 'PENDENTE' },
          { label: 'A Renovar', value: 'A_RENOVAR' },
          { label: 'Vencidos', value: 'VENCIDO' },
          { label: 'Aprovados', value: 'APROVADO' },
          { label: 'Em Análise', value: 'EM_ANALISE' },
        ].map(({ label, value }) => {
          const active = (status ?? '') === value
          const href = value
            ? `/documentos?status=${value}${empreendimentoId ? `&empreendimentoId=${empreendimentoId}` : ''}`
            : `/documentos${empreendimentoId ? `?empreendimentoId=${empreendimentoId}` : ''}`
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

      {documentos.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Nenhum documento encontrado"
          description="Os documentos dos empreendimentos aparecerão aqui."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Documento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empreendimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Validade</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documentos.map((doc) => {
                const dias = diasRestantes(doc.dataValidade)
                const urgente = dias !== null && dias >= 0 && dias <= 30
                const vencido = dias !== null && dias < 0

                return (
                  <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/documentos/${doc.id}`} className="hover:underline">
                        <p className="font-medium truncate max-w-[220px]">
                          {doc.tipoDocumento?.nome ?? doc.nome ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">{doc.tipoDocumento?.categoria}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate max-w-[160px]">{doc.empreendimento?.nome ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusDocumentoBadge(doc.status)}>{labelStatus(doc.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {(urgente || vencido) && (
                          <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${vencido ? 'text-red-500' : 'text-yellow-500'}`} />
                        )}
                        <span className={`text-sm ${vencido ? 'text-red-600 font-medium' : urgente ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
                          {doc.dataValidade ? formatDate(doc.dataValidade) : '—'}
                        </span>
                      </div>
                      {dias !== null && (
                        <p className="text-xs text-muted-foreground">
                          {dias < 0 ? `Vencido há ${Math.abs(dias)}d` : dias === 0 ? 'Vence hoje' : `${dias}d restantes`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <DocumentoDetailSheet documento={doc} />
                        {doc.status === 'EM_ANALISE' && doc.versaoAtual?.status === 'ENVIADA' && (
                          <AprovacaoInline
                            documentoId={doc.id}
                            versaoId={doc.versaoAtual.id}
                            size="sm"
                          />
                        )}
                      </div>
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
