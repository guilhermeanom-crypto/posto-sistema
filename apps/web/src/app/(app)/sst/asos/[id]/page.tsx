import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/date'

export const metadata: Metadata = { title: 'ASO — SST' }

interface Props { params: Promise<{ id: string }> }

const aptidaoConfig: Record<string, { label: string; color: string }> = {
  APTO:             { label: 'Apto',             color: 'bg-green-100 text-green-800' },
  INAPTO:           { label: 'Inapto',           color: 'bg-red-100 text-red-800' },
  APTO_COM_RESTRICAO:{ label: 'Apto c/ Restrição', color: 'bg-yellow-100 text-yellow-800' },
}

const tipoLabel: Record<string, string> = {
  ADMISSIONAL:    'Admissional',
  PERIODICO:      'Periódico',
  DEMISSIONAL:    'Demissional',
  RETORNO:        'Retorno ao trabalho',
  MUDANCA_FUNCAO: 'Mudança de função',
}

export default async function ASODetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let aso: any = null
  try {
    const res = await api.get<{ data: any }>(`/sst/asos/${id}`, token)
    aso = res.data
  } catch {
    notFound()
  }

  const ap = aptidaoConfig[aso.aptidao] ?? { label: aso.aptidao, color: 'bg-gray-100 text-gray-600' }
  const dias = aso.dataVencimento
    ? Math.floor((new Date(aso.dataVencimento).getTime() - Date.now()) / 86400000)
    : null
  const vencido = dias !== null && dias < 0
  const urgente = dias !== null && dias >= 0 && dias <= 30

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/sst" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        SST
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{aso.funcionarioNome}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {aso.cargo ?? 'Cargo não informado'} ·{' '}
            <Link href={`/empreendimentos/${aso.empreendimento.id}`} className="hover:underline">
              {aso.empreendimento.nome}
            </Link>
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${ap.color}`}>
          {ap.label}
        </span>
      </div>

      {/* Banner */}
      {(vencido || urgente) && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          vencido ? 'border-red-200 bg-red-50 text-red-800' : 'border-orange-200 bg-orange-50 text-orange-800'
        }`}>
          {vencido
            ? `ASO vencido há ${Math.abs(dias!)} dias — agende renovação imediatamente.`
            : `ASO vence em ${dias} dias — agende o próximo exame.`}
        </div>
      )}

      {/* Dados */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Tipo de exame',    value: tipoLabel[aso.tipo] ?? aso.tipo },
          { label: 'Data do exame',    value: formatDate(aso.dataExame) },
          { label: 'Validade',         value: formatDate(aso.dataVencimento) },
          { label: 'CPF',              value: aso.funcionarioCPF },
          { label: 'Médico responsável', value: aso.medicoResponsavel },
          { label: 'Situação',         value: dias !== null ? (vencido ? `Vencido há ${Math.abs(dias)}d` : `${dias}d restantes`) : 'Sem validade' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium ${
              label === 'Situação' && vencido ? 'text-red-600' :
              label === 'Situação' && urgente ? 'text-orange-600' : ''
            }`}>{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {aso.nomeArquivo && (
        <div className="rounded-lg border bg-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Arquivo do ASO</p>
            <p className="text-xs text-muted-foreground mt-0.5">{aso.nomeArquivo}</p>
          </div>
        </div>
      )}

      {aso.observacoes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Observações</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aso.observacoes}</p>
        </div>
      )}
    </div>
  )
}
