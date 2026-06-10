'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarExigenciaAction } from '../actions'

const tipoResiduoOptions = [
  'OLEO_LUBRIFICANTE', 'FILTRO_OLEO', 'EMBALAGEM_CONTAMINADA', 'EFLUENTE',
  'LODO_CAIXA_SEPARADORA', 'SOLO_CONTAMINADO', 'RESIDUO_RECICLAVEL', 'RESIDUO_COMUM', 'OUTROS',
]

const periodicidadeOptions = [
  { value: 'UNICA', label: 'Única' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'BIENAL', label: 'Bienal' },
]

export function ExigenciaForm({ pgrsId }: { pgrsId: string }) {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarExigenciaAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      + Nova Exigência
    </button>
  )

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Cadastrar Exigência</h3>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-xs">Cancelar</button>
      </div>
      <form action={action} className="grid gap-3 md:grid-cols-2">
        <input type="hidden" name="pgrsId" value={pgrsId} />

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium">Descrição da Exigência *</label>
          <input name="descricao" required placeholder="Ex: Coleta mensal de óleo lubrificante usado" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Tipo de Resíduo *</label>
          <select name="tipoResiduo" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {tipoResiduoOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Periodicidade *</label>
          <select name="periodicidade" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {periodicidadeOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Prazo Comprovação (dias) *</label>
          <input name="prazoComprovacaoDias" type="number" required min={1} defaultValue={30} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-xs text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Cadastrar Exigência'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
