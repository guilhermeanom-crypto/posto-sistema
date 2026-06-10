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
import { authedRequest, createContratoFixture, getAdminUserId, loginDemo } from '../../../test/helpers.js'

type AppInstance = Awaited<ReturnType<typeof buildApp>>

describeIntegration('API de ordens de serviço', () => {
  let app: AppInstance
  let accessToken: string
  const propostaIds: string[] = []
  const diagnosticoIds: string[] = []
  const handoffIds: string[] = []
  const contratoIds: string[] = []
  const osIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    accessToken = await loginDemo(app)
  })

  afterAll(async () => {
    if (osIds.length > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM ordens_servico WHERE id = ANY($1::text[])`, osIds)
    }
    if (contratoIds.length > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM contratos WHERE id = ANY($1::text[])`, contratoIds)
    }
    if (handoffIds.length > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM handoffs_comerciais WHERE id = ANY($1::text[])`, handoffIds)
    }
    if (propostaIds.length > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM propostas_comerciais WHERE id = ANY($1::text[])`, propostaIds)
    }
    if (diagnosticoIds.length > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM diagnosticos_comerciais WHERE id = ANY($1::text[])`, diagnosticoIds)
    }
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  })

  it('bloqueia listagem sem JWT', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/operacao/ordens-servico',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação de OS a partir de contrato em RASCUNHO', async () => {
    const contrato = await createContratoFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds, contratoIds, { ativar: false })

    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/operacao/ordens-servico',
      payload: {
        contratoId: contrato.id,
        tipo: 'VISTORIA_TECNICA',
        titulo: 'Vistoria inicial',
        escopo: 'Vistoria técnica do empreendimento.',
        dataPlanejada: '2026-06-15',
      },
    })

    expect(response.statusCode).toBe(409)
  })

  it('cria OS a partir de contrato ATIVO', async () => {
    const contrato = await createContratoFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds, contratoIds, { ativar: true })

    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/operacao/ordens-servico',
      payload: {
        contratoId: contrato.id,
        tipo: 'VISTORIA_TECNICA',
        titulo: 'Vistoria mensal',
        escopo: 'Realizar vistoria de conformidade ambiental.',
        dataPlanejada: '2026-06-15',
        prioridade: 'ALTA',
      },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: { id: string; numero: string; status: string; tipo: string; prioridade: string; empreendimentoId: string }
    }
    osIds.push(body.data.id)

    expect(body.data.status).toBe('PLANEJADA')
    expect(body.data.numero).toMatch(/^OS-\d{4}-[A-F0-9]{8}$/)
    expect(body.data.tipo).toBe('VISTORIA_TECNICA')
    expect(body.data.prioridade).toBe('ALTA')
    expect(body.data.empreendimentoId).toBeTruthy()
  })

  it('exige responsável antes de transitar para EM_EXECUCAO', async () => {
    const contrato = await createContratoFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds, contratoIds, { ativar: true })

    const criar = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/operacao/ordens-servico',
      payload: {
        contratoId: contrato.id,
        tipo: 'COLETA_AMOSTRA',
        titulo: 'Coleta água',
        escopo: 'Coleta de amostra de água subterrânea.',
        dataPlanejada: '2026-07-01',
      },
    })
    const osId = (criar.json() as { data: { id: string } }).data.id
    osIds.push(osId)

    const semResp = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/ordens-servico/${osId}`,
      payload: { status: 'EM_EXECUCAO' },
    })
    expect(semResp.statusCode).toBe(409)

    const adminUserId = await getAdminUserId(app, accessToken)
    const comResp = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/ordens-servico/${osId}`,
      payload: { responsavelId: adminUserId, status: 'EM_EXECUCAO' },
    })

    expect(comResp.statusCode).toBe(200)
    const body = comResp.json() as { data: { status: string; dataInicioExecucao: string | null } }
    expect(body.data.status).toBe('EM_EXECUCAO')
    expect(body.data.dataInicioExecucao).toBeTruthy()
  })

  it('recusa transição inválida (PLANEJADA -> CONCLUIDA)', async () => {
    const contrato = await createContratoFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds, contratoIds, { ativar: true })

    const criar = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/operacao/ordens-servico',
      payload: {
        contratoId: contrato.id,
        tipo: 'PROTOCOLO',
        titulo: 'Protocolo SEMAD',
        escopo: 'Protocolo de processo no órgão estadual.',
        dataPlanejada: '2026-08-01',
      },
    })
    const osId = (criar.json() as { data: { id: string } }).data.id
    osIds.push(osId)

    const patch = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/ordens-servico/${osId}`,
      payload: { status: 'CONCLUIDA' },
    })

    expect(patch.statusCode).toBe(403)
  })

  it('lista OSs e expõe KPIs', async () => {
    const lista = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/operacao/ordens-servico?limit=50',
    })
    expect(lista.statusCode).toBe(200)
    const listaBody = lista.json() as { pagination: { total: number } }
    expect(listaBody.pagination.total).toBeGreaterThanOrEqual(1)

    const kpis = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/operacao/ordens-servico/kpis',
    })
    expect(kpis.statusCode).toBe(200)
    const kpisBody = kpis.json() as {
      data: { totalAbertas: number; totalEmExecucao: number; totalCriticas: number; totalConcluidasMes: number }
    }
    expect(kpisBody.data.totalAbertas).toBeGreaterThanOrEqual(1)
  })

  it('aplica filtro apenasMinhas = true', async () => {
    const adminUserId = await getAdminUserId(app, accessToken)
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/operacao/ordens-servico?apenasMinhas=true&limit=20',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ responsavelId: string | null }> }
    for (const item of body.data) {
      expect(item.responsavelId).toBe(adminUserId)
    }
  })
})
