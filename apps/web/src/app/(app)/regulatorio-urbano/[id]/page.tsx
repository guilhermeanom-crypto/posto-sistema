import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'Detalhe do Documento Urbano' }

interface AlvaraDetalhe {
  id: string
  tipo: string
  numero: string | null
  orgaoEmissor: string
  dataEmissao: string | null
  dataVencimento: string | null
  status: string
  observacoes: string | null
  empreendimento: { id: string; nome: string; cidade: string; estado: string }
}

const tipoLabel: Record<string, string> = {
  AVCB: 'AVCB — Auto de Vistoria do Corpo de Bombeiros',
  HABITE_SE: 'Habite-se',
  ALVARA_FUNCIONAMENTO: 'Alvará de Funcionamento',
  PPCI: 'PPCI — Plano de Prevenção Contra Incêndio',
  LICENCA_SANITARIA: 'Licença Sanitária',
  ALVARA_OBRAS: 'Alvará de Obras',
  OUTROS: 'Outros',
}

const statusLabel: Record<string, string> = {
  VIGENTE: 'Vigente',
  A_RENOVAR: 'A Renovar',
  VENCIDA: 'Vencida',
  SUSPENSA: 'Suspensa',
  CANCELADA: 'Cancelada',
  EM_RENOVACAO: 'Em Renovação',
}

const statusColor: Record<string, string> = {
  VIGENTE: 'bg-green-100 text-green-800',
  A_RENOVAR: 'bg-yellow-100 text-yellow-800',
  VENCIDA: 'bg-red-100 text-red-800',
  SUSPENSA: 'bg-orange-100 text-orange-800',
  CANCELADA: 'bg-gray-100 text-gray-600',
  EM_RENOVACAO: 'bg-blue-100 text-blue-800',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(dataVencimento: string | null) {
  if (!dataVencimento) return null
  const hoje = new Date()
  const venc = new Date(dataVencimento)
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function AlvaraDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return notFound()

  let alvara: AlvaraDetalhe | null = null
  try {
    const res = await api.get<{ data: AlvaraDetalhe }>(`/regulatorio-urbano/${id}`, token)
    alvara = res.data
  } catch {
    return notFound()
  }

  const dias = diasRestantes(alvara.dataVencimento)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/regulatorio-urbano" className="hover:text-foreground">
          Regulatório Urbano
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {tipoLabel[alvara.tipo] ?? alvara.tipo}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {tipoLabel[alvara.tipo] ?? alvara.tipo}
            </h1>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[alvara.status] ?? 'bg-gray-100'}`}
            >
              {statusLabel[alvara.status] ?? alvara.status}
            </span>
          </div>
          {alvara.numero && (
            <p className="text-muted-foreground text-sm font-mono">Nº {alvara.numero}</p>
          )}
          <p className="text-muted-foreground text-sm">
            {alvara.empreendimento.nome} · {alvara.empreendimento.cidade}/{alvara.empreendimento.estado}
          </p>
        </div>
      </div>

      {/* Cards de info */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Órgão Emissor</p>
          <p className="font-semibold">{alvara.orgaoEmissor}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Data de Emissão</p>
          <p className="font-semibold">{formatDate(alvara.dataEmissao)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Vencimento</p>
          <p className="font-semibold">{formatDate(alvara.dataVencimento)}</p>
          {dias !== null && dias >= 0 && dias <= 120 && (
            <p className={`text-xs font-medium ${dias <= 30 ? 'text-red-600' : 'text-yellow-600'}`}>
              {dias} dia{dias !== 1 ? 's' : ''}
            </p>
          )}
          {dias !== null && dias < 0 && (
            <p className="text-xs font-medium text-red-600">Vencida há {Math.abs(dias)} dias</p>
          )}
        </div>
      </div>

      {alvara.observacoes && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Observações</p>
          <p className="text-sm">{alvara.observacoes}</p>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Empreendimento</p>
        <Link
          href={`/empreendimentos/${alvara.empreendimento.id}`}
          className="text-sm font-medium hover:underline text-primary"
        >
          {alvara.empreendimento.nome}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">
          {alvara.empreendimento.cidade}/{alvara.empreendimento.estado}
        </p>
      </div>
    </div>
  )
}
