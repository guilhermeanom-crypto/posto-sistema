import Link from 'next/link'
import {
  BadgeCheck,
  ClipboardCheck,
  Files,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { HabilisWordmark } from '@/components/brand/habilis-wordmark'
import { cn } from '@/lib/utils'

type AccessSurfaceKey = 'sistema' | 'portal' | 'campo'

type SurfaceLink = {
  key: AccessSurfaceKey
  label: string
  href: string
  icon: LucideIcon
}

type AccessStat = {
  value: string
  label: string
}

type AccessExperienceShellProps = {
  activeSurface: AccessSurfaceKey
  eyebrow: string
  title: string
  description: string
  chips: string[]
  stats: AccessStat[]
  formTitle: string
  formDescription: string
  supportTitle: string
  supportText: string
  children: React.ReactNode
}

const SURFACE_LINKS: SurfaceLink[] = [
  { key: 'sistema', label: 'Sistema interno', href: '/login', icon: ShieldCheck },
  { key: 'portal', label: 'Portal do cliente', href: '/portal/login', icon: Files },
  { key: 'campo', label: 'Área de campo', href: '/equipe/login', icon: ClipboardCheck },
]

const SURFACE_THEME: Record<
  AccessSurfaceKey,
  {
    accentClass: string
    accentSoftClass: string
    buttonClass: string
    dotClass: string
    ringClass: string
    edgeGradient: string
  }
> = {
  sistema: {
    accentClass: 'text-orange-700',
    accentSoftClass: 'border-orange-200 bg-orange-50/90 text-orange-700',
    buttonClass: 'bg-orange-600 hover:bg-orange-700',
    dotClass: 'bg-orange-500',
    ringClass: 'focus:ring-orange-500/30',
    edgeGradient:
      'radial-gradient(60% 70% at 0% 30%, rgba(243,146,0,0.18), transparent 65%), radial-gradient(60% 70% at 100% 70%, rgba(0,158,60,0.14), transparent 65%)',
  },
  portal: {
    accentClass: 'text-sky-700',
    accentSoftClass: 'border-sky-200 bg-sky-50/90 text-sky-700',
    buttonClass: 'bg-sky-600 hover:bg-sky-700',
    dotClass: 'bg-sky-500',
    ringClass: 'focus:ring-sky-500/30',
    edgeGradient:
      'radial-gradient(60% 70% at 0% 30%, rgba(14,165,233,0.16), transparent 65%), radial-gradient(60% 70% at 100% 70%, rgba(0,158,60,0.12), transparent 65%)',
  },
  campo: {
    accentClass: 'text-emerald-700',
    accentSoftClass: 'border-emerald-200 bg-emerald-50/90 text-emerald-700',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
    dotClass: 'bg-emerald-500',
    ringClass: 'focus:ring-emerald-500/30',
    edgeGradient:
      'radial-gradient(60% 70% at 0% 30%, rgba(120,86,40,0.14), transparent 65%), radial-gradient(60% 70% at 100% 70%, rgba(0,158,60,0.16), transparent 65%)',
  },
}

export function accessButtonClass(surface: AccessSurfaceKey) {
  const theme = SURFACE_THEME[surface]
  return cn(
    'w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(15,23,42,0.10)] transition-all disabled:cursor-not-allowed disabled:opacity-60',
    theme.buttonClass,
    theme.ringClass,
    'focus:outline-none focus:ring-2'
  )
}

export function accessInputClass(surface: AccessSurfaceKey) {
  const theme = SURFACE_THEME[surface]
  return cn(
    'w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2',
    theme.ringClass
  )
}

export function AccessExperienceShell({
  activeSurface,
  eyebrow,
  title,
  description,
  chips,
  stats,
  formTitle,
  formDescription,
  supportTitle,
  supportText,
  children,
}: AccessExperienceShellProps) {
  const theme = SURFACE_THEME[activeSurface]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f4ec]">
      {/* Atmosfera institucional de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(42% 46% at 15% 22%, rgba(243,146,0,0.16), transparent 72%), radial-gradient(38% 40% at 87% 18%, rgba(0,158,60,0.12), transparent 68%), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(247,244,236,0.9))',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(174, 153, 121, 0.22) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Imagens contextuais de borda (fallback gradiente; substituíveis por
          arquivos em apps/web/public/images/contextos/<superficie>/ no futuro) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[28vw] max-w-[420px] lg:block"
        style={{
          background: theme.edgeGradient,
          maskImage:
            'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0) 92%)',
          WebkitMaskImage:
            'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0) 92%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[28vw] max-w-[420px] lg:block"
        style={{
          background: theme.edgeGradient,
          maskImage:
            'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0) 92%)',
          WebkitMaskImage:
            'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0) 92%)',
        }}
      />

      <header className="absolute inset-x-0 top-0 z-30 border-b border-white/70 bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <HabilisWordmark subtitle="Consultoria" compact />

          <nav className="hidden items-center gap-2 lg:flex">
            {SURFACE_LINKS.map(({ key, label, href, icon: Icon }) => {
              const active = key === activeSurface
              return (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.02em] transition-all',
                    active
                      ? `${theme.accentSoftClass} shadow-[0_10px_24px_rgba(15,23,42,0.06)]`
                      : 'border-white/80 bg-white/68 text-slate-600 hover:border-slate-200 hover:bg-white/90 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1280px] px-6 pb-16 pt-28 lg:px-10">
        <div className="grid min-h-[calc(100vh-7rem)] w-full items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,420px)] xl:gap-16">
          {/* Coluna esquerda: texto institucional */}
          <section className="flex flex-col justify-center pt-4 lg:pt-0">
            <span
              className={cn(
                'inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]',
                theme.accentSoftClass
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', theme.dotClass)} />
              {eyebrow}
            </span>

            <h1 className="mt-6 max-w-[14ch] font-serif text-[2.6rem] leading-[1] tracking-tight text-slate-900 sm:text-[3.4rem] xl:text-[4.1rem]">
              {title}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-[17px]">
              {description}
            </p>

            <ul className="mt-7 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <li key={chip}>
                  <span className="inline-flex items-center rounded-full border border-white/80 bg-white/72 px-3.5 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur">
                    {chip}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/75 bg-white/70 px-4 py-4 shadow-[0_18px_40px_rgba(56,46,27,0.06)] backdrop-blur"
                >
                  <p className="text-[1.6rem] font-black leading-none tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 max-w-xl rounded-[1.5rem] border border-white/80 bg-white/66 p-5 shadow-[0_20px_48px_rgba(56,46,27,0.06)] backdrop-blur">
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 rounded-2xl border p-2.5', theme.accentSoftClass)}>
                  <BadgeCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{supportTitle}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{supportText}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Coluna direita: somente o card de login (sem mockup espremido) */}
          <section className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[440px]">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-80 blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle at 24% 26%, rgba(243,146,0,0.20), transparent 56%), radial-gradient(circle at 76% 72%, rgba(0,158,60,0.18), transparent 56%)',
                }}
              />
              <div className="relative rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(56,46,27,0.12)] backdrop-blur-2xl sm:p-8">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full animate-pulse', theme.dotClass)} />
                  <span
                    className={cn(
                      'text-[11px] font-bold uppercase tracking-[0.2em]',
                      theme.accentClass
                    )}
                  >
                    acesso protegido
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {formTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{formDescription}</p>

                <div
                  className="my-6 h-px"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, rgba(243,146,0,0.42), rgba(0,158,60,0.30), transparent)',
                  }}
                />

                {children}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
