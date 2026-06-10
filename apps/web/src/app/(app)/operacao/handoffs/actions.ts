'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken, getSessao } from '@/lib/auth'
import { api, ApiError, type PaginatedResponse, type SingleResponse } from '@/lib/api'
import type {
  AtualizarHandoffOperacionalPayload,
  HandoffComercialDetalhe,
  HandoffComercialResumo,
  ListarHandoffsOperacionaisParams,
} from './shared'

const PERFIS_LEITURA_HANDOFF = [
  'EXECUTIVO',
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

const PERFIS_ATUALIZACAO_HANDOFF = [
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

const PERFIS_SENSIVEIS_HANDOFF = [
  'COORDENADOR',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

type Paginacao = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ListarHandoffsOperacionaisResult =
  | {
      ok: true
      data: HandoffComercialResumo[]
      pagination: Paginacao
    }
  | {
      ok: false
      reason: 'nao_autenticado' | 'sem_permissao' | 'erro_generico'
      message: string
      data: HandoffComercialResumo[]
      pagination: Paginacao
    }

export type BuscarHandoffOperacionalResult =
  | {
      ok: true
      data: HandoffComercialDetalhe
    }
  | {
      ok: false
      reason: 'nao_autenticado' | 'sem_permissao' | 'nao_encontrado' | 'erro_generico'
      message: string
    }

export type AtualizarHandoffOperacionalResult =
  | {
      ok: true
      data: HandoffComercialDetalhe
    }
  | {
      ok: false
      reason:
        | 'nao_autenticado'
        | 'sem_permissao'
        | 'nao_encontrado'
        | 'transicao_invalida'
        | 'erro_generico'
      message: string
    }

function emptyPagination(page = 1, limit = 20): Paginacao {
  return {
    page,
    limit,
    total: 0,
    totalPages: 0,
  }
}

export async function podeLerHandoffsOperacionais() {
  const sessao = await getSessao()
  if (!sessao) return false

  return PERFIS_LEITURA_HANDOFF.includes(sessao.perfil as (typeof PERFIS_LEITURA_HANDOFF)[number])
}

export async function consultarPermissoesAtualizacaoHandoffOperacional() {
  const sessao = await getSessao()

  if (!sessao) {
    return {
      canUpdate: false,
      canManageSensitive: false,
      perfil: null,
    }
  }

  const perfil = sessao.perfil

  return {
    canUpdate: PERFIS_ATUALIZACAO_HANDOFF.includes(perfil as (typeof PERFIS_ATUALIZACAO_HANDOFF)[number]),
    canManageSensitive: PERFIS_SENSIVEIS_HANDOFF.includes(perfil as (typeof PERFIS_SENSIVEIS_HANDOFF)[number]),
    perfil,
  }
}

export async function listarHandoffsOperacionais(
  params: ListarHandoffsOperacionaisParams,
): Promise<ListarHandoffsOperacionaisResult> {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const token = await getAccessToken()

  if (!token) {
    return {
      ok: false,
      reason: 'nao_autenticado',
      message: 'Sua sessão expirou. Faça login novamente para consultar os handoffs operacionais.',
      data: [],
      pagination: emptyPagination(page, limit),
    }
  }

  const sessao = await getSessao()
  if (!sessao) {
    return {
      ok: false,
      reason: 'nao_autenticado',
      message: 'Sua sessão expirou. Faça login novamente para consultar os handoffs operacionais.',
      data: [],
      pagination: emptyPagination(page, limit),
    }
  }

  if (!PERFIS_LEITURA_HANDOFF.includes(sessao.perfil as (typeof PERFIS_LEITURA_HANDOFF)[number])) {
    return {
      ok: false,
      reason: 'sem_permissao',
      message: 'Seu perfil não possui permissão para consultar handoffs operacionais.',
      data: [],
      pagination: emptyPagination(page, limit),
    }
  }

  try {
    const query = new URLSearchParams()

    query.set('page', String(page))
    query.set('limit', String(limit))

    if (params.status) query.set('status', params.status)
    if (params.propostaComercialId) query.set('propostaComercialId', params.propostaComercialId)
    if (params.empreendimentoId) query.set('empreendimentoId', params.empreendimentoId)
    if (params.responsavelComercialId) query.set('responsavelComercialId', params.responsavelComercialId)
    if (params.responsavelOperacionalId) query.set('responsavelOperacionalId', params.responsavelOperacionalId)

    const res = await api.get<PaginatedResponse<HandoffComercialResumo>>(
      `/operacao/handoffs?${query.toString()}`,
      token,
    )

    return {
      ok: true,
      data: res.data,
      pagination: res.pagination,
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return {
          ok: false,
          reason: 'nao_autenticado',
          message: 'Sua sessão expirou. Faça login novamente para consultar os handoffs operacionais.',
          data: [],
          pagination: emptyPagination(page, limit),
        }
      }

      if (error.status === 403) {
        return {
          ok: false,
          reason: 'sem_permissao',
          message: 'Seu perfil não possui permissão para consultar handoffs operacionais.',
          data: [],
          pagination: emptyPagination(page, limit),
        }
      }
    }

    return {
      ok: false,
      reason: 'erro_generico',
      message: 'Não foi possível carregar os handoffs operacionais no momento.',
      data: [],
      pagination: emptyPagination(page, limit),
    }
  }
}

export async function buscarHandoffOperacionalPorId(
  id: string,
): Promise<BuscarHandoffOperacionalResult> {
  const token = await getAccessToken()

  if (!token) {
    return {
      ok: false,
      reason: 'nao_autenticado',
      message: 'Sua sessão expirou. Faça login novamente para consultar o handoff operacional.',
    }
  }

  const sessao = await getSessao()
  if (!sessao) {
    return {
      ok: false,
      reason: 'nao_autenticado',
      message: 'Sua sessão expirou. Faça login novamente para consultar o handoff operacional.',
    }
  }

  if (!PERFIS_LEITURA_HANDOFF.includes(sessao.perfil as (typeof PERFIS_LEITURA_HANDOFF)[number])) {
    return {
      ok: false,
      reason: 'sem_permissao',
      message: 'Seu perfil não possui permissão para consultar este handoff operacional.',
    }
  }

  try {
    const res = await api.get<SingleResponse<HandoffComercialDetalhe>>(
      `/operacao/handoffs/${id}`,
      token,
    )

    return {
      ok: true,
      data: res.data,
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return {
          ok: false,
          reason: 'nao_autenticado',
          message: 'Sua sessão expirou. Faça login novamente para consultar o handoff operacional.',
        }
      }

      if (error.status === 403) {
        return {
          ok: false,
          reason: 'sem_permissao',
          message: 'Seu perfil não possui permissão para consultar este handoff operacional.',
        }
      }

      if (error.status === 404) {
        return {
          ok: false,
          reason: 'nao_encontrado',
          message: 'Handoff operacional não encontrado.',
        }
      }
    }

    return {
      ok: false,
      reason: 'erro_generico',
      message: 'Não foi possível carregar o handoff operacional no momento.',
    }
  }
}

export async function atualizarHandoffOperacional(
  id: string,
  payload: AtualizarHandoffOperacionalPayload,
): Promise<AtualizarHandoffOperacionalResult> {
  const token = await getAccessToken()

  if (!token) {
    return {
      ok: false,
      reason: 'nao_autenticado',
      message: 'Sua sessão expirou. Faça login novamente para atualizar o handoff operacional.',
    }
  }

  const sessao = await getSessao()
  if (!sessao) {
    return {
      ok: false,
      reason: 'nao_autenticado',
      message: 'Sua sessão expirou. Faça login novamente para atualizar o handoff operacional.',
    }
  }

  if (!PERFIS_ATUALIZACAO_HANDOFF.includes(sessao.perfil as (typeof PERFIS_ATUALIZACAO_HANDOFF)[number])) {
    return {
      ok: false,
      reason: 'sem_permissao',
      message: 'Seu perfil não possui permissão para atualizar este handoff operacional.',
    }
  }

  try {
    const res = await api.patch<SingleResponse<HandoffComercialDetalhe>>(
      `/operacao/handoffs/${id}`,
      payload,
      token,
    )

    revalidatePath('/operacao/handoffs')
    revalidatePath(`/operacao/handoffs/${id}`)

    return {
      ok: true,
      data: res.data,
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return {
          ok: false,
          reason: 'nao_autenticado',
          message: 'Sua sessão expirou. Faça login novamente para atualizar o handoff operacional.',
        }
      }

      if (error.status === 403) {
        return {
          ok: false,
          reason: 'sem_permissao',
          message: error.message || 'Seu perfil não possui permissão para atualizar este handoff operacional.',
        }
      }

      if (error.status === 404) {
        return {
          ok: false,
          reason: 'nao_encontrado',
          message: 'Handoff operacional ou responsável informado não foi encontrado neste tenant.',
        }
      }

      if (error.status === 409 && error.code === 'HANDOFF_STATUS_TRANSICAO_INVALIDA') {
        return {
          ok: false,
          reason: 'transicao_invalida',
          message: error.message || 'A transição de status informada não é permitida para este handoff.',
        }
      }

      return {
        ok: false,
        reason: 'erro_generico',
        message: error.message || 'Não foi possível atualizar o handoff operacional no momento.',
      }
    }

    return {
      ok: false,
      reason: 'erro_generico',
      message: 'Não foi possível atualizar o handoff operacional no momento.',
    }
  }
}
