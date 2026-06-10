'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function AnalisarIABtn({ licencaId, analisadoEm }: { licencaId: string; analisadoEm?: string | null }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const router = useRouter()

  async function analisar() {
    setMsg(null)
    startTransition(async () => {
      const res = await fetch(`/api/ia/licencas/${licencaId}/analisar`, { method: 'POST' })
      if (res.ok) {
        setMsg({ tipo: 'ok', texto: 'Análise enfileirada. Recarregue a página em alguns instantes para ver as condicionantes extraídas.' })
        setTimeout(() => router.refresh(), 5000)
      } else {
        const body = await res.json().catch(() => ({}))
        setMsg({ tipo: 'erro', texto: body?.error ?? 'Erro ao enfileirar análise' })
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        onClick={analisar}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Enfileirando...' : '✦ Analisar PDF com IA'}
      </button>
      {analisadoEm && !msg && (
        <p className="text-xs text-muted-foreground">
          Última análise: {new Date(analisadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      {msg && (
        <p className={`text-xs ${msg.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{msg.texto}</p>
      )}
    </div>
  )
}
