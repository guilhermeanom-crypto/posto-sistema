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

// IDs únicos por execução para evitar colisões entre runs paralelos
function uniqueNumeroAuto() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `AUTO-TEST-${rand}-${Date.now()}`
}

describeIntegration('API de fiscalizações', () => {
  let app: AppInstance
  let adminToken: string
  let analistaToken: string
  let empreendimentoId: string

  // IDs rastreados para cleanup
  const recursosIds: string[] = []
  const autosIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    adminToken = await loginDemo(app, 'admin@postodemo.com.br')
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')

    // Busca um empreendimento do seed para usar como FK
    const emp = await prisma.empreendimento.findFirst({
      where: { tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47' },
      select: { id: true },
    })
    if (!emp) throw new Error('Nenhum empreendimento de seed encontrado para testes de fiscalizacoes')
    empreendimentoId = emp.id
  })

  afterAll(async () => {
    // Remove recursos antes dos autos (FK)
    if (recursosIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM recursos_administrativos WHERE id = ANY($1::text[])`,
        recursosIds,
      )
    }
    if (autosIds.length > 0) {
      // DefesaTecnica e RecursoAdministrativo usam onDelete: Cascade, mas limpamos
      // o que criamos explicitamente para não depender apenas de cascade
      await prisma.$executeRawUnsafe(
        `DELETE FROM defesas_tecnicas WHERE auto_id = ANY($1::text[])`,
        autosIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM recursos_administrativos WHERE auto_id = ANY($1::text[])`,
        autosIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM autos_infracao WHERE id = ANY($1::text[])`,
        autosIds,
      )
    }
    await app?.close()
    await prisma.$disconnect()
  })

  // ─── 1. Autenticação ────────────────────────────────────────────────────────

  it('bloqueia listagem de autos sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/fiscalizacoes' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia GET /:id sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/fiscalizacoes/00000000-0000-0000-0000-000000000000',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação de auto sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/fiscalizacoes',
      headers: { 'content-type': 'application/json' },
      payload: {
        empreendimentoId,
        orgao: 'CETESB',
        numeroAuto: uniqueNumeroAuto(),
        dataLavratura: '2026-01-15',
        descricao: 'Infração de teste',
        prazoDefesa: '2026-02-15',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem ─────────────────────────────────────────────────────────────

  it('lista autos do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/fiscalizacoes',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; orgao: string; status: string }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination).toBeDefined()
    expect(body.pagination.page).toBe(1)
  })

  it('aceita filtros de listagem — page e limit (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/fiscalizacoes?page=1&limit=5',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: unknown[]
      pagination: { limit: number }
    }
    expect(body.pagination.limit).toBe(5)
    expect(body.data.length).toBeLessThanOrEqual(5)
  })

  it('aceita filtro por empreendimentoId (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/fiscalizacoes?empreendimentoId=${empreendimentoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ empreendimento: { id: string } }> }
    for (const auto of body.data) {
      expect(auto.empreendimento.id).toBe(empreendimentoId)
    }
  })

  // ─── 3. Criação ─────────────────────────────────────────────────────────────

  let criadoId: string
  let criadoNumeroAuto: string

  it('cria auto de infração com payload válido (201)', async () => {
    criadoNumeroAuto = uniqueNumeroAuto()
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/fiscalizacoes',
      payload: {
        empreendimentoId,
        orgao: 'CETESB',
        numeroAuto: criadoNumeroAuto,
        dataLavratura: '2026-01-15',
        dataRecebimento: '2026-01-20',
        artigo: 'Art. 72',
        descricao: 'Armazenamento inadequado de resíduos',
        valorMulta: 5000.0,
        prazoDefesa: '2026-02-15',
        observacoes: 'Criado em teste automatizado',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        orgao: string
        numeroAuto: string
        status: string
        empreendimento: { id: string }
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.orgao).toBe('CETESB')
    expect(body.data.numeroAuto).toBe(criadoNumeroAuto)
    expect(body.data.status).toBe('RECEBIDO')
    expect(body.data.empreendimento.id).toBe(empreendimentoId)
    criadoId = body.data.id
    autosIds.push(criadoId)
  })

  // ─── 4. Busca por ID ────────────────────────────────────────────────────────

  it('retorna o auto criado pelo seu ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/fiscalizacoes/${criadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      id: string
      orgao: string
      numeroAuto: string
      status: string
      recursos: unknown[]
    }
    expect(body.id).toBe(criadoId)
    expect(body.orgao).toBe('CETESB')
    expect(body.numeroAuto).toBe(criadoNumeroAuto)
    expect(Array.isArray(body.recursos)).toBe(true)
  })

  it('retorna 404 para ID de auto inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/fiscalizacoes/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 5. Atualização de status ────────────────────────────────────────────────

  it('atualiza o status do auto (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/fiscalizacoes/${criadoId}/status`,
      payload: {
        status: 'EM_DEFESA',
        observacoes: 'Defesa em elaboração',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { status: string }
    expect(body.status).toBe('EM_DEFESA')
  })

  it('retorna 404 ao atualizar status de auto inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: '/api/v1/fiscalizacoes/00000000-0000-0000-0000-000000000099/status',
      payload: { status: 'ENCERRADO' },
    })
    expect(response.statusCode).toBe(404)
  })

  it('rejeita status inválido na atualização (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/fiscalizacoes/${criadoId}/status`,
      payload: { status: 'STATUS_INEXISTENTE' },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 6. Criação de recurso ────────────────────────────────────────────────────

  let recursoId: string

  it('cria recurso administrativo para o auto (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/fiscalizacoes/${criadoId}/recursos`,
      payload: {
        instancia: 'PRIMEIRA',
        dataProtocolo: '2026-02-10',
        prazoResposta: '2026-03-10',
        numeroProtocolo: 'PROT-TEST-001',
        observacoes: 'Recurso de teste automatizado',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        instancia: string
        resultado: string
        autoId: string
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.instancia).toBe('PRIMEIRA')
    expect(body.data.resultado).toBe('PENDENTE')
    expect(body.data.autoId).toBe(criadoId)
    recursoId = body.data.id
    recursosIds.push(recursoId)
  })

  it('criação de recurso atualiza status do auto para EM_RECURSO', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/fiscalizacoes/${criadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { status: string }
    expect(body.status).toBe('EM_RECURSO')
  })

  it('retorna 404 ao criar recurso para auto inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/fiscalizacoes/00000000-0000-0000-0000-000000000099/recursos',
      payload: {
        instancia: 'SEGUNDA',
        dataProtocolo: '2026-02-10',
      },
    })
    expect(response.statusCode).toBe(404)
  })

  it('rejeita criação de recurso com instancia inválida (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/fiscalizacoes/${criadoId}/recursos`,
      payload: {
        instancia: 'INVALIDA',
        dataProtocolo: '2026-02-10',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 7. Atualização de recurso ────────────────────────────────────────────────

  it('atualiza o resultado do recurso (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/fiscalizacoes/${criadoId}/recursos/${recursoId}`,
      payload: {
        resultado: 'FAVORAVEL',
        dataJulgamento: '2026-04-01',
        observacoes: 'Recurso deferido em teste',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { resultado: string }
    expect(body.resultado).toBe('FAVORAVEL')
  })

  it('resultado FAVORAVEL no recurso atualiza status do auto para JULGADO_FAVORAVEL', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/fiscalizacoes/${criadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { status: string }
    expect(body.status).toBe('JULGADO_FAVORAVEL')
  })

  it('retorna 404 ao atualizar recurso inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/fiscalizacoes/${criadoId}/recursos/00000000-0000-0000-0000-000000000099`,
      payload: { resultado: 'DESFAVORAVEL' },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 8. Transição DESFAVORAVEL ────────────────────────────────────────────────

  it('resultado DESFAVORAVEL no recurso atualiza status do auto para JULGADO_DESFAVORAVEL', async () => {
    // Cria um segundo auto e recurso para testar transição DESFAVORAVEL
    const auto2NumeroAuto = uniqueNumeroAuto()
    const criarAuto = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/fiscalizacoes',
      payload: {
        empreendimentoId,
        orgao: 'ANP',
        numeroAuto: auto2NumeroAuto,
        dataLavratura: '2026-01-20',
        descricao: 'Segundo auto de teste',
        prazoDefesa: '2026-02-20',
      },
    })
    expect(criarAuto.statusCode).toBe(201)
    const auto2Body = criarAuto.json() as { data: { id: string } }
    const auto2Id = auto2Body.data.id
    autosIds.push(auto2Id)

    const criarRecurso = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/fiscalizacoes/${auto2Id}/recursos`,
      payload: {
        instancia: 'SEGUNDA',
        dataProtocolo: '2026-02-15',
      },
    })
    expect(criarRecurso.statusCode).toBe(201)
    const recurso2Body = criarRecurso.json() as { data: { id: string } }
    const recurso2Id = recurso2Body.data.id
    recursosIds.push(recurso2Id)

    const atualizar = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/fiscalizacoes/${auto2Id}/recursos/${recurso2Id}`,
      payload: {
        resultado: 'DESFAVORAVEL',
        dataJulgamento: '2026-04-10',
      },
    })
    expect(atualizar.statusCode).toBe(200)

    const buscar = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/fiscalizacoes/${auto2Id}`,
    })
    expect(buscar.statusCode).toBe(200)
    const buscarBody = buscar.json() as { status: string }
    expect(buscarBody.status).toBe('JULGADO_DESFAVORAVEL')
  })

  // ─── 9. Validação de schema ──────────────────────────────────────────────────

  it('rejeita criação de auto sem orgao (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/fiscalizacoes',
      payload: {
        empreendimentoId,
        // orgao ausente
        numeroAuto: uniqueNumeroAuto(),
        dataLavratura: '2026-01-15',
        descricao: 'Teste sem orgao',
        prazoDefesa: '2026-02-15',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de auto sem descricao (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/fiscalizacoes',
      payload: {
        empreendimentoId,
        orgao: 'CETESB',
        numeroAuto: uniqueNumeroAuto(),
        dataLavratura: '2026-01-15',
        // descricao ausente
        prazoDefesa: '2026-02-15',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de auto com data de lavratura inválida (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/fiscalizacoes',
      payload: {
        empreendimentoId,
        orgao: 'CETESB',
        numeroAuto: uniqueNumeroAuto(),
        dataLavratura: 'data-invalida',
        descricao: 'Auto com data inválida',
        prazoDefesa: '2026-02-15',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de auto com empreendimentoId não-UUID (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/fiscalizacoes',
      payload: {
        empreendimentoId: 'nao-e-um-uuid',
        orgao: 'CETESB',
        numeroAuto: uniqueNumeroAuto(),
        dataLavratura: '2026-01-15',
        descricao: 'Auto com empreendimentoId inválido',
        prazoDefesa: '2026-02-15',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de recurso sem dataProtocolo (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/fiscalizacoes/${criadoId}/recursos`,
      payload: {
        instancia: 'PRIMEIRA',
        // dataProtocolo ausente
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 10. Analista pode listar e ler, não há restrição de 403 na rota (apenas autenticação) ──

  it('analista pode listar autos (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: '/api/v1/fiscalizacoes',
    })
    expect(response.statusCode).toBe(200)
  })

  it('analista pode buscar auto por ID (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: `/api/v1/fiscalizacoes/${criadoId}`,
    })
    expect(response.statusCode).toBe(200)
  })
})
