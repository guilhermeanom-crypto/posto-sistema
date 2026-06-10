'use server'

import { cookies } from 'next/headers'

interface EquipeLoginInput {
  matricula: string
  senha: string
}

/**
 * Login da equipe de campo (demo).
 * Apenas valida formato mínimo e grava um cookie de sessão simulada.
 * Não conversa com a API por enquanto — escopo de demo.
 */
export async function equipeLoginAction(input: EquipeLoginInput): Promise<{ error?: string } | null> {
  const matricula = (input.matricula ?? '').trim()
  const senha = (input.senha ?? '').trim()

  if (!matricula || !senha) {
    return { error: 'Informe matrícula e senha.' }
  }
  if (matricula.length < 3) {
    return { error: 'Matrícula inválida.' }
  }

  const c = await cookies()
  c.set({
    name: 'habilis_equipe',
    value: JSON.stringify({
      matricula,
      nome: 'Diego M.',
      perfil: 'TECNICO_CAMPO',
      sessaoAt: Date.now(),
    }),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return null
}

export async function equipeLogoutAction(): Promise<void> {
  const c = await cookies()
  c.delete('habilis_equipe')
}
