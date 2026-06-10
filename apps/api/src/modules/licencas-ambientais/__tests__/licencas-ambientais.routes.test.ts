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

describeIntegration('API de licenças ambientais', () => {
  let app: AppInstance
  let adminToken: string
  let analistaToken: string
  let empreendimentoId: string

  // IDs criados durante os testes, para limpeza no afterAll
  const licencaIds: string[] = []
  const condicaoIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    adminToken = await loginDemo(app, 'admin@postodemo.com.br')
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')

    // Busca um empreendimento do tenant demo para usar como FK
    const empreendimento = await prisma.empreendimento.findFirst({
      where: { tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47' },
      select: { id: true },
    })
    if (!empreendimento) throw new Error('Nenhum empreendimento seed encontrado para o tenant demo')
    empreendimentoId = empreendimento.id
  })

  afterAll(async () => {
    // Remove condições primeiro (FK → licenca), depois licenças
    if (condicaoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM condicoes_licenca WHERE id = ANY($1::text[])`,
        condicaoIds,
      )
    }
    if (licencaIds.length > 0) {
      // Cascade garante remoção das condições, mas já limpamos acima por segurança
      await prisma.$executeRawUnsafe(
        `DELETE FROM licencas_ambientais WHERE id = ANY($1::text[])`,
        licencaIds,
      )
    }
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  })

  // ─── 1. Autenticação ────────────────────────────────────────────────────────

  it('bloqueia listagem sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/licencas-ambientais' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia GET /:id sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/licencas-ambientais/00000000-0000-0000-0000-000000000000',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/licencas-ambientais',
      headers: { 'content-type': 'application/json' },
      payload: {
        empreendimentoId,
        tipo: 'LO',
        numero: 'LA-001/2026',
        orgaoEmissor: 'SEMAD',
        dataEmissao: '2025-01-01',
        dataVencimento: '2027-01-01',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem ────────────────────────────────────────────────────────────

  it('lista licenças do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/licencas-ambientais',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; tipo: string; numero: string; status: string }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination.page).toBe(1)
    expect(typeof body.pagination.total).toBe('number')
  })

  it('aceita filtro por status (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/licencas-ambientais?status=VIGENTE',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ status: string }> }
    for (const item of body.data) {
      expect(item.status).toBe('VIGENTE')
    }
  })

  it('aceita filtro por tipo (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/licencas-ambientais?tipo=LO',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ tipo: string }> }
    for (const item of body.data) {
      expect(item.tipo).toBe('LO')
    }
  })

  it('aceita filtro por empreendimentoId (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/licencas-ambientais?empreendimentoId=${empreendimentoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: unknown[] }
    expect(Array.isArray(body.data)).toBe(true)
  })

  // ─── 3. Criação ─────────────────────────────────────────────────────────────

  let licencaId: string

  it('cria licença com payload válido (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/licencas-ambientais',
      payload: {
        empreendimentoId,
        tipo: 'LO',
        numero: `LO-TESTE-${Date.now()}`,
        orgaoEmissor: 'SEMAD-GO',
        responsavelTecnico: 'Eng. Teste',
        dataEmissao: '2025-01-15',
        dataVencimento: '2027-01-15',
        observacoes: 'Criado por teste automatizado',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        tipo: string
        numero: string
        orgaoEmissor: string
        status: string
        empreendimento: { id: string; nome: string }
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.tipo).toBe('LO')
    expect(body.data.orgaoEmissor).toBe('SEMAD-GO')
    expect(['VIGENTE', 'A_RENOVAR', 'VENCIDA']).toContain(body.data.status)
    expect(body.data.empreendimento.id).toBe(empreendimentoId)
    licencaId = body.data.id
    licencaIds.push(licencaId)
  })

  it('cria licença sem campos opcionais (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/licencas-ambientais',
      payload: {
        empreendimentoId,
        tipo: 'LP',
        numero: `LP-TESTE-${Date.now()}`,
        orgaoEmissor: 'IBAMA',
        dataEmissao: '2024-06-01',
        dataVencimento: '2026-06-01',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as { data: { id: string; tipo: string } }
    expect(body.data.id).toBeTruthy()
    expect(body.data.tipo).toBe('LP')
    licencaIds.push(body.data.id)
  })

  // ─── 4. Busca por ID ────────────────────────────────────────────────────────

  it('retorna a licença criada pelo seu ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/licencas-ambientais/${licencaId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: {
        id: string
        tipo: string
        condicoes: unknown[]
        empreendimento: { id: string }
      }
    }
    expect(body.data.id).toBe(licencaId)
    expect(body.data.tipo).toBe('LO')
    expect(Array.isArray(body.data.condicoes)).toBe(true)
    expect(body.data.empreendimento.id).toBe(empreendimentoId)
  })

  it('retorna 404 para ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/licencas-ambientais/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 5. Atualização ─────────────────────────────────────────────────────────

  it('atualiza campos da licença (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/licencas-ambientais/${licencaId}`,
      payload: {
        orgaoEmissor: 'SEMARH-GO',
        observacoes: 'Atualizado por teste automatizado',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; orgaoEmissor: string; observacoes: string } }
    expect(body.data.id).toBe(licencaId)
    expect(body.data.orgaoEmissor).toBe('SEMARH-GO')
    expect(body.data.observacoes).toBe('Atualizado por teste automatizado')
  })

  it('atualiza status da licença para SUSPENSA (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/licencas-ambientais/${licencaId}`,
      payload: { status: 'SUSPENSA' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { status: string } }
    expect(body.data.status).toBe('SUSPENSA')
  })

  it('retorna 404 ao atualizar ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: '/api/v1/licencas-ambientais/00000000-0000-0000-0000-000000000099',
      payload: { orgaoEmissor: 'IBAMA' },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 6. Condições ───────────────────────────────────────────────────────────

  let condicaoId: string

  it('lista condições da licença (200, lista vazia inicialmente)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/licencas-ambientais/${licencaId}/condicoes`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: unknown[] }
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('cria condição na licença (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/licencas-ambientais/${licencaId}/condicoes`,
      payload: {
        numero: '1.1',
        descricao: 'Instalar sistema de monitoramento de efluentes',
        prazo: '2027-06-30',
        status: 'PENDENTE',
        observacoes: 'Conforme condicionante da licença',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: { id: string; descricao: string; status: string; licencaId: string }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.descricao).toBe('Instalar sistema de monitoramento de efluentes')
    expect(body.data.status).toBe('PENDENTE')
    condicaoId = body.data.id
    condicaoIds.push(condicaoId)
  })

  it('cria condição sem campos opcionais (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/licencas-ambientais/${licencaId}/condicoes`,
      payload: {
        descricao: 'Condição mínima sem prazo',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as { data: { id: string; status: string } }
    expect(body.data.id).toBeTruthy()
    // status padrão deve ser PENDENTE quando não informado
    expect(body.data.status).toBe('PENDENTE')
    condicaoIds.push(body.data.id)
  })

  it('lista condições após criação (200, com itens)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/licencas-ambientais/${licencaId}/condicoes`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ id: string }> }
    expect(body.data.length).toBeGreaterThanOrEqual(2)
  })

  it('atualiza condição da licença (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/licencas-ambientais/${licencaId}/condicoes/${condicaoId}`,
      payload: {
        status: 'EM_CUMPRIMENTO',
        observacoes: 'Sistema em fase de instalação',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; status: string; observacoes: string } }
    expect(body.data.id).toBe(condicaoId)
    expect(body.data.status).toBe('EM_CUMPRIMENTO')
    expect(body.data.observacoes).toBe('Sistema em fase de instalação')
  })

  it('retorna 404 ao atualizar condição de licença inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/licencas-ambientais/00000000-0000-0000-0000-000000000099/condicoes/${condicaoId}`,
      payload: { status: 'CUMPRIDA' },
    })
    expect(response.statusCode).toBe(404)
  })

  it('retorna 404 ao atualizar condicaoId inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/licencas-ambientais/${licencaId}/condicoes/00000000-0000-0000-0000-000000000099`,
      payload: { status: 'CUMPRIDA' },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 7. Validação de schema ─────────────────────────────────────────────────

  it('rejeita criação sem número (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/licencas-ambientais',
      payload: {
        empreendimentoId,
        tipo: 'LO',
        // numero ausente
        orgaoEmissor: 'SEMAD',
        dataEmissao: '2025-01-01',
        dataVencimento: '2027-01-01',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação com tipo inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/licencas-ambientais',
      payload: {
        empreendimentoId,
        tipo: 'TIPO_INVALIDO',
        numero: 'LA-001',
        orgaoEmissor: 'SEMAD',
        dataEmissao: '2025-01-01',
        dataVencimento: '2027-01-01',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação com formato de data inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/licencas-ambientais',
      payload: {
        empreendimentoId,
        tipo: 'LO',
        numero: 'LA-001',
        orgaoEmissor: 'SEMAD',
        dataEmissao: '01/01/2025', // formato errado
        dataVencimento: '2027-01-01',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação com empreendimentoId inválido (não UUID) (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/licencas-ambientais',
      payload: {
        empreendimentoId: 'nao-e-um-uuid',
        tipo: 'LO',
        numero: 'LA-001',
        orgaoEmissor: 'SEMAD',
        dataEmissao: '2025-01-01',
        dataVencimento: '2027-01-01',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de condição sem descricao (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/licencas-ambientais/${licencaId}/condicoes`,
      payload: {
        numero: '2.1',
        // descricao ausente
        prazo: '2027-06-30',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita atualização com status inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/licencas-ambientais/${licencaId}`,
      payload: { status: 'STATUS_INVALIDO' },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 8. Analista pode listar e criar (sem restrição de permissão definida) ──

  it('analista consegue listar licenças (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: '/api/v1/licencas-ambientais',
    })
    expect(response.statusCode).toBe(200)
  })

  it('analista consegue buscar licença por ID (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: `/api/v1/licencas-ambientais/${licencaId}`,
    })
    expect(response.statusCode).toBe(200)
  })
})
