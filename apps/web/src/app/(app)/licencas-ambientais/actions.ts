'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS — LICENÇAS AMBIENTAIS
// ─────────────────────────────────────────────────────────────────────────────

export async function criarLicencaAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    tipo: formData.get('tipo') as string,
    numero: formData.get('numero') as string,
    orgaoEmissor: formData.get('orgaoEmissor') as string,
    responsavelTecnico: formData.get('responsavelTecnico') as string || undefined,
    dataEmissao: formData.get('dataEmissao') as string,
    dataVencimento: formData.get('dataVencimento') as string,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post('/licencas-ambientais', payload, token)
    revalidatePath('/licencas-ambientais')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao criar licença' }
  }
}

export async function atualizarStatusLicencaAction(id: string, status: string) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.patch(`/licencas-ambientais/${id}`, { status }, token)
    revalidatePath('/licencas-ambientais')
    revalidatePath(`/licencas-ambientais/${id}`)
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao atualizar status' }
  }
}

export async function criarCondicaoAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const licencaId = formData.get('licencaId') as string

  const payload = {
    numero: formData.get('numero') as string || undefined,
    descricao: formData.get('descricao') as string,
    prazo: formData.get('prazo') as string || undefined,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post(`/licencas-ambientais/${licencaId}/condicoes`, payload, token)
    revalidatePath(`/licencas-ambientais/${licencaId}`)
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao criar condição' }
  }
}

export async function atualizarCondicaoStatusAction(
  licencaId: string,
  condicaoId: string,
  status: string,
) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.patch(`/licencas-ambientais/${licencaId}/condicoes/${condicaoId}`, { status }, token)
    revalidatePath(`/licencas-ambientais/${licencaId}`)
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao atualizar condição' }
  }
}
