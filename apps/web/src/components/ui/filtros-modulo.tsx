'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export interface FiltroConfig {
  nome: string
  paramName: string
  tipo: 'select'
  opcoes: { value: string; label: string }[]
  placeholder?: string
}

interface Props {
  filtros: FiltroConfig[]
  basePath: string
}

export function FiltrosModulo({ filtros, basePath }: Props) {
  const searchParams = useSearchParams()

  return (
    <form method="GET" className="flex flex-wrap items-end gap-2">
      {filtros.map((f) => (
        <select
          key={f.paramName}
          name={f.paramName}
          defaultValue={searchParams.get(f.paramName) ?? ''}
          className="rounded-md border bg-background px-2.5 py-1.5 text-xs min-w-[140px] focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{f.placeholder ?? `Todos: ${f.nome}`}</option>
          {f.opcoes.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Filtrar
      </button>
      {Array.from(searchParams.entries()).some(([k]) => filtros.some((f) => f.paramName === k)) && (
        <Link href={basePath} className="text-xs text-muted-foreground hover:underline py-1.5">
          Limpar
        </Link>
      )}
    </form>
  )
}
