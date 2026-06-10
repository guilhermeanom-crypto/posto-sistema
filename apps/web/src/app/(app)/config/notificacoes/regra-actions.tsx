'use client'

import { useTransition } from 'react'
import { toggleRegraAction, deletarRegraAction } from './actions'

export function ToggleRegra({ id, ativo }: { id: string; ativo: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await toggleRegraAction(id, !ativo) })}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        ativo ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
      title={ativo ? 'Desativar regra' : 'Ativar regra'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
          ativo ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function DeletarRegra({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm('Remover esta regra?')) {
          startTransition(async () => { await deletarRegraAction(id) })
        }
      }}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? '…' : 'Remover'}
    </button>
  )
}
