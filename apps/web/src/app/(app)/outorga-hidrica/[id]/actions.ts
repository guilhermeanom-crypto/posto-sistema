'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function criarLaudoAguaAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const pocoId      = formData.get('pocoId') as string
  const dataCampanha= formData.get('dataCampanha') as string
  const laboratorio = formData.get('laboratorio') as string
  const resultado   = formData.get('resultado') as string
  const observacoes = formData.get('observacoes') as string

  try {
    await api.post(`/outorga-hidrica/${pocoId}/laudos`, {
      dataCampanha,
      laboratorio,
      resultado,
      parametros: [], // simplificado — parâmetros detalhados podem ser adicionados depois
      observacoes: observacoes || undefined,
    }, token)

    revalidatePath(`/outorga-hidrica/${pocoId}`)
    revalidatePath('/outorga-hidrica')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao registrar laudo' }
  }
}
