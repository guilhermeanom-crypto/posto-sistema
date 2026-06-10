'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function criarUsuarioAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const perfil = formData.get('perfil') as string
  const empreendimentoId = formData.get('empreendimentoId') as string | null

  const payload: Record<string, unknown> = {
    nome: formData.get('nome') as string,
    email: formData.get('email') as string,
    senha: formData.get('senha') as string,
    perfil,
    telefone: formData.get('telefone') || undefined,
  }

  // REPRESENTANTE_POSTO requer vínculo com um empreendimento
  if (perfil === 'REPRESENTANTE_POSTO') {
    if (!empreendimentoId) return { error: 'Selecione o empreendimento do representante.' }
    payload.empreendimentoIds = [empreendimentoId]
  }

  try {
    await api.post('/usuarios', payload, token)
    revalidatePath('/usuarios')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function alterarPerfilUsuarioAction(
  usuarioId: string,
  perfil: string,
): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.patch(`/usuarios/${usuarioId}/perfil`, { perfil }, token)
    revalidatePath('/usuarios')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro inesperado' }
  }
}
