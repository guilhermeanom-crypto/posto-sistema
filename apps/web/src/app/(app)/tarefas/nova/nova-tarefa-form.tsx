'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarTarefaAction } from './actions'

interface Props {
  empreendimentos: { id: string; nome: string }[]
  usuarios: { id: string; nome: string }[]
}

const prioridadeOptions = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
]

export function NovaTarefaForm({ empreendimentos, usuarios }: Props) {
  const [state, action, pending] = useActionState(criarTarefaAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.push('/tarefas')
  }, [state, router])

  return (
    <form action={action} className="rounded-lg border bg-card p-5 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Título *</label>
          <input name="titulo" required placeholder="Descreva a tarefa..." className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Descrição</label>
          <textarea name="descricao" rows={3} placeholder="Detalhes adicionais..." className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Empreendimento *</label>
          <select name="empreendimentoId" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {empreendimentos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Responsável</label>
          <select name="responsavelId" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Sem responsável</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Prioridade *</label>
          <select name="prioridade" required defaultValue="MEDIA" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {prioridadeOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data Limite</label>
          <input name="dataVencimento" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {pending ? 'Criando...' : 'Criar Tarefa'}
        </button>
        <button type="button" onClick={() => router.push('/tarefas')} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
      </div>
    </form>
  )
}
