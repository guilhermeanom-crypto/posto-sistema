import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hashPortalToken } from './portal-token.js'

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

const tokenPortalCreate = vi.fn()
const tokenPortalFindUnique = vi.fn()
const tokenPortalUpdate = vi.fn()

vi.mock('../../infra/database/prisma.js', () => ({
  prisma: {
    tokenPortal: {
      create: tokenPortalCreate,
      findUnique: tokenPortalFindUnique,
      update: tokenPortalUpdate,
    },
  },
}))

vi.mock('../../shared/middleware/audit.js', () => ({
  registrarAuditoria: vi.fn(),
}))

describe('AuthService magic link', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persiste apenas o hash do token de portal', async () => {
    const { authService } = await import('./auth.service.js')

    const link = await authService.gerarMagicLink(
      {
        empreendimentoId: '11111111-1111-4111-8111-111111111111',
        email: 'cliente@habilis.test',
        nomeContato: 'Cliente',
      },
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      'https://app.habilis.test',
    )

    const token = new URL(link).searchParams.get('token')
    expect(token).toBeTruthy()
    expect(tokenPortalCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        token: hashPortalToken(token as string),
      }),
    })
    const createArgs = tokenPortalCreate.mock.calls[0]?.[0]
    expect(createArgs?.data.token).not.toBe(token)
  })

  it('busca magic link pelo hash do token recebido', async () => {
    const { authService } = await import('./auth.service.js')
    const token = 'portal-token-raw'

    tokenPortalFindUnique.mockResolvedValue({
      id: 'token-id',
      tenantId: 'tenant-id',
      empreendimentoId: 'empreendimento-id',
      usadoEm: null,
      expiresAt: new Date(Date.now() + 60_000),
    })
    tokenPortalUpdate.mockResolvedValue({})

    await authService.validarMagicLink(token, {
      jwtSign: () => 'access-token',
    })

    expect(tokenPortalFindUnique).toHaveBeenCalledWith({
      where: { token: hashPortalToken(token) },
    })
  })
})
