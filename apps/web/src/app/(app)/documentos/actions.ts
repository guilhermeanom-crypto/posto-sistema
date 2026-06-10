'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function aprovarVersaoAction(
  documentoId: string,
  versaoId: string,
): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }
  try {
    await api.post(`/documentos/${documentoId}/versoes/${versaoId}/aprovar`, {}, token)
    revalidatePath(`/documentos/${documentoId}`)
    revalidatePath('/documentos')
    revalidatePath('/dashboard')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao aprovar' }
  }
}

export async function reprovarVersaoAction(
  documentoId: string,
  versaoId: string,
  motivoRejeicao: string,
): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }
  try {
    await api.post(`/documentos/${documentoId}/versoes/${versaoId}/reprovar`, { motivoRejeicao }, token)
    revalidatePath(`/documentos/${documentoId}`)
    revalidatePath('/documentos')
    revalidatePath('/dashboard')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao reprovar' }
  }
}

export async function solicitarUploadAction(
  documentoId: string,
  nomeArquivo: string,
  tamanhoBytes: number,
  mimeType: string,
): Promise<{ data?: { versaoId: string; uploadUrl: string; chaveS3: string }; error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    const res = await api.post<{ data: { versaoId: string; uploadUrl: string; chaveS3: string } }>(
      `/documentos/${documentoId}/upload/solicitar`,
      { nomeArquivo, tamanhoBytes, mimeType },
      token,
    )
    return { data: res.data }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao solicitar upload' }
  }
}

export async function confirmarUploadAction(
  documentoId: string,
  versaoId: string,
  chaveS3: string,
): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.post(`/documentos/${documentoId}/upload/confirmar`, { versaoId, chaveS3 }, token)
    revalidatePath(`/documentos/${documentoId}`)
    revalidatePath('/documentos')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro ao confirmar upload' }
  }
}
