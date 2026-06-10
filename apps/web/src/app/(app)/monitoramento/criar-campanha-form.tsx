'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarCampanhaAction } from './actions'

export function CriarCampanhaForm() {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarCampanhaAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      + Nova Campanha
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Nova Campanha de Monitoramento</h2>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-sm">Cancelar</button>
      </div>
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="empreendimentoId" value="" />

        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo *</label>
          <select name="tipo" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            <option value="SOLO">Solo</option>
            <option value="AGUA_SUBTERRANEA">Água Subterrânea</option>
            <option value="VAPOR">Vapor do Solo</option>
            <option value="AR">Ar Interno</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Coleta *</label>
          <input name="dataColeta" type="date" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Laboratório *</label>
          <input name="laboratorio" required placeholder="Nome do laboratório" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Resultado *</label>
          <select name="resultado" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            <option value="CONFORME">Conforme</option>
            <option value="ATENCAO">Atenção</option>
            <option value="NAO_CONFORME">Não Conforme</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Observações</label>
          <input name="observacoes" placeholder="Ex: parâmetros críticos detectados, próxima campanha em..." className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Salvar Campanha'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
