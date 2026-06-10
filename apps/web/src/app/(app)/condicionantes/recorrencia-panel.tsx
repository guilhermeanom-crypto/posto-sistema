import Link from 'next/link'
import type { ComponentType } from 'react'
import { Bell, CalendarClock, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface CondicionanteRecorrencia {
  id: string
  descricao: string
  status: string
  periodicidade?: string | null
  proximoVencimento?: string | null
  empreendimento?: { nome?: string | null } | null
}

const recorrentes = new Set(['MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'BIENAL', 'PERSONALIZADA'])

function diasAte(iso?: string | null) {
  if (!iso) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(iso)
  alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000)
}

function scoreCumprimento(condicionantes: CondicionanteRecorrencia[]) {
  if (condicionantes.length === 0) return 0
  const cumpridas = condicionantes.filter((c) => c.status === 'CUMPRIDA').length
  return Math.round((cumpridas / condicionantes.length) * 100)
}

export function RecorrenciaPanel({ condicionantes }: { condicionantes: CondicionanteRecorrencia[] }) {
  const recorrentesAtivas = condicionantes.filter((c) => recorrentes.has(c.periodicidade ?? ''))
  const vencendo = recorrentesAtivas.filter((c) => {
    const dias = diasAte(c.proximoVencimento)
    return dias !== null && dias >= 0 && dias <= 30
  })
  const vencidas = recorrentesAtivas.filter((c) => {
    const dias = diasAte(c.proximoVencimento)
    return dias !== null && dias < 0
  })
  const cumprimento = scoreCumprimento(recorrentesAtivas)

  return (
    <section className="animate-panel-in rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Gestão recorrente de condicionantes</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Obrigações periódicas com alerta de vencimento e acompanhamento de cumprimento.
            </p>
          </div>
        </div>
        <Link
          href="/calendario"
          className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Ver calendário
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric icon={ShieldCheck} label="Recorrentes" value={recorrentesAtivas.length} />
        <Metric icon={Bell} label="Vencendo 30d" value={vencendo.length} tone={vencendo.length > 0 ? 'warning' : 'default'} />
        <Metric icon={Bell} label="Vencidas" value={vencidas.length} tone={vencidas.length > 0 ? 'danger' : 'default'} />
        <Metric icon={TrendingUp} label="Cumprimento" value={`${cumprimento}%`} />
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Saúde da recorrência</p>
          <p className="text-xs font-semibold">{cumprimento}%</p>
        </div>
        <Progress value={cumprimento} />
      </div>

      {(vencendo.length > 0 || vencidas.length > 0) && (
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {[...vencidas, ...vencendo].slice(0, 4).map((item) => {
            const dias = diasAte(item.proximoVencimento)
            const isVencida = dias !== null && dias < 0
            return (
              <div key={item.id} className="rounded-lg border bg-muted/25 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.descricao}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.empreendimento?.nome ?? 'Sem empreendimento'}</p>
                  </div>
                  <Badge variant={isVencida ? 'destructive' : 'warning'}>
                    {isVencida ? 'Vencida' : `${dias}d`}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number | string
  tone?: 'default' | 'warning' | 'danger'
}) {
  const color = {
    default: 'text-primary bg-primary/10',
    warning: 'text-yellow-700 bg-yellow-100',
    danger: 'text-red-700 bg-red-100',
  }[tone]

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  )
}
