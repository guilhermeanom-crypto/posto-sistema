import Link from 'next/link'
import { ClipboardCheck, ClipboardList, ArrowRight, Play } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export const metadata = { title: 'Checklists da equipe' }

interface Template {
  id: string
  nome: string
  modulo: string
  ativo: boolean
}
interface Execucao {
  id: string
  status: string
  template: { nome: string; modulo: string }
  empreendimento: { nome: string; nomeFantasia: string | null }
  respostas: { status: string }[]
}

const STATUS: Record<string, { label: string; cls: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFORME: { label: 'Conforme', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  NAO_CONFORME: { label: 'Não conforme', cls: 'bg-red-50 text-red-700 border-red-200' },
  PARCIAL: { label: 'Parcial', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export default async function ChecklistsPage() {
  const token = await getAccessToken()
  let templates: Template[] = []
  let execucoes: Execucao[] = []
  let erro: string | null = null

  if (token) {
    try {
      const [tmpl, exec] = await Promise.all([
        api.get<{ data: Template[] }>('/checklists/templates', token),
        api.get<{ data: Execucao[] }>('/checklists/execucoes?limit=30', token),
      ])
      templates = tmpl.data.filter((t) => t.ativo)
      execucoes = exec.data
    } catch {
      erro = 'Não foi possível carregar os checklists no momento.'
    }
  }

  const emAndamento = execucoes.filter((e) => e.status === 'EM_ANDAMENTO')

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Operação de campo</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Checklists</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vistorias em andamento e modelos disponíveis. Pendências críticas viram tarefa.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold tabular-nums text-muted-foreground">
          {emAndamento.length} em andamento
        </span>
      </div>

      {erro ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</div>
      ) : null}

      <article className="rounded-xl border bg-card">
        <header className="flex items-center gap-2 border-b px-5 py-3">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Vistorias em andamento</h2>
        </header>
        <ul className="divide-y">
          {emAndamento.map((e) => (
            <li key={e.id}>
              <Link href={`/checklists/${e.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-tight text-foreground truncate">{e.template.nome}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                    {e.empreendimento.nomeFantasia ?? e.empreendimento.nome} · {e.respostas.length} respondido{e.respostas.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS[e.status]?.cls ?? ''}`}>
                  {STATUS[e.status]?.label ?? e.status}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          {emAndamento.length === 0 && !erro ? (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma vistoria em andamento.</li>
          ) : null}
        </ul>
      </article>

      <article className="rounded-xl border bg-card">
        <header className="flex items-center gap-2 border-b px-5 py-3">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Iniciar nova vistoria</h2>
        </header>
        <ul className="divide-y">
          {templates.map((t) => (
            <li key={t.id}>
              <Link href={`/checklists/novo?templateId=${t.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-orange-600">
                  <Play className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-tight text-foreground truncate">{t.nome}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground uppercase tracking-wider">{t.modulo}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          {templates.length === 0 && !erro ? (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum modelo de checklist cadastrado.</li>
          ) : null}
        </ul>
      </article>
    </div>
  )
}
