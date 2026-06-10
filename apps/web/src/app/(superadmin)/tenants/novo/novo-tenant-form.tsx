'use client'

import { useActionState } from 'react'
import { criarTenantAction } from './actions'

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export function NovoTenantForm() {
  const [state, action, pending] = useActionState(criarTenantAction, null)

  // Gerar slug automaticamente ao digitar o nome
  function handleNomeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = document.getElementById('slug') as HTMLInputElement | null
    if (slugInput && !slugInput.dataset.editado) {
      slugInput.value = gerarSlug(e.target.value)
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.dataset.editado = 'true'
    e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
  }

  return (
    <form action={action} className="space-y-6 rounded-lg border bg-card p-6 max-w-2xl">

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {/* Dados do Tenant */}
      <div>
        <p className="text-sm font-semibold mb-4">Dados da Empresa</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="nome" className="text-sm font-medium">
              Nome da empresa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              required
              minLength={2}
              maxLength={120}
              onChange={handleNomeChange}
              placeholder="Ex: Rede Postos Nordeste Ltda"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="slug" className="text-sm font-medium">
              Slug (identificador único) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              minLength={2}
              maxLength={60}
              onChange={handleSlugChange}
              placeholder="rede-postos-nordeste"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Somente letras minúsculas, números e hífens. Gerado automaticamente pelo nome.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="plano" className="text-sm font-medium">
                Plano <span className="text-red-500">*</span>
              </label>
              <select
                id="plano"
                name="plano"
                required
                defaultValue="STARTER"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="limiteEmpreendimentos" className="text-sm font-medium">
                Limite de empreendimentos <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="limiteEmpreendimentos"
                name="limiteEmpreendimentos"
                required
                min={1}
                max={9999}
                defaultValue={100}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Admin Inicial */}
      <div className="border-t pt-6">
        <p className="text-sm font-semibold mb-1">Usuário Administrador Inicial</p>
        <p className="text-xs text-muted-foreground mb-4">
          Este usuário receberá acesso como ADMIN_TENANT e uma senha temporária por e-mail.
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="adminNome" className="text-sm font-medium">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="adminNome"
              name="adminNome"
              required
              minLength={2}
              maxLength={120}
              placeholder="Ex: João Silva"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="adminEmail" className="text-sm font-medium">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              required
              placeholder="admin@empresa.com.br"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Um e-mail de boas-vindas com a senha temporária será enviado automaticamente.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <a
          href="/tenants"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Criando...' : 'Criar Tenant'}
        </button>
      </div>
    </form>
  )
}
