import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import Link from 'next/link'
import { NovoFuncionarioForm } from './novo-funcionario-form'

export const metadata: Metadata = { title: 'Novo Funcionário' }

interface Empreendimento { id: string; nome: string }

export default async function NovoFuncionarioPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  let empreendimentos: Empreendimento[] = []
  try {
    const res = await api.get<PaginatedResponse<Empreendimento>>('/empreendimentos?limit=100', token)
    empreendimentos = res.data
  } catch {}

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Link href="/funcionarios" className="hover:underline">Funcionários</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Novo</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Cadastrar Funcionário</h1>
      <NovoFuncionarioForm empreendimentos={empreendimentos} />
    </div>
  )
}
