'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function criarTarefaAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const body = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    titulo: formData.get('titulo') as string,
    descricao: (formData.get('descricao') as string) || undefined,
    responsavelId: (formData.get('responsavelId') as string) || undefined,
    prioridade: formData.get('prioridade') as string,
    dataVencimento: (formData.get('dataVencimento') as string) || undefined,
  }

  try {
    await api.post('/tarefas', body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao criar tarefa' }
  }
}
