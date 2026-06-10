import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { NovoProcessoForm } from './novo-processo-form'

export const metadata: Metadata = { title: 'Novo Processo' }

export default async function NovoProcessoPage() {
  const token = await getAccessToken()

  const [empreendimentos, tiposProcesso, usuarios] = await Promise.all([
    token
      ? api
          .get<{ data: any[] }>('/empreendimentos?limit=100', token)
          .then((r) => r.data)
          .catch(() => [])
      : Promise.resolve([]),
    token
      ? api
          .get<{ data: any[] }>('/config/tipos-processo', token)
          .then((r) => r.data)
          .catch(() => [])
      : Promise.resolve([]),
    token
      ? api
          .get<{ data: any[] }>('/usuarios?limit=100&ativo=true', token)
          .then((r) => r.data)
          .catch(() => [])
      : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/processos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Processos
        </Link>
        <PageHeader
          title="Novo Processo Regulatório"
          description="Abra um processo vinculado a um empreendimento e tipo de licença."
        />
      </div>

      <NovoProcessoForm
        empreendimentos={empreendimentos}
        tiposProcesso={tiposProcesso}
        usuarios={usuarios}
      />
    </div>
  )
}
