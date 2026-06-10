import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle2, Clock, Fuel } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { HubTabs, type HubData } from './hub-tabs'
import { DiagnosticoEixos } from './diagnostico-eixos'
import { Timeline, type TimelineItem } from './timeline'
import { EquipeCard } from './equipe-card'
import { Dossie360 } from './dossie-360'

export const metadata: Metadata = { title: 'Posto' }

interface Props { params: Promise<{ id: string }> }

function diasRestantes(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000)
}

function statusConfig(status: string) {
  if (status === 'EMERGENCIA') return { bar: 'bg-red-600', badge: 'bg-red-100 text-red-700 border-red-200', label: 'Emergência', ring: 'border-l-4 border-l-red-500' }
  if (status === 'CRITICO')    return { bar: 'bg-red-500',    badge: 'bg-red-50 text-red-600 border-red-200',    label: 'Crítico',    ring: 'border-l-4 border-l-red-400' }
  if (status === 'ATENCAO')    return { bar: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Atenção',  ring: 'border-l-4 border-l-amber-400' }
  if (status === 'REGULAR')    return { bar: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Regular', ring: 'border-l-4 border-l-emerald-500' }
  return { bar: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Sem dados', ring: '' }
}

export default async function EmpreendimentoDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let emp: any = null
  let hubData: HubData = {
    documentos: [], condicionantes: [], tarefas: [], alertas: [], licencas: [],
    processos: [],
    asos: [], documentosSST: [], bombas: [], tanques: [], pocos: [],
    mtrs: [], campanhas: [], autos: [], checklists: [], funcionarios: [],
    empreendimentoId: id,
  }
  let diagnosticoEixos: any[] = []

  try {
    const q = `empreendimentoId=${id}&limit=50`

    // Fetch principal — se falhar retorna 404
    const empRes = await api.get<{ data: any }>(`/empreendimentos/${id}`, token)
    emp = empRes.data

    // Fetches de módulos — falhas silenciosas (mantém array vazio)
    async function safe<T>(p: Promise<{ data: T }>): Promise<T> {
      try { return (await p).data } catch { return [] as unknown as T }
    }
    async function safeDiag() {
      try { return (await api.get<{ data: { eixos: any[] } }>(`/cockpit/diagnostico/${id}`, token)).data.eixos } catch { return [] }
    }

    const [
      docs, conds, tarefas, alertas, licencas,
      processos,
      asos, sstDocs, anp, estanq, outorga,
      logistica, monitor, fiscais, eixos, checklists,
    ] = await Promise.all([
      safe(api.get<{ data: any[] }>(`/documentos?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/condicionantes?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/tarefas?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/alertas?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/licencas-ambientais?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/processos?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/sst/asos?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/sst/documentos?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/anp-inmetro?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/estanqueidade/tanques?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/outorga-hidrica?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/logistica-reversa/mtrs?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/monitoramento/campanhas?${q}`, token)),
      safe(api.get<{ data: any[] }>(`/fiscalizacoes?${q}`, token)),
      safeDiag(),
      safe(api.get<{ data: any[] }>(`/checklists/execucoes?${q}`, token)),
    ])

    hubData = {
      documentos:    docs,
      condicionantes: conds,
      tarefas,
      alertas,
      licencas,
      processos,
      asos,
      documentosSST: sstDocs,
      bombas:        anp,
      tanques:       estanq,
      pocos:         outorga,
      mtrs:          logistica,
      campanhas:     monitor,
      autos:         fiscais,
      checklists,
      funcionarios:  [],
      empreendimentoId: id,
    }
    diagnosticoEixos = eixos
  } catch {
    notFound()
  }

  const snapshot   = emp.snapshotsCompliance?.[0]
  const sc         = statusConfig(snapshot?.statusCompliance ?? '')
  const indice     = snapshot ? parseFloat(snapshot.indiceConformidade) : null

  // ── KPIs inline ────────────────────────────────────────────────────────────
  const alertasCriticos  = hubData.alertas.filter((a: any) => !a.lido && a.nivel === 'CRITICO').length
  const tarefasAtrasadas = hubData.tarefas.filter((t: any) => {
    const d = diasRestantes(t.dataVencimento)
    return d !== null && d < 0 && ['PENDENTE', 'EM_ANDAMENTO'].includes(t.status)
  }).length
  const tarefasPendentes = hubData.tarefas.filter((t: any) => ['PENDENTE', 'EM_ANDAMENTO'].includes(t.status)).length

  // Próxima licença a vencer
  const licencaAtiva = hubData.licencas
    .filter((l: any) => l.dataVencimento && l.status !== 'CANCELADA')
    .sort((a: any, b: any) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())[0]
  const diasLicenca = diasRestantes(licencaAtiva?.dataVencimento)

  // Alertas críticos para o banner
  const bannerAlertas = hubData.alertas
    .filter((a: any) => !a.lido && a.nivel === 'CRITICO')
    .slice(0, 3) as Array<{ id: string; titulo: string }>

  // ── Linha do tempo — agrega vencimentos de todos os módulos ────────────────
  const timelineItems: TimelineItem[] = []

  const addItem = (
    id: string,
    modulo: TimelineItem['modulo'],
    titulo: string,
    dataIso: string | null | undefined,
    status: string,
    opts?: { subtitulo?: string; href?: string },
  ) => {
    const d = diasRestantes(dataIso)
    if (d === null) return
    timelineItems.push({ id, modulo, titulo, dias: d, status, ...opts })
  }

  // Licenças
  for (const l of hubData.licencas as any[]) {
    if (l.status === 'CANCELADA') continue
    addItem(l.id, 'LICENCA',
      `${l.tipo}${l.numero ? ` · ${l.numero}` : ''}`,
      l.dataVencimento, l.status,
      { subtitulo: l.orgaoEmissor ?? undefined, href: `/licencas-ambientais/${l.id}` })
  }

  // Condicionantes
  for (const c of hubData.condicionantes as any[]) {
    if (c.status === 'CUMPRIDA' || c.status === 'DISPENSADA') continue
    addItem(c.id, 'CONDICIONANTE',
      c.descricao.length > 60 ? c.descricao.slice(0, 60) + '…' : c.descricao,
      c.proximoVencimento, c.status,
      { subtitulo: c.periodicidade, href: `/condicionantes/${c.id}` })
  }

  // Processos regulatórios
  for (const p of hubData.processos as any[]) {
    if (!p.dataVencimento || ['DEFERIDO', 'INDEFERIDO', 'CANCELADO', 'ARQUIVADO'].includes(p.status)) continue
    addItem(p.id, 'PROCESSO',
      p.tipoProcesso?.nome ?? p.numeroProcesso ?? 'Processo regulatório',
      p.dataVencimento, p.status,
      { subtitulo: p.orgao?.sigla ?? p.orgao?.nome ?? undefined, href: `/processos/${p.id}` })
  }

  // Documentos com validade
  for (const d of hubData.documentos as any[]) {
    if (!d.dataValidade || ['APROVADO', 'DISPENSADO', 'SUBSTITUIDO'].includes(d.status)) continue
    addItem(d.id, 'DOCUMENTO',
      d.tipoDocumento?.nome ?? d.nome ?? 'Documento',
      d.dataValidade, d.status,
      { subtitulo: d.tipoDocumento?.categoria ?? undefined, href: `/documentos/${d.id}` })
  }

  // Tarefas ativas
  for (const t of hubData.tarefas as any[]) {
    if (!['PENDENTE', 'EM_ANDAMENTO'].includes(t.status)) continue
    addItem(t.id, 'TAREFA',
      t.titulo, t.dataVencimento, t.prioridade,
      { subtitulo: t.responsavel?.nome ?? undefined, href: `/tarefas/${t.id}` })
  }

  // Estanqueidade (próximo teste por tanque)
  for (const tanq of hubData.tanques as any[]) {
    const ultimo = tanq.testes?.[0]
    if (!ultimo?.proximoTeste) continue
    addItem(tanq.id, 'ESTANQUEIDADE',
      `Tanque #${tanq.numero} — ${tanq.combustivel}`,
      ultimo.proximoTeste, tanq.status,
      { subtitulo: `Método: ${ultimo.metodo ?? 'ABNT NBR 13784'}`, href: `/estanqueidade/${tanq.id}` })
  }

  // Bombas / ANP-INMETRO
  for (const b of hubData.bombas as any[]) {
    if (!b.proximaCalibracao) continue
    addItem(b.id, 'ANP',
      `Bomba #${b.numero} — ${b.fabricante}`,
      b.proximaCalibracao, b.status,
      { subtitulo: b.combustiveis?.join(', '), href: `/anp-inmetro/${b.id}` })
  }

  // Outorga hídrica
  for (const p of hubData.pocos as any[]) {
    if (!p.validadeOutorga) continue
    addItem(p.id, 'OUTORGA',
      `Poço ${p.codigo} — Outorga`,
      p.validadeOutorga, p.status,
      { subtitulo: p.outorgaDAEE ?? undefined, href: `/outorga-hidrica/${p.id}` })
  }

  // ASOs
  for (const a of hubData.asos as any[]) {
    if (!a.dataVencimento) continue
    addItem(a.id, 'SST_ASO',
      `ASO — ${a.funcionarioNome}`,
      a.dataVencimento, a.aptidao,
      { subtitulo: `${a.tipo}${a.cargo ? ` · ${a.cargo}` : ''}` })
  }

  // Documentos SST
  for (const d of hubData.documentosSST as any[]) {
    if (!d.dataVencimento) continue
    addItem(d.id, 'SST_DOC',
      d.tipo.replace(/_/g, ' '),
      d.dataVencimento, d.status,
      { subtitulo: d.responsavel ?? undefined })
  }

  // Ordenar por dias (vencidos primeiro, depois mais próximos)
  timelineItems.sort((a, b) => a.dias - b.dias)

  return (
    <div className="space-y-5">

      {/* Breadcrumb */}
      <Link
        href="/empreendimentos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Meus Postos
      </Link>

      {/* ── Hero card ─────────────────────────────────────────────────────────── */}
      <div className={`rounded-xl border bg-card overflow-hidden ${sc.ring}`}>
        {/* Progress bar topo */}
        {indice !== null && (
          <div className="h-1 w-full bg-muted">
            <div className={`h-full ${sc.bar} transition-all`} style={{ width: `${Math.min(indice, 100)}%` }} />
          </div>
        )}

        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            {/* Identidade */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Fuel className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-tight">
                  {emp.nomeFantasia ?? emp.nome}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {emp.logradouro ? `${emp.logradouro}${emp.numero ? ` ${emp.numero}` : ''}${emp.complemento ? ` ${emp.complemento}` : ''} · ` : ''}
                    {emp.cidade}/{emp.estado}
                  </span>
                  {emp.bandeira && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {emp.bandeira}
                    </span>
                  )}
                  {emp.codigoInterno && (
                    <span className="text-xs text-muted-foreground/60">{emp.codigoInterno}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Score */}
            {indice !== null && (
              <div className="flex-shrink-0 text-right">
                <p className="text-2xl font-black tabular-nums leading-none">{indice.toFixed(0)}%</p>
                <span className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sc.badge}`}>
                  {sc.label}
                </span>
              </div>
            )}
          </div>

          {/* ── KPIs ───────────────────────────────────────────────────────────── */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Alertas críticos */}
            <div className={`rounded-lg border px-4 py-3 ${alertasCriticos > 0 ? 'bg-red-50 border-red-200' : 'bg-muted/40 border-border'}`}>
              <p className="text-xs font-medium text-muted-foreground">Alertas críticos</p>
              <p className={`mt-1 text-2xl font-black tabular-nums ${alertasCriticos > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {alertasCriticos}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alertasCriticos > 0 ? 'Ação necessária' : 'Nenhum crítico'}
              </p>
            </div>

            {/* Tarefas */}
            <div className={`rounded-lg border px-4 py-3 ${tarefasAtrasadas > 0 ? 'bg-orange-50 border-orange-200' : 'bg-muted/40 border-border'}`}>
              <p className="text-xs font-medium text-muted-foreground">Tarefas</p>
              <p className={`mt-1 text-2xl font-black tabular-nums ${tarefasAtrasadas > 0 ? 'text-orange-600' : 'text-foreground'}`}>
                {tarefasPendentes}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tarefasAtrasadas > 0 ? `${tarefasAtrasadas} atrasada${tarefasAtrasadas !== 1 ? 's' : ''}` : 'pendentes'}
              </p>
            </div>

            {/* Licença principal */}
            <div className={`rounded-lg border px-4 py-3 ${
              diasLicenca !== null && diasLicenca < 0 ? 'bg-red-50 border-red-200' :
              diasLicenca !== null && diasLicenca <= 90 ? 'bg-amber-50 border-amber-200' :
              'bg-muted/40 border-border'
            }`}>
              <p className="text-xs font-medium text-muted-foreground">
                {licencaAtiva ? `${licencaAtiva.tipo} ${licencaAtiva.numero ?? ''}`.trim() : 'Licença'}
              </p>
              <p className={`mt-1 text-2xl font-black tabular-nums ${
                diasLicenca !== null && diasLicenca < 0 ? 'text-red-600' :
                diasLicenca !== null && diasLicenca <= 90 ? 'text-amber-600' :
                'text-foreground'
              }`}>
                {diasLicenca !== null ? (diasLicenca < 0 ? 'Vencida' : `${diasLicenca}d`) : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {licencaAtiva
                  ? `Vence ${new Date(licencaAtiva.dataVencimento as string).toLocaleDateString('pt-BR')}`
                  : 'Sem licença'}
              </p>
            </div>

            {/* Conformidade geral */}
            <div className="rounded-lg border bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Empreendimento</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-foreground">
                {emp.cnpj
                  ? emp.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                  : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {emp.empresa?.nome ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Banner de alertas críticos ────────────────────────────────────────── */}
      {bannerAlertas.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800">
                {alertasCriticos} alerta{alertasCriticos !== 1 ? 's' : ''} crítico{alertasCriticos !== 1 ? 's' : ''} — ação necessária
              </p>
              <ul className="mt-2 space-y-1">
                {bannerAlertas.map((a) => (
                  <li key={a.id} className="text-xs text-red-700 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-red-400 flex-shrink-0" />
                    {a.titulo}
                  </li>
                ))}
              </ul>
              {alertasCriticos > 3 && (
                <p className="text-xs text-red-600 mt-1">+{alertasCriticos - 3} outros alertas críticos</p>
              )}
            </div>
            <Link
              href={`/alertas?empreendimentoId=${id}`}
              className="flex-shrink-0 text-xs font-medium text-red-700 hover:text-red-900 underline"
            >
              Ver todos →
            </Link>
          </div>
        </div>
      )}

      {/* ── Sem alertas críticos — positivo ──────────────────────────────────── */}
      {alertasCriticos === 0 && snapshot && snapshot.statusCompliance === 'REGULAR' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-800">
            Posto em conformidade — nenhum alerta crítico no momento.
          </p>
        </div>
      )}

      <Dossie360 empreendimentoId={id} data={hubData} />

      {/* ── Linha do tempo ────────────────────────────────────────────────────── */}
      <Timeline items={timelineItems} empreendimentoId={id} />

      {/* ── Diagnóstico por eixo ──────────────────────────────────────────────── */}
      <DiagnosticoEixos eixos={diagnosticoEixos} />

      {/* ── Equipe responsável ────────────────────────────────────────────────── */}
      <EquipeCard empreendimentoId={id} />

      {/* ── Hub de gestão ─────────────────────────────────────────────────────── */}
      <HubTabs data={hubData} />

      {/* ── Rodapé de auditoria ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-2">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Atualizado agora
        </span>
        <Link href={`/auditoria?empreendimentoId=${id}`} className="hover:text-foreground hover:underline transition-colors">
          Histórico de auditoria →
        </Link>
      </div>
    </div>
  )
}
