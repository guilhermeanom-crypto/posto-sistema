'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function criarASOAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    funcionarioNome: formData.get('funcionarioNome') as string,
    funcionarioCPF: formData.get('funcionarioCPF') as string || undefined,
    cargo: formData.get('cargo') as string || undefined,
    tipo: formData.get('tipo') as string,
    dataExame: formData.get('dataExame') as string,
    dataVencimento: formData.get('dataVencimento') as string || undefined,
    aptidao: formData.get('aptidao') as string,
    medicoResponsavel: formData.get('medicoResponsavel') as string || undefined,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post('/sst/asos', payload, token)
    revalidatePath('/sst')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao criar ASO' }
  }
}

export async function editarASOAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const id = formData.get('id') as string
  const payload: Record<string, unknown> = {}
  const fields = ['funcionarioNome', 'cargo', 'tipo', 'dataExame', 'dataVencimento', 'aptidao', 'medicoResponsavel', 'observacoes']
  for (const f of fields) {
    const val = formData.get(f) as string
    if (val) payload[f] = val
  }

  try {
    await api.patch(`/sst/asos/${id}`, payload, token)
    revalidatePath('/sst')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as { message?: string }).message ?? 'Erro ao atualizar ASO' }
  }
}

export async function editarDocSSTAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const id = formData.get('id') as string
  const payload: Record<string, unknown> = {}
  const fields = ['tipo', 'responsavel', 'dataElaboracao', 'dataVencimento', 'status', 'observacoes']
  for (const f of fields) {
    const val = formData.get(f) as string
    if (val) payload[f] = val
  }

  try {
    await api.patch(`/sst/documentos/${id}`, payload, token)
    revalidatePath('/sst')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as { message?: string }).message ?? 'Erro ao atualizar documento SST' }
  }
}

export async function criarDocumentoSSTAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    tipo: formData.get('tipo') as string,
    responsavel: formData.get('responsavel') as string || undefined,
    dataElaboracao: formData.get('dataElaboracao') as string || undefined,
    dataVencimento: formData.get('dataVencimento') as string || undefined,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post('/sst/documentos', payload, token)
    revalidatePath('/sst')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao criar documento SST' }
  }
}
