'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ChevronDown,
  FileText,
  FolderTree,
  Globe,
  Lock,
  MapPin,
  Radar,
  ShieldCheck,
  ClipboardCheck,
  CalendarClock,
  Briefcase,
} from 'lucide-react'
import { SITE_PUBLICO_URL, SISTEMA_CAMPO_URL, SISTEMA_EQUIPE_URL, SISTEMA_PORTAL_URL, SISTEMA_URL } from '@/lib/content'
import { CommandPalette } from './command-palette'
import { HabilisWordmark } from './habilis-wordmark'
import { cn } from '@/lib/cn'

type ModuleItem = {
  label: string
  desc: string
  href: string
  icon: typeof FileText
}

const PLATFORM_MODULES: ModuleItem[] = [
  { label: 'Operações Regulatórias', desc: 'Licenças, condicionantes, prazos e dossiê.', href: '/servicos#operacoes-regulatorias', icon: ShieldCheck },
  { label: 'Matriz Documental', desc: 'Centralização de protocolos, laudos e evidências.', href: '/servicos#dossie-documental-auditoria', icon: FileText },
  { label: 'Gestão de Condicionantes', desc: 'Alertas D-90 · D-30 · D-7 com rastreabilidade.', href: '/servicos#gestao-condicionantes', icon: CalendarClock },
  { label: 'Leitura Territorial', desc: 'CAR, fundiário, polígonos e uso do solo.', href: '/servicos#territorio-rural', icon: MapPin },
  { label: 'Campo & Evidências', desc: 'Checklists, fotos com geotag e relatórios.', href: '/servicos#patrimonio-cultural', icon: ClipboardCheck },
  { label: 'Central de Clientes', desc: 'Empreendimentos, frentes e responsáveis.', href: '/clientes', icon: Briefcase },
  { label: 'Site Público', desc: 'Marca, serviços, prova social e porta de entrada.', href: SITE_PUBLICO_URL, icon: Globe },
  { label: 'Área de Campo', desc: 'OS, vistorias, evidências e pendências em rota.', href: SISTEMA_CAMPO_URL, icon: ClipboardCheck },
  { label: 'Sistema Interno', desc: 'Operação, compliance, gestão e inteligência.', href: SISTEMA_EQUIPE_URL, icon: Radar },
  { label: 'Portal do Cliente', desc: 'Visão executiva externa, sem fricção.', href: SISTEMA_PORTAL_URL, icon: FolderTree },
]

const NAV_LINKS = [
  { label: 'Serviços', href: '/servicos' },
  { label: 'Projetos', href: '/projetos' },
  { label: 'Clientes', href: '/clientes' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Contato', href: '/contato' },
  { label: 'Sistema', href: SISTEMA_URL },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [modulesOpen, setModulesOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModulesOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        scrolled
          ? 'border-b border-border/80 bg-background/95 backdrop-blur-xl shadow-[0_10px_28px_rgba(56,46,27,0.06)]'
          : 'border-b border-transparent bg-background/85 backdrop-blur-md',
      )}
    >
      <div className="container-x flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="group flex h-full items-center" aria-label="Hábilis — início">
          <HabilisWordmark compact />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <button
            type="button"
            onClick={() => setModulesOpen((v) => !v)}
            className={cn('nav-pill', modulesOpen && 'bg-muted/80 text-foreground')}
            aria-expanded={modulesOpen}
            aria-haspopup="true"
          >
            Módulos
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', modulesOpen && 'rotate-180')} />
          </button>
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="nav-pill">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CommandPalette />
          <Link
            href={SISTEMA_CAMPO_URL}
            className="hidden items-center gap-1.5 rounded-lg border border-border/70 bg-white/70 px-3 py-2 text-xs font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary md:inline-flex"
            aria-label="Abrir área de campo"
          >
            <Lock className="h-3.5 w-3.5 text-primary" />
            Campo
          </Link>
          <Link
            href={SISTEMA_EQUIPE_URL}
            className="btn-primary !px-3 !py-2 text-xs shadow-[0_10px_24px_rgba(234,88,12,0.18)]"
          >
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sistema Interno</span>
          </Link>
        </div>
      </div>

      {modulesOpen ? (
        <>
          <button
            type="button"
            aria-hidden
            className="fixed inset-0 z-[35] cursor-default bg-transparent"
            onClick={() => setModulesOpen(false)}
          />
          <div className="relative z-[40] border-t border-border/70 bg-background/97 backdrop-blur-xl shadow-[0_24px_60px_-30px_rgba(56,46,27,0.32)] animate-panel-in">
            <div className="container-x py-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Plataforma Hábilis</p>
                  <h3 className="mt-1 text-base font-semibold tracking-tight">
                    Módulos operacionais — entradas diretas no sistema
                  </h3>
                </div>
                <Link
                  href={SISTEMA_URL}
                  className="text-xs font-semibold text-primary hover:text-primary/80"
                  onClick={() => setModulesOpen(false)}
                >
                  Ver todas as entradas do sistema →
                </Link>
              </div>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                {PLATFORM_MODULES.map((m) => {
                  const Icon = m.icon
                  return (
                    <Link
                      key={m.label}
                      href={m.href}
                      onClick={() => setModulesOpen(false)}
                      className="group flex items-start gap-3 rounded-lg border border-border/70 bg-white/70 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    >
                      <span className="module-icon h-9 w-9 flex-none">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold tracking-tight text-foreground">
                          {m.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                          {m.desc}
                        </span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  )
}
