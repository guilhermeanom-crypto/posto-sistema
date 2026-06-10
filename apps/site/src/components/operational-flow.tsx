'use client'

import { useState } from 'react'
import {
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Layers,
  MapPin,
  Radar,
  Receipt,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

type Step = {
  id: string
  short: string
  label: string
  icon: LucideIcon
  detail: string
  metric: string
  metricLabel: string
}

const STEPS: Step[] = [
  {
    id: 'cliente',
    short: '01',
    label: 'Cliente',
    icon: Briefcase,
    detail: 'Cadastro do empreendimento, frentes, responsáveis técnicos e canal direto com a operação Hábilis.',
    metric: '+200',
    metricLabel: 'ativos cadastrados',
  },
  {
    id: 'documentos',
    short: '02',
    label: 'Documentos',
    icon: FileText,
    detail: 'Ingestão de licenças, protocolos, laudos e evidências. Cada peça versionada e relacionada ao ativo.',
    metric: '4.812',
    metricLabel: 'documentos centralizados',
  },
  {
    id: 'diagnostico',
    short: '03',
    label: 'Diagnóstico',
    icon: Layers,
    detail: 'Leitura técnica do ativo, do órgão e da exigência. Mapeamento de fase, risco e próximos passos.',
    metric: '94,2%',
    metricLabel: 'score regulatório médio',
  },
  {
    id: 'proposta',
    short: '04',
    label: 'Proposta',
    icon: Receipt,
    detail: 'Escopo, BDI, ritmos e dependências traduzidos em proposta defensável e operacionalizável.',
    metric: '23',
    metricLabel: 'frentes em estruturação',
  },
  {
    id: 'campo',
    short: '05',
    label: 'Campo',
    icon: ClipboardCheck,
    detail: 'Checklists, geotag, fotos, laudos e relatórios — prontidão para fiscalização e auditoria.',
    metric: '38',
    metricLabel: 'vistorias no mês',
  },
  {
    id: 'licenciamento',
    short: '06',
    label: 'Licenciamento',
    icon: ShieldCheck,
    detail: 'Condução de LP, LI, LO, ritos simplificados e renovações com cronograma viável e auditável.',
    metric: '127',
    metricLabel: 'licenças ativas',
  },
  {
    id: 'condicionantes',
    short: '07',
    label: 'Condicionantes',
    icon: CalendarClock,
    detail: 'Matriz de obrigações por licença, alertas D-90/D-30/D-7 e evidência rastreável de atendimento.',
    metric: '12',
    metricLabel: 'vencendo em 30d',
  },
  {
    id: 'monitoramento',
    short: '08',
    label: 'Monitoramento',
    icon: Radar,
    detail: 'Score do ativo, leitura executiva, alertas, painel do cliente e ciclo de renovação contínuo.',
    metric: '24/7',
    metricLabel: 'visão executiva',
  },
]

const TERRITORY_STEP: Step = {
  id: 'territorio',
  short: '·',
  label: 'Território',
  icon: MapPin,
  detail: 'Camada transversal de CAR, fundiário, APP/RL e leitura geoespacial que sustenta todas as etapas.',
  metric: '52',
  metricLabel: 'polígonos analisados',
}

export function OperationalFlow() {
  const [active, setActive] = useState<string>('diagnostico')
  const step = STEPS.find((s) => s.id === active) ?? STEPS[0]!

  return (
    <section className="py-24">
      <div className="container-x">
        <div className="mb-10 max-w-3xl">
          <p className="eyebrow">Fluxo operacional</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Do diagnóstico inicial ao acompanhamento operacional da regularização
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Um fluxo único conecta cliente, campo, documentos, proposta e execução técnica — clique
            em qualquer etapa para abrir a leitura executiva da Hábilis para aquele ponto.
          </p>
        </div>

        <div className="product-surface p-6 sm:p-8">
          {/* Flow steps */}
          <div className="relative">
            <div className="grid grid-cols-4 items-start gap-y-7 sm:grid-cols-8 sm:gap-2">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const isActive = s.id === active
                const isCurrent = i <= STEPS.findIndex((x) => x.id === active)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActive(s.id)}
                    className="flow-step group"
                    data-active={isActive}
                    aria-pressed={isActive}
                  >
                    <span className="flow-bubble">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={cn(
                        'mt-2 text-[10px] font-bold uppercase tracking-[0.14em]',
                        isCurrent ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {s.short}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 text-xs font-semibold tracking-tight transition-colors',
                        isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {s.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {/* Connector line */}
            <div className="pointer-events-none absolute left-6 right-6 top-6 -z-0 hidden h-px sm:block">
              <div className="flow-connector h-full" />
            </div>
          </div>

          {/* Detail card */}
          <div className="mt-8 grid gap-6 rounded-xl border border-border/70 bg-white/70 p-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <span className="status-pill status-regular">
                  <span className="dot" /> Etapa {step.short}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {step.label}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-foreground">
                Leitura executiva · {step.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  'Rastreável: responsável, prazo, evidência',
                  'Auditável: dossiê pronto para órgão',
                  'Visível: cliente e equipe na mesma tela',
                  'Acionável: próximo passo destacado',
                ].map((it) => (
                  <li key={it} className="flex items-start gap-2 text-xs text-foreground">
                    <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-border/70 bg-gradient-to-br from-white via-white to-orange-50/40 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Indicador da etapa
              </p>
              <p className="mt-3 text-4xl font-black tabular-nums tracking-tight text-foreground">
                {step.metric}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{step.metricLabel}</p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Cobertura</span>
                  <span className="tabular-nums text-foreground">88%</span>
                </div>
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: '88%' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Risco</span>
                  <span className="tabular-nums text-foreground">baixo</span>
                </div>
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: '24%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Layer transversal: território */}
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-dashed border-border bg-white/50 px-4 py-3">
            <span className="module-icon h-8 w-8">
              <TERRITORY_STEP.icon className="h-3.5 w-3.5" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-tight text-foreground">
                Camada transversal · Território
              </p>
              <p className="text-[11px] text-muted-foreground">{TERRITORY_STEP.detail}</p>
            </div>
            <span className="hidden text-[11px] font-bold tabular-nums text-muted-foreground sm:inline">
              {TERRITORY_STEP.metric} <span className="font-medium">{TERRITORY_STEP.metricLabel}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
