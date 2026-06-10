import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import { HardHat, AlertTriangle } from 'lucide-react'
import { RegistrarEPIForm } from './registrar-epi-form'

export const metadata: Metadata = { title: 'EPIs — Equipamentos de Proteção Individual' }

interface EPI {
  id: string
  tipoEPI: string
  ca: string | null
  quantidade: number
  dataEntrega: string
  dataVencimento: string | null
  status: string
  funcionario: { id: string; nome: string }
  empreendimento: { id: string; nome: string }
}

const statusColor: Record<string, string> = {
  VIGENTE: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-red-100 text-red-800',
  DEVOLVIDO: 'bg-gray-100 text-gray-600',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(data: string | null) {
  if (!data) return null
  return Math.ceil((new Date(data).getTime() - Date.now()) / 86400000)
}

interface Empreendimento { id: string; nome: string }
interface FuncOption { id: string; nome: string; empreendimentoId: string }

export default async function EPIsPage() {
  const token = await getAccessToken()
  let epis: EPI[] = []
  let empreendimentos: Empreendimento[] = []
  let funcionarios: FuncOption[] = []

  if (token) {
    const [resEPI, resEmp, resFunc] = await Promise.allSettled([
      api.get<PaginatedResponse<EPI>>('/sst/epis?limit=100', token),
      api.get<PaginatedResponse<Empreendimento>>('/empreendimentos?limit=100', token),
      api.get<PaginatedResponse<FuncOption>>('/sst/funcionarios?limit=500&ativo=true', token),
    ])
    if (resEPI.status === 'fulfilled') epis = resEPI.value.data
    if (resEmp.status === 'fulfilled') empreendimentos = resEmp.value.data
    if (resFunc.status === 'fulfilled') funcionarios = resFunc.value.data.map((f: any) => ({ id: f.id, nome: f.nome, empreendimentoId: f.empreendimento?.id ?? f.empreendimentoId }))
  }

  const vencidos = epis.filter((e) => e.status === 'VENCIDO')
  const vigentes = epis.filter((e) => e.status === 'VIGENTE')
  const vencendo30 = epis.filter((e) => {
    const d = diasRestantes(e.dataVencimento)
    return d !== null && d >= 0 && d <= 30
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/sst" className="hover:underline">SST</Link>
          <span>/</span>
          <span className="text-foreground font-medium">EPIs</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HardHat className="h-6 w-6 text-orange-600" />
          EPIs — Equipamentos de Proteção Individual
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {epis.length} entrega{epis.length !== 1 ? 's' : ''} registrada{epis.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Entregas</p>
          <p className="text-2xl font-bold mt-1">{epis.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vigentes</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{vigentes.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vencendo (30d)</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{vencendo30.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vencidos</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{vencidos.length}</p>
        </div>
      </div>

      <RegistrarEPIForm empreendimentos={empreendimentos} funcionarios={funcionarios} />

      {vencidos.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            {vencidos.length} EPI{vencidos.length !== 1 ? 's' : ''} com validade vencida — providencie substituição.
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {epis.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhum EPI registrado.</div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>EPI / Funcionário</span>
              <span className="w-24 text-center">Entrega</span>
              <span className="w-24 text-center">Vencimento</span>
              <span className="w-20 text-center">Status</span>
            </div>
            <div className="divide-y">
              {epis.map((epi) => {
                const dias = diasRestantes(epi.dataVencimento)
                return (
                  <div key={epi.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{epi.tipoEPI}</span>
                        {epi.ca && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">CA {epi.ca}</span>}
                        <span className="text-[10px] text-muted-foreground">x{epi.quantidade}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{epi.funcionario.nome}</span>
                        <span className="text-xs text-muted-foreground">· {epi.empreendimento.nome}</span>
                      </div>
                    </div>
                    <span className="w-24 text-center text-xs text-muted-foreground">{formatDate(epi.dataEntrega)}</span>
                    <div className="w-24 text-center">
                      <p className="text-xs">{formatDate(epi.dataVencimento)}</p>
                      {dias !== null && dias < 0 && <p className="text-[10px] text-red-600 font-medium">Vencido</p>}
                      {dias !== null && dias >= 0 && dias <= 30 && <p className="text-[10px] text-yellow-600 font-medium">{dias}d</p>}
                    </div>
                    <div className="w-20 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[epi.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {epi.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
