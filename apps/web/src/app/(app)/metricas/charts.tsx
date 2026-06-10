'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid,
  Cell, PieChart, Pie,
} from 'recharts'

interface Props {
  taxaResolucao: { semana: string; criadas: number; concluidas: number }[]
  cargaPorAnalista: { nome: string; abertas: number }[]
  tendenciaCompliance: { mes: string; indice: number }[]
  pendenciasPorModulo: { origem: string; count: number }[]
}

const CORES_PIE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e']

const origemLabel: Record<string, string> = {
  REGRA_VENCIMENTO_LICENCA: 'Licença',
  REGRA_VENCIMENTO_PROC: 'Processo',
  REGRA_CONDICIONANTE: 'Condicionante',
  REGRA_VENCIMENTO_ESTANQUEIDADE: 'Estanqueidade',
  REGRA_VENCIMENTO_PGRS: 'PGRS',
  REGRA_VENCIMENTO_ANP: 'ANP',
  REGRA_VENCIMENTO_SST: 'SST',
  REGRA_VENCIMENTO_OUTORGA: 'Outorga',
  REGRA_VENCIMENTO_DOC: 'Documento',
  WORKFLOW: 'Checklist NC',
  MANUAL: 'Manual',
  ESCALAMENTO: 'Escalamento',
}

export function MetricasCharts({ taxaResolucao, cargaPorAnalista, tendenciaCompliance, pendenciasPorModulo }: Props) {
  const moduloData = pendenciasPorModulo.map((p) => ({
    name: origemLabel[p.origem] ?? p.origem,
    value: p.count,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Tarefas criadas vs concluídas por semana */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Tarefas Criadas vs Concluídas (12 semanas)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={taxaResolucao}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="criadas" name="Criadas" fill="#f97316" radius={[2, 2, 0, 0]} />
            <Bar dataKey="concluidas" name="Concluídas" fill="#22c55e" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tendência de compliance */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Evolução do Compliance da Rede (12 meses)</h3>
        {tendenciaCompliance.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem dados de compliance histórico.</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tendenciaCompliance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="indice" name="Compliance %" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Carga por analista */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Carga de Trabalho por Analista</h3>
        {cargaPorAnalista.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Nenhum analista com tarefas abertas.</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cargaPorAnalista} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="nome" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="abertas" name="Tarefas abertas" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pendências por módulo */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Pendências por Módulo</h3>
        {moduloData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Nenhuma pendência aberta.</div>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={250}>
              <PieChart>
                <Pie data={moduloData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false}>
                  {moduloData.map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {moduloData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CORES_PIE[i % CORES_PIE.length] }} />
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="font-bold tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
