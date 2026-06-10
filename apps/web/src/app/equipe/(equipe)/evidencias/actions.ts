'use server'

import { revalidatePath } from 'next/cache'
import { getAccessToken } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

/**
 * Registra uma evidência de campo e, opcionalmente, anexa uma foto.
 * Fluxo: cria evidência → gera URL presignada → faz o PUT do arquivo no storage
 * pelo servidor (evita CORS browser→MinIO). Foto é opcional.
 */
export async function adicionarEvidenciaAction(formData: FormData): Promise<{ error?: string } | null> {
  const token = await getAccessToken()
  if (!token) return { error: 'Sessão expirada. Faça login novamente.' }

  const ordemServicoId = String(formData.get('ordemServicoId') ?? '')
  const setor = String(formData.get('setor') ?? '').trim()
  const nota = String(formData.get('nota') ?? '').trim()
  const latRaw = formData.get('latitude')
  const lngRaw = formData.get('longitude')
  const latitude = latRaw ? Number(latRaw) : undefined
  const longitude = lngRaw ? Number(lngRaw) : undefined
  const foto = formData.get('foto') as File | null

  if (!ordemServicoId || !setor || !nota) {
    return { error: 'Selecione a OS e preencha setor e nota.' }
  }

  try {
    const criada = await api.post<{ data: { id: string } }>(
      '/evidencias',
      {
        ordemServicoId,
        setor,
        nota,
        ...(latitude !== undefined && !Number.isNaN(latitude) ? { latitude } : {}),
        ...(longitude !== undefined && !Number.isNaN(longitude) ? { longitude } : {}),
      },
      token,
    )
    const evidenciaId = criada.data.id

    if (foto && foto.size > 0) {
      const presign = await api.post<{ data: { uploadUrl: string } }>(
        `/evidencias/${evidenciaId}/foto`,
        { nomeArquivo: foto.name || 'evidencia.jpg', mimeType: foto.type || 'image/jpeg' },
        token,
      )
      const buffer = Buffer.from(await foto.arrayBuffer())
      const put = await fetch(presign.data.uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': foto.type || 'image/jpeg' },
        body: buffer,
      })
      if (!put.ok) {
        return { error: 'Evidência registrada, mas o envio da foto falhou. Tente anexar novamente.' }
      }
    }

    revalidatePath('/equipe/evidencias')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Não foi possível registrar a evidência agora.' }
  }
}
