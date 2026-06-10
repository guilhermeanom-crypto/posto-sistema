'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function atualizarTenantAction(
  tenantId: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const payload: Record<string, unknown> = {}

  const nome = formData.get('nome')
  const plano = formData.get('plano')
  const limite = formData.get('limiteEmpreendimentos')
  const status = formData.get('status')

  if (nome) payload.nome = nome
  if (plano) payload.plano = plano
  if (limite) payload.limiteEmpreendimentos = Number(limite)
  if (status) payload.status = status

  try {
    await api.patch(`/tenants/${tenantId}`, payload, token)
    revalidatePath(`/tenants/${tenantId}`)
    revalidatePath('/tenants')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function desativarTenantAction(tenantId: string): Promise<{ error?: string }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  try {
    await api.delete(`/tenants/${tenantId}`, token)
    revalidatePath('/tenants')
    redirect('/tenants')
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Erro inesperado' }
  }
}
