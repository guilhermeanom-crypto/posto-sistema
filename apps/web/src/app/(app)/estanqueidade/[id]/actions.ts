'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function criarTesteAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const tanqueId    = formData.get('tanqueId') as string
  const empresa     = formData.get('empresa') as string
  const responsavel = formData.get('responsavel') as string
  const dataExecucao= formData.get('dataExecucao') as string
  const resultado   = formData.get('resultado') as string
  const metodo      = formData.get('metodo') as string
  const proximoTeste= formData.get('proximoTeste') as string
  const observacoes = formData.get('observacoes') as string

  try {
    await api.post(`/estanqueidade/tanques/${tanqueId}/testes`, {
      empresa,
      responsavel: responsavel || undefined,
      dataExecucao,
      resultado,
      metodo: metodo || undefined,
      proximoTeste,
      observacoes: observacoes || undefined,
    }, token)

    revalidatePath(`/estanqueidade/${tanqueId}`)
    revalidatePath('/estanqueidade')
    revalidatePath('/dashboard')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao registrar laudo' }
  }
}

export async function atualizarStatusTanqueAction(
  tanqueId: string,
  status: string,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }
  try {
    await api.patch(`/estanqueidade/tanques/${tanqueId}`, { status }, token)
    revalidatePath(`/estanqueidade/${tanqueId}`)
    revalidatePath('/estanqueidade')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao atualizar status' }
  }
}
