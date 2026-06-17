'use server'

import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'
import { revalidatePath } from 'next/cache'

function optionalTrim(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : undefined
}
function optionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').replace(',', '.').trim()
  if (raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}
// Checkbox marcado => true; desmarcado => false (na EDIÇÃO o usuário decide explicitamente)
function checkbox(value: FormDataEntryValue | null) {
  return value != null
}

export async function atualizarCaracterizacaoAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean } | null> {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const id = String(formData.get('empreendimentoId') ?? '').trim()
  if (!id) return { error: 'Empreendimento inválido.' }

  const payload = {
    cnaePrincipal: optionalTrim(formData.get('cnaePrincipal')),
    porte: optionalTrim(formData.get('porte')),
    situacaoEmpreendimento: optionalTrim(formData.get('situacaoEmpreendimento')),
    areaM2: optionalNumber(formData.get('areaM2')),
    possuiCaptacao: checkbox(formData.get('possuiCaptacao')),
    tipoCaptacao: optionalTrim(formData.get('tipoCaptacao')),
    possuiSAO: checkbox(formData.get('possuiSAO')),
    classeAquifero: optionalTrim(formData.get('classeAquifero')),
    profundidadeNivelAguaM: optionalNumber(formData.get('profundidadeNivelAguaM')),
    tipoSolo: optionalTrim(formData.get('tipoSolo')),
    distanciaPocoAbastecimentoM: optionalNumber(formData.get('distanciaPocoAbastecimentoM')),
    distanciaCorpoHidricoM: optionalNumber(formData.get('distanciaCorpoHidricoM')),
    emAPP: checkbox(formData.get('emAPP')),
    captaParaConsumo: checkbox(formData.get('captaParaConsumo')),
    classificacaoAreaContaminada: optionalTrim(formData.get('classificacaoAreaContaminada')),
  }

  try {
    await api.patch(`/empreendimentos/${id}`, payload, token)
  } catch (err) {
    if (err instanceof ApiError) {
      const details = err.details as Record<string, string[] | undefined> | undefined
      const firstField = details ? Object.entries(details).find(([, value]) => value?.length) : null
      return { error: firstField?.[1]?.[0] ?? err.message }
    }
    throw err
  }

  // Atualizou o perfil → o gatilho recalcula o diagnóstico. Volta pro posto.
  revalidatePath(`/empreendimentos/${id}`)
  redirect(`/empreendimentos/${id}`)
}
