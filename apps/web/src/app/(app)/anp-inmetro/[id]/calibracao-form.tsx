'use client'

import { useActionState, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { registrarCalibracaoAction } from './actions'

export function CalibracaoForm({ bombaId }: { bombaId: string }) {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(registrarCalibracaoAction, null)
  const hoje = new Date().toISOString().slice(0, 10)
  const em1ano = new Date(); em1ano.setFullYear(em1ano.getFullYear() + 1)

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button type="button" onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold hover:bg-muted/30 transition-colors">
        Registrar nova calibração / aferição
        {aberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {aberto && (
        <form action={action} className="px-5 pb-5 space-y-4 border-t pt-4">
          <input type="hidden" name="bombaId" value={bombaId} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Data da calibração *</label>
              <input name="dataExecucao" type="date" required defaultValue={hoje}
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Próxima calibração *</label>
              <input name="proximaCalibracao" type="date" required defaultValue={em1ano.toISOString().slice(0, 10)}
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Sticker / Nº INMETRO</label>
              <input name="stickerInmetro" placeholder="Ex: 123456/2025"
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          {state?.error && <p className="text-xs text-destructive">{state.error}</p>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAberto(false)}
              className="px-3 py-1.5 text-sm rounded border hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" disabled={pending}
              className="px-4 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {pending ? 'Salvando...' : 'Registrar calibração'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
