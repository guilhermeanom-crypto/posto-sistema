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
import { redis } from '../../../infra/cache/redis.js'
import { assertIntegrationDatabaseAvailable, describeIntegration } from '../../../test/integration.js'
import { authedRequest, createOSFixture, loginDemo } from '../../../test/helpers.js'

type AppInstance = Awaited<ReturnType<typeof buildApp>>

describeIntegration('API de entregáveis', () => {
  let app: AppInstance
  let accessToken: string
  const propostaIds: string[] = []
  const diagnosticoIds: string[] = []
  const handoffIds: string[] = []
  const contratoIds: string[] = []
  const osIds: string[] = []
  const entregavelIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    accessToken = await loginDemo(app)
  })

  afterAll(async () => {
    if (entregavelIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM entregaveis WHERE id = ANY($1::text[])`,
        entregavelIds,
      )
    }
    if (osIds.length > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM ordens_servico WHERE id = ANY($1::text[])`, osIds)
    }
    if (contratoIds.length > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM contratos WHERE id = ANY($1::text[])`, contratoIds)
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
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  })

  it('bloqueia listagem sem JWT', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/operacao/entregaveis',
    })
    expect(response.statusCode).toBe(401)
  })

  it('cria entregável a partir de OS existente', async () => {
    const os = await createOSFixture(
      app,
      accessToken,
      propostaIds,
      diagnosticoIds,
      handoffIds,
      contratoIds,
      osIds,
    )

    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/operacao/entregaveis',
      payload: {
        ordemServicoId: os.id,
        tipo: 'LAUDO',
        titulo: 'Laudo ambiental',
      },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: { id: string; numero: string; status: string; empreendimentoId: string }
    }
    entregavelIds.push(body.data.id)

    expect(body.data.numero).toMatch(/^ENT-\d{4}-[A-F0-9]{8}$/)
    expect(body.data.status).toBe('PENDENTE')
    expect(body.data.empreendimentoId).toBeTruthy()
  })

  it('cancela entregável PENDENTE', async () => {
    expect(entregavelIds.length).toBeGreaterThanOrEqual(1)
    const id = entregavelIds[0]

    const response = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/entregaveis/${id}/cancelar`,
      payload: {},
    })

    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { status: string } }
    expect(body.data.status).toBe('CANCELADO')
  })

  it('lista entregáveis do tenant', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/operacao/entregaveis?limit=50',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json() as { pagination: { total: number } }
    expect(body.pagination.total).toBeGreaterThanOrEqual(1)
  })

  it('retorna KPIs', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/operacao/entregaveis/kpis',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { totalCadastrados: number } }
    expect(body.data.totalCadastrados).toBeGreaterThanOrEqual(1)
  })

  it('retorna 404 para entregável inexistente', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/operacao/entregaveis/00000000-0000-0000-0000-000000000000',
    })

    expect(response.statusCode).toBe(404)
  })
})
