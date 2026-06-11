'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { criarProcessoAction } from '../actions'
import { toast } from '@/hooks/use-toast'

interface Props {
  empreendimentos: any[]
  tiposProcesso: any[]
  usuarios: any[]
}

export function NovoProcessoForm({ empreendimentos, tiposProcesso, usuarios }: Props) {
  const [state, action, pending] = useActionState(criarProcessoAction, null)
  const [tipoSelecionado, setTipoSelecionado] = useState<any>(null)

  function handleTipoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tipo = tiposProcesso.find((t) => t.id === e.target.value) ?? null
    setTipoSelecionado(tipo)
  }

  if (state?.error) {
    toast({ title: 'Erro ao criar processo', description: state.error, variant: 'destructive' })
  }

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-card p-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="empreendimentoId" className="text-sm font-medium">
          Empreendimento <span className="text-red-500">*</span>
        </label>
        <select
          id="empreendimentoId"
          name="empreendimentoId"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecione um empreendimento</option>
          {empreendimentos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome} — {e.cidade}/{e.estado}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tipoProcessoId" className="text-sm font-medium">
          Tipo de Processo <span className="text-red-500">*</span>
        </label>
        <select
          id="tipoProcessoId"
          name="tipoProcessoId"
          required
          onChange={handleTipoChange}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecione o tipo de processo</option>
          {tiposProcesso.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} {t.orgao ? `— ${t.orgao.sigla}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* orgaoId hidden — preenchido a partir do tipo de processo selecionado */}
      <input
        type="hidden"
        name="orgaoId"
        value={tipoSelecionado?.orgaoId ?? tipoSelecionado?.orgao?.id ?? ''}
      />

      {tipoSelecionado?.orgao && (
        <p className="text-xs text-muted-foreground -mt-3">
          Órgão responsável: <strong>{tipoSelecionado.orgao.nome}</strong> ({tipoSelecionado.orgao.esfera})
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="dataAbertura" className="text-sm font-medium">
            Data de Abertura
          </label>
          <input
            type="date"
            id="dataAbertura"
            name="dataAbertura"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dataVencimento" className="text-sm font-medium">
            Data de Vencimento
          </label>
          <input
            type="date"
            id="dataVencimento"
            name="dataVencimento"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="responsavelId" className="text-sm font-medium">
          Responsável
        </label>
        <select
          id="responsavelId"
          name="responsavelId"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Sem responsável definido</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="observacoes" className="text-sm font-medium">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          placeholder="Informações adicionais sobre o processo..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Link
          href="/processos"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Criando...' : 'Criar Processo'}
        </button>
      </div>
    </form>
  )
}
