'use client'

import { useActionState } from 'react'
import { atualizarTenantAction, desativarTenantAction } from './actions'

interface Tenant {
  id: string
  nome: string
  plano: string
  status: string
  limiteEmpreendimentos: number
}

export function EditarTenantForm({ tenant }: { tenant: Tenant }) {
  const boundAction = atualizarTenantAction.bind(null, tenant.id)
  const [state, action, pending] = useActionState(boundAction, null)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="nome" className="text-sm font-medium">Nome</label>
          <input
            type="text"
            id="nome"
            name="nome"
            defaultValue={tenant.nome}
            minLength={2}
            maxLength={120}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="limiteEmpreendimentos" className="text-sm font-medium">Limite de empreendimentos</label>
          <input
            type="number"
            id="limiteEmpreendimentos"
            name="limiteEmpreendimentos"
            defaultValue={tenant.limiteEmpreendimentos}
            min={1}
            max={9999}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="plano" className="text-sm font-medium">Plano</label>
          <select
            id="plano"
            name="plano"
            defaultValue={tenant.plano}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="STARTER">Starter</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <select
            id="status"
            name="status"
            defaultValue={tenant.status}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ATIVO">Ativo</option>
            <option value="SUSPENSO">Suspenso</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}

export function BotaoDesativar({ tenantId, nomeAtual }: { tenantId: string; nomeAtual: string }) {
  async function handleClick() {
    if (!confirm(`Desativar permanentemente o tenant "${nomeAtual}"? Esta ação não pode ser desfeita facilmente.`)) return
    await desativarTenantAction(tenantId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
    >
      Desativar tenant
    </button>
  )
}
