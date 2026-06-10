'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { avancarFaseAction, alterarStatusProcessoAction } from '../actions'
import { toast } from '@/hooks/use-toast'

const STATUS_OPCOES = [
  { value: 'EM_ELABORACAO', label: 'Em elaboração' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'EM_EXIGENCIA', label: 'Em exigência' },
  { value: 'EM_RENOVACAO', label: 'Em renovação' },
  { value: 'DEFERIDO', label: 'Deferido' },
  { value: 'INDEFERIDO', label: 'Indeferido' },
  { value: 'ARQUIVADO', label: 'Arquivado' },
  { value: 'SUSPENSO', label: 'Suspenso' },
]

interface Props {
  processoId: string
  statusAtual: string
  temProximaFase: boolean
}

export function ProcessoActions({ processoId, statusAtual, temProximaFase }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [novoStatus, setNovoStatus] = useState('')
  const [motivo, setMotivo] = useState('')

  function handleAvancarFase() {
    startTransition(async () => {
      const res = await avancarFaseAction(processoId)
      if (res.error) {
        toast({ title: 'Erro ao avançar fase', description: res.error, variant: 'destructive' })
      } else {
        toast({ title: 'Fase avançada com sucesso', variant: 'success' })
        router.refresh()
      }
    })
  }

  function handleAlterarStatus() {
    if (!novoStatus) return
    startTransition(async () => {
      const res = await alterarStatusProcessoAction(processoId, novoStatus, motivo || undefined)
      if (res.error) {
        toast({ title: 'Erro ao alterar status', description: res.error, variant: 'destructive' })
      } else {
        toast({ title: 'Status atualizado', variant: 'success' })
        setShowStatusModal(false)
        setNovoStatus('')
        setMotivo('')
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {temProximaFase && (
          <button
            onClick={handleAvancarFase}
            disabled={pending}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {pending ? 'Aguarde...' : 'Avançar Fase →'}
          </button>
        )}
        <button
          onClick={() => setShowStatusModal(true)}
          disabled={pending}
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Alterar Status
        </button>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold">Alterar Status do Processo</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Novo Status</label>
              <select
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {STATUS_OPCOES.filter((s) => s.value !== statusAtual).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observação (opcional)</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Motivo da alteração..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowStatusModal(false); setNovoStatus(''); setMotivo('') }}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAlterarStatus}
                disabled={!novoStatus || pending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {pending ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
