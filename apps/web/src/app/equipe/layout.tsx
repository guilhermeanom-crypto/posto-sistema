import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | Equipe Hábilis Posto', default: 'Equipe Hábilis Posto' },
  description: 'Ambiente operacional da equipe de campo Hábilis: OS, vistorias, checklist e evidências.',
}

export default function EquipeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      {children}
    </div>
  )
}
