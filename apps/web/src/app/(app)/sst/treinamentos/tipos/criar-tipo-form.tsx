'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarTipoAction } from './actions'

const normativas = ['NR-20', 'NR-35', 'NR-10', 'NR-12', 'NR-06', 'NR-07', 'CIPA', 'BRIGADA', 'OUTROS']
const cargosSugeridos = ['Frentista', 'Gerente', 'Operador de Descarga', 'Lubrificador', 'Trocador de Óleo', 'Técnico de Manutenção', 'Todos']

export function CriarTipoForm() {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarTipoAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
      + Novo Tipo
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Cadastrar Tipo de Treinamento</h3>
        <button onClick={() => setAberto(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
      </div>
      <form action={action} className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium">Nome *</label>
          <input name="nome" required placeholder="Ex: Inflamáveis e Combustíveis" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Normativa *</label>
          <select name="normativa" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {normativas.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Carga Horária (h) *</label>
          <input name="cargaHoraria" type="number" min={1} required placeholder="8" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Periodicidade (meses) *</label>
          <input name="periodicidadeMeses" type="number" min={0} required placeholder="12 (0 = única)" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Obrigatório para cargos</label>
          <div className="flex flex-wrap gap-1.5">
            {cargosSugeridos.map((c) => (
              <label key={c} className="flex items-center gap-1 text-xs bg-muted/50 rounded px-2 py-1 cursor-pointer hover:bg-muted">
                <input type="checkbox" name="obrigatorioParaCargos" value={c} className="rounded border-gray-300" />
                {c}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium">Conteúdo Programático (um item por linha)</label>
          <textarea name="conteudo" rows={3} placeholder={"Propriedades dos combustíveis\nPrevenção de incêndios\nProcedimentos de emergência"} className="w-full resize-none rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-xs text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Cadastrar Tipo'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
