'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function iniciarTarefaAction(tarefaId: string): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.post(`/tarefas/${tarefaId}/iniciar`, {}, token)
    revalidatePath(`/tarefas/${tarefaId}`)
    revalidatePath('/tarefas')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro inesperado' }
  }
}

export async function concluirTarefaAction(
  tarefaId: string,
  observacoes?: string,
): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.post(`/tarefas/${tarefaId}/concluir`, { observacoes: observacoes || undefined }, token)
    revalidatePath(`/tarefas/${tarefaId}`)
    revalidatePath('/tarefas')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro inesperado' }
  }
}

export async function cancelarTarefaAction(
  tarefaId: string,
  motivo: string,
): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.post(`/tarefas/${tarefaId}/cancelar`, { motivo }, token)
    revalidatePath(`/tarefas/${tarefaId}`)
    revalidatePath('/tarefas')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro inesperado' }
  }
}
