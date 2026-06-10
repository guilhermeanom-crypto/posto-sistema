'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function solicitarRelatorioAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const tipo = formData.get('tipo') as string
  const parametros: Record<string, unknown> = {}

  const dias = formData.get('dias')
  if (dias) parametros.dias = Number(dias)

  const empreendimentoId = formData.get('empreendimentoId') as string
  if (empreendimentoId) parametros.empreendimentoId = empreendimentoId

  try {
    await api.post('/relatorios', { tipo, parametros }, token)
    revalidatePath('/relatorios')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao solicitar relatório' }
  }
}

export async function removerRelatorioAction(id: string) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.delete(`/relatorios/${id}`, token)
    revalidatePath('/relatorios')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao remover relatório' }
  }
}
