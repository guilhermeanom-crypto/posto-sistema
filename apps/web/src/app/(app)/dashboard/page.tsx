import type { Metadata } from 'next'
import { getSessao, getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Activity, Clock, AlertTriangle, Scale, ShieldAlert, TrendingUp, ArrowRight, TriangleAlert } from 'lucide-react'
import { FilaGestao, type DocPendente, type CondicionantePendente, type TarefaAtrasada } from './fila-gestao'
import { RadarConformidade } from './radar-conformidade'

export const metadata: Metadata = { title: 'Dashboard' }

// ─── tipos ───────────────────────────────────────────────────────────────────

interface ResumoData {
  mediaConformidadeRede: number | null
  totalEmpreendimentos: number
  empreendimentosCriticos: number
  alertasCriticos: number
  autosAtivos: number
  empreendimentosRiscoCritico: number
  vencimentos30d: number
  ranking: { id: string; nome: string; indiceConformidade: number; statusCompliance: string }[]
}

interface VencimentoItem {
  id: string
  modulo: string
  descricao: string
  empreendimento: string
  empreendimentoId: string
  dataVencimento: string
  diasRestantes: number
  urgencia: 'CRITICO' | 'ALTO' | 'MEDIO' | 'OK'
  registroHref?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const urgenciaBadge: Record<string, string> = {
  CRITICO: 'bg-red-50 text-red-700 border border-red-200',
  ALTO: 'bg-orange-50 text-orange-700 border border-orange-200',
  MEDIO: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  OK: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

const statusComplianceColor: Record<string, string> = {
  CRITICO: 'bg-red-500',
  ATENCAO: 'bg-orange-400',
  BOM: 'bg-emerald-500',
  EXCELENTE: 'bg-emerald-600',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasLabel(d: number) {
  if (d < 0) return 'Vencido'
  if (d === 0) return 'Hoje'
  if (d === 1) return '1 dia'
  return `${d} dias`
}

const moduloHref: Record<string, string> = {
  'Licença Ambiental': '/licencas-ambientais',
  'Reg. Urbano': '/regulatorio-urbano',
  'SST': '/sst',
  'ANP/INMETRO': '/anp-inmetro',
  'Estanqueidade': '/estanqueidade',
  'Outorga Hídrica': '/outorga-hidrica',
  'Fiscalização': '/fiscalizacoes',
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const params = await searchParams
  const diasVencimento = parseInt(params.dias ?? '90', 10)
  const [sessao, token] = await Promise.all([getSessao(), getAccessToken()])
  const isDemo = !token && !!sessao

  let resumo: ResumoData | null = null
  let vencimentos: VencimentoItem[] = []
  let docsPendentes: DocPendente[] = []
  let condicionantesPendentes: CondicionantePendente[] = []
  let tarefasAtrasadas: TarefaAtrasada[] = []
  let eixosRede: { id: string; nome: string; score: number | null }[] = []

  if (token) {
    try {
      const [resumoRes, vencRes, docsRes, condsRes, tarefasRes, diagRes] = await Promise.all([
        api.get<{ data: ResumoData }>('/cockpit/resumo', token),
        api.get<{ data: VencimentoItem[] }>(`/cockpit/vencimentos?dias=${diasVencimento}`, token),
        api.get<{ data: any[] }>('/documentos?status=EM_ANALISE&limit=20', token),
        api.get<{ data: any[] }>('/condicionantes?status=PENDENTE&limit=20', token),
        api.get<{ data: any[] }>('/tarefas?status=PENDENTE&limit=20', token),
        api.get<{ data: { eixos: any[] } }>('/cockpit/diagnostico/rede', token),
      ])
      resumo = resumoRes.data
      vencimentos = vencRes.data
      eixosRede = diagRes.data.eixos

      // Normaliza documentos em análise
      docsPendentes = docsRes.data
        .filter((d) => d.versaoAtual?.status === 'ENVIADA')
        .map((d): DocPendente => ({
          documentoId: d.id,
          versaoId: d.versaoAtual.id,
          nome: d.tipoDocumento?.nome ?? d.nome ?? 'Documento',
          empreendimento: d.empreendimento?.nome ?? '-',
          empreendimentoId: d.empreendimentoId,
          enviadoEm: d.versaoAtual.criadoEm,
          enviadoPor: d.versaoAtual.enviadoPor?.nome ?? 'Representante',
        }))

      // Normaliza condicionantes vencendo em 7 dias
      const hoje = Date.now()
      const em7 = hoje + 7 * 86400000
      condicionantesPendentes = condsRes.data
        .filter((c) => {
          if (!c.proximoVencimento) return false
          const t = new Date(c.proximoVencimento).getTime()
          return t <= em7
        })
        .map((c): CondicionantePendente => {
          const t = new Date(c.proximoVencimento).getTime()
          return {
            id: c.id,
            descricao: c.descricao,
            empreendimento: c.empreendimento?.nome ?? '-',
            empreendimentoId: c.empreendimentoId,
            diasRestantes: Math.floor((t - hoje) / 86400000),
            proximoVencimento: c.proximoVencimento,
          }
        })

      // Normaliza tarefas atrasadas
      tarefasAtrasadas = tarefasRes.data
        .filter((t) => t.dataVencimento && new Date(t.dataVencimento).getTime() <= hoje)
        .map((t): TarefaAtrasada => {
          const atraso = Math.floor((hoje - new Date(t.dataVencimento).getTime()) / 86400000)
          return {
            id: t.id,
            titulo: t.titulo,
            empreendimento: t.empreendimento?.nome ?? '-',
            empreendimentoId: t.empreendimentoId,
            diasAtraso: atraso,
            status: t.status,
            responsavel: t.responsavel?.nome ?? '',
          }
        })
    } catch { /* exibe vazio */ }
  }

  if (isDemo) {
    resumo = {
      mediaConformidadeRede: 94.2,
      totalEmpreendimentos: 12,
      empreendimentosCriticos: 3,
      alertasCriticos: 3,
      autosAtivos: 4,
      empreendimentosRiscoCritico: 2,
      vencimentos30d: 12,
      ranking: [
        { id: '1', nome: 'Complexo logístico', indiceConformidade: 98.2, statusCompliance: 'EXCELENTE' },
        { id: '2', nome: 'Rodoviário federal', indiceConformidade: 94.5, statusCompliance: 'BOM' },
        { id: '3', nome: 'Patrimonial linear', indiceConformidade: 64.8, statusCompliance: 'ATENCAO' },
      ],
    }
    vencimentos = [
      {
        id: 'demo-lic-1',
        modulo: 'Licença Ambiental',
        descricao: 'Renovação de licença operacional',
        empreendimento: 'Unidade 1',
        empreendimentoId: 'demo-emp-1',
        dataVencimento: new Date().toISOString(),
        diasRestantes: 0,
        urgencia: 'CRITICO',
      },
      {
        id: 'demo-doc-1',
        modulo: 'Reg. Urbano',
        descricao: 'Entrega complementar de cadastro',
        empreendimento: 'Unidade 2',
        empreendimentoId: 'demo-emp-2',
        dataVencimento: new Date(Date.now() + 3 * 86400000).toISOString(),
        diasRestantes: 3,
        urgencia: 'ALTO',
      },
      {
        id: 'demo-proc-1',
        modulo: 'Outorga Hídrica',
        descricao: 'Protocolo de peça patrimonial',
        empreendimento: 'Unidade 3',
        empreendimentoId: 'demo-emp-3',
        dataVencimento: new Date(Date.now() + 12 * 86400000).toISOString(),
        diasRestantes: 12,
        urgencia: 'MEDIO',
      },
    ]
    docsPendentes = [
      {
        documentoId: 'demo-doc',
        versaoId: 'demo-versao',
        nome: 'Licença de operação',
        empreendimento: 'Posto Avenida',
        empreendimentoId: 'demo-emp-1',
        enviadoEm: new Date().toISOString(),
        enviadoPor: 'Representante Demo',
      },
    ]
    condicionantesPendentes = [
      {
        id: 'demo-cond',
        descricao: 'Enviar relatório fotográfico do pátio',
        empreendimento: 'Base Centro-Oeste',
        empreendimentoId: 'demo-emp-2',
        diasRestantes: 2,
        proximoVencimento: new Date(Date.now() + 2 * 86400000).toISOString(),
      },
    ]
    tarefasAtrasadas = [
      {
        id: 'demo-task',
        titulo: 'Atualizar evidências da vistoria GO-1',
        empreendimento: 'Pátio GO-1',
        empreendimentoId: 'demo-emp-3',
        diasAtraso: 1,
        status: 'PENDENTE',
        responsavel: 'Diego M.',
      },
    ]
    eixosRede = [
      { id: 'ambiental', nome: 'Ambiental', score: 96 },
      { id: 'urbano', nome: 'Urbano', score: 88 },
      { id: 'documental', nome: 'Documental', score: 91 },
      { id: 'campo', nome: 'Campo', score: 93 },
    ]
  }

  const criticos = vencimentos.filter((v) => v.urgencia === 'CRITICO')
  const altos = vencimentos.filter((v) => v.urgencia === 'ALTO')
  const urgentesCount = criticos.length + altos.length

  const kpiCards = [
    {
      label: 'Conformidade Rede',
      value: resumo?.mediaConformidadeRede != null ? `${resumo.mediaConformidadeRede.toFixed(1)}%` : '-',
      sub: `${resumo?.totalEmpreendimentos ?? 0} empreendimentos`,
      icon: Activity,
      color: 'blue' as const,
      href: '/executivo',
    },
    {
      label: 'Vencendo em 30d',
      value: resumo?.vencimentos30d ?? '-',
      sub: 'documentos e licenças',
      icon: Clock,
      color: (resumo?.vencimentos30d ?? 0) > 0 ? 'orange' as const : 'green' as const,
      href: '/condicionantes',
    },
    {
      label: 'Alertas Críticos',
      value: resumo?.alertasCriticos ?? '-',
      sub: 'últimos 90 dias',
      icon: AlertTriangle,
      color: (resumo?.alertasCriticos ?? 0) > 0 ? 'red' as const : 'green' as const,
      href: '/alertas',
    },
    {
      label: 'Autos de Infração',
      value: resumo?.autosAtivos ?? '-',
      sub: 'em aberto',
      icon: Scale,
      color: (resumo?.autosAtivos ?? 0) > 0 ? 'red' as const : 'green' as const,
      href: '/fiscalizacoes',
    },
    {
      label: 'Risco Crítico',
      value: resumo?.empreendimentosRiscoCritico ?? '-',
      sub: 'postos em atenção',
      icon: ShieldAlert,
      color: (resumo?.empreendimentosRiscoCritico ?? 0) > 0 ? 'red' as const : 'green' as const,
      href: '/risco',
    },
  ]

  const colorMap = {
    blue:   { bg: 'bg-emerald-50',  icon: 'text-emerald-600', bar: 'from-emerald-400 to-emerald-600', val: 'text-emerald-700' },
    orange: { bg: 'bg-orange-50',   icon: 'text-orange-500',  bar: 'from-orange-300 to-orange-500',   val: 'text-orange-600' },
    red:    { bg: 'bg-red-50',      icon: 'text-red-500',     bar: 'from-red-300 to-red-500',         val: 'text-red-600' },
    green:  { bg: 'bg-emerald-50',  icon: 'text-emerald-600', bar: 'from-emerald-400 to-emerald-600', val: 'text-emerald-700' },
  }

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Cockpit de Conformidade</p>
          <h1 className="text-2xl font-bold tracking-tight">Olá, {sessao?.nome?.split(' ')[0]}</h1>
        </div>
        <Link
          href="/executivo"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/30 rounded-lg px-3 py-2 bg-card"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Painel Executivo
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Banner de urgência */}
      {urgentesCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <TriangleAlert className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">
              {urgentesCount} vencimento{urgentesCount !== 1 ? 's' : ''} crítico{urgentesCount !== 1 ? 's' : ''} nos próximos 30 dias
            </p>
            <p className="text-xs text-red-500 mt-0.5">Ação imediata requerida - revise os itens abaixo.</p>
          </div>
        </div>
      )}

      {/* Cards de KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map(({ label, value, sub, icon: Icon, color, href }) => {
          const c = colorMap[color]
          return (
            <Link
              key={label}
              href={href}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_2px_6px_rgba(15,23,42,0.05),0_18px_36px_-16px_rgba(15,23,42,0.18)]"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.bar}`} />
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ring-1 ring-inset ring-black/[0.03]`}>
                <Icon className={`h-5 w-5 ${c.icon}`} />
              </div>
              <p className={`mb-1 text-4xl font-black leading-none tracking-tight tabular-nums ${c.val}`}>
                {value}
              </p>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
              <p className="text-xs leading-snug text-muted-foreground/80">{sub}</p>
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground/0 transition-colors group-hover:text-primary">
                abrir <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          )
        })}
      </div>

      {/* Fila de gestão */}
      {(docsPendentes.length > 0 || condicionantesPendentes.length > 0 || tarefasAtrasadas.length > 0) && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Decisões pendentes</h2>
            <span className="text-[10px] font-bold bg-primary/15 text-primary border border-primary/20 rounded-full px-2 py-0.5 tabular-nums">
              {docsPendentes.length + condicionantesPendentes.length + tarefasAtrasadas.length}
            </span>
          </div>
          <FilaGestao
            docs={docsPendentes}
            condicionantes={condicionantesPendentes}
            tarefas={tarefasAtrasadas}
          />
        </div>
      )}

      {/* Vencimentos + Radar + Ranking */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Vencimentos próximos 90 dias */}
        <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold">Vencimentos</h2>
              <form method="GET" className="flex items-center gap-1">
                {[30, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="submit"
                    name="dias"
                    value={d}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${diasVencimento === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  >
                    {d}d
                  </button>
                ))}
              </form>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded-md">
              {vencimentos.length} {vencimentos.length !== 1 ? 'itens' : 'item'}
            </span>
          </div>

          {vencimentos.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Nenhum vencimento nos próximos 90 dias.</div>
          ) : (
            <div className="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
              {vencimentos.map((v) => (
                <div key={`${v.modulo}-${v.id}`} className="flex items-center justify-between px-5 py-3.5 gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${urgenciaBadge[v.urgencia]}`}>
                        {diasLabel(v.diasRestantes)}
                      </span>
                      <span className="text-[10px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded font-mono flex-shrink-0">{v.modulo}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{v.descricao}</p>
                    <Link href={`/empreendimentos/${v.empreendimentoId}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate">
                      {v.empreendimento}
                    </Link>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground tabular-nums">{formatDate(v.dataVencimento)}</p>
                    <Link href={v.registroHref ?? moduloHref[v.modulo] ?? '#'} className="text-xs text-primary hover:underline">
                      ver →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Radar + Ranking */}
        <div className="space-y-4">
          <RadarConformidade eixos={eixosRede} />

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="text-sm font-semibold">Ranking de Conformidade</h2>
            </div>

            {!resumo || resumo.ranking.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sem dados de conformidade.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {resumo.ranking.map((emp, idx) => (
                  <Link key={emp.id} href={`/empreendimentos/${emp.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <span className="text-xs font-bold text-muted-foreground/50 w-5 text-right flex-shrink-0 tabular-nums">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{emp.nome}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${statusComplianceColor[emp.statusCompliance] ?? 'bg-muted-foreground/30'}`}
                            style={{ width: `${emp.indiceConformidade}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground w-10 text-right flex-shrink-0 font-medium">
                          {emp.indiceConformidade.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
