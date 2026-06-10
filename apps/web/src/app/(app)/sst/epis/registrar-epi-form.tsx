'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { registrarEPIAction } from './actions'

interface Props {
  empreendimentos: { id: string; nome: string }[]
  funcionarios: { id: string; nome: string; empreendimentoId: string }[]
}

const tiposEPI = [
  'Calçado de Segurança', 'Luva Nitrílica', 'Luva Raspa', 'Óculos de Proteção',
  'Protetor Auricular', 'Capacete', 'Avental Impermeável', 'Máscara PFF2',
  'Capa de Chuva', 'Cinto de Segurança', 'Protetor Facial', 'Outros',
]

export function RegistrarEPIForm({ empreendimentos, funcionarios }: Props) {
  const [aberto, setAberto] = useState(false)
  const [empSel, setEmpSel] = useState('')
  const [state, action, pending] = useActionState(registrarEPIAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  const funcFiltrados = empSel
    ? funcionarios.filter((f) => f.empreendimentoId === empSel)
    : funcionarios

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      + Registrar Entrega
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Registrar Entrega de EPI</h2>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-xs">Cancelar</button>
      </div>
      <form action={action} className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">Empreendimento *</label>
          <select name="empreendimentoId" required value={empSel} onChange={(e) => setEmpSel(e.target.value)} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {empreendimentos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Funcionário *</label>
          <select name="funcionarioId" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {funcFiltrados.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Tipo de EPI *</label>
          <select name="tipoEPI" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {tiposEPI.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Nº CA (Certificado de Aprovação)</label>
          <input name="ca" placeholder="Ex: 12345" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Quantidade</label>
          <input name="quantidade" type="number" min={1} defaultValue={1} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Data de Entrega *</label>
          <input name="dataEntrega" type="date" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Data de Vencimento</label>
          <input name="dataVencimento" type="date" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Observações</label>
          <input name="observacoes" placeholder="Tamanho, cor, etc." className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-xs text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Registrar Entrega'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
