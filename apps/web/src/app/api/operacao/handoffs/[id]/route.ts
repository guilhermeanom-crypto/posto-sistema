import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { buildApiUrl } from '@/lib/api-base'

const PERFIS_LEITURA_HANDOFF = [
  'EXECUTIVO',
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

const PERFIS_ATUALIZACAO_HANDOFF = [
  'COORDENADOR',
  'ANALISTA',
  'ANALISTA_CAMPO',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

const PERFIS_SENSIVEIS_HANDOFF = [
  'COORDENADOR',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

interface SessaoUsuario {
  id: string
  nome: string
  email: string
  perfil: string
  tenantId: string
}

type ApiServicoResumo = {
  itemId?: string
  nome: string
  categoria?: string
  quantidade?: number
  unidade?: string
  escopoAprovado?: string
  observacaoOperacional?: string
}

type ApiHandoffDetalhe = {
  id: string
  propostaComercialId: string
  leadWhatsAppId: string | null
  empreendimentoId: string | null
  responsavelComercialId: string
  responsavelOperacionalId: string | null
  status: string
  statusPropostaOrigem: 'APROVADA'
  origemProposta: 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL'
  numeroProposta: string
  nomeLead: string | null
  empresaLead: string | null
  municipio: string | null
  uf: string | null
  cnaePrincipalCodigo: string | null
  cnaePrincipalDescricao: string | null
  riscoNivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' | null
  potencialPoluidor: 'BAIXO' | 'MEDIO' | 'ALTO' | null
  criadoEm: string
  atualizadoEm: string
  documentoLead: string | null
  emailContato: string | null
  telefoneContato: string | null
  dataAprovacaoProposta: string | null
  dataValidadeProposta: string | null
  riscoScore: number | null
  licenciamentoTipo: string | null
  orgaoCompetente: string | null
  esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | null
  alertasResumo: string[]
  proximosPassosResumo: string[]
  observacoesLiberadas: string | null
  servicosResumo: ApiServicoResumo[]
  pendenciasOperacionais: string[]
  observacoesOperacionais: string | null
  observacoesPlanejamento: string | null
  prioridadeOperacional: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | null
  necessidadeDocumentos: boolean | null
  necessidadeVisita: boolean | null
  necessidadeTerceiro: boolean | null
  assumidoEm: string | null
  concluidoEm: string | null
  canceladoEm: string | null
}

function sanitizeServicoResumo(servico: ApiServicoResumo) {
  return {
    itemId: servico.itemId,
    nome: servico.nome,
    categoria: servico.categoria,
    quantidade: servico.quantidade,
    unidade: servico.unidade,
    escopoAprovado: servico.escopoAprovado,
    observacaoOperacional: servico.observacaoOperacional,
  }
}

function sanitizeHandoffDetalhe(handoff: ApiHandoffDetalhe) {
  return {
    id: handoff.id,
    propostaComercialId: handoff.propostaComercialId,
    leadWhatsAppId: handoff.leadWhatsAppId,
    empreendimentoId: handoff.empreendimentoId,
    responsavelComercialId: handoff.responsavelComercialId,
    responsavelOperacionalId: handoff.responsavelOperacionalId,
    status: handoff.status,
    statusPropostaOrigem: handoff.statusPropostaOrigem,
    origemProposta: handoff.origemProposta,
    numeroProposta: handoff.numeroProposta,
    nomeLead: handoff.nomeLead,
    empresaLead: handoff.empresaLead,
    municipio: handoff.municipio,
    uf: handoff.uf,
    cnaePrincipalCodigo: handoff.cnaePrincipalCodigo,
    cnaePrincipalDescricao: handoff.cnaePrincipalDescricao,
    riscoNivel: handoff.riscoNivel,
    potencialPoluidor: handoff.potencialPoluidor,
    criadoEm: handoff.criadoEm,
    atualizadoEm: handoff.atualizadoEm,
    documentoLead: handoff.documentoLead,
    emailContato: handoff.emailContato,
    telefoneContato: handoff.telefoneContato,
    dataAprovacaoProposta: handoff.dataAprovacaoProposta,
    dataValidadeProposta: handoff.dataValidadeProposta,
    riscoScore: handoff.riscoScore,
    licenciamentoTipo: handoff.licenciamentoTipo,
    orgaoCompetente: handoff.orgaoCompetente,
    esfera: handoff.esfera,
    alertasResumo: handoff.alertasResumo,
    proximosPassosResumo: handoff.proximosPassosResumo,
    observacoesLiberadas: handoff.observacoesLiberadas,
    servicosResumo: Array.isArray(handoff.servicosResumo)
      ? handoff.servicosResumo.map(sanitizeServicoResumo)
      : [],
    pendenciasOperacionais: Array.isArray(handoff.pendenciasOperacionais)
      ? handoff.pendenciasOperacionais
      : [],
    observacoesOperacionais: handoff.observacoesOperacionais,
    observacoesPlanejamento: handoff.observacoesPlanejamento,
    prioridadeOperacional: handoff.prioridadeOperacional,
    necessidadeDocumentos: handoff.necessidadeDocumentos,
    necessidadeVisita: handoff.necessidadeVisita,
    necessidadeTerceiro: handoff.necessidadeTerceiro,
    assumidoEm: handoff.assumidoEm,
    concluidoEm: handoff.concluidoEm,
    canceladoEm: handoff.canceladoEm,
  }
}

interface Props {
  params: Promise<{ id: string }>
}

async function getToken() {
  const cookieStore = await cookies()
  return cookieStore.get('posto_access')?.value
}

async function getSessao(token: string): Promise<SessaoUsuario | null> {
  try {
    const response = await fetch(buildApiUrl('/auth/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) return null
    const body = (await response.json()) as { data: SessaoUsuario }
    return body.data
  } catch {
    return null
  }
}

function buildPermissions(sessao: SessaoUsuario) {
  return {
    perfil: sessao.perfil,
    canRead: PERFIS_LEITURA_HANDOFF.includes(sessao.perfil as (typeof PERFIS_LEITURA_HANDOFF)[number]),
    canUpdate: PERFIS_ATUALIZACAO_HANDOFF.includes(sessao.perfil as (typeof PERFIS_ATUALIZACAO_HANDOFF)[number]),
    canManageSensitive: PERFIS_SENSIVEIS_HANDOFF.includes(
      sessao.perfil as (typeof PERFIS_SENSIVEIS_HANDOFF)[number],
    ),
  }
}

export async function GET(_request: NextRequest, { params }: Props) {
  const { id } = await params
  const token = await getToken()

  if (!token) {
    return NextResponse.json(
      { error: 'Sua sessão expirou. Faça login novamente para consultar o handoff operacional.' },
      { status: 401 },
    )
  }

  const sessao = await getSessao(token)
  if (!sessao) {
    return NextResponse.json(
      { error: 'Sua sessão expirou. Faça login novamente para consultar o handoff operacional.' },
      { status: 401 },
    )
  }

  const permissions = buildPermissions(sessao)
  if (!permissions.canRead) {
    return NextResponse.json(
      { error: 'Seu perfil não possui permissão para consultar este handoff operacional.' },
      { status: 403 },
    )
  }

  try {
    const response = await fetch(buildApiUrl(`/operacao/handoffs/${id}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        body?.error?.message ??
        body?.message ??
        'Não foi possível carregar o handoff operacional no momento.'

      return NextResponse.json({ error: message }, { status: response.status })
    }

    return NextResponse.json(
      {
        data: sanitizeHandoffDetalhe(body.data as ApiHandoffDetalhe),
        permissions,
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível carregar o handoff operacional no momento.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params
  const token = await getToken()

  if (!token) {
    return NextResponse.json(
      { error: 'Sua sessão expirou. Faça login novamente para atualizar o handoff operacional.' },
      { status: 401 },
    )
  }

  const sessao = await getSessao(token)
  if (!sessao) {
    return NextResponse.json(
      { error: 'Sua sessão expirou. Faça login novamente para atualizar o handoff operacional.' },
      { status: 401 },
    )
  }

  const permissions = buildPermissions(sessao)
  if (!permissions.canUpdate) {
    return NextResponse.json(
      { error: 'Seu perfil não possui permissão para atualizar este handoff operacional.' },
      { status: 403 },
    )
  }

  try {
    const payload = await request.json()

    if (
      payload?.status === 'EM_PLANEJAMENTO' &&
      !permissions.canUpdate
    ) {
      return NextResponse.json(
        { error: 'Seu perfil não possui permissão para aceitar este handoff operacional.' },
        { status: 403 },
      )
    }

    const response = await fetch(buildApiUrl(`/operacao/handoffs/${id}`), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      let message =
        body?.error?.message ??
        body?.message ??
        'Não foi possível atualizar o handoff operacional no momento.'

      if (payload?.status === 'EM_PLANEJAMENTO' && response.status === 403) {
        message = 'Seu perfil não possui permissão para aceitar este handoff operacional.'
      }

      return NextResponse.json({ error: message, code: body?.error?.code ?? null }, { status: response.status })
    }

    return NextResponse.json({ data: sanitizeHandoffDetalhe(body.data as ApiHandoffDetalhe) }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível atualizar o handoff operacional no momento.' },
      { status: 500 },
    )
  }
}
