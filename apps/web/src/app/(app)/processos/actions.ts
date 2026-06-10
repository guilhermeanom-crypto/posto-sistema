'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

// ── Criar processo ──────────────────────────────────────────────────────────

export async function criarProcessoAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    tipoProcessoId: formData.get('tipoProcessoId') as string,
    orgaoId: formData.get('orgaoId') as string,
    dataAbertura: formData.get('dataAbertura') || undefined,
    dataVencimento: formData.get('dataVencimento') || undefined,
    responsavelId: formData.get('responsavelId') || undefined,
    observacoes: formData.get('observacoes') || undefined,
  }

  try {
    const res = await api.post<{ data: { id: string } }>('/processos', payload, token)
    revalidatePath('/processos')
    redirect(`/processos/${res.data.id}`)
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

// ── Alterar status ──────────────────────────────────────────────────────────

export async function alterarStatusProcessoAction(
  processoId: string,
  status: string,
  motivo?: string,
): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.post(`/processos/${processoId}/status`, { status, motivo }, token)
    revalidatePath(`/processos/${processoId}`)
    revalidatePath('/processos')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro inesperado' }
  }
}

// ── Avançar fase ────────────────────────────────────────────────────────────

export async function avancarFaseAction(processoId: string): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.post(`/processos/${processoId}/avancar-fase`, {}, token)
    revalidatePath(`/processos/${processoId}`)
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro inesperado' }
  }
}
