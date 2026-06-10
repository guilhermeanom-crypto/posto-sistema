import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Painel Executivo' }

interface ModuloData {
  id: string
  nome: string
  total: number
  conformes: number
  vencendo30d: number
  score: number | null
}

interface EmpCritico {
  id: string
  nome: string
  indiceConformidade: number
  statusCompliance: string
}

interface TopRisco {
  empreendimentoId: string
  nome: string
  orgao: string
  score: number
  nivel: string
  recomendacoes: string[]
}

interface ExecutivoData {
  porModulo: ModuloData[]
  empreendimentosCriticos: EmpCritico[]
  topRiscos: TopRisco[]
}

interface ResumoData {
  mediaConformidadeRede: number | null
  totalEmpreendimentos: number
  empreendimentosCriticos: number
  alertasCriticos: number
  autosAtivos: number
  empreendimentosRiscoCritico: number
  vencimentos30d: number
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-200'
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-yellow-400'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function scoreTextColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground'
  if (score >= 80) return 'text-emerald-700'
  if (score >= 60) return 'text-yellow-700'
  if (score >= 40) return 'text-orange-700'
  return 'text-red-700'
}

function statusBadge(status: string): string {
  if (status === 'CRITICO') return 'bg-red-100 text-red-800'
  if (status === 'ATENCAO') return 'bg-orange-100 text-orange-800'
  return 'bg-gray-100 text-gray-700'
}

function nivelBadge(nivel: string): string {
  if (nivel === 'CRITICO') return 'bg-red-100 text-red-800'
  if (nivel === 'ALTO') return 'bg-orange-100 text-orange-800'
  if (nivel === 'MEDIO') return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-700'
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function ExecutivoPage() {
  const token = await getAccessToken()

  let executivo: ExecutivoData | null = null
  let resumo: ResumoData | null = null

  if (token) {
    try {
      const [execRes, resumoRes] = await Promise.all([
        api.get<{ data: ExecutivoData }>('/cockpit/executivo', token),
        api.get<{ data: ResumoData }>('/cockpit/resumo', token),
      ])
      executivo = execRes.data
      resumo = resumoRes.data
    } catch {}
  }

  const modulosComDados = executivo?.porModulo.filter((m) => m.total > 0) ?? []
  const modulosCriticos = modulosComDados.filter((m) => m.score !== null && m.score < 60)
  const totalVencendo = modulosComDados.reduce((acc, m) => acc + m.vencendo30d, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Executivo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão consolidada da conformidade da rede — todos os módulos
          </p>
        </div>
        <Link href="/dashboard" className="text-xs text-primary hover:underline flex-shrink-0">
          ← Cockpit operacional
        </Link>
      </div>

      {/* KPI cards */}
      {resumo && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border bg-card p-4 space-y-1 col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conformidade Rede</p>
            <p className="text-2xl font-bold">
              {resumo.mediaConformidadeRede != null ? `${resumo.mediaConformidadeRede.toFixed(1)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">{resumo.totalEmpreendimentos} postos</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Críticos</p>
            <p className={`text-2xl font-bold ${resumo.empreendimentosCriticos > 0 ? 'text-red-600' : ''}`}>
              {resumo.empreendimentosCriticos}
            </p>
            <p className="text-xs text-muted-foreground">postos</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vencendo 30d</p>
            <p className={`text-2xl font-bold ${totalVencendo > 0 ? 'text-orange-600' : ''}`}>
              {totalVencendo}
            </p>
            <p className="text-xs text-muted-foreground">documentos</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alertas Críticos</p>
            <p className={`text-2xl font-bold ${resumo.alertasCriticos > 0 ? 'text-red-600' : ''}`}>
              {resumo.alertasCriticos}
            </p>
            <p className="text-xs text-muted-foreground">90 dias</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Autos Infração</p>
            <p className={`text-2xl font-bold ${resumo.autosAtivos > 0 ? 'text-red-600' : ''}`}>
              {resumo.autosAtivos}
            </p>
            <p className="text-xs text-muted-foreground">em aberto</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risco Crítico</p>
            <p className={`text-2xl font-bold ${resumo.empreendimentosRiscoCritico > 0 ? 'text-red-600' : ''}`}>
              {resumo.empreendimentosRiscoCritico}
            </p>
            <p className="text-xs text-muted-foreground">postos</p>
          </div>
        </div>
      )}

      {/* Alertas de módulos críticos */}
      {modulosCriticos.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <span className="font-semibold">Módulos abaixo de 60%: </span>
          {modulosCriticos.map((m, i) => (
            <span key={m.id}>
              {m.nome} ({m.score}%){i < modulosCriticos.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {/* Conformidade por módulo */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/20">
          <h2 className="font-semibold text-sm">Conformidade por Módulo</h2>
        </div>

        {modulosComDados.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Sem dados suficientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/10">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Módulo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-40">Conformidade</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Conformes</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Vencendo 30d</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {modulosComDados
                  .sort((a, b) => (a.score ?? 999) - (b.score ?? 999))
                  .map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-medium">{m.nome}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold tabular-nums ${scoreTextColor(m.score)}`}>
                          {m.score != null ? `${m.score}%` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${scoreColor(m.score)}`}
                              style={{ width: `${m.score ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">{m.conformes}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">{m.total}</td>
                      <td className="px-4 py-3 text-center">
                        {m.vencendo30d > 0 ? (
                          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            {m.vencendo30d}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Empreendimentos que precisam de atenção */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Postos em Atenção / Críticos</h2>
            <span className="text-xs text-muted-foreground">{executivo?.empreendimentosCriticos.length ?? 0} postos</span>
          </div>

          {!executivo || executivo.empreendimentosCriticos.length === 0 ? (
            <div className="p-8 text-center text-sm text-emerald-600 font-medium">
              Todos os postos estão em conformidade.
            </div>
          ) : (
            <div className="divide-y max-h-72 overflow-y-auto">
              {executivo.empreendimentosCriticos.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/empreendimentos/${emp.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{emp.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreColor(emp.indiceConformidade)}`}
                          style={{ width: `${emp.indiceConformidade}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground w-10 text-right flex-shrink-0">
                        {emp.indiceConformidade.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusBadge(emp.statusCompliance)}`}>
                    {emp.statusCompliance}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top riscos */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Top Riscos Regulatórios</h2>
            <Link href="/risco" className="text-xs text-primary hover:underline">ver todos →</Link>
          </div>

          {!executivo || executivo.topRiscos.length === 0 ? (
            <div className="p-8 text-center text-sm text-emerald-600 font-medium">
              Nenhum risco crítico ou alto identificado.
            </div>
          ) : (
            <div className="divide-y max-h-72 overflow-y-auto">
              {executivo.topRiscos.map((r, i) => (
                <Link
                  key={`${r.empreendimentoId}-${r.orgao}`}
                  href={`/empreendimentos/${r.empreendimentoId}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-xs text-muted-foreground w-5 flex-shrink-0 pt-0.5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{r.nome}</p>
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono flex-shrink-0">{r.orgao}</span>
                    </div>
                    {r.recomendacoes[0] && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{r.recomendacoes[0]}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${nivelBadge(r.nivel)}`}>
                      {r.nivel}
                    </span>
                    <p className="text-xs tabular-nums text-muted-foreground mt-1">{r.score} pts</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
