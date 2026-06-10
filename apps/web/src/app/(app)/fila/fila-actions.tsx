'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Play, CheckCircle2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

async function atualizarStatus(tarefaId: string, status: string) {
  const response = await fetch(`/api/fila/${tarefaId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body?.error ?? body?.message ?? 'Erro ao atualizar status da tarefa')
  }
}

export function FilaActions({ tarefaId, status }: { tarefaId: string; status: string; temResponsavel: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAction(novoStatus: string) {
    startTransition(async () => {
      try {
        await atualizarStatus(tarefaId, novoStatus)
        toast({ title: 'Status atualizado', variant: 'success' })
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao atualizar status da tarefa'
        toast({ title: 'Falha ao atualizar status', description: message, variant: 'destructive' })
      }
    })
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {status === 'PENDENTE' && (
        <button onClick={() => handleAction('EM_ANDAMENTO')} disabled={isPending}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          title="Iniciar">
          <Play className="h-3 w-3" /> Iniciar
        </button>
      )}
      {(status === 'PENDENTE' || status === 'EM_ANDAMENTO') && (
        <button onClick={() => handleAction('CONCLUIDA')} disabled={isPending}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
          title="Concluir">
          <CheckCircle2 className="h-3 w-3" /> Concluir
        </button>
      )}
    </div>
  )
}
