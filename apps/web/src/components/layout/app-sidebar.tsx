'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2, FileText, ClipboardList, CheckSquare, Bell, BarChart2,
  Settings, LogOut, ShieldCheck, Users, Leaf, Landmark, HardHat, Fuel,
  LayoutDashboard, Sparkles, ListTodo, Gauge, CalendarDays, BadgeDollarSign,
  FileCheck2, ClipboardCheck, Droplets, Waves, Recycle, Trash2, FlaskConical,
  Gavel, UserCheck, Newspaper, ShieldAlert, Download, MessageCircle, TrendingUp,
  Rocket, Building,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessaoUsuario } from '@/lib/auth'
import { HabilisWordmark } from '@/components/brand/habilis-wordmark'

const navGroups = [
  {
    label: null,
    items: [
      { href: '/dashboard',       label: 'Dashboard',        icon: BarChart2 },
      { href: '/executivo',        label: 'Painel Executivo', icon: LayoutDashboard },
      { href: '/empreendimentos',  label: 'Meus Postos',      icon: Building2 },
    ],
  },
  {
    label: 'Condução Técnica',
    items: [
      { href: '/motor-orcamento', label: 'Motor de Orçamento', icon: Sparkles },
      { href: '/assistente-habilis', label: 'Assistente Hábilis', icon: Sparkles },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/fila',           label: 'Fila de Trabalho', icon: ListTodo },
      { href: '/pessoas',        label: 'Pessoas',        icon: Users },
      { href: '/atuacoes',       label: 'Atuações',       icon: Gauge },
      { href: '/tarefas',        label: 'Tarefas',        icon: CheckSquare },
      { href: '/alertas',        label: 'Alertas',        icon: Bell },
      { href: '/calendario',     label: 'Calendário',     icon: CalendarDays },
      { href: '/processos',      label: 'Processos',      icon: ClipboardList },
      { href: '/documentos',     label: 'Documentos',     icon: FileText },
      { href: '/condicionantes', label: 'Condicionantes', icon: ShieldCheck },
      { href: '/comercial/propostas', label: 'Propostas', icon: FileCheck2 },
    ],
  },
  {
    label: 'Gestão Interna',
    items: [
      { href: '/servicos',        label: 'Serviços',          icon: BadgeDollarSign },
      { href: '/contratos',       label: 'Contratos',         icon: FileCheck2 },
      { href: '/ordens-servico',  label: 'Ordens de Serviço', icon: ClipboardCheck },
      { href: '/producao',        label: 'Produção',          icon: Gauge },
      { href: '/entregaveis',     label: 'Entregáveis',       icon: FileText },
      { href: '/financeiro',      label: 'Financeiro',        icon: BadgeDollarSign },
    ],
  },
  {
    label: 'Módulos',
    items: [
      { href: '/licencas-ambientais', label: 'Lic. Ambientais',  icon: Leaf },
      { href: '/regulatorio-urbano',  label: 'Reg. Urbano',      icon: Landmark },
      { href: '/sst',                 label: 'SST',              icon: HardHat },
      { href: '/anp-inmetro',         label: 'ANP / INMETRO',   icon: Fuel },
      { href: '/estanqueidade',       label: 'Estanqueidade',    icon: Droplets },
      { href: '/outorga-hidrica',     label: 'Outorga Hídrica',  icon: Waves },
      { href: '/logistica-reversa',   label: 'Log. Reversa',     icon: Recycle },
      { href: '/pgrs',                label: 'PGRS',             icon: Trash2 },
      { href: '/monitoramento',       label: 'Monitoramento',    icon: FlaskConical },
      { href: '/fiscalizacoes',       label: 'Fiscalizações',    icon: Gavel },
      { href: '/checklists',          label: 'Checklists',       icon: ClipboardCheck },
      { href: '/funcionarios',        label: 'Funcionários',     icon: UserCheck },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { href: '/legislacao', label: 'Legislação',      icon: Newspaper },
      { href: '/risco',      label: 'Risco',           icon: ShieldAlert },
      { href: '/metricas',   label: 'Métricas',         icon: BarChart2 },
      { href: '/relatorios', label: 'Relatórios',      icon: Download },
      { href: '/whatsapp',   label: 'Agente WhatsApp', icon: MessageCircle },
      { href: '/crm',        label: 'CRM Leads',       icon: TrendingUp },
    ],
  },
]

const adminGroup = {
  label: 'Administração',
  items: [
    { href: '/usuarios',    label: 'Usuários',        icon: Users },
    { href: '/onboarding',  label: 'Configuração',    icon: Rocket },
    { href: '/config',      label: 'Configurações',   icon: Settings },
  ],
}

const superAdminGroup = {
  label: 'Super Admin',
  items: [
    { href: '/tenants', label: 'Tenants', icon: Building },
  ],
}

interface AppSidebarProps {
  sessao: SessaoUsuario
}

export function AppSidebar({ sessao }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = ['ADMIN_TENANT', 'SUPER_ADMIN'].includes(sessao.perfil)
  const isSuperAdmin = sessao.perfil === 'SUPER_ADMIN'
  const allGroups = [
    ...navGroups,
    ...(isAdmin ? [adminGroup] : []),
    ...(isSuperAdmin ? [superAdminGroup] : []),
  ]

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">

      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-sidebar-border">
        <HabilisWordmark compact />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3">
        {allGroups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.label && (
              <p className="px-2.5 pt-1 pb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                {group.label}
              </p>
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              const isPostos = href === '/empreendimentos'
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 border',
                    active
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground border-transparent',
                  )}
                >
                  <Icon className={cn(
                    'h-4 w-4 flex-shrink-0',
                    active ? 'text-primary' : 'text-muted-foreground/70',
                  )} />
                  <span className="truncate">{label}</span>
                  {isPostos && !active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-2.5 py-3 border-t border-sidebar-border space-y-0.5">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
            {sessao.nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-foreground">{sessao.nome}</p>
            <p className="text-[9px] uppercase tracking-widest truncate mt-0.5 text-muted-foreground">
              {sessao.perfil.replace('_', ' ')}
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
  )
}
