import Link from 'next/link'
import { ArrowRight, Lock, TrendingUp } from 'lucide-react'
import {
  CLIENTES_PARCEIROS,
  ESTADOS_ATUACAO,
  NOTICIAS,
  NUMEROS,
  SISTEMA_EQUIPE_URL,
  SISTEMA_PORTAL_URL,
  SISTEMA_URL,
  VALORES_HABILIS,
} from '@/lib/content'
import { HabilisTrace } from '@/components/habilis-trace'
import { HeroPlatform } from '@/components/hero-platform'
import { PlatformModules } from '@/components/platform-modules'
import { OperationalFlow } from '@/components/operational-flow'
import { SectorTabs } from '@/components/sector-tabs'
import { StatusOverview } from '@/components/status-overview'
import { DocumentMatrixMockup } from '@/components/mockups/document-matrix'
import { RegulatoryTimelineMockup } from '@/components/mockups/regulatory-timeline'
import { TerritoryMapMockup } from '@/components/mockups/territory-map'
import { FieldChecklistMockup } from '@/components/mockups/field-checklist'
import { ClientPortalMockup } from '@/components/mockups/client-portal'

export default function HomePage() {
  return (
    <>
      {/* 1. HERO — Plataforma operacional */}
      <HeroPlatform />

      {/* 2. KPI STRIP — números da casa, sem cara de hero secundário */}
      <section className="relative -mt-2 pb-16">
        <div className="container-x">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {NUMEROS.map((n, i) => (
              <div
                key={n.label}
                className={`kpi-tile animate-rise-in animate-stagger-${(i % 4) + 1}`}
              >
                <div className="kpi-tile-bar" />
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-black tracking-tight text-foreground tabular-nums">
                  {n.valor}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {n.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. STATUS OVERVIEW — Regular, Atenção, Vencendo, Pendente, Crítico */}
      <StatusOverview />

      {/* 4. MÓDULOS DA PLATAFORMA — blocos operacionais (não promocionais) */}
      <PlatformModules />

      {/* 5. FLUXO OPERACIONAL — cliente → monitoramento */}
      <OperationalFlow />

      {/* 6. MOCKUPS OPERACIONAIS — substituem as fotos genéricas */}
      <section className="border-y bg-background/35 py-24 backdrop-blur-[2px]">
        <div className="container-x">
          <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">Telas reais do sistema</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Preview das frentes que sustentam a operação no dia a dia
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Fluxo único para cliente, campo, documentos, proposta e execução técnica — cada
                preview abaixo corresponde a um módulo do Sistema Hábilis.
              </p>
            </div>
            <Link href={SISTEMA_URL} className="btn-outline">
              Ver entradas do sistema <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <DocumentMatrixMockup />
            <RegulatoryTimelineMockup />
            <FieldChecklistMockup />
            <TerritoryMapMockup />
            <ClientPortalMockup />
            <article className="product-surface flex flex-col justify-between p-6">
              <div>
                <span className="badge-pill">
                  <span className="badge-pill-dot" />
                  <span className="badge-pill-label">Sistema Hábilis</span>
                </span>
                <h3 className="mt-5 text-xl font-bold tracking-tight">
                  Cockpit regulatório para qualquer empreendimento crítico
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Equipe interna e portal do cliente compartilham a mesma base — empreendimentos,
                  licenças, condicionantes, território, patrimônio e documentos.
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {[
                    'Calendário com alertas D-90, D-30 e D-7',
                    'Dossiê por empreendimento, frente ou programa',
                    'Visão executiva para cliente e operação interna',
                  ].map((it) => (
                    <li key={it} className="flex items-start gap-2 text-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                <Link href={SISTEMA_EQUIPE_URL} className="btn-primary group justify-center text-sm">
                  <Lock className="h-3.5 w-3.5" /> Ambiente interno
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href={SISTEMA_PORTAL_URL} className="btn-outline justify-center text-sm">
                  Portal do cliente
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 7. SETORES ATENDIDOS — filtros interativos com playbook */}
      <SectorTabs />

      {/* 8. PRESENÇA / ESTADOS */}
      <section className="border-t py-24">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Onde a Hábilis opera</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Presença em estados-chave para operação, expansão e campo
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Acompanhamos ativos no Centro-Oeste, Norte e Nordeste, com base operacional em Goiânia
              e desenho de equipe conforme a natureza da frente: operação, campo, território,
              patrimônio ou implantação.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/projetos" className="btn-primary">
                Ver recortes de projeto <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contato" className="btn-outline">
                Falar com a equipe
              </Link>
            </div>
          </div>
          <div className="product-surface p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Estados em operação</p>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                {ESTADOS_ATUACAO.length}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {ESTADOS_ATUACAO.map((uf) => (
                <span
                  key={uf}
                  className="grid h-12 place-items-center rounded-lg border border-border/70 bg-white text-sm font-semibold tracking-tight text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {uf}
                </span>
              ))}
            </div>
            <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
              Desenho de equipe ajustado por frente: licenciamento, campo, território, patrimônio ou
              implantação — sempre com leitura única dentro do Sistema Hábilis.
            </p>
          </div>
        </div>
      </section>

      {/* 9. CLIENTES E PARCEIROS — bloco operacional, sem cara de logo soup */}
      <section className="border-t bg-background/35 py-20 backdrop-blur-[2px]">
        <div className="container-x">
          <div className="mb-8 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Clientes e parceiros</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Operações que confiaram a frente regulatória à Hábilis
              </h2>
            </div>
            <Link href="/clientes" className="btn-outline">
              Ver perfis atendidos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {CLIENTES_PARCEIROS.map((c) => (
              <li
                key={c}
                className="group flex min-h-20 items-center gap-3 rounded-lg border border-border/70 bg-white px-4 py-4 text-sm text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30"
              >
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-primary/60 transition-colors group-hover:bg-primary" />
                <span className="leading-snug">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10. MÉTODO + VALORES */}
      <section className="border-t py-24">
        <div className="container-x">
          <div className="product-surface p-8 sm:p-10">
            <p className="eyebrow">Método Hábilis</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              Técnica organizada para a frente regulatória não depender de memória
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                'Diagnóstico técnico inicial com leitura do ativo, do órgão e da fase.',
                'Matriz de pendências que separa documento, estudo, terceiro e decisão do cliente.',
                'Plano de ação com prioridade, dependência e janela de protocolo.',
                'Gestão de prazos, alertas e retornos regulatórios em cadência visível.',
                'Integração de terceiros e especialidades sem perder o fio executivo.',
                'Dossiê auditável para fiscalização, renovação, defesa técnica e governança interna.',
              ].map((item) => (
                <div key={item} className="rounded-xl border border-border/70 bg-white/70 px-5 py-4">
                  <div className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                    <p className="text-sm leading-relaxed text-foreground">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container-x mt-16">
          <p className="eyebrow">Pilares operacionais</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Quatro pilares para transformar técnica em direção
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {VALORES_HABILIS.map((v, i) => (
              <div
                key={v.titulo}
                className={`card relative p-6 animate-rise-in animate-stagger-${(i % 4) + 1}`}
              >
                <span className="absolute left-6 top-0 h-0.5 w-10 -translate-y-px bg-primary" />
                <h3 className="mt-2 text-base font-semibold tracking-tight">{v.titulo}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{v.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. NOTÍCIAS */}
      <section className="border-t bg-background/60 py-24">
        <div className="container-x">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Notícias e informativos</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Conteúdo técnico-operacional, sem cara de blog institucional
              </h2>
            </div>
            <Link href="/noticias" className="btn-outline">
              Ver tudo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {NOTICIAS.map((n, idx) => (
              <article key={n.slug} className="card flex h-full flex-col p-6">
                <div className="flex items-center gap-2">
                  <span className="badge-pill">
                    <span className="badge-pill-dot" />
                    <span className="badge-pill-label">{n.categoria}</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
                    {new Date(n.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                  {n.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{n.resumo}</p>
                <Link
                  href={`/noticias#${n.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                >
                  Leia mais <ArrowRight className="h-3 w-3" />
                </Link>
                <span className="mt-auto pt-6 text-[10px] font-mono text-muted-foreground/60">
                  art-{(idx + 1).toString().padStart(3, '0')}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 12. CTA FINAL */}
      <section className="border-t py-24">
        <div className="container-x">
          <div className="section-shell p-10 sm:p-14">
            <HabilisTrace className="absolute -right-6 top-0 h-28 w-80 opacity-60" />
            <HabilisTrace mirrored className="absolute -left-10 bottom-0 h-24 w-72 opacity-55" />
            <div className="relative grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-center">
              <div>
                <span className="badge-pill">
                  <span className="badge-pill-dot" />
                  <span className="badge-pill-label">Pronto para começar?</span>
                </span>
                <h2 className="font-display mt-5 max-w-2xl text-4xl leading-[1.02] tracking-tight sm:text-5xl">
                  Sistema, licenciamento, território ou patrimônio: a conversa começa pelo cenário
                  real do ativo
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Em vez de proposta genérica, fazemos a leitura inicial do ativo, da frente
                  regulatória e do próximo passo que realmente destrava o cenário.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/contato" className="btn-primary justify-center">
                  Agendar conversa técnica <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={SISTEMA_EQUIPE_URL} className="btn-outline justify-center">
                  <Lock className="h-4 w-4" /> Ambiente interno
                </Link>
                <Link href={SISTEMA_PORTAL_URL} className="btn-ghost justify-center text-xs">
                  Portal do cliente →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
