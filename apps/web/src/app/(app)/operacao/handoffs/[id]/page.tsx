'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type {
  AtualizarHandoffOperacionalPayload,
  HandoffComercialDetalhe,
  PrioridadeOperacionalHandoff,
  StatusHandoffComercial,
  UsuarioResponsavelOperacionalOption,
} from '../shared'
import {
  ESFERA_LABELS,
  ORIGEM_PROPOSTA_LABELS,
  PRIORIDADE_OPERACIONAL_LABELS,
  POTENCIAL_POLUIDOR_LABELS,
  RISCO_NIVEL_LABELS,
  STATUS_HANDOFF_LABELS,
  STATUS_PROPOSTA_ORIGEM_LABELS,
  formatPerfilLabel,
} from '../shared'

const STATUS_TRANSITIONS: Record<StatusHandoffComercial, StatusHandoffComercial[]> = {
  AGUARDANDO_HANDOFF: ['EM_TRIAGEM_OPERACIONAL', 'CANCELADO'],
  EM_TRIAGEM_OPERACIONAL: ['AGUARDANDO_DOCUMENTOS', 'EM_PLANEJAMENTO', 'CANCELADO'],
  AGUARDANDO_DOCUMENTOS: ['EM_TRIAGEM_OPERACIONAL', 'EM_PLANEJAMENTO', 'CANCELADO'],
  EM_PLANEJAMENTO: ['EM_EXECUCAO', 'PAUSADO', 'CANCELADO'],
  EM_EXECUCAO: ['PAUSADO', 'CONCLUIDO', 'CANCELADO'],
  PAUSADO: ['EM_TRIAGEM_OPERACIONAL', 'EM_PLANEJAMENTO', 'EM_EXECUCAO', 'CANCELADO'],
  CANCELADO: [],
  CONCLUIDO: [],
}

const PERFIS_RESPONSAVEL_OPERACIONAL = [
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

type UpdatePermissions = {
  canRead?: boolean
  canUpdate: boolean
  canManageSensitive: boolean
  perfil: string | null
}

type FormState = {
  status: StatusHandoffComercial
  responsavelOperacionalId: string
  pendenciasText: string
  observacoesOperacionais: string
  observacoesPlanejamento: string
  prioridadeOperacional: PrioridadeOperacionalHandoff | ''
  necessidadeDocumentos: 'true' | 'false' | ''
  necessidadeVisita: 'true' | 'false' | ''
  necessidadeTerceiro: 'true' | 'false' | ''
}

type FeedbackState =
  | { kind: 'idle' }
  | { kind: 'info'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

const STATUS_UI_COPY: Record<
  StatusHandoffComercial,
  {
    title: string
    description: string
    tone: string
  }
> = {
  AGUARDANDO_HANDOFF: {
    title: 'Handoff recebido',
    description: 'A operação já enxerga esta demanda, mas a triagem operacional ainda não foi iniciada.',
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  EM_TRIAGEM_OPERACIONAL: {
    title: 'Triagem operacional em andamento',
    description: 'Revise responsável, pendências e observações antes de aceitar este handoff para preparação.',
    tone: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  AGUARDANDO_DOCUMENTOS: {
    title: 'Handoff aguardando documentos',
    description: 'Existe bloqueio documental ou informacional. Resolva as pendências antes do aceite operacional.',
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  EM_PLANEJAMENTO: {
    title: 'Aceite operacional concluído',
    description:
      'Este handoff já foi aceito pela operação e está em organização pré-execução, sem OS, contrato ou execução iniciada.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  EM_EXECUCAO: {
    title: 'Execução em andamento',
    description: 'O aceite operacional já ocorreu e o handoff evoluiu para execução.',
    tone: 'border-blue-200 bg-blue-50 text-blue-900',
  },
  PAUSADO: {
    title: 'Fluxo pausado',
    description: 'O handoff foi interrompido temporariamente. Revise o contexto operacional antes de retomar.',
    tone: 'border-orange-200 bg-orange-50 text-orange-900',
  },
  CANCELADO: {
    title: 'Handoff cancelado',
    description: 'Este handoff foi encerrado sem continuidade operacional.',
    tone: 'border-rose-200 bg-rose-50 text-rose-900',
  },
  CONCLUIDO: {
    title: 'Handoff concluído',
    description: 'O fluxo operacional deste handoff foi encerrado com conclusão final.',
    tone: 'border-green-200 bg-green-50 text-green-900',
  },
}

const PRIORIDADE_OPERACIONAL_OPTIONS: PrioridadeOperacionalHandoff[] = [
  'BAIXA',
  'MEDIA',
  'ALTA',
  'CRITICA',
]

function formatDateTime(value: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

function renderText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : '—'
}

function renderMappedLabel<T extends string>(
  value: T | null | undefined,
  labels: Partial<Record<T, string>>,
) {
  if (!value) return '—'
  return labels[value] ?? value
}

function renderNullableBooleanLabel(
  value: boolean | null | undefined,
  trueLabel = 'Sim',
  falseLabel = 'Não',
  emptyLabel = 'A confirmar',
) {
  if (value === true) return trueLabel
  if (value === false) return falseLabel
  return emptyLabel
}

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = (value ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

function toNullableBooleanSelectValue(value: boolean | null | undefined): 'true' | 'false' | '' {
  if (value === true) return 'true'
  if (value === false) return 'false'
  return ''
}

function parseNullableBooleanSelectValue(value: 'true' | 'false' | '') {
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

function normalizePendenciasInput(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function renderDefinitionLabel(value: boolean, positiveLabel: string, negativeLabel: string) {
  return value ? positiveLabel : negativeLabel
}

function buildInitialFormState(handoff: HandoffComercialDetalhe): FormState {
  return {
    status: handoff.status,
    responsavelOperacionalId: handoff.responsavelOperacionalId ?? '',
    pendenciasText: handoff.pendenciasOperacionais.join('\n'),
    observacoesOperacionais: handoff.observacoesOperacionais ?? '',
    observacoesPlanejamento: handoff.observacoesPlanejamento ?? '',
    prioridadeOperacional: handoff.prioridadeOperacional ?? '',
    necessidadeDocumentos: toNullableBooleanSelectValue(handoff.necessidadeDocumentos),
    necessidadeVisita: toNullableBooleanSelectValue(handoff.necessidadeVisita),
    necessidadeTerceiro: toNullableBooleanSelectValue(handoff.necessidadeTerceiro),
  }
}

function hasPreparacaoPersistida(handoff: HandoffComercialDetalhe | null) {
  if (!handoff) return false

  return Boolean(
    normalizeNullableText(handoff.observacoesPlanejamento) ||
      handoff.prioridadeOperacional ||
      handoff.necessidadeDocumentos !== null ||
      handoff.necessidadeVisita !== null ||
      handoff.necessidadeTerceiro !== null,
  )
}

function buildStatusOptions(
  currentStatus: StatusHandoffComercial,
  canManageSensitive: boolean,
) {
  const allowed = [currentStatus, ...STATUS_TRANSITIONS[currentStatus]]

  return allowed.filter((status, index) => {
    if (allowed.indexOf(status) !== index) return false
    if (canManageSensitive) return true
    if (status === 'CANCELADO' || status === 'CONCLUIDO') return status === currentStatus
    return true
  })
}

function isAceitePlanejado(statusAtual: StatusHandoffComercial, statusSelecionado: StatusHandoffComercial) {
  return statusSelecionado === 'EM_PLANEJAMENTO' && statusAtual !== 'EM_PLANEJAMENTO'
}

export default function HandoffOperacionalDetalhePage() {
  const params = useParams()
  const id = params.id as string
  const [handoff, setHandoff] = useState<HandoffComercialDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [permissions, setPermissions] = useState<UpdatePermissions>({
    canUpdate: false,
    canManageSensitive: false,
    perfil: null,
  })
  const [usuariosOperacionais, setUsuariosOperacionais] = useState<UsuarioResponsavelOperacionalOption[]>([])
  const [usuariosLoading, setUsuariosLoading] = useState(false)
  const [usuariosError, setUsuariosError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: 'idle' })
  const [isSaving, startSavingTransition] = useTransition()

  useEffect(() => {
    async function loadHandoff() {
      setLoading(true)
      setError(null)
      setNotFound(false)
      setFeedback({ kind: 'idle' })

      try {
        const response = await fetch(`/api/operacao/handoffs/${id}`, {
          cache: 'no-store',
        })
        const body = (await response.json().catch(() => ({}))) as {
          data?: HandoffComercialDetalhe
          permissions?: UpdatePermissions
          error?: string
        }

        if (body.permissions) {
          setPermissions(body.permissions)
        }

        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true)
            setHandoff(null)
            return
          }

          setError(body.error || 'Erro ao carregar handoff operacional')
          setHandoff(null)
          return
        }

        setHandoff(body.data ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar handoff operacional')
        setHandoff(null)
      } finally {
        setLoading(false)
      }
    }

    loadHandoff()
  }, [id])

  useEffect(() => {
    if (!handoff) {
      setFormState(null)
      return
    }

    setFormState(buildInitialFormState(handoff))
  }, [handoff])

  useEffect(() => {
    if (!permissions.canManageSensitive) {
      setUsuariosOperacionais([])
      setUsuariosError(null)
      return
    }

    let active = true

    async function loadUsuarios() {
      setUsuariosLoading(true)
      setUsuariosError(null)

      try {
        const response = await fetch('/api/usuarios', { cache: 'no-store' })
        const body = (await response.json().catch(() => ({}))) as {
          data?: UsuarioResponsavelOperacionalOption[]
          error?: string
        }

        if (!response.ok) {
          throw new Error(body.error || 'Não foi possível carregar os usuários do tenant.')
        }

        const usuarios = Array.isArray(body.data) ? body.data : []
        const filtrados = usuarios.filter(
          (usuario) =>
            usuario.ativo &&
            PERFIS_RESPONSAVEL_OPERACIONAL.includes(
              usuario.perfil as (typeof PERFIS_RESPONSAVEL_OPERACIONAL)[number],
            ),
        )

        if (active) {
          setUsuariosOperacionais(filtrados)
        }
      } catch (err) {
        if (active) {
          setUsuariosOperacionais([])
          setUsuariosError(
            err instanceof Error ? err.message : 'Não foi possível carregar os responsáveis operacionais.',
          )
        }
      } finally {
        if (active) {
          setUsuariosLoading(false)
        }
      }
    }

    loadUsuarios()

    return () => {
      active = false
    }
  }, [permissions.canManageSensitive])

  const statusOptions = useMemo(() => {
    if (!handoff) return [] as StatusHandoffComercial[]
    return buildStatusOptions(handoff.status, permissions.canManageSensitive)
  }, [handoff, permissions.canManageSensitive])

  const responsavelOptions = useMemo(() => {
    if (!handoff?.responsavelOperacionalId) return usuariosOperacionais

    const currentUser = usuariosOperacionais.find(
      (usuario) => usuario.id === handoff.responsavelOperacionalId,
    )

    if (currentUser) return usuariosOperacionais

    return [
      {
        id: handoff.responsavelOperacionalId,
        nome: 'Responsável atual já atribuído',
        email: '',
        perfil: 'ATRIBUÍDO',
        ativo: false,
      },
      ...usuariosOperacionais,
    ]
  }, [handoff, usuariosOperacionais])

  const aceiteEmPreparacao = useMemo(() => {
    if (!handoff || !formState) {
      return {
        targetingAceite: false,
        missingResponsavel: false,
        hasPendencias: false,
        blockingMessage: null as string | null,
      }
    }

    const targetingAceite = isAceitePlanejado(handoff.status, formState.status)
    const missingResponsavel = targetingAceite && !formState.responsavelOperacionalId.trim()
    const hasPendencias = targetingAceite && normalizePendenciasInput(formState.pendenciasText).length > 0

    let blockingMessage: string | null = null

    if (missingResponsavel) {
      blockingMessage = 'Defina um responsável operacional antes de aceitar este handoff.'
    } else if (hasPendencias) {
      blockingMessage =
        'Resolva ou remova as pendências operacionais antes de avançar para preparação.'
    }

    return {
      targetingAceite,
      missingResponsavel,
      hasPendencias,
      blockingMessage,
    }
  }, [handoff, formState])

  const responsavelOperacionalAtualLabel = useMemo(() => {
    if (!handoff?.responsavelOperacionalId) {
      return 'Não atribuído'
    }

    const currentUser = usuariosOperacionais.find(
      (usuario) => usuario.id === handoff.responsavelOperacionalId,
    )

    return currentUser?.nome || 'Responsável operacional atribuído'
  }, [handoff, usuariosOperacionais])

  const responsavelComercialAtualLabel = handoff?.responsavelComercialId
    ? 'Responsável comercial definido no repasse'
    : 'Não informado'

  const planejamentoPosAceite = useMemo(() => {
    if (!handoff) return null

    const isPlanejamento = handoff.status === 'EM_PLANEJAMENTO'
    const responsavelDefinido = Boolean(handoff.responsavelOperacionalId)
    const pendenciasResolvidas = handoff.pendenciasOperacionais.length === 0
    const observacoesRegistradas = Boolean(normalizeNullableText(handoff.observacoesPlanejamento))
    const prioridadeDefinida = Boolean(handoff.prioridadeOperacional)
    const necessidadesMapeadas =
      handoff.necessidadeDocumentos !== null ||
      handoff.necessidadeVisita !== null ||
      handoff.necessidadeTerceiro !== null
    const proximosPassosDisponiveis = handoff.proximosPassosResumo.length > 0
    const servicosDisponiveis = handoff.servicosResumo.length > 0
    const alertasAtivos = handoff.alertasResumo.length > 0

    const prontidaoItems = [
      {
        label: 'Responsável operacional',
        value: renderDefinitionLabel(responsavelDefinido, 'Definido', 'Não informado'),
        tone: responsavelDefinido ? 'text-emerald-700' : 'text-amber-700',
      },
      {
        label: 'Pendências bloqueantes',
        value: renderDefinitionLabel(pendenciasResolvidas, 'Resolvidas', 'Em aberto'),
        tone: pendenciasResolvidas ? 'text-emerald-700' : 'text-amber-700',
      },
      {
        label: 'Observações de planejamento',
        value: renderDefinitionLabel(observacoesRegistradas, 'Registradas', 'A definir'),
        tone: observacoesRegistradas ? 'text-emerald-700' : 'text-slate-600',
      },
      {
        label: 'Prioridade operacional',
        value: renderDefinitionLabel(prioridadeDefinida, 'Definida', 'A definir'),
        tone: prioridadeDefinida ? 'text-emerald-700' : 'text-slate-600',
      },
      {
        label: 'Necessidades de preparação',
        value: renderDefinitionLabel(necessidadesMapeadas, 'Sinalizadas', 'A confirmar'),
        tone: necessidadesMapeadas ? 'text-emerald-700' : 'text-slate-600',
      },
      {
        label: 'Próximos passos orientativos',
        value: renderDefinitionLabel(proximosPassosDisponiveis, 'Disponíveis', 'A confirmar'),
        tone: proximosPassosDisponiveis ? 'text-emerald-700' : 'text-slate-600',
      },
      {
        label: 'Escopo aprovado para organização',
        value: renderDefinitionLabel(servicosDisponiveis, 'Disponível', 'A confirmar'),
        tone: servicosDisponiveis ? 'text-emerald-700' : 'text-slate-600',
      },
      {
        label: 'Sinalização de atenção',
        value: renderDefinitionLabel(alertasAtivos, 'Alertas informados', 'Sem alertas resumidos'),
        tone: alertasAtivos ? 'text-amber-700' : 'text-emerald-700',
      },
    ]

    return {
      isPlanejamento,
      responsavelDefinido,
      pendenciasResolvidas,
      observacoesRegistradas,
      prioridadeDefinida,
      necessidadesMapeadas,
      proximosPassosDisponiveis,
      servicosDisponiveis,
      alertasAtivos,
      prontidaoItems,
    }
  }, [handoff])

  const preparacaoPersistida = useMemo(() => hasPreparacaoPersistida(handoff), [handoff])

  const exibirCamposPreparacao =
    handoff?.status === 'EM_PLANEJAMENTO' ||
    formState?.status === 'EM_PLANEJAMENTO' ||
    preparacaoPersistida

  function updateFormField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => {
      if (!current) return current
      return {
        ...current,
        [key]: value,
      }
    })
  }

  function handleResetForm() {
    if (!handoff) return
    setFormState(buildInitialFormState(handoff))
    setFeedback({ kind: 'idle' })
  }

  function buildPayload(): AtualizarHandoffOperacionalPayload | null {
    if (!handoff || !formState) return null

    const payload: AtualizarHandoffOperacionalPayload = {}

    if (formState.status !== handoff.status) {
      payload.status = formState.status
    }

    if (
      permissions.canManageSensitive &&
      formState.responsavelOperacionalId &&
      formState.responsavelOperacionalId !== (handoff.responsavelOperacionalId ?? '')
    ) {
      payload.responsavelOperacionalId = formState.responsavelOperacionalId
    }

    const pendencias = normalizePendenciasInput(formState.pendenciasText)
    if (!arraysEqual(pendencias, handoff.pendenciasOperacionais)) {
      payload.pendenciasOperacionais = pendencias
    }

    const observacoes = normalizeNullableText(formState.observacoesOperacionais)
    const observacoesAtuais = normalizeNullableText(handoff.observacoesOperacionais)
    if (observacoes !== observacoesAtuais) {
      payload.observacoesOperacionais = observacoes
    }

    const observacoesPlanejamento = normalizeNullableText(formState.observacoesPlanejamento)
    const observacoesPlanejamentoAtuais = normalizeNullableText(handoff.observacoesPlanejamento)
    if (observacoesPlanejamento !== observacoesPlanejamentoAtuais) {
      payload.observacoesPlanejamento = observacoesPlanejamento
    }

    const prioridadeOperacional = formState.prioridadeOperacional || null
    if (prioridadeOperacional !== handoff.prioridadeOperacional) {
      payload.prioridadeOperacional = prioridadeOperacional
    }

    const necessidadeDocumentos = parseNullableBooleanSelectValue(formState.necessidadeDocumentos)
    if (necessidadeDocumentos !== handoff.necessidadeDocumentos) {
      payload.necessidadeDocumentos = necessidadeDocumentos
    }

    const necessidadeVisita = parseNullableBooleanSelectValue(formState.necessidadeVisita)
    if (necessidadeVisita !== handoff.necessidadeVisita) {
      payload.necessidadeVisita = necessidadeVisita
    }

    const necessidadeTerceiro = parseNullableBooleanSelectValue(formState.necessidadeTerceiro)
    if (necessidadeTerceiro !== handoff.necessidadeTerceiro) {
      payload.necessidadeTerceiro = necessidadeTerceiro
    }

    return Object.keys(payload).length > 0 ? payload : null
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!handoff || !formState) return

    if (aceiteEmPreparacao.missingResponsavel) {
      setFeedback({
        kind: 'error',
        message: 'Defina um responsável operacional antes de aceitar este handoff.',
      })
      return
    }

    if (aceiteEmPreparacao.hasPendencias) {
      setFeedback({
        kind: 'error',
        message: 'Resolva ou remova as pendências operacionais antes de avançar para preparação.',
      })
      return
    }

    const payload = buildPayload()
    if (!payload) {
      setFeedback({
        kind: 'info',
        message: 'Nenhuma alteração pendente para salvar neste handoff.',
      })
      return
    }

    setFeedback({ kind: 'idle' })

    startSavingTransition(async () => {
      try {
        const response = await fetch(`/api/operacao/handoffs/${handoff.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        const body = (await response.json().catch(() => ({}))) as {
          data?: HandoffComercialDetalhe
          error?: string
        }

        if (!response.ok) {
          setFeedback({
            kind: 'error',
            message: body.error || 'Não foi possível atualizar o handoff operacional no momento.',
          })
          return
        }

        if (!body.data) {
          setFeedback({
            kind: 'error',
            message: 'Não foi possível atualizar o handoff operacional no momento.',
          })
          return
        }

        setHandoff(body.data)
        setFeedback({
          kind: 'success',
          message: aceiteEmPreparacao.targetingAceite
            ? 'Handoff aceito pela operação e movido para organização pré-execução.'
            : 'Handoff operacional atualizado com sucesso.',
        })
      } catch (error) {
        setFeedback({
          kind: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o handoff operacional no momento.',
        })
      }
    })
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Link href="/operacao/handoffs" className="text-sm text-sky-700 hover:underline">
          ← Voltar para handoffs
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Carregando handoff operacional...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <Link href="/operacao/handoffs" className="text-sm text-sky-700 hover:underline">
          ← Voltar para handoffs
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-medium">Erro ao carregar handoff</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (notFound || !handoff || !formState) {
    return (
      <div className="space-y-4 p-6">
        <Link href="/operacao/handoffs" className="text-sm text-sky-700 hover:underline">
          ← Voltar para handoffs
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Handoff operacional não encontrado</h1>
          <p className="mt-2 text-sm text-slate-600">
            Verifique se o handoff ainda existe neste tenant ou volte para a listagem operacional.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/operacao/handoffs" className="text-sm font-medium text-sky-700 hover:underline">
          ← Voltar para handoffs
        </Link>
        <Link
          href={`/comercial/propostas/${handoff.propostaComercialId}`}
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          Abrir proposta original
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Handoff operacional</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{handoff.numeroProposta}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Proposta de {renderMappedLabel(handoff.origemProposta, ORIGEM_PROPOSTA_LABELS)} aprovada e entregue para condução operacional.
            </p>
          </div>
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1.5 text-sm font-medium text-sky-800">
            {STATUS_HANDOFF_LABELS[handoff.status]}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-white/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Criado em</p>
            <p className="mt-2 text-sm text-slate-900">{formatDateTime(handoff.criadoEm)}</p>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Assumido em</p>
            <p className="mt-2 text-sm text-slate-900">{formatDateTime(handoff.assumidoEm)}</p>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Concluído em</p>
            <p className="mt-2 text-sm text-slate-900">{formatDateTime(handoff.concluidoEm)}</p>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Cancelado em</p>
            <p className="mt-2 text-sm text-slate-900">{formatDateTime(handoff.canceladoEm)}</p>
          </div>
        </div>
      </div>

      <section
        className={`rounded-xl border px-4 py-4 text-sm shadow-sm ${STATUS_UI_COPY[handoff.status].tone}`}
      >
        <p className="font-semibold">{STATUS_UI_COPY[handoff.status].title}</p>
        <p className="mt-1 leading-6">{STATUS_UI_COPY[handoff.status].description}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
              Atualização operacional
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Condução do handoff</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Atualize somente o progresso operacional, o responsável, as pendências e o contexto geral
              da condução deste handoff. Use o bloco de preparação apenas para registrar a organização
              inicial da pré-execução após o aceite operacional.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p><strong>Perfil atual:</strong> {formatPerfilLabel(permissions.perfil)}</p>
            <p><strong>Pode atualizar:</strong> {permissions.canUpdate ? 'Sim' : 'Não'}</p>
            <p><strong>Pode atribuir/concluir/cancelar:</strong> {permissions.canManageSensitive ? 'Sim' : 'Não'}</p>
          </div>
        </div>

        {!permissions.canUpdate ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Seu perfil possui acesso de leitura, mas não pode alterar este handoff operacional.
          </div>
        ) : null}

        {feedback.kind === 'success' ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {feedback.message}
          </div>
        ) : null}

        {feedback.kind === 'error' ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {feedback.message}
          </div>
        ) : null}

        {feedback.kind === 'info' ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {feedback.message}
          </div>
        ) : null}

        {handoff.status === 'EM_PLANEJAMENTO' ? (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Este handoff já foi aceito pela operação e está em organização pré-execução. Nenhuma OS, contrato ou execução foi iniciada nesta etapa.
          </div>
        ) : null}

        {aceiteEmPreparacao.targetingAceite ? (
          <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <p className="font-medium">Aceite operacional</p>
            <p className="mt-1">
              Avançar para preparação confirma o aceite operacional deste handoff.
            </p>
            {aceiteEmPreparacao.blockingMessage ? (
              <p className="mt-2 font-medium text-amber-900">{aceiteEmPreparacao.blockingMessage}</p>
            ) : (
              <p className="mt-2 text-sky-800">
                O handoff está pronto para ser aceito pela operação e seguir para organização pré-execução.
              </p>
            )}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium text-slate-900">
                Status do handoff
              </label>
              <select
                id="status"
                value={formState.status}
                onChange={(event) =>
                  updateFormField('status', event.target.value as StatusHandoffComercial)
                }
                disabled={!permissions.canUpdate || isSaving}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_HANDOFF_LABELS[status]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                A lista respeita as transições permitidas pela API para o status atual.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="responsavelOperacionalId" className="text-sm font-medium text-slate-900">
                Responsável operacional
              </label>
              <select
                id="responsavelOperacionalId"
                value={formState.responsavelOperacionalId}
                onChange={(event) => updateFormField('responsavelOperacionalId', event.target.value)}
                disabled={!permissions.canManageSensitive || isSaving || usuariosLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!handoff.responsavelOperacionalId ? (
                  <option value="">Selecione um responsável</option>
                ) : null}
                {responsavelOptions.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                    {usuario.email ? ` • ${usuario.email}` : ''}
                    {usuario.perfil ? ` • ${formatPerfilLabel(usuario.perfil)}` : ''}
                  </option>
                ))}
              </select>
              {usuariosError ? (
                <p className="text-xs text-red-600">{usuariosError}</p>
              ) : permissions.canManageSensitive ? (
                <p className="text-xs text-slate-500">
                  A primeira atribuição preenche automaticamente o marco de assunção do handoff.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Apenas Coordenador ou superior pode atribuir responsável operacional.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pendenciasOperacionais" className="text-sm font-medium text-slate-900">
              Pendências operacionais
            </label>
            <textarea
              id="pendenciasOperacionais"
              value={formState.pendenciasText}
              onChange={(event) => updateFormField('pendenciasText', event.target.value)}
              disabled={!permissions.canUpdate || isSaving}
              rows={5}
              placeholder="Uma pendência por linha"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="text-xs text-slate-500">
              Cada linha será salva como uma pendência independente no handoff.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="observacoesOperacionais" className="text-sm font-medium text-slate-900">
              Observações operacionais da triagem e condução
            </label>
            <textarea
              id="observacoesOperacionais"
              value={formState.observacoesOperacionais}
              onChange={(event) => updateFormField('observacoesOperacionais', event.target.value)}
              disabled={!permissions.canUpdate || isSaving}
              rows={5}
              placeholder="Contexto operacional, premissas e combinados internos"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="text-xs text-slate-500">
              Use este campo para registrar contexto geral da triagem, pendências, alinhamentos internos
              e combinados da condução operacional. Para organização da pré-execução, use o campo de
              planejamento abaixo.
            </p>
          </div>

          {exibirCamposPreparacao ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Preparação operacional persistida
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Dados mínimos da organização pré-execução
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Estes campos registram a preparação inicial do handoff aceito. Eles organizam a
                  pré-execução e não criam OS, contrato, financeiro, CRM ou execução iniciada.
                </p>
                {preparacaoPersistida && handoff.status !== 'EM_PLANEJAMENTO' ? (
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Este handoff já possui preparação operacional registrada. Os valores abaixo permanecem
                    visíveis para consulta e ajuste, mesmo fora do status de planejamento.
                  </p>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="prioridadeOperacional" className="text-sm font-medium text-slate-900">
                    Prioridade da preparação operacional
                  </label>
                  <select
                    id="prioridadeOperacional"
                    value={formState.prioridadeOperacional}
                    onChange={(event) =>
                      updateFormField(
                        'prioridadeOperacional',
                        event.target.value as PrioridadeOperacionalHandoff | '',
                      )
                    }
                    disabled={!permissions.canUpdate || isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">A definir</option>
                    {PRIORIDADE_OPERACIONAL_OPTIONS.map((prioridade) => (
                      <option key={prioridade} value={prioridade}>
                        {PRIORIDADE_OPERACIONAL_LABELS[prioridade]}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Use esta prioridade para ordenar a preparação operacional deste handoff. Ela não
                    representa OS criada nem execução iniciada.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="necessidadeDocumentos" className="text-sm font-medium text-slate-900">
                    Necessidade de documentos
                  </label>
                  <select
                    id="necessidadeDocumentos"
                    value={formState.necessidadeDocumentos}
                    onChange={(event) =>
                      updateFormField(
                        'necessidadeDocumentos',
                        event.target.value as 'true' | 'false' | '',
                      )
                    }
                    disabled={!permissions.canUpdate || isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">A confirmar</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                  <p className="text-xs text-slate-500">
                    Indique se a operação ainda depende de documentação complementar para organizar a
                    próxima etapa deste handoff.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="necessidadeVisita" className="text-sm font-medium text-slate-900">
                    Necessidade de visita
                  </label>
                  <select
                    id="necessidadeVisita"
                    value={formState.necessidadeVisita}
                    onChange={(event) =>
                      updateFormField('necessidadeVisita', event.target.value as 'true' | 'false' | '')
                    }
                    disabled={!permissions.canUpdate || isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">A confirmar</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                  <p className="text-xs text-slate-500">
                    Indique se uma visita técnica prévia é necessária para viabilizar a preparação
                    operacional antes da execução.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="necessidadeTerceiro" className="text-sm font-medium text-slate-900">
                    Necessidade de terceiro
                  </label>
                  <select
                    id="necessidadeTerceiro"
                    value={formState.necessidadeTerceiro}
                    onChange={(event) =>
                      updateFormField('necessidadeTerceiro', event.target.value as 'true' | 'false' | '')
                    }
                    disabled={!permissions.canUpdate || isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">A confirmar</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                  <p className="text-xs text-slate-500">
                    Indique se a preparação depende de terceiro antes de a operação conseguir estruturar o
                    próximo passo.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <label htmlFor="observacoesPlanejamento" className="text-sm font-medium text-slate-900">
                  Observações da preparação pré-execução
                </label>
                <textarea
                  id="observacoesPlanejamento"
                  value={formState.observacoesPlanejamento}
                  onChange={(event) => updateFormField('observacoesPlanejamento', event.target.value)}
                  disabled={!permissions.canUpdate || isSaving}
                  rows={4}
                  placeholder="Roteiro de organização, premissas internas e observações da pré-execução"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="text-xs text-slate-500">
                  Use este campo para registrar o roteiro inicial da organização pré-execução após o
                  aceite. Evite repetir aqui anotações gerais da triagem operacional.
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!permissions.canUpdate || isSaving || Boolean(aceiteEmPreparacao.blockingMessage)}
              className="inline-flex items-center justify-center rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Salvando...' : 'Salvar atualização operacional'}
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Restaurar dados atuais
            </button>
          </div>
        </form>
      </section>

      {planejamentoPosAceite?.isPlanejamento ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Aceite operacional concluído
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Handoff aceito e em organização pré-execução
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                  A operação já assumiu este handoff e agora organiza a preparação inicial. Esta etapa
                  ainda não representa OS criada, contrato criado ou execução iniciada.
                </p>
              </div>
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800">
                {STATUS_HANDOFF_LABELS[handoff.status]}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-emerald-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Responsável operacional
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {responsavelOperacionalAtualLabel}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {planejamentoPosAceite.responsavelDefinido
                    ? 'Coordenação operacional já atribuída para esta etapa.'
                    : 'A definir antes de qualquer avanço operacional.'}
                </p>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Pendências bloqueantes
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {planejamentoPosAceite.pendenciasResolvidas ? 'Resolvidas' : 'Em aberto'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {planejamentoPosAceite.pendenciasResolvidas
                    ? 'O aceite foi mantido sem pendências bloqueantes abertas.'
                    : 'Ainda existem itens operacionais que pedem organização interna.'}
                </p>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Marco de assunção
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {formatDateTime(handoff.assumidoEm)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Data em que a coordenação operacional passou a assumir o handoff.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
                Preparação operacional inicial
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Organização interna desta pré-execução
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Este bloco reaproveita apenas dados já existentes no handoff para orientar a preparação
                inicial da equipe.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Observações de planejamento
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {renderText(handoff.observacoesPlanejamento) === '—'
                      ? 'A definir'
                      : handoff.observacoesPlanejamento}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Base de risco e atenção
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <p>
                      <strong>Risco-base:</strong>{' '}
                      {renderMappedLabel(handoff.riscoNivel, RISCO_NIVEL_LABELS)}
                    </p>
                    <p>
                      <strong>Score:</strong> {handoff.riscoScore ?? 'Não informado'}
                    </p>
                    <p>
                      <strong>Potencial poluidor:</strong>{' '}
                      {renderMappedLabel(handoff.potencialPoluidor, POTENCIAL_POLUIDOR_LABELS)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Sinalizadores persistidos desta preparação
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <p>
                      <strong>Prioridade da preparação:</strong>{' '}
                      {renderMappedLabel(handoff.prioridadeOperacional, PRIORIDADE_OPERACIONAL_LABELS)}
                    </p>
                    <p>
                      <strong>Necessidade de documentos:</strong>{' '}
                      {renderNullableBooleanLabel(handoff.necessidadeDocumentos)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Coordenação e itens futuros
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <p>
                      <strong>Necessidade de visita:</strong>{' '}
                      {renderNullableBooleanLabel(handoff.necessidadeVisita)}
                    </p>
                    <p>
                      <strong>Necessidade de terceiro:</strong>{' '}
                      {renderNullableBooleanLabel(handoff.necessidadeTerceiro)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                Prontidão operacional
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Leitura informativa de prontidão parcial
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Esta leitura é apenas informativa e derivada do payload atual. Ela não cria workflow novo
                nem indica OS, contrato ou execução iniciada.
              </p>

              <div className="mt-5 grid gap-3">
                {planejamentoPosAceite.prontidaoItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className={`text-sm font-medium ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
                Próximos passos orientativos
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Referências iniciais para planejamento
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Os itens abaixo vêm do resumo atual do handoff e devem ser lidos como orientação inicial de
                planejamento, não como checklist operacional persistido.
              </p>

              {handoff.proximosPassosResumo.length > 0 ? (
                <ol className="mt-4 space-y-2 text-sm text-slate-700">
                  {handoff.proximosPassosResumo.map((passo, index) => (
                    <li
                      key={`${handoff.id}-planejamento-passo-${index}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <span className="font-semibold text-slate-900">{index + 1}.</span> {passo}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  A definir. Ainda não há próximos passos resumidos disponíveis no payload atual.
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
                Responsabilidade e coordenação
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Quem conduz esta preparação
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Este bloco concentra ownership, repasse comercial e contexto interno já disponível para a
                coordenação da pré-execução.
              </p>

              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="grid gap-3 md:grid-cols-2">
                  <p><strong>Responsável comercial:</strong> {responsavelComercialAtualLabel}</p>
                  <p><strong>Responsável operacional:</strong> {responsavelOperacionalAtualLabel}</p>
                  <p><strong>Coordenação de apoio:</strong> A definir</p>
                  <p><strong>Marco de assunção:</strong> {formatDateTime(handoff.assumidoEm)}</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-900">Pendências internas</p>
                  {handoff.pendenciasOperacionais.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {handoff.pendenciasOperacionais.map((pendencia, index) => (
                        <li key={`${handoff.id}-planejamento-pendencia-${index}`}>{pendencia}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-slate-500">
                      Nenhuma pendência operacional registrada para esta etapa.
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-slate-900">Observações gerais da condução</p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">
                    {renderText(handoff.observacoesOperacionais) === '—'
                      ? 'Não informado'
                      : handoff.observacoesOperacionais}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Contexto da proposta</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <p><strong>Número da proposta:</strong> {handoff.numeroProposta}</p>
            <p><strong>Status comercial:</strong> {renderMappedLabel(handoff.statusPropostaOrigem, STATUS_PROPOSTA_ORIGEM_LABELS)}</p>
            <p><strong>Origem do handoff:</strong> {renderMappedLabel(handoff.origemProposta, ORIGEM_PROPOSTA_LABELS)}</p>
            <p><strong>Aprovação:</strong> {formatDate(handoff.dataAprovacaoProposta)}</p>
            <p><strong>Validade:</strong> {formatDate(handoff.dataValidadeProposta)}</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Contexto de contato</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <p><strong>Lead:</strong> {renderText(handoff.nomeLead)}</p>
            <p><strong>Empresa:</strong> {renderText(handoff.empresaLead)}</p>
            <p><strong>Documento:</strong> {renderText(handoff.documentoLead)}</p>
            <p><strong>E-mail:</strong> {renderText(handoff.emailContato)}</p>
            <p><strong>Telefone:</strong> {renderText(handoff.telefoneContato)}</p>
            <p><strong>Município/UF:</strong> {handoff.municipio ? `${handoff.municipio}/${handoff.uf}` : renderText(handoff.uf)}</p>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Contexto técnico resumido</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 text-sm text-slate-700">
            <p><strong>CNAE principal:</strong> {renderText(handoff.cnaePrincipalCodigo)} {handoff.cnaePrincipalDescricao ? `- ${handoff.cnaePrincipalDescricao}` : ''}</p>
            <p><strong>Risco:</strong> {renderMappedLabel(handoff.riscoNivel, RISCO_NIVEL_LABELS)}</p>
            <p><strong>Score:</strong> {handoff.riscoScore ?? '—'}</p>
            <p><strong>Potencial poluidor:</strong> {renderMappedLabel(handoff.potencialPoluidor, POTENCIAL_POLUIDOR_LABELS)}</p>
            <p><strong>Licenciamento:</strong> {renderText(handoff.licenciamentoTipo)}</p>
            <p><strong>Órgão competente:</strong> {renderText(handoff.orgaoCompetente)}</p>
            <p><strong>Esfera:</strong> {renderMappedLabel(handoff.esfera, ESFERA_LABELS)}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Alertas resumidos</p>
              {handoff.alertasResumo.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {handoff.alertasResumo.map((alerta, index) => (
                    <li key={`${handoff.id}-alerta-${index}`}>{alerta}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Nenhum alerta informado.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Próximos passos</p>
              {handoff.proximosPassosResumo.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {handoff.proximosPassosResumo.map((passo, index) => (
                    <li key={`${handoff.id}-passo-${index}`}>{passo}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Nenhum próximo passo informado.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Serviços aprovados</h2>
        {handoff.servicosResumo.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Nenhum serviço aprovado foi registrado neste handoff.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Serviço</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Categoria</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Quantidade</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Escopo aprovado</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Observação operacional</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {handoff.servicosResumo.map((servico, index) => (
                  <tr key={servico.itemId ?? `${handoff.id}-servico-${index}`} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{servico.nome}</td>
                    <td className="px-4 py-3 text-slate-700">{renderText(servico.categoria)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {servico.quantidade ?? '—'}{servico.unidade ? ` ${servico.unidade}` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{renderText(servico.escopoAprovado)}</td>
                    <td className="px-4 py-3 text-slate-700">{renderText(servico.observacaoOperacional)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {!planejamentoPosAceite?.isPlanejamento ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Bloco operacional</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p><strong>Responsável comercial:</strong> {responsavelComercialAtualLabel}</p>
              <p><strong>Responsável operacional:</strong> {responsavelOperacionalAtualLabel}</p>
              <div>
                <p className="font-semibold text-slate-900">Pendências operacionais</p>
                {handoff.pendenciasOperacionais.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {handoff.pendenciasOperacionais.map((pendencia, index) => (
                      <li key={`${handoff.id}-pendencia-${index}`}>{pendencia}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-slate-500">Nenhuma pendência operacional registrada.</p>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900">Observações gerais da triagem e condução</p>
                <p className="mt-2 whitespace-pre-wrap text-slate-700">
                  {renderText(handoff.observacoesOperacionais)}
                </p>
              </div>

              {preparacaoPersistida ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                  <p className="font-semibold text-emerald-900">Preparação operacional já registrada</p>
                  <p className="mt-1 text-sm text-emerald-900">
                    Mesmo fora do status de planejamento, este handoff já possui dados persistidos da
                    preparação pré-execução.
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    <p>
                      <strong>Observações da preparação:</strong>{' '}
                      {renderText(handoff.observacoesPlanejamento)}
                    </p>
                    <p>
                      <strong>Prioridade da preparação:</strong>{' '}
                      {renderMappedLabel(handoff.prioridadeOperacional, PRIORIDADE_OPERACIONAL_LABELS)}
                    </p>
                    <p>
                      <strong>Necessidade de documentos:</strong>{' '}
                      {renderNullableBooleanLabel(handoff.necessidadeDocumentos)}
                    </p>
                    <p>
                      <strong>Necessidade de visita:</strong>{' '}
                      {renderNullableBooleanLabel(handoff.necessidadeVisita)}
                    </p>
                    <p>
                      <strong>Necessidade de terceiro:</strong>{' '}
                      {renderNullableBooleanLabel(handoff.necessidadeTerceiro)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Datas e marcos temporais</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <p><strong>Criado em:</strong> {formatDateTime(handoff.criadoEm)}</p>
            <p><strong>Atualizado em:</strong> {formatDateTime(handoff.atualizadoEm)}</p>
            <p><strong>Assumido em:</strong> {formatDateTime(handoff.assumidoEm)}</p>
            <p><strong>Concluído em:</strong> {formatDateTime(handoff.concluidoEm)}</p>
            <p><strong>Cancelado em:</strong> {formatDateTime(handoff.canceladoEm)}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
