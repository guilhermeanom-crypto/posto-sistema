'use server'

import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'
import { revalidatePath } from 'next/cache'

function optionalTrim(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : undefined
}

function digitsOnly(value: FormDataEntryValue | null) {
  const text = String(value ?? '').replace(/\D/g, '')
  return text.length > 0 ? text : undefined
}

export async function criarEmpreendimentoAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const atividadesSelecionadas = formData.getAll('atividades') as string[]

  // ── Empresa: usa a existente OU cria uma nova ali mesmo ──────────────────────
  const modoEmpresa = String(formData.get('empresaModo') ?? '').trim()
  let empresaId = String(formData.get('empresaId') ?? '').trim()

  if (modoEmpresa === 'nova' || !empresaId) {
    const razaoSocial = String(formData.get('novaEmpresaRazaoSocial') ?? '').trim()
    const cnpjEmpresa = digitsOnly(formData.get('novaEmpresaCnpj'))
    if (!razaoSocial || !cnpjEmpresa) {
      return { error: 'Informe a razão social e o CNPJ da empresa.' }
    }
    try {
      const empRes = await api.post<{ data: { id: string } }>(
        '/empresas',
        {
          nome: optionalTrim(formData.get('novaEmpresaNomeFantasia')) ?? razaoSocial,
          razaoSocial,
          cnpj: cnpjEmpresa,
        },
        token,
      )
      empresaId = empRes.data.id
    } catch (err) {
      if (err instanceof ApiError) return { error: `Empresa: ${err.message}` }
      throw err
    }
  }

  const payload = {
    empresaId,
    nome: String(formData.get('nome') ?? '').trim(),
    nomeFantasia: optionalTrim(formData.get('nomeFantasia')),
    cnpj: digitsOnly(formData.get('cnpj')),
    codigoInterno: optionalTrim(formData.get('codigoInterno')),
    bandeira: optionalTrim(formData.get('bandeira')),
    tipo: optionalTrim(formData.get('tipo')),
    logradouro: String(formData.get('logradouro') ?? '').trim(),
    numero: String(formData.get('numero') ?? '').trim(),
    complemento: optionalTrim(formData.get('complemento')),
    bairro: String(formData.get('bairro') ?? '').trim(),
    cidade: String(formData.get('cidade') ?? '').trim(),
    estado: String(formData.get('estado') ?? '').trim(),
    cep: digitsOnly(formData.get('cep')) ?? '',
    contatoEmail: optionalTrim(formData.get('contatoEmail')),
    contatoTelefone: optionalTrim(formData.get('contatoTelefone')),
    responsavelTecnicoNome: optionalTrim(formData.get('responsavelTecnicoNome')),
    responsavelTecnicoCrea: optionalTrim(formData.get('responsavelTecnicoCrea')),
    responsavelTecnicoEmail: optionalTrim(formData.get('responsavelTecnicoEmail')),
    atividades: atividadesSelecionadas.length > 0 ? atividadesSelecionadas : ['Revendedor varejista de combustíveis'],
    dataInicioOperacao: optionalTrim(formData.get('dataInicioOperacao')),
  }

  let novoId: string | null = null

  try {
    const res = await api.post<{ data: { id: string } }>('/empreendimentos', payload, token)
    novoId = res.data.id
  } catch (err) {
    if (!(err instanceof ApiError)) {
      // redirect lança internamente — precisa re-throw
      throw err
    }
    // Erro honesto: mostra a mensagem real do servidor (sem fallback que mascarava falha).
    const details = err.details as Record<string, string[] | undefined> | undefined
    const firstField = details ? Object.entries(details).find(([, value]) => value?.length) : null
    const detailMessage = firstField?.[1]?.[0]
    return { error: detailMessage ?? err.message }
  }

  revalidatePath('/empreendimentos')
  redirect(`/empreendimentos/${novoId}/onboarding`)
}
