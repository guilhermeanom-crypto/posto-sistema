'use client'

import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'

interface Opt {
  id: string
  nome: string
  nomeFantasia: string | null
  codigoInterno: string | null
  cidade: string
  estado: string
}

export function EmpreendimentoSelector({
  empreendimentos,
  selectedId,
  etapa,
}: {
  empreendimentos: Opt[]
  selectedId: string
  etapa: string
}) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-background">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
          Selecionar cenário
        </span>
        <select
          value={selectedId}
          onChange={(e) => router.push(`/motor-orcamento?empreendimentoId=${e.target.value}&etapa=${etapa}`)}
          className="bg-transparent text-sm font-medium text-foreground outline-none min-w-[260px] cursor-pointer"
        >
          {empreendimentos.length === 0 && <option value="">- sem empreendimentos -</option>}
          {empreendimentos.map((e) => (
            <option key={e.id} value={e.id}>
              {(e.codigoInterno ? `${e.codigoInterno} · ` : '') + (e.nomeFantasia ?? e.nome)} - {e.cidade}/{e.estado}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
