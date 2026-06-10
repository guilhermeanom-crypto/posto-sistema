'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function upsertLimiteAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const nomeParametro = formData.get('nomeParametro') as string
  const tipoMedio = formData.get('tipoMedio') as string
  const limiteVMP = formData.get('limiteVMP') as string
  const unidade = formData.get('unidade') as string
  const referencia = formData.get('referencia') as string

  if (!nomeParametro || !tipoMedio || !limiteVMP || !unidade) {
    return { error: 'Preencha todos os campos obrigatórios' }
  }

  try {
    await api.put('/monitoramento/limites', {
      nomeParametro,
      tipoMedio,
      limiteVMP: parseFloat(limiteVMP),
      unidade,
      referencia: referencia || undefined,
    }, token)
    revalidatePath('/monitoramento/limites')
    return { ok: true }
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao salvar limite' }
  }
}

export async function deletarLimiteAction(id: string) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }
  try {
    await api.delete(`/monitoramento/limites/${id}`, token)
    revalidatePath('/monitoramento/limites')
    return { ok: true }
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao excluir' }
  }
}
