'use client'

import { useActionState } from 'react'
import { iniciarChecklistAction } from './actions'

interface Props {
  template: { id: string; nome: string; itens: { id: string }[] }
  empreendimentos: { id: string; nome: string; nomeFantasia: string | null }[]
}

export function IniciarChecklistForm({ template, empreendimentos }: Props) {
  const [state, action, pending] = useActionState(iniciarChecklistAction, null)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="templateId" value={template.id} />

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="empreendimentoId">
          Empreendimento
        </label>
        <select
          id="empreendimentoId"
          name="empreendimentoId"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          <option value="">Selecione o empreendimento...</option>
          {empreendimentos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nomeFantasia ?? e.nome}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {template.itens.length} iten{template.itens.length !== 1 ? 's' : 's'} para verificar
      </p>

      {state?.error && (
        <p className="text-sm text-red-600 font-medium">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {pending ? 'Iniciando...' : 'Iniciar checklist'}
      </button>
    </form>
  )
}
