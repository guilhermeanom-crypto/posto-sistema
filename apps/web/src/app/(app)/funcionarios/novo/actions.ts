'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function criarFuncionarioAction(_: unknown, formData: FormData) {
  const token = await getAccessToken()
  if (!token) return { error: 'Não autenticado' }

  const body = {
    empreendimentoId: formData.get('empreendimentoId') as string,
    nome: formData.get('nome') as string,
    cpf: (formData.get('cpf') as string) || undefined,
    cargo: formData.get('cargo') as string,
    setor: (formData.get('setor') as string) || undefined,
    vinculo: formData.get('vinculo') as string,
    dataAdmissao: formData.get('dataAdmissao') as string,
    email: (formData.get('email') as string) || undefined,
    telefone: (formData.get('telefone') as string) || undefined,
  }

  try {
    await api.post('/sst/funcionarios', body, token)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao cadastrar funcionário' }
  }
}
