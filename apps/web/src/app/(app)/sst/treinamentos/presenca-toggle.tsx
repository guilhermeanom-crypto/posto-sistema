'use client'

import { useTransition, useState } from 'react'
import { atualizarPresencaAction, removerParticipanteAction } from './actions'

interface Props {
  execucaoId: string
  funcionarioId: string
  funcionarioNome: string
  cargo: string
  presenca: boolean
  aprovado: boolean
}

export function PresencaToggle({ execucaoId, funcionarioId, funcionarioNome, cargo, presenca: initialPresenca, aprovado: initialAprovado }: Props) {
  const [isPending, startTransition] = useTransition()
  const [presenca, setPresenca] = useState(initialPresenca)
  const [aprovado, setAprovado] = useState(initialAprovado)

  function toggle(newPresenca: boolean, newAprovado: boolean) {
    setPresenca(newPresenca)
    setAprovado(newAprovado)
    startTransition(async () => {
      await atualizarPresencaAction(execucaoId, funcionarioId, newPresenca, newAprovado)
    })
  }

  function handleRemover() {
    if (!confirm(`Remover ${funcionarioNome} desta lista?`)) return
    startTransition(async () => {
      await removerParticipanteAction(execucaoId, funcionarioId)
    })
  }

  return (
    <div className={`flex items-center justify-between px-4 py-3 transition-colors ${isPending ? 'opacity-60' : ''} ${
      !presenca ? 'bg-gray-50' : aprovado ? 'bg-green-50/30' : 'bg-red-50/30'
    }`}>
      <div>
        <p className="text-sm font-medium">{funcionarioNome}</p>
        <p className="text-xs text-muted-foreground">{cargo}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Presença toggle */}
        <button
          type="button"
          onClick={() => toggle(!presenca, !presenca ? aprovado : false)}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            presenca
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${presenca ? 'bg-green-500' : 'bg-gray-400'}`} />
          {presenca ? 'Presente' : 'Ausente'}
        </button>

        {/* Aprovado toggle — só mostra se presente */}
        {presenca && (
          <button
            type="button"
            onClick={() => toggle(presenca, !aprovado)}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              aprovado
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            {aprovado ? 'Aprovado' : 'Reprovado'}
          </button>
        )}

        {/* Remove */}
        <button
          type="button"
          onClick={handleRemover}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-red-600 transition-colors px-1"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
