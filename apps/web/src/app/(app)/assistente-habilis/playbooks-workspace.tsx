'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  AlertTriangle,
  Bot,
  BookOpen,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type TabKey =
  | 'visao'
  | 'conteudo'
  | 'fluxo'
  | 'checklist'
  | 'responsaveis'
  | 'terceiros'
  | 'riscos'

export interface PlaybookModule {
  slug: string
  title: string
  short: string
  category: string
  summary: string
  preview: string
  page_count: number
  char_count: number
  archived: boolean
  file?: string
  checklist: string[]
  entregaveis: string[]
  terceiros: string[]
  riscos: string[]
  responsabilidades: string[]
  pages: Array<{
    n: number
    title: string
    text: string
    chars: number
  }>
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'visao', label: 'Visão geral' },
  { key: 'conteudo', label: 'Conteúdo integral' },
  { key: 'fluxo', label: 'Fluxo' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'responsaveis', label: 'Responsáveis' },
  { key: 'terceiros', label: 'Terceiros' },
  { key: 'riscos', label: 'Riscos' },
]

const PLAYBOOK_EXAMPLES = [
  'Quais documentos de entrada esse módulo pede?',
  'Quais terceiros entram nessa frente?',
  'Quais riscos não podem ser prometidos ao cliente?',
  'Quais entregáveis saem desse processo?',
] as const

type PlaybookAnswer = {
  module: Pick<PlaybookModule, 'slug' | 'short' | 'category' | 'file'>
  answer: string
  focus: string
  checklist: string[]
  terceiros: string[]
  riscos: string[]
  responsabilidades: string[]
  entregaveis: string[]
  pageRefs: number[]
  relevance: number
}

export function PlaybooksWorkspace({ playbooks }: { playbooks: PlaybookModule[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('visao')
  const [pergunta, setPergunta] = useState<string>(PLAYBOOK_EXAMPLES[0])
  const [resposta, setResposta] = useState<PlaybookAnswer | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeModules = useMemo(
    () => playbooks.filter((item) => !item.archived),
    [playbooks],
  )
  const archivedModules = useMemo(
    () => playbooks.filter((item) => item.archived),
    [playbooks],
  )
  const selectedModule = useMemo(
    () => playbooks.find((item) => item.slug === selectedSlug) ?? null,
    [playbooks, selectedSlug],
  )
  const groups = useMemo(() => {
    const map = new Map<string, PlaybookModule[]>()
    for (const item of activeModules) {
      const bucket = map.get(item.category) ?? []
      bucket.push(item)
      map.set(item.category, bucket)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [activeModules])

  const totalPages = playbooks.reduce((sum, item) => sum + item.page_count, 0)
  const totalChars = playbooks.reduce((sum, item) => sum + item.char_count, 0)
  const totalChecklist = playbooks.reduce((sum, item) => sum + item.checklist.length, 0)
  const totalRiscos = playbooks.reduce((sum, item) => sum + item.riscos.length, 0)

  function perguntarAoConteudo(nextPergunta?: string) {
    const texto = (nextPergunta ?? pergunta).trim()
    if (!texto) return
    if (nextPergunta) setPergunta(nextPergunta)
    setErro(null)

    startTransition(() => {
      const scope = selectedModule ? [selectedModule] : activeModules
      const result = answerFromPlaybooks(texto, scope)
      if (!result) {
        setResposta(null)
        setErro('Não encontrei resposta consistente nesse recorte. Tente outra pergunta ou abra um módulo mais específico.')
        return
      }
      setResposta(result)
    })
  }

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="border-b bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
          <button
            type="button"
            onClick={() => {
              setSelectedSlug(null)
              setTab('visao')
            }}
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
              selectedModule === null
                ? 'border-primary/20 bg-primary/10 text-primary'
                : 'border-transparent bg-white text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span className="flex-1">Visão geral</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {activeModules.length}
            </span>
          </button>

          <div className="mt-5 space-y-4">
            {groups.map(([category, items]) => (
              <div key={category}>
                <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {category}
                </p>
                <div className="mt-2 space-y-1.5">
                  {items.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => {
                        setSelectedSlug(item.slug)
                        setTab('visao')
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                        selectedModule?.slug === item.slug
                          ? 'border-primary/20 bg-primary/10'
                          : 'border-transparent bg-white hover:border-border'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.short}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.page_count} páginas
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-none text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {archivedModules.length > 0 ? (
              <div>
                <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Arquivados
                </p>
                <div className="mt-2 space-y-1.5">
                  {archivedModules.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => {
                        setSelectedSlug(item.slug)
                        setTab('visao')
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                        selectedModule?.slug === item.slug
                          ? 'border-primary/20 bg-primary/10'
                          : 'border-transparent bg-white hover:border-border'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.short}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">versão arquivada</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 p-5 sm:p-6">
          <PlaybookAskPanel
            pergunta={pergunta}
            setPergunta={setPergunta}
            onAsk={perguntarAoConteudo}
            onOpenSource={(slug) => {
              setSelectedSlug(slug)
              setTab('conteudo')
            }}
            isPending={isPending}
            erro={erro}
            resposta={resposta}
            scopedModule={selectedModule}
          />

          {selectedModule ? (
            <ModuleDetail module={selectedModule} tab={tab} onTabChange={setTab} />
          ) : (
            <Overview
              modules={activeModules}
              archived={archivedModules.length}
              totalPages={totalPages}
              totalChars={totalChars}
              totalChecklist={totalChecklist}
              totalRiscos={totalRiscos}
              onOpenModule={(slug) => {
                setSelectedSlug(slug)
                setTab('visao')
              }}
            />
          )}
        </div>
      </div>
    </section>
  )
}

function PlaybookAskPanel({
  pergunta,
  setPergunta,
  onAsk,
  onOpenSource,
  isPending,
  erro,
  resposta,
  scopedModule,
}: {
  pergunta: string
  setPergunta: (value: string) => void
  onAsk: (question?: string) => void
  onOpenSource: (slug: string) => void
  isPending: boolean
  erro: string | null
  resposta: PlaybookAnswer | null
  scopedModule: PlaybookModule | null
}) {
  return (
    <div className="mb-5 rounded-2xl border bg-[linear-gradient(135deg,#fff7ef_0%,#fffdf9_50%,#f7fafc_100%)] p-5 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              Automação local via JSON
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {scopedModule ? `Escopo: ${scopedModule.short}` : 'Escopo: todos os módulos ativos'}
            </Badge>
          </div>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            Perguntar ao conteúdo auditado
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A resposta é montada a partir do JSON dos playbooks auditados, cruzando resumo,
            páginas, checklist, terceiros, riscos, responsabilidades e entregáveis.
          </p>

          <div className="mt-4 rounded-2xl border bg-white/90 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Sua pergunta
            </label>
            <Textarea
              value={pergunta}
              onChange={(event) => setPergunta(event.target.value)}
              className="mt-3 min-h-28 resize-none border-slate-200 bg-white text-sm leading-6"
              placeholder="Ex.: Quais riscos esse módulo pede para sinalizar ao cliente?"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {PLAYBOOK_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => onAsk(example)}
                  className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-left text-xs font-medium text-primary transition hover:bg-primary/10"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <Button
                type="button"
                onClick={() => onAsk()}
                disabled={isPending || pergunta.trim().length < 3}
                className="gap-2"
              >
                {isPending ? <Search className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
                Responder com base no JSON
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white/90 p-4">
          {!resposta && !erro ? (
            <div className="grid min-h-[21rem] place-items-center text-center">
              <div className="max-w-md">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-foreground">Resposta orientada pelo playbook</h4>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Faça uma pergunta sobre documentos, fluxo, terceiros, riscos, responsabilidades
                  ou entregáveis. Se um módulo estiver aberto, a resposta respeita esse escopo.
                </p>
              </div>
            </div>
          ) : null}

          {erro ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {erro}
            </div>
          ) : null}

          {resposta ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  {resposta.module.category}
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  {resposta.module.short}
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  relevância {resposta.relevance}%
                </Badge>
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                  foco: {resposta.focus}
                </Badge>
              </div>

              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Resposta objetiva
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">{resposta.answer}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Módulo-fonte
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{resposta.module.short}</p>
                  {resposta.module.file ? (
                    <p className="text-xs text-muted-foreground">{resposta.module.file}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenSource(resposta.module.slug)}
                >
                  Abrir módulo-fonte
                </Button>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <AnswerMiniCard title="Checklist" icon={ClipboardList} items={resposta.checklist} />
                <AnswerMiniCard title="Terceiros" icon={Users} items={resposta.terceiros} />
                <AnswerMiniCard title="Riscos" icon={AlertTriangle} items={resposta.riscos} danger />
                <AnswerMiniCard title="Responsabilidades" icon={ShieldCheck} items={resposta.responsabilidades} />
              </div>

              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Entregáveis e páginas de apoio
                </p>
                <ul className="mt-3 space-y-2">
                  {resposta.entregaveis.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {resposta.pageRefs.map((page) => (
                    <Badge key={page} variant="secondary" className="rounded-full">
                      Página {page}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Overview({
  modules,
  archived,
  totalPages,
  totalChars,
  totalChecklist,
  totalRiscos,
  onOpenModule,
}: {
  modules: PlaybookModule[]
  archived: number
  totalPages: number
  totalChars: number
  totalChecklist: number
  totalRiscos: number
  onOpenModule: (slug: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Playbooks Hábilis auditados
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Estrutura integral dos PDFs, agora dentro do sistema do posto
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A base foi reorganizada para consulta dinâmica, com módulos principais separados das
            versões arquivadas e leitura operacional de checklist, terceiros, riscos,
            responsabilidades e conteúdo integral.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              {modules.length} módulos principais
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {archived} arquivados
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {totalPages} páginas
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {totalChars.toLocaleString('pt-BR')} caracteres
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="PDFs carregados" value={String(modules.length + archived)} />
          <StatCard label="Páginas extraídas" value={String(totalPages)} />
          <StatCard label="Itens de checklist" value={String(totalChecklist)} />
          <StatCard label="Trechos de risco" value={String(totalRiscos)} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {modules.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => onOpenModule(item.slug)}
            className="rounded-2xl border bg-slate-50 p-5 text-left transition hover:border-primary/30 hover:bg-white"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                {item.category}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {item.page_count} págs.
              </Badge>
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
              {item.short}
            </h3>
            <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">
              {item.summary}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <MiniMetric label="Páginas" value={String(item.page_count)} />
              <MiniMetric label="Checklist" value={String(item.checklist.length)} />
              <MiniMetric label="Riscos" value={String(item.riscos.length)} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ModuleDetail({
  module,
  tab,
  onTabChange,
}: {
  module: PlaybookModule
  tab: TabKey
  onTabChange: (tab: TabKey) => void
}) {
  const alerts = module.riscos.slice(0, 5)
  const quickDeliverables = module.entregaveis.slice(0, 6)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            {module.category}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {module.short}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{module.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              {module.page_count} páginas
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {module.char_count.toLocaleString('pt-BR')} caracteres
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {module.archived ? 'Arquivado' : 'Módulo principal'}
            </Badge>
            {module.file ? (
              <Badge variant="outline" className="rounded-full">
                {module.file}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Checklist" value={String(module.checklist.length)} />
          <StatCard label="Terceiros" value={String(module.terceiros.length)} />
          <StatCard label="Riscos" value={String(module.riscos.length)} />
          <StatCard label="Entregáveis" value={String(module.entregaveis.length)} />
        </div>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-2xl border bg-slate-50 p-2">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  tab === item.key
                    ? 'bg-primary text-white'
                    : 'bg-white text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            {tab === 'visao' ? <TabOverview module={module} /> : null}
            {tab === 'conteudo' ? <TabContent module={module} /> : null}
            {tab === 'fluxo' ? <TabFlow module={module} /> : null}
            {tab === 'checklist' ? <TabList title="Checklist" items={module.checklist} icon={ClipboardList} /> : null}
            {tab === 'responsaveis' ? <TabList title="Responsabilidades" items={module.responsabilidades} icon={ShieldCheck} /> : null}
            {tab === 'terceiros' ? <TabList title="Terceiros" items={module.terceiros} icon={Users} /> : null}
            {tab === 'riscos' ? <TabList title="Riscos e limites" items={module.riscos} icon={AlertTriangle} danger /> : null}
          </div>
        </div>

        <aside className="space-y-4">
          <RailCard title="Ações rápidas">
            <RailButton label="Abrir conteúdo integral" onClick={() => onTabChange('conteudo')} />
            <RailButton label="Ir para checklist" onClick={() => onTabChange('checklist')} />
            <RailButton label="Ver terceiros" onClick={() => onTabChange('terceiros')} />
            <RailButton label="Ver riscos" onClick={() => onTabChange('riscos')} />
          </RailCard>

          <RailCard title="Leitura executiva">
            <div className="grid grid-cols-2 gap-2">
              <MiniMetric label="Páginas" value={String(module.page_count)} />
              <MiniMetric label="Checklist" value={String(module.checklist.length)} />
              <MiniMetric label="Terceiros" value={String(module.terceiros.length)} />
              <MiniMetric label="Riscos" value={String(module.riscos.length)} />
            </div>
          </RailCard>

          <RailCard title="Feed de alertas">
            <div className="space-y-2">
              {alerts.length > 0 ? (
                alerts.map((item) => (
                  <div key={item} className="rounded-xl border bg-red-50/60 p-3 text-sm text-red-800">
                    {item}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem alertas extraídos automaticamente.</p>
              )}
            </div>
          </RailCard>

          <RailCard title="Entregáveis">
            <ul className="space-y-2">
              {quickDeliverables.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </RailCard>
        </aside>
      </div>
    </div>
  )
}

function TabOverview({ module }: { module: PlaybookModule }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Prévia auditada
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.preview}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <DetailListCard title="Checklist principal" icon={ClipboardList} items={module.checklist.slice(0, 8)} />
        <DetailListCard title="Terceiros e interfaces" icon={Users} items={module.terceiros.slice(0, 8)} />
        <DetailListCard title="Riscos e limites" icon={AlertTriangle} items={module.riscos.slice(0, 8)} danger />
        <DetailListCard title="Responsabilidades" icon={ShieldCheck} items={module.responsabilidades.slice(0, 8)} />
      </div>
    </div>
  )
}

function TabContent({ module }: { module: PlaybookModule }) {
  return (
    <div className="space-y-4">
      {module.pages.map((page) => (
        <article key={`${module.slug}-${page.n}`} className="rounded-2xl border bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              Página {page.n}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {page.chars} chars
            </Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">
            {page.title}
          </h3>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {page.text}
          </div>
        </article>
      ))}
    </div>
  )
}

function TabFlow({ module }: { module: PlaybookModule }) {
  const steps = (module.entregaveis.length > 0 ? module.entregaveis : module.checklist).slice(0, 8)
  return (
    <div className="space-y-3">
      {steps.map((item, index) => (
        <div key={item} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">
            {index + 1}
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-sm font-medium leading-6 text-foreground">{item}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function TabList({
  title,
  items,
  icon: Icon,
  danger = false,
}: {
  title: string
  items: string[]
  icon: typeof BookOpen
  danger?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${danger ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{items.length} itens extraídos</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 rounded-xl border bg-slate-50 px-4 py-3 text-sm leading-6 text-muted-foreground">
            <span className={`mt-2 h-1.5 w-1.5 flex-none rounded-full ${danger ? 'bg-red-500' : 'bg-primary'}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2 text-center">
      <p className="text-lg font-bold tracking-tight text-foreground">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function DetailListCard({
  title,
  icon: Icon,
  items,
  danger = false,
}: {
  title: string
  icon: typeof BookOpen
  items: string[]
  danger?: boolean
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${danger ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <span className={`mt-2 h-1.5 w-1.5 flex-none rounded-full ${danger ? 'bg-red-500' : 'bg-primary'}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function RailButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-foreground transition hover:bg-slate-100"
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

function AnswerMiniCard({
  title,
  icon: Icon,
  items,
  danger = false,
}: {
  title: string
  icon: typeof BookOpen
  items: string[]
  danger?: boolean
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${danger ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <span className={`mt-2 h-1.5 w-1.5 flex-none rounded-full ${danger ? 'bg-red-500' : 'bg-primary'}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function normalizeText(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
}

function tokenize(text: string): string[] {
  const stopwords = new Set([
    'para', 'com', 'uma', 'que', 'dos', 'das', 'por', 'qual', 'quais',
    'como', 'onde', 'quando', 'sobre', 'isso', 'essa', 'esse', 'pra',
  ])
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word))
}

const SYNONYMS: Record<string, string[]> = {
  documento: ['documentos', 'doc', 'docs', 'entrada', 'anexo', 'anexos', 'protocolo'],
  checklist: ['documento', 'documentos', 'itens', 'exigencias', 'exigência'],
  terceiros: ['terceiro', 'fornecedor', 'fornecedores', 'parceiro', 'parceiros', 'empresa'],
  riscos: ['risco', 'cuidados', 'alerta', 'alertas', 'limites', 'erro', 'erros'],
  responsabilidade: ['responsabilidades', 'responsavel', 'responsáveis', 'papel', 'papéis'],
  entregaveis: ['entregavel', 'saidas', 'saída', 'resultado', 'resultados'],
  fluxo: ['etapas', 'passos', 'ordem', 'processo'],
  estudo: ['estudos', 'laudo', 'laudos', 'relatorio', 'relatórios'],
}

type QueryIntent =
  | 'documentos'
  | 'terceiros'
  | 'riscos'
  | 'responsabilidades'
  | 'entregaveis'
  | 'fluxo'
  | 'estudos'
  | 'geral'

function expandTokens(tokens: string[]) {
  const expanded = new Set(tokens)
  for (const token of tokens) {
    for (const [root, aliases] of Object.entries(SYNONYMS)) {
      if (token === root || aliases.includes(token)) {
        expanded.add(root)
        for (const alias of aliases) expanded.add(alias)
      }
    }
  }
  return Array.from(expanded)
}

function detectIntent(tokens: string[]): QueryIntent {
  const has = (...values: string[]) => values.some((value) => tokens.includes(value))
  if (has('terceiros', 'terceiro', 'fornecedor', 'fornecedores', 'parceiro')) return 'terceiros'
  if (has('riscos', 'risco', 'alerta', 'alertas', 'limites', 'erro', 'erros')) return 'riscos'
  if (has('responsabilidade', 'responsabilidades', 'responsavel', 'responsáveis', 'papel')) return 'responsabilidades'
  if (has('entregaveis', 'entregavel', 'saida', 'saidas', 'resultado', 'resultados')) return 'entregaveis'
  if (has('fluxo', 'etapas', 'passos', 'ordem', 'processo')) return 'fluxo'
  if (has('estudo', 'estudos', 'laudo', 'laudos', 'relatorio', 'relatorios')) return 'estudos'
  if (has('documento', 'documentos', 'checklist', 'entrada', 'anexo', 'anexos', 'protocolo')) return 'documentos'
  return 'geral'
}

function scoreText(text: string, tokens: string[]): number {
  const normalized = normalizeText(text)
  return tokens.reduce((sum, token) => sum + (normalized.includes(token) ? 1 : 0), 0)
}

function topMatches(items: string[], tokens: string[], fallbackCount: number) {
  const ranked = items
    .map((item) => ({ item, score: scoreText(item, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)

  const source = ranked.length > 0 ? ranked : items
  return source.slice(0, fallbackCount)
}

function bestExcerpt(module: PlaybookModule, tokens: string[]) {
  const candidates = [
    module.summary,
    module.preview,
    ...module.pages.flatMap((page) =>
      page.text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 30),
    ),
  ]

  const ranked = candidates
    .map((text) => ({ text, score: scoreText(text, tokens) }))
    .sort((a, b) => b.score - a.score)

  return (ranked[0]?.text ?? module.summary).slice(0, 420)
}

function pageRefs(module: PlaybookModule, tokens: string[]) {
  return module.pages
    .map((page) => ({ n: page.n, score: scoreText(page.text, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.n)
}

function answerFromPlaybooks(question: string, scope: PlaybookModule[]): PlaybookAnswer | null {
  const rawTokens = tokenize(question)
  const tokens = expandTokens(rawTokens)
  if (tokens.length === 0) return null
  const intent = detectIntent(tokens)

  const rankedModules = scope
    .map((module) => {
      const titleScore = scoreText([module.title, module.short, module.category].join(' '), tokens) * 4
      const summaryScore = scoreText([module.summary, module.preview].join(' '), tokens) * 3
      const checklistScore = scoreText(module.checklist.join(' '), tokens) * (intent === 'documentos' || intent === 'estudos' ? 6 : 2)
      const deliverableScore = scoreText(module.entregaveis.join(' '), tokens) * (intent === 'entregaveis' || intent === 'fluxo' ? 5 : 2)
      const thirdScore = scoreText(module.terceiros.join(' '), tokens) * (intent === 'terceiros' ? 6 : 2)
      const riskScore = scoreText(module.riscos.join(' '), tokens) * (intent === 'riscos' ? 6 : 2)
      const ownerScore = scoreText(module.responsabilidades.join(' '), tokens) * (intent === 'responsabilidades' ? 6 : 2)
      const pagesScore = scoreText(module.pages.map((page) => page.text).join(' '), tokens) * 1
      const score = titleScore + summaryScore + checklistScore + deliverableScore + thirdScore + riskScore + ownerScore + pagesScore
      return { module, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)

  const best = rankedModules[0]
  if (!best) return null

  const selectedChecklist = topMatches(best.module.checklist, tokens, intent === 'documentos' || intent === 'estudos' ? 6 : 5)
  const selectedTerceiros = topMatches(best.module.terceiros, tokens, 4)
  const selectedRiscos = topMatches(best.module.riscos, tokens, 4)
  const selectedResponsabilidades = topMatches(best.module.responsabilidades, tokens, 4)
  const selectedEntregaveis = topMatches(best.module.entregaveis, tokens, intent === 'fluxo' || intent === 'entregaveis' ? 5 : 4)

  const answer =
    intent === 'documentos' || intent === 'estudos'
      ? `Para ${best.module.short}, a base auditada prioriza ${selectedChecklist.slice(0, 3).join(', ')}. ${bestExcerpt(best.module, tokens)}`
      : intent === 'terceiros'
        ? `Os terceiros mais recorrentes nessa frente são ${selectedTerceiros.slice(0, 3).join(', ')}. ${bestExcerpt(best.module, tokens)}`
        : intent === 'riscos'
          ? `Os principais riscos e limites dessa frente passam por ${selectedRiscos.slice(0, 3).join(', ')}. ${bestExcerpt(best.module, tokens)}`
          : intent === 'responsabilidades'
            ? `A divisão de responsabilidade nesta frente destaca ${selectedResponsabilidades.slice(0, 2).join(' e ')}. ${bestExcerpt(best.module, tokens)}`
            : intent === 'entregaveis' || intent === 'fluxo'
              ? `Os entregáveis mais prováveis nessa frente incluem ${selectedEntregaveis.slice(0, 3).join(', ')}. ${bestExcerpt(best.module, tokens)}`
              : bestExcerpt(best.module, tokens)

  return {
    module: {
      slug: best.module.slug,
      short: best.module.short,
      category: best.module.category,
      file: best.module.file,
    },
    answer,
    focus:
      intent === 'documentos' ? 'documentos'
      : intent === 'estudos' ? 'estudos'
      : intent === 'terceiros' ? 'terceiros'
      : intent === 'riscos' ? 'riscos'
      : intent === 'responsabilidades' ? 'responsabilidades'
      : intent === 'entregaveis' ? 'entregáveis'
      : intent === 'fluxo' ? 'fluxo'
      : 'visão geral',
    checklist: selectedChecklist,
    terceiros: selectedTerceiros,
    riscos: selectedRiscos,
    responsabilidades: selectedResponsabilidades,
    entregaveis: selectedEntregaveis,
    pageRefs: pageRefs(best.module, tokens),
    relevance: Math.min(100, Math.round(best.score * 8)),
  }
}
