'use client'

import Link from 'next/link'
import { useTransition, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { moverEstagioAction, registrarFollowUpAction, type EstagioCRM, type TipoFollowUp } from './actions'
import {
  ChevronRight, ChevronLeft, Phone, Mail, MessageCircle, Users,
  MapPin, CalendarDays, DollarSign, FileText, Plus, X, Check,
  ClipboardCheck, ArrowRight, AlertTriangle, Building2, FileCheck2, ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface LeadCard {
  id: string
  numero: string
  nome: string | null
  empresa: string | null
  quantidadePostos: number | null
  estagio: EstagioCRM
  valorEstimado: string | null
  dataProximoContato: string | null
  notas: string | null
  criadoEm: string
  atualizadoEm: string
  _count: { mensagens: number; followUps: number }
}

// ─────────────────────────────────────────────────────────────────────────────
// Config colunas
// ─────────────────────────────────────────────────────────────────────────────

const COLUNAS: { estagio: EstagioCRM; label: string; cls: string; dotCls: string }[] = [
  { estagio: 'NOVO',             label: 'Novo',            cls: 'border-gray-200 bg-gray-50',    dotCls: 'bg-gray-400' },
  { estagio: 'CONTATADO',        label: 'Contatado',       cls: 'border-blue-200 bg-blue-50',    dotCls: 'bg-blue-400' },
  { estagio: 'PROPOSTA_ENVIADA', label: 'Proposta',        cls: 'border-yellow-200 bg-yellow-50',dotCls: 'bg-yellow-400' },
  { estagio: 'NEGOCIACAO',       label: 'Negociação',      cls: 'border-orange-200 bg-orange-50',dotCls: 'bg-orange-400' },
  { estagio: 'GANHO',            label: 'Ganho',           cls: 'border-green-200 bg-green-50',  dotCls: 'bg-green-500' },
  { estagio: 'PERDIDO',          label: 'Perdido',         cls: 'border-red-200 bg-red-50',      dotCls: 'bg-red-400' },
]

const TIPO_FOLLOWUP: { value: TipoFollowUp; label: string; icon: typeof Phone }[] = [
  { value: 'LIGACAO',   label: 'Ligação',   icon: Phone },
  { value: 'EMAIL',     label: 'Email',     icon: Mail },
  { value: 'WHATSAPP',  label: 'WhatsApp',  icon: MessageCircle },
  { value: 'VISITA',    label: 'Visita',    icon: MapPin },
  { value: 'REUNIAO',   label: 'Reunião',   icon: Users },
  { value: 'OUTROS',    label: 'Outros',    icon: FileText },
]

const ESTAGIOS_ORDER: EstagioCRM[] = ['NOVO', 'CONTATADO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO', 'GANHO', 'PERDIDO']

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatCurrency(val: string | null) {
  if (!val) return null
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function leadSearchHref(lead: LeadCard) {
  const termo = lead.empresa ?? lead.nome ?? lead.numero
  return `/empreendimentos?busca=${encodeURIComponent(termo)}`
}

function handoffReadiness(lead: LeadCard) {
  const checks = [
    { label: 'Contato identificado', ok: Boolean(lead.nome) },
    { label: 'Empresa informada', ok: Boolean(lead.empresa) },
    { label: 'Quantidade de postos', ok: lead.quantidadePostos != null },
    { label: 'Valor estimado', ok: Boolean(lead.valorEstimado) },
    { label: 'Follow-up registrado', ok: lead._count.followUps > 0 },
    { label: 'Estágio comercial avançado', ok: ['PROPOSTA_ENVIADA', 'NEGOCIACAO', 'GANHO'].includes(lead.estagio) },
  ]
  const done = checks.filter((check) => check.ok).length
  return { checks, pct: Math.round((done / checks.length) * 100) }
}

function LeadDetailSheet({ lead }: { lead: LeadCard }) {
  const readiness = handoffReadiness(lead)
  const proximoContato = lead.dataProximoContato ? new Date(lead.dataProximoContato) : null
  const atrasado = proximoContato && proximoContato.getTime() < Date.now()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]">
          Detalhes
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{lead.nome ?? lead.numero}</SheetTitle>
          <SheetDescription>{lead.empresa ?? 'Lead sem empresa informada'}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-5">
          <div className="rounded-xl border bg-muted/25 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Prontidão para handoff</p>
                <p className="mt-1 text-3xl font-black tracking-tight">{readiness.pct}%</p>
              </div>
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${readiness.pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info label="Estágio">{COLUNAS.find((c) => c.estagio === lead.estagio)?.label ?? lead.estagio}</Info>
            <Info label="Valor">{formatCurrency(lead.valorEstimado) ?? '—'}</Info>
            <Info label="Postos">{lead.quantidadePostos ?? '—'}</Info>
            <Info label="Próximo contato">
              <span className={atrasado ? 'text-red-600' : ''}>{formatDate(lead.dataProximoContato) ?? '—'}</span>
            </Info>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Checklist comercial</p>
            <div className="space-y-2">
              {readiness.checks.map((check) => (
                <div key={check.label} className="flex items-center gap-2 text-sm">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${check.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
                    {check.ok ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  </span>
                  <span className={check.ok ? 'text-foreground' : 'text-muted-foreground'}>{check.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Histórico resumido</p>
            <div className="grid grid-cols-2 gap-3">
              <Info label="Follow-ups">{lead._count.followUps}</Info>
              <Info label="Mensagens">{lead._count.mensagens}</Info>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{lead.notas ?? 'Sem notas comerciais registradas.'}</p>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Destino operacional</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conecte este lead com a esteira real do posto: orçamento, cadastro, contrato e execução.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <div className="grid gap-2">
              <Button asChild variant={lead.estagio === 'GANHO' ? 'default' : 'outline'} className="justify-start">
                <Link href={lead.estagio === 'GANHO' ? '/onboarding' : '/motor-orcamento'}>
                  <ClipboardCheck className="h-4 w-4" />
                  {lead.estagio === 'GANHO' ? 'Abrir onboarding operacional' : 'Preparar proposta no orçamento'}
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href={leadSearchHref(lead)}>
                  <Building2 className="h-4 w-4" />
                  Localizar em Meus Postos
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/empreendimentos/novo">
                  <Plus className="h-4 w-4" />
                  Criar posto no sistema
                </Link>
              </Button>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/contratos">
                    <FileCheck2 className="h-4 w-4" />
                    Contratos
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/ordens-servico">
                    <ClipboardList className="h-4 w-4" />
                    OS
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FollowUp modal
// ─────────────────────────────────────────────────────────────────────────────

function FollowUpModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [tipo, setTipo] = useState<TipoFollowUp>('LIGACAO')
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await registrarFollowUpAction(leadId, tipo, notas || undefined)
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Registrar Follow-up</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {TIPO_FOLLOWUP.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTipo(value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-medium transition-all ${
                  tipo === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas (opcional)..."
            rows={3}
            className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isPending ? 'Salvando...' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Card de lead
// ─────────────────────────────────────────────────────────────────────────────

function LeadKanbanCard({ lead }: { lead: LeadCard }) {
  const [isPending, startTransition] = useTransition()
  const [showFollowUp, setShowFollowUp] = useState(false)
  const router = useRouter()

  const idx = ESTAGIOS_ORDER.indexOf(lead.estagio)
  const canAdvance = idx < ESTAGIOS_ORDER.length - 1
  const canRetreat = idx > 0

  function mover(destino: EstagioCRM) {
    startTransition(async () => {
      await moverEstagioAction(lead.id, destino)
      router.refresh()
    })
  }

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const proximoContato = lead.dataProximoContato ? new Date(lead.dataProximoContato) : null
  const atrasado = proximoContato && proximoContato < hoje

  return (
    <>
      {showFollowUp && <FollowUpModal leadId={lead.id} onClose={() => setShowFollowUp(false)} />}

      <div className={`rounded-xl border bg-white p-3 space-y-2.5 shadow-sm transition-opacity ${isPending ? 'opacity-50' : ''}`}>
        {/* Nome + empresa */}
        <div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {lead.nome ?? lead.numero}
          </p>
          {lead.empresa && (
            <p className="text-[11px] text-muted-foreground">{lead.empresa}</p>
          )}
        </div>

        {/* Metadados */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {lead.quantidadePostos != null && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {lead.quantidadePostos} posto{lead.quantidadePostos !== 1 ? 's' : ''}
            </span>
          )}
          {lead.valorEstimado && (
            <span className="flex items-center gap-1 text-[10px] text-green-700 font-medium">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(lead.valorEstimado)}
            </span>
          )}
          {proximoContato && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${atrasado ? 'text-red-600' : 'text-orange-600'}`}>
              <CalendarDays className="h-3 w-3" />
              {atrasado ? 'Atrasado' : formatDate(lead.dataProximoContato)}
            </span>
          )}
        </div>

        {/* Contadores + ações */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFollowUp(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              title="Registrar follow-up"
            >
              <Plus className="h-3 w-3" />
              {lead._count.followUps} follow-up{lead._count.followUps !== 1 ? 's' : ''}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <LeadDetailSheet lead={lead} />
            {canRetreat && (
              <button
                onClick={() => mover(ESTAGIOS_ORDER[idx - 1]!)}
                disabled={isPending}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                title="Voltar estágio"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
            {canAdvance && (
              <button
                onClick={() => mover(ESTAGIOS_ORDER[idx + 1]!)}
                disabled={isPending}
                className="p-1 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-40"
                title="Avançar estágio"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Board
// ─────────────────────────────────────────────────────────────────────────────

export function KanbanBoard({ porEstagio }: { porEstagio: Record<string, LeadCard[]> }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
      {COLUNAS.map(({ estagio, label, cls, dotCls }) => {
        const leads = porEstagio[estagio] ?? []
        return (
          <div key={estagio} className={`flex-shrink-0 w-60 rounded-2xl border p-3 space-y-2.5 ${cls}`}>
            {/* Cabeçalho da coluna */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${dotCls}`} />
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </div>
              <span className="text-[10px] font-medium bg-white/70 text-muted-foreground px-1.5 py-0.5 rounded-full border">
                {leads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {leads.map((lead) => (
                <LeadKanbanCard key={lead.id} lead={lead} />
              ))}
              {leads.length === 0 && (
                <div className="py-6 text-center text-[10px] text-muted-foreground/60">
                  Nenhum lead
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
