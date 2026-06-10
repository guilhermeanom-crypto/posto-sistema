import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import { CriarTanqueForm } from './criar-tanque-form'

export const metadata: Metadata = { title: 'Estanqueidade — Tanques' }

interface TesteUltimo {
  id: string
  dataExecucao: string
  resultado: string
  proximoTeste: string
}

interface Tanque {
  id: string
  numero: number
  capacidadeLitros: number
  combustivel: string
  material: string | null
  status: string
  empreendimento: { id: string; nome: string }
  testes: TesteUltimo[]
  _count: { testes: number }
}

const statusColor: Record<string, string> = {
  ATIVO: 'bg-green-100 text-green-800',
  INATIVO: 'bg-gray-100 text-gray-600',
  INTERDITADO: 'bg-red-100 text-red-800',
  REMOVIDO: 'bg-gray-100 text-gray-400',
}

const resultadoColor: Record<string, string> = {
  APROVADO: 'text-green-700',
  REPROVADO: 'text-red-700',
  INCONCLUSIVO: 'text-yellow-700',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(data: string | null) {
  if (!data) return null
  return Math.ceil((new Date(data).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default async function EstanqueidadePage() {
  const token = await getAccessToken()
  let tanques: Tanque[] = []

  if (token) {
    try {
      const res = await api.get<PaginatedResponse<Tanque>>('/estanqueidade/tanques?limit=100', token)
      tanques = res.data
    } catch { /* exibe vazio */ }
  }

  const atencao = tanques.filter((t) => {
    const ultimo = t.testes[0]
    if (!ultimo) return true
    const dias = diasRestantes(ultimo.proximoTeste)
    return (dias !== null && dias <= 60) || ultimo.resultado === 'REPROVADO'
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estanqueidade — Tanques</h1>
        <p className="text-muted-foreground text-sm">Controle de tanques e testes anuais de estanqueidade (CETESB)</p>
      </div>

      {atencao > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {atencao} tanque{atencao !== 1 ? 's' : ''} requer{atencao === 1 ? '' : 'em'} atenção (teste vencendo ou reprovado).
        </div>
      )}

      <CriarTanqueForm />

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">{tanques.length} tanque{tanques.length !== 1 ? 's' : ''} cadastrado{tanques.length !== 1 ? 's' : ''}</h2>
        </div>

        {tanques.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum tanque cadastrado.</div>
        ) : (
          <div className="divide-y">
            {tanques.map((t) => {
              const ultimo = t.testes[0]
              const dias = ultimo ? diasRestantes(ultimo.proximoTeste) : null
              return (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">T-{t.numero}</span>
                      <span className="text-sm font-medium">{t.combustivel}</span>
                      {t.material && <span className="text-xs text-muted-foreground">{t.material}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status] ?? 'bg-gray-100'}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{t.empreendimento.nome}</span>
                      <span className="text-xs text-muted-foreground">{(t.capacidadeLitros / 1000).toFixed(0)}m³</span>
                      {ultimo && (
                        <span className={`text-xs font-medium ${resultadoColor[ultimo.resultado] ?? ''}`}>
                          Último: {ultimo.resultado}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    {ultimo ? (
                      <>
                        <p className="text-xs text-muted-foreground">Próx. teste</p>
                        <p className="text-sm font-medium">{formatDate(ultimo.proximoTeste)}</p>
                        {dias !== null && dias >= 0 && dias <= 60 && (
                          <p className={`text-xs font-medium ${dias <= 15 ? 'text-red-600' : 'text-yellow-600'}`}>{dias}d</p>
                        )}
                        {dias !== null && dias < 0 && <p className="text-xs font-medium text-red-600">Vencido</p>}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground font-medium text-yellow-700">Sem teste</p>
                    )}
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
