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
          if (redisStore.delete(key)) {
            removidos += 1
          }
        }
        return removidos
      }),
      exists: vi.fn(async (...keys: string[]) => keys.filter((key) => redisStore.has(key)).length),
      expire: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(-1),
    },
  }
})

vi.mock('bullmq', () => ({
  Queue: testDoubles.QueueMock,
}))

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

const SENSITIVE_CATALOGO_FIELDS = [
  'custoInternoEstimado',
  'margemLucroAlvo',
  'valorReferenciaHora',
  'metadata',
  'atualizadoEm',
] as const

describeIntegration('POST /api/v1/comercial/diagnostico/cnae', () => {
  let app: AppInstance
  let accessToken: string

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    accessToken = await loginDemo(app)
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  })

  it('bloqueia acesso sem JWT', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/comercial/diagnostico/cnae',
      payload: {
        cnaes: ['4731-8/00'],
        uf: 'SP',
        porte: 'MEDIO',
        situacao: 'IRREGULAR',
        temOutorgaAnterior: false,
      },
    })

    expect(response.statusCode).toBe(401)
  })

  it('mantem o catalogo autenticado sanitizado para o fluxo comercial', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/comercial/catalogo?limit=1',
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as { data: Array<Record<string, unknown>> }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)

    const primeiroServico = body.data[0]
    for (const field of SENSITIVE_CATALOGO_FIELDS) {
      expect(primeiroServico).not.toHaveProperty(field)
    }
  })

  it('retorna o diagnostico critico do posto irregular sem expor custo ou margem', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/diagnostico/cnae',
      payload: {
        cnaes: ['4731-8/00'],
        uf: 'SP',
        porte: 'MEDIO',
        situacao: 'IRREGULAR',
        temOutorgaAnterior: false,
      },
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: {
        cnaePrincipal: { codigo: string }
        riscoGeral: { score: number; nivel: string }
        estimativaOrcamento: { minimo: number; recomendado: number; maximo: number }
        recomendacoes: Array<Record<string, unknown> & { codigo: string; decisao: string }>
        alertas: string[]
      }
    }

    expect(body.data.cnaePrincipal.codigo).toBe('4731-8/00')
    expect(body.data.riscoGeral).toEqual(
      expect.objectContaining({
        score: 90,
        nivel: 'CRITICO',
      }),
    )
    expect(body.data.estimativaOrcamento).toEqual({
      minimo: 26800,
      recomendado: 45500,
      maximo: 135000,
    })

    const codigos = body.data.recomendacoes.map((item) => item.codigo)
    expect(codigos).toEqual([
      'LIC-004',
      'LIC-008',
      'LIC-011',
      'OUT-015',
      'MON-008',
      'EST-002',
      'LIC-016',
      'EST-001',
      'OUT-002',
    ])

    expect(body.data.recomendacoes).toHaveLength(9)
    expect(body.data.recomendacoes.filter((item) => item.decisao === 'OBRIGATORIO')).toHaveLength(6)
    expect(body.data.recomendacoes.filter((item) => item.decisao === 'CONDICIONAL')).toHaveLength(3)
    expect(body.data.alertas).toHaveLength(3)

    for (const recomendacao of body.data.recomendacoes) {
      expect(recomendacao).not.toHaveProperty('custoInternoEstimado')
      expect(recomendacao).not.toHaveProperty('margemLucroAlvo')
      expect(recomendacao).not.toHaveProperty('valorReferenciaHora')
      expect(recomendacao).not.toHaveProperty('metadata')
    }

    await expectCatalogCodesToExist(codigos)
  })

  it('recomenda servicos de renovacao sem adicionar outorga de captacao quando ja existe historico', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/diagnostico/cnae',
      payload: {
        cnaes: ['4731-8/00'],
        uf: 'SP',
        porte: 'MEDIO',
        situacao: 'RENOVACAO',
        temOutorgaAnterior: true,
      },
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: {
        riscoGeral: { score: number; nivel: string }
        estimativaOrcamento: { minimo: number; recomendado: number; maximo: number }
        recomendacoes: Array<{ codigo: string; decisao: string }>
      }
    }

    const codigos = body.data.recomendacoes.map((item) => item.codigo)
    expect(body.data.riscoGeral).toEqual(
      expect.objectContaining({
        score: 70,
        nivel: 'ALTO',
      }),
    )
    expect(codigos).toEqual([
      'LIC-004',
      'LIC-008',
      'LIC-011',
      'OUT-015',
      'MON-008',
      'EST-002',
      'LIC-015',
      'LIC-010',
    ])
    expect(codigos).not.toContain('OUT-002')
    expect(body.data.estimativaOrcamento).toEqual({
      minimo: 26800,
      recomendado: 45500,
      maximo: 101000,
    })

    await expectCatalogCodesToExist(codigos)
  })

  it('aplica o fallback para CNAE nao mapeado usando apenas servicos ativos do catalogo', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/diagnostico/cnae',
      payload: {
        cnaes: ['0000-0/00'],
        uf: 'SP',
        porte: 'MICRO',
        situacao: 'PLANEJADO',
        temOutorgaAnterior: false,
      },
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: {
        cnaePrincipal: { codigo: string; descricao: string }
        riscoGeral: { score: number; nivel: string }
        obrigatoriedades: { necessitaOutorga: boolean }
        estimativaOrcamento: { minimo: number; recomendado: number; maximo: number }
        recomendacoes: Array<{ codigo: string; decisao: string }>
      }
    }

    const codigos = body.data.recomendacoes.map((item) => item.codigo)
    expect(body.data.cnaePrincipal.codigo).toBe('0000-0/00')
    expect(body.data.cnaePrincipal.descricao).toMatch(/^Atividade/)
    expect(body.data.riscoGeral).toEqual(
      expect.objectContaining({
        score: 25,
        nivel: 'BAIXO',
      }),
    )
    expect(body.data.obrigatoriedades.necessitaOutorga).toBe(false)
    expect(codigos).toEqual(['LIC-001', 'LIC-012', 'GES-001'])
    expect(body.data.recomendacoes.every((item) => item.decisao === 'OBRIGATORIO')).toBe(true)
    expect(body.data.estimativaOrcamento).toEqual({
      minimo: 8500,
      recomendado: 15000,
      maximo: 29000,
    })

    await expectCatalogCodesToExist(codigos)
  })
})

async function expectCatalogCodesToExist(codigos: string[]) {
  const items = await prisma.servicoCatalogo.findMany({
    where: {
      codigo: { in: codigos },
      ativo: true,
    },
    select: {
      codigo: true,
    },
  })

  const encontrados = items.map((item) => item.codigo).sort()
  const esperados = [...codigos].sort()

  expect(encontrados).toEqual(esperados)
}
