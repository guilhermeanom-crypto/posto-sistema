import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Condicionantes' }

interface Condicionante {
  id: string
  descricao: string
  numeroCondicionante: string | null
  tipo: string
  status: string
  periodicidade: string
  prazoCumprimento: string | null
  proximoVencimento: string | null
  evidenciaExigida: string | null
  cumpridaEm: string | null
  criadoEm: string
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  PENDENTE:   { label: 'Pendente',   cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  EM_ANALISE: { label: 'Em Análise', cls: 'bg-blue-100 text-blue-700',     icon: Clock },
  CUMPRIDA:   { label: 'Cumprida',   cls: 'bg-green-100 text-green-800',   icon: CheckCircle2 },
  VENCIDA:    { label: 'Vencida',    cls: 'bg-red-100 text-red-800',       icon: AlertCircle },
  DISPENSADA: { label: 'Dispensada', cls: 'bg-gray-100 text-gray-600',     icon: CheckCircle2 },
}

const TIPO_LABEL: Record<string, string> = {
  DOCUMENTACAO:        'Documentação',
  MONITORAMENTO:       'Monitoramento',
  OBRA:                'Obra',
  COMPENSACAO:         'Compensação',
  TREINAMENTO:         'Treinamento',
  COMUNICACAO_ORGAO:   'Comunicação ao Órgão',
  PAGAMENTO:           'Pagamento',
  OUTROS:              'Outros',
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function diasAte(iso: string): number {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(iso); alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86_400_000)
}

function prazoLabel(iso: string | null) {
  if (!iso) return null
  const d = diasAte(iso)
  const fmt = formatDate(iso)!
  if (d < 0)  return { text: `Venceu há ${Math.abs(d)}d`, cls: 'text-red-600 font-semibold' }
  if (d === 0) return { text: 'Vence hoje',                cls: 'text-red-600 font-semibold' }
  if (d <= 15) return { text: `${fmt} (${d}d)`,            cls: 'text-orange-600 font-medium' }
  return       { text: fmt,                                 cls: 'text-muted-foreground' }
}

export default async function PortalCondicionantesPage() {
  const token = await getAccessToken()

  let condicionantes: Condicionante[] = []

  if (token) {
    try {
      const res = await api.get<{ data: Condicionante[] }>('/portal/condicionantes', token)
      condicionantes = res.data
    } catch { /* exibe vazio */ }
  }

  const pendentes = condicionantes.filter((c) => c.status === 'PENDENTE' || c.status === 'EM_ANALISE')
  const cumpridas = condicionantes.filter((c) => c.status === 'CUMPRIDA')
  const vencidas  = condicionantes.filter((c) => c.status === 'VENCIDA')

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Condicionantes
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {condicionantes.length} condicionante{condicionantes.length !== 1 ? 's' : ''} no total
          {vencidas.length > 0 && (
            <span className="ml-2 text-red-600 font-medium">· {vencidas.length} vencida{vencidas.length !== 1 ? 's' : ''}</span>
          )}
          {pendentes.length > 0 && (
            <span className="ml-2 text-yellow-600 font-medium">· {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}</span>
          )}
          {cumpridas.length > 0 && (
            <span className="ml-2 text-green-700 font-medium">· {cumpridas.length} cumprida{cumpridas.length !== 1 ? 's' : ''}</span>
          )}
        </p>
      </div>

      {/* Vazia */}
      {condicionantes.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
          <p className="font-semibold text-foreground">Nenhuma condicionante cadastrada</p>
          <p className="text-sm text-muted-foreground">Condicionantes de licenças aparecerão aqui quando cadastradas.</p>
        </div>
      )}

      {/* Lista */}
      {condicionantes.length > 0 && (
        <div className="space-y-3">
          {condicionantes.map((c) => {
            const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG['PENDENTE']!
            const StatusIcon = cfg.icon
            const vencimento = c.proximoVencimento ?? c.prazoCumprimento
            const prazo = prazoLabel(vencimento)
            const isVencida = c.status === 'VENCIDA'

            return (
              <div
                key={c.id}
                className={`rounded-xl border bg-card p-4 space-y-2.5 ${isVencida ? 'border-red-200' : ''}`}
              >
                {/* Linha 1: nº + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {c.numeroCondicionante && (
                      <p className="text-[10px] text-muted-foreground mb-0.5">Nº {c.numeroCondicionante}</p>
                    )}
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                      {c.descricao}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.cls}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Evidência exigida */}
                {c.evidenciaExigida && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium">Evidência: </span>{c.evidenciaExigida}
                  </p>
                )}

                {/* Rodapé: tipo + prazo */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      {TIPO_LABEL[c.tipo] ?? c.tipo}
                    </span>
                    {c.periodicidade !== 'UNICA' && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {c.periodicidade.toLowerCase()}
                      </span>
                    )}
                  </div>
                  {prazo && (
                    <div className={`flex items-center gap-1 text-[10px] ${prazo.cls}`}>
                      <Clock className="h-3 w-3" />
                      {prazo.text}
                    </div>
                  )}
                  {c.cumpridaEm && (
                    <p className="text-[10px] text-green-700">
                      Cumprida em {formatDate(c.cumpridaEm)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
