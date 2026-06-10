import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export const metadata: Metadata = { title: 'Checklists' }

interface Template {
  id: string
  nome: string
  modulo: string
  periodicidade: string
  ativo: boolean
  itens: { id: string }[]
}

interface Execucao {
  id: string
  status: string
  iniciadaEm: string
  finalizadaEm: string | null
  template: { nome: string; modulo: string }
  empreendimento: { nome: string; nomeFantasia: string | null }
  executadoPor: { nome: string }
  respostas: { status: string }[]
}

const moduloLabel: Record<string, string> = {
  AMBIENTAL: 'Ambiental',
  SST: 'SST',
  OPERACIONAL: 'Operacional',
  ANP: 'ANP/INMETRO',
  ESTANQUEIDADE: 'Estanqueidade',
  GERAL: 'Geral',
}

const periodicidadeLabel: Record<string, string> = {
  DIARIO: 'Diário',
  SEMANAL: 'Semanal',
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  ANUAL: 'Anual',
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', icon: <Clock className="h-3.5 w-3.5" />, cls: 'text-blue-700 bg-blue-50' },
  CONFORME:     { label: 'Conforme',     icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: 'text-emerald-700 bg-emerald-50' },
  PARCIAL:      { label: 'Parcial',      icon: <AlertTriangle className="h-3.5 w-3.5" />, cls: 'text-yellow-700 bg-yellow-50' },
  NAO_CONFORME: { label: 'Não conforme', icon: <XCircle className="h-3.5 w-3.5" />, cls: 'text-red-700 bg-red-50' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default async function ChecklistsPage() {
  const token = await getAccessToken()
  let templates: Template[] = []
  let execucoes: Execucao[] = []

  if (token) {
    try {
      const [tmplRes, execRes] = await Promise.all([
        api.get<{ data: Template[] }>('/checklists/templates', token),
        api.get<{ data: Execucao[] }>('/checklists/execucoes?limit=30', token),
      ])
      templates = tmplRes.data
      execucoes = execRes.data
    } catch {}
  }

  const ativos = templates.filter((t) => t.ativo)
  const emAndamento = execucoes.filter((e) => e.status === 'EM_ANDAMENTO')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklists Operacionais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ativos.length} template{ativos.length !== 1 ? 's' : ''} ativos · {emAndamento.length} em andamento
          </p>
        </div>
      </div>

      {/* Em andamento */}
      {emAndamento.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800 mb-3">
            {emAndamento.length} checklist{emAndamento.length !== 1 ? 's' : ''} em andamento
          </p>
          <div className="space-y-2">
            {emAndamento.map((e) => (
              <Link
                key={e.id}
                href={`/checklists/${e.id}`}
                className="flex items-center justify-between rounded-md bg-white px-4 py-2.5 shadow-sm hover:shadow transition-shadow"
              >
                <div>
                  <p className="text-sm font-medium">{e.template.nome}</p>
                  <p className="text-xs text-muted-foreground">{e.empreendimento.nomeFantasia ?? e.empreendimento.nome}</p>
                </div>
                <span className="text-xs text-blue-700 font-medium">Continuar →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Templates disponíveis */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Templates disponíveis</h2>
        </div>

        {ativos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum template de checklist cadastrado.
          </div>
        ) : (
          <div className="divide-y">
            {ativos.map((t) => (
              <Link
                key={t.id}
                href={`/checklists/novo?templateId=${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{t.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {moduloLabel[t.modulo] ?? t.modulo}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {periodicidadeLabel[t.periodicidade] ?? t.periodicidade}
                    </span>
                    <span className="text-xs text-muted-foreground">· {t.itens.length} itens</span>
                  </div>
                </div>
                <span className="text-xs text-primary font-medium flex-shrink-0">Iniciar →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de execuções */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">Histórico recente</h2>
        </div>

        {execucoes.filter((e) => e.status !== 'EM_ANDAMENTO').length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma execução finalizada.</div>
        ) : (
          <div className="divide-y">
            {execucoes
              .filter((e) => e.status !== 'EM_ANDAMENTO')
              .map((e) => {
                const cfg = statusConfig[e.status] ?? statusConfig['PARCIAL']!
                const criticos = e.respostas.filter((r) => r.status === 'CRITICO').length
                const atencao  = e.respostas.filter((r) => r.status === 'ATENCAO').length
                return (
                  <Link
                    key={e.id}
                    href={`/checklists/${e.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.template.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {e.empreendimento.nomeFantasia ?? e.empreendimento.nome} · {e.executadoPor.nome}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      {criticos > 0 && (
                        <span className="text-xs text-red-700 font-medium">{criticos} crítico{criticos !== 1 ? 's' : ''}</span>
                      )}
                      {atencao > 0 && (
                        <span className="text-xs text-yellow-700 font-medium">{atencao} atenção</span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {e.finalizadaEm ? formatDate(e.finalizadaEm) : formatDate(e.iniciadaEm)}
                      </span>
                    </div>
                  </Link>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
