import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearAuthCookies } from '@/lib/auth'
import { buildApiUrl } from '@/lib/api-base'

export async function POST(request: Request) {
  // Revoga o refresh token no servidor ANTES de limpar os cookies — sem isto a
  // sessão de refresh continuava válida por 7 dias mesmo após "sair".
  try {
    const refreshToken = (await cookies()).get('posto_refresh')?.value
    if (refreshToken) {
      await fetch(buildApiUrl('/auth/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      })
    }
  } catch {
    // Falha de rede ao revogar não pode impedir o logout local — sempre limpa cookies.
  }

  await clearAuthCookies()
  const origin = new URL(request.url).origin
  return NextResponse.redirect(new URL('/login', origin))
}
