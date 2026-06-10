import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import {
  ShieldCheck, Users, Stethoscope, GraduationCap, HardHat,
  FileText, AlertTriangle, CheckCircle2, Clock, ArrowRight,
} from 'lucide-react'
import { CriarASOForm } from './criar-aso-form'
import { CriarDocSSTForm } from './criar-doc-sst-form'

export const metadata: Metadata = { title: 'SST — Segurança do Trabalho' }

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ASO {
  id: string
  funcionarioNome: string
  cargo: string | null
  tipo: string
  dataExame: string
  dataVencimento: string | null
  aptidao: string
  empreendimento: { id: string; nome: string }
}

interface DocumentoSST {
  id: string
  tipo: string
  responsavel: string | null
  dataVencimento: string | null
  status: string
  empreendimento: { id: string; nome: string }
}

interface TreinamentoExecucao {
  id: string
  dataVencimento: string | null
  status: string
  tipo: { nome: string; normativa: string }
  empreendimento: { nome: string }
  participantes: { presenca: boolean }[]
}

interface EPI {
  id: string
  tipoEPI: string
  dataVencimento: string | null
  status: string
  funcionario: { nome: string }
  empreendimento: { nome: string }
}

interface Funcionario {
  id: string
  ativo: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(data: string | null) {
  if (!data) return null
  return Math.ceil((new Date(data).getTime() - Date.now()) / 86400000)
}

const tipoASOLabel: Record<string, string> = {
  ADMISSIONAL: 'Admissional', PERIODICO: 'Periódico', DEMISSIONAL: 'Demissional',
  RETORNO: 'Retorno', MUDANCA_FUNCAO: 'Mudança Função',
}

const aptidaoColor: Record<string, string> = {
  APTO: 'bg-green-100 text-green-800', INAPTO: 'bg-red-100 text-red-800',
  APTO_RESTRICOES: 'bg-yellow-100 text-yellow-800',
}

const docSSTLabel: Record<string, string> = {
  PCMSO: 'PCMSO', PPRA: 'PPRA', PGR: 'PGR', LTCAT: 'LTCAT',
  LAUDO_ERGONOMICO: 'Laudo Ergonômico', PPCI_SST: 'PPCI', OUTROS: 'Outros',
}

const statusColor: Record<string, string> = {
  VIGENTE: 'bg-green-100 text-green-800', A_RENOVAR: 'bg-yellow-100 text-yellow-800',
  VENCIDO: 'bg-red-100 text-red-800',
}

const normativaColor: Record<string, string> = {
  'NR-20': 'bg-orange-100 text-orange-800', 'NR-35': 'bg-purple-100 text-purple-800',
  'NR-10': 'bg-yellow-100 text-yellow-800', 'CIPA': 'bg-pink-100 text-pink-800',
  'BRIGADA': 'bg-red-100 text-red-800',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SSTDashboardPage() {
  const token = await getAccessToken()

  let asos: ASO[] = []
  let docs: DocumentoSST[] = []
  let treinamentos: TreinamentoExecucao[] = []
  let epis: EPI[] = []
  let funcionarios: Funcionario[] = []

  if (token) {
    const [resASO, resDoc, resTrein, resEPI, resFunc] = await Promise.allSettled([
      api.get<PaginatedResponse<ASO>>('/sst/asos?limit=50', token),
      api.get<PaginatedResponse<DocumentoSST>>('/sst/documentos?limit=50', token),
      api.get<PaginatedResponse<TreinamentoExecucao>>('/sst/treinamentos?limit=50', token),
      api.get<PaginatedResponse<EPI>>('/sst/epis?limit=100', token),
      api.get<PaginatedResponse<Funcionario>>('/sst/funcionarios?limit=500&ativo=true', token),
    ])
    if (resASO.status === 'fulfilled') asos = resASO.value.data
    if (resDoc.status === 'fulfilled') docs = resDoc.value.data
    if (resTrein.status === 'fulfilled') treinamentos = resTrein.value.data
    if (resEPI.status === 'fulfilled') epis = resEPI.value.data
    if (resFunc.status === 'fulfilled') funcionarios = resFunc.value.data
  }

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const hoje = new Date()
  const asosVencidas = asos.filter((a) => a.dataVencimento && new Date(a.dataVencimento) < hoje).length
  const asosVencendo30 = asos.filter((a) => { const d = diasRestantes(a.dataVencimento); return d !== null && d >= 0 && d <= 30 }).length
  const docsVencidos = docs.filter((d) => d.status === 'VENCIDO').length
  const docsVigentes = docs.filter((d) => d.status === 'VIGENTE').length
  const treinVencidos = treinamentos.filter((t) => t.status === 'VENCIDO' || (t.dataVencimento && new Date(t.dataVencimento) < hoje)).length
  const treinVencendo30 = treinamentos.filter((t) => { const d = diasRestantes(t.dataVencimento); return d !== null && d >= 0 && d <= 30 }).length
  const episVencidos = epis.filter((e) => e.status === 'VENCIDO').length
  const funcAtivos = funcionarios.length

  const alertasTotal = asosVencidas + docsVencidos + treinVencidos + episVencidos

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            SST — Segurança do Trabalho
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gestão integrada de SST: funcionários, ASOs, treinamentos, EPIs e documentação
          </p>
        </div>
      </div>

      {/* Alerta geral */}
      {alertasTotal > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            {alertasTotal} item{alertasTotal !== 1 ? 'ns' : ''} vencido{alertasTotal !== 1 ? 's' : ''} —
            {asosVencidas > 0 && ` ${asosVencidas} ASO${asosVencidas !== 1 ? 's' : ''}`}
            {docsVencidos > 0 && ` ${docsVencidos} doc${docsVencidos !== 1 ? 's' : ''}`}
            {treinVencidos > 0 && ` ${treinVencidos} treinamento${treinVencidos !== 1 ? 's' : ''}`}
            {episVencidos > 0 && ` ${episVencidos} EPI${episVencidos !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link href="/funcionarios" className="rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">Funcionários</span>
          </div>
          <p className="text-2xl font-bold">{funcAtivos}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">ativos</p>
        </Link>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground">ASOs</span>
          </div>
          <p className="text-2xl font-bold">{asos.length}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {asosVencidas > 0 && <span className="text-[10px] text-red-600 font-medium">{asosVencidas} vencido{asosVencidas !== 1 ? 's' : ''}</span>}
            {asosVencendo30 > 0 && <span className="text-[10px] text-yellow-600 font-medium">{asosVencendo30} vencendo</span>}
            {asosVencidas === 0 && asosVencendo30 === 0 && <span className="text-[10px] text-green-600 font-medium">em dia</span>}
          </div>
        </div>

        <Link href="/sst/treinamentos" className="rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-muted-foreground">Treinamentos</span>
          </div>
          <p className="text-2xl font-bold">{treinamentos.length}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {treinVencidos > 0 && <span className="text-[10px] text-red-600 font-medium">{treinVencidos} vencido{treinVencidos !== 1 ? 's' : ''}</span>}
            {treinVencendo30 > 0 && <span className="text-[10px] text-yellow-600 font-medium">{treinVencendo30} vencendo</span>}
            {treinVencidos === 0 && treinVencendo30 === 0 && <span className="text-[10px] text-green-600 font-medium">em dia</span>}
          </div>
        </Link>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardHat className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-muted-foreground">EPIs</span>
          </div>
          <p className="text-2xl font-bold">{epis.length}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {episVencidos > 0 && <span className="text-[10px] text-red-600 font-medium">{episVencidos} vencido{episVencidos !== 1 ? 's' : ''}</span>}
            {episVencidos === 0 && <span className="text-[10px] text-green-600 font-medium">em dia</span>}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-teal-600" />
            <span className="text-xs font-medium text-muted-foreground">Documentos SST</span>
          </div>
          <p className="text-2xl font-bold">{docs.length}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {docsVencidos > 0 && <span className="text-[10px] text-red-600 font-medium">{docsVencidos} vencido{docsVencidos !== 1 ? 's' : ''}</span>}
            {docsVencidos === 0 && <span className="text-[10px] text-green-600 font-medium">{docsVigentes} vigente{docsVigentes !== 1 ? 's' : ''}</span>}
          </div>
        </div>
      </div>

      {/* Navegação rápida */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/funcionarios" className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/50 transition-colors group">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Funcionários</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link href="/sst/treinamentos" className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/50 transition-colors group">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Treinamentos</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link href="/checklists" className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/50 transition-colors group">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Checklists de Campo</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link href="/sst/epis" className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/50 transition-colors group">
          <div className="flex items-center gap-2">
            <HardHat className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">EPIs</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>

      {/* ── Treinamentos vencendo (top 5) ── */}
      {(treinVencidos > 0 || treinVencendo30 > 0) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Treinamentos vencendo / vencidos
            </h2>
            <Link href="/sst/treinamentos" className="text-xs text-primary hover:underline">Ver todos →</Link>
          </div>
          <div className="rounded-lg border bg-card divide-y">
            {treinamentos
              .filter((t) => {
                const d = diasRestantes(t.dataVencimento)
                return t.status === 'VENCIDO' || (d !== null && d <= 30)
              })
              .slice(0, 5)
              .map((t) => {
                const dias = diasRestantes(t.dataVencimento)
                const vencido = dias !== null && dias < 0
                return (
                  <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${normativaColor[t.tipo.normativa] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t.tipo.normativa}
                      </span>
                      <span className="text-sm">{t.tipo.nome}</span>
                      <span className="text-xs text-muted-foreground">· {t.empreendimento.nome}</span>
                    </div>
                    <span className={`text-xs font-medium ${vencido ? 'text-red-600' : 'text-yellow-600'}`}>
                      {vencido ? 'Vencido' : `${dias}d`}
                    </span>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* ── Documentos SST ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" />
            Documentos SST
          </h2>
          <CriarDocSSTForm />
        </div>
        <div className="rounded-lg border bg-card">
          {docs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum documento SST cadastrado.</div>
          ) : (
            <div className="divide-y">
              {docs.map((doc) => {
                const dias = diasRestantes(doc.dataVencimento)
                return (
                  <div key={doc.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">{docSSTLabel[doc.tipo] ?? doc.tipo}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>{doc.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{doc.empreendimento.nome}</span>
                        {doc.responsavel && <span className="text-xs text-muted-foreground">{doc.responsavel}</span>}
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{formatDate(doc.dataVencimento)}</p>
                      {dias !== null && dias < 0 && <p className="text-[10px] font-medium text-red-600">Vencido</p>}
                      {dias !== null && dias >= 0 && dias <= 30 && <p className="text-[10px] font-medium text-yellow-600">{dias}d</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── ASOs ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-green-600" />
            ASOs — Atestados de Saúde Ocupacional
          </h2>
          <CriarASOForm />
        </div>
        <div className="rounded-lg border bg-card">
          {asos.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum ASO cadastrado.</div>
          ) : (
            <div className="divide-y">
              {asos.map((aso) => {
                const dias = diasRestantes(aso.dataVencimento)
                return (
                  <div key={aso.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{aso.funcionarioNome}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${aptidaoColor[aso.aptidao] ?? 'bg-gray-100'}`}>{aso.aptidao.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{tipoASOLabel[aso.tipo] ?? aso.tipo}</span>
                        {aso.cargo && <span className="text-xs text-muted-foreground">{aso.cargo}</span>}
                        <span className="text-xs text-muted-foreground">{aso.empreendimento.nome}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{formatDate(aso.dataVencimento)}</p>
                      {dias !== null && dias < 0 && <p className="text-[10px] font-medium text-red-600">Vencido</p>}
                      {dias !== null && dias >= 0 && dias <= 30 && <p className="text-[10px] font-medium text-yellow-600">{dias}d</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
