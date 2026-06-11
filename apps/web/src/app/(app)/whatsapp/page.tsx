import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { ContatosPanel } from './contatos-panel'
import { LeadsPanel, type Lead, type MensagemLead } from './leads-panel'

export const metadata: Metadata = { title: 'Agente WhatsApp' }

interface Contato {
  id: string
  numero: string
  nome: string | null
  ativo: boolean
  empreendimento: { id: string; nome: string } | null
  criadoEm: string
}

interface Mensagem {
  id: string
  numero: string
  direcao: string
  tipo: string
  conteudo: string
  criadoEm: string
}

interface Empreendimento { id: string; nome: string }

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function WhatsAppPage() {
  const token = await getAccessToken()
  let contatos: Contato[] = []
  let mensagens: Mensagem[] = []
  let empreendimentos: Empreendimento[] = []
  let leads: Lead[] = []
  // Pré-carrega histórico dos 5 leads mais recentes para evitar flash
  const historicoInicial: Record<string, MensagemLead[]> = {}

  if (token) {
    try {
      const [cRes, mRes, eRes, lRes] = await Promise.all([
        api.get<{ data: Contato[] }>('/whatsapp/contatos', token),
        api.get<{ data: Mensagem[] }>('/whatsapp/mensagens?limit=30', token),
        api.get<{ data: Empreendimento[] }>('/empreendimentos?limit=100', token),
        api.get<{ data: Lead[] }>('/whatsapp/leads?limit=50', token),
      ])
      contatos = cRes.data
      mensagens = mRes.data
      empreendimentos = eRes.data
      leads = lRes.data

      // Pré-carrega histórico dos 5 leads mais recentes com mensagens
      const leadsPrioritarios = leads
        .filter((l) => l._count.mensagens > 0)
        .slice(0, 5)

      await Promise.all(
        leadsPrioritarios.map(async (lead) => {
          try {
            const hRes = await api.get<{ data: MensagemLead[] }>(
              `/whatsapp/leads/${lead.id}/mensagens`,
              token,
            )
            historicoInicial[lead.id] = hRes.data
          } catch { /* ignora */ }
        })
      )
    } catch { /* exibe vazio */ }
  }

  // Métricas rápidas de leads
  const novos = leads.filter((l) => l.status === 'NOVO').length
  const emConversa = leads.filter((l) => l.status === 'EM_CONVERSA').length
  const qualificados = leads.filter((l) => l.status === 'QUALIFICADO').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agente WhatsApp</h1>
        <p className="text-muted-foreground text-sm">
          Atendimento automático via IA — compliance para clientes e captura comercial para prospects
        </p>
      </div>

      {/* Como funciona */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm">Como funciona</h2>
        <div className="grid md:grid-cols-4 gap-4 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="font-medium text-foreground">📤 Alertas automáticos</p>
            <p>Sistema envia mensagens quando licenças vencem ou autos de infração chegam.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">💬 Consultas (clientes)</p>
            <p>Número cadastrado pergunta &quot;qual o status da minha LO?&quot; — IA responde com dados reais.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">🤝 Captura comercial</p>
            <p>Número desconhecido é atendido como prospect: IA coleta nome, empresa e desafios.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">⚙️ Configuração</p>
            <p>Requer Z-API configurado no servidor e número(s) de responsáveis cadastrados.</p>
          </div>
        </div>
      </div>

      {/* Métricas de leads */}
      {leads.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{novos}</p>
            <p className="text-xs text-muted-foreground mt-1">Novos leads</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{emConversa}</p>
            <p className="text-xs text-muted-foreground mt-1">Em conversa</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{qualificados}</p>
            <p className="text-xs text-muted-foreground mt-1">Qualificados</p>
          </div>
        </div>
      )}

      {/* Painel de leads comerciais */}
      <LeadsPanel leads={leads} historicoInicial={historicoInicial} />

      {/* Gerenciamento de contatos clientes */}
      <ContatosPanel contatos={contatos} empreendimentos={empreendimentos} />

      {/* Histórico de mensagens de clientes */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">Histórico — Clientes Cadastrados</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Últimas 30 mensagens de contatos cadastrados</p>
        </div>

        {mensagens.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma mensagem registrada ainda.
          </div>
        ) : (
          <div className="divide-y max-h-[480px] overflow-y-auto">
            {mensagens.map((m) => (
              <div key={m.id} className={`px-4 py-3 flex gap-3 ${m.direcao === 'ENVIADA' ? 'bg-muted/30' : ''}`}>
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-xs">{m.direcao === 'ENVIADA' ? '📤' : '📥'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{m.numero}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${m.direcao === 'ENVIADA' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {m.direcao === 'ENVIADA' ? 'Enviada' : 'Recebida'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{formatDateTime(m.criadoEm)}</span>
                  </div>
                  <p className="text-sm leading-snug whitespace-pre-wrap">{m.conteudo}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
