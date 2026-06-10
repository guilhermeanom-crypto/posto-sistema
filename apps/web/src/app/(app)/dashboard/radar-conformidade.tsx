// Server component - SVG puro, sem dependências externas

interface Eixo {
  id: string
  nome: string
  score: number | null
}

interface Props {
  eixos: Eixo[]
}

// Calcula ponto num polígono regular centrado em (cx, cy)
function ponto(cx: number, cy: number, r: number, index: number, total: number): [number, number] {
  const angulo = (Math.PI * 2 * index) / total - Math.PI / 2
  return [
    cx + r * Math.cos(angulo),
    cy + r * Math.sin(angulo),
  ]
}

function formatPoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

export function RadarConformidade({ eixos }: Props) {
  const comDados = eixos.filter((e) => e.score !== null)
  if (comDados.length < 3) return null   // radar precisa de pelo menos 3 eixos

  const cx = 150
  const cy = 150
  const raios = [30, 60, 90, 120] // 25%, 50%, 75%, 100% do raio máximo
  const rMax = 120
  const n = comDados.length

  // Grade - polígonos concêntricos
  const gradePoligonos = raios.map((r) =>
    Array.from({ length: n }, (_, i) => ponto(cx, cy, r, i, n))
  )

  // Dados reais - polígono preenchido
  const dadosPontos = comDados.map((e, i) =>
    ponto(cx, cy, ((e.score ?? 0) / 100) * rMax, i, n)
  )

  // Cor por score médio
  const media = Math.round(comDados.reduce((s, e) => s + (e.score ?? 0), 0) / comDados.length)
  const fillColor = media >= 80 ? '#10b981' : media >= 60 ? '#f59e0b' : '#ef4444'
  const fillOpacity = 0.25

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Conformidade por Eixo - Rede</h2>
        <span className={`text-sm font-bold tabular-nums ${
          media >= 80 ? 'text-emerald-600' : media >= 60 ? 'text-yellow-600' : 'text-red-600'
        }`}>{media}%</span>
      </div>

      <div className="flex flex-col items-center p-4 gap-3">
        <svg viewBox="0 0 300 300" className="w-full max-w-[260px]" aria-label="Radar de conformidade">
          {/* Grade */}
          {gradePoligonos.map((pts, gi) => (
            <polygon
              key={gi}
              points={formatPoints(pts)}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          ))}

          {/* Eixos da grade */}
          {comDados.map((_, i) => {
            const [x, y] = ponto(cx, cy, rMax, i, n)
            return (
              <line
                key={i}
                x1={cx} y1={cy}
                x2={x.toFixed(1)} y2={y.toFixed(1)}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth={1}
              />
            )
          })}

          {/* Referência 100% */}
          <text x={cx} y={cy - rMax - 4} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.4}>100%</text>

          {/* Polígono de dados */}
          <polygon
            points={formatPoints(dadosPontos)}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={fillColor}
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Pontos nos vértices */}
          {dadosPontos.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3} fill={fillColor} />
          ))}

          {/* Labels dos eixos */}
          {comDados.map((e, i) => {
            const [x, y] = ponto(cx, cy, rMax + 18, i, n)
            const anchor = x < cx - 5 ? 'end' : x > cx + 5 ? 'start' : 'middle'
            return (
              <text
                key={i}
                x={x.toFixed(1)}
                y={y.toFixed(1)}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={9}
                fill="currentColor"
                opacity={0.7}
              >
                {e.nome}
              </text>
            )
          })}

          {/* Score no label */}
          {comDados.map((e, i) => {
            const [lx, ly] = ponto(cx, cy, rMax + 28, i, n)
            const anchor = lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle'
            return (
              <text
                key={`score-${i}`}
                x={lx.toFixed(1)}
                y={(ly + 10).toFixed(1)}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={8}
                fill={fillColor}
                fontWeight="bold"
              >
                {e.score !== null ? `${e.score}%` : '-'}
              </text>
            )
          })}
        </svg>

        {/* Legenda */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-full max-w-[260px]">
          {comDados.map((e) => {
            const c = e.score === null ? 'text-gray-400' : e.score >= 80 ? 'text-emerald-600' : e.score >= 60 ? 'text-yellow-600' : 'text-red-600'
            return (
              <div key={e.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate">{e.nome}</span>
                <span className={`font-semibold tabular-nums ml-1 ${c}`}>
                  {e.score !== null ? `${e.score}%` : '-'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
