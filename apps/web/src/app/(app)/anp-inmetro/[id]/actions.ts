'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function registrarCalibracaoAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const bombaId           = formData.get('bombaId') as string
  const dataExecucao      = formData.get('dataExecucao') as string
  const proximaCalibracao = formData.get('proximaCalibracao') as string
  const stickerInmetro    = formData.get('stickerInmetro') as string

  try {
    await api.post(`/anp-inmetro/${bombaId}/calibracao`, {
      dataExecucao,
      proximaCalibracao,
      stickerInmetro: stickerInmetro || undefined,
    }, token)

    revalidatePath(`/anp-inmetro/${bombaId}`)
    revalidatePath('/anp-inmetro')
    revalidatePath('/dashboard')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao registrar calibração' }
  }
}
