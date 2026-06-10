'use client'

import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { enviarMensagemAction } from './actions'
import { Send } from 'lucide-react'

export function MensagemForm() {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const texto = ref.current?.value.trim()
    if (!texto) return
    startTransition(async () => {
      await enviarMensagemAction(texto)
      if (ref.current) ref.current.value = ''
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <textarea
        ref={ref}
        placeholder="Digite sua mensagem..."
        rows={2}
        disabled={isPending}
        className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.form?.requestSubmit()
          }
        }}
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
      >
        <Send className="h-4 w-4" />
        {isPending ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  )
}
