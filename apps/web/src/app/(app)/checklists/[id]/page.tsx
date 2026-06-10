import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { ChecklistExecutor } from './checklist-executor'

export const metadata: Metadata = { title: 'Executar Checklist' }

interface Props { params: Promise<{ id: string }> }

const statusCfg: Record<string, { label: string; cls: string; headerCls: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', cls: 'text-blue-700 bg-blue-50 border-blue-200',   headerCls: 'bg-blue-50' },
  CONFORME:     { label: 'Conforme',     cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', headerCls: 'bg-emerald-50' },
  PARCIAL:      { label: 'Parcial',      cls: 'text-yellow-700 bg-yellow-50 border-yellow-200', headerCls: 'bg-yellow-50' },
  NAO_CONFORME: { label: 'Não conforme', cls: 'text-red-700 bg-red-50 border-red-200',       headerCls: 'bg-red-50' },
}

export default async function ChecklistExecucaoPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let execucao: any = null

  try {
    const res = await api.get<{ data: any }>(`/checklists/execucoes/${id}`, token)
    execucao = res.data
  } catch {
    notFound()
  }

  const cfg = statusCfg[execucao.status] ?? statusCfg['PARCIAL']!
  const finalizada = execucao.status !== 'EM_ANDAMENTO'

  // Build map itemId → resposta
  const respostaMap: Record<string, { status: string; observacao?: string }> = {}
  for (const r of execucao.respostas) {
    respostaMap[r.itemId] = r
  }

  // Group itens by categoria
  const itens: any[] = execucao.template.itens
  const categorias = Array.from(new Set(itens.map((i: any) => i.categoria ?? '')))

  // Summary counts
  const ok      = execucao.respostas.filter((r: any) => r.status === 'OK').length
  const atencao = execucao.respostas.filter((r: any) => r.status === 'ATENCAO').length
  const critico = execucao.respostas.filter((r: any) => r.status === 'CRITICO').length
  const na      = execucao.respostas.filter((r: any) => r.status === 'NA').length
  const total   = itens.length
  const respondidos = execucao.respostas.length

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/checklists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Checklists
      </Link>

      {/* Header */}
      <div className={`rounded-lg border p-4 ${cfg.headerCls}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">{execucao.template.nome}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {execucao.empreendimento.nomeFantasia ?? execucao.empreendimento.nome}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Executado por {execucao.executadoPor.nome}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.cls}`}>
            {cfg.label}
          </span>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{respondidos}/{total} respondidos</span>
            <div className="flex gap-3">
              {ok      > 0 && <span className="text-emerald-700 font-medium flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" />{ok}</span>}
              {atencao > 0 && <span className="text-yellow-700 font-medium flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" />{atencao}</span>}
              {critico > 0 && <span className="text-red-700 font-medium flex items-center gap-0.5"><XCircle className="h-3 w-3" />{critico}</span>}
              {na      > 0 && <span className="text-muted-foreground font-medium flex items-center gap-0.5"><MinusCircle className="h-3 w-3" />{na} N/A</span>}
            </div>
          </div>
          <div className="h-2 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${total > 0 ? (respondidos / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Executor interativo (client) ou view-only */}
      {finalizada ? (
        /* View-only quando finalizado */
        <div className="space-y-4">
          {categorias.map((cat) => {
            const grupo = itens.filter((i: any) => (i.categoria ?? '') === cat)
            return (
              <div key={cat} className="rounded-lg border bg-card overflow-hidden">
                {cat && (
                  <div className="px-4 py-2 bg-muted/40 border-b">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</p>
                  </div>
                )}
                <div className="divide-y">
                  {grupo.map((item: any) => {
                    const resp = respostaMap[item.id]
                    const icon = resp?.status === 'OK'      ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                               : resp?.status === 'ATENCAO' ? <AlertTriangle className="h-4 w-4 text-yellow-600" />
                               : resp?.status === 'CRITICO' ? <XCircle className="h-4 w-4 text-red-600" />
                               : resp?.status === 'NA'      ? <MinusCircle className="h-4 w-4 text-gray-400" />
                               : null
                    return (
                      <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="flex-shrink-0 mt-0.5">{icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{item.descricao}</p>
                          {resp?.observacao && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">{resp.observacao}</p>
                          )}
                        </div>
                        {!resp && <span className="text-xs text-muted-foreground flex-shrink-0">—</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Executor interativo */
        <ChecklistExecutor
          execucaoId={id}
          itens={itens}
          categorias={categorias}
          respostaMap={respostaMap}
        />
      )}
    </div>
  )
}
