'use client'

import { useActionState } from 'react'
import { upsertMetaAction } from './actions'

interface Props {
  empreendimentos: { id: string; nome: string; nomeFantasia: string | null }[]
  anoAtual: number
  tiposResiduo: string[]
}

function tipoLabel(tipo: string) {
  return tipo.replace(/_/g, ' ')
}

export function MetasForm({ empreendimentos, anoAtual, tiposResiduo }: Props) {
  const [state, action, pending] = useActionState(upsertMetaAction, null)

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="empreendimentoId">Empreendimento *</label>
        <select
          id="empreendimentoId"
          name="empreendimentoId"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecione...</option>
          {empreendimentos.map((e) => (
            <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.nome}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="ano">Ano *</label>
        <select
          id="ano"
          name="ano"
          defaultValue={String(anoAtual)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {[anoAtual + 1, anoAtual, anoAtual - 1].map((a) => (
            <option key={a} value={String(a)}>{a}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="tipoResiduo">Tipo de resíduo *</label>
        <select
          id="tipoResiduo"
          name="tipoResiduo"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecione...</option>
          {tiposResiduo.map((t) => (
            <option key={t} value={t}>{tipoLabel(t)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="metaQuantidade">Meta *</label>
        <input
          id="metaQuantidade"
          name="metaQuantidade"
          type="number"
          step="0.001"
          min="0"
          required
          placeholder="0"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="unidade">Unidade *</label>
        <select
          id="unidade"
          name="unidade"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="KG">KG</option>
          <option value="LITRO">LITRO</option>
          <option value="UNIDADE">UNIDADE</option>
          <option value="TON">TON</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="observacoes">Observações</label>
        <input
          id="observacoes"
          name="observacoes"
          type="text"
          placeholder="Opcional"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Salvando...' : 'Salvar meta'}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-emerald-600">Meta salva com sucesso.</p>}
      </div>
    </form>
  )
}
