import { redirect } from 'next/navigation'
import { getSessao } from '@/lib/auth'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getSessao()
  if (!sessao) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar sessao={sessao} />
      <main className="flex-1 overflow-y-auto main-bg flex flex-col">
        <AppHeader />
        <div className="py-7 px-6 xl:px-10 w-full flex-1">{children}</div>
      </main>
    </div>
  )
}
