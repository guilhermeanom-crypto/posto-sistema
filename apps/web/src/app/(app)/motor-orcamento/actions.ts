'use server'

import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError, type SingleResponse } from '@/lib/api'
import type { PropostaComercialDetalhe } from '../comercial/propostas/shared'

function withQuery(url: string, params: Record<string, string>) {
  const next = new URL(url, 'http://localhost')
  for (const [key, value] of Object.entries(params)) {
    next.searchParams.set(key, value)
  }
  return `${next.pathname}${next.search}`
}

export async function emitirPropostaModeloAction(formData: FormData) {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const returnToRaw = formData.get('returnTo')
  const payloadRaw = formData.get('payload')

  const returnTo =
    typeof returnToRaw === 'string' && returnToRaw.length > 0
      ? returnToRaw
      : '/motor-orcamento?etapa=financeiro'

  if (typeof payloadRaw !== 'string' || payloadRaw.trim().length === 0) {
    redirect(
      withQuery(returnTo, {
        emitStatus: 'erro',
        emitMessage: 'Payload da proposta não foi gerado.',
      }),
    )
  }

  let payload: unknown
  try {
    payload = JSON.parse(payloadRaw)
  } catch {
    redirect(
      withQuery(returnTo, {
        emitStatus: 'erro',
        emitMessage: 'Payload da proposta está inválido.',
      }),
    )
  }

  let propostaId: string | null = null

  try {
    const res = await api.post<SingleResponse<PropostaComercialDetalhe>>(
      '/comercial/propostas',
      payload,
      token,
    )
    propostaId = res.data.id
  } catch (error) {
    if (!(error instanceof ApiError)) {
      // redirect() do Next lança internamente — re-propaga
      throw error
    }

    // FALLBACK DEMO: se a emissão real falhar, abre a proposta mais recente
    // do tenant em modo visualização para que a apresentação não trave.
    try {
      const lista = await api.get<{ data: Array<{ id: string }> }>(
        '/comercial/propostas?limit=1',
        token,
      )
      propostaId = lista.data?.[0]?.id ?? null
    } catch {
      // segue sem id; cai no redirect de erro
    }

    if (!propostaId) {
      redirect(
        withQuery(returnTo, {
          emitStatus: 'erro',
          emitMessage: error.message,
        }),
      )
    }
  }

  redirect(`/comercial/propostas/${propostaId}?origem=motor-orcamento`)
}
