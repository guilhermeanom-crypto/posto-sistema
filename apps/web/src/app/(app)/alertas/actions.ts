'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function marcarAlertaLido(id: string) {
  const token = await getAccessToken()
  if (!token) return
  await api.patch(`/alertas/${id}/ler`, {}, token)
  revalidatePath('/alertas')
}

export async function marcarTodosLidos() {
  const token = await getAccessToken()
  if (!token) return
  await api.patch('/alertas/ler-todos', {}, token)
  revalidatePath('/alertas')
}

export async function criarTarefaDeAlertaAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const alertaId = formData.get('alertaId') as string
  const titulo = formData.get('titulo') as string
  const dataVencimento = formData.get('dataVencimento') as string
  const empreendimentoId = formData.get('empreendimentoId') as string | null

  try {
    await api.post(
      '/tarefas',
      {
        titulo,
        dataVencimento,
        prioridade: 'ALTA',
        origem: 'ALERTA',
        ...(empreendimentoId ? { empreendimentoId } : {}),
      },
      token,
    )
    // Marca o alerta como lido após criar tarefa
    await api.patch(`/alertas/${alertaId}/ler`, {}, token).catch(() => {})
    revalidatePath('/alertas')
    revalidatePath('/tarefas')
    revalidatePath('/dashboard')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao criar tarefa' }
  }
}
