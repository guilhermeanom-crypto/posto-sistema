import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import { CriarPocoForm } from './criar-poco-form'

export const metadata: Metadata = { title: 'Outorga Hídrica — Poços Artesianos' }

interface LaudoUltimo { id: string; dataCampanha: string; resultado: string }

interface PocoArtesiano {
  id: string
  codigo: string
  profundidade: string | null
  outorgaDAEE: string | null
  validadeOutorga: string | null
  vazaoAutorizada: string | null
  status: string
  empreendimento: { id: string; nome: string }
  laudos: LaudoUltimo[]
  _count: { laudos: number }
}

const statusColor: Record<string, string> = {
  ATIVO: 'bg-green-100 text-green-800',
  INATIVO: 'bg-gray-100 text-gray-600',
  INTERDITADO: 'bg-red-100 text-red-800',
  SELADO: 'bg-gray-100 text-gray-400',
}

const resultadoColor: Record<string, string> = {
  CONFORME: 'text-green-700', ATENCAO: 'text-yellow-700', NAO_CONFORME: 'text-red-700',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(data: string | null) {
  if (!data) return null
  return Math.ceil((new Date(data).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default async function OutorgaHidricaPage() {
  const token = await getAccessToken()
  let pocos: PocoArtesiano[] = []

  if (token) {
    try {
      const res = await api.get<PaginatedResponse<PocoArtesiano>>('/outorga-hidrica?limit=50', token)
      pocos = res.data
    } catch { /* exibe vazio */ }
  }

  const atencao = pocos.filter((p) => {
    const dias = diasRestantes(p.validadeOutorga)
    const ultimo = p.laudos[0]
    return (dias !== null && dias <= 90) || (ultimo && ultimo.resultado === 'NAO_CONFORME')
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Outorga Hídrica</h1>
        <p className="text-muted-foreground text-sm">Poços artesianos, outorgas DAEE e laudos de qualidade da água</p>
      </div>

      {atencao > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {atencao} poço{atencao !== 1 ? 's' : ''} requer{atencao === 1 ? '' : 'em'} atenção (outorga vencendo ou laudo não conforme).
        </div>
      )}

      <CriarPocoForm />

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">{pocos.length} poço{pocos.length !== 1 ? 's' : ''} cadastrado{pocos.length !== 1 ? 's' : ''}</h2>
        </div>

        {pocos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum poço artesiano cadastrado.</div>
        ) : (
          <div className="divide-y">
            {pocos.map((p) => {
              const dias = diasRestantes(p.validadeOutorga)
              const ultimo = p.laudos[0]
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">{p.codigo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status] ?? 'bg-gray-100'}`}>{p.status}</span>
                      {ultimo && (
                        <span className={`text-xs font-medium ${resultadoColor[ultimo.resultado] ?? ''}`}>
                          Laudo: {ultimo.resultado.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{p.empreendimento.nome}</span>
                      {p.profundidade && <span className="text-xs text-muted-foreground">{p.profundidade}m prof.</span>}
                      {p.outorgaDAEE && <span className="text-xs text-muted-foreground">DAEE: {p.outorgaDAEE}</span>}
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Outorga válida até</p>
                    <p className="text-sm font-medium">{formatDate(p.validadeOutorga)}</p>
                    {dias !== null && dias >= 0 && dias <= 90 && (
                      <p className={`text-xs font-medium ${dias <= 30 ? 'text-red-600' : 'text-yellow-600'}`}>{dias}d</p>
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
