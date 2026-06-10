'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Bell, CheckSquare, ClipboardList, ClipboardCheck, MessageSquare, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HabilisWordmark } from '@/components/brand/habilis-wordmark'

const navItems = [
  { href: '/portal/inicio',         label: 'Início',         icon: LayoutDashboard },
  { href: '/portal/documentos',     label: 'Documentos',     icon: FileText },
  { href: '/portal/alertas',        label: 'Alertas',        icon: Bell },
  { href: '/portal/tarefas',        label: 'Tarefas',        icon: CheckSquare },
  { href: '/portal/condicionantes', label: 'Condicionantes', icon: ClipboardList },
  { href: '/portal/checklists',     label: 'Checklists',     icon: ClipboardCheck },
  { href: '/portal/mensagens',      label: 'Mensagens',      icon: MessageSquare },
]

interface PortalNavProps {
  nome: string
}

export function PortalNav({ nome }: PortalNavProps) {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8">
        {/* Topo: logo + usuário + sair */}
        <div className="flex items-center justify-between py-3 border-b border-border/40">
          <HabilisWordmark subtitle="Portal do Representante" compact />

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Olá, <span className="font-medium text-foreground">{nome.split(' ')[0]}</span>
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </form>
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
