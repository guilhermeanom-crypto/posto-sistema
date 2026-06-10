'use server'

import { z } from 'zod'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError, type SingleResponse } from '@/lib/api'
import type { PropostaCriada, TriagemActionState, TriagemPayload } from './shared'

const triagemSchema = z.object({
  cnaes: z.array(z.string()).min(1),
  uf: z.string().length(2),
  municipio: z.string().optional(),
  porte: z.enum(['MICRO', 'PEQUENO', 'MEDIO', 'GRANDE', 'MUITO_GRANDE']),
  situacao: z.enum(['PLANEJADO', 'IMPLANTACAO', 'OPERACAO', 'IRREGULAR', 'RENOVACAO']),
  temLicencaAnterior: z.boolean().optional(),
  temOutorgaAnterior: z.boolean().optional(),
})

function parseBoolean(value: FormDataEntryValue | null) {
  return value === 'true'
}

function buildTriagemPayload(formData: FormData): TriagemPayload {
  return {
    cnaes: String(formData.get('cnaePrincipal') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    uf: String(formData.get('uf') ?? '').toUpperCase(),
    municipio: String(formData.get('municipio') ?? '').trim() || undefined,
    porte: String(formData.get('porte') ?? '') as TriagemPayload['porte'],
    situacao: String(formData.get('situacao') ?? '') as TriagemPayload['situacao'],
    temLicencaAnterior: parseBoolean(formData.get('temLicencaAnterior')),
    temOutorgaAnterior: parseBoolean(formData.get('temOutorgaAnterior')),
  }
}

export async function executarTriagemAction(
  _prevState: TriagemActionState | null,
  formData: FormData,
): Promise<TriagemActionState> {
  const token = await getAccessToken()
  if (!token) {
    return { error: 'Sua sessão expirou. Faça login novamente para continuar.' }
  }

  const payload = buildTriagemPayload(formData)
  const contextoExtra = {
    licencaVencida: parseBoolean(formData.get('licencaVencida')),
    possuiPgrs: parseBoolean(formData.get('possuiPgrs')),
    possuiAutoInfracao: parseBoolean(formData.get('possuiAutoInfracao')),
  }

  const parsed = triagemSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      error: 'Revise os dados obrigatórios da triagem antes de consultar o diagnóstico.',
      payload,
      contextoExtra,
    }
  }

  try {
    const response = await api.post<SingleResponse<TriagemActionState['resultado']>>(
      '/comercial/diagnostico/cnae',
      parsed.data,
      token,
    )

    const resultado = response.data
    if (!resultado) {
      return {
        error: 'A API retornou uma resposta vazia para esta triagem.',
        payload: parsed.data,
        contextoExtra,
      }
    }

    const limitedCoverage = resultado.cnaePrincipal.descricao.toLowerCase().includes('não mapeada')

    return {
      payload: parsed.data,
      contextoExtra,
      resultado,
      limitedCoverage,
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        error: error.message || 'Não foi possível executar a triagem comercial no momento.',
        payload: parsed.data,
        contextoExtra,
      }
    }

    return {
      error: 'Não foi possível executar a triagem comercial no momento.',
      payload: parsed.data,
      contextoExtra,
    }
  }
}

export async function gerarPropostaAction(
  _prevState: TriagemActionState | null,
  formData: FormData,
): Promise<Pick<TriagemActionState, 'proposta' | 'propostaError'>> {
  const token = await getAccessToken()
  if (!token) {
    return { propostaError: 'Sua sessão expirou. Faça login novamente para continuar.' }
  }

  const payload = buildTriagemPayload(formData)
  const parsed = triagemSchema.safeParse(payload)
  if (!parsed.success) {
    return { propostaError: 'Revise os dados obrigatórios da triagem antes de gerar a proposta.' }
  }

  try {
    const response = await api.post<SingleResponse<PropostaCriada>>(
      '/comercial/propostas',
      { diagnostico: parsed.data },
      token,
    )

    const proposta = response.data
    if (!proposta) {
      return { propostaError: 'A API retornou uma resposta inválida ao gerar a proposta.' }
    }

    return { proposta }
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        propostaError: error.message || 'Não foi possível gerar a proposta no momento.',
      }
    }

    return {
      propostaError: 'Não foi possível gerar a proposta no momento.',
    }
  }
}
