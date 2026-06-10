import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { AREAS_ATUACAO, NUMEROS, VALORES_HABILIS } from '@/lib/content'
import { VisualPanel } from '@/components/visual-panel'

export const metadata = { title: 'Sobre a Hábilis · Hábilis Ambiental' }

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre a Hábilis"
        scene="sobre"
        title="Uma consultoria que lê operação, território e patrimônio na mesma conversa."
        subtitle="A Hábilis não nasceu para acumular PDFs. Nasceu para transformar exigência regulatória, leitura de campo e documentação em direção executável para o cliente."
      />

      <section className="container-x py-24">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6 text-base leading-relaxed text-muted-foreground">
            <p>
              Nossa origem institucional conversa com patrimônio cultural brasileiro, licenciamento
              arqueológico e frentes especiais em infraestrutura, energia e mineração. A evolução
              recente da operação ampliou a casa para uma leitura mais clara de ativos,
              territórios, documentos e rotinas multiempreendimento.
            </p>
            <p>
              Esse movimento não diminuiu a largura da Hábilis. Pelo contrário: organizou melhor o
              que sempre existiu. Hoje operamos com mais clareza quatro eixos complementares:
              licenciamento e governança ambiental, território e rural, patrimônio cultural e
              programas associados ao IPHAN, além da gestão regulatória de operações recorrentes.
            </p>
            <p>
              O diferencial está em como conectamos tudo isso. A leitura técnica nasce em campo,
              passa por norma e documento, encontra o ritmo operacional do cliente e vira próximo
              passo. Sem espetáculo vazio. Sem relatório que não ajuda a decidir.
            </p>
          </div>

          <VisualPanel
            image="/images/habilis/hero-inteligencia-regulatoria-multissetorial.png"
            imageAlt="Frentes multissetoriais da Hábilis em licenciamento, operação, território e patrimônio."
            eyebrow="Modo de atuação"
            title="Técnica com cadência de execução"
            description="Cada frente entra num fluxo claro: diagnóstico, priorização, cronograma, documentação, interface com órgão e devolutiva executiva."
            priority
          />
        </div>
      </section>

      <section className="bg-background/60 py-24">
        <div className="container-x">
          <p className="eyebrow">Quatro eixos</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">
            A capacidade instalada da Hábilis é mais ampla do que uma frente isolada
          </h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {AREAS_ATUACAO.map((area) => (
              <div key={area.id} className="trace-panel p-7">
                <p className="eyebrow text-primary">{area.label}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {area.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{area.resumo}</p>
                <ul className="mt-5 grid gap-2 text-sm text-muted-foreground">
                  {area.itens.slice(0, 3).map((item) => (
                    <li key={item.slug} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                      <span>{item.titulo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-24">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {NUMEROS.map((n) => (
            <div key={n.label} className="card p-6">
              <p className="text-3xl font-black tracking-tight text-primary">{n.valor}</p>
              <p className="mt-2 text-sm text-muted-foreground">{n.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-24">
        <div className="container-x">
          <p className="eyebrow">Valores</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
            O que sustenta a tomada de decisão na Hábilis
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {VALORES_HABILIS.map((v) => (
              <div key={v.titulo} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground">{v.titulo}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-24">
        <div className="section-shell p-12 sm:p-16">
          <div className="relative">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Quer entender qual frente da Hábilis conversa com o seu cenário?
            </h2>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground">
              A conversa pode começar por um posto, um ativo rural, uma exigência do IPHAN ou um
              passivo de licenciamento. O nosso papel é organizar a leitura e apontar o próximo
              passo viável.
            </p>
            <Link href="/contato" className="btn-primary mt-8">
              Falar com a equipe técnica <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
