'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function cadastrarContatoAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const numero = (formData.get('numero') as string).replace(/\D/g, '')
  const nome = (formData.get('nome') as string) || undefined
  const empreendimentoId = (formData.get('empreendimentoId') as string) || undefined

  if (!/^\d{10,15}$/.test(numero)) return { error: 'Número inválido. Use apenas dígitos com DDI (ex: 5511999999999)' }

  try {
    await api.post('/whatsapp/contatos', { numero, nome, empreendimentoId }, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao cadastrar contato' }
  }
}

export async function removerContatoAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const id = formData.get('id') as string
  try {
    await api.delete(`/whatsapp/contatos/${id}`, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao remover contato' }
  }
}

export async function atualizarLeadAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const id = formData.get('id') as string
  const status = formData.get('status') as string | null
  const notas = formData.get('notas') as string | null

  const body: Record<string, unknown> = {}
  if (status) body.status = status
  if (notas !== null) body.notas = notas

  try {
    await api.patch(`/whatsapp/leads/${id}`, body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao atualizar lead' }
  }
}

export async function enviarMensagemLeadAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const leadId = formData.get('leadId') as string
  const mensagem = formData.get('mensagem') as string

  try {
    await api.post(`/whatsapp/leads/${leadId}/mensagem`, { mensagem }, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao enviar mensagem' }
  }
}
