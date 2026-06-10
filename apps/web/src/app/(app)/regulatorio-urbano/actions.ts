'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS — REGULATÓRIO URBANO
// ─────────────────────────────────────────────────────────────────────────────

export async function criarAlvaraAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    tipo: formData.get('tipo') as string,
    numero: formData.get('numero') as string || undefined,
    orgaoEmissor: formData.get('orgaoEmissor') as string,
    dataEmissao: formData.get('dataEmissao') as string || undefined,
    dataVencimento: formData.get('dataVencimento') as string || undefined,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post('/regulatorio-urbano', payload, token)
    revalidatePath('/regulatorio-urbano')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao criar alvará' }
  }
}

export async function atualizarStatusAlvaraAction(id: string, status: string) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.patch(`/regulatorio-urbano/${id}`, { status }, token)
    revalidatePath('/regulatorio-urbano')
    revalidatePath(`/regulatorio-urbano/${id}`)
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao atualizar status' }
  }
}
