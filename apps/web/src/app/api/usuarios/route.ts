import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function GET() {
  const token = await getAccessToken()
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const res = await api.get<{ data: unknown[] }>('/usuarios?limit=100', token)
    return NextResponse.json(res)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
