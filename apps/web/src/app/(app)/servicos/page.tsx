import type { Metadata } from 'next'
import {
  BadgeDollarSign,
  Clock,
  FileText,
  Leaf,
  PackageCheck,
  Recycle,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { api, type PaginatedResponse } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import { moeda } from '@/lib/format'

export const metadata: Metadata = { title: 'Serviços' }

type ServicoCatalogoApi = {
  id: string
  codigo: string
  nome: string
  descricao: string
  categoria: string
  subcategoria: string | null
  horasTecnicasBase: unknown
  precoBase: unknown
  recorrente: boolean
  mesesRecorrencia: number | null
}

type ServicoView = {
  id: string
  codigo: string
  nome: string
  categoria: string
  modulo: string
  recorrente: boolean
  horas: number
  precoBase: number
  slaDias: number
  icon: LucideIcon
  entregaveis: string[]
}

const ICONES_POR_CATEGORIA: Array<[string, LucideIcon]> = [
  ['resid', Recycle],
  ['sst', Users],
  ['ambient', Leaf],
  ['licen', Leaf],
  ['compliance', ShieldCheck],
  ['relat', FileText],
]

function numero(valor: unknown) {
  if (typeof valor === 'number') return valor
  if (typeof valor === 'string') return Number(valor)
  if (valor && typeof valor === 'object' && 'toString' in valor) return Number(valor.toString())
  return 0
}

function iconeServico(categoria: string, nome: string) {
  const texto = `${categoria} ${nome}`.toLowerCase()
  return ICONES_POR_CATEGORIA.find(([termo]) => texto.includes(termo))?.[1] ?? BadgeDollarSign
}

function mapServico(servico: ServicoCatalogoApi): ServicoView {
  const horas = numero(servico.horasTecnicasBase)
  const precoBase = numero(servico.precoBase)

  return {
    id: servico.id,
    codigo: servico.codigo,
    nome: servico.nome,
    categoria: servico.categoria,
    modulo: servico.subcategoria ?? servico.codigo,
    recorrente: servico.recorrente,
    horas,
    precoBase,
    slaDias: servico.mesesRecorrencia ? servico.mesesRecorrencia * 30 : 30,
    icon: iconeServico(servico.categoria, servico.nome),
    entregaveis: [
      servico.descricao,
      `Código comercial ${servico.codigo}`,
      servico.recorrente ? 'Contrato recorrente' : 'Escopo avulso',
    ].filter(Boolean),
  }
}

async function carregarServicos() {
  const token = await getAccessToken()
  if (!token) return []

  const response = await api.get<PaginatedResponse<ServicoCatalogoApi>>('/comercial/catalogo?limit=100', token)
  return response.data.map(mapServico)
}

export default async function ServicosPage() {
  const servicosCatalogo = await carregarServicos()
  const recorrentes = servicosCatalogo.filter((s) => s.recorrente).length
  const ticketMedio =
    servicosCatalogo.length > 0
      ? servicosCatalogo.reduce((acc, s) => acc + s.precoBase, 0) / servicosCatalogo.length
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Catálogo interno</p>
          <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
          <p className="mt-1 text-sm text-muted-foreground">Base técnica para orçamento, contratos e ordens de serviço.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Kpi label="Recorrentes" value={recorrentes} />
          <Kpi label="Ticket médio" value={moeda(ticketMedio)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {servicosCatalogo.length === 0 ? (
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground lg:col-span-3">
            Nenhum serviço disponível para a sessão atual.
          </div>
        ) : servicosCatalogo.map((servico) => {
          const Icon = servico.icon
          return (
            <article key={servico.id} className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{servico.nome}</h2>
                    <p className="text-xs text-muted-foreground">{servico.categoria} · {servico.modulo}</p>
                  </div>
                </div>
                <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  {servico.recorrente ? 'Recorrente' : 'Avulso'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <SmallMetric label="Horas" value={`${servico.horas}h`} />
                <SmallMetric label="SLA" value={`${servico.slaDias}d`} />
                <SmallMetric label="Base" value={moeda(servico.precoBase)} />
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Entregáveis</p>
                {servico.entregaveis.map((entregavel) => (
                  <div key={entregavel} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <PackageCheck className="h-3.5 w-3.5 text-primary" />
                    {entregavel}
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-right">
      <p className="text-xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  )
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <Clock className="mb-1 h-3.5 w-3.5 text-muted-foreground" />
      <p className="truncate text-sm font-bold">{value}</p>
      <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </div>
  )
}
