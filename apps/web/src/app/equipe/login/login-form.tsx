'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HardHat, Lock, User } from 'lucide-react'
import { accessButtonClass, accessInputClass } from '@/components/access/access-experience-shell'
import { equipeLoginAction } from './actions'

export function EquipeLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await equipeLoginAction({ email, senha })
      if (res?.error) {
        setError(res.error)
        return
      }
      router.push('/equipe/inicio')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          E-mail
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            placeholder="voce@empresa.com.br"
            className={accessInputClass('campo').concat(' pl-9')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Senha
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="senha"
            name="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={accessInputClass('campo').concat(' pl-9')}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" className="rounded border-input" defaultChecked />
          Manter sessão neste aparelho
        </label>
        <a href="#" className="hover:text-foreground">Esqueci minha senha</a>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={accessButtonClass('campo')}
      >
        <HardHat className="h-4 w-4" />
        {pending ? 'Entrando...' : 'Abrir painel da equipe'}
      </button>

      <p className="text-center text-[11px] text-muted-foreground pt-1">
        Use seu e-mail e senha do sistema. Demo: admin@postodemo.com.br / Demo@1234.
      </p>
    </form>
  )
}
