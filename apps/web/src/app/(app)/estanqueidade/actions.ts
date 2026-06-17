'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function criarTanqueAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const payload = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    numero: Number(formData.get('numero')),
    capacidadeLitros: Number(formData.get('capacidadeLitros')),
    combustivel: formData.get('combustivel') as string,
    materialTanque: (formData.get('materialTanque') as string) || undefined,
    dataInstalacao: formData.get('dataInstalacao') as string || undefined,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post('/estanqueidade/tanques', payload, token)
    revalidatePath('/estanqueidade')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao cadastrar tanque' }
  }
}

export async function criarTesteAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const tanqueId = formData.get('tanqueId') as string
  const payload = {
    empresa: formData.get('empresa') as string,
    responsavel: formData.get('responsavel') as string || undefined,
    dataExecucao: formData.get('dataExecucao') as string,
    resultado: formData.get('resultado') as string,
    metodo: formData.get('metodo') as string || undefined,
    proximoTeste: formData.get('proximoTeste') as string,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  try {
    await api.post(`/estanqueidade/tanques/${tanqueId}/testes`, payload, token)
    revalidatePath('/estanqueidade')
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { error: e.message ?? 'Erro ao registrar teste' }
  }
}
