'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const opcoes = [
  { value: 'OK', label: 'OK', cls: 'bg-green-100 text-green-800 hover:bg-green-200' },
  { value: 'ATENCAO', label: 'Atenção', cls: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  { value: 'CRITICO', label: 'Crítico', cls: 'bg-red-100 text-red-800 hover:bg-red-200' },
  { value: 'NA', label: 'N/A', cls: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
]

export function RespostaForm({ execucaoId, itemId }: { execucaoId: string; itemId: string }) {
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  function handleClick(status: string) {
    setErro(null)
    startTransition(async () => {
      const res = await fetch(`/api/portal/checklists/${execucaoId}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const body = await res.json().catch(() => ({}))
        setErro(body?.error ?? 'Erro ao responder')
      }
    })
  }

  return (
    <div className="flex items-center gap-1">
      {opcoes.map((o) => (
        <button
          key={o.value}
          onClick={() => handleClick(o.value)}
          disabled={isPending}
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors disabled:opacity-50 ${o.cls}`}
        >
          {o.label}
        </button>
      ))}
      {erro && <span className="text-[10px] text-red-600 ml-1">{erro}</span>}
    </div>
  )
}
