import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { api } from '@/lib/api'

interface Props {
  params: Promise<{ id: string; versaoId: string }>
}

// Proxy autenticado para download de documento.
// Obtém a URL presignada da API e redireciona o browser para ela.
export async function GET(_request: Request, { params }: Props) {
  const { id, versaoId } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('posto_access')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', _request.url))
  }

  try {
    const res = await api.get<{ data: { url: string; expiresIn: number } }>(
      `/documentos/${id}/versoes/${versaoId}/download`,
      token,
    )
    return NextResponse.redirect(res.data.url)
  } catch {
    return new NextResponse('Erro ao gerar link de download.', { status: 500 })
  }
}
