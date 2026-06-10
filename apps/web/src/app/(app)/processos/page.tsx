import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { ExportarCSV } from '@/components/ui/exportar-csv'
import { Badge, statusProcessoBadge, labelStatus } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/date'
import { ProcessoDetailSheet } from './processo-detail-sheet'

export const metadata: Metadata = { title: 'Processos' }

interface Props {
  searchParams: Promise<{ empreendimentoId?: string; status?: string }>
}

export default async function ProcessosPage({ searchParams }: Props) {
  const { empreendimentoId, status } = await searchParams
  const token = await getAccessToken()
  let processos: any[] = []
  let total = 0

  let empreendimentos: { id: string; nome: string }[] = []

  if (token) {
    try {
      const [procRes, empRes] = await Promise.all([
        api.get<{ data: any[]; pagination: any }>(`/processos?${new URLSearchParams({ limit: '50', ...(empreendimentoId && { empreendimentoId }), ...(status && { status }) })}`, token),
        api.get<{ data: { id: string; nome: string }[] }>('/empreendimentos?limit=100', token),
      ])
      processos = procRes.data
      total = procRes.pagination.total
      empreendimentos = empRes.data
    } catch {}
  }

  // KPIs
  const emAnalise = processos.filter((p) => p.status === 'EM_ANALISE').length
  const deferidos = processos.filter((p) => p.status === 'DEFERIDO').length
  const vencidos = processos.filter((p) => p.status === 'VENCIDO').length
  const hoje = new Date()
  const vencendo30 = processos.filter((p) => p.dataVencimento && new Date(p.dataVencimento) > hoje && (new Date(p.dataVencimento).getTime() - hoje.getTime()) / 86400000 <= 30).length

  // Export data
  const dadosExport = processos.map((p: any) => ({
    Tipo: p.tipoProcesso?.nome ?? '',
    Empreendimento: p.empreendimento?.nome ?? '',
    Status: p.status,
    Vencimento: p.dataVencimento ? new Date(p.dataVencimento).toLocaleDateString('pt-BR') : '',
    Responsavel: p.responsavel?.nome ?? '',
  }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">Total</p><p className="text-xl font-bold">{total}</p></div>
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">Em Análise</p><p className="text-xl font-bold text-blue-600">{emAnalise}</p></div>
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">Deferidos</p><p className="text-xl font-bold text-green-600">{deferidos}</p></div>
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">Vencidos</p><p className="text-xl font-bold text-red-600">{vencidos}</p></div>
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">Vencendo 30d</p><p className="text-xl font-bold text-yellow-600">{vencendo30}</p></div>
      </div>

      {/* Filtro empreendimento */}
      <form method="GET" className="flex flex-wrap items-end gap-2">
        <select name="empreendimentoId" defaultValue={empreendimentoId ?? ''} className="rounded-md border bg-background px-2.5 py-1.5 text-xs min-w-[160px]">
          <option value="">Todos os postos</option>
          {empreendimentos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        {status && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Filtrar</button>
        {empreendimentoId && <Link href="/processos" className="text-xs text-muted-foreground hover:underline py-1.5">Limpar</Link>}
      </form>

      <div className="flex items-center justify-between">
        <PageHeader
          title="Processos Regulatórios"
          description={`${total} processo${total !== 1 ? 's' : ''}`}
          action={
            <Link
              href="/processos/novo"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Novo Processo
            </Link>
          }
        />
        <ExportarCSV dados={dadosExport} nomeArquivo="processos" />
      </div>

      {/* Filtros rápidos de status */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Todos', value: '' },
          { label: 'Em elaboração', value: 'EM_ELABORACAO' },
          { label: 'Em análise', value: 'EM_ANALISE' },
          { label: 'Vencidos', value: 'VENCIDO' },
          { label: 'Em renovação', value: 'EM_RENOVACAO' },
          { label: 'Deferidos', value: 'DEFERIDO' },
        ].map(({ label, value }) => {
          const active = (status ?? '') === value
          const href = value
            ? `/processos?status=${value}${empreendimentoId ? `&empreendimentoId=${empreendimentoId}` : ''}`
            : `/processos${empreendimentoId ? `?empreendimentoId=${empreendimentoId}` : ''}`
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {processos.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Nenhum processo encontrado"
          description="Abra um novo processo regulatório para começar o acompanhamento."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo / Órgão</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empreendimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Responsável</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {processos.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/processos/${p.id}`} className="hover:underline">
                      <p className="font-medium truncate max-w-[220px]">{p.tipoProcesso?.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.orgao?.sigla}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate max-w-[160px]">{p.empreendimento?.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.empreendimento?.cidade}/{p.empreendimento?.estado}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusProcessoBadge(p.status)}>{labelStatus(p.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.dataVencimento)}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">
                    {p.responsavel?.nome ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ProcessoDetailSheet processo={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
