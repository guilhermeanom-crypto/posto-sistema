import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { BarChart2, Clock, UserX, AlertTriangle, TrendingUp } from 'lucide-react'
import { MetricasCharts } from './charts'

export const metadata: Metadata = { title: 'Métricas Operacionais' }

interface MetricasData {
  tempoMedioResolucao: number
  taxaResolucao: { semana: string; criadas: number; concluidas: number }[]
  cargaPorAnalista: { usuarioId: string; nome: string; abertas: number }[]
  semResponsavel: number
  escalamentosMes: number
  tendenciaCompliance: { mes: string; indice: number }[]
  pendenciasPorModulo: { origem: string; count: number }[]
}

export default async function MetricasPage() {
  const token = await getAccessToken()
  let data: MetricasData | null = null

  if (token) {
    try {
      const res = await api.get<{ data: MetricasData }>('/metricas/operacional', token)
      data = res.data
    } catch {}
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Não foi possível carregar as métricas. Verifique se a API está rodando.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-primary" />
          Métricas Operacionais
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Desempenho da equipe: velocidade, carga de trabalho, tendências e gargalos.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">Tempo Médio Resolução</span>
          </div>
          <p className="text-2xl font-bold">{data.tempoMedioResolucao}d</p>
          <p className="text-[10px] text-muted-foreground">últimos 30 dias</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-muted-foreground">Sem Responsável</span>
          </div>
          <p className={`text-2xl font-bold ${data.semResponsavel > 0 ? 'text-purple-600' : 'text-green-600'}`}>{data.semResponsavel}</p>
          <p className="text-[10px] text-muted-foreground">tarefas abertas</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-muted-foreground">Escalamentos/Mês</span>
          </div>
          <p className="text-2xl font-bold">{data.escalamentosMes}</p>
          <p className="text-[10px] text-muted-foreground">mês atual</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground">Compliance Rede</span>
          </div>
          <p className="text-2xl font-bold">
            {data.tendenciaCompliance.length > 0
              ? `${data.tendenciaCompliance[data.tendenciaCompliance.length - 1]!.indice}%`
              : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">último mês</p>
        </div>
      </div>

      {/* Gráficos */}
      <MetricasCharts
        taxaResolucao={data.taxaResolucao}
        cargaPorAnalista={data.cargaPorAnalista}
        tendenciaCompliance={data.tendenciaCompliance}
        pendenciasPorModulo={data.pendenciasPorModulo}
      />
    </div>
  )
}
