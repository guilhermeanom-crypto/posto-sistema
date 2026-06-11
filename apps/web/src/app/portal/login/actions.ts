'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { api, ApiError } from '@/lib/api'
import { setAuthCookies, setDemoSessao } from '@/lib/auth'

interface LoginResponse {
  data: {
    accessToken: string
    refreshToken: string
    usuario: { perfil: string }
  }
}

const PORTAL_DEMO = {
  email: 'representante@postodemo.com.br',
  senha: 'Demo@1234',
  nome: 'Representante Posto Demo',
  perfil: 'REPRESENTANTE_POSTO',
  tenantId: 'demo',
}

export async function portalLoginAction(
  _prevState: { error: string } | undefined,
  formData: FormData,
) {
  const email = formData.get('email') as string
  const senha = formData.get('senha') as string

  if (!email || !senha) return { error: 'Preencha e-mail e senha.' }

  let perfil: string
  try {
    const res = await api.post<LoginResponse>('/auth/login', { email, senha })
    perfil = res.data.usuario.perfil

    if (perfil !== 'REPRESENTANTE_POSTO') {
      return { error: 'Acesso negado. Use o painel administrativo para entrar com esta conta.' }
    }

    const cookieStore = await cookies()
    setAuthCookies(cookieStore, res.data.accessToken, res.data.refreshToken)
  } catch (err) {
    // Fallback demo SOMENTE fora de produção (em prod seria bypass de auth)
    if (
      process.env.NODE_ENV !== 'production' &&
      email.toLowerCase() === PORTAL_DEMO.email &&
      senha === PORTAL_DEMO.senha
    ) {
      const cookieStore = await cookies()
      setDemoSessao(cookieStore, {
        id: 'demo-representante-posto',
        nome: PORTAL_DEMO.nome,
        email: PORTAL_DEMO.email,
        perfil: PORTAL_DEMO.perfil,
        tenantId: PORTAL_DEMO.tenantId,
      })
      redirect('/portal/inicio')
    }
    if (err instanceof ApiError) return { error: err.message }
    return { error: 'Não foi possível validar o acesso agora. Tente novamente.' }
  }

  redirect('/portal/documentos')
}
