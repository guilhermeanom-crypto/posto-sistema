'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileText,
  FlaskConical,
  FolderTree,
  Landmark,
  MapPin,
  Radar,
  ShieldCheck,
  TrendingUp,
  Receipt,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

type ModuleStatus = 'regular' | 'atencao' | 'vencendo' | 'critico'

type ModuleDef = {
  id: string
  group: 'operacao' | 'campo' | 'gestao' | 'comercial'
  icon: LucideIcon
  title: string
  desc: string
  metric: string
  metricLabel: string
  status: ModuleStatus
  href: string
}

const MODULES: ModuleDef[] = [
  {
    id: 'central-clientes',
    group: 'comercial',
    icon: Briefcase,
    title: 'Central de Clientes',
    desc: 'Empreendimentos, frentes, responsáveis e canais — sob uma única base.',
    metric: '+200',
    metricLabel: 'ativos sob gestão',
    status: 'regular',
    href: '/clientes',
  },
  {
    id: 'matriz-documental',
    group: 'operacao',
    icon: FileText,
    title: 'Matriz Documental',
    desc: 'Centralização de licenças, protocolos, laudos e evidências por empreendimento.',
    metric: '4.812',
    metricLabel: 'docs versionados',
    status: 'atencao',
    href: '/servicos#dossie-documental-auditoria',
  },
  {
    id: 'licencas',
    group: 'operacao',
    icon: ShieldCheck,
    title: 'Gestão de Licenças',
    desc: 'LP, LI, LO, renovações e ritos simplificados — com cronograma viável e rastreável.',
    metric: '127',
    metricLabel: 'licenças ativas',
    status: 'regular',
    href: '/servicos#licenciamento-ambiental-empreendimentos',
  },
  {
    id: 'condicionantes',
    group: 'operacao',
    icon: CalendarClock,
    title: 'Condicionantes',
    desc: 'Matriz de obrigações com alertas D-90 · D-30 · D-7 e evidência rastreável.',
    metric: '12',
    metricLabel: 'vencendo em 30d',
    status: 'vencendo',
    href: '/servicos#gestao-condicionantes-obrigacoes',
  },
  {
    id: 'campo',
    group: 'campo',
    icon: ClipboardCheck,
    title: 'Campo & Evidências',
    desc: 'Checklists, fotos com geotag, laudos e prontidão para fiscalização.',
    metric: '38',
    metricLabel: 'vistorias no mês',
    status: 'regular',
    href: '/servicos#operacao-segura-e-avcb',
  },
  {
    id: 'territorio',
    group: 'campo',
    icon: MapPin,
    title: 'Leitura Territorial',
    desc: 'CAR, polígonos, fundiário, APP/RL e leitura de conflito de uso do solo.',
    metric: '52',
    metricLabel: 'polígonos analisados',
    status: 'atencao',
    href: '/servicos#car-e-cra',
  },
  {
    id: 'passivos',
    group: 'operacao',
    icon: FlaskConical,
    title: 'Gestão de Passivos',
    desc: 'Diagnóstico, plano de intervenção, monitoramento e encerramento técnico.',
    metric: '6',
    metricLabel: 'frentes ativas',
    status: 'critico',
    href: '/servicos#passivos-areas-contaminadas',
  },
  {
    id: 'patrimonio',
    group: 'campo',
    icon: Landmark,
    title: 'Patrimônio Cultural',
    desc: 'FCA, AIPI, PAPIPA, PAIPA, PGPA e interface técnica direta com o IPHAN.',
    metric: '18',
    metricLabel: 'programas IPHAN',
    status: 'regular',
    href: '/servicos#patrimonio-cultural',
  },
  {
    id: 'orcamento',
    group: 'comercial',
    icon: Receipt,
    title: 'Motor de Orçamento',
    desc: 'Escopo, BDI, ritmos, dependências e proposta com defesa técnica.',
    metric: '23',
    metricLabel: 'propostas no pipe',
    status: 'pendente' as ModuleStatus,
    href: '/sistema',
  },
  {
    id: 'inteligencia',
    group: 'gestao',
    icon: Radar,
    title: 'Inteligência Regulatória',
    desc: 'Score por ativo, leitura executiva e tendências de risco regulatório.',
    metric: '94,2%',
    metricLabel: 'score médio',
    status: 'regular',
    href: '/sistema',
  },
  {
    id: 'portal',
    group: 'gestao',
    icon: FolderTree,
    title: 'Portal do Cliente',
    desc: 'Visão executiva externa — o cliente acompanha cenário, pendências e prazos.',
    metric: '24/7',
    metricLabel: 'visibilidade externa',
    status: 'regular',
    href: '/sistema',
  },
  {
    id: 'playbooks',
    group: 'gestao',
    icon: Building2,
    title: 'Playbooks Hábilis',
    desc: 'Métodos por setor: postos, mineração, energia, rural, infraestrutura.',
    metric: '11',
    metricLabel: 'playbooks ativos',
    status: 'regular',
    href: '/servicos',
  },
]

type Group = 'todos' | ModuleDef['group']

const GROUP_TABS: Array<{ id: Group; label: string }> = [
  { id: 'todos', label: 'Todos os módulos' },
  { id: 'operacao', label: 'Operações regulatórias' },
  { id: 'campo', label: 'Campo, território e patrimônio' },
  { id: 'gestao', label: 'Inteligência e portal' },
  { id: 'comercial', label: 'Comercial e clientes' },
]

const STATUS_LABEL: Record<string, string> = {
  regular: 'Regular',
  atencao: 'Atenção',
  vencendo: 'Vencendo',
  critico: 'Crítico',
  pendente: 'Pendente',
}

export function PlatformModules() {
  const [active, setActive] = useState<Group>('todos')

  const visible = active === 'todos' ? MODULES : MODULES.filter((m) => m.group === active)

  return (
    <section className="border-y bg-background/35 py-24 backdrop-blur-[2px]">
      <div className="container-x">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Módulos da plataforma</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Cada bloco é uma frente operacional, não uma seção promocional
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Centralização de documentos, licenças, condicionantes e evidências por empreendimento —
              com leitura executiva da situação regulatória e rastreabilidade das pendências.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-lg border border-border/70 bg-white/70 px-3 py-2 sm:flex">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">
                {visible.length} {visible.length === 1 ? 'módulo' : 'módulos'}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-7 flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-white/70 p-1.5 backdrop-blur">
          {GROUP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                active === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((m) => {
            const Icon = m.icon
            return (
              <Link key={m.id} href={m.href} className="module-card group">
                <div className="flex items-start justify-between">
                  <div className="module-icon">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`status-pill status-${m.status}`}>
                    <span className="dot" />
                    {STATUS_LABEL[m.status] ?? m.status}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                  {m.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>

                <div className="mt-5 flex items-end justify-between border-t border-border/70 pt-4">
                  <div>
                    <p className="text-xl font-black tracking-tight text-foreground tabular-nums">
                      {m.metric}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {m.metricLabel}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    abrir <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
