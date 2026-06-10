import Link from 'next/link'
import { Instagram, Facebook, Youtube, Linkedin } from 'lucide-react'
import { CONTATO, NAV, SISTEMA_CAMPO_URL, SISTEMA_EQUIPE_URL, SISTEMA_PORTAL_URL, SISTEMA_URL } from '@/lib/content'
import { BrandSignature } from './brand-signature'
import { HabilisTrace } from './habilis-trace'

export function Footer() {
  return (
    <footer className="border-t bg-background/35 backdrop-blur-[2px]">
      <div className="container-x py-16">
        <div className="section-shell px-6 py-8 sm:px-8">
          <HabilisTrace className="absolute -right-10 top-0 h-28 w-80 opacity-70" />
          <div className="relative grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex" aria-label="Hábilis — início">
            <BrandSignature size="sm" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Inteligência regulatória e ambiental aplicada a empreendimentos, ativos territoriais,
            frentes patrimoniais e operações com alta exigência documental.
          </p>
          <div className="mt-6 flex gap-2">
            {[
              { icon: Instagram, label: 'Instagram' },
              { icon: Facebook, label: 'Facebook' },
              { icon: Linkedin, label: 'LinkedIn' },
              { icon: Youtube, label: 'YouTube' },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-8 w-8 place-items-center rounded-md border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Navegação</p>
          <ul className="mt-4 space-y-2.5">
            {NAV.slice(0, 5).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Institucional</p>
          <ul className="mt-4 space-y-2.5">
            {NAV.slice(5).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={SISTEMA_URL}
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Entradas do sistema
              </Link>
            </li>
            <li>
              <Link
                href={SISTEMA_EQUIPE_URL}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sistema interno
              </Link>
            </li>
            <li>
              <Link
                href={SISTEMA_CAMPO_URL}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Área de campo
              </Link>
            </li>
            <li>
              <Link
                href={SISTEMA_PORTAL_URL}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Portal do cliente
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Contato</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="leading-relaxed">{CONTATO.endereco}</li>
            <li className="tabular-nums">{CONTATO.telefone}</li>
            <li>{CONTATO.email}</li>
            <li className="pt-2 text-[10px] uppercase tracking-[0.18em]">{CONTATO.horario}</li>
          </ul>
        </div>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="container-x flex flex-col items-start justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Hábilis Consultoria — Todos os direitos reservados.</p>
          <p>Condução regulatória e ambiental para operações complexas.</p>
        </div>
      </div>
    </footer>
  )
}
