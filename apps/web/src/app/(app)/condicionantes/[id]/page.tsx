import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { Badge, statusCondicionanteBadge, labelStatus } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/date'
import { notFound } from 'next/navigation'
import { CondicionanteActions } from './condicionante-actions'

export const metadata: Metadata = { title: 'Condicionante' }

interface Props { params: Promise<{ id: string }> }

const periodicidadeLabel: Record<string, string> = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  BIENAL: 'Bienal',
  PONTUAL: 'Pontual (única vez)',
}

export default async function CondicionanteDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let condicionante: any = null
  try {
    const res = await api.get<{ data: any }>(`/condicionantes/${id}`, token)
    condicionante = res.data
  } catch {
    notFound()
  }

  const ciclos: any[] = condicionante.ciclos ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/condicionantes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Condicionantes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{condicionante.descricao}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {condicionante.processo?.tipoProcesso?.nome} · {condicionante.empreendimento?.nome}
          </p>
        </div>
        <Badge variant={statusCondicionanteBadge(condicionante.status)} className="shrink-0 text-sm px-3 py-1">
          {labelStatus(condicionante.status)}
        </Badge>
      </div>

      {/* Ações */}
      <CondicionanteActions condicionanteId={condicionante.id} status={condicionante.status} />

      {/* Detalhes */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Periodicidade', value: periodicidadeLabel[condicionante.periodicidade] ?? condicionante.periodicidade },
          { label: 'Próximo vencimento', value: formatDate(condicionante.proximoVencimento) },
          { label: 'Responsável', value: condicionante.responsavel?.nome },
          { label: 'Criada em', value: formatDateTime(condicionante.criadoEm) },
          { label: 'Dispensada em', value: formatDateTime(condicionante.dispensadaEm) },
          { label: 'Motivo dispensa', value: condicionante.motivoDispensa },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Histórico de ciclos */}
      {ciclos.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b font-semibold text-sm">Histórico de Cumprimentos ({ciclos.length})</div>
          <div className="divide-y">
            {ciclos.map((c: any) => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{formatDate(c.dataReferencia)}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(c.criadoEm)}</p>
                </div>
                {c.observacoes && (
                  <p className="text-xs text-muted-foreground mt-0.5">{c.observacoes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
