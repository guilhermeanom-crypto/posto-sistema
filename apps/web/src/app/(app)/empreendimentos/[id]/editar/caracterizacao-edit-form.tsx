'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { atualizarCaracterizacaoAction } from './actions'
import { CaracterizacaoFields, type CaracterizacaoValues } from '../../caracterizacao-fields'

export function CaracterizacaoEditForm({
  empreendimentoId,
  values,
}: {
  empreendimentoId: string
  values: CaracterizacaoValues
}) {
  const [state, action, pending] = useActionState(atualizarCaracterizacaoAction, null)

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <input type="hidden" name="empreendimentoId" value={empreendimentoId} />

      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-base">Caracterização regulatória</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estes dados alimentam o diagnóstico. Ao salvar, o sistema recalcula automaticamente.
            Deixe em branco o que não souber — a estimativa é conservadora.
          </p>
        </div>
        <CaracterizacaoFields values={values} />
      </section>

      <div className="flex items-center justify-between">
        <Link
          href={`/empreendimentos/${empreendimentoId}`}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Salvando…' : 'Salvar e recalcular diagnóstico →'}
        </button>
      </div>
    </form>
  )
}
