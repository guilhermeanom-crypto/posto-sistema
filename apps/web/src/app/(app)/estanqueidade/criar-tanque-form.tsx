'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarTanqueAction } from './actions'

export function CriarTanqueForm() {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarTanqueAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      + Novo Tanque
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Novo Tanque</h2>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-sm">Cancelar</button>
      </div>
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="empreendimentoId" value="" />

        <div className="space-y-1">
          <label className="text-sm font-medium">Número do Tanque *</label>
          <input name="numero" type="number" required min="1" placeholder="1" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Capacidade (litros) *</label>
          <input name="capacidadeLitros" type="number" required min="1" placeholder="15000" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Combustível *</label>
          <select name="combustivel" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            <option value="Gasolina Comum">Gasolina Comum</option>
            <option value="Gasolina Aditivada">Gasolina Aditivada</option>
            <option value="Etanol">Etanol</option>
            <option value="Diesel S10">Diesel S10</option>
            <option value="Diesel S500">Diesel S500</option>
            <option value="GNV">GNV</option>
            <option value="Arla 32">Arla 32</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Material / parede</label>
          <select name="materialTanque" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            <option value="ACO_PAREDE_SIMPLES">Aço — parede simples</option>
            <option value="ACO_PAREDE_DUPLA">Aço — parede dupla</option>
            <option value="FIBRA_PAREDE_SIMPLES">Fibra — parede simples</option>
            <option value="FIBRA_PAREDE_DUPLA">Fibra — parede dupla</option>
            <option value="JAQUETADO">Jaquetado</option>
          </select>
          <p className="text-[11px] text-muted-foreground">Parede + idade são o fator nº1 de vazamento (entram no diagnóstico).</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Instalação</label>
          <input name="dataInstalacao" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Observações</label>
          <input name="observacoes" placeholder="Observações opcionais..." className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Salvar Tanque'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
