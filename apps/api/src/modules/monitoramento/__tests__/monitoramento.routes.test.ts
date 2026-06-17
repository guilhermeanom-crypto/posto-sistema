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

describeIntegration('API de monitoramento', () => {
  let app: AppInstance
  let adminToken: string
  let analistaToken: string

  let empreendimentoId: string
  let empreendimentoSecundarioId: string
  let foreignEmpreendimentoId: string

  // IDs criados nesta execução — usados no cleanup
  const pocoIds: string[] = []
  const campanhaIds: string[] = []
  const limiteIds: string[] = []

  // IDs dos fixtures principais
  let pocoCriadoId: string
  let campanhaCriadaId: string

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    adminToken = await loginDemo(app, 'admin@postodemo.com.br')
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')

    // Busca um empreendimento do tenant de demonstração para usar como FK
    const emp = await prisma.empreendimento.findFirst({
      where: { tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47' },
      select: { id: true },
    })
    if (!emp) throw new Error('Nenhum empreendimento encontrado para o tenant de demo. Execute o seed primeiro.')
    empreendimentoId = emp.id

    const empSecundario = await prisma.empreendimento.findFirst({
      where: {
        tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47',
        id: { not: empreendimentoId },
      },
      select: { id: true },
    })
    if (!empSecundario) throw new Error('Nenhum segundo empreendimento encontrado no tenant de demo.')
    empreendimentoSecundarioId = empSecundario.id

    const foreignEmp = await prisma.empreendimento.findFirst({
      where: { tenantId: { not: '173fa80b-edaf-47f8-92cf-7958da22ea47' } },
      select: { id: true },
    })
    if (!foreignEmp) throw new Error('Nenhum empreendimento de outro tenant encontrado.')
    foreignEmpreendimentoId = foreignEmp.id
  })

  afterAll(async () => {
    // Deleta na ordem de FK: parâmetros (cascade via onDelete), campanhas, poços, limites
    if (campanhaIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM campanhas_monitoramento WHERE id = ANY($1::text[])`,
        campanhaIds,
      )
    }
    if (pocoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM pocos_monitoramento WHERE id = ANY($1::text[])`,
        pocoIds,
      )
    }
    if (limiteIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM limites_parametros WHERE id = ANY($1::text[])`,
        limiteIds,
      )
    }

    await app?.close()
    await prisma.$disconnect()
  })

  // ─── 1. Autenticação — sem JWT deve retornar 401 ──────────────────────────────

  it('bloqueia listagem de poços sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/monitoramento/pocos' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia listagem de campanhas sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/monitoramento/campanhas' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia listagem de limites sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/monitoramento/limites' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação de poço sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/monitoramento/pocos',
      headers: { 'content-type': 'application/json' },
      payload: { empreendimentoId, codigo: 'PM-SEM-TOKEN' },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Poços de Monitoramento — listagem ──────────────────────────────────────

  it('lista poços do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/pocos',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: unknown[]
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(typeof body.pagination.total).toBe('number')
    expect(body.pagination.page).toBe(1)
  })

  it('aceita filtro por empreendimentoId na listagem de poços (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/monitoramento/pocos?empreendimentoId=${empreendimentoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ empreendimento: { id: string } }> }
    for (const poco of body.data) {
      expect(poco.empreendimento.id).toBe(empreendimentoId)
    }
  })

  // ─── 3. Poços de Monitoramento — criação ───────────────────────────────────────

  it('cria poço com payload válido (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/pocos',
      payload: {
        empreendimentoId,
        codigo: 'PM-TESTE-001',
        profundidade: 12.5,
        coordenadas: '-23.5505,-46.6333',
        dataInstalacao: '2024-01-15',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: { id: string; codigo: string; empreendimentoId: string; status: string }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.codigo).toBe('PM-TESTE-001')
    expect(body.data.empreendimentoId).toBe(empreendimentoId)
    expect(body.data.status).toBe('ATIVO')
    pocoCriadoId = body.data.id
    pocoIds.push(pocoCriadoId)
  })

  // ─── 4. Poços de Monitoramento — busca por ID ─────────────────────────────────

  it('retorna o poço criado pelo ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/monitoramento/pocos/${pocoCriadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: { id: string; codigo: string; campanhas: unknown[] }
    }
    expect(body.data.id).toBe(pocoCriadoId)
    expect(body.data.codigo).toBe('PM-TESTE-001')
    expect(Array.isArray(body.data.campanhas)).toBe(true)
  })

  it('retorna 404 para poço inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/pocos/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 5. Poços de Monitoramento — atualização ─────────────────────────────────

  it('atualiza poço (periodicidade e status) (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/monitoramento/pocos/${pocoCriadoId}`,
      payload: {
        periodicidade: 'TRIMESTRAL',
        status: 'ATIVO',
        proximaColeta: '2025-04-01',
        observacoes: 'Ajustado no teste de integração',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { periodicidade: string; status: string } }
    expect(body.data.periodicidade).toBe('TRIMESTRAL')
    expect(body.data.status).toBe('ATIVO')
  })

  it('retorna 404 ao atualizar poço inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: '/api/v1/monitoramento/pocos/00000000-0000-0000-0000-000000000099',
      payload: { status: 'INATIVO' },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 6. Poços — validação de schema ────────────────────────────────────────────

  it('rejeita criação de poço sem código (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/pocos',
      payload: {
        empreendimentoId,
        // codigo ausente
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de poço com empreendimentoId inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/pocos',
      payload: {
        empreendimentoId: 'nao-e-uuid',
        codigo: 'PM-INVALIDO',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de poço com empreendimento de outro tenant (404)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/pocos',
      payload: {
        empreendimentoId: foreignEmpreendimentoId,
        codigo: 'PM-EXTERNO',
      },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 7. Poços — tendência de parâmetros ──────────────────────────────────────

  it('retorna tendência de parâmetros do poço criado (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/monitoramento/pocos/${pocoCriadoId}/tendencia`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: unknown[] }
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('retorna 404 na tendência de poço inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/pocos/00000000-0000-0000-0000-000000000099/tendencia',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 8. Campanhas — listagem ──────────────────────────────────────────────────

  it('lista campanhas do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/campanhas',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: unknown[]
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(typeof body.pagination.total).toBe('number')
  })

  // ─── 9. Campanhas — criação ───────────────────────────────────────────────────

  it('cria campanha com payload válido incluindo poço e parâmetros (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/campanhas',
      payload: {
        empreendimentoId,
        pocoMonitoramentoId: pocoCriadoId,
        tipo: 'AGUA_SUBTERRANEA',
        dataColeta: '2025-03-10',
        laboratorio: 'Laboratório Teste LTDA',
        resultado: 'CONFORME',
        observacoes: 'Campanha criada no teste de integração',
        parametros: [
          { nome: 'Benzeno', valorMedido: 0.005, limiteVMP: 0.5, unidade: 'mg/L', emAlerta: false },
          { nome: 'Tolueno', valorMedido: 1.2, limiteVMP: 0.17, unidade: 'mg/L', emAlerta: true },
        ],
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        tipo: string
        resultado: string
        empreendimento: { id: string }
        parametros: Array<{ nome: string }>
        _count: { parametros: number }
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.tipo).toBe('AGUA_SUBTERRANEA')
    expect(body.data.resultado).toBe('CONFORME')
    expect(body.data.empreendimento.id).toBe(empreendimentoId)
    expect(body.data._count.parametros).toBe(2)
    campanhaCriadaId = body.data.id
    campanhaIds.push(campanhaCriadaId)
  })

  it('cria campanha sem poço (sem FK de poço) (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/campanhas',
      payload: {
        empreendimentoId,
        tipo: 'SOLO',
        dataColeta: '2025-04-01',
        laboratorio: 'Lab Solos Brasil',
        resultado: 'NAO_CONFORME',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as { data: { id: string; tipo: string } }
    expect(body.data.tipo).toBe('SOLO')
    campanhaIds.push(body.data.id)
  })

  it('rejeita campanha quando poço e empreendimento não combinam (400)', async () => {
    const otroPoco = await prisma.pocoMonitoramento.create({
      data: {
        tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47',
        empreendimentoId: empreendimentoSecundarioId,
        codigo: `PM-MISMATCH-${Date.now()}`,
      },
      select: { id: true },
    })
    pocoIds.push(otroPoco.id)

    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/campanhas',
      payload: {
        empreendimentoId,
        pocoMonitoramentoId: otroPoco.id,
        tipo: 'SOLO',
        dataColeta: '2025-04-15',
        laboratorio: 'Lab Mismatch',
        resultado: 'CONFORME',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 10. Campanhas — busca por ID ────────────────────────────────────────────

  it('retorna a campanha criada pelo ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/monitoramento/campanhas/${campanhaCriadaId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: { id: string; pocoMonitoramento: { id: string } | null; parametros: unknown[] }
    }
    expect(body.data.id).toBe(campanhaCriadaId)
    expect(body.data.pocoMonitoramento?.id).toBe(pocoCriadoId)
    expect(Array.isArray(body.data.parametros)).toBe(true)
    expect(body.data.parametros.length).toBe(2)
  })

  it('retorna 404 para campanha inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/campanhas/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 11. Campanhas — validação de schema ─────────────────────────────────────

  it('rejeita campanha com tipo inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/campanhas',
      payload: {
        empreendimentoId,
        tipo: 'FOGO', // não existe no enum
        dataColeta: '2025-04-01',
        laboratorio: 'Lab X',
        resultado: 'CONFORME',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita campanha sem laboratorio (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/campanhas',
      payload: {
        empreendimentoId,
        tipo: 'SOLO',
        dataColeta: '2025-04-01',
        resultado: 'CONFORME',
        // laboratorio ausente
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita campanha com dataColeta em formato inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/monitoramento/campanhas',
      payload: {
        empreendimentoId,
        tipo: 'VAPOR',
        dataColeta: '01/04/2025', // formato incorreto, esperado YYYY-MM-DD
        laboratorio: 'Lab X',
        resultado: 'CONFORME',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 12. Campanhas — filtros de listagem ─────────────────────────────────────

  it('filtra campanhas por tipo (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/campanhas?tipo=AGUA_SUBTERRANEA',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ tipo: string }> }
    for (const c of body.data) {
      expect(c.tipo).toBe('AGUA_SUBTERRANEA')
    }
  })

  it('filtra campanhas por resultado (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/campanhas?resultado=NAO_CONFORME',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ resultado: string }> }
    for (const c of body.data) {
      expect(c.resultado).toBe('NAO_CONFORME')
    }
  })

  // ─── 13. Limites de Parâmetros — listagem e upsert ───────────────────────────

  it('lista limites do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/limites',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: unknown[] }
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('cria ou atualiza limite via PUT (upsert) (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PUT',
      url: '/api/v1/monitoramento/limites',
      payload: {
        nomeParametro: 'Benzeno-Teste-Integracao',
        tipoMedio: 'AGUA_SUBTERRANEA',
        limiteVMP: 0.5,
        unidade: 'mg/L',
        referencia: 'CONAMA 420/2009',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: { id: string; nomeParametro: string; tipoMedio: string; limiteVMP: string | number }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.nomeParametro).toBe('Benzeno-Teste-Integracao')
    expect(body.data.tipoMedio).toBe('AGUA_SUBTERRANEA')
    limiteIds.push(body.data.id)
  })

  it('filtra limites por tipoMedio (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/limites?tipoMedio=AGUA_SUBTERRANEA',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ tipoMedio: string }> }
    for (const l of body.data) {
      expect(l.tipoMedio).toBe('AGUA_SUBTERRANEA')
    }
  })

  it('deleta limite criado (204)', async () => {
    // Garante que o limite já foi criado antes de tentar deletar
    expect(limiteIds.length).toBeGreaterThan(0)
    const idParaDeletar = limiteIds[0]!
    const response = await authedRequest(app, adminToken, {
      method: 'DELETE',
      url: `/api/v1/monitoramento/limites/${idParaDeletar}`,
    })
    expect(response.statusCode).toBe(204)
    // Remove do array de cleanup pois já foi deletado
    limiteIds.splice(0, 1)
  })

  it('retorna 404 ao deletar limite inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'DELETE',
      url: '/api/v1/monitoramento/limites/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  it('rejeita PUT de limite com tipoMedio inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PUT',
      url: '/api/v1/monitoramento/limites',
      payload: {
        nomeParametro: 'Parametro X',
        tipoMedio: 'PLASMA', // não existe no enum
        limiteVMP: 1.0,
        unidade: 'mg/L',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 14. Analista pode listar (sem restrição de perfil nos GET) ───────────────

  it('analista consegue listar poços (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/pocos',
    })
    expect(response.statusCode).toBe(200)
  })

  it('analista consegue listar campanhas (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: '/api/v1/monitoramento/campanhas',
    })
    expect(response.statusCode).toBe(200)
  })
})
