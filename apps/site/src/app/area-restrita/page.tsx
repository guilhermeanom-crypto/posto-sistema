import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { ContextualSideImages } from '@/components/contextual-side-images'
import {
  SISTEMA_CAMPO_URL,
  SISTEMA_EQUIPE_URL,
  SISTEMA_PORTAL_URL,
  SISTEMA_URL,
} from '@/lib/content'

export const metadata = { title: 'Acessos do Sistema · Hábilis Ambiental' }

const ACESSOS = [
  {
    href: SISTEMA_EQUIPE_URL,
    icon: ShieldCheck,
    eyebrow: 'Equipe interna',
    titulo: 'Sistema interno',
    descricao:
      'Cockpit operacional da equipe Hábilis: licenças, condicionantes, documentos, território e inteligência regulatória.',
    cena: 'sistema-interno' as const,
    cta: 'Abrir sistema',
  },
  {
    href: SISTEMA_PORTAL_URL,
    icon: FileText,
    eyebrow: 'Cliente e parceiro',
    titulo: 'Portal do cliente',
    descricao:
      'Ambiente externo para acompanhar empreendimentos, documentos, checklists e o status regulatório do ativo.',
    cena: 'portal-cliente' as const,
    cta: 'Abrir portal',
  },
  {
    href: SISTEMA_CAMPO_URL,
    icon: ClipboardCheck,
    eyebrow: 'Equipe de campo',
    titulo: 'Área de campo',
    descricao:
      'Ordens de serviço, vistorias, evidências fotográficas, checklist em rota e pendências de campo.',
    cena: 'campo' as const,
    cta: 'Abrir campo',
  },
]

const RECURSOS = [
  {
    icon: ShieldCheck,
    titulo: 'Status regulatório em tempo real',
    texto:
      'Visão consolidada do empreendimento: licenças vigentes, condicionantes em curso, próximos vencimentos e responsáveis nomeados.',
    dotColor: 'bg-brand-orange',
  },
  {
    icon: CalendarClock,
    titulo: 'Calendário com alertas D-90, D-30, D-7',
    texto:
      'Antecipação automática de prazos críticos. Sem perda por esquecimento ou rotatividade interna.',
    dotColor: 'bg-brand-green',
  },
  {
    icon: FileText,
    titulo: 'Dossiê digital auditável',
    texto:
      'Documentos versionados, com responsáveis, datas e histórico, prontos para auditoria, fiscalização ou sustentação regulatória.',
    dotColor: 'bg-brand-orange',
  },
]

export default function AreaRestritaPage() {
  return (
    <>
      <PageHero
        eyebrow="Acessos do Sistema"
        scene="sistema-interno"
        title="Entradas do sistema Hábilis."
        subtitle="Clientes e equipe técnica acessam ambientes diferentes do sistema oficial da Hábilis, cada um com sua jornada própria e seu tipo de leitura."
      />

      {/* Bloco principal — três acessos lado a lado, sem mockup espremido. */}
      <section className="relative overflow-hidden py-20">
        <ContextualSideImages scene="sistema-interno" intensity="soft" />
        <div className="container-x center-stage relative">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ACESSOS.map(({ href, icon: Icon, eyebrow, titulo, descricao, cta }) => (
              <article key={titulo} className="access-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="access-card-icon">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {eyebrow}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    {titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {descricao}
                  </p>
                </div>
                <Link
                  href={href}
                  className="btn-primary group mt-auto justify-center text-sm"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <Link
              href={SISTEMA_URL}
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80"
            >
              <Lock className="h-4 w-4" />
              Ver entrada oficial do sistema
            </Link>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Acesso restrito · TLS · Auditoria completa
            </p>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section className="relative overflow-hidden border-t bg-background/60 py-20">
        <div className="container-x center-stage relative">
          <p className="eyebrow">Recursos</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            O que você acessa no portal
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {RECURSOS.map(({ icon: Icon, titulo, texto, dotColor }) => (
              <article key={titulo} className="card-soft p-6">
                <span className={`absolute left-6 top-0 h-0.5 w-10 -translate-y-px ${dotColor}`} />
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{titulo}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{texto}</p>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Esqueceu sua senha?{' '}
            <Link href={SISTEMA_URL} className="font-semibold text-primary hover:text-primary/80">
              Recupere o acesso no sistema
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  )
}
