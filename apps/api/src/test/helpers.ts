import { expect } from 'vitest'
import type { FastifyInstance, InjectOptions } from 'fastify'
import { prisma } from '../infra/database/prisma.js'

export type TestApp = FastifyInstance

type TestRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  payload?: Record<string, unknown>
}

type TestResponse = {
  statusCode: number
  body: string
  headers: Record<string, string | number | string[] | undefined>
  json: () => unknown
}

export function buildPropostaPayload(overrides?: Record<string, unknown>) {
  return {
    contato: {
      nome: 'Posto Alpha',
      empresa: 'Rede Alpha',
      email: 'comercial@redealpha.com.br',
      telefone: '62999998888',
    },
    diagnostico: {
      cnaes: ['4731-8/00'],
      uf: 'SP',
      municipio: 'Campinas',
      porte: 'MEDIO',
      situacao: 'IRREGULAR',
      temOutorgaAnterior: false,
    },
    itens: [
      { codigo: 'LIC-004', quantidade: 1 },
      { codigo: 'LIC-008', quantidade: 1 },
      { codigo: 'LIC-011', quantidade: 1 },
    ],
    observacoesComerciais: 'Proposta para teste automatizado.',
    ...overrides,
  }
}

export async function loginDemo(app: TestApp, email = 'admin@postodemo.com.br'): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    headers: { 'content-type': 'application/json' },
    payload: {
      email,
      senha: 'Demo@1234',
    },
  })

  expect(response.statusCode).toBe(200)

  const body = response.json() as { data?: { accessToken?: string } }
  const token = body.data?.accessToken

  expect(token).toBeTruthy()
  return token as string
}

export async function authedRequest(
  app: TestApp,
  token: string,
  request: TestRequest,
): Promise<TestResponse> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
  }

  if (request.payload) {
    headers['content-type'] = 'application/json'
  }

  return app.inject({
    ...(request as InjectOptions),
    headers,
  })
}

export async function createApprovedProposal(
  app: TestApp,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
  payloadOverrides?: Record<string, unknown>,
) {
  const created = await authedRequest(app, token, {
    method: 'POST',
    url: '/api/v1/comercial/propostas',
    payload: buildPropostaPayload(payloadOverrides),
  })

  expect(created.statusCode).toBe(201)
  const body = created.json() as { data: { id: string; diagnostico: { id: string } } }
  propostaIds.push(body.data.id)
  diagnosticoIds.push(body.data.diagnostico.id)

  for (const status of ['PRONTA', 'ENVIADA', 'APROVADA'] as const) {
    const response = await authedRequest(app, token, {
      method: 'PATCH',
      url: `/api/v1/comercial/propostas/${body.data.id}`,
      payload: { status },
    })
    expect(response.statusCode).toBe(200)
  }

  return body.data
}

export async function createHandoffFixture(
  app: TestApp,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
  handoffIds: string[],
  payloadOverrides?: Record<string, unknown>,
) {
  const proposta = await createApprovedProposal(app, token, propostaIds, diagnosticoIds, payloadOverrides)

  const response = await authedRequest(app, token, {
    method: 'POST',
    url: `/api/v1/comercial/propostas/${proposta.id}/handoff`,
  })

  expect(response.statusCode).toBe(201)
  const body = response.json() as { data: { id: string; propostaComercialId: string; empreendimentoId: string | null } }
  handoffIds.push(body.data.id)
  return body.data
}

export async function createContratoFixture(
  app: TestApp,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
  handoffIds: string[],
  contratoIds: string[],
  options: { ativar: boolean; objeto?: string },
) {
  const handoff = await createHandoffFixture(app, token, propostaIds, diagnosticoIds, handoffIds)

  if (!handoff.empreendimentoId) {
    const empreendimento = await prisma.empreendimento.findFirst({
      where: { tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47' },
      select: { id: true },
    })
    if (empreendimento) {
      await prisma.handoffComercial.update({
        where: { id: handoff.id },
        data: { empreendimentoId: empreendimento.id },
      })
    }
  }

  const create = await authedRequest(app, token, {
    method: 'POST',
    url: '/api/v1/comercial/contratos',
    payload: {
      handoffComercialId: handoff.id,
      objeto: options.objeto ?? 'Contrato para teste automatizado.',
      dataInicioVigencia: '2026-06-01',
      diaVencimento: 10,
    },
  })

  expect(create.statusCode).toBe(201)
  const body = create.json() as { data: { id: string } }
  contratoIds.push(body.data.id)

  if (options.ativar) {
    const ativar = await authedRequest(app, token, {
      method: 'PATCH',
      url: `/api/v1/comercial/contratos/${body.data.id}`,
      payload: { status: 'ATIVO' },
    })
    expect(ativar.statusCode).toBe(200)
  }

  return body.data
}

export async function createOSFixture(
  app: TestApp,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
  handoffIds: string[],
  contratoIds: string[],
  osIds: string[],
) {
  const contrato = await createContratoFixture(
    app,
    token,
    propostaIds,
    diagnosticoIds,
    handoffIds,
    contratoIds,
    { ativar: true },
  )

  const response = await authedRequest(app, token, {
    method: 'POST',
    url: '/api/v1/operacao/ordens-servico',
    payload: {
      contratoId: contrato.id,
      tipo: 'VISTORIA_TECNICA',
      titulo: 'Vistoria',
      escopo: 'Escopo teste',
      dataPlanejada: '2026-07-01',
    },
  })

  expect(response.statusCode).toBe(201)
  const body = response.json() as { data: { id: string } }
  osIds.push(body.data.id)
  return body.data
}

export async function getAdminUserId(app: TestApp, token: string): Promise<string> {
  const response = await authedRequest(app, token, {
    method: 'GET',
    url: '/api/v1/auth/me',
  })
  expect(response.statusCode).toBe(200)
  const body = response.json() as { data: { id: string } }
  return body.data.id
}
