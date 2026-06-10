import Link from 'next/link'
import { ArrowRight, ClipboardList } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/date'
import type {
  StatusOrdemServico,
  TipoOrdemServico,
  OrdemServicoResumo,
  ApiPagination,
} from '@repo/types'

export const metadata = { title: 'Minhas OS' }

type StatusOS = StatusOrdemServico
type TipoOS = TipoOrdemServico

interface OSListResponse {
  data: OrdemServicoResumo[]
  pagination: ApiPagination
}

const STATUS_LABEL: Record<StatusOS, string> = {
  PLANEJADA: 'Planejada',
  EM_EXECUCAO: 'Em execução',
  AGUARDANDO_REVISAO: 'Aguardando revisão',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

const STATUS_TONE: Record<StatusOS, string> = {
  PLANEJADA: 'bg-sky-50 text-sky-700 border-sky-200',
  EM_EXECUCAO: 'bg-amber-50 text-amber-700 border-amber-200',
  AGUARDANDO_REVISAO: 'bg-violet-50 text-violet-700 border-violet-200',
  CONCLUIDA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADA: 'bg-red-50 text-red-700 border-red-200',
}

const TIPO_LABEL: Record<TipoOS, string> = {
  VISTORIA_TECNICA: 'Vistoria técnica',
  COLETA_AMOSTRA: 'Coleta de amostra',
  RENOVACAO_LICENCA: 'Renovação de licença',
  DILIGENCIA: 'Diligência',
  PROTOCOLO: 'Protocolo',
  RELATORIO: 'Relatório',
  OUTRO: 'Outro',
}

export default async function EquipeOsPage() {
  const token = await getAccessToken()
  let ordens: OrdemServicoResumo[] = []
  let erro: string | null = null

  if (token) {
    try {
      const resposta = await api.get<OSListResponse>(
        '/operacao/ordens-servico?apenasMinhas=true&apenasAbertas=true&limit=50',
        token,
      )
      ordens = resposta.data
    } catch {
      erro = 'Não foi possível carregar suas OSs no momento.'
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Operação de campo
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Minhas OS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            OS atribuídas a você que estão em aberto (planejadas, em execução ou aguardando revisão).
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold tabular-nums text-muted-foreground">
          {ordens.length} atribuída{ordens.length === 1 ? '' : 's'}
        </span>
      </div>

      {erro ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</div>
      ) : null}

      <article className="rounded-xl border bg-card overflow-hidden">
        <header className="border-b px-5 py-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Lista de OS</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  OS · Cliente
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Tipo
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Prazo
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {ordens.map((os) => (
                <tr key={os.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-12 place-items-center rounded-md border border-border bg-white text-[10px] font-bold tabular-nums text-muted-foreground">
                        {os.empreendimentoEstado ?? '—'}
                      </span>
                      <div>
                        <p className="font-semibold tracking-tight text-foreground">
                          {os.empreendimentoNome ?? os.titulo}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{os.numero}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{TIPO_LABEL[os.tipo]}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums text-foreground">
                    {formatDate(os.dataPlanejada)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[os.status]}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      {STATUS_LABEL[os.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href="/equipe/checklists"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-primary/40 hover:text-primary"
                    >
                      Abrir <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {ordens.length === 0 && !erro ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma OS atribuída a você no momento.
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
