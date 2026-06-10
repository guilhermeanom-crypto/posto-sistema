'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Membro { id: string; nome: string; email: string; perfil: string; ativo: boolean }

const perfilLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN_TENANT: 'Admin', COORDENADOR: 'Coordenador',
  ANALISTA: 'Analista', ANALISTA_CAMPO: 'Campo', EXECUTIVO: 'Executivo', REPRESENTANTE_POSTO: 'Representante',
}

export function EquipeCard({ empreendimentoId }: { empreendimentoId: string }) {
  const [membros, setMembros] = useState<Membro[]>([])
  const [usuarios, setUsuarios] = useState<Membro[]>([])
  const [adicionando, setAdicionando] = useState(false)
  const [selId, setSelId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function parseError(response: Response, fallback: string) {
    const body = await response.json().catch(() => ({}))
    if (typeof body?.error === 'string' && body.error) return body.error
    if (typeof body?.message === 'string' && body.message) return body.message
    return fallback
  }

  async function carregarEquipeAtual() {
    const response = await fetch(`/api/empreendimentos/${empreendimentoId}/equipe`, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(await parseError(response, 'Erro ao carregar equipe do empreendimento'))
    }

    const body = await response.json()
    return body.data ?? []
  }

  async function carregarUsuariosDisponiveis() {
    const response = await fetch('/api/usuarios', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(await parseError(response, 'Erro ao carregar usuários disponíveis'))
    }

    const body = await response.json()
    return body.data ?? []
  }

  useEffect(() => {
    let ativo = true

    async function carregarDados() {
      setCarregando(true)
      setErro(null)

      try {
        const [proximosMembros, proximosUsuarios] = await Promise.all([
          carregarEquipeAtual(),
          carregarUsuariosDisponiveis(),
        ])

        if (!ativo) return

        setMembros(proximosMembros)
        setUsuarios(proximosUsuarios)
      } catch (error) {
        if (!ativo) return

        const message = error instanceof Error ? error.message : 'Erro ao carregar equipe'
        setErro(message)
        toast({ title: 'Falha ao carregar equipe', description: message, variant: 'destructive' })
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    void carregarDados()

    return () => {
      ativo = false
    }
  }, [empreendimentoId])

  function adicionar() {
    if (!selId) return
    startTransition(async () => {
      setErro(null)

      const response = await fetch(`/api/empreendimentos/${empreendimentoId}/equipe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: selId }),
      })

      if (!response.ok) {
        const message = await parseError(response, 'Erro ao adicionar membro à equipe')
        setErro(message)
        toast({ title: 'Falha ao adicionar membro', description: message, variant: 'destructive' })
        return
      }

      try {
        setMembros(await carregarEquipeAtual())
        setAdicionando(false)
        setSelId('')
        toast({ title: 'Membro adicionado com sucesso', variant: 'success' })
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao atualizar equipe'
        setErro(message)
        toast({ title: 'Equipe não pôde ser atualizada', description: message, variant: 'destructive' })
      }
    })
  }

  function remover(usuarioId: string) {
    startTransition(async () => {
      setErro(null)

      const response = await fetch(`/api/empreendimentos/${empreendimentoId}/equipe/${usuarioId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const message = await parseError(response, 'Erro ao remover membro da equipe')
        setErro(message)
        toast({ title: 'Falha ao remover membro', description: message, variant: 'destructive' })
        return
      }

      try {
        setMembros(await carregarEquipeAtual())
        toast({ title: 'Membro removido com sucesso', variant: 'success' })
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao atualizar equipe'
        setErro(message)
        toast({ title: 'Equipe não pôde ser atualizada', description: message, variant: 'destructive' })
      }
    })
  }

  const membrosIds = new Set(membros.map((m) => m.id))
  const disponiveis = usuarios.filter((u) => !membrosIds.has(u.id) && u.ativo)

  return (
    <div className="rounded-xl border bg-card">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Equipe Responsável</h3>
          <span className="text-xs text-muted-foreground">({membros.length})</span>
        </div>
        {!adicionando && (
          <button onClick={() => setAdicionando(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3 w-3" /> Adicionar
          </button>
        )}
      </div>

      {erro && (
        <div className="px-4 py-2 border-b bg-red-50 text-xs text-red-700">
          {erro}
        </div>
      )}

      {adicionando && (
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
          <select value={selId} onChange={(e) => setSelId(e.target.value)} className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs">
            <option value="">Selecione um usuário...</option>
            {disponiveis.map((u) => <option key={u.id} value={u.id}>{u.nome} — {perfilLabel[u.perfil] ?? u.perfil}</option>)}
          </select>
          <button onClick={adicionar} disabled={!selId || isPending} className="rounded-md bg-primary px-2.5 py-1.5 text-xs text-primary-foreground disabled:opacity-50">
            {isPending ? '...' : 'Adicionar'}
          </button>
          <button onClick={() => setAdicionando(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
        </div>
      )}

      {carregando ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">Carregando equipe...</div>
      ) : membros.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">Nenhum analista atribuído a este posto.</div>
      ) : (
        <div className="divide-y">
          {membros.map((m) => (
            <div key={m.id} className="px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{m.nome}</p>
                <p className="text-xs text-muted-foreground">{m.email} · {perfilLabel[m.perfil] ?? m.perfil}</p>
              </div>
              <button onClick={() => remover(m.id)} disabled={isPending} className="text-muted-foreground hover:text-red-600 disabled:opacity-50">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
