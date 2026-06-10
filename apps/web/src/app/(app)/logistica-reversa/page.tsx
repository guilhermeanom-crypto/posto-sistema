import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import { CriarMTRForm } from './criar-mtr-form'

export const metadata: Metadata = { title: 'Logística Reversa' }

interface Residuo { tipo: string; quantidade: number; unidade: string; destinacao?: string }

interface MTR {
  id: string
  numeroMTR: string | null
  dataEmissao: string
  dataColeta: string | null
  status: string
  residuos: Residuo[]
  empreendimento: { id: string; nome: string }
  transportadora: { id: string; nome: string; cnpj: string } | null
}

interface Meta {
  id: string
  tipoResiduo: string
  unidade: string
  metaQuantidade: string
  ano: number
  empreendimento: { nome: string; nomeFantasia: string | null }
}

const statusColor: Record<string, string> = {
  ABERTO: 'bg-blue-100 text-blue-800',
  COLETADO: 'bg-yellow-100 text-yellow-800',
  DESTINADO: 'bg-purple-100 text-purple-800',
  ENCERRADO: 'bg-green-100 text-green-800',
}

const statusLabel: Record<string, string> = {
  ABERTO: 'Aberto',
  COLETADO: 'Coletado',
  DESTINADO: 'Destinado',
  ENCERRADO: 'Encerrado',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasAberto(dataEmissao: string, status: string) {
  if (status !== 'ABERTO') return null
  return Math.ceil((Date.now() - new Date(dataEmissao).getTime()) / 86400000)
}

export default async function LogisticaReversaPage() {
  const token = await getAccessToken()
  const ano = new Date().getFullYear()
  let mtrs: MTR[] = []
  let metas: Meta[] = []

  if (token) {
    try {
      const [mtrRes, metaRes] = await Promise.all([
        api.get<PaginatedResponse<MTR>>('/logistica-reversa/mtrs?limit=50', token),
        api.get<{ data: Meta[] }>(`/logistica-reversa/metas?ano=${ano}`, token),
      ])
      mtrs = mtrRes.data
      metas = metaRes.data
    } catch { /* exibe vazio */ }
  }

  const abertosAntigas = mtrs.filter((m) => {
    const d = diasAberto(m.dataEmissao, m.status)
    return d !== null && d > 30
  }).length

  const pendentes = mtrs.filter((m) => m.status === 'ABERTO' || m.status === 'COLETADO').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logística Reversa</h1>
          <p className="text-muted-foreground text-sm">MTRs, CCRs e metas anuais de resíduos</p>
        </div>
        <Link
          href="/logistica-reversa/metas"
          className="text-sm text-primary hover:underline"
        >
          Gerenciar metas →
        </Link>
      </div>

      {abertosAntigas > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 font-medium">
          ⚠ {abertosAntigas} MTR{abertosAntigas !== 1 ? 's' : ''} aberto{abertosAntigas !== 1 ? 's' : ''} há mais de 30 dias sem coleta.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total MTRs</p>
          <p className="text-2xl font-bold">{mtrs.length}</p>
          <p className="text-xs text-muted-foreground">{ano}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Pendentes</p>
          <p className={`text-2xl font-bold ${pendentes > 0 ? 'text-orange-600' : ''}`}>{pendentes}</p>
          <p className="text-xs text-muted-foreground">abertos + coletados</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Encerrados</p>
          <p className="text-2xl font-bold text-emerald-600">{mtrs.filter((m) => m.status === 'ENCERRADO').length}</p>
          <p className="text-xs text-muted-foreground">destinação confirmada</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Metas {ano}</p>
          <p className="text-2xl font-bold">{metas.length}</p>
          <p className="text-xs text-muted-foreground">tipos configurados</p>
        </div>
      </div>

      <CriarMTRForm />

      {/* Lista de MTRs */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">MTRs — {mtrs.length} registro{mtrs.length !== 1 ? 's' : ''}</h2>
          <div className="flex gap-2 text-xs">
            {(['ABERTO', 'COLETADO', 'DESTINADO', 'ENCERRADO'] as const).map((s) => {
              const count = mtrs.filter((m) => m.status === s).length
              return count > 0 ? (
                <span key={s} className={`px-2 py-0.5 rounded-full font-medium ${statusColor[s]}`}>
                  {count} {statusLabel[s]}
                </span>
              ) : null
            })}
          </div>
        </div>

        {mtrs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum MTR cadastrado.</div>
        ) : (
          <div className="divide-y">
            {mtrs.map((m) => {
              const dias = diasAberto(m.dataEmissao, m.status)
              const residuosSummary = m.residuos.map((r) => `${r.tipo} ${r.quantidade}${r.unidade}`).join(' · ')
              return (
                <Link
                  key={m.id}
                  href={`/logistica-reversa/${m.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {m.numeroMTR && (
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{m.numeroMTR}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[m.status] ?? 'bg-gray-100'}`}>
                        {statusLabel[m.status] ?? m.status}
                      </span>
                      {dias !== null && dias > 30 && (
                        <span className="text-xs font-medium text-yellow-700">{dias}d sem coleta</span>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-0.5">{m.empreendimento.nome}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{residuosSummary}</p>
                    {m.transportadora && (
                      <p className="text-xs text-muted-foreground">{m.transportadora.nome}</p>
                    )}
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Emissão</p>
                    <p className="text-sm font-medium">{formatDate(m.dataEmissao)}</p>
                    {m.dataColeta && (
                      <p className="text-xs text-muted-foreground">Coleta: {formatDate(m.dataColeta)}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
