'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cumprirCondicionanteAction, dispensarCondicionanteAction } from '../actions'
import { toast } from '@/hooks/use-toast'

interface Props {
  condicionanteId: string
  status: string
}

export function CondicionanteActions({ condicionanteId, status }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showCumprir, setShowCumprir] = useState(false)
  const [showDispensar, setShowDispensar] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [motivo, setMotivo] = useState('')

  function handle(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await fn()
      if (res.error) {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' })
      } else {
        toast({ title: 'Condicionante atualizada', variant: 'success' })
        router.refresh()
      }
    })
  }

  const dispensada = status === 'DISPENSADA'
  if (dispensada) return null

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowCumprir(true)}
          disabled={pending}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          Registrar Cumprimento
        </button>
        <button
          onClick={() => setShowDispensar(true)}
          disabled={pending}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          Dispensar
        </button>
      </div>

      {showCumprir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold">Registrar Cumprimento</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Descreva como foi cumprida..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCumprir(false); setObservacoes('') }}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowCumprir(false)
                  handle(() => cumprirCondicionanteAction(condicionanteId, observacoes || undefined))
                  setObservacoes('')
                }}
                disabled={pending}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDispensar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold">Dispensar Condicionante</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Motivo <span className="text-red-500">*</span></label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Justificativa para a dispensa..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowDispensar(false); setMotivo('') }}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!motivo.trim()) return
                  setShowDispensar(false)
                  handle(() => dispensarCondicionanteAction(condicionanteId, motivo))
                  setMotivo('')
                }}
                disabled={!motivo.trim() || pending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Confirmar dispensa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
