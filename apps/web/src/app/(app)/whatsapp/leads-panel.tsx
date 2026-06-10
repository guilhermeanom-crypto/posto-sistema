'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { buildPublicApiUrl } from '@/lib/api-base'
import { atualizarLeadAction, enviarMensagemLeadAction } from './actions'

export interface Lead {
  id: string
  numero: string
  nome: string | null
  empresa: string | null
  quantidadePostos: number | null
  desafios: string | null
  status: 'NOVO' | 'EM_CONVERSA' | 'QUALIFICADO' | 'DESCARTADO'
  notas: string | null
  criadoEm: string
  _count: { mensagens: number }
  mensagens: Array<{ conteudo: string; criadoEm: string; direcao: string }>
}

export interface MensagemLead {
  id: string
  direcao: string
  conteudo: string
  criadoEm: string
}

const STATUS_LABELS: Record<Lead['status'], string> = {
  NOVO: 'Novo',
  EM_CONVERSA: 'Em conversa',
  QUALIFICADO: 'Qualificado',
  DESCARTADO: 'Descartado',
}

const STATUS_COLORS: Record<Lead['status'], string> = {
  NOVO: 'bg-blue-100 text-blue-700',
  EM_CONVERSA: 'bg-yellow-100 text-yellow-700',
  QUALIFICADO: 'bg-green-100 text-green-700',
  DESCARTADO: 'bg-gray-100 text-gray-500',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function LeadCard({
  lead,
  onSelect,
  selected,
}: {
  lead: Lead
  onSelect: () => void
  selected: boolean
}) {
  const ultima = lead.mensagens[0]
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors ${selected ? 'bg-muted' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-medium truncate">
          {lead.nome ?? lead.numero}
        </span>
        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[lead.status]}`}>
          {STATUS_LABELS[lead.status]}
        </span>
      </div>
      {lead.empresa && (
        <p className="text-xs text-muted-foreground truncate">{lead.empresa}
          {lead.quantidadePostos ? ` · ${lead.quantidadePostos} posto${lead.quantidadePostos > 1 ? 's' : ''}` : ''}
        </p>
      )}
      {ultima && (
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {ultima.direcao === 'ENVIADA' ? '↗' : '↙'} {ultima.conteudo}
        </p>
      )}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground">{lead._count.mensagens} msgs</span>
        <span className="text-xs text-muted-foreground">· {formatDateTime(lead.criadoEm)}</span>
      </div>
    </button>
  )
}

function LeadDetail({
  lead,
  historico,
  onClose,
}: {
  lead: Lead
  historico: MensagemLead[]
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notas, setNotas] = useState(lead.notas ?? '')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  function salvarStatus(status: Lead['status']) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('id', lead.id)
      fd.append('status', status)
      await atualizarLeadAction(null, fd)
      router.refresh()
    })
  }

  function salvarNotas() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('id', lead.id)
      fd.append('notas', notas)
      await atualizarLeadAction(null, fd)
      router.refresh()
    })
  }

  async function enviarMensagem() {
    if (!mensagem.trim()) return
    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('leadId', lead.id)
      fd.append('mensagem', mensagem.trim())
      await enviarMensagemLeadAction(null, fd)
      setMensagem('')
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{lead.nome ?? 'Sem nome'}</h3>
            <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[lead.status]}`}>
              {STATUS_LABELS[lead.status]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{lead.numero}</p>
          {lead.empresa && (
            <p className="text-xs text-muted-foreground">
              {lead.empresa}{lead.quantidadePostos ? ` · ${lead.quantidadePostos} postos` : ''}
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 text-sm">✕</button>
      </div>

      {/* Desafios */}
      {lead.desafios && (
        <div className="px-4 py-2 bg-amber-50 border-b text-xs text-amber-800">
          <span className="font-medium">Desafios: </span>{lead.desafios}
        </div>
      )}

      {/* Conversa */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {historico.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sem mensagens ainda.</p>
        ) : (
          historico.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.direcao === 'ENVIADA' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                m.direcao === 'ENVIADA'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}>
                <p className="whitespace-pre-wrap">{m.conteudo}</p>
                <p className={`mt-1 text-[10px] ${m.direcao === 'ENVIADA' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {formatDateTime(m.criadoEm)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input para enviar mensagem manual */}
      <div className="p-3 border-t flex gap-2">
        <input
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem() } }}
          placeholder="Responder como consultor..."
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={enviarMensagem}
          disabled={enviando || !mensagem.trim()}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {enviando ? '...' : 'Enviar'}
        </button>
      </div>

      {/* Ações de status */}
      <div className="p-3 border-t space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Alterar status:</p>
        <div className="flex flex-wrap gap-1.5">
          {(['NOVO', 'EM_CONVERSA', 'QUALIFICADO', 'DESCARTADO'] as Lead['status'][]).map((s) => (
            <button
              key={s}
              onClick={() => salvarStatus(s)}
              disabled={isPending || lead.status === s}
              className={`text-xs px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
                lead.status === s ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Notas internas */}
      <div className="p-3 border-t space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Notas internas:</p>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          placeholder="Observações sobre este prospect..."
          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <button
          onClick={salvarNotas}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
        >
          {isPending ? 'Salvando...' : 'Salvar notas'}
        </button>
      </div>
    </div>
  )
}

export function LeadsPanel({
  leads,
  historicoInicial,
}: {
  leads: Lead[]
  historicoInicial: Record<string, MensagemLead[]>
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [historicos, setHistoricos] = useState<Record<string, MensagemLead[]>>(historicoInicial)
  const [filtro, setFiltro] = useState<Lead['status'] | 'TODOS'>('TODOS')

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null

  async function selecionarLead(lead: Lead) {
    setSelectedId(lead.id)
    // Busca histórico se ainda não carregado
    if (!historicos[lead.id]) {
      try {
        // Usa token do cookie para chamar a API diretamente
        const token = document.cookie.match(/access_token=([^;]+)/)?.[1]
        if (token) {
          const apiRes = await fetch(
            buildPublicApiUrl(`/whatsapp/leads/${lead.id}/mensagens`),
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (apiRes.ok) {
            const data = await apiRes.json() as { data: MensagemLead[] }
            setHistoricos((prev) => ({ ...prev, [lead.id]: data.data }))
          }
        }
      } catch {
        // ignora erro de fetch, mostra histórico vazio
      }
    }
  }

  const leadsFiltrados = filtro === 'TODOS' ? leads : leads.filter((l) => l.status === filtro)

  const contadores = {
    TODOS: leads.length,
    NOVO: leads.filter((l) => l.status === 'NOVO').length,
    EM_CONVERSA: leads.filter((l) => l.status === 'EM_CONVERSA').length,
    QUALIFICADO: leads.filter((l) => l.status === 'QUALIFICADO').length,
    DESCARTADO: leads.filter((l) => l.status === 'DESCARTADO').length,
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Leads Comerciais ({leads.length})</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Prospects que entraram em contato via WhatsApp sem cadastro
        </p>
      </div>

      {/* Filtros por status */}
      <div className="px-4 py-2 border-b flex gap-1.5 flex-wrap">
        {(['TODOS', 'NOVO', 'EM_CONVERSA', 'QUALIFICADO', 'DESCARTADO'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              filtro === s ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
            }`}
          >
            {s === 'TODOS' ? 'Todos' : STATUS_LABELS[s as Lead['status']]} ({contadores[s]})
          </button>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum lead ainda. Quando alguém não cadastrado enviar mensagem no WhatsApp, aparecerá aqui.
        </div>
      ) : (
        <div className={`grid ${selectedLead ? 'md:grid-cols-[320px_1fr]' : 'grid-cols-1'} divide-x`} style={{ minHeight: 400 }}>
          {/* Lista */}
          <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
            {leadsFiltrados.length === 0 ? (
              <p className="p-6 text-sm text-center text-muted-foreground">Nenhum lead com este status.</p>
            ) : (
              leadsFiltrados.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  selected={lead.id === selectedId}
                  onSelect={() => selecionarLead(lead)}
                />
              ))
            )}
          </div>

          {/* Detalhe */}
          {selectedLead && (
            <LeadDetail
              lead={selectedLead}
              historico={historicos[selectedLead.id] ?? []}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
