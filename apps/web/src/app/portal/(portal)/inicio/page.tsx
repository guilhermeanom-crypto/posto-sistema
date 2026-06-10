import type { Metadata } from 'next'
import { getAccessToken, getSessao } from '@/lib/auth'
import { api } from '@/lib/api'
import Link from 'next/link'
import {
  Leaf, Landmark, FileText, ShieldCheck, HardHat, Fuel, Droplets,
  AlertTriangle, Clock, ArrowRight, TrendingUp,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Início' }

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Eixo {
  key: string
  nome: string
  total: number
  validos: number
  score: number | null
}

interface ComplianceData {
  indiceGeral: number | null
  statusGeral: 'REGULAR' | 'ATENCAO' | 'CRITICO' | 'EMERGENCIA' | null
  calculadoEm: string | null
  eixos: Eixo[]
}

interface Alerta {
  id: string
  tipo: string
  nivel: 'CRITICO' | 'ALTO' | 'MEDIO' | 'INFORMATIVO'
  titulo: string
  mensagem: string
  criadoEm: string
}

interface DashboardData {
  empreendimento: { nome: string; cidade: string; estado: string; bandeira: string | null }
  resumo: { processosPendentes: number; condicionantesPendentes: number; tarefasPendentes: number }
}

// ─── Helpers visuais ─────────────────────────────────────────────────────────

const EIXO_ICON: Record<string, React.ElementType> = {
  ambiental:     Leaf,
  urbano:        Landmark,
  documentos:    FileText,
  condicionantes:ShieldCheck,
  sst:           HardHat,
  anp:           Fuel,
  estanqueidade: Droplets,
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground'
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function scoreBarColor(score: number | null): string {
  if (score === null) return 'bg-muted'
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function statusLabel(s: string | null) {
  const map: Record<string, { label: string; cls: string }> = {
    REGULAR:    { label: 'Regular',   cls: 'bg-green-100 text-green-700' },
    ATENCAO:    { label: 'Atenção',   cls: 'bg-yellow-100 text-yellow-700' },
    CRITICO:    { label: 'Crítico',   cls: 'bg-orange-100 text-orange-700' },
    EMERGENCIA: { label: 'Emergência',cls: 'bg-red-100 text-red-700' },
  }
  return s ? (map[s] ?? { label: s, cls: 'bg-muted text-muted-foreground' }) : null
}

const NIVEL_COLOR: Record<string, string> = {
  CRITICO:     'border-l-red-500 bg-red-50',
  ALTO:        'border-l-orange-500 bg-orange-50',
  MEDIO:       'border-l-yellow-500 bg-yellow-50',
  INFORMATIVO: 'border-l-blue-500 bg-blue-50',
}

const NIVEL_TEXT: Record<string, string> = {
  CRITICO:     'text-red-700',
  ALTO:        'text-orange-700',
  MEDIO:       'text-yellow-700',
  INFORMATIVO: 'text-blue-700',
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default async function PortalInicioPage() {
  const [token, sessao] = await Promise.all([getAccessToken(), getSessao()])
  const isDemo = !token && !!sessao

  let dashboard: DashboardData | null = null
  let compliance: ComplianceData | null = null
  let alertas: Alerta[] = []

  if (token) {
    const results = await Promise.allSettled([
      api.get<{ data: DashboardData }>('/portal/dashboard', token),
      api.get<{ data: ComplianceData }>('/portal/compliance', token),
      api.get<{ data: Alerta[] }>('/portal/alertas', token),
    ])

    if (results[0].status === 'fulfilled') dashboard = results[0].value.data
    if (results[1].status === 'fulfilled') compliance = results[1].value.data
    if (results[2].status === 'fulfilled') alertas = results[2].value.data
  }

  if (isDemo) {
    dashboard = {
      empreendimento: {
        nome: 'Rede Posto Demo LTDA',
        cidade: 'Goiânia',
        estado: 'GO',
        bandeira: 'Bandeira branca',
      },
      resumo: {
        processosPendentes: 5,
        condicionantesPendentes: 7,
        tarefasPendentes: 3,
      },
    }
    compliance = {
      indiceGeral: 92,
      statusGeral: 'REGULAR',
      calculadoEm: new Date().toISOString(),
      eixos: [
        { key: 'ambiental', nome: 'Ambiental', total: 12, validos: 11, score: 92 },
        { key: 'documentos', nome: 'Documentos', total: 9, validos: 8, score: 89 },
        { key: 'condicionantes', nome: 'Condicionantes', total: 15, validos: 13, score: 87 },
        { key: 'sst', nome: 'SST', total: 8, validos: 8, score: 100 },
      ],
    }
    alertas = [
      {
        id: 'demo-alerta-1',
        tipo: 'LICENCA',
        nivel: 'CRITICO',
        titulo: 'Licença operacional vencendo',
        mensagem: 'Renovação precisa ser protocolada nesta semana.',
        criadoEm: new Date().toISOString(),
      },
      {
        id: 'demo-alerta-2',
        tipo: 'DOCUMENTO',
        nivel: 'ALTO',
        titulo: 'Documentos societários incompletos',
        mensagem: 'Há dois arquivos aguardando envio do representante.',
        criadoEm: new Date().toISOString(),
      },
    ]
  }

  const alertasCriticos = alertas.filter((a) => a.nivel === 'CRITICO' || a.nivel === 'ALTO')
  const status = statusLabel(compliance?.statusGeral ?? null)

  return (
    <div className="space-y-6">

      {/* Cabeçalho do posto */}
      {dashboard && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-bold text-foreground">{dashboard.empreendimento.nome}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {dashboard.empreendimento.cidade}/{dashboard.empreendimento.estado}
                {dashboard.empreendimento.bandeira ? ` · ${dashboard.empreendimento.bandeira}` : ''}
              </p>
            </div>
            {status && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.cls}`}>
                {status.label}
              </span>
            )}
          </div>

          {/* Métricas rápidas */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Link href="/portal/documentos" className="group text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <p className="text-xl font-bold text-foreground">{dashboard.resumo.processosPendentes}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Processos</p>
            </Link>
            <div className={`text-center p-3 rounded-lg ${dashboard.resumo.condicionantesPendentes > 0 ? 'bg-orange-50' : 'bg-muted/50'}`}>
              <p className={`text-xl font-bold ${dashboard.resumo.condicionantesPendentes > 0 ? 'text-orange-600' : 'text-foreground'}`}>
                {dashboard.resumo.condicionantesPendentes}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Pendências</p>
            </div>
            <Link href="/portal/tarefas" className="group text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <p className={`text-xl font-bold ${dashboard.resumo.tarefasPendentes > 0 ? 'text-yellow-600' : 'text-foreground'}`}>
                {dashboard.resumo.tarefasPendentes}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Tarefas</p>
            </Link>
          </div>
        </div>
      )}

      {/* Alertas críticos em destaque */}
      {alertasCriticos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Alertas que precisam de atenção
            </h2>
            <Link href="/portal/alertas" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {alertasCriticos.slice(0, 3).map((a) => (
            <div key={a.id} className={`rounded-lg border-l-4 p-3.5 ${NIVEL_COLOR[a.nivel]}`}>
              <p className={`text-xs font-semibold ${NIVEL_TEXT[a.nivel]}`}>{a.titulo}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.mensagem}</p>
            </div>
          ))}
        </div>
      )}

      {/* Score de compliance por eixo */}
      {compliance && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                Conformidade Regulatória
              </h2>
              {compliance.calculadoEm && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Atualizado em {new Date(compliance.calculadoEm).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            {compliance.indiceGeral !== null && (
              <div className="text-right">
                <p className={`text-2xl font-bold ${scoreColor(compliance.indiceGeral)}`}>
                  {compliance.indiceGeral.toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted-foreground">índice geral</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {compliance.eixos.map((eixo) => {
              const Icon = EIXO_ICON[eixo.key] ?? FileText
              const s = eixo.score
              return (
                <div key={eixo.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <Icon className="h-3.5 w-3.5" />
                      {eixo.nome}
                    </span>
                    <span className={`font-semibold ${scoreColor(s)}`}>
                      {s === null ? '-' : `${s}%`}
                      <span className="text-muted-foreground font-normal ml-1">
                        ({eixo.validos}/{eixo.total})
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(s)}`}
                      style={{ width: s !== null ? `${s}%` : '0%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/portal/documentos"
          className="flex items-center justify-between rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Enviar Documentos</p>
              <p className="text-xs text-muted-foreground">Faça upload de licenças e laudos</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <Link
          href="/portal/tarefas"
          className="flex items-center justify-between rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Minhas Tarefas</p>
              <p className="text-xs text-muted-foreground">Veja pendências atribuídas a você</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>

      {/* Sem dados */}
      {!token && (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Sessão expirada. <Link href="/portal/login" className="text-primary underline">Entre novamente</Link>.
        </div>
      )}
    </div>
  )
}
