'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function criarBombaAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const combustiveisBruto = formData.get('combustiveis') as string
  const combustiveis = combustiveisBruto.split(',').map((s) => s.trim()).filter(Boolean)

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    numero: Number(formData.get('numero')),
    fabricante: formData.get('fabricante') as string,
    modelo: formData.get('modelo') as string || undefined,
    numeroDeSerie: formData.get('numeroDeSerie') as string || undefined,
    combustiveis,
    ultimaCalibracao: formData.get('ultimaCalibracao') as string || undefined,
    proximaCalibracao: formData.get('proximaCalibracao') as string || undefined,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post('/anp-inmetro', payload, token)
    revalidatePath('/anp-inmetro')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao cadastrar bomba' }
  }
}

export async function registrarCalibracaoAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const bombaId = formData.get('bombaId') as string
  const payload = {
    dataExecucao: formData.get('dataExecucao') as string,
    proximaCalibracao: formData.get('proximaCalibracao') as string,
    stickerInmetro: formData.get('stickerInmetro') as string || undefined,
  }

  try {
    await api.post(`/anp-inmetro/${bombaId}/calibracao`, payload, token)
    revalidatePath('/anp-inmetro')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao registrar calibração' }
  }
}
