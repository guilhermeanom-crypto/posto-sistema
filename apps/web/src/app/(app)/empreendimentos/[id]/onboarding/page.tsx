import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { Building2, Fuel, MapPin, CheckCircle2 } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { OnboardingWizard } from './onboarding-wizard'

export const metadata: Metadata = { title: 'Diagnóstico Regulatório' }

interface Props {
  params: Promise<{ id: string }>
}

interface Empreendimento {
  id: string
  nome: string
  nomeFantasia: string | null
  cidade: string
  estado: string
  tipo: string | null
}

interface ItemGap {
  codigo: string
  modulo: string
  descricao: string
  fundamentoLegal: string | null
  periodicidade: string
  criticidade: string
  status: 'CONFORME' | 'A_RENOVAR' | 'SEM_DADOS' | 'NAO_APLICAVEL'
  tipoDocumentoRef: string | null
  observacoes: string | null
  diasAlertaAntes: number[]
  evidencia: {
    tipo: string
    referencia: string
    dataVencimento: string | null
    diasRestantes: number | null
  } | null
}

interface GapAnalysis {
  empreendimentoId: string
  tipoEmpreendimento: string
  uf: string
  analisadoEm: string
  totalObrigacoes: number
  conformes: number
  aRenovar: number
  semDados: number
  naoAplicaveis: number
  scoreBase: number
  itens: ItemGap[]
}

const STEPS = [
  { numero: 1, label: 'Identificação', icone: Building2, ativo: false },
  { numero: 2, label: 'Diagnóstico',   icone: Fuel,      ativo: true  },
  { numero: 3, label: 'Plano de ação', icone: MapPin,    ativo: false },
  { numero: 4, label: 'Confirmação',   icone: CheckCircle2, ativo: false },
]

export default async function OnboardingPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) redirect('/login')

  let empreendimento: Empreendimento | null = null
  let gapAnalysis: GapAnalysis | null = null

  try {
    const res = await api.get<{ data: Empreendimento }>(`/empreendimentos/${id}`, token)
    empreendimento = res.data
  } catch {
    notFound()
  }

  try {
    const res = await api.get<{ data: GapAnalysis }>(`/onboarding/gap-analysis/${id}`, token)
    gapAnalysis = res.data
  } catch { /* continua sem gap analysis */ }

  if (!empreendimento) notFound()

  const moduloLabel: Record<string, string> = {
    AMBIENTAL: 'Ambiental',
    ANP: 'ANP / INMETRO',
    SST: 'Saúde e Segurança',
    URBANISTICO: 'Urbanístico / Bombeiros',
    MONITORAMENTO: 'Monitoramento',
    LOGISTICA_REVERSA: 'Logística Reversa',
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Cabeçalho */}
      <div>
        <p className="text-sm text-muted-foreground">Cadastro de novo posto</p>
        <h1 className="text-2xl font-bold tracking-tight">{empreendimento.nomeFantasia ?? empreendimento.nome}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {empreendimento.cidade} / {empreendimento.estado}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => (
          <div key={step.numero} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  step.numero < 2
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : step.ativo
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {step.numero < 2 ? '✓' : step.numero}
              </div>
              <span className={`text-xs font-medium ${step.ativo ? 'text-primary' : step.numero < 2 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mx-2 h-px flex-1 ${step.numero < 2 ? 'bg-emerald-300' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Conteúdo: gap analysis + wizard client */}
      {gapAnalysis ? (
        <>
          {/* KPIs do diagnóstico */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{gapAnalysis.conformes}</div>
              <div className="text-xs text-muted-foreground mt-1">Conformes</div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-amber-500">{gapAnalysis.aRenovar}</div>
              <div className="text-xs text-muted-foreground mt-1">A renovar</div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{gapAnalysis.semDados}</div>
              <div className="text-xs text-muted-foreground mt-1">Sem evidência</div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className={`text-2xl font-bold ${gapAnalysis.scoreBase >= 70 ? 'text-emerald-600' : gapAnalysis.scoreBase >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                {gapAnalysis.scoreBase}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Score base</div>
            </div>
          </div>

          {/* Tabela de gaps por módulo */}
          {Object.entries(
            gapAnalysis.itens.reduce<Record<string, ItemGap[]>>((acc, item) => {
              if (!acc[item.modulo]) acc[item.modulo] = []
              acc[item.modulo]!.push(item)
              return acc
            }, {}),
          ).map(([modulo, itens]) => {
            const semDados = itens.filter((i) => i.status === 'SEM_DADOS').length
            const aRenovar = itens.filter((i) => i.status === 'A_RENOVAR').length
            const conformes = itens.filter((i) => i.status === 'CONFORME').length

            return (
              <div key={modulo} className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                  <span className="font-semibold text-sm">{moduloLabel[modulo] ?? modulo}</span>
                  <div className="flex gap-2 text-xs">
                    {conformes > 0 && <span className="text-emerald-600 font-medium">{conformes} ok</span>}
                    {aRenovar > 0 && <span className="text-amber-500 font-medium">{aRenovar} renovar</span>}
                    {semDados > 0 && <span className="text-red-500 font-medium">{semDados} faltando</span>}
                  </div>
                </div>
                <div className="divide-y">
                  {itens.filter((i) => i.status !== 'NAO_APLICAVEL').map((item) => (
                    <div key={item.codigo} className="flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5 shrink-0">
                        {item.status === 'CONFORME' && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                        )}
                        {item.status === 'A_RENOVAR' && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs">!</span>
                        )}
                        {item.status === 'SEM_DADOS' && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs">✕</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{item.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.criticidade === 'CRITICA' && <span className="text-red-600 font-medium mr-1">Crítica</span>}
                          {item.criticidade === 'ALTA' && <span className="text-orange-600 font-medium mr-1">Alta</span>}
                          {item.criticidade === 'MEDIA' && <span className="text-yellow-600 font-medium mr-1">Média</span>}
                          · {item.periodicidade.toLowerCase()}
                        </p>
                        {item.evidencia && (
                          <p className="text-xs text-emerald-700 mt-0.5">
                            {item.evidencia.tipo}: {item.evidencia.referencia}
                            {item.evidencia.diasRestantes !== null && (
                              <span className={item.evidencia.diasRestantes < 0 ? ' text-red-600' : ' text-muted-foreground'}>
                                {' '}({item.evidencia.diasRestantes < 0 ? `venceu há ${Math.abs(item.evidencia.diasRestantes)}d` : `vence em ${item.evidencia.diasRestantes}d`})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Wizard client — Steps 3 e 4 */}
          <OnboardingWizard empreendimentoId={id} gapAnalysis={gapAnalysis} />
        </>
      ) : (
        <div className="rounded-lg border bg-muted/20 px-6 py-10 text-center text-muted-foreground">
          <p className="font-medium">Não foi possível carregar o diagnóstico regulatório.</p>
          <p className="mt-1 text-sm">Verifique o catálogo de obrigações e tente novamente.</p>
          <a
            href={`/empreendimentos/${id}`}
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Ir para o hub do posto
          </a>
        </div>
      )}
    </div>
  )
}
