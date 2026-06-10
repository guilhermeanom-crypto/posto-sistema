'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function criarAutoAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const valorMultaRaw = formData.get('valorMulta') as string
  const body = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    orgao: formData.get('orgao') as string,
    numeroAuto: formData.get('numeroAuto') as string,
    dataLavratura: formData.get('dataLavratura') as string,
    dataRecebimento: (formData.get('dataRecebimento') as string) || undefined,
    artigo: (formData.get('artigo') as string) || undefined,
    descricao: formData.get('descricao') as string,
    valorMulta: valorMultaRaw ? parseFloat(valorMultaRaw) : undefined,
    prazoDefesa: formData.get('prazoDefesa') as string,
    observacoes: (formData.get('observacoes') as string) || undefined,
  }

  try {
    await api.post('/fiscalizacoes', body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao criar auto de infração' }
  }
}

export async function atualizarStatusAutoAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const id = formData.get('id') as string
  const body = {
    status: formData.get('status') as string,
    observacoes: (formData.get('observacoes') as string) || undefined,
  }

  try {
    await api.patch(`/fiscalizacoes/${id}/status`, body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao atualizar status' }
  }
}

export async function criarRecursoAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const autoId = formData.get('autoId') as string
  const body = {
    instancia: formData.get('instancia') as string,
    dataProtocolo: formData.get('dataProtocolo') as string,
    prazoResposta: (formData.get('prazoResposta') as string) || undefined,
    numeroProtocolo: (formData.get('numeroProtocolo') as string) || undefined,
    observacoes: (formData.get('observacoes') as string) || undefined,
  }

  try {
    await api.post(`/fiscalizacoes/${autoId}/recursos`, body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao criar recurso' }
  }
}

export async function atualizarRecursoAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const autoId = formData.get('autoId') as string
  const recursoId = formData.get('recursoId') as string
  const body = {
    resultado: (formData.get('resultado') as string) || undefined,
    dataJulgamento: (formData.get('dataJulgamento') as string) || undefined,
    numeroProtocolo: (formData.get('numeroProtocolo') as string) || undefined,
    observacoes: (formData.get('observacoes') as string) || undefined,
  }

  try {
    await api.patch(`/fiscalizacoes/${autoId}/recursos/${recursoId}`, body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao atualizar recurso' }
  }
}
