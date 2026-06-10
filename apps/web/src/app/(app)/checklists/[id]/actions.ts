'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function responderItemAction(
  execucaoId: string,
  itemId: string,
  status: string,
  observacao?: string,
) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.put(`/checklists/execucoes/${execucaoId}/itens/${itemId}`, { status, observacao: observacao || undefined }, token)
    revalidatePath(`/checklists/${execucaoId}`)
    return { ok: true }
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao salvar resposta' }
  }
}

export async function finalizarChecklistAction(
  execucaoId: string,
  observacoes?: string,
) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.post(`/checklists/execucoes/${execucaoId}/finalizar`, { observacoes: observacoes || undefined }, token)
    revalidatePath(`/checklists/${execucaoId}`)
    revalidatePath('/checklists')
    return { ok: true }
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao finalizar checklist' }
  }
}
