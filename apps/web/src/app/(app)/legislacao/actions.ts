'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function criarTarefaAnaliseAction(publicacaoId: string, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const empreendimentoId = formData.get('empreendimentoId') as string
  const prioridade = (formData.get('prioridade') as string) || 'MEDIA'
  const dataVencimento = formData.get('dataVencimento') as string | null

  if (!empreendimentoId) return { error: 'Selecione um empreendimento' }

  try {
    const body: Record<string, string> = { empreendimentoId, prioridade }
    if (dataVencimento) body.dataVencimento = new Date(dataVencimento).toISOString()

    await api.post(`/legislacao/${publicacaoId}/tarefa`, body, token)
    revalidatePath('/tarefas')
    return { ok: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar tarefa'
    return { error: msg }
  }
}
