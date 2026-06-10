import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import { CriarBombaForm } from './criar-bomba-form'

export const metadata: Metadata = { title: 'ANP / INMETRO — Bombas' }

interface Bomba {
  id: string
  numero: number
  fabricante: string
  modelo: string | null
  combustiveis: string[]
  ultimaCalibracao: string | null
  proximaCalibracao: string | null
  status: string
  empreendimento: { id: string; nome: string }
}

const statusColor: Record<string, string> = {
  ATIVO: 'bg-green-100 text-green-800',
  INATIVO: 'bg-gray-100 text-gray-600',
  MANUTENCAO: 'bg-yellow-100 text-yellow-800',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(data: string | null) {
  if (!data) return null
  return Math.ceil((new Date(data).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default async function AnpInmetroPage() {
  const token = await getAccessToken()
  let bombas: Bomba[] = []

  if (token) {
    try {
      const res = await api.get<PaginatedResponse<Bomba>>('/anp-inmetro?limit=100', token)
      bombas = res.data
    } catch { /* exibe vazio */ }
  }

  const vencendoEmBreve = bombas.filter((b) => {
    const d = diasRestantes(b.proximaCalibracao)
    return d !== null && d <= 60
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ANP / INMETRO — Bombas</h1>
          <p className="text-muted-foreground text-sm">Controle de calibração e manutenção das bombas de abastecimento</p>
        </div>
      </div>

      {vencendoEmBreve > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {vencendoEmBreve} bomba{vencendoEmBreve !== 1 ? 's' : ''} com calibração vencendo em até 60 dias.
        </div>
      )}

      <CriarBombaForm />

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">{bombas.length} bomba{bombas.length !== 1 ? 's' : ''} cadastrada{bombas.length !== 1 ? 's' : ''}</h2>
        </div>

        {bombas.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma bomba cadastrada.</div>
        ) : (
          <div className="divide-y">
            {bombas.map((b) => {
              const dias = diasRestantes(b.proximaCalibracao)
              return (
                <div key={b.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">Bico #{b.numero}</span>
                      <span className="text-sm font-medium">{b.fabricante}{b.modelo ? ` ${b.modelo}` : ''}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[b.status] ?? 'bg-gray-100'}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{b.empreendimento.nome}</span>
                      <span className="text-xs text-muted-foreground">{b.combustiveis.join(', ')}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Últ. calibração: {formatDate(b.ultimaCalibracao)}</p>
                    <p className="text-sm font-medium">Próx.: {formatDate(b.proximaCalibracao)}</p>
                    {dias !== null && dias >= 0 && dias <= 60 && (
                      <p className={`text-xs font-medium ${dias <= 15 ? 'text-red-600' : 'text-yellow-600'}`}>{dias}d</p>
                    )}
                    {dias !== null && dias < 0 && <p className="text-xs font-medium text-red-600">Vencida</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
