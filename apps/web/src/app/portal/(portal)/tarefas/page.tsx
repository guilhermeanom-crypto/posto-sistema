import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { CheckSquare, CheckCircle2, Clock, Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Tarefas' }

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
  prazo: string | null
  origem: string
  criadoEm: string
  responsavel: { id: string; nome: string } | null
}

const PRIORIDADE_CONFIG: Record<string, { label: string; cls: string; dotCls: string }> = {
  CRITICA: { label: 'Crítica', cls: 'text-red-700',    dotCls: 'bg-red-500' },
  ALTA:    { label: 'Alta',    cls: 'text-orange-700', dotCls: 'bg-orange-500' },
  MEDIA:   { label: 'Média',   cls: 'text-yellow-700', dotCls: 'bg-yellow-500' },
  BAIXA:   { label: 'Baixa',   cls: 'text-green-700',  dotCls: 'bg-green-500' },
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDENTE:     { label: 'Pendente',    cls: 'bg-yellow-100 text-yellow-700' },
  EM_ANDAMENTO: { label: 'Em andamento',cls: 'bg-blue-100 text-blue-700' },
}

function diasAte(iso: string): number {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(iso); alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86_400_000)
}

function prazoLabel(iso: string | null) {
  if (!iso) return null
  const d = diasAte(iso)
  const fmt = new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  if (d < 0)  return { text: `Venceu há ${Math.abs(d)}d`,  cls: 'text-red-600 font-semibold' }
  if (d === 0) return { text: 'Vence hoje',                 cls: 'text-red-600 font-semibold' }
  if (d <= 7)  return { text: `${fmt} (${d}d)`,             cls: 'text-orange-600 font-medium' }
  return       { text: fmt,                                  cls: 'text-muted-foreground' }
}

const PRIORIDADE_ORDER = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']

export default async function PortalTarefasPage() {
  const token = await getAccessToken()

  let tarefas: Tarefa[] = []

  if (token) {
    try {
      const res = await api.get<{ data: Tarefa[] }>('/portal/tarefas', token)
      tarefas = res.data
    } catch { /* exibe vazio */ }
  }

  // Ordena por prioridade depois por prazo
  const sorted = [...tarefas].sort((a, b) => {
    const pi = PRIORIDADE_ORDER.indexOf(a.prioridade)
    const pj = PRIORIDADE_ORDER.indexOf(b.prioridade)
    if (pi !== pj) return pi - pj
    if (!a.prazo && !b.prazo) return 0
    if (!a.prazo) return 1
    if (!b.prazo) return -1
    return new Date(a.prazo).getTime() - new Date(b.prazo).getTime()
  })

  const vencidas = sorted.filter((t) => t.prazo && diasAte(t.prazo) < 0)
  const urgentes = sorted.filter((t) => t.prazo && diasAte(t.prazo) >= 0 && diasAte(t.prazo) <= 7)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Tarefas
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {sorted.length} tarefa{sorted.length !== 1 ? 's' : ''} pendente{sorted.length !== 1 ? 's' : ''}
          {vencidas.length > 0 && (
            <span className="ml-2 text-red-600 font-medium">· {vencidas.length} vencida{vencidas.length !== 1 ? 's' : ''}</span>
          )}
          {urgentes.length > 0 && (
            <span className="ml-2 text-orange-600 font-medium">· {urgentes.length} urgente{urgentes.length !== 1 ? 's' : ''}</span>
          )}
        </p>
      </div>

      {/* Sem tarefas */}
      {sorted.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
          <p className="font-semibold text-foreground">Nenhuma tarefa pendente</p>
          <p className="text-sm text-muted-foreground">Você está em dia com todas as suas responsabilidades.</p>
        </div>
      )}

      {/* Lista */}
      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((tarefa) => {
            const prio = PRIORIDADE_CONFIG[tarefa.prioridade] ?? PRIORIDADE_CONFIG['BAIXA']!
            const status = STATUS_CONFIG[tarefa.status]
            const prazo = prazoLabel(tarefa.prazo)
            const vencida = tarefa.prazo && diasAte(tarefa.prazo) < 0

            return (
              <div
                key={tarefa.id}
                className={`rounded-xl border bg-card p-4 space-y-2.5 ${vencida ? 'border-red-200' : ''}`}
              >
                {/* Linha 1: título + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 mt-0.5 ${prio.dotCls}`} />
                    <p className="text-sm font-semibold text-foreground leading-snug">{tarefa.titulo}</p>
                  </div>
                  {status && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.cls}`}>
                      {status.label}
                    </span>
                  )}
                </div>

                {/* Descrição */}
                {tarefa.descricao && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {tarefa.descricao}
                  </p>
                )}

                {/* Linha 2: prioridade + prazo */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${prio.cls}`}>
                      {(tarefa.prioridade === 'CRITICA' || tarefa.prioridade === 'ALTA') && (
                        <Zap className="h-3 w-3" />
                      )}
                      {prio.label}
                    </span>
                    {tarefa.origem !== 'MANUAL' && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {tarefa.origem.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    )}
                  </div>
                  {prazo && (
                    <div className={`flex items-center gap-1 text-[10px] ${prazo.cls}`}>
                      <Clock className="h-3 w-3" />
                      {prazo.text}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Instrução */}
      {sorted.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Para concluir uma tarefa, entre em contato com seu consultor Hábilis
          ou aguarde a atualização pelo sistema.
        </p>
      )}
    </div>
  )
}
