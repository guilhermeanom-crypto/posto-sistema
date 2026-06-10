import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import {
  ListTodo, UserX, Clock, Flame,
  Leaf, HardHat, Droplets, GraduationCap, FileText, Recycle, Waves, ClipboardCheck,
} from 'lucide-react'
import { FilaActions } from './fila-actions'

export const metadata: Metadata = { title: 'Fila de Trabalho' }

interface Props { searchParams: Promise<{ responsavel?: string; empreendimentoId?: string; modulo?: string; page?: string }> }

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  origem: string
  scoreCriticidade: number
  dataVencimento: string | null
  responsavelId: string | null
  escaladoParaId: string | null
  criadoEm: string
  empreendimento: { id: string; nome: string }
  responsavel: { id: string; nome: string } | null
  escaladoPara: { id: string; nome: string } | null
}

interface KPIs { totalPendentes: number; criticas: number; semResponsavel: number; atrasadas: number }

interface Empreendimento { id: string; nome: string }

const origemIcon: Record<string, typeof Leaf> = {
  REGRA_VENCIMENTO_LICENCA: Leaf,
  REGRA_VENCIMENTO_PROC: FileText,
  REGRA_CONDICIONANTE: ClipboardCheck,
  REGRA_VENCIMENTO_ESTANQUEIDADE: Droplets,
  REGRA_VENCIMENTO_PGRS: Recycle,
  REGRA_VENCIMENTO_ANP: HardHat,
  REGRA_VENCIMENTO_SST: GraduationCap,
  REGRA_VENCIMENTO_OUTORGA: Waves,
  REGRA_VENCIMENTO_DOC: FileText,
  WORKFLOW: ClipboardCheck,
  MANUAL: ListTodo,
}

const origemLabel: Record<string, string> = {
  REGRA_VENCIMENTO_LICENCA: 'Licença',
  REGRA_VENCIMENTO_PROC: 'Processo',
  REGRA_CONDICIONANTE: 'Condicionante',
  REGRA_VENCIMENTO_ESTANQUEIDADE: 'Estanqueidade',
  REGRA_VENCIMENTO_PGRS: 'PGRS',
  REGRA_VENCIMENTO_ANP: 'ANP',
  REGRA_VENCIMENTO_SST: 'SST',
  REGRA_VENCIMENTO_OUTORGA: 'Outorga',
  REGRA_VENCIMENTO_DOC: 'Documento',
  WORKFLOW: 'Checklist NC',
  MANUAL: 'Manual',
  ESCALAMENTO: 'Escalamento',
}

function scoreBadge(score: number) {
  if (score >= 70) return 'bg-red-600 text-white'
  if (score >= 50) return 'bg-yellow-500 text-white'
  if (score >= 30) return 'bg-blue-500 text-white'
  return 'bg-gray-300 text-gray-700'
}

function diasLabel(iso: string | null) {
  if (!iso) return null
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  if (d < 0) return { text: `Vencido há ${Math.abs(d)}d`, cls: 'text-red-600 font-semibold' }
  if (d === 0) return { text: 'Vence hoje', cls: 'text-red-600 font-semibold' }
  if (d <= 7) return { text: `${d}d restantes`, cls: 'text-orange-600 font-medium' }
  if (d <= 30) return { text: `${d}d`, cls: 'text-yellow-600' }
  return { text: `${d}d`, cls: 'text-muted-foreground' }
}

export default async function FilaPage({ searchParams }: Props) {
  const params = await searchParams
  const token = await getAccessToken()
  const responsavel = params.responsavel ?? 'minhas'
  const page = parseInt(params.page ?? '1', 10)

  let tarefas: Tarefa[] = []
  let kpis: KPIs = { totalPendentes: 0, criticas: 0, semResponsavel: 0, atrasadas: 0 }
  let total = 0
  let empreendimentos: Empreendimento[] = []

  if (token) {
    const qs = new URLSearchParams({
      responsavel,
      page: String(page),
      limit: '30',
      ...(params.empreendimentoId && { empreendimentoId: params.empreendimentoId }),
      ...(params.modulo && { modulo: params.modulo }),
    })

    const [filaRes, empRes] = await Promise.allSettled([
      api.get<{ data: Tarefa[]; kpis: KPIs; pagination: { total: number } }>(`/fila?${qs}`, token),
      api.get<PaginatedResponse<Empreendimento>>('/empreendimentos?limit=100', token),
    ])

    if (filaRes.status === 'fulfilled') {
      tarefas = filaRes.value.data
      kpis = filaRes.value.kpis
      total = filaRes.value.pagination.total
    }
    if (empRes.status === 'fulfilled') empreendimentos = empRes.value.data
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ListTodo className="h-6 w-6 text-primary" />
          Fila de Trabalho
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Todas as pendências ordenadas por criticidade. O que está no topo precisa de ação primeiro.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <ListTodo className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">Total Pendente</span>
          </div>
          <p className="text-2xl font-bold">{kpis.totalPendentes}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-muted-foreground">Críticas (score&gt;70)</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{kpis.criticas}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-muted-foreground">Atrasadas</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{kpis.atrasadas}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserX className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-muted-foreground">Sem Responsável</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{kpis.semResponsavel}</p>
        </div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1">
          {(['minhas', 'equipe', 'todas'] as const).map((r) => (
            <button key={r} type="submit" name="responsavel" value={r}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${responsavel === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {r === 'minhas' ? 'Minhas' : r === 'equipe' ? 'Equipe' : 'Todas'}
            </button>
          ))}
        </div>

        <select name="empreendimentoId" defaultValue={params.empreendimentoId ?? ''}
          className="rounded-md border bg-background px-3 py-1.5 text-xs">
          <option value="">Todos os postos</option>
          {empreendimentos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>

        <select name="modulo" defaultValue={params.modulo ?? ''}
          className="rounded-md border bg-background px-3 py-1.5 text-xs">
          <option value="">Todos os módulos</option>
          {Object.entries(origemLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Filtrar</button>
        <Link href="/fila" className="text-xs text-muted-foreground hover:underline py-1.5">Limpar</Link>
      </form>

      {/* Lista */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {tarefas.length === 0 ? (
          <div className="p-12 text-center">
            <ListTodo className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <p className="font-semibold">Fila vazia</p>
            <p className="text-sm text-muted-foreground mt-1">Nenhuma pendência encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="divide-y">
            {tarefas.map((t) => {
              const Icon = origemIcon[t.origem] ?? ListTodo
              const prazo = diasLabel(t.dataVencimento)
              return (
                <div key={t.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                  {/* Score badge */}
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${scoreBadge(t.scoreCriticidade)}`}>
                    {t.scoreCriticidade}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{origemLabel[t.origem] ?? t.origem}</span>
                      {t.escaladoParaId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">Escalada</span>
                      )}
                    </div>
                    <Link href={`/tarefas/${t.id}`} className="text-sm font-medium hover:underline line-clamp-1">{t.titulo}</Link>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{t.empreendimento.nome}</span>
                      {t.responsavel ? (
                        <span>Resp: {t.responsavel.nome}</span>
                      ) : (
                        <span className="text-purple-600 font-medium">Sem responsável</span>
                      )}
                    </div>
                  </div>

                  {/* Prazo */}
                  <div className="text-right flex-shrink-0 w-28">
                    {prazo ? (
                      <p className={`text-xs ${prazo.cls}`}>{prazo.text}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sem prazo</p>
                    )}
                  </div>

                  {/* Ações */}
                  <FilaActions tarefaId={t.id} status={t.status} temResponsavel={!!t.responsavelId} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Paginação */}
      {total > 30 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Página {page} de {Math.ceil(total / 30)} ({total} total)</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/fila?${new URLSearchParams({ ...params, page: String(page - 1) })}`} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Anterior</Link>}
            {page < Math.ceil(total / 30) && <Link href={`/fila?${new URLSearchParams({ ...params, page: String(page + 1) })}`} className="rounded-md border px-3 py-1 text-sm hover:bg-muted">Próxima</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
