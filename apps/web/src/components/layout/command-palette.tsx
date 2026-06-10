'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  BarChart2,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  Gauge,
  HardHat,
  LayoutDashboard,
  ListTodo,
  PackageCheck,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    heading: 'Navegação',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: BarChart2, keywords: 'cockpit indicadores conformidade' },
      { label: 'Painel Executivo', href: '/executivo', icon: LayoutDashboard, keywords: 'diretoria rede kpi' },
      { label: 'Meus Postos', href: '/empreendimentos', icon: Building2, keywords: 'empreendimentos unidades rede' },
      { label: 'CRM', href: '/crm', icon: TrendingUp, keywords: 'leads comercial funil oportunidades' },
      { label: 'Motor de Orçamento', href: '/motor-orcamento', icon: Sparkles, keywords: 'proposta orçamento precificação' },
      { label: 'Fila de Trabalho', href: '/fila', icon: ListTodo, keywords: 'triagem operação gestão' },
      { label: 'Pessoas', href: '/pessoas', icon: Users, keywords: 'responsáveis capacidade ownership sla' },
      { label: 'Atuações Técnicas', href: '/atuacoes', icon: Gauge, keywords: 'visitas protocolos auditorias campo' },
    ],
  },
  {
    heading: 'Gestão',
    items: [
      { label: 'Tarefas', href: '/tarefas', icon: CheckSquare, keywords: 'pendências prioridades' },
      { label: 'Alertas', href: '/alertas', icon: Bell, keywords: 'risco crítico notificação' },
      { label: 'Calendário', href: '/calendario', icon: CalendarDays, keywords: 'vencimentos prazos agenda' },
      { label: 'Processos', href: '/processos', icon: ClipboardList, keywords: 'licenças protocolos órgãos' },
      { label: 'Documentos', href: '/documentos', icon: FileText, keywords: 'biblioteca análise aprovação' },
      { label: 'Funcionários', href: '/funcionarios', icon: HardHat, keywords: 'sst aso treinamento epi' },
    ],
  },
  {
    heading: 'Gestão Interna',
    items: [
      { label: 'Serviços', href: '/servicos', icon: PackageCheck, keywords: 'catálogo escopo serviços internos' },
      { label: 'Contratos', href: '/contratos', icon: BriefcaseBusiness, keywords: 'formalização clientes assinatura vigência' },
      { label: 'Ordens de Serviço', href: '/ordens-servico', icon: ClipboardList, keywords: 'os execução produção operação' },
      { label: 'Produção', href: '/producao', icon: Gauge, keywords: 'capacidade entrega esteira interna' },
      { label: 'Entregáveis', href: '/entregaveis', icon: FileText, keywords: 'documentos laudos protocolos evidências' },
      { label: 'Financeiro', href: '/financeiro', icon: WalletCards, keywords: 'cobrança faturamento receita inadimplência' },
    ],
  },
  {
    heading: 'Inteligência',
    items: [
      { label: 'Risco', href: '/risco', icon: AlertTriangle, keywords: 'matriz criticidade' },
      { label: 'Métricas', href: '/metricas', icon: BarChart2, keywords: 'gráficos performance' },
    ],
  },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const flattened = useMemo(() => navigation.flatMap((group) => group.items), [])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden min-w-[260px] justify-start gap-2 border-border/80 bg-card/80 text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-card lg:inline-flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Buscar módulo, rotina ou painel</span>
        <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          Ctrl K
        </kbd>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="lg:hidden"
        aria-label="Abrir busca global"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar no Posto Compliance..." />
        <CommandList>
          <CommandEmpty>Nenhuma rota encontrada.</CommandEmpty>

          {navigation.map((group, index) => (
            <div key={group.heading}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={group.heading}>
                {group.items.map(({ label, href, icon: Icon, keywords }) => (
                  <CommandItem key={href} value={`${label} ${href} ${keywords}`} onSelect={() => go(href)}>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{label}</span>
                    <CommandShortcut>{href}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}

          <CommandSeparator />
          <CommandGroup heading="Atalhos Frequentes">
            {flattened.slice(0, 5).map(({ label, href, icon: Icon }) => (
              <CommandItem key={`quick-${href}`} value={`abrir ${label}`} onSelect={() => go(href)}>
                <Icon className="h-4 w-4 text-primary" />
                <span>Abrir {label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
