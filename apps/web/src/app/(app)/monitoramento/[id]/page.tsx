import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/date'

export const metadata: Metadata = { title: 'Campanha — Monitoramento' }

interface Props { params: Promise<{ id: string }> }

const resultadoConfig: Record<string, { label: string; color: string; banner: string }> = {
  CONFORME:     { label: 'Conforme',     color: 'bg-green-100 text-green-800',  banner: '' },
  ATENCAO:      { label: 'Atenção',      color: 'bg-yellow-100 text-yellow-800', banner: 'border-yellow-200 bg-yellow-50 text-yellow-800' },
  NAO_CONFORME: { label: 'Não Conforme', color: 'bg-red-100 text-red-800',      banner: 'border-red-200 bg-red-50 text-red-800' },
}

export default async function CampanhaDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let campanha: any = null
  try {
    const res = await api.get<{ data: any }>(`/monitoramento/campanhas/${id}`, token)
    campanha = res.data
  } catch {
    notFound()
  }

  const rc = resultadoConfig[campanha.resultado] ?? resultadoConfig['ATENCAO']!
  const parametros: any[] = campanha.parametros ?? []
  const emAlerta = parametros.filter((p: any) => p.emAlerta)

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/monitoramento" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Monitoramento
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {campanha.tipo?.replace(/_/g, ' ')}
            {campanha.pocoMonitoramento && ` — Poço ${campanha.pocoMonitoramento.codigo}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/empreendimentos/${campanha.empreendimento.id}`} className="hover:underline">
              {campanha.empreendimento.nome}
            </Link>
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${rc.color}`}>
          {rc.label}
        </span>
      </div>

      {/* Banner não conforme */}
      {campanha.resultado !== 'CONFORME' && rc.banner && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${rc.banner}`}>
          {emAlerta.length > 0
            ? `${emAlerta.length} parâmetro(s) acima do limite VMP — ação corretiva necessária.`
            : 'Resultado requer atenção. Verifique os parâmetros.'}
        </div>
      )}

      {/* Dados */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Tipo',           value: campanha.tipo?.replace(/_/g, ' ') },
          { label: 'Data de coleta', value: formatDate(campanha.dataColeta) },
          { label: 'Laboratório',    value: campanha.laboratorio },
          { label: 'Ponto',          value: campanha.pocoMonitoramento ? `Poço ${campanha.pocoMonitoramento.codigo}` : 'Não especificado' },
          { label: 'Parâmetros',     value: `${parametros.length} avaliado(s)` },
          { label: 'Em alerta',      value: emAlerta.length > 0 ? `${emAlerta.length} parâmetro(s)` : 'Nenhum' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium ${label === 'Em alerta' && emAlerta.length > 0 ? 'text-red-600' : ''}`}>
              {value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Parâmetros contaminantes */}
      {parametros.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-sm">Parâmetros Analisados ({parametros.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Parâmetro</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Medido</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">VMP</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Unidade</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parametros.map((p: any) => (
                  <tr key={p.id} className={p.emAlerta ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 font-medium">{p.nome}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{Number(p.valorMedido).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {p.limiteVMP ? Number(p.limiteVMP).toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{p.unidade}</td>
                    <td className="px-4 py-2 text-center">
                      {p.emAlerta
                        ? <AlertTriangle className="h-4 w-4 text-red-600 inline" />
                        : <CheckCircle2 className="h-4 w-4 text-green-600 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {campanha.observacoes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Observações</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campanha.observacoes}</p>
        </div>
      )}
    </div>
  )
}
