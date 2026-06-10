'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function criarPocoArtesianoAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    codigo: formData.get('codigo') as string,
    profundidade: formData.get('profundidade') ? Number(formData.get('profundidade')) : undefined,
    outorgaDAEE: formData.get('outorgaDAEE') as string || undefined,
    validadeOutorga: formData.get('validadeOutorga') as string || undefined,
    vazaoAutorizada: formData.get('vazaoAutorizada') ? Number(formData.get('vazaoAutorizada')) : undefined,
    dataPerforacao: formData.get('dataPerforacao') as string || undefined,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post('/outorga-hidrica', payload, token)
    revalidatePath('/outorga-hidrica')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao cadastrar poço' }
  }
}
