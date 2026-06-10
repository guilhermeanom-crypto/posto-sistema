'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { redirect } from 'next/navigation'

export async function iniciarChecklistAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const templateId = formData.get('templateId') as string
  const empreendimentoId = formData.get('empreendimentoId') as string

  if (!templateId || !empreendimentoId) {
    return { error: 'Selecione um empreendimento' }
  }

  try {
    const res = await api.post<{ data: { id: string } }>('/checklists/execucoes', { templateId, empreendimentoId }, token)
    redirect(`/checklists/${res.data.id}`)
  } catch (e: any) {
    return { error: e?.message ?? 'Erro ao iniciar checklist' }
  }
}
