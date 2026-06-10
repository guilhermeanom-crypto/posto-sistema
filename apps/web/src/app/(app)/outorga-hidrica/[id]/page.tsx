import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/date'
import { LaudoAguaForm } from './laudo-form'

export const metadata: Metadata = { title: 'Poço Artesiano — Outorga Hídrica' }

interface Props { params: Promise<{ id: string }> }

const statusColor: Record<string, string> = {
  ATIVO:       'bg-green-100 text-green-800',
  INATIVO:     'bg-gray-100 text-gray-600',
  INTERDITADO: 'bg-red-100 text-red-800',
  SELADO:      'bg-gray-100 text-gray-400',
}

const resultadoConfig: Record<string, { label: string; Icon: typeof CheckCircle2; color: string }> = {
  CONFORME:     { label: 'Conforme',     Icon: CheckCircle2, color: 'text-green-600' },
  NAO_CONFORME: { label: 'Não Conforme', Icon: XCircle,      color: 'text-red-600' },
  ATENCAO:      { label: 'Atenção',      Icon: AlertCircle,  color: 'text-yellow-600' },
}

export default async function PocoDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let poco: any = null
  try {
    const res = await api.get<{ data: any }>(`/outorga-hidrica/${id}`, token)
    poco = res.data
  } catch {
    notFound()
  }

  const laudos: any[] = poco.laudos ?? []
  const dias = poco.validadeOutorga
    ? Math.floor((new Date(poco.validadeOutorga).getTime() - Date.now()) / 86400000)
    : null
  const vencida = dias !== null && dias < 0
  const urgente = dias !== null && dias >= 0 && dias <= 90

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/outorga-hidrica" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Outorga Hídrica
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Poço {poco.codigo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/empreendimentos/${poco.empreendimento.id}`} className="hover:underline">
              {poco.empreendimento.nome}
            </Link>
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColor[poco.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {poco.status}
        </span>
      </div>

      {/* Banner outorga */}
      {(vencida || urgente) && poco.outorgaDAEE && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          vencida ? 'border-red-200 bg-red-50 text-red-800' : 'border-orange-200 bg-orange-50 text-orange-800'
        }`}>
          {vencida
            ? `Outorga DAEE vencida há ${Math.abs(dias!)} dias — necessário renovação junto ao DAEE/SEMAD.`
            : `Outorga DAEE vence em ${dias} dias — inicie o processo de renovação.`}
        </div>
      )}

      {/* Dados do poço */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Profundidade',     value: poco.profundidade ? `${poco.profundidade} m` : null },
          { label: 'Vazão autorizada', value: poco.vazaoAutorizada ? `${poco.vazaoAutorizada} m³/h` : null },
          { label: 'Coordenadas',      value: poco.coordenadas },
          { label: 'Outorga DAEE',     value: poco.outorgaDAEE },
          { label: 'Validade outorga', value: formatDate(poco.validadeOutorga) },
          { label: 'Data perfuração',  value: formatDate(poco.dataPerforacao) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium ${
              label === 'Validade outorga' && vencida ? 'text-red-600' :
              label === 'Validade outorga' && urgente ? 'text-orange-600' : ''
            }`}>{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Registrar laudo */}
      <LaudoAguaForm pocoId={id} />

      {/* Histórico de laudos */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-sm">Laudos de Qualidade da Água ({laudos.length})</h2>
        </div>
        {laudos.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">Nenhum laudo registrado.</p>
        ) : (
          <div className="divide-y">
            {laudos.map((l: any) => {
              const cfg = resultadoConfig[l.resultado] ?? resultadoConfig['ATENCAO']!
              const { Icon } = cfg
              return (
                <div key={l.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{cfg.label}</span>
                        <span className="text-xs text-muted-foreground">· {formatDate(l.dataCampanha)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Laboratório: {l.laboratorio}
                        {Array.isArray(l.parametros) && l.parametros.length > 0
                          ? ` · ${l.parametros.length} parâmetro(s)`
                          : ''}
                      </p>
                      {l.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{l.observacoes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {poco.observacoes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Observações</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{poco.observacoes}</p>
        </div>
      )}
    </div>
  )
}
