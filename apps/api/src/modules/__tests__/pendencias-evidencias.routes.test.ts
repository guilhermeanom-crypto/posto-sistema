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
      get: vi.fn(async (k: string) => redisStore.get(k) ?? null),
      set: vi.fn(async (k: string, v: string) => { redisStore.set(k, v); return 'OK' }),
      del: vi.fn(async (...ks: string[]) => { let n = 0; for (const k of ks) if (redisStore.delete(k)) n++; return n }),
      exists: vi.fn(async (...ks: string[]) => ks.filter((k) => redisStore.has(k)).length),
      expire: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(-1),
    },
  }
})

vi.mock('bullmq', () => ({ Queue: testDoubles.QueueMock }))
vi.mock('../../infra/cache/redis.js', () => ({
  redis: testDoubles.redisMock,
  REDIS_KEYS: {
    session: (h: string) => `session:${h}`,
    complianceCache: (t: string, e: string) => `cache:${t}:compliance:${e}`,
    dashboardCache: (t: string, k: string) => `cache:${t}:dashboard:${k}`,
    magicLink: (t: string) => `magic_link:${t}`,
    loginAttempts: (e: string) => `login_attempts:${e}`,
  },
}))

import { buildApp } from '../../app.js'
import { prisma } from '../../infra/database/prisma.js'
import { assertIntegrationDatabaseAvailable, describeIntegration } from '../../test/integration.js'
import { authedRequest, loginDemo, createOSFixture } from '../../test/helpers.js'
import { setupTenantB, type TenantBContext } from '../../test/tenant-b.js'

type AppInstance = Awaited<ReturnType<typeof buildApp>>

describeIntegration('API de pendências e evidências de campo', () => {
  let app: AppInstance
  let tokenA: string
  let tenantB: TenantBContext
  let osId: string
  const propostaIds: string[] = []
  const diagnosticoIds: string[] = []
  const handoffIds: string[] = []
  const contratoIds: string[] = []
  const osIds: string[] = []
  const pendenciaIds: string[] = []
  const evidenciaIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    tokenA = await loginDemo(app)
    tenantB = await setupTenantB(app)
    const os = await createOSFixture(app, tokenA, propostaIds, diagnosticoIds, handoffIds, contratoIds, osIds)
    osId = os.id
  })

  afterAll(async () => {
    if (pendenciaIds.length) await prisma.pendenciaCampo.deleteMany({ where: { id: { in: pendenciaIds } } })
    if (evidenciaIds.length) await prisma.evidenciaCampo.deleteMany({ where: { id: { in: evidenciaIds } } })
    await app.close()
  })

  it('cria pendência vinculada à OS e lista', async () => {
    const criar = await authedRequest(app, tokenA, {
      method: 'POST',
      url: '/api/v1/pendencias',
      payload: { ordemServicoId: osId, descricao: 'Foto de bocais selados por tanque', prioridade: 'ALTA', prazo: '2026-07-10' },
    })
    expect(criar.statusCode).toBe(201)
    const pend = (criar.json() as { data: { id: string; status: string; empreendimentoId: string } }).data
    pendenciaIds.push(pend.id)
    expect(pend.status).toBe('ABERTA')
    expect(pend.empreendimentoId).toBeTruthy() // derivado da OS

    const lista = await authedRequest(app, tokenA, { method: 'GET', url: `/api/v1/pendencias?ordemServicoId=${osId}` })
    expect(lista.statusCode).toBe(200)
    expect((lista.json() as { data: unknown[] }).data.length).toBeGreaterThan(0)
  })

  it('resolve pendência carimba resolvidoEm', async () => {
    const id = pendenciaIds[0]!
    const res = await authedRequest(app, tokenA, {
      method: 'PATCH',
      url: `/api/v1/pendencias/${id}`,
      payload: { status: 'RESOLVIDA' },
    })
    expect(res.statusCode).toBe(200)
    const depois = await prisma.pendenciaCampo.findUnique({ where: { id }, select: { resolvidoEm: true } })
    expect(depois?.resolvidoEm).not.toBeNull()
  })

  it('cria evidência e analista valida', async () => {
    const criar = await authedRequest(app, tokenA, {
      method: 'POST',
      url: '/api/v1/evidencias',
      payload: { ordemServicoId: osId, setor: 'SASC', nota: 'Bocal tanque 2 sem indício de vazamento' },
    })
    expect(criar.statusCode).toBe(201)
    const ev = (criar.json() as { data: { id: string; statusValidacao: string } }).data
    evidenciaIds.push(ev.id)
    expect(ev.statusValidacao).toBe('PENDENTE')

    const validar = await authedRequest(app, tokenA, {
      method: 'PATCH',
      url: `/api/v1/evidencias/${ev.id}/validar`,
      payload: { statusValidacao: 'VALIDADA' },
    })
    expect(validar.statusCode).toBe(200)
    expect((validar.json() as { data: { statusValidacao: string } }).data.statusValidacao).toBe('VALIDADA')
  })

  // ── Isolamento cross-tenant ────────────────────────────────────────────────
  it('tenant B NÃO cria pendência na OS do tenant A (404)', async () => {
    const res = await authedRequest(app, tenantB.token, {
      method: 'POST',
      url: '/api/v1/pendencias',
      payload: { ordemServicoId: osId, descricao: 'tentativa cross-tenant' },
    })
    expect(res.statusCode).toBe(404)
  })

  it('tenant B NÃO vê pendências do tenant A na listagem', async () => {
    const res = await authedRequest(app, tenantB.token, { method: 'GET', url: `/api/v1/pendencias?ordemServicoId=${osId}` })
    expect(res.statusCode).toBe(200)
    expect((res.json() as { data: unknown[] }).data.length).toBe(0)
  })
})
