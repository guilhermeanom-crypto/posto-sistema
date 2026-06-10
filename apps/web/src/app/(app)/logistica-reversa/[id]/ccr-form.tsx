'use client'

import { useActionState } from 'react'
import { criarCCRAction } from './ccr-actions'

interface Props {
  mtrId: string
  residuos: string[]
}

export function CCRForm({ mtrId, residuos }: Props) {
  const [state, action, pending] = useActionState(criarCCRAction, null)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="mtrId" value={mtrId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">Tipo de resíduo *</label>
          <select
            name="tipoResiduo"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione...</option>
            {residuos.length > 0
              ? residuos.map((r) => <option key={r} value={r}>{r}</option>)
              : <option value="OUTROS">OUTROS</option>
            }
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Quantidade (kg) *</label>
          <input
            name="quantidadeKg"
            type="number"
            step="0.001"
            min="0"
            required
            placeholder="0.000"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Destinador *</label>
          <input
            name="destinador"
            type="text"
            required
            placeholder="Razão social"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">CNPJ destinador</label>
          <input
            name="cnpjDestinador"
            type="text"
            placeholder="00.000.000/0000-00"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Data destinação *</label>
          <input
            name="dataDestinacao"
            type="date"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Nº CCR</label>
          <input
            name="numeroCCR"
            type="text"
            placeholder="Opcional"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium">Tecnologia de uso</label>
          <select
            name="tecnologiaUso"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Não informado</option>
            <option value="COPROCESSAMENTO">Coprocessamento</option>
            <option value="RECICLAGEM">Reciclagem</option>
            <option value="INCINERACAO">Incineração</option>
            <option value="ATERRO">Aterro Industrial</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Salvando...' : 'Registrar CCR'}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-emerald-600">CCR registrado.</p>}
      </div>
    </form>
  )
}
