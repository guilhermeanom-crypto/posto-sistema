import { PageHero } from '@/components/page-hero'
import { CONTATO, VAGAS } from '@/lib/content'

export const metadata = { title: 'Trabalhe Conosco · Hábilis Ambiental' }

export default function TrabalheConoscoPage() {
  return (
    <>
      <PageHero
        eyebrow="Trabalhe conosco"
        scene="trabalhe-conosco"
        title="Engenheiros, técnicos e analistas que querem decidir, não apenas documentar."
        subtitle="Nosso time é multidisciplinar e opera com método. Se você gosta de transformar norma em decisão executável, este é o lugar."
      />

      <section className="container-x py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {VAGAS.map((v) => (
            <article key={v.titulo} className="card p-7">
              <h2 className="text-lg font-bold text-foreground">{v.titulo}</h2>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">{v.local}</p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {v.requisitos.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                    {r}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-xl bg-secondary/40 p-10">
          <p className="eyebrow">Envie seu currículo</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">
            Não encontrou uma vaga aderente?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Mantemos um banco técnico ativo. Envie seu currículo para{' '}
            <a href={`mailto:${CONTATO.email}`} className="font-semibold text-primary hover:text-primary/80">
              {CONTATO.email}
            </a>{' '}
            com o assunto <strong>"Banco técnico — sua área"</strong>.
          </p>
        </div>
      </section>
    </>
  )
}
