'use client'

import { useActionState } from 'react'
import { upsertLimiteAction } from './actions'

const parametrosComuns = [
  'Benzeno', 'Tolueno', 'Etilbenzeno', 'Xileno (total)',
  'TPH (GRO)', 'TPH (DRO)', 'Naftaleno',
  'Antraceno', 'Benzo[a]pireno', 'Chumbo', 'Cádmio', 'Cromo total',
  'Arsênio', 'Mercúrio',
]

export function LimiteForm() {
  const [state, action, pending] = useActionState(upsertLimiteAction, null)

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">Parâmetro *</label>
        <input
          list="parametros-list"
          name="nomeParametro"
          required
          placeholder="ex: Benzeno"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <datalist id="parametros-list">
          {parametrosComuns.map((p) => <option key={p} value={p} />)}
        </datalist>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Meio *</label>
        <select
          name="tipoMedio"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecione...</option>
          <option value="SOLO">Solo</option>
          <option value="AGUA_SUBTERRANEA">Água Subterrânea</option>
          <option value="VAPOR">Vapor Solo</option>
          <option value="AR">Ar</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Limite VMP *</label>
        <input
          name="limiteVMP"
          type="number"
          step="any"
          min="0"
          required
          placeholder="0.000"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Unidade *</label>
        <input
          list="unidades-list"
          name="unidade"
          required
          placeholder="mg/kg ou μg/L"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <datalist id="unidades-list">
          {['mg/kg', 'mg/L', 'μg/L', 'μg/m³', '%'].map((u) => <option key={u} value={u} />)}
        </datalist>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Referência normativa</label>
        <input
          name="referencia"
          type="text"
          placeholder="ex: CONAMA 420/2009"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex items-end">
        <div className="space-y-1 w-full">
          <label className="text-xs font-medium text-transparent select-none">Ação</label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {pending ? 'Salvando...' : 'Salvar limite'}
          </button>
        </div>
      </div>

      {(state?.error || state?.ok) && (
        <div className="sm:col-span-2 lg:col-span-3">
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="text-sm text-emerald-600">Limite salvo.</p>}
        </div>
      )}
    </form>
  )
}
