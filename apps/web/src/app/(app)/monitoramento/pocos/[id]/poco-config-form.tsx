'use client'

import { useActionState } from 'react'
import { atualizarPocoAction } from './actions'

interface Props {
  id: string
  periodicidade: string | null
  proximaColeta: string | null
  status: string
  observacoes: string | null
}

export function PocoConfigForm({ id, periodicidade, proximaColeta, status, observacoes }: Props) {
  const [state, action, pending] = useActionState(atualizarPocoAction, null)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Periodicidade</label>
          <select
            name="periodicidade"
            defaultValue={periodicidade ?? ''}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Não configurada</option>
            <option value="MENSAL">Mensal</option>
            <option value="TRIMESTRAL">Trimestral</option>
            <option value="SEMESTRAL">Semestral</option>
            <option value="ANUAL">Anual</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Próxima coleta</label>
          <input
            name="proximaColeta"
            type="date"
            defaultValue={proximaColeta ? proximaColeta.slice(0, 10) : ''}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="DANIFICADO">Danificado</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-3">
          <label className="text-xs font-medium">Observações</label>
          <textarea
            name="observacoes"
            rows={2}
            defaultValue={observacoes ?? ''}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Salvando...' : 'Salvar configuração'}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-emerald-600">Salvo.</p>}
      </div>
    </form>
  )
}
