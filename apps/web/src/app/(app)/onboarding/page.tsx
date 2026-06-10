import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import { Rocket, Calculator, Fuel, AlertTriangle } from 'lucide-react'
import { OnboardingWizard } from './wizard'

export const metadata: Metadata = { title: 'Configuração Inicial' }

interface Progresso {
  etapa: number
  concluido: boolean
  empresas: { id: string; nome: string; cnpj: string }[]
  empreendimentosCount: number
  usuariosCount: number
}

interface Props {
  searchParams: Promise<{ empreendimentoId?: string }>
}

interface EmpreendimentoOption {
  id: string
  nome: string
  nomeFantasia: string | null
  codigoInterno: string | null
  cidade: string
  estado: string
}

interface OrcamentoPreview {
  empreendimentoId: string
  perfil: {
    porte: string
    situacao: string
    potencialPoluidor: string
    areaM2: number
  }
  premissas: {
    multiplierEmpresa: number
    descontoTotalPercentual: number
    validadePropostaDias: number
  }
  resumo: {
    totalServicos: number
    horasTotais: number
    subtotalTecnico: number
    descontoVolume: number
    totalEstimado: number
    ticketMedio: number
  }
  itens: Array<{
    servicoCodigo: string
    servicoNome: string
    categoria: string
    obrigacaoCodigo: string | null
    statusGap: string | null
    total: number
  }>
  gapsCobertos: Array<{
    codigo: string
    descricao: string
    status: string
    servicoCodigo: string | null
    servicoNome: string | null
  }>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatStatus(status: string | null | undefined) {
  if (status === 'SEM_DADOS') return 'Sem dados'
  if (status === 'A_RENOVAR') return 'A renovar'
  if (status === 'CONFORME') return 'Conforme'
  return status ?? 'N/D'
}

export default async function OnboardingPage({ searchParams }: Props) {
  const { empreendimentoId } = await searchParams
  const token = await getAccessToken()
  if (!token) redirect('/login')

  let progresso: Progresso = {
    etapa: 1,
    concluido: false,
    empresas: [],
    empreendimentosCount: 0,
    usuariosCount: 0,
  }
  let empreendimentos: EmpreendimentoOption[] = []
  let preview: OrcamentoPreview | null = null
  let selectedEmpreendimentoId = empreendimentoId ?? ''

  try {
    const res = await api.get<{ data: Progresso }>('/onboarding/progresso', token)
    progresso = res.data
  } catch { /* inicia do zero */ }

  try {
    const res = await api.get<PaginatedResponse<EmpreendimentoOption>>('/empreendimentos?limit=50', token)
    empreendimentos = res.data
    if (!selectedEmpreendimentoId && empreendimentos[0]) {
      selectedEmpreendimentoId = empreendimentos[0].id
    }
  } catch { /* mantém vazio */ }

  if (selectedEmpreendimentoId) {
    try {
      const res = await api.post<{ data: OrcamentoPreview }>(
        `/onboarding/gap-analysis/${selectedEmpreendimentoId}/orcamento-preview`,
        {},
        token,
      )
      preview = res.data
    } catch {
      preview = null
    }
  }

  const empreendimentoSelecionado = empreendimentos.find((item) => item.id === selectedEmpreendimentoId) ?? null

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      {/* Cabeçalho */}
      <div className="mx-auto max-w-2xl mb-8 text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Configuração Inicial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure o sistema em poucos passos para começar a usar o Hábilis RegPosto.
        </p>
      </div>

      <OnboardingWizard
        etapaInicial={progresso.concluido ? 5 : progresso.etapa}
        empresas={progresso.empresas}
        empreendimentosCount={progresso.empreendimentosCount}
        usuariosCount={progresso.usuariosCount}
      />

      <div className="mx-auto mt-8 max-w-5xl">
        <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b bg-slate-950 text-white px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
                  <Calculator className="h-3.5 w-3.5" />
                  Preview de orçamento diagnóstico
                </div>
                <h2 className="mt-3 text-xl font-bold">Diagnóstico, gaps e composição inicial de proposta</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Visualização local do fluxo novo no `Posto`, usando obrigações base, catálogo de serviços e política de precificação.
                </p>
              </div>

              <form action="/onboarding" className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="text-xs font-medium text-slate-300">
                  Empreendimento
                  <select
                    name="empreendimentoId"
                    defaultValue={selectedEmpreendimentoId}
                    className="mt-1 h-10 min-w-[260px] rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none"
                  >
                    {empreendimentos.map((item) => (
                      <option key={item.id} value={item.id} className="text-slate-950">
                        {(item.codigoInterno ? `${item.codigoInterno} · ` : '') + (item.nomeFantasia ?? item.nome)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  Atualizar preview
                </button>
              </form>
            </div>
          </div>

          {preview && empreendimentoSelecionado ? (
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Fuel className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{empreendimentoSelecionado.nomeFantasia ?? empreendimentoSelecionado.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {(empreendimentoSelecionado.codigoInterno ? `${empreendimentoSelecionado.codigoInterno} · ` : '') +
                        `${empreendimentoSelecionado.cidade}, ${empreendimentoSelecionado.estado}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-2xl border bg-background px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Total estimado</p>
                    <p className="mt-1 text-xl font-black text-orange-600">{formatCurrency(preview.resumo.totalEstimado)}</p>
                  </div>
                  <div className="rounded-2xl border bg-background px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Serviços</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{preview.resumo.totalServicos}</p>
                  </div>
                  <div className="rounded-2xl border bg-background px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Horas técnicas</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{preview.resumo.horasTotais}</p>
                  </div>
                  <div className="rounded-2xl border bg-background px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Validade</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{preview.premissas.validadePropostaDias} dias</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
                <div className="rounded-2xl border bg-background">
                  <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                      <h3 className="text-sm font-semibold">Serviços recomendados para composição inicial</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Multiplicador aplicado: {preview.premissas.multiplierEmpresa} · desconto total: {(preview.premissas.descontoTotalPercentual * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="divide-y">
                    {preview.itens.slice(0, 8).map((item) => (
                      <div key={`${item.servicoCodigo}-${item.obrigacaoCodigo ?? 'sem-gap'}`} className="px-5 py-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950">{item.servicoNome}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.categoria}
                              {item.obrigacaoCodigo ? ` · ${item.obrigacaoCodigo}` : ''}
                              {item.statusGap ? ` · ${formatStatus(item.statusGap)}` : ''}
                            </p>
                          </div>
                          <div className="text-left lg:text-right">
                            <p className="text-sm font-bold text-orange-600">{formatCurrency(item.total)}</p>
                            <p className="text-xs text-muted-foreground">{item.servicoCodigo}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border bg-background p-5">
                    <h3 className="text-sm font-semibold">Resumo financeiro</h3>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subtotal técnico</span>
                        <span className="font-semibold">{formatCurrency(preview.resumo.subtotalTecnico)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Desconto aplicado</span>
                        <span className="font-semibold text-emerald-600">- {formatCurrency(preview.resumo.descontoVolume)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Ticket médio</span>
                        <span className="font-semibold">{formatCurrency(preview.resumo.ticketMedio)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background p-5">
                    <h3 className="text-sm font-semibold">Gaps cobertos</h3>
                    <div className="mt-4 space-y-3">
                      {preview.gapsCobertos.slice(0, 6).map((gap) => (
                        <div key={gap.codigo} className="rounded-xl border bg-muted/20 px-3 py-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{gap.codigo} · {formatStatus(gap.status)}</p>
                              <p className="text-xs text-muted-foreground mt-1">{gap.descricao}</p>
                              {gap.servicoNome && (
                                <p className="text-xs text-primary mt-2">{gap.servicoNome}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-8">
              <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
                Nenhum preview disponível ainda. Isso normalmente indica que a migration/seed nova ainda não foi aplicada no banco local ou que não há empreendimento apto para análise.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
