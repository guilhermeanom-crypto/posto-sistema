'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function enviarMensagemAction(texto: string) {
  const token = await getAccessToken()
  if (!token) throw new Error('Não autenticado')
  await api.post('/portal/mensagens', { texto }, token)
}
