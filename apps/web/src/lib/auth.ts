import { cookies } from 'next/headers'
import { api } from './api'

// ─────────────────────────────────────────────────────────────────────────────
// AUTH HELPERS — Server-side token management via httpOnly cookies
// ─────────────────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_COOKIE = 'posto_access'
const REFRESH_TOKEN_COOKIE = 'posto_refresh'
const SELECTED_EMP_COOKIE = 'posto_emp_atual'
const DEMO_SESSION_COOKIE = 'posto_demo_sessao'

export interface SessaoUsuario {
  id: string
  nome: string
  email: string
  perfil: string
  tenantId: string
}

export interface DemoSessao extends SessaoUsuario {
  origem: 'demo'
}

function parseDemoSessao(raw?: string): DemoSessao | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DemoSessao
    if (!parsed?.email || !parsed?.perfil) return null
    return { ...parsed, origem: 'demo' }
  } catch {
    return null
  }
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
}

export async function getSessao(): Promise<SessaoUsuario | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) return parseDemoSessao(cookieStore.get(DEMO_SESSION_COOKIE)?.value)

  try {
    const res = await api.get<{ data: SessaoUsuario }>('/auth/me', token)
    return res.data
  } catch {
    return parseDemoSessao(cookieStore.get(DEMO_SESSION_COOKIE)?.value)
  }
}

export async function getDemoSessao(): Promise<DemoSessao | null> {
  const cookieStore = await cookies()
  return parseDemoSessao(cookieStore.get(DEMO_SESSION_COOKIE)?.value)
}

export function setAuthCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  accessToken: string,
  refreshToken: string,
) {
  const isProduction = process.env.NODE_ENV === 'production'

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutos
    path: '/',
  })

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 dias
    path: '/',
  })

  cookieStore.delete(DEMO_SESSION_COOKIE)
}

export function setDemoSessao(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  sessao: SessaoUsuario,
) {
  cookieStore.set(DEMO_SESSION_COOKIE, JSON.stringify({ ...sessao, origem: 'demo' }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60,
    path: '/',
  })

  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
  cookieStore.delete(SELECTED_EMP_COOKIE)
  cookieStore.delete(DEMO_SESSION_COOKIE)
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTRO GLOBAL DE EMPREENDIMENTO
// "" (string vazia) ou ausente = "todos os empreendimentos" (escopo da rede).
// ─────────────────────────────────────────────────────────────────────────────

export async function getSelectedEmpreendimentoId(): Promise<string | undefined> {
  const cookieStore = await cookies()
  const v = cookieStore.get(SELECTED_EMP_COOKIE)?.value
  return v && v !== '' ? v : undefined
}

export async function setSelectedEmpreendimentoId(id: string | null) {
  const cookieStore = await cookies()
  if (!id) {
    cookieStore.delete(SELECTED_EMP_COOKIE)
    return
  }
  cookieStore.set(SELECTED_EMP_COOKIE, id, {
    httpOnly: false, // legível por client component se quiser exibir no header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
}

/**
 * Resolve o empreendimento ativo dado um valor explícito (querystring) e o cookie.
 * Querystring tem precedência: permite link compartilhável sobrescrever a seleção.
 * Retorna undefined se "todos".
 */
export async function resolveEmpreendimentoId(explicito?: string): Promise<string | undefined> {
  if (explicito && explicito !== '') return explicito
  return getSelectedEmpreendimentoId()
}
