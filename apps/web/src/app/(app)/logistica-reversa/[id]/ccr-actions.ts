'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function criarCCRAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const mtrId = formData.get('mtrId') as string
  const tipoResiduo = formData.get('tipoResiduo') as string
  const quantidadeKg = formData.get('quantidadeKg') as string
  const destinador = formData.get('destinador') as string
  const cnpjDestinador = formData.get('cnpjDestinador') as string
  const dataDestinacao = formData.get('dataDestinacao') as string
  const numeroCCR = formData.get('numeroCCR') as string
  const tecnologiaUso = formData.get('tecnologiaUso') as string

  if (!tipoResiduo || !quantidadeKg || !destinador || !dataDestinacao) {
    return { error: 'Preencha os campos obrigatórios' }
  }

  try {
    await api.post(`/logistica-reversa/mtrs/${mtrId}/ccrs`, {
      tipoResiduo,
      quantidadeKg: parseFloat(quantidadeKg),
      destinador,
      cnpjDestinador: cnpjDestinador || undefined,
      dataDestinacao,
      numeroCCR: numeroCCR || undefined,
      tecnologiaUso: tecnologiaUso || undefined,
    }, token)
    revalidatePath(`/logistica-reversa/${mtrId}`)
    return { ok: true }
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao registrar CCR' }
  }
}
