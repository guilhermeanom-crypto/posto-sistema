'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarMTRAction } from './actions'

const RESIDUOS_COMUNS = [
  'Óleo lubrificante usado', 'Embalagens de óleo', 'Pneus inservíveis',
  'Baterias/Acumuladores', 'Filtros de óleo', 'Estopas contaminadas',
  'Lâmpadas fluorescentes', 'Resíduos de varrição contaminada',
]

export function CriarMTRForm() {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarMTRAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      + Novo MTR
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Novo MTR — Manifesto de Transporte de Resíduos</h2>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-sm">Cancelar</button>
      </div>
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="empreendimentoId" value="" />

        <div className="space-y-1">
          <label className="text-sm font-medium">Número do MTR</label>
          <input name="numeroMTR" placeholder="Número do manifesto (opcional)" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Emissão *</label>
          <input name="dataEmissao" type="date" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Coleta</label>
          <input name="dataColeta" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo de Resíduo *</label>
          <select name="residuoTipo" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {RESIDUOS_COMUNS.map((r) => <option key={r} value={r}>{r}</option>)}
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Quantidade *</label>
          <input name="residuoQtd" type="number" required min="0.001" step="0.001" placeholder="0.00" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Unidade *</label>
          <select name="residuoUnidade" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="kg">kg</option>
            <option value="t">toneladas</option>
            <option value="L">litros</option>
            <option value="m³">m³</option>
            <option value="un">unidades</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Destinação</label>
          <input name="residuoDestinacao" placeholder="Ex: Co-processamento, Reciclagem, Aterro classe I..." className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Observações</label>
          <input name="observacoes" placeholder="Informações complementares..." className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Salvar MTR'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
