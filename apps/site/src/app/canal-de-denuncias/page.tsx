import { PageHero } from '@/components/page-hero'
import { ShieldCheck, Lock, Mail } from 'lucide-react'
import { CONTATO } from '@/lib/content'

export const metadata = { title: 'Canal de Denúncias · Hábilis Ambiental' }

export default function CanalDeDenunciasPage() {
  return (
    <>
      <PageHero
        eyebrow="Canal de Denúncias"
        scene="canal-de-denuncias"
        title="Ambiente seguro para reportar condutas indevidas."
        subtitle="Manter a integridade da Hábilis é responsabilidade compartilhada. Este canal é confidencial e independente, recebe relatos de qualquer público interno ou externo."
      />

      <section className="container-x grid gap-12 py-24 lg:grid-cols-[1fr_1.2fr]">
        <aside className="space-y-6">
          {[
            {
              Icon: Lock,
              titulo: 'Sigilo absoluto',
              texto:
                'A identidade do denunciante é protegida. Os relatos são tratados apenas pelo Comitê de Ética interno.',
            },
            {
              Icon: ShieldCheck,
              titulo: 'Sem represália',
              texto:
                'Denúncias feitas de boa-fé não geram retaliação. A Hábilis garante proteção integral ao denunciante.',
            },
            {
              Icon: Mail,
              titulo: 'Resposta formal',
              texto:
                'Todo relato gera um protocolo. Você acompanha o andamento e recebe um retorno técnico ao final.',
            },
          ].map(({ Icon, titulo, texto }) => (
            <div key={titulo} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-base font-bold text-foreground">{titulo}</p>
              <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
            </div>
          ))}
        </aside>

        <form className="rounded-xl border border-border bg-white p-8 shadow-sm">
          <p className="eyebrow">Registrar denúncia</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">Descreva os fatos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você pode se identificar ou enviar de forma anônima. Quanto mais detalhe, melhor a apuração.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nome (opcional)" name="nome" />
            <Field label="E-mail para retorno (opcional)" name="email" type="email" />
            <Field label="Empresa / local dos fatos" name="empresa" />
            <Field label="Quando ocorreu" name="data" type="date" />
          </div>

          <label className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Descrição dos fatos <span className="text-primary">*</span>
            <textarea
              name="relato"
              rows={6}
              required
              className="mt-2 w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="O que aconteceu? Quem estava envolvido? Há documentos ou testemunhas?"
            />
          </label>

          <p className="mt-4 text-xs text-muted-foreground">
            Em caso de urgência, envie diretamente para{' '}
            <a href={`mailto:${CONTATO.email}`} className="font-semibold text-primary">{CONTATO.email}</a>.
          </p>

          <button type="submit" className="btn-primary mt-6 w-full">
            Enviar denúncia
          </button>
        </form>
      </section>
    </>
  )
}

function Field({
  label,
  name,
  type = 'text',
}: {
  label: string
  name: string
  type?: string
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
      {label}
      <input
        type={type}
        name={name}
        className="mt-2 w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  )
}
