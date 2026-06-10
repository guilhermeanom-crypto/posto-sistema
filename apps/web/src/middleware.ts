import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getApiBaseUrl } from '@/lib/api-base'

const ACCESS = 'posto_access'
const REFRESH = 'posto_refresh'
const DEMO = 'posto_demo_sessao'

const isProd = process.env.NODE_ENV === 'production'

interface RenovaResultado {
  accessToken: string
  refreshToken: string
}

/** Renova o access token usando o refresh token (silencioso). Null se não der. */
async function tentarRefresh(refreshToken: string): Promise<RenovaResultado | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: RenovaResultado }
    if (!body.data?.accessToken || !body.data?.refreshToken) return null
    return body.data
  } catch {
    return null
  }
}

function aplicarCookies(res: NextResponse, tokens: RenovaResultado) {
  res.cookies.set(ACCESS, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  })
  res.cookies.set(REFRESH, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const access = request.cookies.get(ACCESS)?.value
  const demo = request.cookies.get(DEMO)?.value
  const refresh = request.cookies.get(REFRESH)?.value
  const autenticado = Boolean(access || demo)

  // Página de login: se já autenticado, vai para o dashboard
  if (pathname === '/login') {
    if (autenticado) return NextResponse.redirect(new URL('/dashboard', request.url))
    return NextResponse.next()
  }

  // Portal usa token próprio (magic-link) — não interferir
  if (pathname.startsWith('/portal')) return NextResponse.next()

  if (autenticado) return NextResponse.next()

  // Sem sessão de acesso, mas com refresh: tenta renovar silenciosamente
  // (antes o usuário caía no login a cada 15min quando o access expirava)
  if (refresh) {
    const renovado = await tentarRefresh(refresh)
    if (renovado) {
      // Propaga o novo token para a REQUEST (server components desta mesma request já leem)
      request.cookies.set(ACCESS, renovado.accessToken)
      request.cookies.set(REFRESH, renovado.refreshToken)
      const res = NextResponse.next({ request: { headers: request.headers } })
      // E também no RESPONSE, para o browser persistir
      aplicarCookies(res, renovado)
      return res
    }
  }

  // /equipe tem tela própria de re-login (deixa renderizar)
  if (pathname.startsWith('/equipe')) return NextResponse.next()

  // Rota protegida sem sessão válida → login
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js)).*)'],
}
