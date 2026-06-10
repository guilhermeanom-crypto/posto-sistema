'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function upsertMetaAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const empreendimentoId = formData.get('empreendimentoId') as string
  const ano = formData.get('ano') as string
  const tipoResiduo = formData.get('tipoResiduo') as string
  const unidade = formData.get('unidade') as string
  const metaQuantidade = formData.get('metaQuantidade') as string
  const observacoes = formData.get('observacoes') as string

  if (!empreendimentoId || !ano || !tipoResiduo || !unidade || !metaQuantidade) {
    return { error: 'Preencha todos os campos obrigatórios' }
  }

  try {
    await api.put('/logistica-reversa/metas', {
      empreendimentoId,
      ano: parseInt(ano),
      tipoResiduo,
      unidade,
      metaQuantidade: parseFloat(metaQuantidade),
      observacoes: observacoes || undefined,
    }, token)
    revalidatePath('/logistica-reversa/metas')
    revalidatePath('/logistica-reversa')
    return { ok: true }
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao salvar meta' }
  }
}

export async function deletarMetaAction(id: string) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }
  try {
    await api.delete(`/logistica-reversa/metas/${id}`, token)
    revalidatePath('/logistica-reversa/metas')
    return { ok: true }
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao excluir meta' }
  }
}
