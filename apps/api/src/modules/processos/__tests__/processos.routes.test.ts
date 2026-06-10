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

const TENANT_ID = '173fa80b-edaf-47f8-92cf-7958da22ea47'

describeIntegration('API de processos', () => {
  let app: AppInstance
  let adminToken: string
  let analistaToken: string

  // IDs de seed necessários para criar processos
  let empreendimentoId: string
  let tipoProcessoId: string

  // IDs de objetos criados durante os testes — usados no cleanup
  const processoIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    adminToken = await loginDemo(app, 'admin@postodemo.com.br')
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')

    // Obtém um empreendimento real do seed para usar como FK obrigatória
    const empreendimento = await prisma.empreendimento.findFirst({
      where: { tenantId: TENANT_ID },
      select: { id: true },
    })
    if (!empreendimento) throw new Error('Seed: nenhum empreendimento encontrado para o tenant de demo')
    empreendimentoId = empreendimento.id

    // Obtém um tipo de processo real do seed
    const tipoProcesso = await prisma.tipoProcesso.findFirst({
      where: { tenantId: TENANT_ID, ativo: true },
      select: { id: true },
    })
    if (!tipoProcesso) throw new Error('Seed: nenhum tipo de processo ativo encontrado para o tenant de demo')
    tipoProcessoId = tipoProcesso.id
  })

  afterAll(async () => {
    if (processoIds.length > 0) {
      // Remove registros filhos antes do pai para respeitar FK
      await prisma.$executeRawUnsafe(
        `DELETE FROM historico_fases_processo WHERE processo_id = ANY($1::text[])`,
        processoIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM requisitos_processo WHERE processo_id = ANY($1::text[])`,
        processoIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM processos WHERE id = ANY($1::text[])`,
        processoIds,
      )
    }
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  })

  // ─── 1. Autenticação ────────────────────────────────────────────────────────

  it('bloqueia listagem de processos sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/processos' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia GET /:id sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/processos/00000000-0000-0000-0000-000000000000',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação de processo sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/processos',
      headers: { 'content-type': 'application/json' },
      payload: {
        empreendimentoId,
        tipoProcessoId,
      },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem ────────────────────────────────────────────────────────────

  it('lista processos do tenant com paginação (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/processos',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; status: string }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination).toBeDefined()
    expect(body.pagination.page).toBe(1)
    expect(typeof body.pagination.total).toBe('number')
    expect(typeof body.pagination.limit).toBe('number')
    expect(typeof body.pagination.totalPages).toBe('number')
  })

  it('analista consegue listar processos (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: '/api/v1/processos',
    })
    expect(response.statusCode).toBe(200)
  })

  it('aceita filtro por empreendimentoId na listagem (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/processos?empreendimentoId=${empreendimentoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ empreendimento: { id: string } }> }
    for (const p of body.data) {
      expect(p.empreendimento.id).toBe(empreendimentoId)
    }
  })

  // ─── 3. Criação ─────────────────────────────────────────────────────────────

  let criadoId: string

  it('cria processo com payload válido (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/processos',
      payload: {
        empreendimentoId,
        tipoProcessoId,
        observacoes: 'Processo criado pelo teste de integração',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as { data: { id: string; status: string; empreendimentoId: string; tipoProcessoId: string } }
    expect(body.data.id).toBeTruthy()
    expect(body.data.status).toBe('EM_ELABORACAO')
    expect(body.data.empreendimentoId).toBe(empreendimentoId)
    expect(body.data.tipoProcessoId).toBe(tipoProcessoId)
    criadoId = body.data.id
    processoIds.push(criadoId)
  })

  // ─── 4. Busca por ID ────────────────────────────────────────────────────────

  it('retorna o processo criado pelo seu ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/processos/${criadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; status: string } }
    expect(body.data.id).toBe(criadoId)
    expect(body.data.status).toBe('EM_ELABORACAO')
  })

  it('retorna 404 para ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/processos/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 5. Atualização ─────────────────────────────────────────────────────────

  it('atualiza observações do processo (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/processos/${criadoId}`,
      payload: { observacoes: 'Observação atualizada pelo teste' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; observacoes: string } }
    expect(body.data.id).toBe(criadoId)
    expect(body.data.observacoes).toBe('Observação atualizada pelo teste')
  })

  // ─── 6. Transição de status válida ─────────────────────────────────────────
  //
  // Máquina de estados: EM_ELABORACAO → AGUARDANDO_DOCUMENTOS é uma transição válida
  // (ver TRANSICOES_PROCESSO em packages/types/src/enums.ts)

  it('transição de status válida: EM_ELABORACAO → AGUARDANDO_DOCUMENTOS (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/processos/${criadoId}/status`,
      payload: {
        status: 'AGUARDANDO_DOCUMENTOS',
        observacoes: 'Aguardando documentação do cliente',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; status: string } }
    expect(body.data.id).toBe(criadoId)
    expect(body.data.status).toBe('AGUARDANDO_DOCUMENTOS')
  })

  it('persiste o novo status após a transição (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/processos/${criadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { status: string } }
    expect(body.data.status).toBe('AGUARDANDO_DOCUMENTOS')
  })

  // ─── 7. Transição de status inválida ───────────────────────────────────────
  //
  // De AGUARDANDO_DOCUMENTOS não é possível ir direto para EM_ANALISE
  // (não está em TRANSICOES_PROCESSO[AGUARDANDO_DOCUMENTOS])

  it('rejeita transição de status inválida: AGUARDANDO_DOCUMENTOS → EM_ANALISE (422)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/processos/${criadoId}/status`,
      payload: {
        status: 'EM_ANALISE',
      },
    })
    // A máquina de estados devolve um AppError com statusCode 422
    expect(response.statusCode).toBeGreaterThanOrEqual(400)
    expect(response.statusCode).toBeLessThan(500)
  })

  // ─── 8. Validação de schema ─────────────────────────────────────────────────

  it('rejeita criação sem empreendimentoId (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/processos',
      payload: {
        // empreendimentoId ausente
        tipoProcessoId,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação sem tipoProcessoId (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/processos',
      payload: {
        empreendimentoId,
        // tipoProcessoId ausente
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação com tipoProcessoId inexistente (404)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/processos',
      payload: {
        empreendimentoId,
        tipoProcessoId: '00000000-0000-0000-0000-000000000099',
      },
    })
    expect(response.statusCode).toBe(404)
  })

  it('rejeita status inválido no endpoint de alteração de status (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/processos/${criadoId}/status`,
      payload: {
        status: 'STATUS_QUE_NAO_EXISTE',
      },
    })
    expect(response.statusCode).toBe(400)
  })
})
