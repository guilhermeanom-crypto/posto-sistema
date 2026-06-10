'use client'

import { useActionState, useEffect, useState } from 'react'
import { criarUsuarioAction } from './actions'
import { toast } from '@/hooks/use-toast'

const PERFIS = [
  { value: 'ANALISTA', label: 'Analista' },
  { value: 'ANALISTA_CAMPO', label: 'Analista de Campo' },
  { value: 'COORDENADOR', label: 'Coordenador' },
  { value: 'EXECUTIVO', label: 'Executivo' },
  { value: 'REPRESENTANTE_POSTO', label: 'Representante de Posto (Portal)' },
  { value: 'ADMIN_TENANT', label: 'Administrador' },
]

interface Empreendimento { id: string; nome: string; cidade: string; estado: string }

export function CriarUsuarioForm({ empreendimentos }: { empreendimentos: Empreendimento[] }) {
  const [state, action, pending] = useActionState(criarUsuarioAction, null)
  const [perfilSelecionado, setPerfilSelecionado] = useState('')
  const [senhaGerada, setSenhaGerada] = useState('')

  useEffect(() => {
    if (state === null && !pending) {
      toast({ title: 'Usuário criado com sucesso', variant: 'success' })
      setSenhaGerada('')
    }
  }, [state, pending])

  function gerarSenha() {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#!'
    const senha = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => chars[b % chars.length])
      .join('')
    setSenhaGerada(senha)
    // Copia para clipboard
    navigator.clipboard.writeText(senha).catch(() => {})
    toast({ title: 'Senha gerada e copiada!', description: senha })
  }

  const isPortal = perfilSelecionado === 'REPRESENTANTE_POSTO'

  return (
    <form action={action} className="space-y-4 rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Novo Usuário</p>
        {isPortal && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Acesso ao Portal do Cliente
          </span>
        )}
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="nome" className="text-sm font-medium">Nome <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="nome"
            name="nome"
            required
            minLength={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="telefone" className="text-sm font-medium">Telefone</label>
          <input
            type="tel"
            id="telefone"
            name="telefone"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">E-mail <span className="text-red-500">*</span></label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="senha" className="text-sm font-medium">
            Senha inicial <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="senha"
              name="senha"
              required
              minLength={8}
              value={senhaGerada}
              onChange={(e) => setSenhaGerada(e.target.value)}
              placeholder="Mín. 8 caracteres"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={gerarSenha}
              title="Gerar senha aleatória e copiar"
              className="rounded-md border px-3 py-2 text-xs hover:bg-muted transition-colors shrink-0"
            >
              Gerar
            </button>
          </div>
          {isPortal && senhaGerada && (
            <p className="text-xs text-muted-foreground">
              Senha copiada — envie ao representante com o link do portal.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="perfil" className="text-sm font-medium">Perfil <span className="text-red-500">*</span></label>
          <select
            id="perfil"
            name="perfil"
            required
            value={perfilSelecionado}
            onChange={(e) => setPerfilSelecionado(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione...</option>
            {PERFIS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Campo empreendimento — só aparece para REPRESENTANTE_POSTO */}
      {isPortal && (
        <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <label htmlFor="empreendimentoId" className="text-sm font-medium">
            Empreendimento do Representante <span className="text-red-500">*</span>
          </label>
          <select
            id="empreendimentoId"
            name="empreendimentoId"
            required={isPortal}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione o posto...</option>
            {empreendimentos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome} — {e.cidade}/{e.estado}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            O representante só terá acesso aos documentos deste posto no portal.
          </p>
          <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700 space-y-0.5">
            <p className="font-medium">Link do portal para enviar ao cliente:</p>
            <p className="font-mono break-all select-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/portal/login
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Criando...' : isPortal ? 'Criar Acesso ao Portal' : 'Criar Usuário'}
        </button>
      </div>
    </form>
  )
}
