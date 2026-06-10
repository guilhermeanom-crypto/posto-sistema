import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { CONTATO } from '@/lib/content'
import { VisualPanel } from '@/components/visual-panel'

export const metadata = { title: 'Contato · Hábilis Ambiental' }

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        scene="contato"
        title="Vamos entender o ativo, a frente crítica e o próximo passo."
        subtitle="A conversa pode começar por território, patrimônio cultural, regularização fundiária, licenciamento ou operação documental. O importante é sair com direção."
      />

      <section className="container-x grid gap-12 py-24 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <VisualPanel
            image="/images/habilis/sistema-habilis-dashboard-regulatorio.png"
            imageAlt="Sistema Hábilis em operação apoiando a primeira conversa técnica."
            eyebrow="Primeira conversa"
            title="Sem proposta genérica"
            description="Começamos entendendo o tipo de ativo, o estágio da demanda e onde o cenário trava: órgão, prazo, documento, território, passivo ou operação."
            priority
          />

          <ul className="trace-panel p-6 space-y-5">
            <li className="flex gap-4">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Endereço</p>
                <p className="mt-1 text-sm text-foreground">{CONTATO.endereco}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Telefone</p>
                <p className="mt-1 text-sm text-foreground">{CONTATO.telefone}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">WhatsApp</p>
                <a
                  href={`https://wa.me/${CONTATO.whatsapp}?text=Olá,%20venho%20através%20do%20site,%20quero%20mais%20informações`}
                  className="mt-1 inline-block text-sm font-semibold text-primary hover:text-primary/80"
                >
                  Iniciar conversa
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">E-mail</p>
                <p className="mt-1 text-sm text-foreground">{CONTATO.email}</p>
              </div>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">{CONTATO.horario}</p>
        </div>

        <form className="trace-panel p-8">
          <p className="eyebrow">Formulário de contato</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">Conte sobre o cenário</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nome" name="nome" required />
            <Field label="Empresa / ativo" name="empresa" required />
            <Field label="E-mail" type="email" name="email" required />
            <Field label="Telefone / WhatsApp" name="telefone" />
            <Field label="Estado de operação" name="uf" placeholder="GO, MT, PA..." />
            <Field label="Frente principal" name="frente" placeholder="Postos, CAR, patrimônio..." />
          </div>
          <label className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Mensagem
            <textarea
              name="mensagem"
              rows={5}
              className="mt-2 w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Descreva o ativo, a frente regulatória e onde o cenário parece travado hoje."
            />
          </label>
          <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="mt-0.5" />
            <span>Aceito a política de privacidade e o tratamento dos dados informados.</span>
          </label>
          <button type="submit" className="btn-primary mt-6 w-full">
            Enviar
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
  required,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
      {label}
      {required ? <span className="text-primary"> *</span> : null}
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  )
}
