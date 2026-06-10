'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { solicitarRelatorioAction } from './actions'

const TIPOS = [
  { value: 'COMPLIANCE_GERAL', label: 'Compliance Geral', ext: 'PDF', desc: 'Índice de conformidade por empreendimento' },
  { value: 'VENCIMENTOS', label: 'Vencimentos', ext: 'Excel', desc: 'Processos, documentos e condicionantes vencendo' },
  { value: 'SST', label: 'SST', ext: 'PDF', desc: 'ASOs e treinamentos vencendo nos próximos 90 dias' },
  { value: 'LOGISTICA_REVERSA', label: 'Logística Reversa', ext: 'Excel', desc: 'Metas x realizado por resíduo e ano' },
  { value: 'AUTOS_INFRACAO', label: 'Autuações', ext: 'Excel', desc: 'Autos de infração em aberto com valores' },
]

export function SolicitarRelatorioForm() {
  const [aberto, setAberto] = useState(false)
  const [tipoSel, setTipoSel] = useState('COMPLIANCE_GERAL')
  const [state, action, pending] = useActionState(solicitarRelatorioAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      setAberto(false)
      router.refresh()
    }
  }, [state, router])

  if (!aberto) return (
    <button
      onClick={() => setAberto(true)}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      + Novo Relatório
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Solicitar Relatório</h2>
        <button onClick={() => setAberto(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="tipo" value={tipoSel} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipoSel(t.value)}
              className={`text-left rounded-lg border p-3 transition-colors ${tipoSel === t.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{t.ext}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </button>
          ))}
        </div>

        {tipoSel === 'VENCIMENTOS' && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Horizonte (dias)</label>
            <select name="dias" className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="30">30 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
            </select>
          </div>
        )}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Solicitando...' : 'Gerar Relatório'}
          </button>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
