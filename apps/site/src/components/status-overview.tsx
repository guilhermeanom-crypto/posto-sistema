'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'

type Status = 'regular' | 'atencao' | 'vencendo' | 'pendente' | 'critico'

type Entry = {
  ativo: string
  uf: string
  tipo: string
  detalhe: string
}

const DATA: Record<Status, { count: number; entries: Entry[] }> = {
  regular: {
    count: 184,
    entries: [
      { ativo: 'Complexo logístico Centro-Oeste', uf: 'GO', tipo: 'LO vigente', detalhe: 'Próxima renovação em 2027' },
      { ativo: 'Rodoviário federal · Trecho 4', uf: 'MA', tipo: 'PGPA', detalhe: 'Relatório anual aceito' },
      { ativo: 'Programa LT 500kV Norte', uf: 'PA', tipo: 'FCA', detalhe: 'Acatada pelo IPHAN' },
    ],
  },
  atencao: {
    count: 27,
    entries: [
      { ativo: 'Unidade industrial Centro-Oeste', uf: 'DF', tipo: 'Outorga', detalhe: 'Renovação em 60 dias' },
      { ativo: 'Patrimônio ferroviário · BA-PI', uf: 'BA', tipo: 'PAPIPA', detalhe: 'Pendência menor de diligência' },
      { ativo: 'Operação multiunidade urbana', uf: 'GO', tipo: 'AVCB', detalhe: 'Vistoria agendada' },
    ],
  },
  vencendo: {
    count: 12,
    entries: [
      { ativo: 'Posto BR-153 · km 312', uf: 'GO', tipo: 'LO', detalhe: 'Vence em 3 dias' },
      { ativo: 'Fazenda Vale do Cerrado', uf: 'MT', tipo: 'CAR retificação', detalhe: 'Entrega complementar' },
      { ativo: 'Base logística regional', uf: 'TO', tipo: 'Outorga · poço P-04', detalhe: 'Janela 14 dias' },
    ],
  },
  pendente: {
    count: 9,
    entries: [
      { ativo: 'Projeto urbano em expansão', uf: 'GO', tipo: 'Diretriz de uso', detalhe: 'Aguarda parecer técnico' },
      { ativo: 'Frente arqueológica linear', uf: 'PI', tipo: 'PGPA', detalhe: 'Aguarda contratação de equipe' },
    ],
  },
  critico: {
    count: 3,
    entries: [
      { ativo: 'Base GO-1 · Distribuição', uf: 'GO', tipo: 'LO renovação', detalhe: 'Vence HOJE — defesa técnica' },
      { ativo: 'Ativo rural · áreas sensíveis', uf: 'MT', tipo: 'ASV', detalhe: 'Pendência crítica em APP' },
    ],
  },
}

const TABS: Array<{ id: Status; label: string }> = [
  { id: 'regular', label: 'Regular' },
  { id: 'atencao', label: 'Atenção' },
  { id: 'vencendo', label: 'Vencendo' },
  { id: 'pendente', label: 'Pendente' },
  { id: 'critico', label: 'Crítico' },
]

export function StatusOverview() {
  const [active, setActive] = useState<Status>('vencendo')
  const data = DATA[active]
  const total = Object.values(DATA).reduce((s, d) => s + d.count, 0)

  return (
    <section className="py-20">
      <div className="container-x">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Painel executivo</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              A operação inteira lida em cinco estados, sem ruído
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Os {total} pontos de gestão do portfólio são reconciliados em estados claros — qualquer
              executivo lê o cenário em segundos.
            </p>
          </div>

          {/* Status pills com contagem */}
          <div className="grid w-full grid-cols-5 gap-1.5 lg:w-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                aria-pressed={active === tab.id}
                className={cn(
                  'group relative flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-all',
                  active === tab.id
                    ? `border-transparent status-${tab.id} shadow-sm`
                    : 'border-border/70 bg-white/70 hover:border-border',
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em]',
                    active === tab.id ? '' : 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      tab.id === 'regular' && 'bg-emerald-500',
                      tab.id === 'atencao' && 'bg-amber-500',
                      tab.id === 'vencendo' && 'bg-orange-500',
                      tab.id === 'pendente' && 'bg-sky-500',
                      tab.id === 'critico' && 'bg-red-500',
                    )}
                  />
                  {tab.label}
                </span>
                <span className="text-lg font-black tabular-nums leading-none">
                  {DATA[tab.id].count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="product-surface p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className={`status-pill status-${active}`}>
                <span className="dot" />
                {TABS.find((t) => t.id === active)?.label}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                {data.count} ativos · amostra abaixo
              </span>
            </div>
            <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80">
              Abrir no sistema <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <ul className="divide-y divide-border/60">
            {data.entries.map((e) => (
              <li key={e.ativo} className="flex items-center gap-3 py-3">
                <div className="grid h-9 w-12 place-items-center rounded-md border border-border/70 bg-white text-[10px] font-bold tabular-nums text-muted-foreground">
                  {e.uf}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {e.ativo}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {e.tipo} · {e.detalhe}
                  </p>
                </div>
                <span className={`status-pill status-${active}`}>
                  <span className="dot" />
                  {TABS.find((t) => t.id === active)?.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
