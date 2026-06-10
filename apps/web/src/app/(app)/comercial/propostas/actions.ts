'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken, getSessao } from '@/lib/auth'
import { api, ApiError, type SingleResponse, type PaginatedResponse } from '@/lib/api'
import type {
  AtualizarPropostaComercialPayload,
  PropostaComercialResumo,
  PropostaComercialDetalhe,
} from './shared'

export type StatusHandoffComercial =
  | 'AGUARDANDO_HANDOFF'
  | 'EM_TRIAGEM_OPERACIONAL'
  | 'AGUARDANDO_DOCUMENTOS'
  | 'EM_PLANEJAMENTO'
  | 'EM_EXECUCAO'
  | 'PAUSADO'
  | 'CANCELADO'
  | 'CONCLUIDO'

export interface HandoffComercialCriadoView {
  id: string
  status: StatusHandoffComercial
  propostaComercialId: string
}

export type IniciarHandoffOperacionalResult =
  | { ok: true; handoff: HandoffComercialCriadoView }
  | {
      ok: false
      reason: 'nao_autenticado' | 'sem_permissao' | 'proposta_nao_aprovada' | 'handoff_existente' | 'erro_generico'
      message: string
    }

export async function criarPropostaComercial(payload: any) {
  const token = await getAccessToken()
  if (!token) throw new Error('Não autenticado')

  try {
    const res = await api.post<SingleResponse<PropostaComercialDetalhe>>(
      '/comercial/propostas',
      payload,
      token,
    )
    revalidatePath('/comercial/propostas')
    return res.data
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message || 'Erro ao criar proposta')
    }
    throw error
  }
}

export async function listarPropostasComerciais(params: {
  page?: number
  limit?: number
  status?: string
  busca?: string
}) {
  const token = await getAccessToken()
  if (!token) return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }

  try {
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))
    if (params.status) query.set('status', params.status)
    if (params.busca) query.set('busca', params.busca)

    const res = await api.get<PaginatedResponse<PropostaComercialResumo>>(
      `/comercial/propostas?${query.toString()}`,
      token,
    )
    return res
  } catch (error) {
    console.error('Erro ao listar propostas:', error)
    return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }
  }
}

export async function buscarPropostaComercial(id: string) {
  const token = await getAccessToken()
  if (!token) throw new Error('Não autenticado')

  try {
    const res = await api.get<SingleResponse<PropostaComercialDetalhe>>(
      `/comercial/propostas/${id}`,
      token,
    )
    return res.data
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return null
      throw new Error(error.message || 'Erro ao buscar proposta')
    }
    throw error
  }
}

export async function atualizarPropostaComercial(
  id: string,
  payload: AtualizarPropostaComercialPayload,
) {
  const token = await getAccessToken()
  if (!token) throw new Error('Não autenticado')

  try {
    const res = await api.patch<SingleResponse<PropostaComercialDetalhe>>(
      `/comercial/propostas/${id}`,
      payload,
      token,
    )
    revalidatePath('/comercial/propostas')
    revalidatePath(`/comercial/propostas/${id}`)
    return res.data
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message || 'Erro ao atualizar proposta')
    }
    throw error
  }
}

export async function podeIniciarHandoffOperacional() {
  const sessao = await getSessao()
  if (!sessao) return false

  return ['EXECUTIVO', 'COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'].includes(sessao.perfil)
}

export async function iniciarHandoffOperacional(
  propostaId: string,
): Promise<IniciarHandoffOperacionalResult> {
  const token = await getAccessToken()
  if (!token) {
    return {
      ok: false,
      reason: 'nao_autenticado',
      message: 'Sua sessão expirou. Faça login novamente para iniciar o handoff operacional.',
    }
  }

  try {
    const res = await api.post<SingleResponse<HandoffComercialCriadoView>>(
      `/comercial/propostas/${propostaId}/handoff`,
      {},
      token,
    )

    revalidatePath('/comercial/propostas')
    revalidatePath(`/comercial/propostas/${propostaId}`)

    return {
      ok: true,
      handoff: res.data,
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return {
          ok: false,
          reason: 'sem_permissao',
          message: 'Seu perfil não possui permissão para iniciar o handoff operacional.',
        }
      }

      if (error.status === 409 && error.code === 'PROPOSTA_NAO_APROVADA') {
        return {
          ok: false,
          reason: 'proposta_nao_aprovada',
          message: 'O handoff operacional só pode ser iniciado após a aprovação da proposta.',
        }
      }

      if (error.status === 409 && error.code === 'HANDOFF_ATIVO_EXISTENTE') {
        return {
          ok: false,
          reason: 'handoff_existente',
          message: 'Esta proposta já possui handoff operacional em andamento.',
        }
      }

      return {
        ok: false,
        reason: 'erro_generico',
        message: error.message || 'Não foi possível iniciar o handoff operacional no momento.',
      }
    }

    return {
      ok: false,
      reason: 'erro_generico',
      message: 'Não foi possível iniciar o handoff operacional no momento.',
    }
  }
}
