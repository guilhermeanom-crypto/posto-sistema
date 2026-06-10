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
import { authedRequest, loginDemo } from '../../../test/helpers.js'

type AppInstance = Awaited<ReturnType<typeof buildApp>>

describeIntegration('API de estanqueidade (tanques + testes)', () => {
  let app: AppInstance
  let adminToken: string
  let empreendimentoId: string

  const tanqueIds: string[] = []
  const testeIds: string[] = []

  // IDs criados durante os testes (para acompanhamento entre casos)
  let tanqueCriadoId: string
  let testeCriadoId: string

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    adminToken = await loginDemo(app, 'admin@postodemo.com.br')

    // Busca empreendimento do tenant de demonstração (seed)
    const emp = await prisma.empreendimento.findFirst({
      where: { tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47' },
      select: { id: true },
    })
    if (!emp) throw new Error('Empreendimento seed não encontrado — rode o seed antes dos testes.')
    empreendimentoId = emp.id
  })

  afterAll(async () => {
    // Respeita FK: testes_estanqueidade antes de tanques
    if (testeIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM testes_estanqueidade WHERE id = ANY($1::text[])`,
        testeIds,
      )
    }
    if (tanqueIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM tanques WHERE id = ANY($1::text[])`,
        tanqueIds,
      )
    }
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  })

  // ─── 1. Autenticação (unauthenticated) ──────────────────────────────────────

  it('bloqueia listagem de tanques sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/estanqueidade/tanques' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação de tanque sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/estanqueidade/tanques',
      headers: { 'content-type': 'application/json' },
      payload: {
        empreendimentoId,
        numero: 99,
        capacidadeLitros: 15000,
        combustivel: 'GASOLINA',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia listagem de testes sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/estanqueidade/testes' })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem de tanques ──────────────────────────────────────────────────

  it('lista tanques do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/estanqueidade/tanques',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; numero: number; combustivel: string; status: string }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination).toMatchObject({ page: 1 })
  })

  it('aceita filtro por status na listagem de tanques (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/estanqueidade/tanques?status=ATIVO',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ status: string }> }
    for (const t of body.data) {
      expect(t.status).toBe('ATIVO')
    }
  })

  // ─── 3. Criação de tanque ────────────────────────────────────────────────────

  it('cria tanque com payload válido (201)', async () => {
    // Número único para evitar violação do unique constraint [empreendimentoId, numero]
    const numero = Math.floor(Math.random() * 9000) + 1000

    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/estanqueidade/tanques',
      payload: {
        empreendimentoId,
        numero,
        capacidadeLitros: 15000,
        combustivel: 'GASOLINA_COMUM',
        material: 'FIBRA',
        dataInstalacao: '2020-01-15',
        observacoes: 'Tanque criado pelo teste automatizado.',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: { id: string; numero: number; combustivel: string; status: string }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.numero).toBe(numero)
    expect(body.data.combustivel).toBe('GASOLINA_COMUM')
    expect(body.data.status).toBe('ATIVO')

    tanqueCriadoId = body.data.id
    tanqueIds.push(tanqueCriadoId)
  })

  // ─── 4. Busca de tanque por ID ───────────────────────────────────────────────

  it('retorna o tanque criado pelo seu ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/estanqueidade/tanques/${tanqueCriadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: { id: string; combustivel: string; empreendimento: { id: string } }
    }
    expect(body.data.id).toBe(tanqueCriadoId)
    expect(body.data.empreendimento.id).toBe(empreendimentoId)
  })

  it('retorna 404 para tanque com ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/estanqueidade/tanques/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 5. Atualização de tanque ────────────────────────────────────────────────

  it('atualiza combustível do tanque (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/estanqueidade/tanques/${tanqueCriadoId}`,
      payload: { combustivel: 'ETANOL' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; combustivel: string } }
    expect(body.data.combustivel).toBe('ETANOL')
    expect(body.data.id).toBe(tanqueCriadoId)
  })

  it('atualiza status do tanque para INTERDITADO (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/estanqueidade/tanques/${tanqueCriadoId}`,
      payload: { status: 'INTERDITADO' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { status: string } }
    expect(body.data.status).toBe('INTERDITADO')
  })

  it('retorna 404 ao tentar atualizar tanque inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: '/api/v1/estanqueidade/tanques/00000000-0000-0000-0000-000000000099',
      payload: { combustivel: 'DIESEL' },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 6. Validação de schema (tanque) ────────────────────────────────────────

  it('rejeita criação de tanque sem empreendimentoId (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/estanqueidade/tanques',
      payload: {
        numero: 1,
        capacidadeLitros: 10000,
        combustivel: 'GASOLINA',
        // empreendimentoId ausente
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de tanque com material inválido (400)', async () => {
    const numero = Math.floor(Math.random() * 9000) + 1000
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/estanqueidade/tanques',
      payload: {
        empreendimentoId,
        numero,
        capacidadeLitros: 10000,
        combustivel: 'GASOLINA',
        material: 'MADEIRA', // material não existe no enum
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 7. Listagem de testes ───────────────────────────────────────────────────

  it('lista testes de estanqueidade do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/estanqueidade/testes',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: unknown[]
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination.page).toBe(1)
  })

  it('aceita filtro por resultado na listagem de testes (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/estanqueidade/testes?resultado=APROVADO',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ resultado: string }> }
    for (const t of body.data) {
      expect(t.resultado).toBe('APROVADO')
    }
  })

  // ─── 8. Criação de teste ──────────────────────────────────────────────────────

  it('registra teste de estanqueidade para o tanque criado (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/estanqueidade/tanques/${tanqueCriadoId}/testes`,
      payload: {
        empresa: 'Empresa Testes Ltda',
        responsavel: 'João Técnico',
        dataExecucao: '2026-03-10',
        resultado: 'APROVADO',
        metodo: 'vacuo',
        proximoTeste: '2027-03-10',
        observacoes: 'Teste registrado pelo suite automatizado.',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        empresa: string
        resultado: string
        tanque: { id: string; numero: number }
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.empresa).toBe('Empresa Testes Ltda')
    expect(body.data.resultado).toBe('APROVADO')
    expect(body.data.tanque.id).toBe(tanqueCriadoId)

    testeCriadoId = body.data.id
    testeIds.push(testeCriadoId)
  })

  it('retorna 404 ao registrar teste para tanque inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/estanqueidade/tanques/00000000-0000-0000-0000-000000000099/testes',
      payload: {
        empresa: 'Empresa X',
        dataExecucao: '2026-03-10',
        resultado: 'APROVADO',
        proximoTeste: '2027-03-10',
      },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 9. Validação de schema (teste) ─────────────────────────────────────────

  it('rejeita criação de teste sem empresa (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/estanqueidade/tanques/${tanqueCriadoId}/testes`,
      payload: {
        // empresa ausente
        dataExecucao: '2026-03-10',
        resultado: 'APROVADO',
        proximoTeste: '2027-03-10',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de teste com resultado inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/estanqueidade/tanques/${tanqueCriadoId}/testes`,
      payload: {
        empresa: 'Empresa Testes Ltda',
        dataExecucao: '2026-03-10',
        resultado: 'INVALIDO', // não está no enum
        proximoTeste: '2027-03-10',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 10. Filtro de testes por tanque ────────────────────────────────────────

  it('filtra testes pelo tanqueId criado (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/estanqueidade/testes?tanqueId=${tanqueCriadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; tanque: { id: string } }>
      pagination: { total: number }
    }
    expect(body.pagination.total).toBeGreaterThanOrEqual(1)
    for (const t of body.data) {
      expect(t.tanque.id).toBe(tanqueCriadoId)
    }
  })
})
