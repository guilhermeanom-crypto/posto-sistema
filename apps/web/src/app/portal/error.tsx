'use client'

import Link from 'next/link'

export default function PortalError({
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
            Portal do Cliente
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            O portal encontrou uma falha inesperada
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Evitamos a tela branca e preservamos um caminho seguro de retorno. Tente recarregar a
            página ou volte para o login do portal.
          </p>
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {error.message || 'Erro inesperado ao renderizar o portal.'}
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
              href="/portal/login"
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
