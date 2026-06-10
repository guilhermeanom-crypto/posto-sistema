import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Score de Risco de Fiscalização' }

interface OrgaoScore {
  orgao: string
  score: number
  nivel: string
  recomendacoes: string[]
  fatores: { descricao: string; pontos: number }[]
}

interface EmpreendimentoRisco {
  empreendimento: { id: string; nome: string; cidade: string; estado: string }
  scoreGeral: number
  nivelGeral: string
  calculadoEm: string
  orgaos: OrgaoScore[]
}

const nivelColor: Record<string, string> = {
  BAIXO: 'bg-green-100 text-green-800',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  ALTO: 'bg-orange-100 text-orange-800',
  CRITICO: 'bg-red-100 text-red-800',
}

const nivelBar: Record<string, string> = {
  BAIXO: 'bg-green-500',
  MEDIO: 'bg-yellow-500',
  ALTO: 'bg-orange-500',
  CRITICO: 'bg-red-500',
}

const orgaoIcon: Record<string, string> = {
  CETESB: '🌿',
  ANP: '⛽',
  INMETRO: '⚖️',
  BOMBEIROS: '🔥',
}

export default async function RiscoPage() {
  const token = await getAccessToken()
  let dados: EmpreendimentoRisco[] = []

  if (token) {
    try {
      const res = await api.get<{ data: EmpreendimentoRisco[] }>('/risco', token)
      dados = res.data
    } catch { /* exibe vazio */ }
  }

  const criticos = dados.filter((d) => d.nivelGeral === 'CRITICO').length
  const altos = dados.filter((d) => d.nivelGeral === 'ALTO').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Score de Risco de Fiscalização</h1>
          <p className="text-muted-foreground text-sm">Risco estimado de autuação por órgão fiscalizador — atualizado diariamente</p>
        </div>
      </div>

      {(criticos > 0 || altos > 0) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-medium">
          ⚠ {criticos > 0 ? `${criticos} empreendimento${criticos !== 1 ? 's' : ''} em nível CRÍTICO` : ''}
          {criticos > 0 && altos > 0 ? ' e ' : ''}
          {altos > 0 ? `${altos} em nível ALTO` : ''} — ação imediata necessária.
        </div>
      )}

      {dados.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Nenhum score calculado ainda.</p>
          <p className="text-xs text-muted-foreground">O cálculo roda automaticamente todo dia à meia-noite.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dados.map((d) => (
            <div key={d.empreendimento.id} className="rounded-lg border bg-card overflow-hidden">
              {/* Header do empreendimento */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div>
                    <Link href={`/empreendimentos/${d.empreendimento.id}`} className="font-semibold text-sm hover:underline">
                      {d.empreendimento.nome}
                    </Link>
                    <p className="text-xs text-muted-foreground">{d.empreendimento.cidade}/{d.empreendimento.estado}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">{d.scoreGeral}</p>
                    <p className="text-xs text-muted-foreground">score geral</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${nivelColor[d.nivelGeral] ?? 'bg-gray-100'}`}>
                    {d.nivelGeral}
                  </span>
                </div>
              </div>

              {/* Grid de órgãos */}
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0">
                {d.orgaos.map((o) => (
                  <div key={o.orgao} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {orgaoIcon[o.orgao]} {o.orgao}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${nivelColor[o.nivel] ?? 'bg-gray-100'}`}>
                        {o.score}
                      </span>
                    </div>

                    {/* Barra de score */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${nivelBar[o.nivel] ?? 'bg-gray-400'}`}
                        style={{ width: `${o.score}%` }}
                      />
                    </div>

                    {/* Fatores */}
                    {o.fatores.length > 0 && (
                      <ul className="space-y-1">
                        {(o.fatores as { descricao: string; pontos: number }[]).slice(0, 3).map((f, i) => (
                          <li key={i} className="text-xs text-muted-foreground leading-tight">
                            • {f.descricao}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Recomendações (só para ALTO/CRITICO) */}
                    {o.recomendacoes.length > 0 && o.score >= 50 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-primary font-medium hover:underline">
                          {o.recomendacoes.length} recomendação{o.recomendacoes.length !== 1 ? 'ões' : ''}
                        </summary>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                          {o.recomendacoes.map((r, i) => (
                            <li key={i} className="leading-tight">→ {r}</li>
                          ))}
                        </ul>
                      </details>
                    )}

                    {o.fatores.length === 0 && (
                      <p className="text-xs text-green-600 font-medium">Sem pendências</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
