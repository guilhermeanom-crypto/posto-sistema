'use server'

import { cookies } from 'next/headers'
import { api, ApiError } from '@/lib/api'
import { setAuthCookies, clearAuthCookies } from '@/lib/auth'

interface EquipeLoginInput {
  email: string
  senha: string
}

interface LoginResponse {
  data: {
    accessToken: string
    refreshToken: string
    expiresIn: number
    usuario: { id: string; nome: string; email: string; perfil: string; tenantId: string }
  }
}

/**
 * Login da equipe de campo — autenticação REAL contra a API (antes era simulada).
 * Usa as mesmas credenciais e cookies (posto_access/posto_refresh) do sistema interno,
 * para que as telas de OS/checklists (que leem o token real) funcionem de fato.
 */
export async function equipeLoginAction(input: EquipeLoginInput): Promise<{ error?: string } | null> {
  const email = (input.email ?? '').trim().toLowerCase()
  const senha = (input.senha ?? '').trim()

  if (!email || !senha) {
    return { error: 'Informe e-mail e senha.' }
  }

  try {
    const res = await api.post<LoginResponse>('/auth/login', { email, senha })
    const c = await cookies()
    setAuthCookies(c, res.data.accessToken, res.data.refreshToken)
    return null
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message }
    }
    return { error: 'Não foi possível validar o acesso agora. Tente novamente.' }
  }
}

export async function equipeLogoutAction(): Promise<void> {
  await clearAuthCookies()
}
