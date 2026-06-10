'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function registrarEPIAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const body = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    funcionarioId: formData.get('funcionarioId') as string,
    tipoEPI: formData.get('tipoEPI') as string,
    ca: (formData.get('ca') as string) || undefined,
    quantidade: parseInt(formData.get('quantidade') as string, 10) || 1,
    dataEntrega: formData.get('dataEntrega') as string,
    dataVencimento: (formData.get('dataVencimento') as string) || undefined,
    observacoes: (formData.get('observacoes') as string) || undefined,
  }

  try {
    await api.post('/sst/epis', body, token)
    revalidatePath('/sst/epis')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao registrar EPI' }
  }
}
