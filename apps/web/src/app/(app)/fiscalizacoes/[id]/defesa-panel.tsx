'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Defesa {
  id: string
  rascunhoIA: string
  revisaoHumana: string | null
  status: string
  geradoEm: string
}

interface DefesaPanelProps {
  autoId: string
  defesas: Defesa[]
}

const statusColor: Record<string, string> = {
  RASCUNHO: 'bg-yellow-100 text-yellow-800',
  REVISADO: 'bg-blue-100 text-blue-800',
  ENVIADO: 'bg-green-100 text-green-800',
}

export function DefesaPanel({ autoId, defesas }: DefesaPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [expandido, setExpandido] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const router = useRouter()

  async function gerarDefesa() {
    setErro(null)
    setSucesso(false)
    startTransition(async () => {
      const res = await fetch(`/api/ia/autos/${autoId}/gerar-defesa`, { method: 'POST' })
      if (res.ok) {
        setSucesso(true)
        setTimeout(() => { setSucesso(false); router.refresh() }, 3000)
      } else {
        const body = await res.json().catch(() => ({}))
        setErro(body?.error ?? 'Erro ao enfileirar geração de defesa')
      }
    })
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Defesa Técnica — IA</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Rascunho gerado pelo Claude com base nos dados do auto</p>
        </div>
        <button
          onClick={gerarDefesa}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Enfileirando...' : '✦ Gerar Defesa com IA'}
        </button>
      </div>

      {sucesso && (
        <div className="px-4 py-3 text-sm text-green-700 bg-green-50 border-b border-green-100">
          Geração enfileirada. O rascunho aparecerá em instantes — recarregue a página.
        </div>
      )}
      {erro && (
        <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-b border-red-100">{erro}</div>
      )}

      {defesas.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma defesa gerada. Clique em &quot;Gerar Defesa com IA&quot; para criar um rascunho.
        </div>
      ) : (
        <div className="divide-y">
          {defesas.map((d) => (
            <div key={d.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[d.status] ?? 'bg-gray-100'}`}>
                    {d.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Gerado em {new Date(d.geradoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={() => setExpandido(expandido === d.id ? null : d.id)}
                  className="text-xs text-primary hover:underline"
                >
                  {expandido === d.id ? 'Ocultar' : 'Ver rascunho'}
                </button>
              </div>

              {expandido === d.id && (
                <div className="rounded-md border bg-muted/30 p-4">
                  <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">
                    {d.revisaoHumana ?? d.rascunhoIA}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
