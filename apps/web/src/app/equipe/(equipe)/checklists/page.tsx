'use client'

import { useState } from 'react'
import { ChevronRight, ClipboardCheck, Save, Send, Timer } from 'lucide-react'

type Status = 'atendido' | 'nao-atendido' | 'pendente-doc' | 'pendente-foto' | 'nao-verificado'

type Item = { key: string; group: string; title: string; helper: string; status: Status }

const INIT: Item[] = [
  { key: 'sasc-1', group: 'SASC',       title: 'Laudo de estanqueidade vigente?',            helper: 'Conferir validade, tanques e linhas contemplados.',   status: 'atendido' },
  { key: 'sasc-2', group: 'SASC',       title: 'Bocais e descarga selada íntegros?',         helper: 'Registrar fotos e condição física.',                  status: 'pendente-foto' },
  { key: 'sao-1',  group: 'SAO',        title: 'Comprovante de limpeza recente?',            helper: 'Solicitar OS, NF, MTR e certificado.',                status: 'pendente-doc' },
  { key: 'sao-2',  group: 'SAO',        title: 'Acúmulo de óleo/lodo?',                      helper: 'Registrar fotos e necessidade de limpeza.',           status: 'atendido' },
  { key: 'res-1',  group: 'Resíduos',   title: 'Abrigo de resíduos perigosos adequado?',      helper: 'Cobertura, piso, contenção, identificação.',           status: 'nao-atendido' },
  { key: 'bom-1',  group: 'Bombeiros',  title: 'AVCB/CLCB disponível e vigente?',             helper: 'Conferir validade e compatibilidade.',                status: 'atendido' },
  { key: 'doc-1',  group: 'Documentos', title: 'Contrato social/CNPJ atualizados?',           helper: 'Conferir representante legal e atividade.',           status: 'nao-verificado' },
]

const PILL: Record<Status, { label: string; cls: string }> = {
  'atendido':       { label: 'Atendido',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'nao-atendido':   { label: 'Não atendido',   cls: 'bg-red-50 text-red-700 border-red-200' },
  'pendente-doc':   { label: 'Pendência doc.', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  'pendente-foto':  { label: 'Pendência foto', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  'nao-verificado': { label: 'Não verificado', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
}

const ORDER: Status[] = ['nao-verificado', 'atendido', 'pendente-foto', 'pendente-doc', 'nao-atendido']

export default function ChecklistsPage() {
  const [items, setItems] = useState<Item[]>(INIT)
  const verificados = items.filter((i) => i.status !== 'nao-verificado').length
  const pendentes = items.filter((i) => ['nao-atendido', 'pendente-doc', 'pendente-foto'].includes(i.status)).length

  function cycle(key: string) {
    setItems((prev) =>
      prev.map((c) =>
        c.key === key ? { ...c, status: ORDER[(ORDER.indexOf(c.status) + 1) % ORDER.length]! } : c,
      ),
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            OS-2026-0184 · Posto BR-153 km 312
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Checklist técnico</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clique no badge de cada item para alternar o status. Pendências geram tarefas automaticamente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary">
            <Save className="h-3.5 w-3.5" /> Salvar coleta
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(234,88,12,0.18)]">
            <Send className="h-3.5 w-3.5" /> Enviar p/ revisão
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Verificados</p>
          <p className="mt-1 text-2xl font-black tabular-nums">{verificados}/{items.length}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Pendências geradas</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-red-600">{pendentes}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Tempo no local</p>
          <p className="mt-1 text-2xl font-black tabular-nums">00:42</p>
        </div>
      </div>

      <article className="rounded-xl border bg-card overflow-hidden">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Itens do checklist</h2>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Timer className="h-3 w-3" /> Clique no badge para alternar
          </span>
        </header>
        <ul className="divide-y">
          {items.map((c) => {
            const pill = PILL[c.status]
            return (
              <li key={c.key} className="flex items-center gap-3 px-5 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {c.group.slice(0, 3)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-tight text-foreground">{c.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{c.helper}</p>
                </div>
                <button
                  type="button"
                  onClick={() => cycle(c.key)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${pill.cls}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {pill.label}
                  <ChevronRight className="h-3 w-3 opacity-60" />
                </button>
              </li>
            )
          })}
        </ul>
      </article>
    </div>
  )
}
