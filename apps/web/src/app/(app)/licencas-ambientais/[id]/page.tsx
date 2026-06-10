import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { CondicoesPanel } from './condicoes-panel'
import { AnalisarIABtn } from './analisar-ia-btn'

export const metadata: Metadata = { title: 'Detalhe da Licença Ambiental' }

interface CondicaoLicenca {
  id: string
  numero: string | null
  descricao: string
  prazo: string | null
  status: string
  observacoes: string | null
}

interface LicencaDetalhe {
  id: string
  tipo: string
  numero: string
  orgaoEmissor: string
  responsavelTecnico: string | null
  dataEmissao: string
  dataVencimento: string
  status: string
  observacoes: string | null
  analiseIA: unknown
  analisadoEm: string | null
  empreendimento: { id: string; nome: string; cidade: string; estado: string }
  condicoes: CondicaoLicenca[]
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

const condicaoStatusColor: Record<string, string> = {
  PENDENTE: 'bg-gray-100 text-gray-700',
  EM_CUMPRIMENTO: 'bg-blue-100 text-blue-700',
  CUMPRIDA: 'bg-green-100 text-green-700',
  VENCIDA: 'bg-red-100 text-red-700',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(dataVencimento: string) {
  const hoje = new Date()
  const venc = new Date(dataVencimento)
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function LicencaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return notFound()

  let licenca: LicencaDetalhe | null = null
  try {
    const res = await api.get<{ data: LicencaDetalhe }>(`/licencas-ambientais/${id}`, token)
    licenca = res.data
  } catch {
    return notFound()
  }

  const dias = diasRestantes(licenca.dataVencimento)
  const condicoesPendentes = licenca.condicoes.filter((c) => c.status === 'PENDENTE' || c.status === 'EM_CUMPRIMENTO').length

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/licencas-ambientais" className="hover:text-foreground">
          Licenças Ambientais
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{licenca.numero}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded font-bold">{licenca.tipo}</span>
            <h1 className="text-2xl font-bold tracking-tight">{licenca.numero}</h1>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[licenca.status] ?? 'bg-gray-100'}`}
            >
              {statusLabel[licenca.status] ?? licenca.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {licenca.empreendimento.nome} · {licenca.empreendimento.cidade}/{licenca.empreendimento.estado}
          </p>
        </div>
        <AnalisarIABtn licencaId={licenca.id} analisadoEm={licenca.analisadoEm} />
      </div>

      {/* Cards de info */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Órgão Emissor</p>
          <p className="font-semibold">{licenca.orgaoEmissor}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Data de Emissão</p>
          <p className="font-semibold">{formatDate(licenca.dataEmissao)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Vencimento</p>
          <p className="font-semibold">{formatDate(licenca.dataVencimento)}</p>
          {dias >= 0 && dias <= 90 && (
            <p className={`text-xs font-medium ${dias <= 30 ? 'text-red-600' : 'text-yellow-600'}`}>
              {dias} dia{dias !== 1 ? 's' : ''}
            </p>
          )}
          {dias < 0 && <p className="text-xs font-medium text-red-600">Vencida</p>}
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Condicionantes</p>
          <p className="font-semibold">{licenca.condicoes.length}</p>
          {condicoesPendentes > 0 && (
            <p className="text-xs font-medium text-yellow-600">{condicoesPendentes} pendente{condicoesPendentes !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {licenca.responsavelTecnico && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Responsável Técnico</p>
          <p className="text-sm">{licenca.responsavelTecnico}</p>
        </div>
      )}

      {licenca.observacoes && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Observações</p>
          <p className="text-sm">{licenca.observacoes}</p>
        </div>
      )}

      {/* Condicionantes */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">
            Condicionantes ({licenca.condicoes.length})
          </h2>
        </div>

        {licenca.condicoes.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma condicionante cadastrada. Use o formulário abaixo para adicionar.
          </div>
        ) : (
          <div className="divide-y">
            {licenca.condicoes.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {c.numero && (
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        #{c.numero}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${condicaoStatusColor[c.status] ?? 'bg-gray-100'}`}
                    >
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    {c.prazo && (
                      <span className="text-xs text-muted-foreground">
                        prazo: {formatDate(c.prazo)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{c.descricao}</p>
                  {c.observacoes && (
                    <p className="text-xs text-muted-foreground mt-1">{c.observacoes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel para adicionar condicionante */}
      <CondicoesPanel licencaId={licenca.id} />
    </div>
  )
}
