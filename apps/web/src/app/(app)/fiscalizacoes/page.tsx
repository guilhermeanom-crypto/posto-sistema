import type { Metadata } from 'next'
import { getAccessToken, resolveEmpreendimentoId } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import Link from 'next/link'
import { CriarAutoForm } from './criar-auto-form'

export const metadata: Metadata = { title: 'Fiscalizações e Autos de Infração' }

interface AutoInfracao {
  id: string
  orgao: string
  numeroAuto: string
  dataLavratura: string
  prazoDefesa: string
  status: string
  valorMulta: number | string | null
  empreendimento: { id: string; nome: string }
  _count: { recursos: number }
}

function toNumber(v: number | string | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v) || 0
}

interface Empreendimento { id: string; nome: string }

const statusColor: Record<string, string> = {
  RECEBIDO: 'bg-blue-100 text-blue-800',
  EM_DEFESA: 'bg-yellow-100 text-yellow-800',
  AGUARDANDO_JULGAMENTO: 'bg-orange-100 text-orange-800',
  JULGADO_FAVORAVEL: 'bg-green-100 text-green-800',
  JULGADO_DESFAVORAVEL: 'bg-red-100 text-red-800',
  EM_RECURSO: 'bg-purple-100 text-purple-800',
  ENCERRADO: 'bg-gray-100 text-gray-800',
  PAGO: 'bg-gray-100 text-gray-600',
}

const statusLabel: Record<string, string> = {
  RECEBIDO: 'Recebido',
  EM_DEFESA: 'Em Defesa',
  AGUARDANDO_JULGAMENTO: 'Ag. Julgamento',
  JULGADO_FAVORAVEL: 'Julgado Favorável',
  JULGADO_DESFAVORAVEL: 'Julgado Desfavorável',
  EM_RECURSO: 'Em Recurso',
  ENCERRADO: 'Encerrado',
  PAGO: 'Pago',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(prazo: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(prazo)
  alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000)
}

function formatarValor(v: number | string | null | undefined) {
  return toNumber(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function FiscalizacoesPage() {
  const token = await getAccessToken()
  const empIdAtivo = await resolveEmpreendimentoId()
  let autos: AutoInfracao[] = []
  let empreendimentos: Empreendimento[] = []

  if (token) {
    try {
      const qs = new URLSearchParams({
        limit: '50',
        ...(empIdAtivo && { empreendimentoId: empIdAtivo }),
      })
      const [autosRes, empRes] = await Promise.all([
        api.get<PaginatedResponse<AutoInfracao>>(`/fiscalizacoes?${qs}`, token),
        api.get<PaginatedResponse<Empreendimento>>('/empreendimentos?limit=100', token),
      ])
      autos = autosRes.data
      empreendimentos = empRes.data
    } catch { /* exibe vazio */ }
  }

  const ativos = autos.filter((a) => !['ENCERRADO', 'PAGO', 'JULGADO_FAVORAVEL'].includes(a.status))
  const urgentes = ativos.filter((a) => {
    const d = diasRestantes(a.prazoDefesa)
    return d >= 0 && d <= 7 && ['RECEBIDO', 'EM_DEFESA'].includes(a.status)
  })
  const valorTotalEmRisco = ativos.reduce((acc, a) => acc + toNumber(a.valorMulta), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fiscalizações e Autos de Infração</h1>
        <p className="text-muted-foreground text-sm">Gestão de autos de infração e recursos administrativos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Autos Ativos</p>
          <p className="text-2xl font-bold mt-1">{ativos.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Valor Total em Risco</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{formatarValor(valorTotalEmRisco)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Prazos Urgentes (7d)</p>
          <p className="text-2xl font-bold mt-1">{urgentes.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Registrado</p>
          <p className="text-2xl font-bold mt-1">{autos.length}</p>
        </div>
      </div>

      {urgentes.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-medium">
          {urgentes.length} auto{urgentes.length !== 1 ? 's' : ''} com prazo de defesa em até 7 dias — verifique imediatamente.
        </div>
      )}

      <CriarAutoForm empreendimentos={empreendimentos} />

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">{autos.length} auto{autos.length !== 1 ? 's' : ''} de infração</h2>
        </div>

        {autos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum auto de infração registrado.</div>
        ) : (
          <div className="divide-y">
            {autos.map((a) => {
              const dias = diasRestantes(a.prazoDefesa)
              const prazoUrgente = dias >= 0 && dias <= 7 && ['RECEBIDO', 'EM_DEFESA'].includes(a.status)
              return (
                <Link key={a.id} href={`/fiscalizacoes/${a.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">{a.numeroAuto}</span>
                      <span className="text-xs font-medium text-muted-foreground">{a.orgao}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[a.status] ?? 'bg-gray-100'}`}>
                        {statusLabel[a.status] ?? a.status}
                      </span>
                      {a._count.recursos > 0 && (
                        <span className="text-xs text-muted-foreground">{a._count.recursos} recurso{a._count.recursos !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{a.empreendimento.nome}</span>
                      {a.valorMulta && (
                        <span className="text-xs font-medium text-red-700">{formatarValor(a.valorMulta)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Prazo defesa</p>
                    <p className={`text-sm font-medium ${prazoUrgente ? 'text-red-600' : ''}`}>
                      {dias < 0 ? 'Vencido' : dias === 0 ? 'Hoje' : `${dias}d`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.prazoDefesa)}</p>
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
