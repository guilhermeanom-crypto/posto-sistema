import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import { NovoTreinamentoForm } from './novo-treinamento-form'

export const metadata: Metadata = { title: 'Registrar Treinamento' }

interface TreinamentoTipo { id: string; nome: string; normativa: string; cargaHoraria: number; periodicidadeMeses: number; obrigatorioParaCargos: string[] }
interface Empreendimento { id: string; nome: string }
interface Funcionario { id: string; nome: string; cargo: string; empreendimentoId: string }

export default async function NovoTreinamentoPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  let tipos: TreinamentoTipo[] = []
  let empreendimentos: Empreendimento[] = []
  let funcionarios: Funcionario[] = []

  try {
    const [resTipos, resEmp, resFunc] = await Promise.all([
      api.get<{ data: TreinamentoTipo[] }>('/sst/treinamentos/tipos', token),
      api.get<PaginatedResponse<Empreendimento>>('/empreendimentos?limit=100', token),
      api.get<PaginatedResponse<Funcionario>>('/sst/funcionarios?limit=500&ativo=true', token),
    ])
    tipos = resTipos.data
    empreendimentos = resEmp.data
    funcionarios = resFunc.data.map((f: any) => ({ id: f.id, nome: f.nome, cargo: f.cargo, empreendimentoId: f.empreendimento?.id ?? f.empreendimentoId }))
  } catch {}

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/sst" className="hover:underline">SST</Link>
        <span>/</span>
        <Link href="/sst/treinamentos" className="hover:underline">Treinamentos</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Registrar</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Registrar Treinamento</h1>
      <NovoTreinamentoForm tipos={tipos} empreendimentos={empreendimentos} funcionarios={funcionarios} />
    </div>
  )
}
