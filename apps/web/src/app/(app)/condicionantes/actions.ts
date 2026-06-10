'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function cumprirCondicionanteAction(
  condicionanteId: string,
  observacoes?: string,
): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.post(
      `/condicionantes/${condicionanteId}/cumprir`,
      { observacoes: observacoes || undefined },
      token,
    )
    revalidatePath(`/condicionantes/${condicionanteId}`)
    revalidatePath('/condicionantes')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro inesperado' }
  }
}

export async function dispensarCondicionanteAction(
  condicionanteId: string,
  motivoDispensa: string,
): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.post(
      `/condicionantes/${condicionanteId}/dispensar`,
      { motivoDispensa },
      token,
    )
    revalidatePath(`/condicionantes/${condicionanteId}`)
    revalidatePath('/condicionantes')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro inesperado' }
  }
}
