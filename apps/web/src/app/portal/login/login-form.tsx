'use client'

import { useActionState } from 'react'
import { accessButtonClass, accessInputClass } from '@/components/access/access-experience-shell'
import { portalLoginAction } from './actions'

export function PortalLoginForm() {
  const [state, action, isPending] = useActionState(portalLoginAction, undefined)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
          className={accessInputClass('portal')}
          placeholder="seu@email.com"
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
          className={accessInputClass('portal')}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={accessButtonClass('portal')}
      >
        {isPending ? 'Entrando...' : 'Entrar no Portal'}
      </button>

      {process.env.NODE_ENV !== 'production' ? (
        <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-3.5 py-3 text-xs text-sky-900">
          <p className="font-semibold">Acesso de apresentação (dev)</p>
          <p className="mt-1">representante@postodemo.com.br</p>
          <p>Demo@1234</p>
        </div>
      ) : null}

      <p className="text-center text-xs text-muted-foreground pt-2">
        Suas credenciais foram fornecidas pela equipe Hábilis Posto.<br />
        Em caso de dúvidas, entre em contato com seu consultor.
      </p>
    </form>
  )
}
