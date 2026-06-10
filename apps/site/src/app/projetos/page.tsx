import { PageHero } from '@/components/page-hero'
import { ESTADOS_ATUACAO, PROJETOS } from '@/lib/content'
import { VisualPanel } from '@/components/visual-panel'

export const metadata = { title: 'Projetos · Hábilis Ambiental' }

export default function ProjetosPage() {
  return (
    <>
      <PageHero
        eyebrow="Projetos"
        scene="projetos"
        title="Recortes de campo, operação e documentação em frentes diferentes."
        subtitle="Os exemplos abaixo mostram a lógica da Hábilis em diferentes contextos: território, licenciamento, patrimônio cultural, operação e ativos de perfis distintos."
      />

      <section className="container-x py-24">
        <div className="mb-12 section-shell p-8">
          <div className="relative">
            <p className="eyebrow">Estados com projetos ativos</p>
            <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-12">
              {ESTADOS_ATUACAO.map((uf) => (
                <span
                  key={uf}
                  className="grid h-14 place-items-center rounded-xl bg-white text-lg font-bold text-foreground shadow-sm"
                >
                  {uf}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PROJETOS.map((p, index) => (
            <VisualPanel
              key={`${p.cliente}-${p.uf}`}
              image={p.imagem}
              imageAlt={p.cliente}
              eyebrow={`${p.area} · ${p.uf}`}
              title={p.cliente}
              description={p.escopo}
              priority={index < 2}
            />
          ))}
        </div>
      </section>
    </>
  )
}
