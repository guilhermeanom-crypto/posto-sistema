'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { avancarStatusMTRAction } from './actions'

export function StatusMTRActions({ mtrId, nextStatus, nextLabel }: {
  mtrId: string
  nextStatus: string
  nextLabel: string
}) {
  const [pending, start] = useTransition()
  const router = useRouter()

  function avancar() {
    start(async () => {
      await avancarStatusMTRAction(mtrId, nextStatus)
      router.refresh()
    })
  }

  return (
    <button
      onClick={avancar}
      disabled={pending}
      className="inline-flex items-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
    >
      {pending ? 'Atualizando...' : nextLabel}
    </button>
  )
}
