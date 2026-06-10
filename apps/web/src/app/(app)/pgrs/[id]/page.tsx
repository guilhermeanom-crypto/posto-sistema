import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ExigenciaForm } from './exigencia-form'

export const metadata: Metadata = { title: 'Detalhe do PGRS' }

interface Evidencia {
  id: string
  periodoRef: string
  criadoEm: string
  documento: { id: string; nome: string; status: string }
}

interface Exigencia {
  id: string
  descricao: string
  tipoResiduo: string
  periodicidade: string
  prazoComprovacaoDias: number
  status: string
  naoAplicavel: boolean
  naoAplicavelJustificativa: string | null
  evidencias: Evidencia[]
}

interface PGRS {
  id: string
  versao: string
  responsavelTecnico: string
  artNumero: string | null
  dataAprovacao: string
  dataVencimento: string
  status: string
  observacoes: string | null
  empreendimento: { id: string; nome: string; cidade: string; estado: string }
  documento: { id: string; nome: string; status: string } | null
  exigencias: Exigencia[]
}

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

const statusExigColor: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  EM_CUMPRIMENTO: 'bg-blue-100 text-blue-800',
  COMPROVADO: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-red-100 text-red-800',
  NAO_APLICAVEL: 'bg-gray-100 text-gray-600',
}

const periodicidadeLabel: Record<string, string> = {
  UNICA: 'Única',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  BIENAL: 'Bienal',
  PERSONALIZADA: 'Personalizada',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default async function PGRSDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return notFound()

  let pgrs: PGRS
  try {
    pgrs = await api.get<PGRS>(`/pgrs/${id}`, token)
  } catch {
    return notFound()
  }

  const exigTotal = pgrs.exigencias.length
  const exigComprovadas = pgrs.exigencias.filter((e) => e.status === 'COMPROVADO').length
  const exigVencidas = pgrs.exigencias.filter((e) => e.status === 'VENCIDO').length
  const exigNA = pgrs.exigencias.filter((e) => e.naoAplicavel).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/pgrs" className="text-sm text-muted-foreground hover:text-foreground">← PGRS</Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PGRS {pgrs.versao}</h1>
          <p className="text-muted-foreground text-sm">{pgrs.empreendimento.nome} · {pgrs.empreendimento.cidade}/{pgrs.empreendimento.estado}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium flex-shrink-0 ${statusColor[pgrs.status] ?? 'bg-gray-100'}`}>
          {statusLabel[pgrs.status] ?? pgrs.status}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aprovação</p>
          <p className="text-sm font-semibold mt-1">{formatDate(pgrs.dataAprovacao)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vencimento</p>
          <p className="text-sm font-semibold mt-1">{formatDate(pgrs.dataVencimento)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Exigências</p>
          <p className="text-sm font-semibold mt-1">{exigTotal}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Comprovadas</p>
          <p className="text-sm font-semibold mt-1 text-green-600">{exigComprovadas}/{exigTotal - exigNA}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vencidas</p>
          <p className="text-sm font-semibold mt-1 text-red-600">{exigVencidas}</p>
        </div>
      </div>

      {/* Detalhes */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm">Detalhes do Plano</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Responsável Técnico</p>
            <p className="text-sm">{pgrs.responsavelTecnico}</p>
          </div>
          {pgrs.artNumero && (
            <div>
              <p className="text-xs text-muted-foreground">ART</p>
              <p className="text-sm">{pgrs.artNumero}</p>
            </div>
          )}
          {pgrs.documento && (
            <div>
              <p className="text-xs text-muted-foreground">Documento Vinculado</p>
              <p className="text-sm">{pgrs.documento.nome}</p>
            </div>
          )}
          {pgrs.observacoes && (
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="text-sm">{pgrs.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Exigências */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Exigências do Plano</h2>
          <ExigenciaForm pgrsId={pgrs.id} />
        </div>

        {pgrs.exigencias.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma exigência cadastrada.</div>
        ) : (
          <div className="divide-y">
            {pgrs.exigencias.map((e) => (
              <div key={e.id} className="px-4 py-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusExigColor[e.status] ?? 'bg-gray-100'}`}>
                      {e.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium">{e.descricao}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Resíduo: {e.tipoResiduo.replace(/_/g, ' ')}</span>
                  <span>Periodicidade: {periodicidadeLabel[e.periodicidade] ?? e.periodicidade}</span>
                  <span>Prazo: {e.prazoComprovacaoDias}d</span>
                </div>
                {e.naoAplicavel && e.naoAplicavelJustificativa && (
                  <p className="text-xs text-muted-foreground italic">N/A: {e.naoAplicavelJustificativa}</p>
                )}
                {e.evidencias.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Evidências:</p>
                    {e.evidencias.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2 text-xs">
                        <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{ev.periodoRef}</span>
                        <span>{ev.documento.nome}</span>
                        <span className="text-muted-foreground">{formatDate(ev.criadoEm)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
