import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; usuarioId: string }> }) {
  const { id, usuarioId } = await params
  const token = await getAccessToken()
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    await api.delete(`/empreendimentos/${id}/equipe/${usuarioId}`, token)
    return new NextResponse(null, { status: 204 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
