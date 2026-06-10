import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { AtuacoesTimeline, type AtuacaoItem } from './atuacoes-timeline'

export const metadata: Metadata = { title: 'Atuações Técnicas' }

function toAtuacoes(data: {
  processos: any[]
  documentos: any[]
  tarefas: any[]
  alertas: any[]
}): AtuacaoItem[] {
  const processos = data.processos.map((p) => ({
    id: p.id,
    tipo: 'processo' as const,
    titulo: p.tipoProcesso?.nome ?? p.numeroProcesso ?? 'Processo regulatório',
    status: p.status ?? 'EM_ANALISE',
    empreendimento: p.empreendimento?.nome ?? 'Sem empreendimento',
    responsavel: p.responsavel?.nome,
    data: p.dataVencimento ?? p.criadoEm,
    descricao: p.observacoes ?? p.orgao?.nome,
  }))

  const documentos = data.documentos.map((d) => ({
    id: d.id,
    tipo: 'documento' as const,
    titulo: d.tipoDocumento?.nome ?? d.nome ?? 'Documento técnico',
    status: d.versaoAtual?.status ?? d.status ?? 'PENDENTE',
    empreendimento: d.empreendimento?.nome ?? 'Sem empreendimento',
    responsavel: d.versaoAtual?.enviadoPor?.nome,
    data: d.versaoAtual?.criadoEm ?? d.criadoEm ?? d.dataVencimento,
    descricao: d.descricao,
  }))

  const tarefas = data.tarefas.map((t) => ({
    id: t.id,
    tipo: 'tarefa' as const,
    titulo: t.titulo ?? 'Tarefa operacional',
    status: t.status ?? 'PENDENTE',
    empreendimento: t.empreendimento?.nome ?? 'Sem empreendimento',
    responsavel: t.responsavel?.nome,
    data: t.dataVencimento ?? t.criadoEm,
    descricao: t.descricao,
  }))

  const alertas = data.alertas.map((a) => ({
    id: a.id,
    tipo: 'alerta' as const,
    titulo: a.titulo ?? a.mensagem ?? 'Alerta operacional',
    status: a.nivel ?? a.status ?? 'ALTO',
    empreendimento: a.empreendimento?.nome ?? 'Rede',
    responsavel: a.responsavel?.nome,
    data: a.criadoEm ?? a.createdAt,
    descricao: a.descricao ?? a.mensagem,
  }))

  return [...alertas, ...tarefas, ...processos, ...documentos]
    .sort((a, b) => new Date(b.data ?? 0).getTime() - new Date(a.data ?? 0).getTime())
    .slice(0, 40)
}

export default async function AtuacoesPage() {
  const token = await getAccessToken()
  let itens: AtuacaoItem[] = []

  if (token) {
    try {
      const [processosRes, documentosRes, tarefasRes, alertasRes] = await Promise.allSettled([
        api.get<{ data: any[] }>('/processos?limit=40', token),
        api.get<{ data: any[] }>('/documentos?limit=40', token),
        api.get<{ data: any[] }>('/tarefas?limit=40', token),
        api.get<{ data: any[] }>('/alertas?limit=40', token),
      ])

      itens = toAtuacoes({
        processos: processosRes.status === 'fulfilled' ? processosRes.value.data : [],
        documentos: documentosRes.status === 'fulfilled' ? documentosRes.value.data : [],
        tarefas: tarefasRes.status === 'fulfilled' ? tarefasRes.value.data : [],
        alertas: alertasRes.status === 'fulfilled' ? alertasRes.value.data : [],
      })
    } catch {
      itens = []
    }
  }

  const alertas = itens.filter((item) => item.tipo === 'alerta').length
  const tarefas = itens.filter((item) => item.tipo === 'tarefa').length
  const processos = itens.filter((item) => item.tipo === 'processo').length

  return (
    <div className="space-y-6">
      <div className="animate-panel-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Registro técnico vivo</p>
          <h1 className="text-2xl font-bold tracking-tight">Atuações Técnicas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Linha do tempo de visitas, protocolos, documentos, tarefas e alertas da operação.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Kpi label="Alertas" value={alertas} tone="red" />
          <Kpi label="Tarefas" value={tarefas} tone="orange" />
          <Kpi label="Processos" value={processos} tone="green" />
        </div>
      </div>

      <AtuacoesTimeline itens={itens} />
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: 'red' | 'orange' | 'green' }) {
  const toneClass = {
    red: 'text-red-700 border-red-200 bg-red-50',
    orange: 'text-orange-700 border-orange-200 bg-orange-50',
    green: 'text-emerald-700 border-emerald-200 bg-emerald-50',
  }[tone]

  return (
    <div className={`rounded-xl border px-4 py-3 text-right shadow-sm ${toneClass}`}>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</p>
    </div>
  )
}
