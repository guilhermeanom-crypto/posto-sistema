import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { PocoConfigForm } from './poco-config-form'

export const metadata: Metadata = { title: 'Ponto de Monitoramento' }

interface Props { params: Promise<{ id: string }> }

interface Tendencia {
  nome: string
  leituras: { data: string; valor: number; limiteVMP: number | null; emAlerta: boolean }[]
  tendencia: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL' | 'SEM_DADOS'
  ultimoAlerta: boolean
}

const statusColor: Record<string, string> = {
  ATIVO:     'bg-green-100 text-green-800',
  INATIVO:   'bg-gray-100 text-gray-600',
  DANIFICADO:'bg-red-100 text-red-800',
}

const resultadoColor: Record<string, string> = {
  CONFORME:     'bg-green-100 text-green-800',
  ATENCAO:      'bg-yellow-100 text-yellow-800',
  NAO_CONFORME: 'bg-red-100 text-red-800',
}

const resultadoLabel: Record<string, string> = {
  CONFORME: 'Conforme', ATENCAO: 'Atenção', NAO_CONFORME: 'Não conforme',
}

const tipoLabel: Record<string, string> = {
  SOLO: 'Solo', AGUA_SUBTERRANEA: 'Água Subterrânea', VAPOR: 'Vapor', AR: 'Ar',
}

const periodicidadeLabel: Record<string, string> = {
  MENSAL: 'Mensal', TRIMESTRAL: 'Trimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual',
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasParaColeta(data: string | null) {
  if (!data) return null
  return Math.floor((new Date(data).getTime() - Date.now()) / 86400000)
}

export default async function PocoDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let poco: any = null
  let tendencias: Tendencia[] = []

  try {
    const [pocoRes, tendRes] = await Promise.all([
      api.get<{ data: any }>(`/monitoramento/pocos/${id}`, token),
      api.get<{ data: Tendencia[] }>(`/monitoramento/pocos/${id}/tendencia`, token),
    ])
    poco = pocoRes.data
    tendencias = tendRes.data
  } catch {
    notFound()
  }

  const campanhas: any[] = poco.campanhas ?? []
  const dias = diasParaColeta(poco.proximaColeta)
  const coletaVencida  = dias !== null && dias < 0
  const coletaUrgente  = dias !== null && dias >= 0 && dias <= 30
  const emAlertas = tendencias.filter((t) => t.ultimoAlerta)

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/monitoramento?aba=pontos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Monitoramento
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">Poço {poco.codigo}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            <Link href={`/empreendimentos/${poco.empreendimento.id}`} className="hover:underline">
              {poco.empreendimento.nomeFantasia ?? poco.empreendimento.nome}
            </Link>
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor[poco.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {poco.status}
        </span>
      </div>

      {/* Urgência de coleta */}
      {(coletaVencida || coletaUrgente) && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          coletaVencida ? 'border-red-200 bg-red-50 text-red-800' : 'border-orange-200 bg-orange-50 text-orange-800'
        }`}>
          {coletaVencida
            ? `⚠ Coleta programada vencida há ${Math.abs(dias!)} dia${Math.abs(dias!) !== 1 ? 's' : ''} — agendar imediatamente.`
            : `⚠ Coleta programada em ${dias} dia${dias !== 1 ? 's' : ''} (${formatDate(poco.proximaColeta)}).`}
        </div>
      )}

      {emAlertas.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-medium">
          ⚠ {emAlertas.length} parâmetro{emAlertas.length !== 1 ? 's' : ''} acima do VMP na última campanha: {emAlertas.map((t) => t.nome).join(', ')}.
        </div>
      )}

      {/* Dados do ponto */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Profundidade',   value: poco.profundidade ? `${Number(poco.profundidade).toFixed(1)} m` : null },
          { label: 'Instalação',     value: formatDate(poco.dataInstalacao) },
          { label: 'Periodicidade',  value: poco.periodicidade ? periodicidadeLabel[poco.periodicidade] : null },
          { label: 'Próxima coleta', value: formatDate(poco.proximaColeta) },
          { label: 'Campanhas',      value: `${campanhas.length}` },
          { label: 'Coordenadas',    value: poco.coordenadas },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium ${
              label === 'Próxima coleta' && coletaVencida ? 'text-red-600' :
              label === 'Próxima coleta' && coletaUrgente ? 'text-orange-600' : ''
            }`}>{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Configuração */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-semibold text-sm mb-4">Configuração de Periodicidade</h2>
        <PocoConfigForm
          id={id}
          periodicidade={poco.periodicidade}
          proximaColeta={poco.proximaColeta}
          status={poco.status}
          observacoes={poco.observacoes}
        />
      </div>

      {/* Tendência por parâmetro */}
      {tendencias.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm">Tendência por Parâmetro</h2>
            <span className="text-xs text-muted-foreground">{tendencias.length} parâmetro{tendencias.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Parâmetro</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Última leitura</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">VMP</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Tend.</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Situação</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Campanhas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tendencias.map((t) => {
                  const ultima = t.leituras[t.leituras.length - 1]
                  return (
                    <tr key={t.nome} className={t.ultimoAlerta ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 font-medium">{t.nome}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {ultima ? ultima.valor.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '—'}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        {ultima?.limiteVMP != null ? ultima.limiteVMP.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '—'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {t.tendencia === 'SUBINDO'   && <TrendingUp   className="h-4 w-4 text-red-500 inline" />}
                        {t.tendencia === 'DESCENDO'  && <TrendingDown  className="h-4 w-4 text-green-600 inline" />}
                        {t.tendencia === 'ESTAVEL'   && <Minus         className="h-4 w-4 text-muted-foreground inline" />}
                        {t.tendencia === 'SEM_DADOS' && <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {t.ultimoAlerta
                          ? <AlertTriangle className="h-4 w-4 text-red-600 inline" />
                          : <CheckCircle2  className="h-4 w-4 text-green-600 inline" />}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{t.leituras.length}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Histórico de campanhas */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Histórico de Campanhas</h2>
          <Link
            href={`/monitoramento`}
            className="text-xs text-primary hover:underline"
          >
            Nova campanha →
          </Link>
        </div>

        {campanhas.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma campanha registrada para este ponto.</div>
        ) : (
          <div className="divide-y">
            {campanhas.map((c: any) => {
              const emAlertaCount = (c.parametros ?? []).filter((p: any) => p.emAlerta).length
              return (
                <Link
                  key={c.id}
                  href={`/monitoramento/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{tipoLabel[c.tipo] ?? c.tipo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${resultadoColor[c.resultado] ?? 'bg-gray-100'}`}>
                        {resultadoLabel[c.resultado] ?? c.resultado}
                      </span>
                      {emAlertaCount > 0 && (
                        <span className="text-xs text-red-600 font-medium">{emAlertaCount} alerta{emAlertaCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.laboratorio} · {c._count?.parametros ?? 0} param.</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-medium">{formatDate(c.dataColeta)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
