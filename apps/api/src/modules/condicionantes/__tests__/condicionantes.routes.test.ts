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

describeIntegration('API de condicionantes', () => {
  let app: AppInstance
  let adminToken: string
  let analistaToken: string
  let coordenadorToken: string

  let empreendimentoId: string

  // IDs dos registros criados durante os testes para cleanup
  const condicionanteIds: string[] = []
  const cicloIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()

    adminToken = await loginDemo(app, 'admin@postodemo.com.br')
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')
    coordenadorToken = await loginDemo(app, 'coord@postodemo.com.br')

    // Busca um empreendimento do tenant de demo para usar como FK obrigatória
    const empreendimento = await prisma.empreendimento.findFirst({
      where: { tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47' },
      select: { id: true },
    })
    if (!empreendimento) {
      throw new Error('Nenhum empreendimento encontrado no tenant de demo. Execute o seed antes de rodar os testes.')
    }
    empreendimentoId = empreendimento.id
  })

  afterAll(async () => {
    // Remove ciclos antes de condicionantes (FK constraint)
    if (cicloIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM ciclos_condicionante WHERE id = ANY($1::text[])`,
        cicloIds,
      )
    }
    if (condicionanteIds.length > 0) {
      // Tarefas vinculadas a condicionantes criadas no teste devem ser removidas antes
      await prisma.$executeRawUnsafe(
        `DELETE FROM tarefas WHERE condicionante_id = ANY($1::text[])`,
        condicionanteIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM ciclos_condicionante WHERE condicionante_id = ANY($1::text[])`,
        condicionanteIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM condicionantes WHERE id = ANY($1::text[])`,
        condicionanteIds,
      )
    }
    await app?.close()
    await prisma.$disconnect()
  })

  // ─── 1. Autenticação ───────────────────────────────────────────────────────

  it('bloqueia listagem sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/condicionantes' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia GET /:id sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/condicionantes/00000000-0000-0000-0000-000000000000',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/condicionantes',
      headers: { 'content-type': 'application/json' },
      payload: {
        empreendimentoId,
        descricao: 'Condicionante sem autenticação',
        tipo: 'DOCUMENTAL',
        periodicidade: 'UNICA',
        prazoCumprimento: '2027-12-31',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem ──────────────────────────────────────────────────────────

  it('lista condicionantes do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/condicionantes',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; descricao: string; status: string }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination).toMatchObject({ page: 1 })
    expect(typeof body.pagination.total).toBe('number')
  })

  it('aceita filtro por empreendimentoId (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/condicionantes?empreendimentoId=${empreendimentoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ empreendimentoId?: string; empreendimento?: { id: string } }>
    }
    expect(Array.isArray(body.data)).toBe(true)
    for (const item of body.data) {
      const empId = item.empreendimentoId ?? item.empreendimento?.id
      expect(empId).toBe(empreendimentoId)
    }
  })

  // ─── 3. Criação ───────────────────────────────────────────────────────────

  let criadoId: string

  it('cria uma condicionante com payload válido (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/condicionantes',
      payload: {
        empreendimentoId,
        descricao: 'Condicionante de monitoramento trimestral de efluentes',
        numeroCondicionante: 'COND-TESTE-001',
        tipo: 'MONITORAMENTO',
        periodicidade: 'TRIMESTRAL',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        descricao: string
        tipo: string
        status: string
        periodicidade: string
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.descricao).toBe('Condicionante de monitoramento trimestral de efluentes')
    expect(body.data.tipo).toBe('MONITORAMENTO')
    expect(body.data.status).toBe('PENDENTE')
    expect(body.data.periodicidade).toBe('TRIMESTRAL')
    criadoId = body.data.id
    condicionanteIds.push(criadoId)
  })

  // ─── 4. Busca por ID ──────────────────────────────────────────────────────

  it('retorna a condicionante criada pelo ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/condicionantes/${criadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: { id: string; descricao: string; ciclos: unknown[] }
    }
    expect(body.data.id).toBe(criadoId)
    expect(body.data.descricao).toBe('Condicionante de monitoramento trimestral de efluentes')
    expect(Array.isArray(body.data.ciclos)).toBe(true)
  })

  // ─── 5. 404 para ID inexistente ───────────────────────────────────────────

  it('retorna 404 para ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/condicionantes/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 6. Cumprimento / transição de status ─────────────────────────────────

  it('cumpre a condicionante e verifica persistência (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/condicionantes/${criadoId}/cumprir`,
      payload: {
        observacoes: 'Monitoramento realizado conforme cronograma.',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: {
        id: string
        ciclos: Array<{ id: string; numeroCiclo: number; status: string }>
      }
    }
    expect(body.data.id).toBe(criadoId)
    expect(Array.isArray(body.data.ciclos)).toBe(true)
    expect(body.data.ciclos.length).toBeGreaterThanOrEqual(1)

    const ciclo = body.data.ciclos[0]
    expect(ciclo).toBeDefined()
    expect(ciclo!.status).toBe('CUMPRIDA')
    cicloIds.push(ciclo!.id)

    // Verifica persistência diretamente no banco
    const condicionanteDb = await prisma.condicionante.findUnique({
      where: { id: criadoId },
      select: { cumpridaEm: true },
    })
    expect(condicionanteDb?.cumpridaEm).toBeTruthy()
  })

  // ─── 7. Dispensa (requer COORDENADOR+) ───────────────────────────────────

  let condicionanteParaDispensar: string

  it('cria condicionante para testar dispensa (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/condicionantes',
      payload: {
        empreendimentoId,
        descricao: 'Condicionante a ser dispensada no teste automatizado',
        tipo: 'DOCUMENTAL',
        periodicidade: 'UNICA',
        prazoCumprimento: '2027-06-30',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as { data: { id: string } }
    condicionanteParaDispensar = body.data.id
    condicionanteIds.push(condicionanteParaDispensar)
  })

  it('bloqueia dispensa por perfil ANALISTA (403)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'POST',
      url: `/api/v1/condicionantes/${condicionanteParaDispensar}/dispensar`,
      payload: {
        motivoDispensa: 'Motivo de dispensa fornecido pelo analista sem permissão.',
      },
    })
    expect(response.statusCode).toBe(403)
  })

  it('dispensa condicionante como COORDENADOR (200)', async () => {
    const response = await authedRequest(app, coordenadorToken, {
      method: 'POST',
      url: `/api/v1/condicionantes/${condicionanteParaDispensar}/dispensar`,
      payload: {
        motivoDispensa: 'Condicionante dispensada por decisão técnica fundamentada em laudo pericial.',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { mensagem: string } }
    expect(body.data.mensagem).toBeTruthy()

    // Verifica persistência no banco
    const condicionanteDb = await prisma.condicionante.findUnique({
      where: { id: condicionanteParaDispensar },
      select: { status: true, motivoDispensa: true },
    })
    expect(condicionanteDb?.status).toBe('DISPENSADA')
    expect(condicionanteDb?.motivoDispensa).toBeTruthy()
  })

  // ─── 8. Validação de schema ───────────────────────────────────────────────

  it('rejeita criação sem descricao (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/condicionantes',
      payload: {
        empreendimentoId,
        // descricao ausente
        tipo: 'DOCUMENTAL',
        periodicidade: 'UNICA',
        prazoCumprimento: '2027-12-31',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação sem empreendimentoId (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/condicionantes',
      payload: {
        // empreendimentoId ausente
        descricao: 'Condicionante sem vínculo de empreendimento',
        tipo: 'DOCUMENTAL',
        periodicidade: 'UNICA',
        prazoCumprimento: '2027-12-31',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação com tipo inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/condicionantes',
      payload: {
        empreendimentoId,
        descricao: 'Condicionante com tipo inválido no payload',
        tipo: 'TIPO_INVALIDO',
        periodicidade: 'UNICA',
        prazoCumprimento: '2027-12-31',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita periodicidade UNICA sem prazoCumprimento (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/condicionantes',
      payload: {
        empreendimentoId,
        descricao: 'Condicionante única sem prazo de cumprimento informado',
        tipo: 'DOCUMENTAL',
        periodicidade: 'UNICA',
        // prazoCumprimento ausente — deve falhar pela regra .refine
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita dispensa com motivoDispensa muito curto (400)', async () => {
    // Cria uma condicionante temporária para testar a validação do payload de dispensa
    const criar = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/condicionantes',
      payload: {
        empreendimentoId,
        descricao: 'Condicionante temporária para validação da dispensa',
        tipo: 'EXECUTIVA',
        periodicidade: 'ANUAL',
      },
    })
    expect(criar.statusCode).toBe(201)
    const { data } = criar.json() as { data: { id: string } }
    condicionanteIds.push(data.id)

    const response = await authedRequest(app, coordenadorToken, {
      method: 'POST',
      url: `/api/v1/condicionantes/${data.id}/dispensar`,
      payload: {
        motivoDispensa: 'Curto', // menos de 20 caracteres
      },
    })
    expect(response.statusCode).toBe(400)
  })
})
