'use client'

import { useState, useTransition } from 'react'
import { criarTarefaAnaliseAction } from './actions'

interface Empreendimento {
  id: string
  nomeFantasia: string | null
  nome: string
}

interface Props {
  publicacaoId: string
  impacto: string | null
  empreendimentos: Empreendimento[]
}

const prioridadeDefault: Record<string, string> = {
  ALTO: 'ALTA',
  MEDIO: 'MEDIA',
  BAIXO: 'BAIXA',
}

export function CriarTarefaButton({ publicacaoId, impacto, empreendimentos }: Props) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (done) {
    return (
      <span className="text-xs text-emerald-600 font-medium">
        Tarefa criada ✓
      </span>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-primary hover:underline"
      >
        + Criar tarefa de análise
      </button>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await criarTarefaAnaliseAction(publicacaoId, fd)
      if (result.error) {
        setError(result.error)
      } else {
        setDone(true)
        setOpen(false)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-md border bg-muted/30 p-3 space-y-2"
    >
      <p className="text-xs font-semibold text-muted-foreground">Nova tarefa de análise</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="block text-xs text-muted-foreground mb-0.5">Empreendimento *</label>
          <select
            name="empreendimentoId"
            required
            className="w-full rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Selecione…</option>
            {empreendimentos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nomeFantasia ?? e.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-0.5">Prioridade</label>
          <select
            name="prioridade"
            defaultValue={prioridadeDefault[impacto ?? ''] ?? 'MEDIA'}
            className="w-full rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-0.5">Prazo (opcional)</label>
          <input
            name="dataVencimento"
            type="date"
            className="w-full rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Criando…' : 'Criar tarefa'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
