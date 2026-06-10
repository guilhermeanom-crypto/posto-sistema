'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { aprovarVersaoAction, reprovarVersaoAction } from '@/app/(app)/documentos/actions'
import { cumprirCondicionanteAction } from '@/app/(app)/condicionantes/actions'
import { iniciarTarefaAction, concluirTarefaAction } from '@/app/(app)/tarefas/actions'
import { useRouter } from 'next/navigation'

// ─── tipos ───────────────────────────────────────────────────────────────────

export interface DocPendente {
  documentoId: string
  versaoId: string
  nome: string
  empreendimento: string
  empreendimentoId: string
  enviadoEm: string
  enviadoPor: string
}

export interface CondicionantePendente {
  id: string
  descricao: string
  empreendimento: string
  empreendimentoId: string
  diasRestantes: number
  proximoVencimento: string
}

export interface TarefaAtrasada {
  id: string
  titulo: string
  empreendimento: string
  empreendimentoId: string
  diasAtraso: number
  status: string
  responsavel: string
}

interface Props {
  docs: DocPendente[]
  condicionantes: CondicionantePendente[]
  tarefas: TarefaAtrasada[]
}

// ─── sub-componentes de ação ──────────────────────────────────────────────────

function AprovarDocBtn({ doc }: { doc: DocPendente }) {
  const [pending, start] = useTransition()
  const [reprovando, setReprovando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  async function aprovar() {
    start(async () => {
      const res = await aprovarVersaoAction(doc.documentoId, doc.versaoId)
      if (res.error) setErro(res.error)
      else router.refresh()
    })
  }

  async function reprovar() {
    if (!motivo.trim()) return
    start(async () => {
      const res = await reprovarVersaoAction(doc.documentoId, doc.versaoId, motivo)
      if (res.error) setErro(res.error)
      else { setReprovando(false); setMotivo(''); router.refresh() }
    })
  }

  return (
    <div className="flex flex-col gap-1.5 items-end min-w-[160px]">
      {!reprovando ? (
        <div className="flex gap-1.5">
          <button
            onClick={aprovar}
            disabled={pending}
            className="rounded px-2.5 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {pending ? '...' : 'Aprovar'}
          </button>
          <button
            onClick={() => setReprovando(true)}
            disabled={pending}
            className="rounded px-2.5 py-1 text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Reprovar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1 w-full">
          <input
            autoFocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo da reprovação"
            className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => setReprovando(false)}
              className="text-xs px-2 py-0.5 rounded border hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={reprovar}
              disabled={pending || !motivo.trim()}
              className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  )
}

function CumprirCondicionanteBtn({ cond }: { cond: CondicionantePendente }) {
  const [pending, start] = useTransition()
  const [aberto, setAberto] = useState(false)
  const [obs, setObs] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  async function cumprir() {
    start(async () => {
      const res = await cumprirCondicionanteAction(cond.id, obs || undefined)
      if (res.error) setErro(res.error)
      else { setAberto(false); setObs(''); router.refresh() }
    })
  }

  return (
    <div className="flex flex-col gap-1.5 items-end min-w-[120px]">
      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="rounded px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Cumprir
        </button>
      ) : (
        <div className="flex flex-col gap-1 w-full max-w-[200px]">
          <input
            autoFocus
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Observação (opcional)"
            className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-1 justify-end">
            <button onClick={() => setAberto(false)} className="text-xs px-2 py-0.5 rounded border hover:bg-muted transition-colors">Cancelar</button>
            <button onClick={cumprir} disabled={pending} className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {pending ? '...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  )
}

function AvancarTarefaBtn({ tarefa }: { tarefa: TarefaAtrasada }) {
  const [pending, start] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  const isPendente = tarefa.status === 'PENDENTE'

  async function agir() {
    start(async () => {
      const res = isPendente
        ? await iniciarTarefaAction(tarefa.id)
        : await concluirTarefaAction(tarefa.id)
      if (res.error) setErro(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <div className="flex gap-1.5">
        <Link
          href={`/tarefas/${tarefa.id}`}
          className="rounded px-2.5 py-1 text-xs font-medium border hover:bg-muted transition-colors"
        >
          Ver
        </Link>
        <button
          onClick={agir}
          disabled={pending}
          className="rounded px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {pending ? '...' : isPendente ? 'Iniciar' : 'Concluir'}
        </button>
      </div>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  )
}

// ─── seção genérica ───────────────────────────────────────────────────────────

function SecaoFila({
  titulo,
  cor,
  count,
  children,
  empty,
}: {
  titulo: string
  cor: string
  count: number
  children: React.ReactNode
  empty: string
}) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className={`px-4 py-3 border-b flex items-center justify-between ${cor}`}>
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <span className="text-xs font-bold tabular-nums">{count}</span>
      </div>
      {count === 0 ? (
        <p className="px-4 py-6 text-sm text-center text-muted-foreground">{empty}</p>
      ) : (
        <div className="divide-y">{children}</div>
      )}
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export function FilaGestao({ docs, condicionantes, tarefas }: Props) {
  const total = docs.length + condicionantes.length + tarefas.length

  if (total === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        Nenhum item pendente de decisão. Tudo em dia!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Documentos aguardando aprovação */}
      <SecaoFila
        titulo="Documentos aguardando aprovação"
        cor="bg-blue-50 text-blue-800 border-blue-100"
        count={docs.length}
        empty="Nenhum documento aguardando aprovação."
      >
        {docs.map((doc) => (
          <div key={doc.versaoId} className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link href={`/documentos/${doc.documentoId}`} className="text-sm font-medium hover:underline truncate block">
                {doc.nome}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                {doc.empreendimento} · enviado por {doc.enviadoPor}
              </p>
            </div>
            <AprovarDocBtn doc={doc} />
          </div>
        ))}
      </SecaoFila>

      {/* Condicionantes vencendo */}
      <SecaoFila
        titulo="Condicionantes vencendo em 7 dias"
        cor="bg-orange-50 text-orange-800 border-orange-100"
        count={condicionantes.length}
        empty="Nenhuma condicionante crítica."
      >
        {condicionantes.map((cond) => (
          <div key={cond.id} className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link href={`/condicionantes/${cond.id}`} className="text-sm font-medium hover:underline truncate block">
                {cond.descricao}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cond.empreendimento} ·{' '}
                <span className={cond.diasRestantes <= 0 ? 'text-red-600 font-semibold' : 'text-orange-600 font-semibold'}>
                  {cond.diasRestantes <= 0 ? 'Vencida' : `${cond.diasRestantes}d restantes`}
                </span>
              </p>
            </div>
            <CumprirCondicionanteBtn cond={cond} />
          </div>
        ))}
      </SecaoFila>

      {/* Tarefas atrasadas */}
      <SecaoFila
        titulo="Tarefas atrasadas"
        cor="bg-red-50 text-red-800 border-red-100"
        count={tarefas.length}
        empty="Nenhuma tarefa atrasada."
      >
        {tarefas.map((t) => (
          <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.titulo}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.empreendimento}
                {t.responsavel && ` · ${t.responsavel}`}
                {' · '}
                <span className="text-red-600 font-semibold">
                  {t.diasAtraso === 0 ? 'vence hoje' : `${t.diasAtraso}d de atraso`}
                </span>
              </p>
            </div>
            <AvancarTarefaBtn tarefa={t} />
          </div>
        ))}
      </SecaoFila>
    </div>
  )
}
