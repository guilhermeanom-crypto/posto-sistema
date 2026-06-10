import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | Portal Hábilis Posto', default: 'Portal Hábilis Posto' },
  description: 'Portal do representante do posto',
}

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      {children}
    </div>
  )
}
