'use client'

import { useActionState, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { criarTesteAction } from './actions'

const resultados = [
  { value: 'APROVADO',    label: 'Aprovado' },
  { value: 'REPROVADO',   label: 'Reprovado' },
  { value: 'INCONCLUSIVO',label: 'Inconclusivo' },
]

const metodos = ['Vácuo', 'Pressão', 'Hidrostático', 'Pneumático', 'Outro']

function proximoTesteDefault(resultado: string): string {
  const base = new Date()
  // APROVADO → +1 ano | REPROVADO/INCONCLUSIVO → +3 meses
  if (resultado === 'APROVADO') base.setFullYear(base.getFullYear() + 1)
  else base.setMonth(base.getMonth() + 3)
  return base.toISOString().slice(0, 10)
}

export function LaudoForm({ tanqueId }: { tanqueId: string }) {
  const [aberto, setAberto] = useState(false)
  const [resultado, setResultado] = useState('APROVADO')
  const [state, action, pending] = useActionState(criarTesteAction, null)
  const hoje = new Date().toISOString().slice(0, 10)

  if (state === null && !pending && aberto) {
    // fechado após sucesso seria ideal, mas useActionState não tem callback
    // o revalidatePath já atualiza a lista
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold hover:bg-muted/30 transition-colors"
      >
        Registrar novo laudo de ensaio
        {aberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {aberto && (
        <form action={action} className="px-5 pb-5 space-y-4 border-t pt-4">
          <input type="hidden" name="tanqueId" value={tanqueId} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Empresa executora *</label>
              <input name="empresa" required placeholder="Razão social / nome"
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Responsável técnico</label>
              <input name="responsavel" placeholder="Nome do RT"
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Data de execução *</label>
              <input name="dataExecucao" type="date" required defaultValue={hoje}
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Método</label>
              <select name="metodo" className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Não informado</option>
                {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Resultado *</label>
              <select name="resultado" value={resultado} onChange={(e) => setResultado(e.target.value)}
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {resultados.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Próximo ensaio *</label>
              <input name="proximoTeste" type="date" required defaultValue={proximoTesteDefault(resultado)}
                key={resultado}
                className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          {resultado === 'REPROVADO' && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              <strong>Resultado REPROVADO:</strong> registre a ação corretiva tomada nas observações.
              Uma tarefa de alta prioridade será sugerida.
            </div>
          )}

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Observações</label>
            <textarea name="observacoes" rows={2} placeholder="Ação corretiva, condições do ensaio..."
              className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>

          {state?.error && <p className="text-xs text-destructive">{state.error}</p>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAberto(false)}
              className="px-3 py-1.5 text-sm rounded border hover:bg-muted transition-colors">
              Cancelar
            </button>
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
