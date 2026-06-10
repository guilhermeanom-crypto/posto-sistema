'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarBombaAction } from './actions'

export function CriarBombaForm() {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarBombaAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      + Nova Bomba
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Nova Bomba de Abastecimento</h2>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-sm">Cancelar</button>
      </div>
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="empreendimentoId" value="" />

        <div className="space-y-1">
          <label className="text-sm font-medium">Número do Bico *</label>
          <input name="numero" type="number" required min="1" placeholder="1" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Fabricante *</label>
          <input name="fabricante" required placeholder="Ex: Gilbarco, Wayne..." className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Modelo</label>
          <input name="modelo" placeholder="Modelo opcional" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Nº de Série</label>
          <input name="numeroDeSerie" placeholder="Número de série" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Combustíveis * <span className="text-muted-foreground font-normal">(separados por vírgula)</span></label>
          <input name="combustiveis" required placeholder="Ex: Gasolina, Etanol, Diesel" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Última Calibração INMETRO</label>
          <input name="ultimaCalibracao" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Próxima Calibração</label>
          <input name="proximaCalibracao" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Observações</label>
          <input name="observacoes" placeholder="Observações opcionais..." className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Salvar Bomba'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
