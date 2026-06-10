'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

export async function criarTenantAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const limiteRaw = formData.get('limiteEmpreendimentos')

  const payload = {
    nome: formData.get('nome') as string,
    slug: formData.get('slug') as string,
    plano: formData.get('plano') as string,
    limiteEmpreendimentos: limiteRaw ? Number(limiteRaw) : 100,
    adminNome: formData.get('adminNome') as string,
    adminEmail: formData.get('adminEmail') as string,
  }

  try {
    await api.post('/tenants', payload, token)
    revalidatePath('/tenants')
    redirect('/tenants')
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
