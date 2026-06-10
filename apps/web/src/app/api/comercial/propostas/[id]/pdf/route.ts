import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { buildApiUrl } from '@/lib/api-base'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('posto_access')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = await fetch(buildApiUrl(`/comercial/propostas/${id}/pdf`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    return new NextResponse('Erro ao gerar PDF da proposta.', { status: response.status })
  }

  const buffer = await response.arrayBuffer()
  const headers = new Headers()
  headers.set('Content-Type', response.headers.get('content-type') ?? 'application/pdf')
  headers.set(
    'Content-Disposition',
    response.headers.get('content-disposition') ?? `attachment; filename="proposta-${id}.pdf"`,
  )

  return new NextResponse(buffer, {
    status: 200,
    headers,
  })
}
