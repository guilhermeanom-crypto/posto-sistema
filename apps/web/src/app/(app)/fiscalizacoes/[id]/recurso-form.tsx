'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarRecursoAction } from '../actions'

const instanciaLabel: Record<string, string> = {
  PRIMEIRA: '1ª Instância',
  SEGUNDA: '2ª Instância',
  TERCEIRA: '3ª Instância',
  JUDICIAL: 'Judicial',
}

export function RecursoForm({ autoId }: { autoId: string }) {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarRecursoAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      + Interpor Recurso
    </button>
  )

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Interpor Recurso Administrativo</h3>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-xs">Cancelar</button>
      </div>
      <form action={action} className="grid gap-3 md:grid-cols-2">
        <input type="hidden" name="autoId" value={autoId} />

        <div className="space-y-1">
          <label className="text-xs font-medium">Instância *</label>
          <select name="instancia" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {Object.entries(instanciaLabel).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Data do Protocolo *</label>
          <input name="dataProtocolo" type="date" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Número do Protocolo</label>
          <input name="numeroProtocolo" placeholder="Ex: PROT-2024-0001" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Prazo de Resposta</label>
          <input name="prazoResposta" type="date" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium">Observações</label>
          <input name="observacoes" placeholder="Fundamentos do recurso..." className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-xs text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Protocolar Recurso'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
