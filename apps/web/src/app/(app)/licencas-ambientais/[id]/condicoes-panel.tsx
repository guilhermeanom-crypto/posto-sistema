'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarCondicaoAction } from '../actions'

interface Props {
  licencaId: string
}

export function CondicoesPanel({ licencaId }: Props) {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarCondicaoAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      setAberto(false)
      router.refresh()
    }
  }, [state, router])

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        + Adicionar Condicionante
      </button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Nova Condicionante</h2>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-sm">
          Cancelar
        </button>
      </div>

      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="licencaId" value={licencaId} />

        <div className="space-y-1">
          <label className="text-sm font-medium">Número (opcional)</label>
          <input
            name="numero"
            placeholder="Ex: 1.1"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Prazo</label>
          <input
            name="prazo"
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Descrição *</label>
          <textarea
            name="descricao"
            required
            rows={3}
            placeholder="Descreva a condicionante conforme o texto da licença..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Observações</label>
          <input
            name="observacoes"
            placeholder="Informações complementares..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {state?.error && (
          <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>
        )}

        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Salvando...' : 'Salvar Condicionante'}
          </button>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
