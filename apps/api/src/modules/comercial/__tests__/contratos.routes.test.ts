import { afterAll, beforeAll, expect, it, vi } from 'vitest'

const testDoubles = vi.hoisted(() => {
  const redisStore = new Map<string, string>()
  const queueAdd = vi.fn().mockResolvedValue({ id: 'mock-job-id' })
  const queueClose = vi.fn().mockResolvedValue(undefined)

  class QueueMock {
    add = queueAdd
    close = queueClose
  }

  return {
    QueueMock,
    redisMock: {
      on: vi.fn().mockReturnThis(),
      ping: vi.fn().mockResolvedValue('PONG'),
      quit: vi.fn().mockResolvedValue('OK'),
      get: vi.fn(async (key: string) => redisStore.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        redisStore.set(key, value)
        return 'OK'
      }),
      del: vi.fn(async (...keys: string[]) => {
        let removidos = 0
        for (const key of keys) {
          if (redisStore.delete(key)) removidos += 1
        }
        return removidos
      }),
      exists: vi.fn(async (...keys: string[]) => keys.filter((key) => redisStore.has(key)).length),
      expire: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(-1),
    },
  }
})

vi.mock('bullmq', () => ({ Queue: testDoubles.QueueMock }))

vi.mock('../../../infra/cache/redis.js', () => ({
  redis: testDoubles.redisMock,
  REDIS_KEYS: {
    session: (tokenHash: string) => `session:${tokenHash}`,
    complianceCache: (tenantId: string, empreendimentoId: string) =>
      `cache:${tenantId}:compliance:${empreendimentoId}`,
    dashboardCache: (tenantId: string, key: string) => `cache:${tenantId}:dashboard:${key}`,
    magicLink: (token: string) => `magic_link:${token}`,
    loginAttempts: (email: string) => `login_attempts:${email}`,
  },
}))

import { buildApp } from '../../../app.js'
import { prisma } from '../../../infra/database/prisma.js'
import { assertIntegrationDatabaseAvailable, describeIntegration } from '../../../test/integration.js'
import { authedRequest, loginDemo } from '../../../test/helpers.js'

type AppInstance = Awaited<ReturnType<typeof buildApp>>

describeIntegration('API de contratos comerciais', () => {
  let app: AppInstance
  let accessToken: string
  const propostaIds: string[] = []
  const diagnosticoIds: string[] = []
  const handoffIds: string[] = []
  const contratoIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    accessToken = await loginDemo(app)
  })

  afterAll(async () => {
    if (contratoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM contratos WHERE id = ANY($1::text[])`,
        contratoIds,
      )
    }
    if (handoffIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM handoffs_comerciais WHERE id = ANY($1::text[])`,
        handoffIds,
      )
    }
    if (propostaIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM propostas_comerciais WHERE id = ANY($1::text[])`,
        propostaIds,
      )
    }
    if (diagnosticoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM diagnosticos_comerciais WHERE id = ANY($1::text[])`,
        diagnosticoIds,
      )
    }

    await app?.close()
    await prisma.$disconnect()
  })

  it('bloqueia listagem sem JWT', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/comercial/contratos',
    })
    expect(response.statusCode).toBe(401)
  })

  it('cria contrato a partir de handoff válido e congela snapshot dos itens', async () => {
    const handoff = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)

    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/contratos',
      payload: {
        handoffComercialId: handoff.id,
        objeto: 'Gestão regulatória contínua do empreendimento.',
        dataInicioVigencia: '2026-06-01',
        diaVencimento: 10,
        observacoesContratuais: 'Vigência inicial de 12 meses.',
      },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json() as { data: { id: string; numero: string; status: string; valorMensal: number; itensSnapshot: Array<{ codigoServico: string; valorAplicadoLinha: number }> } }
    contratoIds.push(body.data.id)

    expect(body.data.status).toBe('RASCUNHO')
    expect(body.data.numero).toMatch(/^CT-\d{4}-[A-F0-9]{8}$/)
    expect(body.data.valorMensal).toBeGreaterThan(0)
    expect(body.data.itensSnapshot.length).toBeGreaterThan(0)
    expect(body.data.itensSnapshot[0]?.codigoServico).toBeTruthy()
  })

  it('bloqueia criação de segundo contrato vigente para o mesmo handoff', async () => {
    const handoff = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)

    const primeiro = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/contratos',
      payload: {
        handoffComercialId: handoff.id,
        objeto: 'Contrato inicial.',
        dataInicioVigencia: '2026-06-01',
        diaVencimento: 5,
      },
    })
    expect(primeiro.statusCode).toBe(201)
    contratoIds.push((primeiro.json() as { data: { id: string } }).data.id)

    const segundo = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/contratos',
      payload: {
        handoffComercialId: handoff.id,
        objeto: 'Tentativa de duplicidade.',
        dataInicioVigencia: '2026-07-01',
        diaVencimento: 5,
      },
    })

    expect(segundo.statusCode).toBe(409)
  })

  it('atualiza status com transição válida (RASCUNHO -> ATIVO)', async () => {
    const handoff = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)

    const criar = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/contratos',
      payload: {
        handoffComercialId: handoff.id,
        objeto: 'Contrato para ativação.',
        dataInicioVigencia: '2026-06-01',
        diaVencimento: 15,
      },
    })
    const contratoId = (criar.json() as { data: { id: string } }).data.id
    contratoIds.push(contratoId)

    const patch = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/comercial/contratos/${contratoId}`,
      payload: { status: 'ATIVO' },
    })

    expect(patch.statusCode).toBe(200)
    const body = patch.json() as { data: { status: string; ativadoEm: string | null } }
    expect(body.data.status).toBe('ATIVO')
    expect(body.data.ativadoEm).toBeTruthy()
  })

  it('recusa transição inválida (RASCUNHO -> ENCERRADO)', async () => {
    const handoff = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)

    const criar = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/contratos',
      payload: {
        handoffComercialId: handoff.id,
        objeto: 'Transição inválida.',
        dataInicioVigencia: '2026-06-01',
        diaVencimento: 20,
      },
    })
    const contratoId = (criar.json() as { data: { id: string } }).data.id
    contratoIds.push(contratoId)

    const patch = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/comercial/contratos/${contratoId}`,
      payload: { status: 'ENCERRADO' },
    })

    expect(patch.statusCode).toBe(403)
  })

  it('lista contratos do tenant e expõe KPIs', async () => {
    const lista = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/comercial/contratos?limit=50',
    })

    expect(lista.statusCode).toBe(200)
    const listaBody = lista.json() as { data: Array<{ id: string; status: string }>; pagination: { total: number } }
    expect(listaBody.pagination.total).toBeGreaterThanOrEqual(1)

    const kpis = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/comercial/contratos/kpis',
    })

    expect(kpis.statusCode).toBe(200)
    const kpisBody = kpis.json() as { data: { totalAtivos: number; totalCadastrados: number; mrr: number; moeda: string } }
    expect(kpisBody.data.totalCadastrados).toBeGreaterThanOrEqual(1)
    expect(kpisBody.data.moeda).toBe('BRL')
    expect(kpisBody.data.mrr).toBeGreaterThanOrEqual(0)
  })

  it('retorna 404 para contrato inexistente no tenant', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/comercial/contratos/11111111-1111-1111-1111-111111111111',
    })
    expect(response.statusCode).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (espelham padrão dos testes de handoffs)
// ─────────────────────────────────────────────────────────────────────────────

function buildPayload() {
  return {
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
    observacoesComerciais: 'Proposta para contrato.',
  }
}

async function createProposal(
  app: AppInstance,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
) {
  const response = await authedRequest(app, token, {
    method: 'POST',
    url: '/api/v1/comercial/propostas',
    payload: buildPayload(),
  })

  expect(response.statusCode).toBe(201)
  const body = response.json() as { data: { id: string; diagnostico: { id: string } } }
  propostaIds.push(body.data.id)
  diagnosticoIds.push(body.data.diagnostico.id)
  return body.data
}

async function createApprovedProposal(
  app: AppInstance,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
) {
  const proposta = await createProposal(app, token, propostaIds, diagnosticoIds)

  for (const status of ['PRONTA', 'ENVIADA', 'APROVADA'] as const) {
    const response = await authedRequest(app, token, {
      method: 'PATCH',
      url: `/api/v1/comercial/propostas/${proposta.id}`,
      payload: { status },
    })
    expect(response.statusCode).toBe(200)
  }
  return proposta
}

async function createHandoffFixture(
  app: AppInstance,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
  handoffIds: string[],
) {
  const proposta = await createApprovedProposal(app, token, propostaIds, diagnosticoIds)

  const response = await authedRequest(app, token, {
    method: 'POST',
    url: `/api/v1/comercial/propostas/${proposta.id}/handoff`,
  })

  expect(response.statusCode).toBe(201)
  const body = response.json() as { data: { id: string; propostaComercialId: string } }
  handoffIds.push(body.data.id)
  return body.data
}
