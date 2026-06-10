'use client'

import { useFormStatus } from 'react-dom'
import { ArrowRight, Loader2 } from 'lucide-react'

export function EmitirPropostaButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white ${
        disabled || pending
          ? 'cursor-not-allowed bg-orange-400/70'
          : 'bg-orange-500 hover:bg-orange-600'
      }`}
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Emitindo proposta...
        </>
      ) : (
        <>
          Emitir proposta
          <ArrowRight className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  )
}
