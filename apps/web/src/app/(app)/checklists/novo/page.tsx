import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { redirect } from 'next/navigation'
import { IniciarChecklistForm } from './iniciar-form'

export const metadata: Metadata = { title: 'Iniciar Checklist' }

interface Props {
  searchParams: Promise<{ templateId?: string }>
}

export default async function NovoChecklistPage({ searchParams }: Props) {
  const { templateId } = await searchParams
  const token = await getAccessToken()
  if (!token) redirect('/login')

  let template: any = null
  let empreendimentos: any[] = []

  if (templateId && token) {
    try {
      const [tmplRes, empRes] = await Promise.all([
        api.get<{ data: any }>(`/checklists/templates/${templateId}`, token),
        api.get<{ data: any[] }>('/empreendimentos?limit=100&ativo=true', token),
      ])
      template = tmplRes.data
      empreendimentos = empRes.data
    } catch {}
  }

  if (!template) {
    redirect('/checklists')
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Link href="/checklists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Checklists
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Iniciar Checklist</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{template.nome}</p>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <IniciarChecklistForm template={template} empreendimentos={empreendimentos} />
      </div>
    </div>
  )
}
