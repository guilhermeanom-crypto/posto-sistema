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

interface SessaoUsuario {
  id: string
  nome: string
  email: string
  perfil: string
  tenantId: string
}

type ApiHandoffResumo = {
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
  prioridadeOperacional: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | null
  necessidadeDocumentos: boolean | null
  necessidadeVisita: boolean | null
  necessidadeTerceiro: boolean | null
  criadoEm: string
  atualizadoEm: string
}

function sanitizeHandoffResumo(handoff: ApiHandoffResumo) {
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
    prioridadeOperacional: handoff.prioridadeOperacional,
    necessidadeDocumentos: handoff.necessidadeDocumentos,
    necessidadeVisita: handoff.necessidadeVisita,
    necessidadeTerceiro: handoff.necessidadeTerceiro,
    criadoEm: handoff.criadoEm,
    atualizadoEm: handoff.atualizadoEm,
  }
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

export async function GET(request: NextRequest) {
  const token = await getToken()

  if (!token) {
    return NextResponse.json(
      { error: 'Sua sessão expirou. Faça login novamente para consultar os handoffs operacionais.' },
      { status: 401 },
    )
  }

  const sessao = await getSessao(token)
  if (!sessao) {
    return NextResponse.json(
      { error: 'Sua sessão expirou. Faça login novamente para consultar os handoffs operacionais.' },
      { status: 401 },
    )
  }

  if (!PERFIS_LEITURA_HANDOFF.includes(sessao.perfil as (typeof PERFIS_LEITURA_HANDOFF)[number])) {
    return NextResponse.json(
      { error: 'Seu perfil não possui permissão para consultar handoffs operacionais.' },
      { status: 403 },
    )
  }

  const search = request.nextUrl.searchParams.toString()
  const url = `${buildApiUrl('/operacao/handoffs')}${search ? `?${search}` : ''}`

  try {
    const response = await fetch(url, {
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
        'Não foi possível carregar os handoffs operacionais no momento.'

      return NextResponse.json({ error: message }, { status: response.status })
    }

    return NextResponse.json(
      {
        data: Array.isArray(body?.data) ? body.data.map(sanitizeHandoffResumo) : [],
        pagination: body?.pagination ?? null,
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível carregar os handoffs operacionais no momento.' },
      { status: 500 },
    )
  }
}
