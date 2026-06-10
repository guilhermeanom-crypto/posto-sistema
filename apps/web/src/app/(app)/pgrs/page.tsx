import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import Link from 'next/link'
import { CriarPGRSForm } from './criar-pgrs-form'

export const metadata: Metadata = { title: 'PGRS — Planos de Gerenciamento de Resíduos' }

interface PGRS {
  id: string
  versao: string
  responsavelTecnico: string
  dataAprovacao: string
  dataVencimento: string
  status: string
  empreendimento: { id: string; nome: string }
  _count: { exigencias: number }
}

interface Empreendimento { id: string; nome: string }

const statusColor: Record<string, string> = {
  EM_ELABORACAO: 'bg-gray-100 text-gray-800',
  VIGENTE: 'bg-green-100 text-green-800',
  A_RENOVAR: 'bg-yellow-100 text-yellow-800',
  VENCIDO: 'bg-red-100 text-red-800',
  CANCELADO: 'bg-gray-100 text-gray-600',
}

const statusLabel: Record<string, string> = {
  EM_ELABORACAO: 'Em Elaboração',
  VIGENTE: 'Vigente',
  A_RENOVAR: 'A Renovar',
  VENCIDO: 'Vencido',
  CANCELADO: 'Cancelado',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(data: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(data)
  alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000)
}

export default async function PGRSPage() {
  const token = await getAccessToken()
  let planos: PGRS[] = []
  let empreendimentos: Empreendimento[] = []

  if (token) {
    try {
      const [pgrsRes, empRes] = await Promise.all([
        api.get<PaginatedResponse<PGRS>>('/pgrs?limit=50', token),
        api.get<PaginatedResponse<Empreendimento>>('/empreendimentos?limit=100', token),
      ])
      planos = pgrsRes.data
      empreendimentos = empRes.data
    } catch { /* exibe vazio */ }
  }

  const vigentes = planos.filter((p) => p.status === 'VIGENTE')
  const vencidos = planos.filter((p) => p.status === 'VENCIDO')
  const aRenovar = planos.filter((p) => {
    const d = diasRestantes(p.dataVencimento)
    return d >= 0 && d <= 90 && p.status === 'VIGENTE'
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PGRS — Planos de Gerenciamento de Resíduos</h1>
        <p className="text-muted-foreground text-sm">Controle de planos, exigências e comprovações</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total de Planos</p>
          <p className="text-2xl font-bold mt-1">{planos.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vigentes</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{vigentes.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">A Renovar (90d)</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{aRenovar.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vencidos</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{vencidos.length}</p>
        </div>
      </div>

      {vencidos.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-medium">
          {vencidos.length} PGRS vencido{vencidos.length !== 1 ? 's' : ''} — regularize imediatamente.
        </div>
      )}

      <CriarPGRSForm empreendimentos={empreendimentos} />

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">{planos.length} plano{planos.length !== 1 ? 's' : ''} registrado{planos.length !== 1 ? 's' : ''}</h2>
        </div>

        {planos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum PGRS registrado.</div>
        ) : (
          <div className="divide-y">
            {planos.map((p) => {
              const dias = diasRestantes(p.dataVencimento)
              const urgente = p.status === 'VIGENTE' && dias >= 0 && dias <= 30
              return (
                <Link key={p.id} href={`/pgrs/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">{p.versao}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status] ?? 'bg-gray-100'}`}>
                        {statusLabel[p.status] ?? p.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{p._count.exigencias} exigência{p._count.exigencias !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{p.empreendimento.nome}</span>
                      <span className="text-xs text-muted-foreground">RT: {p.responsavelTecnico}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p className={`text-sm font-medium ${urgente ? 'text-red-600' : p.status === 'VENCIDO' ? 'text-red-600' : ''}`}>
                      {dias < 0 ? 'Vencido' : dias === 0 ? 'Hoje' : `${dias}d`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.dataVencimento)}</p>
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
