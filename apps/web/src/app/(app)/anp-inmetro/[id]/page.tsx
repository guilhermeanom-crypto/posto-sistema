import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/date'
import { CalibracaoForm } from './calibracao-form'
import { EquipamentoHistorico } from '../../components/equipamento-historico'

export const metadata: Metadata = { title: 'Bomba — ANP/INMETRO' }

interface Props { params: Promise<{ id: string }> }

const statusColor: Record<string, string> = {
  ATIVO:      'bg-green-100 text-green-800',
  INATIVO:    'bg-gray-100 text-gray-600',
  MANUTENCAO: 'bg-yellow-100 text-yellow-800',
}

export default async function BombaDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let bomba: any = null
  try {
    const res = await api.get<{ data: any }>(`/anp-inmetro/${id}`, token)
    bomba = res.data
  } catch {
    notFound()
  }

  const dias = bomba.proximaCalibracao
    ? Math.floor((new Date(bomba.proximaCalibracao).getTime() - Date.now()) / 86400000)
    : null
  const vencida = dias !== null && dias < 0
  const urgente = dias !== null && dias >= 0 && dias <= 30

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/anp-inmetro" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        ANP / INMETRO
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bomba #{bomba.numero} — {bomba.fabricante}{bomba.modelo ? ` ${bomba.modelo}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/empreendimentos/${bomba.empreendimento.id}`} className="hover:underline">
              {bomba.empreendimento.nome}
            </Link>
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColor[bomba.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {bomba.status}
        </span>
      </div>

      {/* Banner */}
      {(vencida || urgente) && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          vencida ? 'border-red-200 bg-red-50 text-red-800' : 'border-orange-200 bg-orange-50 text-orange-800'
        }`}>
          {vencida
            ? `Calibração vencida há ${Math.abs(dias!)} dias — aferição obrigatória INMETRO pendente.`
            : `Próxima calibração em ${dias} dias — agende com laboratório credenciado.`}
        </div>
      )}

      {/* Dados */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Número de série',   value: bomba.numeroDeSerie },
          { label: 'Combustíveis',      value: bomba.combustiveis?.join(', ') },
          { label: 'Sticker INMETRO',   value: bomba.stickerInmetro },
          { label: 'Última calibração', value: formatDate(bomba.ultimaCalibracao) },
          { label: 'Próxima calibração',value: formatDate(bomba.proximaCalibracao) },
          { label: 'Situação',          value: dias !== null ? (vencida ? `Vencida há ${Math.abs(dias)}d` : `${dias}d restantes`) : '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium ${
              label === 'Situação' && vencida ? 'text-red-600' :
              label === 'Situação' && urgente ? 'text-orange-600' : ''
            }`}>{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Registrar calibração */}
      <CalibracaoForm bombaId={id} />

      {/* Histórico Técnico */}
      <EquipamentoHistorico equipamentoTipo="BOMBA" equipamentoId={id} empreendimentoId={bomba.empreendimento.id} />

      {/* Observações */}
      {bomba.observacoes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Observações</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bomba.observacoes}</p>
        </div>
      )}
    </div>
  )
}
