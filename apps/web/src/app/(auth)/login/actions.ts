'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { api, ApiError } from '@/lib/api'
import { setAuthCookies, setDemoSessao } from '@/lib/auth'

interface LoginResponse {
  data: {
    accessToken: string
    refreshToken: string
    expiresIn: number
    usuario: { id: string; nome: string; email: string; perfil: string; tenantId: string }
  }
}

const DEMO_USERS: Record<
  string,
  { nome: string; perfil: string; tenantId: string }
> = {
  'admin@postodemo.com.br': {
    nome: 'Admin Demo',
    perfil: 'ADMIN_TENANT',
    tenantId: 'demo',
  },
  'coord@postodemo.com.br': {
    nome: 'Coordenador Demo',
    perfil: 'COORDENADOR',
    tenantId: 'demo',
  },
  'analista@postodemo.com.br': {
    nome: 'Analista Demo',
    perfil: 'ANALISTA',
    tenantId: 'demo',
  },
}

function isDemoCredential(email: string, senha: string) {
  return senha === 'Demo@1234' && email.toLowerCase() in DEMO_USERS
}

export async function loginAction(_prevState: { error: string } | undefined, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const senha = String(formData.get('senha') ?? '').trim()

  if (!email || !senha) {
    return { error: 'Preencha e-mail e senha.' }
  }

  try {
    const res = await api.post<LoginResponse>('/auth/login', { email, senha })
    const cookieStore = await cookies()
    setAuthCookies(cookieStore, res.data.accessToken, res.data.refreshToken)
  } catch (err) {
    // Fallback demo SOMENTE fora de produção (em prod isso seria um bypass de auth)
    if (process.env.NODE_ENV !== 'production' && isDemoCredential(email, senha)) {
      const cookieStore = await cookies()
      const demoUser = DEMO_USERS[email]
      if (!demoUser) {
        return { error: 'Usuário demo não encontrado.' }
      }
      setDemoSessao(cookieStore, {
        id: `demo-${demoUser.perfil.toLowerCase()}`,
        nome: demoUser.nome,
        email,
        perfil: demoUser.perfil,
        tenantId: demoUser.tenantId,
      })
      redirect('/dashboard')
    }
    if (err instanceof ApiError) {
      return { error: err.message }
    }
    return { error: 'Não foi possível validar o acesso agora. Tente novamente.' }
  }

  redirect('/dashboard')
}
