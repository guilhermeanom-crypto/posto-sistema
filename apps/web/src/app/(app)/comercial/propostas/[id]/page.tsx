'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  atualizarPropostaComercial,
  buscarPropostaComercial,
  iniciarHandoffOperacional,
  podeIniciarHandoffOperacional,
  type HandoffComercialCriadoView,
} from '../actions'
import type {
  PropostaComercialDetalhe,
  StatusPropostaComercial,
} from '../shared'

const STATUS_LABELS: Record<StatusPropostaComercial, string> = {
  RASCUNHO: 'Rascunho',
  PRONTA: 'Pronta',
  ENVIADA: 'Enviada',
  EM_NEGOCIACAO: 'Em negociação',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  EXPIRADA: 'Expirada',
  CANCELADA: 'Cancelada',
}

const STATUS_TRANSITIONS: Record<StatusPropostaComercial, StatusPropostaComercial[]> = {
  RASCUNHO: ['PRONTA', 'CANCELADA'],
  PRONTA: ['RASCUNHO', 'ENVIADA', 'CANCELADA'],
  ENVIADA: ['EM_NEGOCIACAO', 'APROVADA', 'REJEITADA', 'EXPIRADA', 'CANCELADA'],
  EM_NEGOCIACAO: ['APROVADA', 'REJEITADA', 'EXPIRADA', 'CANCELADA'],
  APROVADA: [],
  REJEITADA: [],
  EXPIRADA: [],
  CANCELADA: [],
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}

function toDateInputValue(value: string) {
  return value.slice(0, 10)
}

function buildStatusOptions(currentStatus: StatusPropostaComercial) {
  return [currentStatus, ...STATUS_TRANSITIONS[currentStatus]]
}

function canTransitionTo(currentStatus: StatusPropostaComercial, nextStatus: StatusPropostaComercial) {
  return STATUS_TRANSITIONS[currentStatus].includes(nextStatus)
}

function formatCurrencyBRL(value: number) {
  return `R$ ${formatCurrency(value)}`
}

function normalizeWhatsAppNumber(value: string | null) {
  if (!value) return null

  const digits = value.replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('55')) {
    return digits
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  return digits
}

type HandoffFeedbackState =
  | {
      kind: 'idle'
    }
  | {
      kind: 'created'
      handoff: HandoffComercialCriadoView
      message: string
    }
  | {
      kind: 'exists'
      message: string
    }
  | {
      kind: 'blocked'
      message: string
    }
  | {
      kind: 'forbidden'
      message: string
    }
  | {
      kind: 'error'
      message: string
    }

export default function PropostaDetalhePage() {
  const params = useParams()
  const id = params.id as string
  const [proposta, setProposta] = useState<PropostaComercialDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareSuccess, setShareSuccess] = useState<string | null>(null)
  const [canCreateHandoff, setCanCreateHandoff] = useState(false)
  const [handoffFeedback, setHandoffFeedback] = useState<HandoffFeedbackState>({ kind: 'idle' })
  const [saving, setSaving] = useState(false)
  const [markingAsSent, setMarkingAsSent] = useState(false)
  const [handoffPending, startHandoffTransition] = useTransition()
  const [form, setForm] = useState<{
    status: StatusPropostaComercial
    dataValidade: string
    observacoesComerciais: string
  }>({
    status: 'RASCUNHO',
    dataValidade: '',
    observacoesComerciais: '',
  })

  function syncForm(data: PropostaComercialDetalhe) {
    setForm({
      status: data.status,
      dataValidade: toDateInputValue(data.dataValidade),
      observacoesComerciais: data.observacoesComerciais ?? '',
    })
  }

  useEffect(() => {
    async function loadProposta() {
      try {
        const [data, permission] = await Promise.all([
          buscarPropostaComercial(id),
          podeIniciarHandoffOperacional(),
        ])

        if (!data) {
          setError('Proposta não encontrada')
          return
        }

        setProposta(data)
        setCanCreateHandoff(permission)
        syncForm(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar proposta')
      } finally {
        setLoading(false)
      }
    }

    loadProposta()
  }, [id])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!proposta) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const updated = await atualizarPropostaComercial(id, {
        status: form.status,
        dataValidade: form.dataValidade,
        observacoesComerciais: form.observacoesComerciais.trim()
          ? form.observacoesComerciais.trim()
          : null,
      })

      setProposta(updated)
      syncForm(updated)
      setSaveSuccess('Dados comerciais atualizados com sucesso.')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao atualizar proposta')
    } finally {
      setSaving(false)
    }
  }

  async function copyToClipboard(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text)
      setShareError(null)
      setShareSuccess(successMessage)
    } catch {
      setShareError('Não foi possível copiar. Verifique as permissões do navegador.')
      setShareSuccess(null)
    }
  }

  function buildInternalLink() {
    return `/comercial/propostas/${id}`
  }

  function buildShareMessage(data: PropostaComercialDetalhe) {
    return [
      'Olá, tudo bem?',
      '',
      `Segue a proposta comercial ${data.numero} referente à análise/regularização ambiental do empreendimento.`,
      '',
      `Valor base estimado: ${formatCurrencyBRL(data.totalBase)}`,
      `Validade da proposta: ${formatDate(data.dataValidade)}`,
      '',
      'Você pode acessar a proposta pelo sistema ou baixar o PDF pelo botão disponível no detalhe.',
      '',
      'Fico à disposição.',
    ].join('\n')
  }

  async function handleCopyMessage() {
    if (!proposta) return
    await copyToClipboard(buildShareMessage(proposta), 'Mensagem comercial copiada com sucesso.')
  }

  async function handleCopyLink() {
    const target =
      typeof window === 'undefined'
        ? buildInternalLink()
        : new URL(buildInternalLink(), window.location.origin).toString()

    await copyToClipboard(target, 'Link interno da proposta copiado com sucesso.')
  }

  function handleOpenWhatsApp() {
    if (!proposta) return

    const phone = normalizeWhatsAppNumber(proposta.telefoneContato)
    if (!phone) {
      setShareError('Telefone de contato indisponível para envio por WhatsApp.')
      setShareSuccess(null)
      return
    }

    const message = encodeURIComponent(buildShareMessage(proposta))
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer')
    setShareError(null)
    setShareSuccess('WhatsApp Web aberto com a mensagem sugerida.')
  }

  function handleOpenEmail() {
    if (!proposta) return

    if (!proposta.emailContato) {
      setShareError('E-mail de contato indisponível para envio.')
      setShareSuccess(null)
      return
    }

    const subject = encodeURIComponent(`Proposta Comercial ${proposta.numero}`)
    const body = encodeURIComponent(buildShareMessage(proposta))
    window.location.href = `mailto:${proposta.emailContato}?subject=${subject}&body=${body}`
    setShareError(null)
    setShareSuccess('Cliente de e-mail aberto com assunto e mensagem sugeridos.')
  }

  async function handleMarkAsSent() {
    if (!proposta || !canTransitionTo(proposta.status, 'ENVIADA')) return

    setMarkingAsSent(true)
    setSaveError(null)
    setSaveSuccess(null)
    setShareError(null)
    setShareSuccess(null)

    try {
      const updated = await atualizarPropostaComercial(id, {
        status: 'ENVIADA',
        dataValidade: toDateInputValue(proposta.dataValidade),
        observacoesComerciais: proposta.observacoesComerciais,
      })

      setProposta(updated)
      syncForm(updated)
      setShareSuccess('Proposta marcada como enviada com sucesso.')
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Erro ao marcar proposta como enviada')
    } finally {
      setMarkingAsSent(false)
    }
  }

  function handleIniciarHandoff() {
    if (!proposta) return

    setHandoffFeedback({ kind: 'idle' })
    setShareError(null)
    setShareSuccess(null)
    setSaveError(null)
    setSaveSuccess(null)

    startHandoffTransition(async () => {
      const result = await iniciarHandoffOperacional(proposta.id)

      if (result.ok) {
        setHandoffFeedback({
          kind: 'created',
          handoff: result.handoff,
          message: 'Handoff operacional iniciado com sucesso.',
        })
        return
      }

      if (result.reason === 'handoff_existente') {
        setHandoffFeedback({
          kind: 'exists',
          message: result.message,
        })
        return
      }

      if (result.reason === 'proposta_nao_aprovada') {
        setHandoffFeedback({
          kind: 'blocked',
          message: result.message,
        })
        return
      }

      if (result.reason === 'sem_permissao') {
        setHandoffFeedback({
          kind: 'forbidden',
          message: result.message,
        })
        return
      }

      setHandoffFeedback({
        kind: 'error',
        message: result.message,
      })
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Carregando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Erro</h1>
        <p className="text-red-600">{error}</p>
        <Link href="/comercial/propostas" className="text-blue-600 hover:underline">
          Voltar para Propostas
        </Link>
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Proposta não encontrada</h1>
        <Link href="/comercial/propostas" className="text-blue-600 hover:underline">
          Voltar para Propostas
        </Link>
      </div>
    )
  }

  const statusOptions = buildStatusOptions(proposta.status)
  const nextStatusOptions = statusOptions.filter((status) => status !== proposta.status)
  const shareMessage = buildShareMessage(proposta)
  const internalLink = buildInternalLink()
  const canSendByWhatsApp = Boolean(normalizeWhatsAppNumber(proposta.telefoneContato))
  const canSendByEmail = Boolean(proposta.emailContato)
  const canMarkAsSent = canTransitionTo(proposta.status, 'ENVIADA')
  const propostaAprovada = proposta.status === 'APROVADA'
  const handoffKnown = handoffFeedback.kind === 'created' || handoffFeedback.kind === 'exists'
  const canShowHandoffButton = propostaAprovada && canCreateHandoff && !handoffKnown
  const actionButtonClass =
    'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/comercial/propostas" className="text-blue-600 hover:underline">
            ← Voltar para Propostas
          </Link>

          <a
            href={`/api/comercial/propostas/${id}/pdf`}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Baixar PDF
          </a>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-3xl font-bold mb-4">Proposta {proposta.numero}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Status:</strong> {STATUS_LABELS[proposta.status]}</p>
            <p><strong>Origem:</strong> {proposta.origem}</p>
            <p><strong>Data de Criação:</strong> {formatDate(proposta.criadoEm)}</p>
          </div>
          <div>
            <p><strong>Data de Validade:</strong> {formatDate(proposta.dataValidade)}</p>
            <p><strong>Total Mínimo:</strong> R$ {formatCurrency(proposta.totalMinimo)}</p>
            <p><strong>Total Base:</strong> R$ {formatCurrency(proposta.totalBase)}</p>
            <p><strong>Total Máximo:</strong> R$ {formatCurrency(proposta.totalMaximo)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Edição Comercial</h2>
            <p className="text-sm text-gray-600 mt-1">
              Esta edição altera apenas status, validade e observações comerciais.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value as StatusPropostaComercial }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {nextStatusOptions.length > 0
                  ? `Transições permitidas: ${nextStatusOptions.map((status) => STATUS_LABELS[status]).join(', ')}.`
                  : 'Este status é terminal e não possui novas transições permitidas.'}
              </p>
            </div>

            <div>
              <label htmlFor="dataValidade" className="block text-sm font-medium mb-1">
                Data de validade
              </label>
              <input
                id="dataValidade"
                type="date"
                value={form.dataValidade}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dataValidade: event.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="observacoesComerciais" className="block text-sm font-medium mb-1">
              Observações comerciais
            </label>
            <textarea
              id="observacoesComerciais"
              value={form.observacoesComerciais}
              onChange={(event) =>
                setForm((current) => ({ ...current, observacoesComerciais: event.target.value }))
              }
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Registre observações comerciais visíveis para a proposta."
              maxLength={5000}
            />
          </div>

          {saveError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          ) : null}

          {saveSuccess ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {saveSuccess}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Compartilhamento da proposta</h2>
            <p className="text-sm text-gray-600 mt-1">
              Use estas ações para apoiar o envio comercial sem criar aceite formal ou link público externo.
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Compartilhamento assistido
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Texto comercial sugerido</h3>
              <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700 font-sans">
                {shareMessage}
              </pre>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Ações permitidas</h3>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleCopyMessage} className={actionButtonClass}>
                  Copiar mensagem
                </button>
                <button type="button" onClick={handleCopyLink} className={actionButtonClass}>
                  Copiar link interno
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  disabled={!canSendByWhatsApp}
                  className={actionButtonClass}
                >
                  Enviar por WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleOpenEmail}
                  disabled={!canSendByEmail}
                  className={actionButtonClass}
                >
                  Enviar por e-mail
                </button>
                {canMarkAsSent ? (
                  <button
                    type="button"
                    onClick={handleMarkAsSent}
                    disabled={markingAsSent}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    {markingAsSent ? 'Marcando...' : 'Marcar como enviada'}
                  </button>
                ) : null}
              </div>
            </div>

            {shareError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {shareError}
              </div>
            ) : null}

            {shareSuccess ? (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {shareSuccess}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Resumo para envio</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Proposta:</strong> {proposta.numero}</p>
                <p><strong>Status atual:</strong> {STATUS_LABELS[proposta.status]}</p>
                <p><strong>Valor base:</strong> {formatCurrencyBRL(proposta.totalBase)}</p>
                <p><strong>Validade:</strong> {formatDate(proposta.dataValidade)}</p>
                <p><strong>E-mail:</strong> {proposta.emailContato || 'Não informado'}</p>
                <p><strong>Telefone:</strong> {proposta.telefoneContato || 'Não informado'}</p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Link interno</h3>
              <p className="break-all text-sm text-gray-700">{internalLink}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 via-white to-sky-50 p-6 rounded-lg shadow mb-6 border border-amber-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
              Transição comercial → operação
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Handoff operacional</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Use esta ação para formalizar a passagem da proposta aprovada para a operação, sem abrir contrato,
              OS, financeiro, processo, tarefa, documento ou onboarding.
            </p>
          </div>

          {canShowHandoffButton ? (
            <button
              type="button"
              onClick={handleIniciarHandoff}
              disabled={handoffPending}
              className="inline-flex min-w-[220px] items-center justify-center rounded-md bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {handoffPending ? 'Iniciando...' : 'Iniciar handoff operacional'}
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Elegibilidade atual</p>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <p>
                <strong>Status da proposta:</strong>{' '}
                {propostaAprovada ? 'Aprovada e apta para handoff.' : 'Ainda não aprovada para handoff.'}
              </p>
              <p>
                <strong>Permissão do perfil:</strong>{' '}
                {canCreateHandoff ? 'Pode iniciar handoff.' : 'Sem permissão para iniciar handoff.'}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Resultado conhecido</p>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              {handoffFeedback.kind === 'created' ? (
                <>
                  <p>
                    <strong>Status inicial:</strong> {handoffFeedback.handoff.status}
                  </p>
                  <Link
                    href={`/operacao/handoffs/${handoffFeedback.handoff.id}`}
                    className="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    Abrir handoff operacional
                  </Link>
                </>
              ) : handoffFeedback.kind === 'exists' ? (
                <p>Já existe um handoff operacional ativo conhecido para esta proposta.</p>
              ) : (
                <p>Nenhum handoff operacional conhecido nesta sessão.</p>
              )}
            </div>
          </div>
        </div>

        {!propostaAprovada ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-100/70 px-4 py-3 text-sm text-amber-900">
            O handoff operacional só pode ser iniciado após a aprovação da proposta.
          </div>
        ) : null}

        {propostaAprovada && !canCreateHandoff ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Seu perfil não possui permissão para iniciar o handoff operacional desta proposta.
          </div>
        ) : null}

        {handoffFeedback.kind === 'created' ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {handoffFeedback.message}
          </div>
        ) : null}

        {handoffFeedback.kind === 'exists' ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {handoffFeedback.message}
          </div>
        ) : null}

        {handoffFeedback.kind === 'blocked' ? (
          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            {handoffFeedback.message}
          </div>
        ) : null}

        {handoffFeedback.kind === 'forbidden' ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {handoffFeedback.message}
          </div>
        ) : null}

        {handoffFeedback.kind === 'error' ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {handoffFeedback.message}
          </div>
        ) : null}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold mb-4">Dados Comerciais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Nome do Lead:</strong> {proposta.nomeLead || '-'}</p>
            <p><strong>Empresa:</strong> {proposta.empresaLead || '-'}</p>
            <p><strong>Email:</strong> {proposta.emailContato || '-'}</p>
          </div>
          <div>
            <p><strong>Telefone:</strong> {proposta.telefoneContato || '-'}</p>
            <p><strong>Município/UF:</strong> {proposta.municipio ? `${proposta.municipio}/${proposta.uf}` : proposta.uf}</p>
            <p><strong>Observações Comerciais:</strong> {proposta.observacoesComerciais || '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold mb-4">Diagnóstico Resumido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>CNAE Principal:</strong> {proposta.diagnostico.cnaePrincipal.codigo} - {proposta.diagnostico.cnaePrincipal.descricao}</p>
            <p><strong>Risco:</strong> {proposta.diagnostico.riscoGeral.nivel}</p>
            <p><strong>Score:</strong> {proposta.diagnostico.riscoGeral.score}</p>
            <p><strong>Potencial Poluidor:</strong> {proposta.diagnostico.cnaePrincipal.potencialPoluidor}</p>
          </div>
          <div>
            <p><strong>Alertas:</strong></p>
            <ul className="list-disc list-inside">
              {proposta.diagnostico.alertas.map((alerta, index) => (
                <li key={index}>{alerta}</li>
              ))}
            </ul>
            <p className="mt-3"><strong>Próximos Passos:</strong></p>
            <ul className="list-disc list-inside">
              {proposta.diagnostico.proximosPassos.map((passo, index) => (
                <li key={index}>{passo}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Itens da Proposta</h2>
        {proposta.itens.length === 0 ? (
          <p>Nenhum item encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">Código</th>
                  <th className="px-4 py-2 border">Nome do Serviço</th>
                  <th className="px-4 py-2 border">Categoria</th>
                  <th className="px-4 py-2 border">Decisão</th>
                  <th className="px-4 py-2 border">Quantidade</th>
                  <th className="px-4 py-2 border">Preço Aplicado</th>
                  <th className="px-4 py-2 border">Valor da Linha</th>
                </tr>
              </thead>
              <tbody>
                {proposta.itens.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{item.codigoServico}</td>
                    <td className="px-4 py-2 border">{item.nomeServico}</td>
                    <td className="px-4 py-2 border">{item.categoriaServico}</td>
                    <td className="px-4 py-2 border">{item.decisao}</td>
                    <td className="px-4 py-2 border">{item.quantidade}</td>
                    <td className="px-4 py-2 border">R$ {formatCurrency(item.precoAplicadoUnitario)}</td>
                    <td className="px-4 py-2 border">R$ {formatCurrency(item.valorAplicadoLinha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
