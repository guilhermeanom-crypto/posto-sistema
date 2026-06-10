import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Building, ShieldCheck } from 'lucide-react'
import { getSessao } from '@/lib/auth'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getSessao()
  if (!sessao) redirect('/login')
  if (sessao.perfil !== 'SUPER_ADMIN') redirect('/dashboard')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Super Admin */}
      <aside className="w-56 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="px-4 pt-5 pb-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-tight tracking-tight text-foreground">Super Admin</p>
              <p className="text-[9px] uppercase tracking-[0.2em] mt-0.5 text-muted-foreground">Posto Compliance</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          <p className="px-2.5 pt-1 pb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
            Sistema
          </p>
          <Link
            href="/tenants"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 border text-muted-foreground hover:bg-sidebar-accent hover:text-foreground border-transparent"
          >
            <Building className="h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
            <span className="truncate">Tenants</span>
          </Link>
        </nav>

        <div className="px-2.5 py-3 border-t border-sidebar-border space-y-0.5">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
              {sessao.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate text-foreground">{sessao.nome}</p>
              <p className="text-[9px] uppercase tracking-widest truncate mt-0.5 text-muted-foreground">
                SUPER ADMIN
              </p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-all border border-transparent hover:border-destructive/15"
            >
              <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
              Sair da conta
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto main-bg">
        <div className="mx-auto py-7 px-6 max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
