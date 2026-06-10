import Link from 'next/link'
import { ArrowRight, ClipboardCheck, ExternalLink, Globe, Lock, ShieldCheck } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { ClientPortalMockup } from '@/components/mockups/client-portal'
import { FieldChecklistMockup } from '@/components/mockups/field-checklist'
import { SiteExperienceMockup } from '@/components/mockups/site-experience'
import { SystemMockup } from '@/components/system-mockup'
import {
  SERVICOS_INTERNOS_ESSENCIAIS,
  SITE_PUBLICO_URL,
  SISTEMA_CAMPO_URL,
  SISTEMA_EQUIPE_URL,
  SISTEMA_PORTAL_URL,
} from '@/lib/content'

export const metadata = { title: 'Sistema Hábilis · Hábilis Ambiental' }

export default function SistemaPlaceholderPage() {
  const surfaces = [
    {
      title: 'Site Público',
      label: 'Entrada institucional',
      description:
        'Apresenta a Hábilis, explica serviços, organiza a narrativa comercial e encaminha cada perfil para a interface correta.',
      href: SITE_PUBLICO_URL,
      cta: 'Abrir site',
      icon: Globe,
      tone: 'border-border bg-white',
      preview: <SiteExperienceMockup />,
    },
    {
      title: 'Portal do Cliente',
      label: 'Clientes e parceiros',
      description:
        'Ambiente externo para acompanhar empreendimentos, documentos, checklists, mensagens e status regulatório.',
      href: SISTEMA_PORTAL_URL,
      cta: 'Abrir portal',
      icon: Lock,
      tone: 'border-border bg-white',
      preview: <ClientPortalMockup />,
    },
    {
      title: 'Área de Campo',
      label: 'Equipe de campo',
      description:
        'Fluxo operacional para ordens de serviço, vistorias, evidências fotográficas, checklists e pendências em rota.',
      href: SISTEMA_CAMPO_URL,
      cta: 'Abrir campo',
      icon: ClipboardCheck,
      tone: 'border-border bg-white',
      preview: <FieldChecklistMockup />,
    },
    {
      title: 'Sistema Operacional Interno',
      label: 'Equipe Hábilis',
      description:
        'Cockpit central da operação: conformidade, dossiês, processos, inteligência regulatória e gestão multiempreendimento.',
      href: SISTEMA_EQUIPE_URL,
      cta: 'Abrir sistema',
      icon: ExternalLink,
      tone: 'border-primary/30 bg-primary/[0.04]',
      preview: <SystemMockup compact className="h-full min-h-[320px]" />,
    },
  ]

  return (
    <>
      <PageHero
        eyebrow="Sistema Hábilis"
        scene="sistema"
        title="Quatro interfaces, uma operação só."
        subtitle="O ecossistema da Hábilis se divide em superfícies diferentes para site, cliente, campo e operação interna. Esta página organiza essas entradas com a mesma leitura visual do produto."
      />

      <section className="container-x py-24">
        <div className="grid gap-6 xl:grid-cols-2">
          {surfaces.map((surface) => {
            const Icon = surface.icon
            return (
              <article
                key={surface.title}
                className={`overflow-hidden rounded-[1.5rem] border shadow-[0_24px_60px_rgba(56,46,27,0.08)] ${surface.tone}`}
              >
                <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="border-b border-border/70 p-6 lg:border-b-0 lg:border-r">
                    {surface.preview}
                  </div>
                  <div className="flex flex-col justify-between p-6 sm:p-8">
                    <div>
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        {surface.label}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-foreground">{surface.title}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {surface.description}
                      </p>
                    </div>
                    <Link href={surface.href} className="btn-outline mt-7 w-fit">
                      {surface.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="border-t bg-background/35 py-20 backdrop-blur-[2px]">
        <div className="container-x">
          <p className="eyebrow">Serviços internos essenciais</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            O sistema organiza as frentes centrais da operação técnica
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {SERVICOS_INTERNOS_ESSENCIAIS.map((item) => (
              <article key={item.titulo} className="card relative overflow-hidden p-6">
                <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 to-brand-green/60" />
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                  {item.titulo}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {item.resumo}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
