import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken, resolveEmpreendimentoId } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'

export const metadata: Metadata = { title: 'Funcionários' }

interface Props {
  searchParams: Promise<{
    empreendimentoId?: string
    cargo?: string
    setor?: string
    ativo?: string
    page?: string
  }>
}

interface Empreendimento {
  id: string
  nome: string
  nomeFantasia: string | null
}

interface Funcionario {
  id: string
  nome: string
  cpf: string | null
  cargo: string
  setor: string | null
  vinculo: string
  dataAdmissao: string
  ativo: boolean
  empreendimento: { id: string; nome: string; nomeFantasia: string | null }
  asoStatus: string
  treinamentoStatus: string
  epiStatus: string
  statusGeral: string
  _count: { asos: number; treinamentosParticipados: number; entregasEPI: number }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

const statusGeralConfig: Record<string, { label: string; className: string; dot: string }> = {
  OK:      { label: 'OK',      className: 'bg-green-100 text-green-800',  dot: 'bg-green-500' },
  ATENCAO: { label: 'Atenção', className: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  CRITICO: { label: 'Crítico', className: 'bg-red-100 text-red-800',      dot: 'bg-red-500' },
}

const subStatusConfig: Record<string, { label: string; className: string }> = {
  OK:      { label: 'OK',      className: 'text-green-700' },
  ATENCAO: { label: 'Atenção', className: 'text-yellow-700' },
  VENCENDO:{ label: 'Vencendo', className: 'text-yellow-700' },
  VENCIDO: { label: 'Vencido', className: 'text-red-700' },
  INAPTO:  { label: 'Inapto',  className: 'text-red-700' },
  AUSENTE: { label: 'Ausente', className: 'text-gray-400' },
}

function SubStatusBadge({ label, status }: { label: string; status: string }) {
  const cfg = subStatusConfig[status] ?? subStatusConfig['AUSENTE']!
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>
    </div>
  )
}

export default async function FuncionariosPage({ searchParams }: Props) {
  const params = await searchParams
  const token = await getAccessToken()
  // Fallback: se a query string não trouxer empreendimentoId, usa o do filtro global
  const empIdAtivo = await resolveEmpreendimentoId(params.empreendimentoId)

  let funcionarios: Funcionario[] = []
  let total = 0
  let kpis = { total: 0, ok: 0, atencao: 0, critico: 0 }
  let empreendimentos: Empreendimento[] = []
  const page = Number(params.page ?? 1)
  const limit = 30

  if (token) {
    const [resFuncs, resEmps] = await Promise.allSettled([
      api.get<PaginatedResponse<Funcionario> & { kpis?: typeof kpis }>(
        `/sst/funcionarios?${new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(empIdAtivo && { empreendimentoId: empIdAtivo }),
          ...(params.cargo && { cargo: params.cargo }),
          ...(params.setor && { setor: params.setor }),
          ...(params.ativo !== undefined && { ativo: params.ativo }),
        }).toString()}`,
        token,
      ),
      api.get<PaginatedResponse<Empreendimento>>('/empreendimentos?limit=100', token),
    ])

    if (resFuncs.status === 'fulfilled') {
      funcionarios = resFuncs.value.data
      total = resFuncs.value.pagination.total
      if (resFuncs.value.kpis) kpis = resFuncs.value.kpis
    }
    if (resEmps.status === 'fulfilled') {
      empreendimentos = resEmps.value.data
    }
  }

  const totalPages = Math.ceil(total / limit)
  const ativoFilter = params.ativo

  const counts = kpis

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-muted-foreground text-sm">
            {total} trabalhador{total !== 1 ? 'es' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/funcionarios/novo"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Novo Funcionário
        </Link>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, cls: 'border-l-4 border-l-gray-300' },
          { label: 'OK', value: counts.ok, cls: 'border-l-4 border-l-green-500' },
          { label: 'Atenção', value: counts.atencao, cls: 'border-l-4 border-l-yellow-500' },
          { label: 'Crítico', value: counts.critico, cls: 'border-l-4 border-l-red-500' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-lg border bg-card p-4 ${cls}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Empreendimento</label>
          <select
            name="empreendimentoId"
            defaultValue={params.empreendimentoId ?? ''}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {empreendimentos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nomeFantasia ?? e.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Cargo</label>
          <input
            name="cargo"
            defaultValue={params.cargo ?? ''}
            placeholder="Ex: Operador de caixa"
            className="rounded-md border bg-background px-3 py-1.5 text-sm w-44"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Situação</label>
          <select
            name="ativo"
            defaultValue={ativoFilter ?? ''}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Desligados</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filtrar
        </button>
        <Link href="/funcionarios" className="text-sm text-muted-foreground hover:underline py-1.5">
          Limpar
        </Link>
      </form>

      {/* List */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {funcionarios.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum funcionário encontrado.</p>
            <Link href="/funcionarios/novo" className="mt-3 inline-block text-sm text-primary hover:underline">
              Cadastrar primeiro funcionário
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Funcionário</span>
              <span className="text-center w-20">ASO</span>
              <span className="text-center w-20">Treinamento</span>
              <span className="text-center w-20">EPI</span>
              <span className="text-center w-24">Status</span>
              <span className="w-12" />
            </div>

            {funcionarios.map((f) => {
              const status = statusGeralConfig[f.statusGeral] ?? statusGeralConfig['ATENCAO']!
              return (
                <div
                  key={f.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  {/* Name + meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{f.nome}</span>
                      {!f.ativo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                          Desligado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{f.cargo}</span>
                      {f.setor && <span className="text-xs text-muted-foreground">· {f.setor}</span>}
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {f.empreendimento.nomeFantasia ?? f.empreendimento.nome}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        {f.vinculo}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Admissão: {formatDate(f.dataAdmissao)}
                      {f.cpf && ` · CPF: ${f.cpf}`}
                    </div>
                  </div>

                  {/* Sub-status badges */}
                  <SubStatusBadge label="ASO" status={f.asoStatus} />
                  <SubStatusBadge label="NRs" status={f.treinamentoStatus} />
                  <SubStatusBadge label="EPI" status={f.epiStatus} />

                  {/* Status geral */}
                  <div className="flex items-center justify-center w-24">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Link */}
                  <Link
                    href={`/funcionarios/${f.id}`}
                    className="text-xs text-primary hover:underline w-12 text-right"
                  >
                    Ficha →
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
          <span className="text-muted-foreground">
            Página {page} de {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/funcionarios?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/funcionarios?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
              >
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
