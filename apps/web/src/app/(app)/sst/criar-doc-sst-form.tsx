'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarDocumentoSSTAction } from './actions'

export function CriarDocSSTForm() {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarDocumentoSSTAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
      + Novo Documento
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Novo Documento SST</h3>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-sm">Cancelar</button>
      </div>
      <form action={action} className="grid gap-3 md:grid-cols-2">
        <input type="hidden" name="empreendimentoId" value="" />

        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo *</label>
          <select name="tipo" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            <option value="PCMSO">PCMSO</option>
            <option value="PPRA">PPRA</option>
            <option value="PGR">PGR</option>
            <option value="LTCAT">LTCAT</option>
            <option value="LAUDO_ERGONOMICO">Laudo Ergonômico</option>
            <option value="PPCI_SST">PPCI</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Responsável</label>
          <input name="responsavel" placeholder="Médico ou engenheiro" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Elaboração</label>
          <input name="dataElaboracao" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Validade</label>
          <input name="dataVencimento" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Observações</label>
          <input name="observacoes" placeholder="Informações complementares..." className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Salvar Documento'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
