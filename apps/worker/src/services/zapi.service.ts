// ─────────────────────────────────────────────────────────────────────────────
// Z-API CLIENT — envio de mensagens WhatsApp
// Docs: https://developer.z-api.io/
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.z-api.io/instances'

function zapiUrl(path: string): string {
  const { ZAPI_INSTANCE_ID, ZAPI_TOKEN } = process.env
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) throw new Error('Z-API não configurado (ZAPI_INSTANCE_ID / ZAPI_TOKEN ausentes)')
  return `${BASE_URL}/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/${path}`
}

export function zapiDisponivel(): boolean {
  return Boolean(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN)
}

export async function enviarTexto(numero: string, mensagem: string): Promise<void> {
  const res = await fetch(zapiUrl('send-text'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': process.env.ZAPI_CLIENT_TOKEN ?? '',
    },
    body: JSON.stringify({ phone: numero, message: mensagem }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Z-API envio falhou [${res.status}]: ${body}`)
  }
}

export async function enviarImagem(numero: string, urlImagem: string, legenda?: string): Promise<void> {
  const res = await fetch(zapiUrl('send-image'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': process.env.ZAPI_CLIENT_TOKEN ?? '',
    },
    body: JSON.stringify({ phone: numero, image: urlImagem, caption: legenda ?? '' }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Z-API envio imagem falhou [${res.status}]: ${body}`)
  }
}
