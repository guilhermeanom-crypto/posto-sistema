import { PageHero } from '@/components/page-hero'
import { NOTICIAS } from '@/lib/content'
import { VisualPanel } from '@/components/visual-panel'

export const metadata = { title: 'Notícias e informativos · Hábilis Ambiental' }

export default function NoticiasPage() {
  return (
    <>
      <PageHero
        eyebrow="Notícias e informativos"
        scene="noticias"
        title="Conteúdo técnico para quem lida com operação, território e exigência real."
        subtitle="Os temas acompanham o que a Hábilis enxerga na prática: patrimônio cultural, licenciamento, campo, leitura territorial e governança regulatória."
      />

      <section className="container-x py-24">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {NOTICIAS.map((n, index) => {
            const image =
              index === 0
                ? '/images/habilis/servico-postos-combustiveis-operacoes-reguladas.png'
                : index === 1
                  ? '/images/habilis/servico-arqueologia-patrimonio-cultural.png'
                  : '/images/habilis/servico-rural-car-leitura-territorial.png'

            return (
              <VisualPanel
                key={n.slug}
                image={image}
                imageAlt={n.titulo}
                eyebrow={`${n.categoria} · ${new Date(n.data).toLocaleDateString('pt-BR')}`}
                title={n.titulo}
                description={n.resumo}
              />
            )
          })}
        </div>
      </section>
    </>
  )
}
