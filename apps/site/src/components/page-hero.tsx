import { HabilisTrace } from './habilis-trace'
import type { ContextSceneKey } from '@/lib/context-images'

interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  scene?: ContextSceneKey
}

/**
 * Hero das páginas internas. Fundo claro com main-bg de pontos (padrão do
 * sistema). Quando uma cena é informada, imagens contextuais aparecem nas
 * bordas com fade, mantendo o conteúdo central em destaque.
 */
export function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  return (
    <section className="main-bg relative overflow-hidden border-b border-border/70">
      <HabilisTrace className="absolute -left-8 top-20 z-[1] hidden h-28 w-80 opacity-55 lg:block" />
      <HabilisTrace
        mirrored
        className="absolute -right-10 bottom-6 z-[1] hidden h-28 w-72 opacity-45 lg:block"
      />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top_left,rgba(243,146,0,0.07),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(0,158,60,0.06),transparent_30%)]" />
      <div className="container-x relative z-10 pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="center-stage-narrow rounded-[2rem] border border-white/80 bg-white/80 px-7 py-8 shadow-[0_20px_50px_rgba(50,42,28,0.07)] backdrop-blur md:px-10 md:py-10">
          {eyebrow ? (
            <span className="badge-pill animate-rise-in">
              <span className="badge-pill-dot" />
              <span className="badge-pill-label">{eyebrow}</span>
            </span>
          ) : null}
          <h1 className="font-display mt-5 max-w-3xl text-4xl leading-[1.03] tracking-tight text-foreground sm:text-5xl animate-rise-in animate-stagger-1">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-rise-in animate-stagger-2">
              {subtitle}
            </p>
          ) : null}
          <div className="gradient-divider mt-7" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Operação, território, licenciamento e patrimônio em uma mesma leitura técnica.
          </p>
        </div>
      </div>
      <div className="gradient-divider" />
    </section>
  )
}
