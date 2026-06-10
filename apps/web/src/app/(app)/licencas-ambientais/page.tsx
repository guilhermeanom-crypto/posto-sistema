import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import { CriarLicencaForm } from './criar-licenca-form'
import { ExportarCSV } from '@/components/ui/exportar-csv'

export const metadata: Metadata = { title: 'Licenças Ambientais' }

interface LicencaAmbiental {
  id: string
  tipo: string
  numero: string
  orgaoEmissor: string
  dataEmissao: string
  dataVencimento: string
  status: string
  empreendimento: { id: string; nome: string }
  _count: { condicoes: number }
}

const statusLabel: Record<string, string> = {
  VIGENTE: 'Vigente',
  A_RENOVAR: 'A Renovar',
  VENCIDA: 'Vencida',
  SUSPENSA: 'Suspensa',
  CANCELADA: 'Cancelada',
  EM_RENOVACAO: 'Em Renovação',
}

const statusColor: Record<string, string> = {
  VIGENTE: 'bg-green-100 text-green-800',
  A_RENOVAR: 'bg-yellow-100 text-yellow-800',
  VENCIDA: 'bg-red-100 text-red-800',
  SUSPENSA: 'bg-orange-100 text-orange-800',
  CANCELADA: 'bg-gray-100 text-gray-600',
  EM_RENOVACAO: 'bg-blue-100 text-blue-800',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(dataVencimento: string) {
  const hoje = new Date()
  const venc = new Date(dataVencimento)
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function LicencasAmbientaisPage({ searchParams }: { searchParams: Promise<{ empreendimentoId?: string; status?: string; tipo?: string }> }) {
  const params = await searchParams
  const token = await getAccessToken()

  let licencas: LicencaAmbiental[] = []
  let empreendimentos: { id: string; nome: string }[] = []
  if (token) {
    try {
      const qs = new URLSearchParams({ limit: '50', ...(params.empreendimentoId && { empreendimentoId: params.empreendimentoId }), ...(params.status && { status: params.status }) })
      const [licRes, empRes] = await Promise.all([
        api.get<PaginatedResponse<LicencaAmbiental>>(`/licencas-ambientais?${qs}`, token),
        api.get<PaginatedResponse<{ id: string; nome: string }>>('/empreendimentos?limit=100', token),
      ])
      licencas = licRes.data
      empreendimentos = empRes.data
    } catch {}
  }

  const vigentes = licencas.filter((l) => l.status === 'VIGENTE').length
  const vencidas = licencas.filter((l) => l.status === 'VENCIDA').length
  const aRenovar = licencas.filter((l) => l.status === 'A_RENOVAR').length
  const emRenovacao = licencas.filter((l) => l.status === 'EM_RENOVACAO').length

  const dadosExport = licencas.map((l) => ({
    Tipo: l.tipo, Numero: l.numero, Orgao: l.orgaoEmissor, Empreendimento: l.empreendimento.nome,
    Status: l.status, Emissao: formatDate(l.dataEmissao), Vencimento: formatDate(l.dataVencimento),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Licenças Ambientais</h1>
          <p className="text-muted-foreground text-sm">LO, LI, LP, LAO e demais licenças CETESB</p>
        </div>
        <ExportarCSV dados={dadosExport} nomeArquivo="licencas-ambientais" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">Total</p><p className="text-xl font-bold">{licencas.length}</p></div>
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">Vigentes</p><p className="text-xl font-bold text-green-600">{vigentes}</p></div>
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">A Renovar</p><p className="text-xl font-bold text-yellow-600">{aRenovar}</p></div>
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">Vencidas</p><p className="text-xl font-bold text-red-600">{vencidas}</p></div>
        <div className="rounded-xl border bg-card p-3"><p className="text-[10px] text-muted-foreground">Em Renovação</p><p className="text-xl font-bold text-blue-600">{emRenovacao}</p></div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap items-end gap-2">
        <select name="empreendimentoId" defaultValue={params.empreendimentoId ?? ''} className="rounded-md border bg-background px-2.5 py-1.5 text-xs min-w-[160px]">
          <option value="">Todos os postos</option>
          {empreendimentos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select name="status" defaultValue={params.status ?? ''} className="rounded-md border bg-background px-2.5 py-1.5 text-xs">
          <option value="">Todos os status</option>
          {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Filtrar</button>
        {(params.empreendimentoId || params.status) && <Link href="/licencas-ambientais" className="text-xs text-muted-foreground hover:underline py-1.5">Limpar</Link>}
      </form>

      {/* Formulário de nova licença */}
      <CriarLicencaForm />

      {/* Tabela */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">
            {licencas.length} licença{licencas.length !== 1 ? 's' : ''} cadastrada{licencas.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {licencas.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma licença ambiental cadastrada. Adicione a primeira acima.
          </div>
        ) : (
          <div className="divide-y">
            {licencas.map((lic) => {
              const dias = diasRestantes(lic.dataVencimento)
              return (
                <Link
                  key={lic.id}
                  href={`/licencas-ambientais/${lic.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">
                        {lic.tipo}
                      </span>
                      <span className="text-sm font-medium truncate">{lic.numero}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[lic.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {statusLabel[lic.status] ?? lic.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">{lic.empreendimento.nome}</span>
                      <span className="text-xs text-muted-foreground">{lic.orgaoEmissor}</span>
                      {lic._count.condicoes > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {lic._count.condicoes} condição{lic._count.condicoes !== 1 ? 'ões' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Vence em</p>
                    <p className="text-sm font-medium">{formatDate(lic.dataVencimento)}</p>
                    {dias >= 0 && dias <= 90 && (
                      <p className={`text-xs font-medium ${dias <= 30 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {dias} dia{dias !== 1 ? 's' : ''}
                      </p>
                    )}
                    {dias < 0 && (
                      <p className="text-xs font-medium text-red-600">Vencida há {Math.abs(dias)} dias</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
