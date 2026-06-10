'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { selecionarEmpreendimento } from '@/app/(app)/empreendimento-actions'

interface Empreendimento {
  id: string
  nome: string
  nomeFantasia: string | null
  cidade?: string
  estado?: string
}

interface Props {
  empreendimentos: Empreendimento[]
  selecionadoId: string | undefined
}

export function EmpreendimentoSelector({ empreendimentos, selecionadoId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null
    startTransition(async () => {
      await selecionarEmpreendimento(id)
      router.refresh()
    })
  }

  const selecionado = empreendimentos.find((e) => e.id === selecionadoId)
  const totalPostos = empreendimentos.length

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline">Posto:</span>
      <select
        value={selecionadoId ?? ''}
        onChange={handleChange}
        disabled={pending}
        aria-label="Selecionar empreendimento ativo"
        className={`rounded-md border bg-background px-3 py-1.5 text-sm font-medium min-w-[220px] max-w-[320px] ${
          pending ? 'opacity-60 cursor-wait' : ''
        }`}
      >
        <option value="">Todos os empreendimentos ({totalPostos})</option>
        {empreendimentos.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nomeFantasia ?? e.nome}
            {e.cidade && e.estado ? ` — ${e.cidade}/${e.estado}` : ''}
          </option>
        ))}
      </select>
      {selecionado && !pending && (
        <span className="text-[10px] text-muted-foreground hidden md:inline">
          escopo ativo
        </span>
      )}
    </div>
  )
}
