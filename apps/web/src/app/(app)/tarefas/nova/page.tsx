import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import Link from 'next/link'
import { NovaTarefaForm } from './nova-tarefa-form'

export const metadata: Metadata = { title: 'Nova Tarefa' }

interface Empreendimento { id: string; nome: string }
interface Usuario { id: string; nome: string }

export default async function NovaTarefaPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  let empreendimentos: Empreendimento[] = []
  let usuarios: Usuario[] = []

  try {
    const [empRes, usrRes] = await Promise.all([
      api.get<PaginatedResponse<Empreendimento>>('/empreendimentos?limit=100', token),
      api.get<PaginatedResponse<Usuario>>('/usuarios?limit=100', token),
    ])
    empreendimentos = empRes.data
    usuarios = usrRes.data
  } catch {}

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Link href="/tarefas" className="hover:underline">Tarefas</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Nova Tarefa</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Nova Tarefa Manual</h1>
      <NovaTarefaForm empreendimentos={empreendimentos} usuarios={usuarios} />
    </div>
  )
}
