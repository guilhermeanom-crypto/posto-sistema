'use client'

import { useActionState, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { criarLaudoAguaAction } from './actions'

export function LaudoAguaForm({ pocoId }: { pocoId: string }) {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarLaudoAguaAction, null)
  const hoje = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button type="button" onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold hover:bg-muted/30 transition-colors">
        Registrar novo laudo de qualidade
        {aberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {aberto && (
        <form action={action} className="px-5 pb-5 space-y-4 border-t pt-4">
          <input type="hidden" name="pocoId" value={pocoId} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Data da campanha *</label>
              <input name="dataCampanha" type="date" required defaultValue={hoje}
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Laboratório *</label>
              <input name="laboratorio" required placeholder="Nome do laboratório"
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Resultado *</label>
              <select name="resultado" required
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="CONFORME">Conforme</option>
                <option value="ATENCAO">Atenção (parâmetros limítrofes)</option>
                <option value="NAO_CONFORME">Não Conforme</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Observações</label>
            <textarea name="observacoes" rows={2} placeholder="Parâmetros avaliados, ações necessárias..."
              className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>

          {state?.error && <p className="text-xs text-destructive">{state.error}</p>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAberto(false)}
              className="px-3 py-1.5 text-sm rounded border hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" disabled={pending}
              className="px-4 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {pending ? 'Salvando...' : 'Registrar laudo'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
