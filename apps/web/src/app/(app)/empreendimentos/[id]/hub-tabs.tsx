'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AprovacaoInline } from '@/app/(app)/documentos/aprovacao-inline'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cumprirCondicionanteAction } from '@/app/(app)/condicionantes/actions'
import { iniciarTarefaAction, concluirTarefaAction } from '@/app/(app)/tarefas/actions'

// ─── tipos ────────────────────────────────────────────────────────────────────

interface Documento {
  id: string
  nome: string
  status: string
  dataValidade: string | null
  tipoDocumento: { nome: string } | null
  versaoAtual: { id: string; status: string } | null
}

interface Condicionante {
  id: string
  descricao: string
  status: string
  proximoVencimento: string | null
  periodicidade: string
}

interface Tarefa {
  id: string
  titulo: string
  status: string
  prioridade: string
  dataVencimento: string | null
  responsavel: { nome: string } | null
}

interface Alerta {
  id: string
  titulo: string
  mensagem: string
  nivel: string
  tipo: string
  lido: boolean
  criadoEm: string
  referenciaHref?: string | null
}

interface Licenca {
  id: string
  tipo: string
  numero: string | null
  status: string
  dataVencimento: string | null
  orgaoEmissor: string | null
}

interface ASO {
  id: string
  funcionarioNome: string
  cargo: string | null
  tipo: string
  dataExame: string
  dataVencimento: string | null
  aptidao: string
}

interface DocumentoSST {
  id: string
  tipo: string
  responsavel: string | null
  dataVencimento: string | null
  status: string
}

interface Bomba {
  id: string
  numero: number
  fabricante: string
  modelo: string | null
  combustiveis: string[]
  ultimaCalibracao: string | null
  proximaCalibracao: string | null
  status: string
}

interface Tanque {
  id: string
  numero: number
  capacidadeLitros: number
  combustivel: string
  material: string | null
  status: string
  testes: { id: string; dataExecucao: string; resultado: string; proximoTeste: string }[]
}

interface Poco {
  id: string
  codigo: string
  profundidade: string | null
  outorgaDAEE: string | null
  validadeOutorga: string | null
  vazaoAutorizada: string | null
  status: string
  laudos: { id: string; dataCampanha: string; resultado: string }[]
}

interface MTR {
  id: string
  numeroMTR: string | null
  dataEmissao: string
  dataColeta: string | null
  status: string
  residuos: { tipo: string; quantidade: number; unidade: string }[]
  transportadora: { nome: string } | null
}

interface Campanha {
  id: string
  tipo: string
  dataColeta: string
  laboratorio: string
  resultado: string
  pocoMonitoramento: { id: string; codigo: string } | null
  _count: { parametros: number }
}

interface AutoInfracao {
  id: string
  orgao: string
  numeroAuto: string
  dataLavratura: string
  prazoDefesa: string
  status: string
  valorMulta: number | null
  _count: { recursos: number }
}

interface ChecklistExec {
  id: string
  status: string
  iniciadaEm: string
  finalizadaEm: string | null
  template: { nome: string; modulo: string }
  executadoPor: { nome: string }
  respostas: { status: string }[]
}

interface FuncionarioHub {
  id: string
  nome: string
  cargo: string
  setor: string | null
  vinculo: string
  ativo: boolean
  asoStatus: string
  treinamentoStatus: string
  epiStatus: string
  statusGeral: string
}

interface DiagnosticoFator { descricao: string; pontos: number; baseNormativa?: string | null; baseTecnica?: string | null }
interface DiagnosticoObrig {
  codigo: string
  descricao: string
  modulo: string | null
  criticidade: string | null
  fundamentoLegal: string | null
  status: string
  consequencia: string | null
  multaMaxima: string | null
  custoServico: number | null
  periodicidade: string | null
}
export interface DiagnosticoView {
  versao: number
  conformidadeScore: number
  riscoConformidadeScore: number
  riscoIntrinsecoScore: number
  riscoNivel: string
  engineVersion: string
  rulesVersion: string
  calculadoEm: string
  enquadramento: { cnae?: string | null; classeRisco?: string | null; potencialPoluidor?: string | null; esfera?: string | null; orgaoCompetente?: string | null; licenciamentoTipo?: string | null } | null
  fatoresRisco: { conformidade?: DiagnosticoFator[]; intrinseco?: { score: number; beta: boolean; fatores: DiagnosticoFator[] } } | null
  orcamento: { minimo: number; recomendado: number } | null
  obrigacoes: DiagnosticoObrig[]
}

export interface HubData {
  documentos: Documento[]
  condicionantes: Condicionante[]
  tarefas: Tarefa[]
  alertas: Alerta[]
  licencas: Licenca[]
  processos?: any[]
  asos: ASO[]
  documentosSST: DocumentoSST[]
  bombas: Bomba[]
  tanques: Tanque[]
  pocos: Poco[]
  mtrs: MTR[]
  campanhas: Campanha[]
  autos: AutoInfracao[]
  checklists: ChecklistExec[]
  funcionarios: FuncionarioHub[]
  empreendimentoId: string
  diagnostico?: DiagnosticoView | null
}

// ─── helpers visuais ──────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  EM_ANALISE: 'bg-blue-100 text-blue-700',
  APROVADO: 'bg-green-100 text-green-700',
  REJEITADO: 'bg-red-100 text-red-700',
  VENCIDO: 'bg-red-100 text-red-700',
  A_RENOVAR: 'bg-orange-100 text-orange-700',
  EM_CUMPRIMENTO: 'bg-blue-100 text-blue-700',
  CUMPRIDA: 'bg-green-100 text-green-700',
  DISPENSADA: 'bg-gray-100 text-gray-500',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  CONCLUIDA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-gray-100 text-gray-500',
  BLOQUEADA: 'bg-red-100 text-red-700',
  CRITICO: 'bg-red-100 text-red-700',
  ALTO: 'bg-orange-100 text-orange-700',
  MEDIO: 'bg-yellow-100 text-yellow-700',
  BAIXO: 'bg-green-100 text-green-700',
  VIGENTE: 'bg-green-100 text-green-700',
  EXPIRADA: 'bg-red-100 text-red-700',
  EM_RENOVACAO: 'bg-blue-100 text-blue-700',
  APTO: 'bg-green-100 text-green-700',
  INAPTO: 'bg-red-100 text-red-700',
  APTO_COM_RESTRICAO: 'bg-yellow-100 text-yellow-700',
  CALIBRADA: 'bg-green-100 text-green-700',
  RECEBIDO: 'bg-blue-100 text-blue-700',
  EM_DEFESA: 'bg-yellow-100 text-yellow-700',
  AGUARDANDO_JULGAMENTO: 'bg-orange-100 text-orange-700',
  JULGADO_FAVORAVEL: 'bg-green-100 text-green-700',
  JULGADO_DESFAVORAVEL: 'bg-red-100 text-red-700',
  EM_RECURSO: 'bg-purple-100 text-purple-700',
  ENCERRADO: 'bg-gray-100 text-gray-500',
  CONFORME: 'bg-green-100 text-green-700',
  NAO_CONFORME: 'bg-red-100 text-red-700',
  AGUARDANDO_LAB: 'bg-blue-100 text-blue-700',
  EMITIDO: 'bg-blue-100 text-blue-700',
  COLETADO: 'bg-yellow-100 text-yellow-700',
  DESTINADO: 'bg-green-100 text-green-700',
  APROVADO_LAUDO: 'bg-green-100 text-green-700',
  REPROVADO_LAUDO: 'bg-red-100 text-red-700',
}

function Chip({ label, status }: { label: string; status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000)
}

function UrgencyText({ dias, suffix = '' }: { dias: number | null; suffix?: string }) {
  if (dias === null) return <span className="text-muted-foreground">Sem prazo</span>
  if (dias < 0) return <span className="text-red-600 font-medium">Vencido há {Math.abs(dias)}d{suffix}</span>
  if (dias <= 30) return <span className="text-orange-600">{dias}d restantes{suffix}</span>
  return <span className="text-muted-foreground">{suffix || `${dias}d`}</span>
}

// ─── aba documentos ───────────────────────────────────────────────────────────

function AbaDocumentos({ docs, empId }: { docs: Documento[]; empId: string }) {
  if (docs.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum documento cadastrado.</p>

  return (
    <div className="divide-y">
      {docs.map((d) => {
        const dias = diasRestantes(d.dataValidade)
        const urgente = dias !== null && dias >= 0 && dias <= 30
        const vencido = dias !== null && dias < 0
        return (
          <div key={d.id} className="flex items-center justify-between px-4 py-3 gap-4">
            <div className="flex-1 min-w-0">
              <Link href={`/documentos/${d.id}`} className="text-sm font-medium hover:underline truncate block">
                {d.tipoDocumento?.nome ?? d.nome}
              </Link>
              <p className={`text-xs mt-0.5 ${vencido ? 'text-red-600 font-medium' : urgente ? 'text-orange-600' : 'text-muted-foreground'}`}>
                {d.dataValidade
                  ? `${formatDate(d.dataValidade)}${dias !== null ? (vencido ? ` · vencido há ${Math.abs(dias)}d` : urgente ? ` · ${dias}d` : '') : ''}`
                  : 'Sem validade'}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <Chip label={d.status.replace(/_/g, ' ')} status={d.status} />
              {d.status === 'EM_ANALISE' && d.versaoAtual?.status === 'ENVIADA' && (
                <AprovacaoInline documentoId={d.id} versaoId={d.versaoAtual.id} size="sm" />
              )}
            </div>
          </div>
        )
      })}
      <div className="px-4 py-2">
        <Link href={`/documentos?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver todos os documentos →
        </Link>
      </div>
    </div>
  )
}

// ─── aba condicionantes ───────────────────────────────────────────────────────

function AbaCondicionantes({ conds, empId }: { conds: Condicionante[]; empId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [cumprindo, setCumprindo] = useState<string | null>(null)
  const [obs, setObs] = useState('')

  async function cumprir(id: string) {
    start(async () => {
      await cumprirCondicionanteAction(id, obs || undefined)
      setCumprindo(null)
      setObs('')
      router.refresh()
    })
  }

  if (conds.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma condicionante cadastrada.</p>

  return (
    <div className="divide-y">
      {conds.map((c) => {
        const dias = diasRestantes(c.proximoVencimento)
        const urgente = dias !== null && dias <= 7
        return (
          <div key={c.id} className="px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Link href={`/condicionantes/${c.id}`} className="text-sm font-medium hover:underline">
                  {c.descricao}
                </Link>
                <p className={`text-xs mt-0.5 ${urgente ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                  {c.proximoVencimento
                    ? `Vence ${formatDate(c.proximoVencimento)}${dias !== null ? ` · ${dias <= 0 ? 'vencida' : `${dias}d`}` : ''}`
                    : 'Sem vencimento'}{' '}· {c.periodicidade}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Chip label={c.status.replace(/_/g, ' ')} status={c.status} />
                {['PENDENTE', 'EM_CUMPRIMENTO'].includes(c.status) && (
                  <button
                    onClick={() => setCumprindo(cumprindo === c.id ? null : c.id)}
                    className="text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Cumprir
                  </button>
                )}
              </div>
            </div>
            {cumprindo === c.id && (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Observação (opcional)"
                  className="flex-1 rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button onClick={() => cumprir(c.id)} disabled={pending} className="text-xs px-2.5 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {pending ? '...' : 'Confirmar'}
                </button>
                <button onClick={() => setCumprindo(null)} className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors">Cancelar</button>
              </div>
            )}
          </div>
        )
      })}
      <div className="px-4 py-2">
        <Link href={`/condicionantes?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver todas as condicionantes →
        </Link>
      </div>
    </div>
  )
}

// ─── (AbaTarefas e AbaAlertas foram consolidadas em AbaPrioridades) ───────────

// ─── aba licenças ambientais ──────────────────────────────────────────────────

function AbaLicencas({ licencas, empId }: { licencas: Licenca[]; empId: string }) {
  if (licencas.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma licença cadastrada.</p>

  return (
    <div className="divide-y">
      {licencas.map((l) => {
        const dias = diasRestantes(l.dataVencimento)
        const urgente = dias !== null && dias >= 0 && dias <= 30
        const vencida = dias !== null && dias < 0
        return (
          <div key={l.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex-1 min-w-0">
              <Link href={`/licencas-ambientais/${l.id}`} className="text-sm font-medium hover:underline">
                {l.tipo}{l.numero ? ` · ${l.numero}` : ''}
              </Link>
              <p className={`text-xs mt-0.5 ${vencida ? 'text-red-600 font-medium' : urgente ? 'text-orange-600' : 'text-muted-foreground'}`}>
                {l.orgaoEmissor ?? '—'} · {l.dataVencimento ? formatDate(l.dataVencimento) : 'Sem vencimento'}
                {dias !== null && (vencida ? ` · vencida há ${Math.abs(dias)}d` : urgente ? ` · ${dias}d` : '')}
              </p>
            </div>
            <Chip label={l.status.replace(/_/g, ' ')} status={l.status} />
          </div>
        )
      })}
      <div className="px-4 py-2">
        <Link href={`/licencas-ambientais?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver todas as licenças →
        </Link>
      </div>
    </div>
  )
}

// ─── aba SST ──────────────────────────────────────────────────────────────────

function AbaSST({ asos, docs, empId }: { asos: ASO[]; docs: DocumentoSST[]; empId: string }) {
  const asoVencidos = asos.filter((a) => { const d = diasRestantes(a.dataVencimento); return d !== null && d < 0 })
  const asoUrgentes = asos.filter((a) => { const d = diasRestantes(a.dataVencimento); return d !== null && d >= 0 && d <= 30 })
  const docsVencidos = docs.filter((d) => { const r = diasRestantes(d.dataVencimento); return r !== null && r < 0 })

  if (asos.length === 0 && docs.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro SST.</p>

  return (
    <div>
      {(asoVencidos.length > 0 || asoUrgentes.length > 0 || docsVencidos.length > 0) && (
        <div className="mx-4 mt-3 mb-1 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
          {asoVencidos.length > 0 && <span>{asoVencidos.length} ASO(s) vencido(s). </span>}
          {asoUrgentes.length > 0 && <span>{asoUrgentes.length} ASO(s) vencendo em 30 dias. </span>}
          {docsVencidos.length > 0 && <span>{docsVencidos.length} documento(s) SST vencido(s).</span>}
        </div>
      )}

      {asos.length > 0 && (
        <>
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ASOs</p>
          <div className="divide-y">
            {asos.map((a) => {
              const dias = diasRestantes(a.dataVencimento)
              return (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.funcionarioNome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.cargo ?? 'Sem cargo'} · {a.tipo} · Exame: {formatDate(a.dataExame)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Chip label={a.aptidao.replace(/_/g, ' ')} status={a.aptidao} />
                    {a.dataVencimento && (
                      <span className="text-xs">
                        <UrgencyText dias={dias} />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {docs.length > 0 && (
        <>
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Documentos SST</p>
          <div className="divide-y">
            {docs.map((d) => {
              const dias = diasRestantes(d.dataVencimento)
              return (
                <div key={d.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{d.tipo.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.responsavel ?? 'Sem responsável'} · Validade: {formatDate(d.dataVencimento)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Chip label={d.status.replace(/_/g, ' ')} status={d.status} />
                    <span className="text-xs"><UrgencyText dias={dias} /></span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="px-4 py-2 border-t">
        <Link href={`/sst?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver SST completo →
        </Link>
      </div>
    </div>
  )
}

// ─── aba ANP/INMETRO ──────────────────────────────────────────────────────────

function AbaANP({ bombas, empId }: { bombas: Bomba[]; empId: string }) {
  if (bombas.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma bomba cadastrada.</p>

  const vencendo = bombas.filter((b) => { const d = diasRestantes(b.proximaCalibracao); return d !== null && d <= 30 })

  return (
    <div>
      {vencendo.length > 0 && (
        <div className="mx-4 mt-3 mb-1 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
          {vencendo.length} bomba(s) com calibração vencendo em 30 dias.
        </div>
      )}
      <div className="divide-y">
        {bombas.map((b) => {
          const dias = diasRestantes(b.proximaCalibracao)
          return (
            <div key={b.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Bomba #{b.numero} — {b.fabricante}{b.modelo ? ` ${b.modelo}` : ''}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {b.combustiveis.join(', ')} · Última cal.: {formatDate(b.ultimaCalibracao)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Chip label={b.status.replace(/_/g, ' ')} status={b.status} />
                <span className="text-xs"><UrgencyText dias={dias} /></span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2 border-t">
        <Link href={`/anp-inmetro?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver ANP/INMETRO completo →
        </Link>
      </div>
    </div>
  )
}

// ─── aba estanqueidade ────────────────────────────────────────────────────────

function AbaEstanqueidade({ tanques, empId }: { tanques: Tanque[]; empId: string }) {
  if (tanques.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum tanque cadastrado.</p>

  const vencendo = tanques.filter((t) => {
    const ultimo = t.testes[0]
    if (!ultimo?.proximoTeste) return false
    const d = diasRestantes(ultimo.proximoTeste)
    return d !== null && d <= 60
  })

  return (
    <div>
      {vencendo.length > 0 && (
        <div className="mx-4 mt-3 mb-1 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
          {vencendo.length} tanque(s) com ensaio de estanqueidade vencendo em 60 dias.
        </div>
      )}
      <div className="divide-y">
        {tanques.map((t) => {
          const ultimo = t.testes[0]
          const diasProximo = diasRestantes(ultimo?.proximoTeste)
          return (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Tanque #{t.numero} — {t.combustivel}
                  <span className="text-muted-foreground font-normal"> · {(t.capacidadeLitros / 1000).toFixed(0)}m³</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.material ?? 'Material não informado'}
                  {ultimo
                    ? ` · Último ensaio: ${formatDate(ultimo.dataExecucao)} (${ultimo.resultado})`
                    : ' · Sem ensaio registrado'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Chip label={t.status.replace(/_/g, ' ')} status={t.status} />
                {ultimo?.proximoTeste && (
                  <span className="text-xs"><UrgencyText dias={diasProximo} /></span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2 border-t">
        <Link href={`/estanqueidade?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver estanqueidade completa →
        </Link>
      </div>
    </div>
  )
}

// ─── aba outorga hídrica ──────────────────────────────────────────────────────

function AbaOutorga({ pocos, empId }: { pocos: Poco[]; empId: string }) {
  if (pocos.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum poço artesiano cadastrado.</p>

  return (
    <div className="divide-y">
      {pocos.map((p) => {
        const dias = diasRestantes(p.validadeOutorga)
        const urgente = dias !== null && dias >= 0 && dias <= 90
        const vencida = dias !== null && dias < 0
        const ultimoLaudo = p.laudos[0]
        return (
          <div key={p.id} className="px-4 py-3 space-y-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Poço {p.codigo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.profundidade ? `Prof. ${p.profundidade}m` : 'Profundidade não informada'}
                  {p.vazaoAutorizada && ` · Vazão: ${p.vazaoAutorizada}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Chip label={p.status.replace(/_/g, ' ')} status={p.status} />
              </div>
            </div>
            {p.outorgaDAEE && (
              <p className={`text-xs ${vencida ? 'text-red-600 font-medium' : urgente ? 'text-orange-600' : 'text-muted-foreground'}`}>
                Outorga {p.outorgaDAEE} · Validade: {formatDate(p.validadeOutorga)}
                {dias !== null && (vencida ? ` · vencida há ${Math.abs(dias)}d` : urgente ? ` · ${dias}d` : '')}
              </p>
            )}
            {ultimoLaudo && (
              <p className="text-xs text-muted-foreground">
                Último laudo: {formatDate(ultimoLaudo.dataCampanha)} · {ultimoLaudo.resultado}
              </p>
            )}
          </div>
        )
      })}
      <div className="px-4 py-2">
        <Link href={`/outorga-hidrica?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver outorga hídrica completa →
        </Link>
      </div>
    </div>
  )
}

// ─── aba logística reversa ────────────────────────────────────────────────────

function AbaLogistica({ mtrs, empId }: { mtrs: MTR[]; empId: string }) {
  if (mtrs.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum MTR registrado.</p>

  const emAberto = mtrs.filter((m) => !['DESTINADO', 'ENCERRADO'].includes(m.status))

  return (
    <div>
      {emAberto.length > 0 && (
        <div className="mx-4 mt-3 mb-1 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          {emAberto.length} MTR(s) em aberto aguardando destinação.
        </div>
      )}
      <div className="divide-y">
        {mtrs.map((m) => {
          const totalKg = m.residuos.reduce((s, r) => s + (r.unidade === 'kg' ? r.quantidade : 0), 0)
          return (
            <div key={m.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  MTR {m.numeroMTR ?? m.id.slice(0, 8)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Emissão: {formatDate(m.dataEmissao)}
                  {m.dataColeta && ` · Coleta: ${formatDate(m.dataColeta)}`}
                  {m.transportadora && ` · ${m.transportadora.nome}`}
                  {totalKg > 0 && ` · ${totalKg}kg`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.residuos.map((r) => r.tipo).join(', ')}
                </p>
              </div>
              <Chip label={m.status.replace(/_/g, ' ')} status={m.status} />
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2 border-t">
        <Link href={`/logistica-reversa?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver logística reversa completa →
        </Link>
      </div>
    </div>
  )
}

// ─── aba monitoramento ────────────────────────────────────────────────────────

function AbaMonitoramento({ campanhas, empId }: { campanhas: Campanha[]; empId: string }) {
  if (campanhas.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma campanha de monitoramento.</p>

  return (
    <div className="divide-y">
      {campanhas.map((c) => (
        <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {c.tipo.replace(/_/g, ' ')}
              {c.pocoMonitoramento && <span className="text-muted-foreground font-normal"> · Poço {c.pocoMonitoramento.codigo}</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {c.laboratorio} · Coleta: {formatDate(c.dataColeta)} · {c._count.parametros} parâmetro(s)
            </p>
          </div>
          <Chip
            label={c.resultado.replace(/_/g, ' ')}
            status={c.resultado === 'CONFORME' ? 'CONFORME' : c.resultado === 'NAO_CONFORME' ? 'NAO_CONFORME' : 'AGUARDANDO_LAB'}
          />
        </div>
      ))}
      <div className="px-4 py-2">
        <Link href={`/monitoramento?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver monitoramento completo →
        </Link>
      </div>
    </div>
  )
}

// ─── aba fiscalizações ────────────────────────────────────────────────────────

function AbaFiscalizacoes({ autos, empId }: { autos: AutoInfracao[]; empId: string }) {
  if (autos.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum auto de infração registrado.</p>

  const emAberto = autos.filter((a) => !['ENCERRADO', 'PAGO', 'JULGADO_FAVORAVEL'].includes(a.status))

  return (
    <div>
      {emAberto.length > 0 && (
        <div className="mx-4 mt-3 mb-1 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {emAberto.length} auto(s) de infração em aberto.
        </div>
      )}
      <div className="divide-y">
        {autos.map((a) => {
          const diasDefesa = diasRestantes(a.prazoDefesa)
          const prazoUrgente = diasDefesa !== null && diasDefesa >= 0 && diasDefesa <= 7
          const prazoVencido = diasDefesa !== null && diasDefesa < 0
          return (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex-1 min-w-0">
                <Link href={`/fiscalizacoes/${a.id}`} className="text-sm font-medium hover:underline">
                  Auto #{a.numeroAuto} — {a.orgao}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lavrado: {formatDate(a.dataLavratura)}
                  {a.valorMulta != null && ` · R$ ${a.valorMulta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  {a._count.recursos > 0 && ` · ${a._count.recursos} recurso(s)`}
                </p>
                {a.prazoDefesa && (
                  <p className={`text-xs mt-0.5 ${prazoVencido ? 'text-red-600 font-medium' : prazoUrgente ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                    Prazo defesa: {formatDate(a.prazoDefesa)}
                    {diasDefesa !== null && (prazoVencido ? ` · vencido há ${Math.abs(diasDefesa)}d` : prazoUrgente ? ` · ${diasDefesa}d` : '')}
                  </p>
                )}
              </div>
              <Chip label={a.status.replace(/_/g, ' ')} status={a.status} />
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2 border-t">
        <Link href={`/fiscalizacoes?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver fiscalizações completas →
        </Link>
      </div>
    </div>
  )
}

// ─── aba checklists ───────────────────────────────────────────────────────────

function AbaChecklists({ checklists, empId }: { checklists: ChecklistExec[]; empId: string }) {
  const statusCls: Record<string, string> = {
    EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
    CONFORME:     'bg-green-100 text-green-700',
    PARCIAL:      'bg-yellow-100 text-yellow-700',
    NAO_CONFORME: 'bg-red-100 text-red-700',
  }
  const statusLabel: Record<string, string> = {
    EM_ANDAMENTO: 'Em andamento',
    CONFORME:     'Conforme',
    PARCIAL:      'Parcial',
    NAO_CONFORME: 'Não conforme',
  }

  return (
    <div>
      <div className="px-4 py-2 border-b flex items-center justify-between bg-muted/20">
        <p className="text-xs text-muted-foreground">{checklists.length} execução{checklists.length !== 1 ? 'ões' : ''}</p>
        <Link href={`/checklists?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Novo checklist →
        </Link>
      </div>
      {checklists.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum checklist realizado.</p>
      ) : (
        <div className="divide-y">
          {checklists.map((c) => {
            const criticos = c.respostas.filter((r) => r.status === 'CRITICO').length
            return (
              <Link key={c.id} href={`/checklists/${c.id}`} className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-muted/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.template.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.executadoPor.nome} · {formatDate(c.finalizadaEm ?? c.iniciadaEm)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {criticos > 0 && (
                    <span className="text-xs text-red-700 font-medium">{criticos} crítico{criticos !== 1 ? 's' : ''}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel[c.status] ?? c.status}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── aba funcionários ─────────────────────────────────────────────────────────

const statusGeralHubCls: Record<string, string> = {
  OK:      'bg-green-100 text-green-800',
  ATENCAO: 'bg-yellow-100 text-yellow-800',
  CRITICO: 'bg-red-100 text-red-800',
}

const subStatusHubCls: Record<string, string> = {
  OK:      'text-green-700',
  ATENCAO: 'text-yellow-700',
  VENCENDO:'text-yellow-700',
  VENCIDO: 'text-red-700',
  INAPTO:  'text-red-700',
  AUSENTE: 'text-gray-400',
}

function AbaFuncionarios({ funcionarios, empId }: { funcionarios: FuncionarioHub[]; empId: string }) {
  const criticos = funcionarios.filter((f) => f.statusGeral === 'CRITICO').length
  const atencao  = funcionarios.filter((f) => f.statusGeral === 'ATENCAO').length

  return (
    <div>
      {criticos > 0 && (
        <div className="mx-4 mt-3 mb-1 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {criticos} funcionário{criticos !== 1 ? 's' : ''} em situação crítica (ASO/treinamento/EPI vencido).
        </div>
      )}
      {atencao > 0 && criticos === 0 && (
        <div className="mx-4 mt-3 mb-1 rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          {atencao} funcionário{atencao !== 1 ? 's' : ''} requer{atencao === 1 ? '' : 'em'} atenção.
        </div>
      )}
      {funcionarios.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum funcionário cadastrado.</p>
      ) : (
        <div className="divide-y">
          {funcionarios.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/funcionarios/${f.id}`} className="text-sm font-medium hover:underline">
                    {f.nome}
                  </Link>
                  {!f.ativo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                      Desligado
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {f.cargo}{f.setor ? ` · ${f.setor}` : ''}{' '}
                  <span className="text-blue-600">{f.vinculo}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Sub-status mini */}
                <div className="hidden sm:flex items-center gap-2 text-[10px]">
                  {([['ASO', f.asoStatus], ['NRs', f.treinamentoStatus], ['EPI', f.epiStatus]] as const).map(([label, status]) => (
                    <div key={label} className="flex flex-col items-center">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`font-semibold ${subStatusHubCls[status] ?? 'text-gray-400'}`}>
                        {status === 'OK' ? 'OK' : status.charAt(0) + status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusGeralHubCls[f.statusGeral] ?? 'bg-gray-100 text-gray-600'}`}>
                  {f.statusGeral === 'OK' ? 'OK' : f.statusGeral === 'ATENCAO' ? 'Atenção' : 'Crítico'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="px-4 py-2 border-t flex items-center justify-between">
        <Link href={`/funcionarios?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          Ver todos os funcionários →
        </Link>
        <Link href={`/funcionarios/novo?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
          + Novo funcionário
        </Link>
      </div>
    </div>
  )
}

// ─── aba prioridades (combinada: alertas críticos + tarefas urgentes) ──────────

function AbaPrioridades({ alertas, tarefas, empId }: { alertas: Alerta[]; tarefas: Tarefa[]; empId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  async function agir(id: string, status: string) {
    start(async () => {
      if (status === 'PENDENTE') await iniciarTarefaAction(id)
      else await concluirTarefaAction(id)
      router.refresh()
    })
  }

  const alertasCriticos = alertas.filter((a) => !a.lido && ['CRITICO', 'ALTO'].includes(a.nivel))
  const tarefasUrgentes = tarefas.filter((t) => {
    const d = diasRestantes(t.dataVencimento)
    return ['PENDENTE', 'EM_ANDAMENTO'].includes(t.status) && (
      ['CRITICA', 'ALTA'].includes(t.prioridade) ||
      (d !== null && d <= 30)
    )
  }).sort((a, b) => {
    const da = diasRestantes(a.dataVencimento) ?? 9999
    const db = diasRestantes(b.dataVencimento) ?? 9999
    return da - db
  })

  const nivelLabel: Record<string, string> = { CRITICO: 'Crítico', ALTO: 'Alto', MEDIO: 'Médio', BAIXO: 'Baixo' }
  const nivelCls: Record<string, string> = {
    CRITICO: 'border-l-4 border-l-red-500 bg-red-50/60',
    ALTO: 'border-l-4 border-l-orange-400 bg-orange-50/60',
  }

  if (alertasCriticos.length === 0 && tarefasUrgentes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-2xl">✓</span>
        </div>
        <p className="text-sm font-semibold text-emerald-700">Nenhuma prioridade pendente</p>
        <p className="text-xs text-muted-foreground">Todos os alertas e tarefas críticas estão em dia.</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {/* Alertas */}
      {alertasCriticos.length > 0 && (
        <>
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Alertas — {alertasCriticos.length} ativo{alertasCriticos.length !== 1 ? 's' : ''}
            </p>
          </div>
          {alertasCriticos.map((a) => (
            <div key={a.id} className={`px-4 py-3 flex gap-3 ${nivelCls[a.nivel] ?? ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Chip label={nivelLabel[a.nivel] ?? a.nivel} status={a.nivel} />
                  <span className="text-xs text-muted-foreground">{formatDate(a.criadoEm)}</span>
                </div>
                <p className="text-sm font-semibold">{a.titulo}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.mensagem}</p>
                {a.referenciaHref && (
                  <Link href={a.referenciaHref} className="text-xs text-primary hover:underline mt-1 inline-block">
                    Ver registro →
                  </Link>
                )}
              </div>
            </div>
          ))}
          <div className="px-4 py-2">
            <Link href={`/alertas?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
              Ver todos os alertas →
            </Link>
          </div>
        </>
      )}

      {/* Tarefas urgentes */}
      {tarefasUrgentes.length > 0 && (
        <>
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Tarefas prioritárias — {tarefasUrgentes.length}
            </p>
          </div>
          {tarefasUrgentes.map((t) => {
            const dias = diasRestantes(t.dataVencimento)
            const atrasada = dias !== null && dias < 0
            return (
              <div key={t.id} className={`flex items-center justify-between px-4 py-3 gap-3 ${atrasada ? 'bg-red-50/40' : ''}`}>
                <div className="flex-1 min-w-0">
                  <Link href={`/tarefas/${t.id}`} className="text-sm font-medium hover:underline truncate block">{t.titulo}</Link>
                  <p className={`text-xs mt-0.5 ${atrasada ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                    {t.responsavel?.nome ?? 'Sem responsável'}
                    {t.dataVencimento && ` · ${formatDate(t.dataVencimento)}${atrasada ? ` (${Math.abs(dias!)}d atraso)` : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Chip label={t.prioridade} status={t.prioridade === 'CRITICA' || t.prioridade === 'ALTA' ? 'CRITICO' : 'MEDIO'} />
                  {['PENDENTE', 'EM_ANDAMENTO'].includes(t.status) && (
                    <button
                      onClick={() => agir(t.id, t.status)}
                      disabled={pending}
                      className="text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {t.status === 'PENDENTE' ? 'Iniciar' : 'Concluir'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          <div className="px-4 py-2">
            <Link href={`/tarefas?empreendimentoId=${empId}`} className="text-xs text-primary hover:underline">
              Ver todas as tarefas →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

// ─── aba licenças + condicionantes ────────────────────────────────────────────

function TabLicencas({ licencas, conds, empId }: { licencas: Licenca[]; conds: Condicionante[]; empId: string }) {
  return (
    <div>
      <div className="px-4 py-2.5 bg-muted/30 border-b">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Licenças Ambientais</p>
      </div>
      <AbaLicencas licencas={licencas} empId={empId} />
      <div className="px-4 py-2.5 bg-muted/30 border-y">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Condicionantes</p>
      </div>
      <AbaCondicionantes conds={conds} empId={empId} />
    </div>
  )
}

// ─── aba equipamentos (tanques + bombas) ──────────────────────────────────────

function TabEquipamentos({ tanques, bombas, empId }: { tanques: Tanque[]; bombas: Bomba[]; empId: string }) {
  return (
    <div>
      <div className="px-4 py-2.5 bg-muted/30 border-b">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Tanques & Estanqueidade — {tanques.length} compartimento{tanques.length !== 1 ? 's' : ''}
        </p>
      </div>
      <AbaEstanqueidade tanques={tanques} empId={empId} />
      <div className="px-4 py-2.5 bg-muted/30 border-y">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Bombas / ANP-INMETRO — {bombas.length} bomba{bombas.length !== 1 ? 's' : ''}
        </p>
      </div>
      <AbaANP bombas={bombas} empId={empId} />
    </div>
  )
}

// ─── aba operacional (MTR + monitoramento + fiscalizações + checklists + outorga) ─

function TabOperacional({ pocos, mtrs, campanhas, autos, checklists, empId }: {
  pocos: Poco[]; mtrs: MTR[]; campanhas: Campanha[]; autos: AutoInfracao[]; checklists: ChecklistExec[]; empId: string
}) {
  return (
    <div>
      {pocos.length > 0 && (
        <>
          <div className="px-4 py-2.5 bg-muted/30 border-b">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Outorga Hídrica</p>
          </div>
          <AbaOutorga pocos={pocos} empId={empId} />
        </>
      )}
      <div className="px-4 py-2.5 bg-muted/30 border-b">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Logística Reversa (MTR)</p>
      </div>
      <AbaLogistica mtrs={mtrs} empId={empId} />
      <div className="px-4 py-2.5 bg-muted/30 border-y">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Monitoramento Ambiental</p>
      </div>
      <AbaMonitoramento campanhas={campanhas} empId={empId} />
      <div className="px-4 py-2.5 bg-muted/30 border-y">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Fiscalizações</p>
      </div>
      <AbaFiscalizacoes autos={autos} empId={empId} />
      <div className="px-4 py-2.5 bg-muted/30 border-y">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Checklists</p>
      </div>
      <AbaChecklists checklists={checklists} empId={empId} />
    </div>
  )
}

// ─── aba pessoas (SST + ASOs + funcionários) ──────────────────────────────────

function TabPessoas({ asos, documentosSST, funcionarios, empId }: {
  asos: ASO[]; documentosSST: DocumentoSST[]; funcionarios: FuncionarioHub[]; empId: string
}) {
  return (
    <div>
      <div className="px-4 py-2.5 bg-muted/30 border-b">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">SST — Saúde & Segurança</p>
      </div>
      <AbaSST asos={asos} docs={documentosSST} empId={empId} />
      <div className="px-4 py-2.5 bg-muted/30 border-y">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Funcionários</p>
      </div>
      <AbaFuncionarios funcionarios={funcionarios} empId={empId} />
    </div>
  )
}

// ─── aba diagnóstico (fonte única — Blueprint 101) ─────────────────────────────

const STATUS_OBRIG_LABEL: Record<string, string> = {
  CONFORME: 'Conforme', A_RENOVAR: 'A renovar', SEM_DADOS: 'Sem dados', NAO_APLICAVEL: 'N/A',
}
const STATUS_OBRIG_COLOR: Record<string, string> = {
  CONFORME: 'bg-green-100 text-green-700', A_RENOVAR: 'bg-orange-100 text-orange-700',
  SEM_DADOS: 'bg-gray-100 text-gray-500', NAO_APLICAVEL: 'bg-gray-100 text-gray-400',
}
const NIVEL_LABEL: Record<string, string> = { CRITICO: 'Crítico', ALTO: 'Alto', MEDIO: 'Médio', BAIXO: 'Baixo' }

function ScoreCard({ titulo, valor, sufixo, status, hint }: { titulo: string; valor: string | number; sufixo?: string; status?: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{valor}</span>
        {sufixo && <span className="text-sm text-muted-foreground">{sufixo}</span>}
        {status && <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${statusColor[status] ?? 'bg-gray-100 text-gray-600'}`}>{NIVEL_LABEL[status] ?? status}</span>}
      </div>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function fmtMoeda(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function AbaDiagnostico({ diag, empId }: { diag: DiagnosticoView | null | undefined; empId: string }) {
  if (!diag) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-sm font-medium">Diagnóstico ainda não calculado</p>
        <p className="text-xs text-muted-foreground">Edite o cadastro do posto para gerar o diagnóstico regulatório.</p>
      </div>
    )
  }

  const enq = diag.enquadramento
  const cadastroIncompleto = !enq?.potencialPoluidor // sem CNAE/matriz → motor não sabe as obrigações
  const intr = diag.fatoresRisco?.intrinseco
  const gaps = diag.obrigacoes.filter((o) => o.status === 'A_RENOVAR' || o.status === 'SEM_DADOS')

  return (
    <div className="p-4 space-y-5">
      <div className="flex justify-end -mb-2">
        <Link href={`/empreendimentos/${empId}/editar`} className="text-xs text-primary hover:underline">
          Editar caracterização →
        </Link>
      </div>

      {/* Cadastro incompleto: o 100% seria enganoso */}
      {cadastroIncompleto && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Cadastro incompleto.</strong> O CNAE do empreendimento não está informado, então o motor não
          consegue determinar as obrigações regulatórias aplicáveis. O índice de conformidade abaixo não é
          confiável até o enquadramento ser preenchido.{' '}
          <Link href={`/empreendimentos/${empId}/editar`} className="font-medium underline">Completar cadastro →</Link>
        </div>
      )}

      {/* Cards de topo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ScoreCard titulo="Conformidade" valor={cadastroIncompleto ? '—' : diag.conformidadeScore} sufixo={cadastroIncompleto ? '' : '%'} hint={cadastroIncompleto ? 'indisponível s/ CNAE' : `${diag.obrigacoes.filter((o) => o.status === 'CONFORME').length}/${diag.obrigacoes.length} obrigações comprovadas`} />
        <ScoreCard titulo="Risco de conformidade" valor={diag.riscoConformidadeScore} sufixo="/100" hint="exposição a multa/embargo" />
        <ScoreCard titulo="Risco ecológico" valor={diag.riscoIntrinsecoScore} sufixo="/100" status={diag.riscoNivel} hint={intr?.beta ? 'pesos em beta' : 'gravidade de um vazamento aqui'} />
      </div>

      {/* Enquadramento */}
      {enq && !cadastroIncompleto && (
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Enquadramento</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span><span className="text-muted-foreground">CNAE:</span> {enq.cnae ?? '—'}</span>
            <span><span className="text-muted-foreground">Potencial poluidor:</span> {enq.potencialPoluidor ?? '—'}</span>
            <span><span className="text-muted-foreground">Esfera:</span> {enq.esfera ?? '—'}</span>
            <span><span className="text-muted-foreground">Órgão:</span> {enq.orgaoCompetente ?? '—'}</span>
            {enq.licenciamentoTipo && <span><span className="text-muted-foreground">Rito:</span> {enq.licenciamentoTipo}</span>}
          </div>
        </div>
      )}

      {/* Fatores do risco ecológico */}
      {intr && intr.fatores.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Por que o risco ecológico é {NIVEL_LABEL[diag.riscoNivel] ?? diag.riscoNivel}</p>
          <div className="space-y-1.5">
            {intr.fatores.slice(0, 6).map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 rounded bg-red-50 text-red-700 text-[11px] font-bold px-1.5 py-0.5 min-w-[34px] text-center">+{f.pontos}</span>
                <div>
                  <p>{f.descricao}</p>
                  {f.baseTecnica && <p className="text-[11px] text-muted-foreground">{f.baseTecnica}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obrigações */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Obrigações aplicáveis {!cadastroIncompleto && `(${diag.obrigacoes.length})`}
        </p>
        {diag.obrigacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{cadastroIncompleto ? 'Informe o CNAE para listar as obrigações.' : 'Nenhuma obrigação aplicável.'}</p>
        ) : (
          <div className="rounded-lg border divide-y">
            {diag.obrigacoes.map((o) => (
              <div key={o.codigo} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{o.descricao}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.codigo}{o.fundamentoLegal ? ` · ${o.fundamentoLegal}` : ''}
                    {(o.status === 'A_RENOVAR' || o.status === 'SEM_DADOS') && o.consequencia ? ` · ⚠ ${o.consequencia}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {o.custoServico != null && (o.status === 'A_RENOVAR' || o.status === 'SEM_DADOS') && (
                    <span className="text-[11px] text-muted-foreground">{fmtMoeda(o.custoServico)}</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_OBRIG_COLOR[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_OBRIG_LABEL[o.status] ?? o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orçamento */}
      {diag.orcamento && gaps.length > 0 && (
        <div className="rounded-lg border bg-muted/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Investimento para regularizar</p>
            <p className="text-sm mt-0.5">{gaps.length} pendência(s) — mínimo (só críticas): <strong>{fmtMoeda(diag.orcamento.minimo)}</strong></p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Recomendado</p>
            <p className="text-xl font-bold">{fmtMoeda(diag.orcamento.recomendado)}</p>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground border-t pt-2">
        Diagnóstico v{diag.versao} · motor {diag.engineVersion} · regras {diag.rulesVersion} · {formatDate(diag.calculadoEm)}
      </p>
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

const ABAS = [
  { id: 'prioridades',  label: 'Prioridades' },
  { id: 'diagnostico',  label: 'Diagnóstico' },
  { id: 'licencas',     label: 'Licenças' },
  { id: 'equipamentos', label: 'Equipamentos' },
  { id: 'operacional',  label: 'Operacional' },
  { id: 'pessoas',      label: 'Pessoas' },
  { id: 'documentos',   label: 'Documentos' },
] as const

type AbaId = typeof ABAS[number]['id']

export function HubTabs({ data }: { data: HubData }) {
  const [aba, setAba] = useState<AbaId>('prioridades')

  // Urgências por aba (badge vermelho)
  const urgencia: Record<AbaId, number> = {
    prioridades:  data.alertas.filter((a) => !a.lido && ['CRITICO', 'ALTO'].includes(a.nivel)).length +
                  data.tarefas.filter((t) => { const d = diasRestantes(t.dataVencimento); return d !== null && d < 0 && ['PENDENTE','EM_ANDAMENTO'].includes(t.status) }).length,
    diagnostico:  data.diagnostico && ['CRITICO', 'ALTO'].includes(data.diagnostico.riscoNivel) ? 1 : 0,
    licencas:     data.licencas.filter((l) => { const d = diasRestantes(l.dataVencimento); return d !== null && d <= 90 }).length +
                  data.condicionantes.filter((c) => { const d = diasRestantes(c.proximoVencimento); return d !== null && d <= 7 && ['PENDENTE','EM_CUMPRIMENTO'].includes(c.status) }).length,
    equipamentos: data.tanques.filter((t) => { const d = diasRestantes(t.testes[0]?.proximoTeste); return d !== null && d <= 60 }).length +
                  data.bombas.filter((b) => { const d = diasRestantes(b.proximaCalibracao); return d !== null && d <= 30 }).length,
    operacional:  data.autos.filter((a) => !['ENCERRADO','PAGO','JULGADO_FAVORAVEL'].includes(a.status)).length +
                  data.campanhas.filter((c) => c.resultado === 'NAO_CONFORME').length,
    pessoas:      data.asos.filter((a) => { const d = diasRestantes(a.dataVencimento); return d !== null && d <= 30 }).length +
                  data.funcionarios.filter((f) => f.statusGeral === 'CRITICO').length,
    documentos:   data.documentos.filter((d) => d.status === 'EM_ANALISE' && d.versaoAtual?.status === 'ENVIADA').length,
  }

  // Contadores totais por aba
  const counts: Record<AbaId, number> = {
    prioridades:  data.alertas.filter((a) => !a.lido && ['CRITICO','ALTO'].includes(a.nivel)).length +
                  data.tarefas.filter((t) => ['PENDENTE','EM_ANDAMENTO'].includes(t.status) && ['CRITICA','ALTA'].includes(t.prioridade)).length,
    diagnostico:  data.diagnostico ? data.diagnostico.obrigacoes.filter((o) => o.status === 'A_RENOVAR' || o.status === 'SEM_DADOS').length : 0,
    licencas:     data.licencas.length + data.condicionantes.length,
    equipamentos: data.tanques.length + data.bombas.length,
    operacional:  data.pocos.length + data.mtrs.length + data.campanhas.length + data.autos.length + data.checklists.length,
    pessoas:      data.asos.length + data.documentosSST.length + data.funcionarios.length,
    documentos:   data.documentos.length,
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Nav das abas */}
      <div className="flex border-b overflow-x-auto">
        {ABAS.map(({ id, label }) => {
          const urg = urgencia[id]
          const cnt = counts[id]
          return (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                aba === id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {label}
              {cnt > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none min-w-[18px] text-center ${
                  urg > 0 ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
                }`}>
                  {urg > 0 ? urg : cnt}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Conteúdo */}
      {aba === 'prioridades'  && <AbaPrioridades alertas={data.alertas} tarefas={data.tarefas} empId={data.empreendimentoId} />}
      {aba === 'diagnostico'  && <AbaDiagnostico diag={data.diagnostico} empId={data.empreendimentoId} />}
      {aba === 'licencas'     && <TabLicencas    licencas={data.licencas} conds={data.condicionantes} empId={data.empreendimentoId} />}
      {aba === 'equipamentos' && <TabEquipamentos tanques={data.tanques}  bombas={data.bombas}   empId={data.empreendimentoId} />}
      {aba === 'operacional'  && <TabOperacional  pocos={data.pocos}      mtrs={data.mtrs}       campanhas={data.campanhas} autos={data.autos} checklists={data.checklists} empId={data.empreendimentoId} />}
      {aba === 'pessoas'      && <TabPessoas      asos={data.asos}        documentosSST={data.documentosSST} funcionarios={data.funcionarios} empId={data.empreendimentoId} />}
      {aba === 'documentos'   && <AbaDocumentos   docs={data.documentos}  empId={data.empreendimentoId} />}
    </div>
  )
}
