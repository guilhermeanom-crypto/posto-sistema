'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Evento {
  id: string
  tipoEvento: string
  dataEvento: string
  descricao: string
  responsavel: string | null
  custo: number | null
  observacoes: string | null
  criadoPor: { nome: string }
  documento: { nome: string } | null
  criadoEm: string
}

interface Props {
  equipamentoTipo: 'TANQUE' | 'BOMBA'
  equipamentoId: string
  empreendimentoId: string
}

const tipoEventoLabel: Record<string, string> = {
  MANUTENCAO_PREVENTIVA: 'Manutenção Preventiva',
  MANUTENCAO_CORRETIVA: 'Manutenção Corretiva',
  CALIBRACAO: 'Calibração',
  SUBSTITUICAO: 'Substituição',
  OCORRENCIA: 'Ocorrência',
  DESATIVACAO: 'Desativação',
  REATIVACAO: 'Reativação',
  INSTALACAO: 'Instalação',
  VISTORIA: 'Vistoria',
}

const tipoEventoColor: Record<string, string> = {
  MANUTENCAO_PREVENTIVA: 'bg-blue-100 text-blue-800',
  MANUTENCAO_CORRETIVA: 'bg-orange-100 text-orange-800',
  CALIBRACAO: 'bg-green-100 text-green-800',
  SUBSTITUICAO: 'bg-purple-100 text-purple-800',
  OCORRENCIA: 'bg-red-100 text-red-800',
  DESATIVACAO: 'bg-gray-100 text-gray-600',
  REATIVACAO: 'bg-green-100 text-green-700',
  INSTALACAO: 'bg-blue-100 text-blue-700',
  VISTORIA: 'bg-yellow-100 text-yellow-800',
}

const tipoEventoOptions = Object.entries(tipoEventoLabel)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatCurrency(v: number | string | null | undefined) {
  const n = v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function EquipamentoHistorico({ equipamentoTipo, equipamentoId, empreendimentoId }: Props) {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [formAberto, setFormAberto] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/equipamentos-historico/${equipamentoTipo}/${equipamentoId}`)
      .then((r) => r.json())
      .then((body) => setEventos(body.data ?? []))
      .catch(() => setEventos([]))
      .finally(() => setLoading(false))
  }, [equipamentoTipo, equipamentoId])

  function handleSubmit(formData: FormData) {
    setErro(null)
    startTransition(async () => {
      const custoRaw = formData.get('custo') as string
      const body = {
        empreendimentoId,
        equipamentoTipo,
        equipamentoId,
        tipoEvento: formData.get('tipoEvento') as string,
        dataEvento: formData.get('dataEvento') as string,
        descricao: formData.get('descricao') as string,
        responsavel: (formData.get('responsavel') as string) || undefined,
        custo: custoRaw ? parseFloat(custoRaw) : undefined,
        observacoes: (formData.get('observacoes') as string) || undefined,
      }

      const res = await fetch('/api/equipamentos-historico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setFormAberto(false)
        // Reload data
        const reloadRes = await fetch(`/api/equipamentos-historico/${equipamentoTipo}/${equipamentoId}`)
        const reloadBody = await reloadRes.json()
        setEventos(reloadBody.data ?? [])
        router.refresh()
      } else {
        const errBody = await res.json().catch(() => ({}))
        setErro(errBody?.message ?? 'Erro ao registrar evento')
      }
    })
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Histórico Técnico</h2>
        {!formAberto && (
          <button
            onClick={() => setFormAberto(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Registrar Evento
          </button>
        )}
      </div>

      {formAberto && (
        <div className="p-4 border-b bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Novo Evento</h3>
            <button onClick={() => setFormAberto(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
          </div>
          <form action={handleSubmit} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Tipo de Evento *</label>
              <select name="tipoEvento" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {tipoEventoOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Data *</label>
              <input name="dataEvento" type="date" required className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Descrição *</label>
              <input name="descricao" required placeholder="Descreva o evento..." className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Responsável</label>
              <input name="responsavel" placeholder="Nome do técnico" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Custo (R$)</label>
              <input name="custo" type="number" step="0.01" min="0" placeholder="0,00" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Observações</label>
              <input name="observacoes" placeholder="Notas adicionais..." className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {erro && <p className="md:col-span-2 text-xs text-red-600">{erro}</p>}

            <div className="md:col-span-2 flex gap-2">
              <button type="submit" disabled={isPending} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {isPending ? 'Salvando...' : 'Registrar'}
              </button>
              <button type="button" onClick={() => setFormAberto(false)} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando histórico...</div>
      ) : eventos.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Nenhum evento registrado.</div>
      ) : (
        <div className="divide-y">
          {eventos.map((e) => (
            <div key={e.id} className="px-4 py-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoEventoColor[e.tipoEvento] ?? 'bg-gray-100'}`}>
                    {tipoEventoLabel[e.tipoEvento] ?? e.tipoEvento}
                  </span>
                  <span className="text-sm">{e.descricao}</span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(e.dataEvento)}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {e.responsavel && <span>Resp: {e.responsavel}</span>}
                {e.custo && <span>{formatCurrency(Number(e.custo))}</span>}
                {e.documento && <span>Doc: {e.documento.nome}</span>}
                <span>por {e.criadoPor.nome}</span>
              </div>
              {e.observacoes && <p className="text-xs text-muted-foreground">{e.observacoes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
