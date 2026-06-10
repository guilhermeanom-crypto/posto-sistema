import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'Auditoria' }

interface AuditItem {
  id: string
  acao: string
  entidadeTipo: string
  entidadeId: string
  usuarioNome: string | null
  usuarioEmail: string | null
  usuarioPerfil: string | null
  ipOrigem: string | null
  dadosAntes: unknown
  dadosDepois: unknown
  contexto: Record<string, string> | null
  criadoEm: string
}

interface Resumo {
  total: number
  porEntidade: { entidadeTipo: string; total: number }[]
  topUsuarios: { nome: string | null; email: string | null; total: number }[]
}

interface Props {
  searchParams: Promise<{
    usuarioId?: string
    entidadeTipo?: string
    entidadeId?: string
    acao?: string
    empreendimentoId?: string
    de?: string
    ate?: string
    page?: string
  }>
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const entidadeLabel: Record<string, string> = {
  Documento:           'Documento',
  DocumentoVersao:     'Versão de Documento',
  Processo:            'Processo',
  Condicionante:       'Condicionante',
  Tarefa:              'Tarefa',
  LicencaAmbiental:    'Licença Ambiental',
  Empreendimento:      'Empreendimento',
  Usuario:             'Usuário',
  MTR:                 'MTR',
  CampanhaMonitoramento: 'Campanha de Monitoramento',
  ChecklistExecucao:   'Checklist',
  AutoInfracao:        'Auto de Infração',
  ASO:                 'ASO',
  Tanque:              'Tanque',
  BombaAbastecimento:  'Bomba',
  PocoArtesiano:       'Poço Artesiano',
  PocoMonitoramento:   'Ponto de Monitoramento',
}

// Mapa ação → cor do badge
function acaoColor(acao: string): string {
  if (acao.includes('criado') || acao.includes('aprovado') || acao.includes('concluido'))
    return 'bg-emerald-100 text-emerald-800'
  if (acao.includes('excluido') || acao.includes('cancelado') || acao.includes('rejeitado') || acao.includes('reprovado'))
    return 'bg-red-100 text-red-800'
  if (acao.includes('atualizado') || acao.includes('editado') || acao.includes('alterado'))
    return 'bg-blue-100 text-blue-800'
  if (acao.includes('login') || acao.includes('acesso'))
    return 'bg-purple-100 text-purple-800'
  return 'bg-gray-100 text-gray-700'
}

function acaoLabel(acao: string): string {
  return acao.replace(/\./g, ' › ').replace(/_/g, ' ')
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AuditoriaPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = parseInt(sp.page ?? '1')
  const token = await getAccessToken()

  let items: AuditItem[] = []
  let total = 0
  let totalPages = 1
  let resumo: Resumo | null = null

  if (token) {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (sp.usuarioId)        params.set('usuarioId', sp.usuarioId)
      if (sp.entidadeTipo)     params.set('entidadeTipo', sp.entidadeTipo)
      if (sp.entidadeId)       params.set('entidadeId', sp.entidadeId)
      if (sp.acao)             params.set('acao', sp.acao)
      if (sp.empreendimentoId) params.set('empreendimentoId', sp.empreendimentoId)
      if (sp.de)               params.set('de', sp.de)
      if (sp.ate)              params.set('ate', sp.ate)

      const [logRes, resumoRes] = await Promise.all([
        api.get<{ data: AuditItem[]; pagination: { total: number; totalPages: number } }>(
          `/audit-log?${params}`, token
        ),
        api.get<{ data: Resumo }>(`/audit-log/resumo${sp.de ? `?de=${sp.de}` : ''}`, token),
      ])
      items = logRes.data
      total = logRes.pagination.total
      totalPages = logRes.pagination.totalPages
      resumo = resumoRes.data
    } catch {}
  }

  const hasFilter = !!(sp.usuarioId || sp.entidadeTipo || sp.entidadeId || sp.acao || sp.empreendimentoId || sp.de || sp.ate)

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams()
    const merged = { ...sp, page: '1', ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) next.set(k, v)
    }
    return `/auditoria?${next}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Trilha de eventos — todas as ações registradas no sistema</p>
      </div>

      {/* Resumo KPIs */}
      {resumo && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 space-y-1 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total eventos</p>
            <p className="text-2xl font-bold">{resumo.total.toLocaleString('pt-BR')}</p>
          </div>
          {resumo.porEntidade.slice(0, 3).map((e) => (
            <div key={e.entidadeTipo} className="rounded-lg border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium truncate">
                {entidadeLabel[e.entidadeTipo] ?? e.entidadeTipo}
              </p>
              <p className="text-2xl font-bold">{e.total.toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filtros (sidebar) */}
        <div className="space-y-4 lg:col-span-1">
          <form method="GET" className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Buscar ação</label>
              <input
                name="acao"
                defaultValue={sp.acao ?? ''}
                placeholder="ex: documento"
                className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tipo de entidade</label>
              <select
                name="entidadeTipo"
                defaultValue={sp.entidadeTipo ?? ''}
                className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Todos</option>
                {Object.keys(entidadeLabel).map((k) => (
                  <option key={k} value={k}>{entidadeLabel[k]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">De</label>
              <input
                name="de"
                type="date"
                defaultValue={sp.de ?? ''}
                className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Até</label>
              <input
                name="ate"
                type="date"
                defaultValue={sp.ate ?? ''}
                className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-primary text-primary-foreground py-2 text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Filtrar
            </button>
            {hasFilter && (
              <Link
                href="/auditoria"
                className="block text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar filtros
              </Link>
            )}
          </form>

          {/* Top usuários */}
          {resumo && resumo.topUsuarios.length > 0 && (
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Top usuários</p>
              {resumo.topUsuarios.slice(0, 5).map((u, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-xs truncate text-foreground">{u.nome ?? u.email ?? '—'}</p>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground ml-2 flex-shrink-0">{u.total}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tipos de entidade */}
          {resumo && resumo.porEntidade.length > 0 && (
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Por entidade</p>
              {resumo.porEntidade.slice(0, 8).map((e) => (
                <Link
                  key={e.entidadeTipo}
                  href={buildHref({ entidadeTipo: e.entidadeTipo })}
                  className="flex items-center justify-between hover:text-primary transition-colors"
                >
                  <p className="text-xs truncate">{entidadeLabel[e.entidadeTipo] ?? e.entidadeTipo}</p>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground ml-2 flex-shrink-0">{e.total}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{total.toLocaleString('pt-BR')} evento{total !== 1 ? 's' : ''}</p>
            <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
              Nenhum evento encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="relative">
              {/* Linha vertical da timeline */}
              <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />

              <div className="space-y-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 relative">
                    {/* Dot */}
                    <div className="flex-shrink-0 w-10 flex justify-center pt-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-border ring-2 ring-background relative z-10" />
                    </div>

                    {/* Card */}
                    <div className="flex-1 min-w-0 rounded-lg border bg-card px-4 py-3 mb-1 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${acaoColor(item.acao)}`}>
                              {acaoLabel(item.acao)}
                            </span>
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                              {entidadeLabel[item.entidadeTipo] ?? item.entidadeTipo}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-xs font-medium">{item.usuarioNome ?? item.usuarioEmail ?? 'Sistema'}</p>
                            {item.usuarioPerfil && (
                              <span className="text-xs text-muted-foreground">· {item.usuarioPerfil.replace(/_/g, ' ')}</span>
                            )}
                            {item.ipOrigem && (
                              <span className="text-xs text-muted-foreground">· {item.ipOrigem}</span>
                            )}
                          </div>
                          {/* Contexto */}
                          {item.contexto && Object.keys(item.contexto).length > 0 && (
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {item.contexto.empreendimentoId && (
                                <Link
                                  href={`/empreendimentos/${item.contexto.empreendimentoId}`}
                                  className="text-xs text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  ver empreendimento →
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                        <time className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                          {formatDateTime(item.criadoEm)}
                        </time>
                      </div>

                      {/* Diff resumido — mostra campos alterados */}
                      {Boolean(item.dadosAntes) && Boolean(item.dadosDepois) && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
                            Ver alterações
                          </summary>
                          <DiffView antes={item.dadosAntes as Record<string, unknown>} depois={item.dadosDepois as Record<string, unknown>} />
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              {page > 1 ? (
                <Link
                  href={buildHref({ page: String(page - 1) })}
                  className="text-sm text-primary hover:underline"
                >
                  ← Anterior
                </Link>
              ) : <span />}
              <p className="text-xs text-muted-foreground">{page} / {totalPages}</p>
              {page < totalPages ? (
                <Link
                  href={buildHref({ page: String(page + 1) })}
                  className="text-sm text-primary hover:underline"
                >
                  Próxima →
                </Link>
              ) : <span />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── DiffView ─────────────────────────────────────────────────────────────────

function DiffView({ antes, depois }: { antes: Record<string, unknown>; depois: Record<string, unknown> }) {
  const keys = Array.from(new Set([...Object.keys(antes), ...Object.keys(depois)]))
  const changed = keys.filter((k) => JSON.stringify(antes[k]) !== JSON.stringify(depois[k]))

  if (changed.length === 0) return null

  return (
    <div className="mt-2 rounded-md bg-muted/50 border text-xs font-mono overflow-auto max-h-40">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/60">
            <th className="px-2 py-1 text-left text-muted-foreground font-medium w-1/4">Campo</th>
            <th className="px-2 py-1 text-left text-red-700 font-medium w-[37.5%]">Antes</th>
            <th className="px-2 py-1 text-left text-emerald-700 font-medium w-[37.5%]">Depois</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {changed.map((k) => (
            <tr key={k}>
              <td className="px-2 py-1 text-muted-foreground truncate max-w-[120px]">{k}</td>
              <td className="px-2 py-1 text-red-700 truncate max-w-[180px]">
                {antes[k] === undefined ? '—' : JSON.stringify(antes[k])}
              </td>
              <td className="px-2 py-1 text-emerald-700 truncate max-w-[180px]">
                {depois[k] === undefined ? '—' : JSON.stringify(depois[k])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
