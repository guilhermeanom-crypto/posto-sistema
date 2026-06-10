// Server component — sem 'use client'
// Recebe os dados já buscados pelo page.tsx e renderiza os cards de conformidade por eixo.

interface Eixo {
  id: string
  nome: string
  score: number | null  // 0–100 ou null (sem dados)
  total: number
  ok: number
  abaHub: string
}

interface Props {
  eixos: Eixo[]
  onAbaClick?: string  // não usado aqui, mas exposto para eventual uso client
}

function scoreColor(score: number | null): { bar: string; text: string; bg: string; border: string } {
  if (score === null) return { bar: 'bg-gray-300', text: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' }
  if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' }
  if (score >= 60) return { bar: 'bg-yellow-400',  text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' }
  return                  { bar: 'bg-red-500',      text: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200' }
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Sem dados'
  if (score >= 80) return 'BOM'
  if (score >= 60) return 'ATENÇÃO'
  return 'CRÍTICO'
}

export function DiagnosticoEixos({ eixos }: Props) {
  // Exibe apenas eixos com dados (total > 0) + os sem dados de forma discreta
  const comDados    = eixos.filter((e) => e.total > 0)
  const semDados    = eixos.filter((e) => e.total === 0)

  if (comDados.length === 0) return null

  const scoreGeral = Math.round(
    comDados.reduce((s, e) => s + (e.score ?? 0), 0) / comDados.length
  )
  const geral = scoreColor(scoreGeral)
  const criticos = comDados.filter((e) => e.score !== null && e.score < 60).length

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Cabeçalho com score geral */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${geral.bg}`}>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diagnóstico de Conformidade</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {comDados.length} eixo{comDados.length !== 1 ? 's' : ''} avaliado{comDados.length !== 1 ? 's' : ''}
            {criticos > 0 && (
              <span className="ml-2 font-semibold text-red-600">· {criticos} eixo{criticos !== 1 ? 's' : ''} crítico{criticos !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums ${geral.text}`}>{scoreGeral}%</p>
          <p className={`text-xs font-semibold ${geral.text}`}>{scoreLabel(scoreGeral)}</p>
        </div>
      </div>

      {/* Grid de eixos */}
      <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4">
        {comDados.map((eixo) => {
          const c = scoreColor(eixo.score)
          const pendentes = eixo.total - eixo.ok
          return (
            <div
              key={eixo.id}
              className={`px-4 py-3 space-y-2 ${c.bg} hover:brightness-95 transition-all`}
              title={`${eixo.nome}: ${eixo.ok}/${eixo.total} conformes`}
            >
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-semibold text-muted-foreground leading-tight">{eixo.nome}</p>
                <span className={`text-sm font-bold tabular-nums ${c.text}`}>
                  {eixo.score !== null ? `${eixo.score}%` : '—'}
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.bar} transition-all`}
                  style={{ width: `${eixo.score ?? 0}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {pendentes > 0
                  ? <span className={`font-medium ${c.text}`}>{pendentes} pendente{pendentes !== 1 ? 's' : ''}</span>
                  : <span className="text-emerald-600 font-medium">Tudo em dia</span>}
                <span className="text-muted-foreground/60"> · {eixo.total} total</span>
              </p>
            </div>
          )
        })}
      </div>

      {/* Eixos sem dados — discreta */}
      {semDados.length > 0 && (
        <div className="px-5 py-2 border-t bg-muted/20 flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Sem registros:</span>
          {semDados.map((e) => (
            <span key={e.id} className="text-xs text-muted-foreground/60">{e.nome}</span>
          ))}
        </div>
      )}
    </div>
  )
}
