'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarRecursoAction } from '../actions'

const resultadoOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'FAVORAVEL', label: 'Favorável' },
  { value: 'DESFAVORAVEL', label: 'Desfavorável' },
  { value: 'PARCIALMENTE_FAVORAVEL', label: 'Parcialmente Favorável' },
] as const

interface Props {
  autoId: string
  recursoId: string
  resultadoAtual: string | null
}

export function RecursoResultForm({ autoId, recursoId, resultadoAtual }: Props) {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(atualizarRecursoAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-xs text-primary hover:underline"
      >
        Registrar resultado
      </button>
    )
  }

  return (
    <form action={action} className="mt-2 rounded-md border bg-muted/30 p-3 space-y-2">
      <input type="hidden" name="autoId" value={autoId} />
      <input type="hidden" name="recursoId" value={recursoId} />

      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">Resultado</label>
          <select
            name="resultado"
            defaultValue={resultadoAtual ?? 'PENDENTE'}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {resultadoOptions.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Data do Julgamento</label>
          <input
            name="dataJulgamento"
            type="date"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Observações</label>
        <input
          name="observacoes"
          placeholder="Fundamentação do julgamento..."
          className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Salvando...' : 'Salvar Resultado'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
