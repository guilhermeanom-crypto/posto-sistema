import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { MetasForm } from './metas-form'

export const metadata: Metadata = { title: 'Metas de Resíduos' }

interface Meta {
  id: string
  tipoResiduo: string
  unidade: string
  metaQuantidade: string
  ano: number
  observacoes: string | null
  empreendimento: { nome: string; nomeFantasia: string | null }
}

interface RelatorioItem {
  tipoResiduo: string
  unidade: string
  meta: number
  realizado: number
  percentual: number
}

interface Empreendimento {
  id: string
  nome: string
  nomeFantasia: string | null
}

interface Props {
  searchParams: Promise<{ empreendimentoId?: string; ano?: string }>
}

const tiposResiduo = [
  'OLEO_LUBRIFICANTE',
  'FILTRO_OLEO',
  'PNEU',
  'EMBALAGEM',
  'BATERIA',
  'RESIDUO_ELETRÔNICO',
  'OUTROS',
]

function tipoLabel(tipo: string) {
  return tipo.replace(/_/g, ' ').replace(/Ô/g, 'Ô')
}

function barColor(pct: number) {
  if (pct >= 100) return 'bg-emerald-500'
  if (pct >= 60)  return 'bg-yellow-400'
  return 'bg-red-500'
}

export default async function MetasPage({ searchParams }: Props) {
  const { empreendimentoId, ano: anoStr } = await searchParams
  const ano = anoStr ? parseInt(anoStr) : new Date().getFullYear()
  const token = await getAccessToken()

  let metas: Meta[] = []
  let relatorio: RelatorioItem[] = []
  let empreendimentos: Empreendimento[] = []

  if (token) {
    try {
      const params = new URLSearchParams({ ano: String(ano) })
      if (empreendimentoId) params.set('empreendimentoId', empreendimentoId)

      const [metaRes, empRes] = await Promise.all([
        api.get<{ data: Meta[] }>(`/logistica-reversa/metas?${params}`, token),
        api.get<{ data: Empreendimento[] }>('/empreendimentos?limit=100&ativo=true', token),
      ])
      metas = metaRes.data
      empreendimentos = empRes.data

      if (empreendimentoId) {
        const relRes = await api.get<{ data: RelatorioItem[] }>(
          `/logistica-reversa/metas/relatorio?empreendimentoId=${empreendimentoId}&ano=${ano}`,
          token,
        )
        relatorio = relRes.data
      }
    } catch {}
  }

  return (
    <div className="space-y-6">
      <Link href="/logistica-reversa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Logística Reversa
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Metas de Resíduos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Metas anuais por tipo de resíduo e empreendimento</p>
      </div>

      {/* Filtro de empreendimento e ano */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Empreendimento</label>
          <select
            name="empreendimentoId"
            defaultValue={empreendimentoId ?? ''}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {empreendimentos.map((e) => (
              <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.nome}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Ano</label>
          <select
            name="ano"
            defaultValue={String(ano)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {[ano + 1, ano, ano - 1, ano - 2].map((a) => (
              <option key={a} value={String(a)}>{a}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
          Filtrar
        </button>
      </form>

      {/* Relatório de atingimento (se filtrado por empreendimento) */}
      {empreendimentoId && relatorio.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">Atingimento de Metas — {ano}</h2>
          </div>
          <div className="divide-y">
            {relatorio.map((r) => (
              <div key={r.tipoResiduo} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{tipoLabel(r.tipoResiduo)}</span>
                  <span className={`font-bold tabular-nums ${r.percentual >= 100 ? 'text-emerald-700' : r.percentual >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
                    {r.percentual.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor(r.percentual)}`}
                    style={{ width: `${Math.min(100, r.percentual)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.realizado.toLocaleString('pt-BR')} / {r.meta.toLocaleString('pt-BR')} {r.unidade}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form para criar/atualizar meta */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold text-sm mb-4">Nova / Atualizar Meta</h2>
        <MetasForm empreendimentos={empreendimentos} anoAtual={ano} tiposResiduo={tiposResiduo} />
      </div>

      {/* Lista de metas */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">{metas.length} meta{metas.length !== 1 ? 's' : ''} configuradas</h2>
        </div>
        {metas.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma meta cadastrada.</div>
        ) : (
          <div className="divide-y">
            {metas.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{tipoLabel(m.tipoResiduo)}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.empreendimento.nomeFantasia ?? m.empreendimento.nome} · {m.ano}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">{parseFloat(m.metaQuantidade).toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">{m.unidade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
