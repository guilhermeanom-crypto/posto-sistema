import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { LimiteForm } from './limite-form'
import { deletarLimiteAction } from './actions'

export const metadata: Metadata = { title: 'Limites VMP — Monitoramento' }

interface Limite {
  id: string
  nomeParametro: string
  tipoMedio: string
  limiteVMP: string
  unidade: string
  referencia: string | null
}

interface Props {
  searchParams: Promise<{ tipoMedio?: string }>
}

const tipoMedioLabel: Record<string, string> = {
  SOLO: 'Solo',
  AGUA_SUBTERRANEA: 'Água Subterrânea',
  VAPOR: 'Vapor Solo',
  AR: 'Ar',
}

export default async function LimitesPage({ searchParams }: Props) {
  const { tipoMedio } = await searchParams
  const token = await getAccessToken()
  let limites: Limite[] = []

  if (token) {
    try {
      const params = tipoMedio ? `?tipoMedio=${tipoMedio}` : ''
      const res = await api.get<{ data: Limite[] }>(`/monitoramento/limites${params}`, token)
      limites = res.data
    } catch {}
  }

  const tiposMedio = ['SOLO', 'AGUA_SUBTERRANEA', 'VAPOR', 'AR']

  // Group by tipoMedio
  const grupos = tiposMedio.reduce<Record<string, Limite[]>>((acc, t) => {
    acc[t] = limites.filter((l) => l.tipoMedio === t)
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/monitoramento" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Monitoramento
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Limites VMP</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Valores Máximos Permitidos por parâmetro e meio — usados para classificar alertas automaticamente
        </p>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold text-sm mb-4">Adicionar / Atualizar Limite</h2>
        <LimiteForm />
      </div>

      {/* Filtro por meio */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/monitoramento/limites"
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            !tipoMedio ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Todos ({limites.length})
        </Link>
        {tiposMedio.map((t) => (
          <Link
            key={t}
            href={`/monitoramento/limites?tipoMedio=${t}`}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              tipoMedio === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tipoMedioLabel[t]} ({grupos[t]?.length ?? 0})
          </Link>
        ))}
      </div>

      {/* Tabelas por grupo */}
      {(tipoMedio ? [tipoMedio] : tiposMedio).map((t) => {
        const grupo = grupos[t] ?? []
        if (grupo.length === 0 && tipoMedio) return (
          <div key={t} className="p-8 text-center text-sm text-muted-foreground border rounded-lg">
            Nenhum limite configurado para {tipoMedioLabel[t]}.
          </div>
        )
        if (grupo.length === 0) return null
        return (
          <div key={t} className="rounded-lg border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20">
              <h2 className="font-semibold text-sm">{tipoMedioLabel[t]} — {grupo.length} limite{grupo.length !== 1 ? 's' : ''}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Parâmetro</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">VMP</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Unidade</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Referência</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {grupo.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2 font-medium">{l.nomeParametro}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {parseFloat(l.limiteVMP).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{l.unidade}</td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">{l.referencia ?? '—'}</td>
                      <td className="px-4 py-2 text-center">
                        <form action={async () => { 'use server'; await deletarLimiteAction(l.id) }}>
                          <button type="submit" className="text-xs text-red-600 hover:underline">
                            Excluir
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {limites.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground border rounded-lg">
          Nenhum limite VMP configurado. Use o formulário acima para adicionar.
        </div>
      )}
    </div>
  )
}
