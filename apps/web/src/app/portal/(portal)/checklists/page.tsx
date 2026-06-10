import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from 'lucide-react'
import { RespostaForm } from './resposta-form'

export const metadata: Metadata = { title: 'Checklists' }

interface Resposta {
  id: string
  status: string
  observacao: string | null
  item: { id: string; descricao: string; categoria: string | null; ordem: number }
}

interface Execucao {
  id: string
  status: string
  iniciadaEm: string
  finalizadaEm: string | null
  observacoes: string | null
  template: { id: string; nome: string; modulo: string; descricao: string | null }
  executadoPor: { id: string; nome: string }
  respostas: Resposta[]
}

const execStatusConfig: Record<string, { label: string; cls: string }> = {
  EM_ANDAMENTO: { label: 'Em Andamento', cls: 'bg-blue-100 text-blue-800' },
  CONFORME: { label: 'Conforme', cls: 'bg-green-100 text-green-800' },
  NAO_CONFORME: { label: 'Não Conforme', cls: 'bg-red-100 text-red-800' },
  PARCIAL: { label: 'Parcial', cls: 'bg-yellow-100 text-yellow-800' },
}

const respostaConfig: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  OK: { label: 'OK', cls: 'text-green-700', Icon: CheckCircle2 },
  ATENCAO: { label: 'Atenção', cls: 'text-yellow-700', Icon: AlertTriangle },
  CRITICO: { label: 'Crítico', cls: 'text-red-700', Icon: XCircle },
  NA: { label: 'N/A', cls: 'text-gray-500', Icon: MinusCircle },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function PortalChecklistsPage() {
  const token = await getAccessToken()
  let execucoes: Execucao[] = []

  if (token) {
    try {
      const res = await api.get<{ data: Execucao[] }>('/portal/checklists', token)
      execucoes = res.data
    } catch { /* exibe vazio */ }
  }

  const emAndamento = execucoes.filter((e) => e.status === 'EM_ANDAMENTO')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Checklists
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {execucoes.length} checklist{execucoes.length !== 1 ? 's' : ''}
          {emAndamento.length > 0 && (
            <span className="ml-2 text-blue-600 font-medium">
              · {emAndamento.length} em andamento
            </span>
          )}
        </p>
      </div>

      {execucoes.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center space-y-2">
          <ClipboardCheck className="h-8 w-8 text-green-500 mx-auto" />
          <p className="font-semibold text-foreground">Nenhum checklist atribuído</p>
          <p className="text-sm text-muted-foreground">Quando sua equipe de consultoria atribuir um checklist, ele aparecerá aqui.</p>
        </div>
      )}

      {execucoes.map((exec) => {
        const cfg = execStatusConfig[exec.status] ?? execStatusConfig['EM_ANDAMENTO']!
        const respondidos = exec.respostas.filter((r) => r.status).length
        const totalItens = exec.respostas.length
        const isAberto = exec.status === 'EM_ANDAMENTO'

        // Agrupa respostas por categoria
        const categorias = new Map<string, Resposta[]>()
        for (const r of exec.respostas) {
          const cat = r.item.categoria ?? 'Geral'
          if (!categorias.has(cat)) categorias.set(cat, [])
          categorias.get(cat)!.push(r)
        }

        return (
          <div key={exec.id} className="rounded-xl border bg-card overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">{exec.template.nome}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{exec.template.modulo}</span>
                  <span>Início: {formatDate(exec.iniciadaEm)}</span>
                  {exec.finalizadaEm && <span>Final: {formatDate(exec.finalizadaEm)}</span>}
                  <span>Por: {exec.executadoPor.nome}</span>
                </div>
                {exec.template.descricao && (
                  <p className="text-xs text-muted-foreground mt-1">{exec.template.descricao}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">Progresso</p>
                <p className="text-sm font-semibold">{respondidos}/{totalItens}</p>
              </div>
            </div>

            {/* Itens por categoria */}
            <div className="divide-y">
              {[...categorias.entries()].map(([cat, respostas]) => (
                <div key={cat}>
                  <div className="px-4 py-2 bg-muted/40">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{cat}</p>
                  </div>
                  <div className="divide-y divide-dashed">
                    {respostas.map((r) => {
                      const rcfg = respostaConfig[r.status]
                      const RIcon = rcfg?.Icon

                      return (
                        <div key={r.id} className="px-4 py-2.5 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{r.item.descricao}</p>
                            {r.observacao && (
                              <p className="text-xs text-muted-foreground mt-0.5">{r.observacao}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {rcfg && RIcon ? (
                              <span className={`flex items-center gap-1 text-xs font-medium ${rcfg.cls}`}>
                                <RIcon className="h-3.5 w-3.5" />
                                {rcfg.label}
                              </span>
                            ) : isAberto ? (
                              <RespostaForm execucaoId={exec.id} itemId={r.item.id} />
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem resposta</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
