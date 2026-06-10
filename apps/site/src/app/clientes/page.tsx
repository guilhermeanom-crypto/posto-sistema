import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { CLIENTES_PARCEIROS, SETORES_ATUACAO } from '@/lib/content'

export const metadata = { title: 'Clientes · Hábilis Ambiental' }

export default function ClientesPage() {
  return (
    <>
      <PageHero
        eyebrow="Clientes"
        scene="clientes"
        title="Clientes que precisam de direção técnica, não só de documentação."
        subtitle="A Hábilis atua quando o ativo exige leitura regulatória séria, coordenação entre frentes e uma devolutiva que oriente a próxima decisão."
      />

      <section className="container-x py-24">
        <div className="grid gap-5 lg:grid-cols-3">
          {SETORES_ATUACAO.map((setor) => (
            <article key={setor.titulo} className="trace-panel p-6">
              <p className="eyebrow text-primary">Setor atendido</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{setor.titulo}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{setor.resumo}</p>
            </article>
          ))}
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CLIENTES_PARCEIROS.map((c) => (
            <li
              key={c}
              className="grid min-h-28 place-items-center rounded-2xl border border-border bg-white px-4 py-5 text-center text-sm font-semibold text-foreground shadow-sm"
            >
              {c}
            </li>
          ))}
        </ul>

        <div className="mt-20 section-shell p-12">
          <div className="relative">
            <p className="eyebrow">Como nos escolhem</p>
            <blockquote className="mt-5 text-2xl leading-snug text-foreground sm:text-3xl">
              “O valor da Hábilis aparece quando o projeto para de caber em uma disciplina só e
              passa a exigir coordenação entre norma, campo, documento e prazo.”
            </blockquote>
            <p className="mt-6 text-sm font-semibold text-muted-foreground">
              Síntese do perfil de cliente que mais combina com a casa
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-muted-foreground">
            Quer entender se a Hábilis faz sentido para o seu cenário?
          </p>
          <Link href="/contato" className="btn-primary">
            Falar com a equipe <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
