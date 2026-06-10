import Link from 'next/link'
import { getSessao } from '@/lib/auth'
import { PortalNav } from './portal-nav'

export default async function PortalAuthLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getSessao()

  if (!sessao || sessao.perfil !== 'REPRESENTANTE_POSTO') {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10">
        <div
          className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center"
          style={{ minHeight: '70vh' }}
        >
          <div className="w-full rounded-3xl border bg-white px-6 py-8 shadow-sm sm:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Portal do Cliente
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Sua sessão não está disponível
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Não conseguimos validar o acesso ao portal neste momento. Entre novamente para
              continuar ou volte ao início se preferir.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/portal/login"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Entrar no portal
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PortalNav nome={sessao.nome} />
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
