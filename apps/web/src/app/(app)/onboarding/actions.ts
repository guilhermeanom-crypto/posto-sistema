'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function avancarEtapaAction(etapa: number, concluido = false) {
  const token = await getAccessToken()
  if (!token) throw new Error('Não autenticado')
  await api.patch('/onboarding/progresso', { etapa, concluido }, token)
}

export interface EmpresaImport {
  nome: string
  nomeFantasia?: string
  cnpj?: string
  bandeira?: string
  tipo?: 'revendedor' | 'distribuidor' | 'transportador' | 'outros'
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export async function importarEmpreendimentosAction(
  empresaId: string,
  empreendimentos: EmpresaImport[],
) {
  const token = await getAccessToken()
  if (!token) throw new Error('Não autenticado')
  return api.post<{ data: { criados: number; erros: { linha: number; erro: string }[]; mensagem: string } }>(
    '/onboarding/importar-empreendimentos',
    { empresaId, empreendimentos },
    token,
  )
}
