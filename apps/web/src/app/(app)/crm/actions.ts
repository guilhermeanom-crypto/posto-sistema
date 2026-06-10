'use server'

import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export type EstagioCRM = 'NOVO' | 'CONTATADO' | 'PROPOSTA_ENVIADA' | 'NEGOCIACAO' | 'GANHO' | 'PERDIDO'
export type TipoFollowUp = 'LIGACAO' | 'EMAIL' | 'WHATSAPP' | 'VISITA' | 'REUNIAO' | 'OUTROS'

export async function moverEstagioAction(leadId: string, estagio: EstagioCRM) {
  const token = await getAccessToken()
  if (!token) throw new Error('Não autenticado')
  await api.patch(`/crm/leads/${leadId}`, { estagio }, token)
}

export async function atualizarLeadAction(
  leadId: string,
  data: {
    nome?: string
    empresa?: string
    valorEstimado?: number | null
    dataProximoContato?: string | null
    notas?: string
  },
) {
  const token = await getAccessToken()
  if (!token) throw new Error('Não autenticado')
  await api.patch(`/crm/leads/${leadId}`, data, token)
}

export async function registrarFollowUpAction(
  leadId: string,
  tipo: TipoFollowUp,
  notas?: string,
) {
  const token = await getAccessToken()
  if (!token) throw new Error('Não autenticado')
  await api.post(`/crm/leads/${leadId}/followups`, { tipo, notas }, token)
}
