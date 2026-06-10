'use server'

import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function gerarTarefasOnboardingAction(
  empreendimentoId: string,
  modulosSelecionados: string[],
  criticidadeSelecionada: string[],
): Promise<{
  tarefasCriadas: number
  tarefasIgnoradas: number
  mensagem: string
  error?: string
}> {
  const token = await getAccessToken()
  if (!token) return { tarefasCriadas: 0, tarefasIgnoradas: 0, mensagem: '', error: 'Não autenticado' }

  try {
    const res = await api.post<{
      data: { tarefasCriadas: number; tarefasIgnoradas: number; mensagem: string }
    }>(
      `/onboarding/gap-analysis/${empreendimentoId}/gerar-tarefas`,
      {
        apenasModulos: modulosSelecionados,
        apenasCriticidade: criticidadeSelecionada,
      },
      token,
    )
    return res.data
  } catch (err) {
    if (err instanceof ApiError) return { tarefasCriadas: 0, tarefasIgnoradas: 0, mensagem: '', error: err.message }
    return { tarefasCriadas: 0, tarefasIgnoradas: 0, mensagem: '', error: 'Erro inesperado' }
  }
}
