'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function avancarStatusMTRAction(
  mtrId: string,
  novoStatus: string,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }
  try {
    await api.patch(`/logistica-reversa/mtrs/${mtrId}/status`, { status: novoStatus }, token)
    revalidatePath(`/logistica-reversa/${mtrId}`)
    revalidatePath('/logistica-reversa')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao atualizar status' }
  }
}
