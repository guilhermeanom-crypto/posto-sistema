'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

type Result = { ok?: boolean; error?: string }

export async function atualizarPresencaAction(
  execucaoId: string,
  funcionarioId: string,
  presenca: boolean,
  aprovado: boolean,
): Promise<void> {
  const token = await getAccessToken()
  if (!token) return

  await api.patch(`/sst/treinamentos/${execucaoId}/participantes/${funcionarioId}`, { presenca, aprovado }, token)
  revalidatePath(`/sst/treinamentos/${execucaoId}`)
}

export async function adicionarParticipanteAction(
  execucaoId: string,
  _prev: Result,
  formData: FormData,
): Promise<Result> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const funcionarioId = formData.get('funcionarioId') as string
  if (!funcionarioId) return { error: 'Selecione um funcionário' }

  try {
    await api.post(`/sst/treinamentos/${execucaoId}/participantes`, { funcionarioId }, token)
    revalidatePath(`/sst/treinamentos/${execucaoId}`)
    return { ok: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao adicionar participante' }
  }
}

export async function removerParticipanteAction(execucaoId: string, funcionarioId: string): Promise<void> {
  const token = await getAccessToken()
  if (!token) return

  await api.delete(`/sst/treinamentos/${execucaoId}/participantes/${funcionarioId}`, token)
  revalidatePath(`/sst/treinamentos/${execucaoId}`)
}

export async function criarTreinamentoAction(_prev: Result, formData: FormData): Promise<Result> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const participanteIds = formData.getAll('participanteIds') as string[]

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    tipoId: formData.get('tipoId') as string,
    dataRealizacao: formData.get('dataRealizacao') as string,
    dataVencimento: (formData.get('dataVencimento') as string) || undefined,
    instrutor: (formData.get('instrutor') as string) || undefined,
    cargaHorariaRealizada: formData.get('cargaHorariaRealizada')
      ? Number(formData.get('cargaHorariaRealizada'))
      : undefined,
    local: (formData.get('local') as string) || undefined,
    observacoes: (formData.get('observacoes') as string) || undefined,
    participanteIds: participanteIds.length > 0 ? participanteIds : undefined,
  }

  try {
    await api.post('/sst/treinamentos', payload, token)
    revalidatePath('/sst/treinamentos')
    return { ok: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao registrar treinamento' }
  }
}
