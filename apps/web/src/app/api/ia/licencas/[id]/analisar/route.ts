import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const res = await api.post(`/ia/licencas/${id}/analisar`, {}, token)
    return NextResponse.json(res, { status: 202 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro'
    const status = msg.includes('sem arquivo') ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
