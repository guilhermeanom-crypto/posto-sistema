import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SERVICOS_FOCO, SERVICOS_PRESTADOS_ESSENCIAIS } from '@/lib/content'
import { iconFor } from '@/lib/icons'

export const metadata = { title: 'Serviços · Hábilis Ambiental' }

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Serviços"
        scene="servicos"
        title="Serviços estruturados para reduzir risco regulatório e dar previsibilidade à operação."
        subtitle="A Hábilis atua na organização técnica, documental e estratégica de empreendimentos que dependem de licenças, autorizações, condicionantes, estudos, cadastros e comprovações de regularidade. Cada frente pode ser contratada de forma pontual ou integrada a uma rotina de gestão."
      />

      <section className="container-x py-24">
        <div className="grid gap-6 lg:grid-cols-2">
          {SERVICOS_PRESTADOS_ESSENCIAIS.map((servico, index) => {
            const Icon = iconFor(servico.icone)
            return (
              <article
                key={servico.slug}
                className="trace-panel group overflow-hidden transition-shadow hover:shadow-[0_20px_60px_rgba(50,42,28,0.10)]"
              >
                <div className="relative h-52 overflow-hidden border-b border-border/70 sm:h-56">
                  <Image
                    src={servico.imagem}
                    alt={servico.titulo}
                    fill
                    priority={index < 2}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,22,30,0)_0%,rgba(18,22,30,0.05)_50%,rgba(18,22,30,0.65)_100%)]" />
                  <div className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-xl border border-white/40 bg-white/85 text-primary shadow-sm backdrop-blur">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="absolute bottom-4 left-5 right-5 text-[15px] font-semibold leading-snug text-white">
                    {servico.valor}
                  </p>
                </div>

                <div className="p-6 sm:p-8">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {servico.titulo}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {servico.resumo}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {servico.itens.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-foreground/85">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/contato"
                    className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/80"
                  >
                    Levar essa frente para uma conversa <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="border-t bg-background/45 py-24 backdrop-blur-[2px]">
        <div className="container-x">
          <div className="max-w-3xl">
            <p className="eyebrow">Frentes em destaque</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              As entradas mais recorrentes da operação multiempreendimento
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Detalhamento das frentes que costumam abrir a conversa com a Hábilis. Cada uma
              tem leitura própria de risco, prazo e cadência operacional.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICOS_FOCO.map((servico) => {
              const Icon = iconFor(servico.icone)
              return (
                <article
                  id={servico.slug}
                  key={servico.slug}
                  className="card group relative scroll-mt-32 overflow-hidden p-0 transition-shadow hover:shadow-[0_18px_45px_rgba(50,42,28,0.08)]"
                >
                  {servico.imagem ? (
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={servico.imagem}
                        alt={servico.titulo}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,22,30,0)_40%,rgba(18,22,30,0.55)_100%)]" />
                      <div className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-white/40 bg-white/85 text-primary shadow-sm backdrop-blur">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="absolute bottom-3 left-4 right-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/95">
                        {servico.sigla}
                      </p>
                    </div>
                  ) : null}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {servico.titulo}
                    </h3>
                    {servico.valor ? (
                      <p className="mt-2 text-sm font-medium leading-snug text-primary/90">
                        {servico.valor}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {servico.resumo}
                    </p>
                    <Link
                      href="/contato"
                      className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/80"
                    >
                      Falar com o time <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
