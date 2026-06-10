'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type {
  HandoffComercialResumo,
  ListarHandoffsOperacionaisParams,
  PrioridadeOperacionalHandoff,
  StatusHandoffComercial,
} from './shared'
import {
  POTENCIAL_POLUIDOR_LABELS,
  PRIORIDADE_OPERACIONAL_LABELS,
  RISCO_NIVEL_LABELS,
  STATUS_HANDOFF_LABELS,
} from './shared'

const PRIORIDADE_BADGE_CLASS: Record<PrioridadeOperacionalHandoff, string> = {
  BAIXA: 'bg-sky-100 text-sky-800',
  MEDIA: 'bg-amber-100 text-amber-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
}

function prioridadeBadge(value: HandoffComercialResumo['prioridadeOperacional']) {
  if (!value) {
    return <span className="text-xs text-slate-400">—</span>
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${PRIORIDADE_BADGE_CLASS[value]}`}>
      {PRIORIDADE_OPERACIONAL_LABELS[value]}
    </span>
  )
}

function preparacaoBadges(handoff: HandoffComercialResumo) {
  const flags: Array<{ key: string; label: string; active: boolean | null }> = [
    { key: 'doc', label: 'Doc', active: handoff.necessidadeDocumentos },
    { key: 'visita', label: 'Visita', active: handoff.necessidadeVisita },
    { key: 'terceiro', label: 'Terceiro', active: handoff.necessidadeTerceiro },
  ]
  const active = flags.filter((flag) => flag.active === true)
  if (active.length === 0) {
    return <span className="text-xs text-slate-400">—</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {active.map((flag) => (
        <span
          key={flag.key}
          className="inline-flex rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800"
          title={`Pendência de ${flag.label.toLowerCase()}`}
        >
          {flag.label}
        </span>
      ))}
    </div>
  )
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function riskLabel(value: HandoffComercialResumo['riscoNivel']) {
  if (!value) return '—'
  return RISCO_NIVEL_LABELS[value]
}

function pollutionLabel(value: HandoffComercialResumo['potencialPoluidor']) {
  if (!value) return '—'
  return POTENCIAL_POLUIDOR_LABELS[value]
}

function responsavelComercialLabel(value: string) {
  return value ? 'Responsável comercial definido' : 'Responsável comercial não informado'
}

function responsavelOperacionalLabel(value: string | null) {
  return value ? 'Responsável operacional atribuído' : 'Responsável operacional não atribuído'
}

const INITIAL_FILTERS: ListarHandoffsOperacionaisParams = {
  status: '',
  propostaComercialId: '',
  empreendimentoId: '',
  responsavelComercialId: '',
  responsavelOperacionalId: '',
  prioridadeOperacional: '',
  comNecessidadeDocumentos: false,
  comNecessidadeVisita: false,
  comNecessidadeTerceiro: false,
  apenasAtivos: false,
}

export default function HandoffsOperacionaisPage() {
  const [handoffs, setHandoffs] = useState<HandoffComercialResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canRead, setCanRead] = useState(true)
  const [filters, setFilters] = useState<ListarHandoffsOperacionaisParams>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<ListarHandoffsOperacionaisParams>(INITIAL_FILTERS)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    async function loadHandoffs() {
      setLoading(true)
      setError(null)

      try {
        const query = new URLSearchParams()
        query.set('page', String(page))
        query.set('limit', String(pagination.limit))
        if (appliedFilters.status) query.set('status', appliedFilters.status)
        if (appliedFilters.propostaComercialId) query.set('propostaComercialId', appliedFilters.propostaComercialId)
        if (appliedFilters.empreendimentoId) query.set('empreendimentoId', appliedFilters.empreendimentoId)
        if (appliedFilters.responsavelComercialId) query.set('responsavelComercialId', appliedFilters.responsavelComercialId)
        if (appliedFilters.responsavelOperacionalId) query.set('responsavelOperacionalId', appliedFilters.responsavelOperacionalId)
        if (appliedFilters.prioridadeOperacional) query.set('prioridadeOperacional', appliedFilters.prioridadeOperacional)
        if (appliedFilters.comNecessidadeDocumentos) query.set('comNecessidadeDocumentos', 'true')
        if (appliedFilters.comNecessidadeVisita) query.set('comNecessidadeVisita', 'true')
        if (appliedFilters.comNecessidadeTerceiro) query.set('comNecessidadeTerceiro', 'true')
        if (appliedFilters.apenasAtivos) query.set('apenasAtivos', 'true')

        const response = await fetch(`/api/operacao/handoffs?${query.toString()}`, {
          cache: 'no-store',
        })
        const body = (await response.json().catch(() => ({}))) as {
          data?: HandoffComercialResumo[]
          pagination?: {
            page: number
            limit: number
            total: number
            totalPages: number
          }
          error?: string
        }

        if (!response.ok) {
          setCanRead(response.status !== 403)
          setHandoffs([])
          setPagination(
            body.pagination ?? {
              page,
              limit: pagination.limit,
              total: 0,
              totalPages: 0,
            },
          )
          setError(body.error || 'Não foi possível carregar os handoffs operacionais no momento.')
          return
        }

        setCanRead(true)
        setHandoffs(body.data ?? [])
        setPagination(
          body.pagination ?? {
            page,
            limit: pagination.limit,
            total: 0,
            totalPages: 0,
          },
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar handoffs operacionais')
        setHandoffs([])
      } finally {
        setLoading(false)
      }
    }

    loadHandoffs()
  }, [appliedFilters, page, pagination.limit])

  function updateFilter<K extends keyof ListarHandoffsOperacionaisParams>(
    key: K,
    value: ListarHandoffsOperacionaisParams[K],
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleApplyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setAppliedFilters(filters)
  }

  function handleClearFilters() {
    setFilters(INITIAL_FILTERS)
    setAppliedFilters(INITIAL_FILTERS)
    setPage(1)
  }

  const hasFilters = Boolean(
    appliedFilters.status ||
    appliedFilters.propostaComercialId ||
    appliedFilters.empreendimentoId ||
    appliedFilters.responsavelComercialId ||
    appliedFilters.responsavelOperacionalId ||
    appliedFilters.prioridadeOperacional ||
    appliedFilters.comNecessidadeDocumentos ||
    appliedFilters.comNecessidadeVisita ||
    appliedFilters.comNecessidadeTerceiro ||
    appliedFilters.apenasAtivos,
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Operação</p>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Handoffs Comerciais</h1>
          <p className="mt-1 text-sm text-gray-600">
            Acompanhe as propostas aprovadas que já foram entregues para triagem e condução operacional.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleApplyFilters}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Leitura operacional da fila
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="status" className="text-xs font-medium text-gray-600">
                Status
              </label>
              <select
                id="status"
                value={filters.status ?? ''}
                onChange={(event) => updateFilter('status', event.target.value as StatusHandoffComercial | '')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {Object.entries(STATUS_HANDOFF_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="prioridadeOperacional" className="text-xs font-medium text-gray-600">
                Prioridade da preparação
              </label>
              <select
                id="prioridadeOperacional"
                value={filters.prioridadeOperacional ?? ''}
                onChange={(event) =>
                  updateFilter('prioridadeOperacional', event.target.value as PrioridadeOperacionalHandoff | '')
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Qualquer</option>
                {Object.entries(PRIORIDADE_OPERACIONAL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex h-10 items-center gap-2 self-end rounded-md border border-input bg-background px-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(filters.apenasAtivos)}
                onChange={(event) => updateFilter('apenasAtivos', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
              />
              <span>Mostrar apenas handoffs ativos</span>
            </label>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Pendências de preparação
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(filters.comNecessidadeDocumentos)}
                onChange={(event) => updateFilter('comNecessidadeDocumentos', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600"
              />
              <span>Com pendência de documentos</span>
            </label>
            <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(filters.comNecessidadeVisita)}
                onChange={(event) => updateFilter('comNecessidadeVisita', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600"
              />
              <span>Com pendência de visita</span>
            </label>
            <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(filters.comNecessidadeTerceiro)}
                onChange={(event) => updateFilter('comNecessidadeTerceiro', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600"
              />
              <span>Com pendência de terceiro</span>
            </label>
          </div>
        </div>

        <details className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-slate-600">
            Busca avançada por referência
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label htmlFor="propostaComercialId" className="text-xs font-medium text-gray-600">
                Proposta
              </label>
              <input
                id="propostaComercialId"
                value={filters.propostaComercialId ?? ''}
                onChange={(event) => updateFilter('propostaComercialId', event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="UUID da proposta"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="empreendimentoId" className="text-xs font-medium text-gray-600">
                Empreendimento
              </label>
              <input
                id="empreendimentoId"
                value={filters.empreendimentoId ?? ''}
                onChange={(event) => updateFilter('empreendimentoId', event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="UUID do empreendimento"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="responsavelComercialId" className="text-xs font-medium text-gray-600">
                Resp. comercial
              </label>
              <input
                id="responsavelComercialId"
                value={filters.responsavelComercialId ?? ''}
                onChange={(event) => updateFilter('responsavelComercialId', event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="UUID do responsável"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="responsavelOperacionalId" className="text-xs font-medium text-gray-600">
                Resp. operacional
              </label>
              <input
                id="responsavelOperacionalId"
                value={filters.responsavelOperacionalId ?? ''}
                onChange={(event) => updateFilter('responsavelOperacionalId', event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="UUID do responsável"
              />
            </div>
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpar filtros
          </button>
          <span className="text-xs text-slate-500">
            {pagination.total} handoff{pagination.total === 1 ? '' : 's'} encontrado{pagination.total === 1 ? '' : 's'}
          </span>
        </div>
      </form>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Carregando handoffs operacionais...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-medium">{canRead ? 'Erro ao carregar handoffs' : 'Sem permissão para acessar handoffs'}</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {!loading && !error && handoffs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Nenhum handoff encontrado</h2>
          <p className="mt-2 text-sm text-slate-600">
            {hasFilters
              ? 'Ajuste os filtros para ampliar a busca operacional.'
              : 'Os handoffs operacionais aparecerão aqui assim que forem iniciados a partir de propostas aprovadas.'}
          </p>
        </div>
      ) : null}

      {!loading && !error && handoffs.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Proposta</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Prioridade</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Preparação</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Lead / Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Localidade</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">CNAE / Risco</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Potencial</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Responsáveis</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Datas</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {handoffs.map((handoff) => (
                  <tr key={handoff.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{handoff.numeroProposta}</p>
                      <p className="text-xs text-slate-500">
                        {handoff.cnaePrincipalDescricao || 'Proposta pronta para leitura operacional'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                        {STATUS_HANDOFF_LABELS[handoff.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{prioridadeBadge(handoff.prioridadeOperacional)}</td>
                    <td className="px-4 py-3">{preparacaoBadges(handoff)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{handoff.nomeLead || '—'}</p>
                      <p className="text-xs text-slate-500">{handoff.empresaLead || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {handoff.municipio ? `${handoff.municipio}/${handoff.uf}` : handoff.uf || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900">{handoff.cnaePrincipalCodigo || 'CNAE não informado'}</p>
                      <p className="text-xs text-slate-500">{riskLabel(handoff.riscoNivel)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {pollutionLabel(handoff.potencialPoluidor)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-700">{responsavelComercialLabel(handoff.responsavelComercialId)}</p>
                      <p className="text-xs text-slate-500">{responsavelOperacionalLabel(handoff.responsavelOperacionalId)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-700">Criado: {formatDateTime(handoff.criadoEm)}</p>
                      <p className="text-xs text-slate-500">Atualizado: {formatDateTime(handoff.atualizadoEm)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/operacao/handoffs/${handoff.id}`}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800 hover:underline"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Página {pagination.page} de {Math.max(pagination.totalPages, 1)}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={pagination.page <= 1}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={pagination.totalPages > 0 && pagination.page >= pagination.totalPages}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
