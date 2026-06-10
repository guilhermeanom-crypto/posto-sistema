'use client'

import { useActionState, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cadastrarContatoAction, removerContatoAction } from './actions'

interface Contato {
  id: string
  numero: string
  nome: string | null
  ativo: boolean
  empreendimento: { id: string; nome: string } | null
}

interface Empreendimento { id: string; nome: string }

export function ContatosPanel({ contatos, empreendimentos }: { contatos: Contato[]; empreendimentos: Empreendimento[] }) {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(cadastrarContatoAction, null)
  const [removendo, startRemover] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  async function remover(id: string) {
    startRemover(async () => {
      const fd = new FormData()
      fd.append('id', id)
      await removerContatoAction(null, fd)
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Contatos Cadastrados ({contatos.length})</h2>
        {!aberto && (
          <button onClick={() => setAberto(true)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            + Adicionar Contato
          </button>
        )}
      </div>

      {aberto && (
        <div className="p-4 border-b bg-muted/30">
          <form action={action} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Número WhatsApp *</label>
              <input
                name="numero"
                required
                placeholder="5511999999999"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
              <p className="text-xs text-muted-foreground">Apenas dígitos com DDI (ex: 5511...)</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Nome</label>
              <input name="nome" placeholder="Nome do responsável" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Empreendimento</label>
              <select name="empreendimentoId" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Todos os postos</option>
                {empreendimentos.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>
            {state?.error && <p className="md:col-span-3 text-xs text-red-600">{state.error}</p>}
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" disabled={pending} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {pending ? 'Salvando...' : 'Cadastrar'}
              </button>
              <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {contatos.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum contato cadastrado. Adicione os responsáveis pelos postos para ativar o agente.
        </div>
      ) : (
        <div className="divide-y">
          {contatos.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{c.numero}</span>
                  {c.nome && <span className="text-sm text-muted-foreground">— {c.nome}</span>}
                  {!c.ativo && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Inativo</span>}
                </div>
                {c.empreendimento && (
                  <p className="text-xs text-muted-foreground mt-0.5">{c.empreendimento.nome}</p>
                )}
                {!c.empreendimento && (
                  <p className="text-xs text-muted-foreground mt-0.5">Todos os postos</p>
                )}
              </div>
              <button
                onClick={() => remover(c.id)}
                disabled={removendo}
                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
