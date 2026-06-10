'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function criarPGRSAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const body = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    versao: formData.get('versao') as string,
    responsavelTecnico: formData.get('responsavelTecnico') as string,
    artNumero: (formData.get('artNumero') as string) || undefined,
    dataAprovacao: formData.get('dataAprovacao') as string,
    dataVencimento: formData.get('dataVencimento') as string,
    observacoes: (formData.get('observacoes') as string) || undefined,
  }

  try {
    await api.post('/pgrs', body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao criar PGRS' }
  }
}

export async function criarExigenciaAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const pgrsId = formData.get('pgrsId') as string
  const body = {
    descricao: formData.get('descricao') as string,
    tipoResiduo: formData.get('tipoResiduo') as string,
    periodicidade: formData.get('periodicidade') as string,
    prazoComprovacaoDias: parseInt(formData.get('prazoComprovacaoDias') as string, 10),
  }

  try {
    await api.post(`/pgrs/${pgrsId}/exigencias`, body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao criar exigência' }
  }
}

export async function vincularEvidenciaAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const pgrsId = formData.get('pgrsId') as string
  const exigenciaId = formData.get('exigenciaId') as string
  const body = {
    documentoId: formData.get('documentoId') as string,
    periodoRef: formData.get('periodoRef') as string,
  }

  try {
    await api.post(`/pgrs/${pgrsId}/exigencias/${exigenciaId}/evidencias`, body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao vincular evidência' }
  }
}
