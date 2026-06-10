import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, PackageCheck } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/date'
import type {
  StatusEntregavel,
  TipoEntregavel,
  EntregavelResumo,
  EntregavelKpis,
  ApiPagination,
} from '@repo/types'

export const metadata: Metadata = { title: 'Entregáveis' }

interface EntregaveisListResponse {
  data: EntregavelResumo[]
  pagination: ApiPagination
}

interface EntregavelKpisResponse {
  data: EntregavelKpis
}

const STATUS_LABEL: Record<StatusEntregavel, string> = {
  PENDENTE: 'Pendente',
  GERANDO: 'Gerando…',
  DISPONIVEL: 'Disponível',
  ERRO: 'Erro',
  CANCELADO: 'Cancelado',
}

const STATUS_BADGE: Record<StatusEntregavel, string> = {
  PENDENTE: 'bg-amber-100 text-amber-800 border-amber-200',
  GERANDO: 'bg-sky-100 text-sky-800 border-sky-200 animate-pulse',
  DISPONIVEL: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ERRO: 'bg-red-100 text-red-800 border-red-200',
  CANCELADO: 'bg-slate-200 text-slate-600 border-slate-300',
}

const TIPO_LABEL: Record<TipoEntregavel, string> = {
  LAUDO: 'Laudo',
  RELATORIO: 'Relatório',
  PROTOCOLO: 'Protocolo',
  CERTIFICADO: 'Certificado',
  ATA: 'Ata',
  EVIDENCIA: 'Evidência',
  OUTRO: 'Outro',
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function EntregaveisPage() {
  const token = await getAccessToken()

  let entregaveis: EntregavelResumo[] = []
  let kpis = { totalPendentes: 0, totalDisponiveis: 0, totalCadastrados: 0 }
  let erro: string | null = null

  if (token) {
    try {
      const [lista, kpisResp] = await Promise.all([
        api.get<EntregaveisListResponse>('/operacao/entregaveis?limit=50', token),
        api.get<EntregavelKpisResponse>('/operacao/entregaveis/kpis', token),
      ])
      entregaveis = lista.data
      kpis = kpisResp.data
    } catch {
      erro = 'Não foi possível carregar os entregáveis no momento.'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Saída formal
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Entregáveis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Documentos, laudos, relatórios e evidências gerados a partir das Ordens de Serviço.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Kpi label="Pendentes" value={kpis.totalPendentes} />
          <Kpi label="Disponíveis" value={kpis.totalDisponiveis} />
          <Kpi label="Total" value={kpis.totalCadastrados} />
        </div>
      </div>

      {erro ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{erro}</div>
      ) : null}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          <span>Número</span>
          <span>Título / Cliente</span>
          <span>Tipo</span>
          <span>Status</span>
          <span>Arquivo</span>
          <span>Data</span>
        </div>
        <div className="divide-y">
          {entregaveis.map((ent) => (
            <div
              key={ent.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-4 text-sm"
            >
              <span className="self-center font-mono text-xs font-semibold text-slate-700">
                {ent.numero}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{ent.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ent.empreendimentoNome ?? 'Sem empreendimento'}
                  {ent.osNumero ? ` · OS ${ent.osNumero}` : ''}
                </p>
              </div>
              <span className="self-center text-xs text-muted-foreground">
                {TIPO_LABEL[ent.tipo]}
              </span>
              <span
                className={`self-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[ent.status]}`}
              >
                {STATUS_LABEL[ent.status]}
              </span>
              <span className="self-center text-xs text-muted-foreground">
                {ent.status === 'DISPONIVEL' && ent.nomeArquivo ? (
                  <span title={ent.nomeArquivo}>
                    {ent.nomeArquivo} ({formatBytes(ent.tamanhoBytes)})
                  </span>
                ) : (
                  '—'
                )}
              </span>
              <span className="self-center text-xs text-muted-foreground">
                {ent.geradoEm ? formatDate(ent.geradoEm) : formatDate(ent.criadoEm)}
              </span>
            </div>
          ))}
          {entregaveis.length === 0 && !erro ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhum entregável cadastrado. Entregáveis são gerados a partir de{' '}
              <Link href="/ordens-servico" className="text-primary underline">
                Ordens de Serviço
              </Link>
              .
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <PackageCheck className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Próxima evolução</p>
            <p className="text-sm text-muted-foreground">
              Consolidação financeira — vincular entregáveis a faturamento e margem por contrato.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-right">
      <FileText className="ml-auto mb-1 h-4 w-4 text-primary" />
      <p className="text-xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  )
}
