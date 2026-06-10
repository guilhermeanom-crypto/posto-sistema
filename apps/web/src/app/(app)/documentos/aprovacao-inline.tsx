'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { aprovarVersaoAction, reprovarVersaoAction } from './actions'

interface Props {
  documentoId: string
  versaoId: string
  /** tamanho visual — 'sm' para listas, 'md' para detalhe */
  size?: 'sm' | 'md'
}

export function AprovacaoInline({ documentoId, versaoId, size = 'sm' }: Props) {
  const [pending, start] = useTransition()
  const [reprovando, setReprovando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [observacao, setObservacao] = useState('')
  const router = useRouter()

  const px = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'

  async function aprovar() {
    start(async () => {
      const res = await aprovarVersaoAction(documentoId, versaoId)
      if (res.error) setErro(res.error)
      else router.refresh()
    })
  }

  async function reprovar() {
    if (!motivo.trim()) return
    start(async () => {
      const res = await reprovarVersaoAction(documentoId, versaoId, motivo)
      if (res.error) setErro(res.error)
      else { setReprovando(false); setMotivo(''); router.refresh() }
    })
  }

  if (reprovando) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[200px]">
        <input
          autoFocus
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') reprovar(); if (e.key === 'Escape') setReprovando(false) }}
          placeholder="Motivo da reprovação"
          className="rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring w-full"
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => setReprovando(false)}
            className="flex-1 text-xs px-2 py-1 rounded border hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={reprovar}
            disabled={pending || !motivo.trim()}
            className="flex-1 text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {pending ? '...' : 'Confirmar'}
          </button>
        </div>
        {erro && <p className="text-xs text-destructive">{erro}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <input
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Observações da análise (opcional)"
        className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={aprovar}
          disabled={pending}
          className={`rounded font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors ${px}`}
        >
          {pending ? '...' : 'Aprovar'}
        </button>
        <button
          onClick={() => setReprovando(true)}
          disabled={pending}
          className={`rounded font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors ${px}`}
        >
          Reprovar
        </button>
        {erro && <p className="text-xs text-destructive">{erro}</p>}
      </div>
    </div>
  )
}
