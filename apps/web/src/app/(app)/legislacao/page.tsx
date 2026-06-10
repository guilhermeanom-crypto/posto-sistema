import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import { CriarTarefaButton } from './criar-tarefa-button'

export const metadata: Metadata = { title: 'Monitor de Legislação' }

interface PublicacaoDO {
  id: string
  fonte: string
  dataPublicacao: string
  secao: string | null
  titulo: string
  url: string | null
  keywordsMatch: string[]
  relevante: boolean
  classificacao: string | null
  impacto: string | null
  resumoIA: string | null
}

const impactoColor: Record<string, string> = {
  ALTO: 'bg-red-100 text-red-800',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  BAIXO: 'bg-green-100 text-green-800',
}

const classificacaoLabel: Record<string, string> = {
  LEGISLACAO: 'Legislação',
  PORTARIA: 'Portaria',
  RESOLUCAO: 'Resolução',
  INSTRUCAO_NORMATIVA: 'Instrução Normativa',
  DESPACHO: 'Despacho',
  OUTROS: 'Outros',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

interface Empreendimento {
  id: string
  nomeFantasia: string | null
  nome: string
}

export default async function LegislacaoPage() {
  const token = await getAccessToken()
  let publicacoes: PublicacaoDO[] = []
  let total = 0
  let empreendimentos: Empreendimento[] = []

  if (token) {
    try {
      const [pubRes, empRes] = await Promise.all([
        api.get<PaginatedResponse<PublicacaoDO>>('/legislacao?limit=50&dias=90', token),
        api.get<{ data: Empreendimento[] }>('/empreendimentos?limit=200&ativo=true', token),
      ])
      publicacoes = pubRes.data
      total = pubRes.pagination?.total ?? publicacoes.length
      empreendimentos = empRes.data
    } catch { /* exibe vazio */ }
  }

  const altoImpacto = publicacoes.filter((p) => p.impacto === 'ALTO').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitor de Legislação</h1>
          <p className="text-muted-foreground text-sm">Publicações do DOU classificadas por IA — últimos 90 dias</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Monitoramento automático</p>
          <p className="text-xs text-muted-foreground">Seg–Sex às 07:30</p>
        </div>
      </div>

      {altoImpacto > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-medium">
          ⚠ {altoImpacto} publicação{altoImpacto !== 1 ? 'ões' : ''} de ALTO impacto para postos — revise imediatamente.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">publicações encontradas</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{publicacoes.filter((p) => p.relevante).length}</p>
          <p className="text-xs text-muted-foreground mt-1">relevantes para postos</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{altoImpacto}</p>
          <p className="text-xs text-muted-foreground mt-1">alto impacto</p>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">Publicações relevantes</h2>
        </div>

        {publicacoes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma publicação encontrada. O monitor roda automaticamente de segunda a sexta às 07:30.
          </div>
        ) : (
          <div className="divide-y">
            {publicacoes.map((p) => (
              <div key={p.id} className="px-4 py-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.impacto && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${impactoColor[p.impacto] ?? 'bg-gray-100'}`}>
                        {p.impacto}
                      </span>
                    )}
                    {p.classificacao && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                        {classificacaoLabel[p.classificacao] ?? p.classificacao}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{p.fonte}</span>
                    {p.secao && <span className="text-xs text-muted-foreground">{p.secao}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(p.dataPublicacao)}</span>
                </div>

                <p className="text-sm font-medium leading-snug">
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                      {p.titulo}
                    </a>
                  ) : (
                    p.titulo
                  )}
                </p>

                {p.resumoIA && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.resumoIA}</p>
                )}

                {p.keywordsMatch.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.keywordsMatch.map((kw) => (
                      <span key={kw} className="text-xs bg-primary/5 text-primary px-1.5 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                <CriarTarefaButton
                  publicacaoId={p.id}
                  impacto={p.impacto}
                  empreendimentos={empreendimentos}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
