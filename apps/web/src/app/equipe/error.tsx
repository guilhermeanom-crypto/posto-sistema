'use client'

import Link from 'next/link'

export default function EquipeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border bg-white px-6 py-8 shadow-sm sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Equipe de Campo
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            A tela da equipe encontrou uma falha inesperada
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Em vez de quebrar a experiência toda, mantivemos uma rota segura para você tentar de
            novo ou voltar ao login.
          </p>
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {error.message || 'Erro inesperado ao renderizar a área da equipe.'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Tentar novamente
            </button>
            <Link
              href="/equipe/login"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
