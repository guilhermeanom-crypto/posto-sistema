import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import { CriarCampanhaForm } from './criar-campanha-form'

export const metadata: Metadata = { title: 'Monitoramento Solo e Água' }

interface Campanha {
  id: string
  tipo: string
  dataColeta: string
  laboratorio: string
  resultado: string
  empreendimento: { id: string; nome: string }
  pocoMonitoramento: { id: string; codigo: string } | null
  _count: { parametros: number }
}

interface Poco {
  id: string
  codigo: string
  status: string
  periodicidade: string | null
  proximaColeta: string | null
  empreendimento: { id: string; nome: string }
  _count: { campanhas: number }
}

interface Props {
  searchParams: Promise<{ aba?: string }>
}

const tipoLabel: Record<string, string> = {
  SOLO: 'Solo',
  AGUA_SUBTERRANEA: 'Água Subterrânea',
  VAPOR: 'Vapor Solo',
  AR: 'Ar',
}

const resultadoColor: Record<string, string> = {
  CONFORME:     'bg-green-100 text-green-800',
  ATENCAO:      'bg-yellow-100 text-yellow-800',
  NAO_CONFORME: 'bg-red-100 text-red-800',
}

const resultadoLabel: Record<string, string> = {
  CONFORME:     'Conforme',
  ATENCAO:      'Atenção',
  NAO_CONFORME: 'Não conforme',
}

const periodicidadeLabel: Record<string, string> = {
  MENSAL:      'Mensal',
  TRIMESTRAL:  'Trimestral',
  SEMESTRAL:   'Semestral',
  ANUAL:       'Anual',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasParaColeta(proximaColeta: string | null) {
  if (!proximaColeta) return null
  return Math.floor((new Date(proximaColeta).getTime() - Date.now()) / 86400000)
}

export default async function MonitoramentoPage({ searchParams }: Props) {
  const { aba = 'campanhas' } = await searchParams
  const token = await getAccessToken()
  let campanhas: Campanha[] = []
  let pocos: Poco[] = []

  if (token) {
    try {
      const [campRes, pocoRes] = await Promise.all([
        api.get<PaginatedResponse<Campanha>>('/monitoramento/campanhas?limit=50', token),
        api.get<PaginatedResponse<Poco>>('/monitoramento/pocos?limit=100', token),
      ])
      campanhas = campRes.data
      pocos = pocoRes.data
    } catch {}
  }

  const naoConformes = campanhas.filter((c) => c.resultado === 'NAO_CONFORME').length
  const pocosVencendo = pocos.filter((p) => {
    const d = diasParaColeta(p.proximaColeta)
    return d !== null && d <= 30
  }).length

  const abas = [
    { id: 'campanhas', label: 'Campanhas', count: campanhas.length, urgente: naoConformes },
    { id: 'pontos',    label: 'Pontos de Monitoramento', count: pocos.length, urgente: pocosVencendo },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoramento Solo e Água</h1>
          <p className="text-muted-foreground text-sm">Campanhas de análise, contaminantes BTEX/TPH/HPA e pontos periódicos</p>
        </div>
        <Link href="/monitoramento/limites" className="text-sm text-primary hover:underline">
          Limites VMP →
        </Link>
      </div>

      {naoConformes > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-medium">
          ⚠ {naoConformes} campanha{naoConformes !== 1 ? 's' : ''} com resultado NÃO CONFORME — ação imediata requerida.
        </div>
      )}
      {pocosVencendo > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 font-medium">
          ⚠ {pocosVencendo} ponto{pocosVencendo !== 1 ? 's' : ''} de monitoramento com coleta vencendo em até 30 dias.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b gap-1">
        {abas.map((a) => (
          <Link
            key={a.id}
            href={`/monitoramento?aba=${a.id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              aba === a.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {a.label}
            {a.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
                a.urgente > 0 ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
              }`}>
                {a.urgente > 0 ? a.urgente : a.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {aba === 'campanhas' && (
        <div className="space-y-4">
          <CriarCampanhaForm />

          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-sm">{campanhas.length} campanha{campanhas.length !== 1 ? 's' : ''}</h2>
              <div className="flex gap-2 text-xs">
                {(['NAO_CONFORME', 'ATENCAO', 'CONFORME'] as const).map((r) => {
                  const c = campanhas.filter((x) => x.resultado === r).length
                  return c > 0 ? (
                    <span key={r} className={`px-2 py-0.5 rounded-full font-medium ${resultadoColor[r]}`}>
                      {c} {resultadoLabel[r]}
                    </span>
                  ) : null
                })}
              </div>
            </div>
            {campanhas.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma campanha registrada.</div>
            ) : (
              <div className="divide-y">
                {campanhas.map((c) => (
                  <Link
                    key={c.id}
                    href={`/monitoramento/${c.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{tipoLabel[c.tipo] ?? c.tipo}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${resultadoColor[c.resultado] ?? 'bg-gray-100'}`}>
                          {resultadoLabel[c.resultado] ?? c.resultado}
                        </span>
                        {c._count.parametros > 0 && (
                          <span className="text-xs text-muted-foreground">{c._count.parametros} param.</span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-0.5">{c.empreendimento.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.laboratorio}
                        {c.pocoMonitoramento && ` · Poço ${c.pocoMonitoramento.codigo}`}
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">Coleta</p>
                      <p className="text-sm font-medium">{formatDate(c.dataColeta)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {aba === 'pontos' && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">{pocos.length} ponto{pocos.length !== 1 ? 's' : ''} de monitoramento</h2>
          </div>
          {pocos.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum ponto de monitoramento cadastrado.</div>
          ) : (
            <div className="divide-y">
              {pocos.map((p) => {
                const dias = diasParaColeta(p.proximaColeta)
                const vencido  = dias !== null && dias < 0
                const urgente  = dias !== null && dias >= 0 && dias <= 30
                return (
                  <Link
                    key={p.id}
                    href={`/monitoramento/pocos/${p.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{p.codigo}</span>
                        {p.periodicidade && (
                          <span className="text-xs text-muted-foreground">{periodicidadeLabel[p.periodicidade] ?? p.periodicidade}</span>
                        )}
                        {p._count.campanhas > 0 && (
                          <span className="text-xs text-muted-foreground">{p._count.campanhas} campanha{p._count.campanhas !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-0.5">{p.empreendimento.nome}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      {p.proximaColeta ? (
                        <>
                          <p className="text-xs text-muted-foreground">Próxima coleta</p>
                          <p className={`text-sm font-medium ${vencido ? 'text-red-600' : urgente ? 'text-orange-600' : ''}`}>
                            {formatDate(p.proximaColeta)}
                          </p>
                          {(vencido || urgente) && (
                            <p className={`text-xs font-medium ${vencido ? 'text-red-600' : 'text-orange-600'}`}>
                              {vencido ? `Vencido há ${Math.abs(dias!)}d` : `${dias}d`}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sem programação</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
