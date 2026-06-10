'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Compass,
  Fuel,
  HardHat,
  Landmark,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

type SectorId = 'postos' | 'mineracao' | 'energia' | 'rural' | 'patrimonio' | 'industria'

type Sector = {
  id: SectorId
  label: string
  short: string
  icon: LucideIcon
  resumo: string
  servicos: string[]
  metricas: { val: string; label: string }[]
  status: 'regular' | 'atencao' | 'vencendo'
}

const SECTORS: Sector[] = [
  {
    id: 'postos',
    label: 'Postos e combustíveis',
    short: 'Postos',
    icon: Fuel,
    resumo: 'Regularidade contínua para postos em operação — uso do solo, SASC, SAO, resíduos, outorga, AVCB e terceiros.',
    servicos: ['Uso do solo e licenciamento', 'SASC e estanqueidade', 'SAO e efluentes', 'OLUC, MTR e CDF', 'AVCB e terceiros'],
    metricas: [
      { val: '+80', label: 'unidades atendidas' },
      { val: '94%', label: 'aderência operacional' },
      { val: '4', label: 'pontos críticos médios' },
    ],
    status: 'atencao',
  },
  {
    id: 'mineracao',
    label: 'Mineração e grandes empreendimentos',
    short: 'Mineração',
    icon: HardHat,
    resumo: 'Operações com alto risco regulatório — licenciamento, condicionantes complexas, patrimônio integrado e inventários.',
    servicos: ['Licenciamento e condicionantes', 'Patrimônio cultural integrado', 'Áreas sensíveis', 'Inventários e relatórios', 'Acompanhamento técnico'],
    metricas: [
      { val: '12', label: 'frentes ativas' },
      { val: '6', label: 'projetos multiórgão' },
      { val: '3', label: 'PGPA em monitoramento' },
    ],
    status: 'vencendo',
  },
  {
    id: 'energia',
    label: 'Energia e infraestrutura linear',
    short: 'Energia',
    icon: Wind,
    resumo: 'LT, parques eólicos, usinas, rodovias e ferrovias — exigência ambiental e patrimonial em corredor longo.',
    servicos: ['LT e parques eólicos', 'Rodovias e ferrovias', 'Patrimônio e arqueologia', 'Monitoramentos', 'Programa PGPA'],
    metricas: [
      { val: '7', label: 'corredores em operação' },
      { val: '2', label: 'estados simultâneos' },
      { val: '94%', label: 'evidência consolidada' },
    ],
    status: 'regular',
  },
  {
    id: 'rural',
    label: 'Rural e território',
    short: 'Rural',
    icon: Compass,
    resumo: 'CAR, leitura territorial, supressão vegetal e regularização fundiária para ativos rurais e territoriais.',
    servicos: ['CAR e retificações', 'APP e Reserva Legal', 'Supressão vegetal', 'Análise geoespacial', 'Regularização fundiária'],
    metricas: [
      { val: '52', label: 'polígonos analisados' },
      { val: '9', label: 'CAR retificados' },
      { val: '2', label: 'conflitos APP' },
    ],
    status: 'atencao',
  },
  {
    id: 'patrimonio',
    label: 'Patrimônio cultural',
    short: 'Patrimônio',
    icon: Landmark,
    resumo: 'Base histórica da Hábilis — FCA, AIPI, PAPIPA, PAIPA, PGPA com interface técnica direta ao IPHAN.',
    servicos: ['FCA', 'AIPI', 'PAPIPA / PAIPA', 'PGPA — campo', 'Educação patrimonial'],
    metricas: [
      { val: '18', label: 'programas IPHAN' },
      { val: '5', label: 'frentes em campo' },
      { val: '+30', label: 'anos de repertório' },
    ],
    status: 'regular',
  },
  {
    id: 'industria',
    label: 'Indústria e expansão',
    short: 'Indústria',
    icon: Building2,
    resumo: 'Empreendimentos com rotina regulatória crítica — licença vigente, condicionantes monitoradas e prontidão de auditoria.',
    servicos: ['Licenciamento e governança', 'Outorga e hídricos', 'Condicionantes', 'Passivos e investigação', 'Dossiê auditável'],
    metricas: [
      { val: '14', label: 'plantas em operação' },
      { val: '127', label: 'licenças ativas' },
      { val: '94,2%', label: 'score médio' },
    ],
    status: 'regular',
  },
]

const STATUS_LABEL: Record<Sector['status'], string> = {
  regular: 'Regular',
  atencao: 'Atenção',
  vencendo: 'Vencendo',
}

export function SectorTabs() {
  const [active, setActive] = useState<SectorId>('postos')
  const sector = SECTORS.find((s) => s.id === active) ?? SECTORS[0]!
  const Icon = sector.icon

  return (
    <section className="py-24">
      <div className="container-x">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Setores atendidos</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Filtros por perfil de empreendimento, com playbook próprio em cada um
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              A mesma plataforma adapta a leitura técnica conforme o setor. Selecione um perfil para
              abrir o recorte operacional aplicado.
            </p>
          </div>
          <Link href="/servicos" className="btn-outline">
            Ver portfólio completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-white/70 p-1.5 backdrop-blur">
          {SECTORS.map((s) => {
            const isActive = s.id === active
            const IconBtn = s.icon
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                <IconBtn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.short}</span>
                <span className="sm:hidden">{s.short.slice(0, 4)}</span>
              </button>
            )
          })}
        </div>

        <div className="product-surface p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="module-icon">
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`status-pill status-${sector.status}`}>
                  <span className="dot" /> {STATUS_LABEL[sector.status]}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                {sector.label}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {sector.resumo}
              </p>

              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {sector.servicos.map((srv) => (
                  <li
                    key={srv}
                    className="flex items-center gap-2 rounded-md border border-border/70 bg-white/70 px-3 py-2 text-xs font-medium text-foreground"
                  >
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                    {srv}
                  </li>
                ))}
              </ul>

              <Link
                href="/servicos"
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
              >
                Ver playbook completo do setor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {sector.metricas.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-border/70 bg-gradient-to-br from-white via-white to-stone-50 p-4"
                >
                  <p className="text-2xl font-black tabular-nums tracking-tight text-foreground">
                    {m.val}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {m.label}
                  </p>
                </div>
              ))}

              <div className="col-span-3 rounded-xl border border-border/70 bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Aderência operacional média
                  </p>
                  <span className="text-xs font-bold text-foreground tabular-nums">88%</span>
                </div>
                <div className="meter-track mt-2">
                  <div className="meter-fill" style={{ width: '88%' }} />
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Score gerado a partir de licenças vigentes, condicionantes atendidas e evidências
                  versionadas no Sistema Hábilis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
