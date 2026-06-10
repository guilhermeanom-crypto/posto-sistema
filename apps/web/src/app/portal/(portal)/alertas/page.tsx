import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { Bell, AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Alertas' }

interface Alerta {
  id: string
  tipo: string
  nivel: 'CRITICO' | 'ALTO' | 'MEDIO' | 'INFORMATIVO'
  titulo: string
  mensagem: string
  entidadeTipo: string | null
  entidadeId: string | null
  criadoEm: string
}

const NIVEL_CONFIG: Record<string, { label: string; cls: string; textCls: string; icon: React.ElementType }> = {
  CRITICO:     { label: 'Crítico',    cls: 'border-l-red-500 bg-red-50',    textCls: 'text-red-700',    icon: AlertCircle },
  ALTO:        { label: 'Alto',       cls: 'border-l-orange-500 bg-orange-50', textCls: 'text-orange-700', icon: AlertTriangle },
  MEDIO:       { label: 'Médio',      cls: 'border-l-yellow-500 bg-yellow-50', textCls: 'text-yellow-700', icon: AlertTriangle },
  INFORMATIVO: { label: 'Informativo',cls: 'border-l-blue-500 bg-blue-50',   textCls: 'text-blue-700',   icon: Info },
}

const NIVEL_ORDER = ['CRITICO', 'ALTO', 'MEDIO', 'INFORMATIVO']

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function PortalAlertasPage() {
  const token = await getAccessToken()

  let alertas: Alerta[] = []

  if (token) {
    try {
      const res = await api.get<{ data: Alerta[] }>('/portal/alertas', token)
      alertas = res.data
    } catch { /* exibe vazio */ }
  }

  // Agrupa por nível
  const porNivel = NIVEL_ORDER.reduce<Record<string, Alerta[]>>((acc, n) => {
    acc[n] = alertas.filter((a) => a.nivel === n)
    return acc
  }, {})

  const total = alertas.length
  const criticos = porNivel['CRITICO']!.length + porNivel['ALTO']!.length

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Alertas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} alerta{total !== 1 ? 's' : ''} nos últimos 90 dias
            {criticos > 0 && (
              <span className="ml-2 text-red-600 font-medium">· {criticos} requerem atenção</span>
            )}
          </p>
        </div>
      </div>

      {/* Alertas sem dados */}
      {total === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
          <p className="font-semibold text-foreground">Nenhum alerta no momento</p>
          <p className="text-sm text-muted-foreground">Seu posto está em dia com os prazos regulatórios.</p>
        </div>
      )}

      {/* Grupos por nível */}
      {NIVEL_ORDER.map((nivel) => {
        const items = porNivel[nivel]!
        if (items.length === 0) return null
        const cfg = NIVEL_CONFIG[nivel]!
        const Icon = cfg.icon

        return (
          <div key={nivel} className="space-y-2">
            <h2 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${cfg.textCls}`}>
              <Icon className="h-3.5 w-3.5" />
              {cfg.label} ({items.length})
            </h2>

            <div className="space-y-2">
              {items.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`rounded-lg border-l-4 p-4 ${cfg.cls}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm font-semibold leading-snug ${cfg.textCls}`}>
                      {alerta.titulo}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                      {formatData(alerta.criadoEm)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {alerta.mensagem}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Rodapé informativo */}
      {total > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Alertas são gerados automaticamente pelo sistema Hábilis Posto.
          <br />
          Em caso de dúvidas, entre em contato com seu consultor.
        </p>
      )}
    </div>
  )
}
