'use client'

import { useActionState } from 'react'
import { criarRegraAction } from './actions'

const TIPOS = [
  { value: 'vencimento_doc',  label: 'Documento vencendo' },
  { value: 'vencimento_proc', label: 'Processo vencendo' },
  { value: 'condicionante',   label: 'Condicionante vencendo' },
  { value: 'requisito',       label: 'Requisito pendente' },
  { value: 'escalamento',     label: 'Tarefa não concluída (escalonamento)' },
]

const ACOES = [
  { value: 'enviar_alerta', label: 'Enviar alerta no sistema' },
  { value: 'criar_tarefa',  label: 'Criar tarefa automaticamente' },
  { value: 'escalonar',     label: 'Escalonar tarefa existente' },
]

const PERFIS = [
  { value: 'ADMIN_TENANT',  label: 'Administrador' },
  { value: 'COORDENADOR',   label: 'Coordenador' },
  { value: 'TECNICO',       label: 'Técnico' },
  { value: 'CONSULTOR',     label: 'Consultor' },
]

const CANAIS = [
  { value: 'app',       label: 'In-app' },
  { value: 'email',     label: 'E-mail' },
  { value: 'whatsapp',  label: 'WhatsApp' },
]

const initialState: { ok?: boolean; error?: string } = {}

export function RegraForm() {
  const [state, action, pending] = useActionState(criarRegraAction, initialState)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          Regra criada com sucesso.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Nome */}
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nome da regra *</label>
          <input
            name="nome"
            required
            placeholder="ex: Aviso 30 dias antes do vencimento de licença"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Tipo (módulo) */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Módulo / Gatilho *</label>
          <select
            name="tipo"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione…</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Dias de antecedência */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Antecedência (dias) *</label>
          <input
            name="diasAntes"
            type="number"
            min={1}
            max={365}
            defaultValue={30}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Ação */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Ação disparada *</label>
          <select
            name="acao"
            required
            defaultValue="enviar_alerta"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ACOES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Descrição */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Descrição (opcional)</label>
          <input
            name="descricao"
            placeholder="Detalhes adicionais…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Perfis */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Perfis que recebem *</p>
          <div className="rounded-md border bg-background p-3 space-y-2">
            {PERFIS.map((p) => (
              <label key={p.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="perfis"
                  value={p.value}
                  defaultChecked={p.value === 'ADMIN_TENANT' || p.value === 'COORDENADOR'}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring"
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {/* Canais */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Canais de notificação *</p>
          <div className="rounded-md border bg-background p-3 space-y-2">
            {CANAIS.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="canais"
                  value={c.value}
                  defaultChecked={c.value === 'app'}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring"
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Criando…' : 'Criar regra'}
        </button>
      </div>
    </form>
  )
}
