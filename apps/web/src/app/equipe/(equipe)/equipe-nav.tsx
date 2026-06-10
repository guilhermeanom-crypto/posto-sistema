'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  ImagePlus,
  ListChecks,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HabilisWordmark } from '@/components/brand/habilis-wordmark'
import { equipeLogoutAction } from '../login/actions'

const navItems = [
  { href: '/equipe/inicio',     label: 'Painel',     icon: Gauge },
  { href: '/equipe/os',         label: 'Minhas OS',  icon: ClipboardList },
  { href: '/equipe/checklists', label: 'Checklists', icon: ClipboardCheck },
  { href: '/equipe/evidencias', label: 'Evidências', icon: ImagePlus },
  { href: '/equipe/pendencias', label: 'Pendências', icon: ListChecks },
]

interface EquipeNavProps {
  nome: string
  matricula: string
}

export function EquipeNav({ nome, matricula }: EquipeNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function onLogout() {
    await equipeLogoutAction()
    router.push('/equipe/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8">
        {/* Topo: logo + usuário + sair */}
        <div className="flex items-center justify-between py-3 border-b border-border/40">
          <HabilisWordmark subtitle="Equipe de Campo" compact />

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Em campo
            </span>
            <button
              type="button"
              aria-label="Notificações"
              className="relative grid h-8 w-8 place-items-center rounded-lg border border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                4
              </span>
            </button>
            <span className="hidden sm:flex flex-col text-right leading-tight">
              <span className="text-[11px] font-semibold text-foreground">{nome}</span>
              <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground tabular-nums">
                {matricula}
              </span>
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>

        {/* Tabs de navegação */}
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                )}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
