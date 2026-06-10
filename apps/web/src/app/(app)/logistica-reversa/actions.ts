'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function criarMTRAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const residuoTipo = formData.get('residuoTipo') as string
  const residuoQtd = formData.get('residuoQtd') as string
  const residuoUnidade = formData.get('residuoUnidade') as string
  const residuoDestinacao = formData.get('residuoDestinacao') as string

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    transportadoraId: formData.get('transportadoraId') as string || undefined,
    numeroMTR: formData.get('numeroMTR') as string || undefined,
    dataEmissao: formData.get('dataEmissao') as string,
    dataColeta: formData.get('dataColeta') as string || undefined,
    residuos: [{ tipo: residuoTipo, quantidade: Number(residuoQtd), unidade: residuoUnidade, destinacao: residuoDestinacao || undefined }],
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post('/logistica-reversa/mtrs', payload, token)
    revalidatePath('/logistica-reversa')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao criar MTR' }
  }
}

export async function criarTransportadoraAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const payload = {
    nome: formData.get('nome') as string,
    cnpj: formData.get('cnpj') as string,
    licencaAmbiental: formData.get('licencaAmbiental') as string || undefined,
    validadeLicenca: formData.get('validadeLicenca') as string || undefined,
    telefone: formData.get('telefone') as string || undefined,
    email: formData.get('email') as string || undefined,
  }

  try {
    await api.post('/logistica-reversa/transportadoras', payload, token)
    revalidatePath('/logistica-reversa')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao cadastrar transportadora' }
  }
}

export async function atualizarStatusMTRAction(id: string, status: string) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.patch(`/logistica-reversa/mtrs/${id}/status`, { status }, token)
    revalidatePath('/logistica-reversa')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao atualizar status' }
  }
}
