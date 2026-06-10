import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { SiteAtmosphere } from '@/components/site-atmosphere'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Hábilis Ambiental',
    default: 'Hábilis Ambiental — Operações regulatórias, territoriais e patrimoniais',
  },
  description:
    'A Hábilis conduz operações ambientais, territoriais e patrimoniais para empreendimentos de diferentes perfis, com atuação em licenciamento, CAR, regularização fundiária, inventários e projetos especiais.',
  metadataBase: new URL('https://habilisconsultoria.com.br'),
  openGraph: {
    title: 'Hábilis Ambiental',
    description:
      'Condução regulatória e ambiental para empreendimentos de diferentes perfis, com sistema próprio, motor de decisão e portal do cliente.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans">
        <SiteAtmosphere scene="home" />
        <Header />
        <main className="relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
