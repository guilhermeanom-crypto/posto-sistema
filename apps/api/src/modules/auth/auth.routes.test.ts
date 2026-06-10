import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.API_URL ??= 'http://localhost:3001'
process.env.WEB_URL ??= 'http://localhost:3000'
process.env.DATABASE_URL ??= 'postgresql://posto:posto@localhost:5432/posto_dev'
process.env.REDIS_URL ??= 'redis://localhost:6379'
process.env.JWT_SECRET ??= 'test-jwt-secret-with-at-least-thirty-two-chars'
process.env.INTEGRATION_SHARED_SECRET ??= 'test-integration-secret-with-32-chars'
process.env.S3_BUCKET ??= 'test-bucket'
process.env.S3_ACCESS_KEY_ID ??= 'test-access-key'
process.env.S3_SECRET_ACCESS_KEY ??= 'test-secret-key'
process.env.RESEND_API_KEY ??= 'test-resend-key'
process.env.EMAIL_FROM ??= 'noreply@habilis.test'

const testDoubles = vi.hoisted(() => {
  const queueAdd = vi.fn().mockResolvedValue({ id: 'mock-job-id' })

  class QueueMock {
    add = queueAdd
    close = vi.fn().mockResolvedValue(undefined)
  }

  return {
    QueueMock,
    authServiceMock: {
      login: vi.fn().mockResolvedValue({
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 900,
        },
        usuario: {
          id: 'usuario-id',
          nome: 'Usuario Teste',
          email: 'usuario@habilis.test',
          perfil: 'ADMIN_TENANT',
          tenantId: 'tenant-id',
        },
      }),
      refresh: vi.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      }),
      logout: vi.fn().mockResolvedValue(undefined),
      gerarMagicLink: vi.fn().mockResolvedValue('https://app.habilis.test/portal/acesso?token=token'),
      validarMagicLink: vi.fn().mockResolvedValue({
        accessToken: 'portal-access-token',
        empreendimentoId: 'empreendimento-id',
      }),
    },
    redisMock: {
      on: vi.fn().mockReturnThis(),
      ping: vi.fn().mockResolvedValue('PONG'),
      quit: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      exists: vi.fn().mockResolvedValue(0),
      expire: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(-1),
    },
  }
})

vi.mock('bullmq', () => ({
  Queue: testDoubles.QueueMock,
}))

vi.mock('../../infra/cache/redis.js', () => ({
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

vi.mock('./auth.service.js', () => ({
  authService: testDoubles.authServiceMock,
}))

type BuildApp = typeof import('../../app.js')['buildApp']
type AppInstance = Awaited<ReturnType<BuildApp>>

describe('Auth routes', () => {
  let app: AppInstance | undefined

  beforeAll(async () => {
    const { buildApp } = await import('../../app.js')
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app?.close()
  })

  it('limita login a 10 requisicoes por minuto por IP', async () => {
    let lastStatusCode = 0

    for (let tentativa = 0; tentativa < 11; tentativa += 1) {
      const response = await app!.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'x-forwarded-for': '203.0.113.10' },
        payload: {
          email: 'usuario@habilis.test',
          senha: 'senha-valida',
        },
      })

      lastStatusCode = response.statusCode
    }

    expect(lastStatusCode).toBe(429)
  })
})
