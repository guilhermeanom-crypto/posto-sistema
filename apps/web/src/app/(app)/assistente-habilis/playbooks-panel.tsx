import { BookCopy, ChevronRight, FileText, ShieldAlert, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface PlaybookResumo {
  slug: string
  title: string
  short: string
  category: string
  summary: string
  preview: string
  page_count: number
  char_count: number
  archived: boolean
  checklist_count: number
  checklist_preview: string[]
  entregaveis_preview: string[]
  terceiros_preview: string[]
  terceiros_count: number
  riscos_preview: string[]
  riscos_count: number
}

export function PlaybooksPanel({ playbooks }: { playbooks: PlaybookResumo[] }) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Playbooks auditados
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Base operacional complementar dentro do Assistente Hábilis
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Os playbooks integrais auditados agora ficam junto do assistente para consulta guiada,
            treinamento interno e apoio a triagem comercial-técnica.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs">
          {playbooks.length} playbooks incorporados
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {playbooks.map((playbook) => (
          <details
            key={playbook.slug}
            className="group overflow-hidden rounded-2xl border bg-slate-50 open:bg-white"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                    {playbook.category}
                  </Badge>
                  {playbook.archived ? (
                    <Badge variant="outline" className="rounded-full">
                      Arquivado
                    </Badge>
                  ) : null}
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                  {playbook.short}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {playbook.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-muted-foreground">
                  <span>{playbook.page_count} páginas</span>
                  <span>•</span>
                  <span>{playbook.checklist_count} checkpoints</span>
                  <span>•</span>
                  <span>{playbook.terceiros_count} referências de terceiros</span>
                  <span>•</span>
                  <span>{playbook.riscos_count} alertas/riscos</span>
                </div>
              </div>
              <div className="grid h-10 w-10 flex-none place-items-center rounded-xl border bg-white text-primary transition group-open:rotate-90">
                <ChevronRight className="h-4 w-4" />
              </div>
            </summary>

            <div className="border-t bg-white px-5 py-5">
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Prévia auditada
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{playbook.preview}</p>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <MiniList
                  icon={BookCopy}
                  title="Checklist-chave"
                  items={playbook.checklist_preview}
                />
                <MiniList
                  icon={FileText}
                  title="Entregáveis e blocos"
                  items={playbook.entregaveis_preview}
                />
                <MiniList
                  icon={Users}
                  title="Terceiros e interfaces"
                  items={playbook.terceiros_preview}
                />
                <MiniList
                  icon={ShieldAlert}
                  title="Riscos e alertas"
                  items={playbook.riscos_preview}
                />
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

function MiniList({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof BookCopy
  title: string
  items: string[]
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
