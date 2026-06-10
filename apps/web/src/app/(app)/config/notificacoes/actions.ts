'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

type Result = { ok?: boolean; error?: string }

export async function criarRegraAction(_prev: Result, formData: FormData): Promise<Result> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const nome = formData.get('nome') as string
  const descricao = (formData.get('descricao') as string) || undefined
  const tipo = formData.get('tipo') as string
  const diasAntes = parseInt(formData.get('diasAntes') as string, 10)
  const acao = formData.get('acao') as string
  const perfis = formData.getAll('perfis') as string[]
  const canais = formData.getAll('canais') as string[]

  if (!nome || !tipo || isNaN(diasAntes) || perfis.length === 0 || canais.length === 0) {
    return { error: 'Preencha todos os campos obrigatórios' }
  }

  try {
    await api.post('/config/regras', {
      nome, descricao, tipo, acao,
      gatilho: { diasAntes },
      parametros: { perfis, canais },
    }, token)
    revalidatePath('/config/notificacoes')
    return { ok: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar regra'
    return { error: msg }
  }
}

export async function toggleRegraAction(id: string, ativo: boolean): Promise<void> {
  const token = await getAccessToken()
  if (!token) return
  try {
    await api.patch(`/config/regras/${id}`, { ativo }, token)
    revalidatePath('/config/notificacoes')
  } catch {}
}

export async function deletarRegraAction(id: string): Promise<void> {
  const token = await getAccessToken()
  if (!token) return
  try {
    await api.delete(`/config/regras/${id}`, token)
    revalidatePath('/config/notificacoes')
  } catch {}
}
