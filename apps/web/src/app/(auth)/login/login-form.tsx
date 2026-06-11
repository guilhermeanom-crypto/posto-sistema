'use client'

import { useActionState } from 'react'
import { accessButtonClass, accessInputClass } from '@/components/access/access-experience-shell'
import { loginAction } from './actions'

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, undefined)

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={accessInputClass('sistema')}
          placeholder="voce@empresa.com.br"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className={accessInputClass('sistema')}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={accessButtonClass('sistema')}
      >
        {isPending ? 'Entrando...' : 'Entrar na conta'}
      </button>

      {process.env.NODE_ENV !== 'production' ? (
        <div className="rounded-xl border border-orange-100 bg-orange-50/70 px-3.5 py-3 text-xs text-orange-800">
          <p className="font-semibold">Acesso de apresentação (dev)</p>
          <p className="mt-1">admin@postodemo.com.br</p>
          <p>Demo@1234</p>
        </div>
      ) : null}
    </form>
  )
}
