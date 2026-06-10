'use client'

import { useTransition, useState, useActionState } from 'react'
import { Check, Plus, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { marcarAlertaLido, criarTarefaDeAlertaAction } from './actions'
import { Badge, nivelAlertaBadge, labelStatus } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/date'
import { cn } from '@/lib/utils'

const tipoAlertaLabel: Record<string, string> = {
  VENCIMENTO_DOCUMENTO: 'Vencimento de documento',
  VENCIMENTO_PROCESSO: 'Vencimento de processo',
  PRAZO_CONDICIONANTE: 'Prazo de condicionante',
  TAREFA_SEM_INICIO: 'Tarefa sem início',
  TAREFA_ATRASADA: 'Tarefa atrasada',
  DOCUMENTO_REJEITADO: 'Documento rejeitado',
  NOVO_REQUISITO: 'Novo requisito',
  TAREFA_ATRIBUIDA: 'Tarefa atribuída',
  COMPLIANCE_CRITICO: 'Compliance crítico',
  COMPLIANCE_ATENCAO: 'Compliance em atenção',
  ESCALONAMENTO_TAREFA: 'Escalonamento de tarefa',
}

interface AlertaItemProps {
  alerta: {
    id: string
    tipo: string
    nivel: string
    titulo: string
    mensagem: string
    lido: boolean
    criadoEm: string
    referenciaHref?: string | null
    empreendimento?: { id?: string; nome: string } | null
  }
}

function CriarTarefaForm({ alertaId, titulo, empreendimentoId, onClose }: {
  alertaId: string
  titulo: string
  empreendimentoId?: string
  onClose: () => void
}) {
  const hoje = new Date().toISOString().slice(0, 10)
  const [state, action, pending] = useActionState(criarTarefaDeAlertaAction, null)

  if (state === null && !pending) {
    // success path handled by revalidatePath — form stays mounted until onClose
  }

  return (
    <form
      action={action}
      onSubmit={() => { /* after submit success, close */ }}
      className="mt-2 rounded border bg-muted/30 p-3 space-y-2"
    >
      <input type="hidden" name="alertaId" value={alertaId} />
      {empreendimentoId && <input type="hidden" name="empreendimentoId" value={empreendimentoId} />}

      <div className="flex gap-2">
        <input
          name="titulo"
          defaultValue={titulo}
          required
          placeholder="Título da tarefa"
          className="flex-1 rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <input
          name="dataVencimento"
          type="date"
          defaultValue={hoje}
          required
          className="rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-1.5 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-2 py-1 text-xs rounded border hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {pending ? '...' : 'Criar tarefa'}
        </button>
      </div>
    </form>
  )
}

export function AlertaItem({ alerta }: AlertaItemProps) {
  const [pending, startTransition] = useTransition()
  const [criandoTarefa, setCriandoTarefa] = useState(false)

  return (
    <div className={cn('flex items-start gap-4 px-4 py-4 transition-colors', !alerta.lido && 'bg-primary/5')}>
      {/* Indicador não lido */}
      <div className="mt-1.5 flex-shrink-0">
        {!alerta.lido && <div className="h-2 w-2 rounded-full bg-primary" />}
        {alerta.lido && <div className="h-2 w-2 rounded-full bg-transparent" />}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={nivelAlertaBadge(alerta.nivel)}>{labelStatus(alerta.nivel)}</Badge>
              <span className="text-xs text-muted-foreground">{tipoAlertaLabel[alerta.tipo] ?? alerta.tipo}</span>
            </div>
            <p className={cn('mt-1 text-sm', !alerta.lido ? 'font-semibold' : 'font-medium')}>{alerta.titulo}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{alerta.mensagem}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              <span>{formatDateTime(alerta.criadoEm)}</span>
              {alerta.empreendimento && <span>· {alerta.empreendimento.nome}</span>}
              {alerta.referenciaHref && (
                <Link href={alerta.referenciaHref} className="inline-flex items-center gap-0.5 text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  Ver registro
                </Link>
              )}
            </div>

            {/* Criar tarefa form */}
            {criandoTarefa && (
              <CriarTarefaForm
                alertaId={alerta.id}
                titulo={alerta.titulo}
                empreendimentoId={alerta.empreendimento?.id}
                onClose={() => setCriandoTarefa(false)}
              />
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!criandoTarefa && (
              <button
                onClick={() => setCriandoTarefa(true)}
                title="Criar tarefa a partir deste alerta"
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            {criandoTarefa && (
              <button
                onClick={() => setCriandoTarefa(false)}
                title="Cancelar"
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {!alerta.lido && (
              <button
                onClick={() => startTransition(() => marcarAlertaLido(alerta.id))}
                disabled={pending}
                title="Marcar como lido"
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
