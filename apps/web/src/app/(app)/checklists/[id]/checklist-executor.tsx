'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { responderItemAction, finalizarChecklistAction } from './actions'

interface Item {
  id: string
  descricao: string
  obrigatorio: boolean
  categoria: string | null
}

interface Resposta {
  status: string
  observacao?: string
}

interface Props {
  execucaoId: string
  itens: Item[]
  categorias: string[]
  respostaMap: Record<string, Resposta>
}

const opcoes: { value: string; label: string; icon: React.ReactNode; cls: string; activeCls: string }[] = [
  { value: 'OK',      label: 'OK',      icon: <CheckCircle2 className="h-4 w-4" />, cls: 'border-gray-200 text-muted-foreground', activeCls: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  { value: 'ATENCAO', label: 'Atenção', icon: <AlertTriangle className="h-4 w-4" />, cls: 'border-gray-200 text-muted-foreground', activeCls: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
  { value: 'CRITICO', label: 'Crítico', icon: <XCircle className="h-4 w-4" />, cls: 'border-gray-200 text-muted-foreground', activeCls: 'border-red-500 bg-red-50 text-red-700' },
  { value: 'NA',      label: 'N/A',     icon: <MinusCircle className="h-4 w-4" />, cls: 'border-gray-200 text-muted-foreground', activeCls: 'border-gray-400 bg-gray-100 text-gray-600' },
]

export function ChecklistExecutor({ execucaoId, itens, categorias, respostaMap }: Props) {
  const [respostas, setRespostas] = useState<Record<string, Resposta>>(respostaMap)
  const [expandedObs, setExpandedObs] = useState<Record<string, boolean>>({})
  const [obsTexts, setObsTexts] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(respostaMap).map(([k, v]) => [k, v.observacao ?? '']))
  )
  const [observacoesFinais, setObservacoesFinais] = useState('')
  const [finalizado, setFinalizado] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  async function handleResposta(itemId: string, status: string) {
    setSaving((s) => ({ ...s, [itemId]: true }))
    const obs = obsTexts[itemId] ?? ''
    setRespostas((r) => ({ ...r, [itemId]: { status, observacao: obs } }))
    await responderItemAction(execucaoId, itemId, status, obs || undefined)
    setSaving((s) => ({ ...s, [itemId]: false }))
  }

  async function handleObsBlur(itemId: string) {
    const current = respostas[itemId]
    if (!current) return
    setSaving((s) => ({ ...s, [itemId]: true }))
    await responderItemAction(execucaoId, itemId, current.status, obsTexts[itemId] || undefined)
    setSaving((s) => ({ ...s, [itemId]: false }))
  }

  function handleFinalizar() {
    startTransition(async () => {
      await finalizarChecklistAction(execucaoId, observacoesFinais || undefined)
      setFinalizado(true)
    })
  }

  const totalRespondidos = Object.keys(respostas).length
  const totalItens = itens.length
  const todosRespondidos = totalRespondidos >= totalItens

  return (
    <div className="space-y-4">
      {categorias.map((cat) => {
        const grupo = itens.filter((i) => (i.categoria ?? '') === cat)
        return (
          <div key={cat} className="rounded-lg border bg-card overflow-hidden">
            {cat && (
              <div className="px-4 py-2 bg-muted/40 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</p>
              </div>
            )}
            <div className="divide-y">
              {grupo.map((item) => {
                const resp = respostas[item.id]
                const isExpanded = expandedObs[item.id] ?? false
                const isSaving = saving[item.id] ?? false

                return (
                  <div key={item.id} className={`px-4 py-3 space-y-2 transition-colors ${isSaving ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">
                        {item.obrigatorio && <span className="text-red-500 mr-1" title="Obrigatório">*</span>}
                        {item.descricao}
                      </p>
                    </div>

                    {/* Botões de resposta */}
                    <div className="flex gap-2 flex-wrap">
                      {opcoes.map((op) => (
                        <button
                          key={op.value}
                          type="button"
                          onClick={() => handleResposta(item.id, op.value)}
                          disabled={isSaving}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                            resp?.status === op.value ? op.activeCls : op.cls + ' hover:bg-muted/50'
                          }`}
                        >
                          {op.icon}{op.label}
                        </button>
                      ))}

                      {/* Toggle observação */}
                      {resp && (
                        <button
                          type="button"
                          onClick={() => setExpandedObs((e) => ({ ...e, [item.id]: !e[item.id] }))}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground px-2 py-1.5 rounded-full border border-dashed hover:bg-muted/50 transition-colors ml-auto"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          Obs.
                        </button>
                      )}
                    </div>

                    {/* Campo de observação */}
                    {isExpanded && resp && (
                      <textarea
                        rows={2}
                        placeholder="Observação (opcional)..."
                        value={obsTexts[item.id] ?? ''}
                        onChange={(e) => setObsTexts((o) => ({ ...o, [item.id]: e.target.value }))}
                        onBlur={() => handleObsBlur(item.id)}
                        className="w-full text-sm rounded-md border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Finalizar */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {totalRespondidos}/{totalItens} itens respondidos
          </p>
          {!todosRespondidos && (
            <span className="text-xs text-muted-foreground">{totalItens - totalRespondidos} pendente{totalItens - totalRespondidos !== 1 ? 's' : ''}</span>
          )}
        </div>

        <textarea
          rows={2}
          placeholder="Observações finais (opcional)..."
          value={observacoesFinais}
          onChange={(e) => setObservacoesFinais(e.target.value)}
          className="w-full text-sm rounded-md border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <button
          type="button"
          onClick={handleFinalizar}
          disabled={isPending || finalizado || totalRespondidos === 0}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Finalizando...' : finalizado ? 'Finalizado!' : 'Finalizar checklist'}
        </button>

        {!todosRespondidos && (
          <p className="text-xs text-center text-muted-foreground">
            Itens sem resposta serão classificados como não cobertos.
          </p>
        )}
      </div>
    </div>
  )
}
