import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'

export default async function EquipeIndexPage() {
  const token = await getAccessToken()
  if (token) {
    redirect('/equipe/inicio')
  }
  redirect('/equipe/login')
}
