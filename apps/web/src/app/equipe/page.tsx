import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function EquipeIndexPage() {
  const c = await cookies()
  if (c.get('habilis_equipe')) {
    redirect('/equipe/inicio')
  }
  redirect('/equipe/login')
}
