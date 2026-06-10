'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function criarTipoAction(_prev: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const cargos = formData.getAll('obrigatorioParaCargos') as string[]

  const body = {
    nome: formData.get('nome') as string,
    normativa: formData.get('normativa') as string,
    cargaHoraria: parseInt(formData.get('cargaHoraria') as string, 10),
    periodicidadeMeses: parseInt(formData.get('periodicidadeMeses') as string, 10),
    obrigatorioParaCargos: cargos,
    conteudoProgramatico: ((formData.get('conteudo') as string) || '').split('\n').map((s) => s.trim()).filter(Boolean),
  }

  try {
    await api.post('/sst/treinamentos/tipos', body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao criar tipo' }
  }
}
