'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileCheck2,
  Loader2,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ModuloResumo {
  id: string
  modulo: string
  categoria: string
}

interface Resultado {
  id: string
  modulo: string
  categoria: string
  resposta_objetiva: string
  checklist: string[]
  estudos_documentos: string[]
  terceiros_relacionados: string[]
  riscos: string[]
  fontes_internas: string[]
  perguntas_chave: string[]
  responsabilidades: {
    habilis_assume: string
    habilis_executa: string
    habilis_gere: string
    cliente: string
    terceiros: string
    orgao: string
  }
  relevancia: number
}

const EXEMPLOS = [
  'Quais estudos pede uma licença para posto?',
  'O que pedir para uso do solo?',
  'Quem executa laudo de estanqueidade?',
  'O que verificar na caixa SAO?',
  'Quais documentos de resíduos MTR e CDF?',
  'Como funciona outorga para poço?',
  'Quais terceiros entram no CAR?',
] as const

export function AssistenteForm({
  token,
  apiBase,
  modulos,
}: {
  token: string
  apiBase: string
  modulos: ModuloResumo[]
}) {
  const [pergunta, setPergunta] = useState<string>(EXEMPLOS[0])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const moduloMap = useMemo(
    () => new Map(modulos.map((modulo) => [modulo.id, modulo])),
    [modulos],
  )

  function submit(nextPergunta?: string) {
    const texto = (nextPergunta ?? pergunta).trim()
    if (!texto) return

    if (nextPergunta) setPergunta(nextPergunta)
    setErro(null)

    startTransition(async () => {
      try {
        const res = await fetch(`${apiBase}/conhecimento/perguntar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ pergunta: texto }),
        })

        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(body?.error?.message ?? body?.message ?? 'Não foi possível consultar a base.')
        }

        setResultados(body.data ?? [])
        setOpenedId(body.data?.[0]?.id ?? null)
      } catch (err) {
        setResultados([])
        setOpenedId(null)
        setErro(err instanceof Error ? err.message : 'Não foi possível consultar a base.')
      }
    })
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Consulta técnica
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Pergunte do jeito que o time pergunta no dia a dia
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A base retorna módulos relevantes com checklist, estudos, terceiros, riscos e a
              matriz de responsabilidade para reduzir improviso operacional.
            </p>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Sua pergunta
            </label>
            <Textarea
              value={pergunta}
              onChange={(event) => setPergunta(event.target.value)}
              placeholder="Ex.: Quais estudos pede uma licença para posto?"
              className="mt-3 min-h-32 resize-none border-slate-200 bg-white text-sm leading-6"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {EXEMPLOS.map((exemplo) => (
                <button
                  key={exemplo}
                  type="button"
                  onClick={() => submit(exemplo)}
                  className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-left text-xs font-medium text-primary transition hover:bg-primary/10"
                >
                  {exemplo}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => submit()}
                disabled={isPending || pergunta.trim().length < 3}
                className="gap-2"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparkIcon />}
                Consultar base
              </Button>
              <span className="text-xs text-muted-foreground">
                Busca local por palavras-chave. Sem IA externa nesta fase.
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Módulos disponíveis
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {modulos.map((modulo) => (
                <Badge key={modulo.id} variant="secondary" className="rounded-full px-3 py-1">
                  {modulo.modulo}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {erro && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {erro}
            </div>
          )}

          {!erro && resultados.length === 0 && !isPending && (
            <div className="grid min-h-[28rem] place-items-center rounded-2xl border border-dashed bg-slate-50 p-8 text-center">
              <div className="max-w-md">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                  Digite uma pergunta para visualizar a resposta estruturada
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  O assistente devolve um bloco acionável com resposta objetiva, checklist,
                  estudos possíveis, terceiros, riscos e fontes internas.
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="grid min-h-[28rem] place-items-center rounded-2xl border bg-slate-50 p-8 text-center">
              <div>
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Cruzando módulos, checklists, riscos e responsabilidades...
                </p>
              </div>
            </div>
          )}

          {resultados.map((resultado) => {
            const isOpen = openedId === resultado.id
            const moduloCompleto = moduloMap.get(resultado.id)
            return (
              <article
                key={resultado.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <div className="border-b bg-slate-50 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          relevância {resultado.relevancia}%
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground">
                          {resultado.categoria}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                        {resultado.modulo}
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setOpenedId(isOpen ? null : resultado.id)}
                    >
                      Abrir módulo
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {resultado.resposta_objetiva}
                  </p>
                </div>

                <div className="grid gap-4 p-5 xl:grid-cols-2">
                  <ListBlock
                    title="Checklist principal"
                    icon={CheckCircle2}
                    items={resultado.checklist}
                  />
                  <ListBlock
                    title="Estudos e documentos possíveis"
                    icon={FileCheck2}
                    items={resultado.estudos_documentos}
                  />
                  <ListBlock
                    title="Terceiros relacionados"
                    icon={Users}
                    items={resultado.terceiros_relacionados}
                  />
                  <ListBlock
                    title="Riscos e observações"
                    icon={CircleAlert}
                    items={resultado.riscos}
                    tone="warning"
                  />
                </div>

                <div className="border-t bg-slate-50/80 px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Matriz de responsabilidades
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <ResponsibilityBox title="Hábilis assume" text={resultado.responsabilidades.habilis_assume} />
                    <ResponsibilityBox title="Hábilis executa" text={resultado.responsabilidades.habilis_executa} />
                    <ResponsibilityBox title="Hábilis gere" text={resultado.responsabilidades.habilis_gere} />
                    <ResponsibilityBox title="Cliente" text={resultado.responsabilidades.cliente} />
                    <ResponsibilityBox title="Terceiros" text={resultado.responsabilidades.terceiros} />
                    <ResponsibilityBox title="Órgão" text={resultado.responsabilidades.orgao} />
                  </div>

                  {isOpen && (
                    <div className="mt-4 rounded-xl border bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Referência aberta
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {moduloCompleto?.categoria ?? resultado.categoria}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Fontes internas: {resultado.fontes_internas.join(', ')}
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Perguntas-chave cobertas
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {resultado.perguntas_chave.map((perguntaChave) => (
                            <Badge key={perguntaChave} variant="outline" className="rounded-full">
                              {perguntaChave}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ListBlock({
  title,
  items,
  icon: Icon,
  tone = 'default',
}: {
  title: string
  items: string[]
  icon: typeof BookOpen
  tone?: 'default' | 'warning'
}) {
  const dotClass = tone === 'warning' ? 'bg-orange-500' : 'bg-primary'
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
            <span className={`mt-2 h-1.5 w-1.5 flex-none rounded-full ${dotClass}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResponsibilityBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground/85">{text}</p>
    </div>
  )
}

function SparkIcon() {
  return <ArrowRight className="h-4 w-4" />
}
