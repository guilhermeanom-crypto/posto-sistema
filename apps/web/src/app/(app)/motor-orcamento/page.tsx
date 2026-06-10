import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import { MinutaProposta } from './minuta-proposta'
import {
  ClipboardCheck, Layers, Shield, AlertTriangle, FolderKanban,
  FileText, DollarSign, CheckCircle2, Sparkles,
  Building2, Calendar, ListChecks, Clock, ShieldAlert,
  RefreshCcw, Activity, MapPin, User2, Phone, Mail, Fuel, Gauge,
  Hash, FileCheck2, FileClock, FileWarning,
} from 'lucide-react'
import { EmpreendimentoSelector } from './selector'

export const metadata: Metadata = { title: 'Motor de Orçamento - Painel da Condução' }

interface Props {
  searchParams: Promise<{ empreendimentoId?: string; etapa?: string; emitStatus?: string; emitMessage?: string }>
}

// ─── Tipos de payload de API ────────────────────────────────────────────────

interface EmpreendimentoOption {
  id: string
  nome: string
  nomeFantasia: string | null
  codigoInterno: string | null
  cnpj: string | null
  cidade: string
  estado: string
  cnae: string | null
  bandeira: string | null
}

interface EmpreendimentoDetail {
  id: string
  nome: string
  nomeFantasia: string | null
  cnpj: string | null
  codigoInterno: string | null
  bandeira: string | null
  tipo: string | null
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
  responsavelTecnicoNome: string | null
  responsavelTecnicoCrea: string | null
  responsavelTecnicoEmail: string | null
  contatoEmail: string | null
  contatoTelefone: string | null
  atividades: string[]
  dataInicioOperacao: string | null
  ativo: boolean
  empresa: { id: string; nome: string; razaoSocial?: string | null; cnpj: string | null } | null
  _count?: {
    processos?: number
    documentos?: number
    tarefas?: number
    condicionantes?: number
  }
}

interface GapItem {
  codigo: string
  descricao: string
  modulo: string
  criticidade: 'CRITICA' | 'ALTA' | 'MEDIA'
  status: 'CONFORME' | 'A_RENOVAR' | 'SEM_DADOS' | 'NAO_APLICAVEL'
  diasAteVencimento?: number | null
}

interface GapAnalysisData {
  empreendimentoId: string
  totalObrigacoes: number
  itens: GapItem[]
  conformes: number
  aRenovar: number
  semDados: number
  naoAplicaveis: number
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
    total: number
  }>
  gapsCobertos: Array<{
    codigo: string
    descricao: string
    status: string
  }>
}

interface ScoreRiscoItem {
  id: string
  orgao: string
  score: number
  nivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
  fatores?: Array<{ pontos: number; descricao: string }>
  atualizadoEm?: string
}

interface RiscoAgregado {
  scoreFinal: number
  classe: string
  classificacao: 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO'
  atualizadoEm?: string
}

function agregarRisco(scores: ScoreRiscoItem[] | null): RiscoAgregado | null {
  if (!scores || scores.length === 0) return null
  const top = scores.reduce((a, b) => (a.score >= b.score ? a : b))
  const mapNivel = { BAIXO: 'BAIXO', MEDIO: 'MODERADO', ALTO: 'ALTO', CRITICO: 'CRITICO' } as const
  return {
    scoreFinal: top.score,
    classe: top.orgao,
    classificacao: mapNivel[top.nivel],
    atualizadoEm: top.atualizadoEm,
  }
}

interface TarefaItem {
  id: string
  titulo: string
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | string
  prioridade?: string | null
  prazo?: string | null
  responsavel?: { nome: string } | null
}

interface ProcessoItem {
  id: string
  numero?: string | null
  tipo?: string | null
  status: string
  fase?: string | null
  orgao?: { sigla: string; nome: string } | null
  vencimento?: string | null
}

interface DocumentoItem {
  id: string
  nome: string
  status: string
  tipoDocumento?: { nome: string } | null
  dataVencimento?: string | null
  ultimaVersao?: { criadoEm: string } | null
}

interface BombaItem {
  id: string
  numero: number
  fabricante: string
  modelo: string | null
  combustiveis: string[]
  status: string
  proximaCalibracao: string | null
}

interface TanqueItem {
  id: string
  identificacao?: string | null
  capacidadeLitros?: number | null
  produto?: string | null
  status: string
  proximoTeste?: string | null
}

// ─── Etapas do fluxo ────────────────────────────────────────────────────────

type Etapa =
  | 'triagem' | 'caracterizacao' | 'diagnostico'
  | 'obrigacoes' | 'execucao' | 'documentos' | 'financeiro'

const ETAPAS: Array<{ id: Etapa; label: string; descricao: string; icon: typeof ClipboardCheck }> = [
  { id: 'triagem',        label: 'Triagem',        descricao: 'Validar dados-base e avaliar viabilidade.',   icon: ClipboardCheck },
  { id: 'caracterizacao', label: 'Caracterização', descricao: 'Gerar diagnóstico regulatório do posto.',     icon: Layers },
  { id: 'diagnostico',    label: 'Diagnóstico',    descricao: 'Revisar o diagnóstico e classe de impacto.',  icon: Shield },
  { id: 'obrigacoes',     label: 'Obrigações',     descricao: 'Priorizar obrigações e prazos.',              icon: AlertTriangle },
  { id: 'execucao',       label: 'Execução',       descricao: 'Iniciar execução das obrigações priorizadas.', icon: FolderKanban },
  { id: 'documentos',     label: 'Documentos',     descricao: 'Organizar documentos técnicos.',              icon: FileText },
  { id: 'financeiro',     label: 'Financeiro',     descricao: 'Emitir ou revisar proposta técnico-comercial.', icon: DollarSign },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(d?: string | null) {
  if (!d) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(d))
  } catch {
    return d
  }
}

function riscoColor(c: RiscoAgregado['classificacao']) {
  if (c === 'CRITICO') return { dot: 'bg-red-500',    text: 'text-red-600',    chip: 'bg-red-50 border-red-200 text-red-700' }
  if (c === 'ALTO')    return { dot: 'bg-orange-500', text: 'text-orange-600', chip: 'bg-orange-50 border-orange-200 text-orange-700' }
  if (c === 'MODERADO')return { dot: 'bg-amber-500',  text: 'text-amber-600',  chip: 'bg-amber-50 border-amber-200 text-amber-700' }
  return { dot: 'bg-emerald-500', text: 'text-emerald-600', chip: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
}

function criticidadeColor(c: GapItem['criticidade']) {
  if (c === 'CRITICA') return 'bg-red-100 text-red-700 border-red-200'
  if (c === 'ALTA') return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-amber-100 text-amber-700 border-amber-200'
}

function gapStatusColor(s: GapItem['status']) {
  if (s === 'CONFORME') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (s === 'A_RENOVAR') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (s === 'SEM_DADOS') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function parseCnaes(raw?: string | null) {
  if (!raw) return []
  return raw
    .split(/[,\n;|]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toDiagnosticoPorte(raw?: string | null) {
  const normalized = (raw ?? '').toLowerCase()
  if (normalized === 'pequeno') return 'PEQUENO'
  if (normalized === 'medio') return 'MEDIO'
  if (normalized === 'grande') return 'GRANDE'
  return 'MEDIO'
}

function toDiagnosticoSituacao(raw?: string | null) {
  const normalized = (raw ?? '').toLowerCase()
  if (normalized === 'implantacao') return 'IMPLANTACAO'
  if (normalized === 'irregular') return 'IRREGULAR'
  if (normalized === 'renovacao') return 'RENOVACAO'
  if (normalized === 'planejado') return 'PLANEJADO'
  return 'OPERACAO'
}

function addDaysIso(days: number) {
  const value = new Date()
  value.setDate(value.getDate() + days)
  return value.toISOString().slice(0, 10)
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function MotorOrcamentoPage({ searchParams }: Props) {
  const {
    empreendimentoId,
    etapa: etapaQuery,
    emitStatus,
    emitMessage,
  } = await searchParams
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const etapaAtiva: Etapa = (ETAPAS.find((e) => e.id === etapaQuery)?.id ?? 'financeiro')

  // 1. Lista empreendimentos (necessária para o selector)
  let empreendimentos: EmpreendimentoOption[] = []
  try {
    const res = await api.get<PaginatedResponse<EmpreendimentoOption>>('/empreendimentos?limit=100', token)
    empreendimentos = res.data
  } catch { /* mantém vazio */ }

  const selectedId = empreendimentoId ?? empreendimentos[0]?.id ?? ''
  const empreendimentoLista = empreendimentos.find((e) => e.id === selectedId) ?? null

  // 2. Fetch unificado de TODOS os dados em paralelo (independente da etapa)
  const reject = Promise.reject(new Error('no empreendimento'))
  const [
    detailRes, gapRes, previewRes, riscoRes,
    tarefasRes, processosRes, documentosRes,
    bombasRes, tanquesRes,
  ] = await Promise.allSettled([
    selectedId ? api.get<{ data: EmpreendimentoDetail }>(`/empreendimentos/${selectedId}`, token) : reject,
    selectedId ? api.get<{ data: GapAnalysisData }>(`/onboarding/gap-analysis/${selectedId}`, token) : reject,
    selectedId ? api.post<{ data: OrcamentoPreview }>(`/onboarding/gap-analysis/${selectedId}/orcamento-preview`, {}, token) : reject,
    selectedId ? api.get<{ data: ScoreRiscoItem[] }>(`/risco/${selectedId}`, token) : reject,
    selectedId ? api.get<PaginatedResponse<TarefaItem>>(`/tarefas?empreendimentoId=${selectedId}&limit=50`, token) : reject,
    selectedId ? api.get<PaginatedResponse<ProcessoItem>>(`/processos?empreendimentoId=${selectedId}&limit=50`, token) : reject,
    selectedId ? api.get<PaginatedResponse<DocumentoItem>>(`/documentos?empreendimentoId=${selectedId}&limit=50`, token) : reject,
    selectedId ? api.get<PaginatedResponse<BombaItem>>(`/anp-inmetro?empreendimentoId=${selectedId}&limit=50`, token) : reject,
    selectedId ? api.get<PaginatedResponse<TanqueItem>>(`/estanqueidade/tanques?empreendimentoId=${selectedId}&limit=50`, token) : reject,
  ])

  const detail     = detailRes.status     === 'fulfilled' ? detailRes.value.data     : null
  const gap        = gapRes.status        === 'fulfilled' ? gapRes.value.data        : null
  const preview    = previewRes.status    === 'fulfilled' ? previewRes.value.data    : null
  const risco      = riscoRes.status      === 'fulfilled' ? agregarRisco(riscoRes.value.data) : null
  const tarefas    = tarefasRes.status    === 'fulfilled' ? tarefasRes.value.data    : []
  const processos  = processosRes.status  === 'fulfilled' ? processosRes.value.data  : []
  const documentos = documentosRes.status === 'fulfilled' ? documentosRes.value.data : []
  const bombas     = bombasRes.status     === 'fulfilled' ? bombasRes.value.data     : []
  const tanques    = tanquesRes.status    === 'fulfilled' ? tanquesRes.value.data    : []

  const risc = risco ? riscoColor(risco.classificacao) : null
  const empreendimento = detail ?? empreendimentoLista
  const nomeExibicao = detail?.nomeFantasia ?? detail?.nome ?? empreendimentoLista?.nomeFantasia ?? empreendimentoLista?.nome ?? null
  const cnaes = parseCnaes(empreendimentoLista?.cnae ?? null)
  const propostaModeloPayload =
    selectedId && preview && empreendimento && cnaes.length > 0
      ? {
          empreendimentoId: selectedId,
          contato: {
            nome: nomeExibicao ?? empreendimento.nome,
            empresa:
              ('empresa' in empreendimento && empreendimento.empresa?.razaoSocial)
              || ('empresa' in empreendimento && empreendimento.empresa?.nome)
              || nomeExibicao
              || undefined,
            documento:
              ('empresa' in empreendimento && empreendimento.empresa?.cnpj)
              || empreendimento.cnpj
              || undefined,
            email:
              ('contatoEmail' in empreendimento && empreendimento.contatoEmail)
              || ('responsavelTecnicoEmail' in empreendimento && empreendimento.responsavelTecnicoEmail)
              || undefined,
            telefone:
              ('contatoTelefone' in empreendimento && empreendimento.contatoTelefone)
              || undefined,
          },
          diagnostico: {
            cnaes,
            uf: empreendimento.estado,
            municipio: empreendimento.cidade,
            porte: toDiagnosticoPorte(preview.perfil.porte),
            situacao: toDiagnosticoSituacao(preview.perfil.situacao),
            temLicencaAnterior: documentos.some((doc) => /licen/i.test(doc.nome)),
            temOutorgaAnterior: documentos.some((doc) => /outorga/i.test(doc.nome)),
          },
          itens: preview.itens.map((item) => ({
            codigo: item.servicoCodigo,
            quantidade: 1,
          })),
          dataValidade: addDaysIso(preview.premissas.validadePropostaDias),
          observacoesComerciais:
            `Proposta modelo gerada pelo Motor de Orçamento para ${nomeExibicao ?? empreendimento.nome}.`,
        }
      : null
  const returnTo = `/motor-orcamento?empreendimentoId=${selectedId}&etapa=${etapaAtiva}`

  const gapsCriticos = gap?.itens
    .filter((i) => i.status === 'SEM_DADOS' || (i.status === 'A_RENOVAR' && i.criticidade !== 'MEDIA'))
    .sort((a, b) => {
      const order = { CRITICA: 0, ALTA: 1, MEDIA: 2 }
      return order[a.criticidade] - order[b.criticidade]
    })
    .slice(0, 5) ?? []

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top context bar */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="px-6 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Painel da Condução</p>
              <h1 className="text-base font-bold leading-tight text-foreground">Motor de Orçamento</h1>
            </div>
          </div>
          <EmpreendimentoSelector empreendimentos={empreendimentos} selectedId={selectedId} etapa={etapaAtiva} />
        </div>
      </div>

      <div className="px-6 py-6">
        {emitStatus === 'erro' && emitMessage ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {emitMessage}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_280px]">

          {/* ─── COLUNA 1: Stepper ──────────────────────────────────────── */}
          <aside className="space-y-2">
            <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
              Etapas do fluxo
            </p>
            {ETAPAS.map((e, idx) => {
              const ativa = e.id === etapaAtiva
              const concluida = ETAPAS.findIndex((x) => x.id === etapaAtiva) > idx
              const Icon = e.icon
              const href = `/motor-orcamento?empreendimentoId=${selectedId}&etapa=${e.id}`
              return (
                <a
                  key={e.id}
                  href={href}
                  className={`group flex gap-3 rounded-xl border p-3 transition-all ${
                    ativa
                      ? 'border-primary/40 bg-primary/5 shadow-sm'
                      : 'border-border bg-background hover:border-border/80 hover:bg-muted/40'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    ativa
                      ? 'border-primary/30 bg-primary text-primary-foreground'
                      : concluida
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-border bg-muted text-muted-foreground'
                  }`}>
                    {concluida ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold leading-tight ${ativa ? 'text-foreground' : 'text-foreground/80'}`}>
                      {e.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                      {e.descricao}
                    </p>
                  </div>
                </a>
              )
            })}
          </aside>

          {/* ─── COLUNA 2: Conteúdo central ─────────────────────────────── */}
          <main className="space-y-5 min-w-0">

            {/* Cards de status (sempre visíveis - contexto da etapa) */}
            <EtapaContextoCards etapa={etapaAtiva} />

            {/* Mini KPIs (sempre visíveis) */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Prazos',     icon: Clock,    valor: gap ? `${gap.aRenovar}` : '-', sub: 'A renovar' },
                { label: 'Calendário', icon: Calendar, valor: 'Pronto', sub: 'Integração ativa' },
                { label: 'Atuações',   icon: Activity, valor: gap ? `${gap.semDados}` : '-', sub: 'Pendentes' },
                { label: 'Documentos', icon: FileText, valor: gap ? `${gap.conformes}` : '-', sub: 'Conformes' },
              ].map((it) => {
                const Icon = it.icon
                return (
                  <div key={it.label} className="rounded-2xl border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">{it.label}</p>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-base font-bold leading-none text-foreground">{it.valor}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{it.sub}</p>
                  </div>
                )
              })}
            </div>

            {/* Chips de contexto (sempre visíveis) */}
            {empreendimento && (
              <div className="rounded-2xl border bg-background px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">Dados do processo</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip label="CNAE" value={empreendimentoLista?.cnae ?? '-'} />
                  <Chip label="Local" value={`${empreendimento.cidade}/${empreendimento.estado}`} />
                  {risco && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${risc!.chip}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${risc!.dot}`} />
                      {risco.classificacao.charAt(0) + risco.classificacao.slice(1).toLowerCase()} · {risco.scoreFinal}
                    </span>
                  )}
                  <Chip label="Obrigações" value={`${gap?.totalObrigacoes ?? 0}`} icon={ListChecks} />
                  {preview && (
                    <Chip label="Orçamento" value={formatCurrency(preview.resumo.totalEstimado)} icon={DollarSign} />
                  )}
                </div>
              </div>
            )}

            {/* ─── Conteúdo despachado por etapa ────────────────────────── */}
            {etapaAtiva === 'triagem' && (
              <TriagemPanel detail={detail} nome={nomeExibicao} />
            )}

            {etapaAtiva === 'caracterizacao' && (
              <CaracterizacaoPanel detail={detail} bombas={bombas} tanques={tanques} />
            )}

            {etapaAtiva === 'diagnostico' && (
              <DiagnosticoPanel risco={risco} gap={gap} preview={preview} />
            )}

            {etapaAtiva === 'obrigacoes' && (
              <ObrigacoesPanel gap={gap} />
            )}

            {etapaAtiva === 'execucao' && (
              <ExecucaoPanel tarefas={tarefas} processos={processos} />
            )}

            {etapaAtiva === 'documentos' && (
              <DocumentosPanel documentos={documentos} />
            )}

            {etapaAtiva === 'financeiro' && (
              <FinanceiroPanel preview={preview} nome={nomeExibicao} empreendimento={empreendimento} gapsCriticos={gapsCriticos} codigoInterno={empreendimentoLista?.codigoInterno ?? null} />
            )}
          </main>

          {/* ─── COLUNA 3: Painel lateral direito ───────────────────────── */}
          <aside className="space-y-4 lg:sticky lg:top-20 self-start">
            <div className="rounded-2xl border bg-background p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Score de risco</p>
              {risco ? (
                <>
                  <p className={`mt-3 text-5xl font-black leading-none ${risc!.text}`}>{risco.scoreFinal}</p>
                  <p className={`mt-1 text-xs font-semibold ${risc!.text}`}>
                    {risco.classificacao.charAt(0) + risco.classificacao.slice(1).toLowerCase()}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{risco.classe}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Sem snapshot disponível</p>
              )}
            </div>

            <div className="rounded-2xl border bg-background p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Atenção imediata</p>
                <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {gapsCriticos.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {gapsCriticos.map((g) => (
                    <li key={g.codigo} className="text-[12px] leading-snug">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full mr-2 align-middle ${
                        g.criticidade === 'CRITICA' ? 'bg-red-500' : g.criticidade === 'ALTA' ? 'bg-orange-500' : 'bg-amber-500'
                      }`} />
                      <span className="font-medium text-foreground">{g.codigo}</span>
                      <span className="text-muted-foreground"> - {g.descricao.slice(0, 60)}{g.descricao.length > 60 ? '…' : ''}</span>
                    </li>
                  ))}
                  {gap && gap.itens.length > gapsCriticos.length && (
                    <li className="pt-1 text-[11px] text-primary font-medium">
                      +{gap.itens.length - gapsCriticos.length} mais obrigações
                    </li>
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-600 font-medium">Nenhuma pendência crítica</p>
              )}
            </div>

            <div className="rounded-2xl border bg-background p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Orçamento estimado</p>
              <p className="mt-3 text-3xl font-black leading-none text-orange-600">
                {preview ? formatCurrency(preview.resumo.totalEstimado) : '-'}
              </p>
              {preview && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {preview.resumo.totalServicos} serviço(s) · {preview.resumo.horasTotais.toFixed(0)}h · ticket {formatCurrency(preview.resumo.ticketMedio)}
                </p>
              )}
              <MinutaProposta
                payload={propostaModeloPayload ? JSON.stringify(propostaModeloPayload) : null}
                returnTo={returnTo}
                disabled={!propostaModeloPayload}
                display={
                  preview && empreendimento
                    ? {
                        cliente:
                          (empreendimento as EmpreendimentoDetail).empresa?.nome ??
                          empreendimento.nome,
                        empreendimento: nomeExibicao ?? empreendimento.nome,
                        cidade: empreendimento.cidade,
                        estado: empreendimento.estado,
                        codigoInterno: empreendimentoLista?.codigoInterno ?? null,
                        cnpj: empreendimento.cnpj ?? null,
                        bandeira: empreendimento.bandeira ?? null,
                        totalEstimado: preview.resumo.totalEstimado,
                        totalServicos: preview.resumo.totalServicos,
                        horasTotais: preview.resumo.horasTotais,
                        ticketMedio: preview.resumo.ticketMedio,
                        validadeDias: preview.premissas.validadePropostaDias,
                        itens: preview.itens.map((it) => ({
                          modulo: it.categoria,
                          descricao: it.servicoNome,
                          horas: undefined,
                          valor: it.total,
                        })),
                      }
                    : null
                }
              />
              {!propostaModeloPayload ? (
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  Para emitir a proposta modelo, o posto precisa ter preview disponível e ao menos um CNAE válido.
                </p>
              ) : null}
            </div>

            <a
              href={`/motor-orcamento?empreendimentoId=${selectedId}&etapa=${etapaAtiva}&t=${Date.now()}`}
              className="block text-center rounded-xl border border-dashed px-3 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-border"
            >
              <RefreshCcw className="inline h-3 w-3 mr-1" /> Atualizar preview
            </a>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ─── Cards de contexto por etapa (entradas/saídas/dependências) ─────────────

function EtapaContextoCards({ etapa }: { etapa: Etapa }) {
  const map: Record<Etapa, { entradas: string; saidas: string; deps: string }> = {
    triagem:        { entradas: 'CNPJ · Endereço · Bandeira · Atividade',                 saidas: 'Validação cadastral · Viabilidade inicial',   deps: 'Dados básicos do posto' },
    caracterizacao: { entradas: 'Equipamentos · Tanques · Bombas · ANP/INMETRO',          saidas: 'Perfil técnico consolidado',                   deps: 'Triagem concluída' },
    diagnostico:    { entradas: 'Perfil técnico · Histórico · Localização',                saidas: 'Classe de impacto · Score de risco',           deps: 'Caracterização' },
    obrigacoes:     { entradas: 'Diagnóstico · Catálogo regulatório',                      saidas: 'Lista priorizada de obrigações',               deps: 'Diagnóstico' },
    execucao:       { entradas: 'Obrigações priorizadas · Time técnico',                   saidas: 'Tarefas atribuídas · Processos abertos',       deps: 'Plano aprovado' },
    documentos:     { entradas: 'Demandas das obrigações · Histórico documental',          saidas: 'Documentos técnicos organizados',              deps: 'Execução em curso' },
    financeiro:     { entradas: 'Escopo técnico consolidado · Horas e orçamento estimados', saidas: 'Orçamento consolidado · Proposta pronta',     deps: 'Documentos · Gap analysis revisado' },
  }
  const cur = map[etapa]
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <ContextCard label="Entradas esperadas" text={cur.entradas} />
      <ContextCard label="Saídas esperadas" text={cur.saidas} />
      <ContextCard label="Dependências" text={cur.deps} />
    </div>
  )
}

function ContextCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">{label}</p>
      <p className="mt-2 text-sm leading-snug">{text}</p>
    </div>
  )
}

// ─── Painel: TRIAGEM ────────────────────────────────────────────────────────

function TriagemPanel({ detail, nome }: { detail: EmpreendimentoDetail | null; nome: string | null }) {
  if (!detail) return <EmptyPanel title="Triagem" message="Selecione um empreendimento para iniciar a triagem." />

  const endereco = `${detail.logradouro}, ${detail.numero}${detail.complemento ? ' ' + detail.complemento : ''} - ${detail.bairro}, ${detail.cidade}/${detail.estado} · CEP ${detail.cep}`

  return (
    <SectionBlock title="Triagem cadastral" subtitle={nome ?? ''} accent="slate">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="border-b lg:border-b-0 lg:border-r p-6 space-y-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Identificação e endereço
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FieldBlock label="CNPJ" value={detail.cnpj ?? '-'} />
            <FieldBlock label="Código interno" value={detail.codigoInterno ?? '-'} />
            <FieldBlock label="Bandeira" value={detail.bandeira ?? '-'} />
            <FieldBlock label="Tipo" value={detail.tipo ?? '-'} />
            <FieldBlock label="Início de operação" value={formatDate(detail.dataInicioOperacao)} />
            <FieldBlock label="Status" value={detail.ativo ? 'Ativo' : 'Inativo'} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">Endereço</p>
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-foreground flex gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span>{endereco}</span>
            </div>
          </div>

          {detail.atividades.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">Atividades cadastradas</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.atividades.map((a) => (
                  <span key={a} className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4 bg-muted/20">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Empresa proprietária</p>
          {detail.empresa ? (
            <div className="rounded-xl border bg-background p-4 space-y-2">
              <p className="text-sm font-bold text-foreground">{detail.empresa.razaoSocial ?? detail.empresa.nome}</p>
              {detail.empresa.razaoSocial && detail.empresa.nome !== detail.empresa.razaoSocial && (
                <p className="text-[11px] text-muted-foreground">Fantasia: {detail.empresa.nome}</p>
              )}
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Hash className="h-3 w-3" /> {detail.empresa.cnpj ?? '-'}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem empresa vinculada</p>
          )}

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Responsável técnico</p>
            <ResponsavelLine icon={User2} value={detail.responsavelTecnicoNome} />
            <ResponsavelLine icon={Hash} label="CREA" value={detail.responsavelTecnicoCrea} />
            <ResponsavelLine icon={Mail} value={detail.responsavelTecnicoEmail} />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Contato operacional</p>
            <ResponsavelLine icon={Mail} value={detail.contatoEmail} />
            <ResponsavelLine icon={Phone} value={detail.contatoTelefone} />
          </div>
        </div>
      </div>
    </SectionBlock>
  )
}

function ResponsavelLine({ icon: Icon, value, label }: { icon: typeof User2; value: string | null; label?: string }) {
  return (
    <p className="text-[12px] flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-foreground" />
      {label && <span className="text-muted-foreground">{label}:</span>}
      <span className={value ? 'text-foreground' : 'text-muted-foreground italic'}>{value ?? '-'}</span>
    </p>
  )
}

// ─── Painel: CARACTERIZAÇÃO ─────────────────────────────────────────────────

function CaracterizacaoPanel({ detail, bombas, tanques }: { detail: EmpreendimentoDetail | null; bombas: BombaItem[]; tanques: TanqueItem[] }) {
  if (!detail) return <EmptyPanel title="Caracterização" message="Selecione um empreendimento para caracterizar." />

  return (
    <SectionBlock title="Caracterização técnica" subtitle="Parque de equipamentos e ANP/INMETRO" accent="slate">
      <div className="p-6 space-y-6">

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FieldBlock label="Bombas" value={`${bombas.length}`} />
          <FieldBlock label="Tanques" value={`${tanques.length}`} />
          <FieldBlock label="Atividades" value={`${detail.atividades.length}`} />
          <FieldBlock label="Bandeira" value={detail.bandeira ?? '-'} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5" /> Bombas de abastecimento
            </p>
            <span className="text-[11px] text-muted-foreground">{bombas.length} unidade(s)</span>
          </div>
          {bombas.length > 0 ? (
            <div className="rounded-xl border divide-y overflow-hidden">
              {bombas.slice(0, 6).map((b) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Bomba {b.numero} · {b.fabricante}{b.modelo ? ` - ${b.modelo}` : ''}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {b.combustiveis.join(', ') || '-'} · Próx. calibração: {formatDate(b.proximaCalibracao)}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 border ${
                    b.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    b.status === 'MANUTENCAO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>{b.status}</span>
                </div>
              ))}
              {bombas.length > 6 && <div className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/10">+{bombas.length - 6} bomba(s) não exibida(s)</div>}
            </div>
          ) : (
            <p className="rounded-xl border bg-muted/20 px-4 py-6 text-sm text-muted-foreground text-center">Nenhuma bomba cadastrada</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" /> Tanques de combustível
            </p>
            <span className="text-[11px] text-muted-foreground">{tanques.length} unidade(s)</span>
          </div>
          {tanques.length > 0 ? (
            <div className="rounded-xl border divide-y overflow-hidden">
              {tanques.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Tanque {t.identificacao ?? t.id.slice(0, 6)} · {t.produto ?? '-'}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t.capacidadeLitros ? `${t.capacidadeLitros.toLocaleString('pt-BR')} L` : '-'} · Próx. teste: {formatDate(t.proximoTeste)}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 border ${
                    t.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    t.status === 'INTERDITADO' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>{t.status}</span>
                </div>
              ))}
              {tanques.length > 6 && <div className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/10">+{tanques.length - 6} tanque(s) não exibido(s)</div>}
            </div>
          ) : (
            <p className="rounded-xl border bg-muted/20 px-4 py-6 text-sm text-muted-foreground text-center">Nenhum tanque cadastrado</p>
          )}
        </div>

      </div>
    </SectionBlock>
  )
}

// ─── Painel: DIAGNÓSTICO ────────────────────────────────────────────────────

function DiagnosticoPanel({ risco, gap, preview }: { risco: RiscoAgregado | null; gap: GapAnalysisData | null; preview: OrcamentoPreview | null }) {
  const risc = risco ? riscoColor(risco.classificacao) : null

  return (
    <SectionBlock title="Diagnóstico regulatório" subtitle="Classe de impacto e enquadramento" accent="slate">
      <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
        <div className="border-b lg:border-b-0 lg:border-r p-6 space-y-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Score de risco</p>
          {risco ? (
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-2xl border p-5 ${risc!.chip}`}>
                <p className="text-[10px] uppercase tracking-[0.14em] font-semibold opacity-80">Score final</p>
                <p className={`mt-2 text-5xl font-black leading-none ${risc!.text}`}>{risco.scoreFinal}</p>
                <p className={`mt-2 text-xs font-semibold ${risc!.text}`}>
                  {risco.classificacao.charAt(0) + risco.classificacao.slice(1).toLowerCase()}
                </p>
              </div>
              <div className="space-y-3">
                <FieldBlock label="Classe" value={risco.classe} />
                <FieldBlock label="Calculado em" value={formatDate(risco.atualizadoEm)} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem score de risco calculado</p>
          )}

          {preview && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">Perfil regulatório</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldBlock label="Porte" value={preview.perfil.porte} />
                <FieldBlock label="Situação" value={preview.perfil.situacao} />
                <FieldBlock label="Potencial poluidor" value={preview.perfil.potencialPoluidor} />
                <FieldBlock label="Área (m²)" value={preview.perfil.areaM2.toLocaleString('pt-BR')} />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4 bg-muted/20">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Sinais regulatórios</p>
          {gap ? (
            <>
              <SignalRow label="Obrigações conformes" value={gap.conformes} tone="ok" />
              <SignalRow label="A renovar" value={gap.aRenovar} tone="warn" />
              <SignalRow label="Sem dados" value={gap.semDados} tone="danger" />
              <SignalRow label="Não aplicáveis" value={gap.naoAplicaveis} tone="neutral" />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Gap analysis indisponível</p>
          )}

          <div className="rounded-xl border bg-background p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Tipo de licenciamento sugerido</p>
            <p className="mt-2 text-sm text-foreground">
              {risco?.classificacao === 'CRITICO' || risco?.classificacao === 'ALTO'
                ? 'Licenciamento ordinário com EIA/RIMA'
                : risco?.classificacao === 'MODERADO'
                  ? 'Licenciamento ordinário simplificado'
                  : 'Licenciamento por adesão e compromisso (LAC)'}
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
              Sugestão derivada do score e da classe - validar com analista responsável.
            </p>
          </div>
        </div>
      </div>
    </SectionBlock>
  )
}

function SignalRow({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' | 'danger' | 'neutral' }) {
  const cls = tone === 'ok' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : tone === 'warn' ? 'text-amber-700 bg-amber-50 border-amber-200'
    : tone === 'danger' ? 'text-red-700 bg-red-50 border-red-200'
    : 'text-slate-600 bg-slate-50 border-slate-200'
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${cls}`}>{value}</span>
    </div>
  )
}

// ─── Painel: OBRIGAÇÕES ─────────────────────────────────────────────────────

function ObrigacoesPanel({ gap }: { gap: GapAnalysisData | null }) {
  if (!gap) return <EmptyPanel title="Obrigações" message="Gap analysis indisponível para o empreendimento." />

  const grupos: Record<string, GapItem[]> = {}
  for (const item of gap.itens) {
    const bucket = grupos[item.modulo] ?? (grupos[item.modulo] = [])
    bucket.push(item)
  }

  const ordemStatus = { SEM_DADOS: 0, A_RENOVAR: 1, CONFORME: 2, NAO_APLICAVEL: 3 } as const
  const ordemCrit = { CRITICA: 0, ALTA: 1, MEDIA: 2 } as const

  return (
    <SectionBlock title="Obrigações regulatórias" subtitle={`${gap.totalObrigacoes} obrigação(ões) avaliadas`} accent="slate">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FieldBlock label="Total" value={`${gap.totalObrigacoes}`} />
          <FieldBlock label="Conformes" value={`${gap.conformes}`} />
          <FieldBlock label="A renovar" value={`${gap.aRenovar}`} />
          <FieldBlock label="Sem dados" value={`${gap.semDados}`} />
        </div>

        {Object.entries(grupos).map(([modulo, itens]) => {
          const sorted = [...itens].sort((a, b) => {
            const diff = ordemStatus[a.status] - ordemStatus[b.status]
            if (diff !== 0) return diff
            return ordemCrit[a.criticidade] - ordemCrit[b.criticidade]
          })
          return (
            <div key={modulo}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-foreground font-bold">{modulo}</p>
                <span className="text-[11px] text-muted-foreground">{itens.length} obrigação(ões)</span>
              </div>
              <div className="rounded-xl border divide-y overflow-hidden">
                {sorted.map((i) => (
                  <div key={i.codigo} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/20">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{i.codigo}</p>
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${criticidadeColor(i.criticidade)}`}>
                          {i.criticidade}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{i.descricao}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${gapStatusColor(i.status)}`}>
                        {i.status.replace('_', ' ')}
                      </span>
                      {i.diasAteVencimento != null && (
                        <p className="text-[11px] text-muted-foreground mt-1">{i.diasAteVencimento}d</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </SectionBlock>
  )
}

// ─── Painel: EXECUÇÃO ───────────────────────────────────────────────────────

function ExecucaoPanel({ tarefas, processos }: { tarefas: TarefaItem[]; processos: ProcessoItem[] }) {
  const pendentes = tarefas.filter((t) => t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO')
  const concluidas = tarefas.filter((t) => t.status === 'CONCLUIDA').length

  return (
    <SectionBlock title="Execução" subtitle="Tarefas atribuídas e processos abertos" accent="slate">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FieldBlock label="Tarefas pendentes" value={`${pendentes.length}`} />
          <FieldBlock label="Tarefas concluídas" value={`${concluidas}`} />
          <FieldBlock label="Processos abertos" value={`${processos.length}`} />
          <FieldBlock label="Total tarefas" value={`${tarefas.length}`} />
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-foreground font-bold mb-2">Tarefas em andamento / pendentes</p>
          {pendentes.length > 0 ? (
            <div className="rounded-xl border divide-y overflow-hidden">
              {pendentes.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.titulo}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t.responsavel?.nome ?? 'Sem responsável'} · Prazo: {formatDate(t.prazo)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${
                    t.status === 'EM_ANDAMENTO' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>{t.status.replace('_', ' ')}</span>
                </div>
              ))}
              {pendentes.length > 8 && <div className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/10">+{pendentes.length - 8} tarefa(s) não exibida(s)</div>}
            </div>
          ) : (
            <p className="rounded-xl border bg-muted/20 px-4 py-6 text-sm text-muted-foreground text-center">Nenhuma tarefa pendente</p>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-foreground font-bold mb-2">Processos abertos</p>
          {processos.length > 0 ? (
            <div className="rounded-xl border divide-y overflow-hidden">
              {processos.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {p.numero ?? p.id.slice(0, 8)} · {p.tipo ?? '-'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {p.orgao ? `${p.orgao.sigla} - ${p.orgao.nome}` : '-'} · Fase: {p.fase ?? '-'} · Venc: {formatDate(p.vencimento)}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 border bg-slate-50 text-slate-700 border-slate-200">{p.status}</span>
                </div>
              ))}
              {processos.length > 6 && <div className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/10">+{processos.length - 6} processo(s) não exibido(s)</div>}
            </div>
          ) : (
            <p className="rounded-xl border bg-muted/20 px-4 py-6 text-sm text-muted-foreground text-center">Nenhum processo em andamento</p>
          )}
        </div>
      </div>
    </SectionBlock>
  )
}

// ─── Painel: DOCUMENTOS ─────────────────────────────────────────────────────

function DocumentosPanel({ documentos }: { documentos: DocumentoItem[] }) {
  const aprovados = documentos.filter((d) => d.status === 'APROVADO' || d.status === 'VIGENTE').length
  const pendentes = documentos.filter((d) => d.status === 'PENDENTE' || d.status === 'EM_ANALISE').length
  const vencidos  = documentos.filter((d) => d.status === 'VENCIDO').length

  return (
    <SectionBlock title="Documentos técnicos" subtitle="Acervo documental e status de vigência" accent="slate">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FieldBlock label="Total" value={`${documentos.length}`} />
          <FieldBlock label="Aprovados" value={`${aprovados}`} />
          <FieldBlock label="Pendentes" value={`${pendentes}`} />
          <FieldBlock label="Vencidos" value={`${vencidos}`} />
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-foreground font-bold mb-2">Documentos vinculados ao empreendimento</p>
          {documentos.length > 0 ? (
            <div className="rounded-xl border divide-y overflow-hidden">
              {documentos.slice(0, 10).map((d) => {
                const Icon = d.status === 'VENCIDO' ? FileWarning : d.status === 'PENDENTE' || d.status === 'EM_ANALISE' ? FileClock : FileCheck2
                const tone = d.status === 'VENCIDO' ? 'text-red-600'
                  : d.status === 'PENDENTE' || d.status === 'EM_ANALISE' ? 'text-amber-600'
                  : 'text-emerald-600'
                return (
                  <div key={d.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/20">
                    <div className="flex items-start gap-3 min-w-0">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${tone}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{d.nome}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {d.tipoDocumento?.nome ?? '-'} · Venc: {formatDate(d.dataVencimento)} · Upload: {formatDate(d.ultimaVersao?.criadoEm)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${
                      d.status === 'VENCIDO' ? 'bg-red-50 text-red-700 border-red-200' :
                      d.status === 'PENDENTE' || d.status === 'EM_ANALISE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>{d.status.replace('_', ' ')}</span>
                  </div>
                )
              })}
              {documentos.length > 10 && <div className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/10">+{documentos.length - 10} documento(s) não exibido(s)</div>}
            </div>
          ) : (
            <p className="rounded-xl border bg-muted/20 px-4 py-6 text-sm text-muted-foreground text-center">Nenhum documento cadastrado</p>
          )}
        </div>
      </div>
    </SectionBlock>
  )
}

// ─── Painel: FINANCEIRO (Motor de Orçamento original) ───────────────────────

function FinanceiroPanel({
  preview, nome, empreendimento, gapsCriticos, codigoInterno,
}: {
  preview: OrcamentoPreview | null
  nome: string | null
  empreendimento: EmpreendimentoDetail | EmpreendimentoOption | null
  gapsCriticos: GapItem[]
  codigoInterno: string | null
}) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
      <div className="border-b bg-slate-950 text-white px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-orange-200 font-semibold">Motor de decisão comercial</p>
        <h2 className="mt-2 text-xl font-bold">Motor de Orçamento</h2>
        <p className="mt-1 text-sm text-slate-300">
          {empreendimento
            ? `${codigoInterno ? codigoInterno + ' · ' : ''}${nome ?? '-'}`
            : 'Selecione um empreendimento'}
        </p>
      </div>

      {preview ? (
        <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-b lg:border-b-0 lg:border-r p-6 space-y-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              Enquadramento regulatório do empreendimento
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FieldBlock label="Multiplicador empresa" value={`${preview.premissas.multiplierEmpresa}×`} />
              <FieldBlock label="Desconto aplicado" value={`${(preview.premissas.descontoTotalPercentual * 100).toFixed(0)}%`} />
              <FieldBlock label="Validade da proposta" value={`${preview.premissas.validadePropostaDias} dias`} />
              <FieldBlock label="Total de serviços" value={`${preview.resumo.totalServicos}`} />
              <FieldBlock label="Horas técnicas" value={preview.resumo.horasTotais.toFixed(1)} />
              <FieldBlock label="Ticket médio" value={formatCurrency(preview.resumo.ticketMedio)} />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
                Serviços recomendados (top 6)
              </p>
              <div className="rounded-xl border divide-y">
                {preview.itens.slice(0, 6).map((it) => (
                  <div key={it.servicoCodigo} className="flex items-center justify-between px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{it.servicoNome}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{it.categoria} · {it.servicoCodigo}</p>
                    </div>
                    <p className="text-sm font-bold text-orange-600 shrink-0 ml-3">{formatCurrency(it.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 bg-muted/20">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              Validação do Orçamento
            </p>
            <ValidationRow label="Aderente ao rito" ok />
            <ValidationRow label="Há redundância de estudos" ok={false} />
            <ValidationRow label="Há ausência crítica" ok={gapsCriticos.length === 0} />

            <div className="rounded-xl border bg-background p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Orçamento consistente</p>
              <p className="mt-2 text-sm text-foreground leading-snug">
                Orçamento estimado em <strong>{formatCurrency(preview.resumo.totalEstimado)}</strong>,
                cobrindo <strong>{preview.gapsCobertos.length}</strong> gap(s) regulatório(s).
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Subtotal técnico: {formatCurrency(preview.resumo.subtotalTecnico)} · Desconto: {formatCurrency(preview.resumo.descontoVolume)}
              </p>
            </div>

            {gapsCriticos.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {gapsCriticos.length} item(ns) críticos pendentes
                </p>
                <p className="mt-1 text-[11px] text-amber-800 leading-snug">
                  Há obrigações com status SEM_DADOS ou A_RENOVAR de alta criticidade - revisar antes de emitir proposta.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-sm text-muted-foreground">
          Preview indisponível. Verifique se o empreendimento tem obrigações cadastradas e política de precificação configurada.
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes compartilhados ─────────────────────────────────────────

function SectionBlock({ title, subtitle, children }: { title: string; subtitle?: string; accent?: 'slate'; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
      <div className="border-b bg-slate-950 text-white px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-orange-200 font-semibold">Painel da Condução</p>
        <h2 className="mt-2 text-xl font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function EmptyPanel({ title, message }: { title: string; message: string }) {
  return (
    <SectionBlock title={title}>
      <div className="p-8 text-sm text-muted-foreground">{message}</div>
    </SectionBlock>
  )
}

function Chip({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Building2 }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-[11px]">
      {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
      <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  )
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">{label}</p>
      <p className="mt-1 text-base font-bold text-foreground">{value}</p>
    </div>
  )
}

function ValidationRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          ok
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-50 text-slate-600 border border-slate-200'
        }`}
      >
        {ok ? 'Sim' : 'Não'}
      </span>
    </div>
  )
}
