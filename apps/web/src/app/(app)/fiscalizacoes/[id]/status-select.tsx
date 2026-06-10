'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarStatusAutoAction } from '../actions'

const statusOptions = [
  { value: 'RECEBIDO', label: 'Recebido' },
  { value: 'EM_DEFESA', label: 'Em Defesa' },
  { value: 'AGUARDANDO_JULGAMENTO', label: 'Ag. Julgamento' },
  { value: 'JULGADO_FAVORAVEL', label: 'Julgado Favorável' },
  { value: 'JULGADO_DESFAVORAVEL', label: 'Julgado Desfavorável' },
  { value: 'EM_RECURSO', label: 'Em Recurso' },
  { value: 'ENCERRADO', label: 'Encerrado' },
  { value: 'PAGO', label: 'Pago' },
] as const

export function StatusSelect({ autoId, currentStatus }: { autoId: string; currentStatus: string }) {
  const [state, action, pending] = useActionState(atualizarStatusAutoAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state, router])

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={autoId} />
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-md border bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {statusOptions.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Salvando...' : 'Alterar'}
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  )
}
