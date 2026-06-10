import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'

export const metadata: Metadata = { title: 'Treinamentos SST' }

interface Props {
  searchParams: Promise<{
    empreendimentoId?: string
    normativa?: string
    status?: string
    page?: string
  }>
}

interface Empreendimento { id: string; nome: string; nomeFantasia: string | null }

interface TreinamentoExecucao {
  id: string
  dataRealizacao: string
  dataVencimento: string | null
  status: string
  instrutor: string | null
  local: string | null
  cargaHorariaRealizada: number | null
  empreendimento: { id: string; nome: string; nomeFantasia: string | null }
  tipo: {
    id: string; nome: string; normativa: string; cargaHoraria: number; periodicidadeMeses: number
  }
  participantes: Array<{
    id: string; presenca: boolean; aprovado: boolean
    funcionario: { id: string; nome: string; cargo: string }
  }>
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasParaVencer(iso: string | null | undefined) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const normativaColors: Record<string, string> = {
  'NR-20': 'bg-orange-100 text-orange-800',
  'NR-35': 'bg-purple-100 text-purple-800',
  'NR-10': 'bg-yellow-100 text-yellow-800',
  'NR-12': 'bg-blue-100 text-blue-800',
  'NR-06': 'bg-teal-100 text-teal-800',
  'NR-07': 'bg-green-100 text-green-800',
  'CIPA':  'bg-pink-100 text-pink-800',
  'BRIGADA': 'bg-red-100 text-red-800',
}

const normativas = ['NR-20', 'NR-35', 'NR-10', 'NR-12', 'NR-06', 'NR-07', 'CIPA', 'BRIGADA', 'OUTROS']

export default async function TreinamentosPage({ searchParams }: Props) {
  const params = await searchParams
  const token = await getAccessToken()
  const page = Number(params.page ?? 1)
  const limit = 20

  let treinamentos: TreinamentoExecucao[] = []
  let total = 0
  let empreendimentos: Empreendimento[] = []

  if (token) {
    const [resTrein, resEmps] = await Promise.allSettled([
      api.get<PaginatedResponse<TreinamentoExecucao>>(
        `/sst/treinamentos?${new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(params.empreendimentoId && { empreendimentoId: params.empreendimentoId }),
          ...(params.normativa && { normativa: params.normativa }),
          ...(params.status && { status: params.status }),
        }).toString()}`,
        token,
      ),
      api.get<PaginatedResponse<Empreendimento>>('/empreendimentos?limit=100', token),
    ])

    if (resTrein.status === 'fulfilled') {
      treinamentos = resTrein.value.data
      total = resTrein.value.pagination.total
    }
    if (resEmps.status === 'fulfilled') empreendimentos = resEmps.value.data
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/sst" className="hover:underline">SST</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Treinamentos</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Treinamentos SST</h1>
          <p className="text-muted-foreground text-sm">{total} execução{total !== 1 ? 'ões' : ''} registrada{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sst/treinamentos/tipos"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Tipos / NRs
          </Link>
          <Link
            href="/sst/treinamentos/novo"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Registrar Treinamento
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Empreendimento</label>
          <select name="empreendimentoId" defaultValue={params.empreendimentoId ?? ''}
            className="rounded-md border bg-background px-3 py-1.5 text-sm">
            <option value="">Todos</option>
            {empreendimentos.map((e) => (
              <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Normativa</label>
          <select name="normativa" defaultValue={params.normativa ?? ''}
            className="rounded-md border bg-background px-3 py-1.5 text-sm">
            <option value="">Todas</option>
            {normativas.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button type="submit"
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Filtrar
        </button>
        <Link href="/sst/treinamentos" className="text-sm text-muted-foreground hover:underline py-1.5">
          Limpar
        </Link>
      </form>

      {/* List */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {treinamentos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum treinamento registrado.</p>
            <Link href="/sst/treinamentos/novo" className="mt-3 inline-block text-sm text-primary hover:underline">
              Registrar primeiro treinamento
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Treinamento</span>
              <span className="text-center w-28">Participantes</span>
              <span className="text-center w-28">Vencimento</span>
              <span className="w-16" />
            </div>

            {treinamentos.map((t) => {
              const dias = diasParaVencer(t.dataVencimento)
              const vencido = dias !== null && dias < 0
              const vencendo = dias !== null && dias >= 0 && dias <= 30
              const normCls = normativaColors[t.tipo.normativa] ?? 'bg-gray-100 text-gray-700'
              const presentes = t.participantes.filter((p) => p.presenca).length

              return (
                <div key={t.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${normCls}`}>
                        {t.tipo.normativa}
                      </span>
                      <span className="text-sm font-medium">{t.tipo.nome}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{t.empreendimento.nomeFantasia ?? t.empreendimento.nome}</span>
                      <span>·</span>
                      <span>Realizado: {formatDate(t.dataRealizacao)}</span>
                      {t.instrutor && <><span>·</span><span>{t.instrutor}</span></>}
                      {t.local && <><span>·</span><span>{t.local}</span></>}
                    </div>
                  </div>

                  {/* Participants count */}
                  <div className="text-center w-28">
                    <span className="text-lg font-bold">{presentes}</span>
                    <span className="text-muted-foreground">/{t.participantes.length}</span>
                    <p className="text-xs text-muted-foreground">presentes</p>
                  </div>

                  {/* Vencimento */}
                  <div className="text-center w-28">
                    {t.dataVencimento ? (
                      <>
                        <p className={`text-sm font-medium ${vencido ? 'text-red-600' : vencendo ? 'text-yellow-600' : ''}`}>
                          {formatDate(t.dataVencimento)}
                        </p>
                        {vencido && <p className="text-xs text-red-600 font-semibold">Vencido</p>}
                        {vencendo && <p className="text-xs text-yellow-600 font-semibold">{dias}d restantes</p>}
                        {!vencido && !vencendo && <p className="text-xs text-green-600 font-semibold">Vigente</p>}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem vencimento</span>
                    )}
                  </div>

                  {/* Link */}
                  <Link href={`/sst/treinamentos/${t.id}`}
                    className="text-xs text-primary hover:underline w-16 text-right">
                    Detalhes →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Página {page} de {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/sst/treinamentos?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className="rounded-md border px-3 py-1 text-sm hover:bg-muted">
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/sst/treinamentos?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="rounded-md border px-3 py-1 text-sm hover:bg-muted">
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
