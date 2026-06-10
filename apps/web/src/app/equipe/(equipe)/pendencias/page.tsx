import { ListChecks } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/date'

export const metadata = { title: 'Pendências da equipe' }

type Prioridade = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
type StatusPendencia = 'ABERTA' | 'EM_ANDAMENTO' | 'ENVIADA_CLIENTE' | 'RESOLVIDA' | 'CANCELADA'

interface Pendencia {
  id: string
  descricao: string
  prioridade: Prioridade
  status: StatusPendencia
  prazo: string | null
  ordemServico?: { numero: string } | null
  responsavel?: { nome: string } | null
}

const PRIO_LABEL: Record<Prioridade, string> = { CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' }
const PRIO_TONE: Record<Prioridade, string> = {
  CRITICA: 'bg-red-50 text-red-700 border-red-200',
  ALTA: 'bg-orange-50 text-orange-700 border-orange-200',
  MEDIA: 'bg-amber-50 text-amber-700 border-amber-200',
  BAIXA: 'bg-sky-50 text-sky-700 border-sky-200',
}
const ST_LABEL: Record<StatusPendencia, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  ENVIADA_CLIENTE: 'Enviada cliente',
  RESOLVIDA: 'Resolvida',
  CANCELADA: 'Cancelada',
}
const ST_TONE: Record<StatusPendencia, string> = {
  ABERTA: 'bg-orange-50 text-orange-700 border-orange-200',
  EM_ANDAMENTO: 'bg-amber-50 text-amber-700 border-amber-200',
  ENVIADA_CLIENTE: 'bg-sky-50 text-sky-700 border-sky-200',
  RESOLVIDA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADA: 'bg-muted text-muted-foreground border-border',
}

export default async function PendenciasPage() {
  const token = await getAccessToken()
  let itens: Pendencia[] = []
  let erro: string | null = null

  if (token) {
    try {
      const res = await api.get<{ data: Pendencia[] }>('/pendencias?limit=50', token)
      itens = res.data
    } catch {
      erro = 'Não foi possível carregar as pendências no momento.'
    }
  }

  const emAberto = itens.filter((p) => p.status !== 'RESOLVIDA' && p.status !== 'CANCELADA').length

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Operação</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Pendências</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Achados de campo viram pendência com responsável, prazo e validação.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold tabular-nums text-muted-foreground">
          {emAberto} em aberto
        </span>
      </div>

      {erro ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</div>
      ) : null}

      <article className="rounded-xl border bg-card overflow-hidden">
        <header className="flex items-center gap-2 border-b px-5 py-3">
          <ListChecks className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Pendências da operação</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Descrição</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">OS</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Prazo</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Prioridade</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {itens.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3 text-foreground font-medium">{p.descricao}</td>
                  <td className="px-5 py-3 font-mono text-muted-foreground">{p.ordemServico?.numero ?? '—'}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">{p.prazo ? formatDate(p.prazo) : '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIO_TONE[p.prioridade]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      {PRIO_LABEL[p.prioridade]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${ST_TONE[p.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      {ST_LABEL[p.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && !erro ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma pendência registrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}
