import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  FileText,
  Lock,
  MapPin,
  Radar,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { SISTEMA_EQUIPE_URL, SISTEMA_URL } from '@/lib/content'
import { SystemMockup } from './system-mockup'

const QUICK_MODULES: Array<{ icon: LucideIcon; label: string; href: string }> = [
  { icon: ShieldCheck, label: 'Licenças', href: '/servicos#licenciamento-ambiental-empreendimentos' },
  { icon: CalendarClock, label: 'Condicionantes', href: '/servicos#gestao-condicionantes-obrigacoes' },
  { icon: FileText, label: 'Documentos', href: '/servicos#dossie-documental-auditoria' },
  { icon: MapPin, label: 'Território', href: '/servicos#car-e-cra' },
  { icon: Radar, label: 'Inteligência', href: '/sistema' },
]

export function HeroPlatform() {
  return (
    <section className="relative isolate overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-90"
        style={{
          background:
            'radial-gradient(60% 60% at 12% 12%, rgba(243,146,0,0.10), transparent 60%), radial-gradient(50% 60% at 88% 8%, rgba(0,158,60,0.10), transparent 60%)',
        }}
      />
      <div className="relative z-10 container-x pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1.25fr]">
          <div>
            <span className="badge-pill">
              <span className="badge-pill-dot" />
              <span className="badge-pill-label">Plataforma operacional · v2026.1</span>
            </span>

            <h1 className="font-display mt-6 max-w-2xl text-balance text-[2.7rem] leading-[1.02] tracking-tight text-foreground sm:text-[3.4rem]">
              Central executiva para licenças, condicionantes, território e campo.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              Centralização de documentos, licenças, condicionantes e evidências por
              empreendimento, com leitura executiva da situação regulatória e rastreabilidade das
              pendências.
            </p>

            {/* Module pills */}
            <ul className="mt-7 flex flex-wrap gap-1.5">
              {QUICK_MODULES.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-foreground backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={SISTEMA_EQUIPE_URL}
                className="btn-primary group justify-center"
              >
                <Lock className="h-3.5 w-3.5" /> Entrar no sistema
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={SISTEMA_URL}
                className="btn-outline justify-center"
              >
                Ver todas as entradas
              </Link>
            </div>

            {/* KPI strip */}
            <div className="mt-9 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="hero-stat">
                <span className="hero-stat-val">127</span>
                <span className="hero-stat-label">licenças ativas</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val">12</span>
                <span className="hero-stat-label">vencendo 30d</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val">+200</span>
                <span className="hero-stat-label">ativos</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val">94,2%</span>
                <span className="hero-stat-label">score médio</span>
              </div>
            </div>
          </div>

          {/* Painel operacional (sem foto genérica) */}
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-3xl opacity-70 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle at 25% 25%, rgba(243,146,0,0.22), transparent 55%), radial-gradient(circle at 75% 80%, rgba(0,158,60,0.18), transparent 55%)',
              }}
            />
            <div className="relative">
              <SystemMockup />

              {/* Floating status chip */}
              <div className="absolute -left-3 top-6 hidden rounded-lg border border-border/80 bg-white/95 px-3 py-2 shadow-md backdrop-blur sm:block">
                <div className="flex items-center gap-2">
                  <span className="status-pill status-critico"><span className="dot" />Crítico</span>
                  <p className="text-[11px] font-semibold tracking-tight text-foreground">
                    LO Base GO-1
                  </p>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Vence hoje · ação imediata</p>
              </div>

              <div className="absolute -bottom-4 right-2 hidden rounded-lg border border-border/80 bg-white/95 px-3 py-2 shadow-md backdrop-blur sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Score regulatório
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-black tabular-nums text-emerald-600">94,2%</span>
                  <span className="text-[10px] font-semibold text-emerald-600">↑ 3,1 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
