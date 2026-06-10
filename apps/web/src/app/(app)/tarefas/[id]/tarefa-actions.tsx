'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { iniciarTarefaAction, concluirTarefaAction, cancelarTarefaAction } from '../actions'
import { toast } from '@/hooks/use-toast'

interface Props {
  tarefaId: string
  status: string
}

export function TarefaActions({ tarefaId, status }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showConcluir, setShowConcluir] = useState(false)
  const [showCancelar, setShowCancelar] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [motivo, setMotivo] = useState('')

  function handle(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await fn()
      if (res.error) {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' })
      } else {
        toast({ title: 'Atualizado com sucesso', variant: 'success' })
        router.refresh()
      }
    })
  }

  const podeIniciar = status === 'PENDENTE'
  const podeConcluir = status === 'EM_ANDAMENTO' || status === 'PENDENTE'
  const podeCancelar = !['CONCLUIDA', 'CANCELADA'].includes(status)

  if (!podeIniciar && !podeConcluir && !podeCancelar) return null

  return (
    <>
      <div className="flex items-center gap-2">
        {podeIniciar && (
          <button
            onClick={() => handle(() => iniciarTarefaAction(tarefaId))}
            disabled={pending}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Iniciar
          </button>
        )}
        {podeConcluir && (
          <button
            onClick={() => setShowConcluir(true)}
            disabled={pending}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Concluir
          </button>
        )}
        {podeCancelar && (
          <button
            onClick={() => setShowCancelar(true)}
            disabled={pending}
            className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>

      {showConcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold">Concluir Tarefa</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Descreva o que foi realizado..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowConcluir(false); setObservacoes('') }}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowConcluir(false)
                  handle(() => concluirTarefaAction(tarefaId, observacoes || undefined))
                  setObservacoes('')
                }}
                disabled={pending}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Confirmar conclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold">Cancelar Tarefa</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Motivo <span className="text-red-500">*</span></label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Informe o motivo do cancelamento..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCancelar(false); setMotivo('') }}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (!motivo.trim()) return
                  setShowCancelar(false)
                  handle(() => cancelarTarefaAction(tarefaId, motivo))
                  setMotivo('')
                }}
                disabled={!motivo.trim() || pending}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
