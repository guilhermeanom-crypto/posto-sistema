'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function atualizarPocoAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const id = formData.get('id') as string
  const periodicidade = formData.get('periodicidade') as string
  const proximaColeta = formData.get('proximaColeta') as string
  const status = formData.get('status') as string
  const observacoes = formData.get('observacoes') as string

  try {
    await api.patch(`/monitoramento/pocos/${id}`, {
      periodicidade: periodicidade || undefined,
      proximaColeta: proximaColeta || undefined,
      status: status || undefined,
      observacoes: observacoes || undefined,
    }, token)
    revalidatePath(`/monitoramento/pocos/${id}`)
    revalidatePath('/monitoramento')
    return { ok: true }
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao atualizar ponto' }
  }
}
