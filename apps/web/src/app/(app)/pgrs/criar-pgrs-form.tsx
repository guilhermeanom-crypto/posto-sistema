'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarPGRSAction } from './actions'

interface Props {
  empreendimentos: { id: string; nome: string }[]
}

export function CriarPGRSForm({ empreendimentos }: Props) {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarPGRSAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      + Novo PGRS
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Cadastrar Novo PGRS</h2>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-xs">Cancelar</button>
      </div>
      <form action={action} className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">Empreendimento *</label>
          <select name="empreendimentoId" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {empreendimentos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Versão *</label>
          <input name="versao" required placeholder="Ex: 2024-v1" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Responsável Técnico *</label>
          <input name="responsavelTecnico" required placeholder="Nome do RT" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">ART Número</label>
          <input name="artNumero" placeholder="Ex: 12345678" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Data Aprovação *</label>
          <input name="dataAprovacao" type="date" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Data Vencimento *</label>
          <input name="dataVencimento" type="date" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium">Observações</label>
          <input name="observacoes" placeholder="Observações gerais..." className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-xs text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Cadastrar PGRS'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
