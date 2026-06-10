'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function criarCampanhaAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    tipo: formData.get('tipo') as string,
    dataColeta: formData.get('dataColeta') as string,
    laboratorio: formData.get('laboratorio') as string,
    resultado: formData.get('resultado') as string,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post('/monitoramento/campanhas', payload, token)
    revalidatePath('/monitoramento')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao criar campanha' }
  }
}
