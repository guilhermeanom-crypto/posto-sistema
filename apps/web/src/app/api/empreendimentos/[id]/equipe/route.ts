import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const res = await api.get<{ data: unknown[] }>(`/empreendimentos/${id}/equipe`, token)
    return NextResponse.json(res)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const body = await req.json()
    const res = await api.post(`/empreendimentos/${id}/equipe`, body, token)
    return NextResponse.json(res, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
