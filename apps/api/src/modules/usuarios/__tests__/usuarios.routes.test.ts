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

// Suffix único por execução para evitar colisões de email entre runs paralelos
let _counter = 0
function uniqueEmail() {
  _counter += 1
  const rand = Math.random().toString(36).slice(2, 8)
  return `teste-${rand}-${_counter}@postodemo.com.br`
}

describeIntegration('API de usuários', () => {
  let app: AppInstance
  let adminToken: string
  let analistaToken: string
  const usuarioIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    adminToken = await loginDemo(app, 'admin@postodemo.com.br')
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')
  })

  afterAll(async () => {
    if (usuarioIds.length > 0) {
      // Remove refresh sessions first (FK constraint)
      await prisma.$executeRawUnsafe(
        `DELETE FROM sessoes_refresh WHERE usuario_id = ANY($1::text[])`,
        usuarioIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM usuarios WHERE id = ANY($1::text[])`,
        usuarioIds,
      )
    }
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  })

  // ─── 1. Autenticação ────────────────────────────────────────────────────────

  it('bloqueia listagem de usuários sem JWT', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/usuarios' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia GET /:id sem JWT', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/usuarios/00000000-0000-0000-0000-000000000000',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação de usuário sem JWT', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/usuarios',
      headers: { 'content-type': 'application/json' },
      payload: {
        nome: 'Sem Token',
        email: uniqueEmail(),
        senha: 'Senha@1234',
        perfil: 'ANALISTA',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem ────────────────────────────────────────────────────────────

  it('lista usuários do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/usuarios',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; nome: string; email: string; perfil: string; ativo: boolean }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination.total).toBeGreaterThanOrEqual(1)
    expect(body.pagination.page).toBe(1)
    // Garante que a senha hash nunca vaza na listagem
    for (const u of body.data) {
      expect(u).not.toHaveProperty('senhaHash')
    }
  })

  it('aceita filtro por perfil (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/usuarios?perfil=ANALISTA',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ perfil: string }> }
    for (const u of body.data) {
      expect(u.perfil).toBe('ANALISTA')
    }
  })

  // ─── 3. Criação ─────────────────────────────────────────────────────────────

  let criadoId: string
  let criadoEmail: string

  it('cria usuário com payload válido (201)', async () => {
    criadoEmail = uniqueEmail()
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/usuarios',
      payload: {
        nome: 'Usuário de Teste',
        email: criadoEmail,
        senha: 'Teste@5678',
        perfil: 'ANALISTA',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: { id: string; nome: string; email: string; perfil: string; criadoEm: string }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.nome).toBe('Usuário de Teste')
    expect(body.data.email).toBe(criadoEmail)
    expect(body.data.perfil).toBe('ANALISTA')
    // A senha hash NUNCA deve estar na resposta
    expect(body.data).not.toHaveProperty('senhaHash')
    expect(body.data).not.toHaveProperty('senha')
    criadoId = body.data.id
    usuarioIds.push(criadoId)
  })

  // ─── 4. Busca por ID ────────────────────────────────────────────────────────

  it('retorna o usuário criado pelo seu ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/usuarios/${criadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: { id: string; nome: string; email: string; perfil: string }
    }
    expect(body.data.id).toBe(criadoId)
    expect(body.data.email).toBe(criadoEmail)
    expect(body.data).not.toHaveProperty('senhaHash')
  })

  it('retorna 404 para ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/usuarios/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 5. E-mail duplicado ────────────────────────────────────────────────────

  it('rejeita criação com e-mail já cadastrado (409)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/usuarios',
      payload: {
        nome: 'Outro Nome',
        email: criadoEmail, // mesmo e-mail do teste anterior
        senha: 'Teste@9999',
        perfil: 'COORDENADOR',
      },
    })
    expect(response.statusCode).toBe(409)
  })

  // ─── 6. Atualização ─────────────────────────────────────────────────────────

  it('atualiza nome do usuário (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/usuarios/${criadoId}`,
      payload: { nome: 'Nome Atualizado' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; nome: string } }
    expect(body.data.nome).toBe('Nome Atualizado')
    expect(body.data.id).toBe(criadoId)
  })

  // ─── 7. Permissões ──────────────────────────────────────────────────────────

  it('bloqueia criação de usuário por perfil ANALISTA (403)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'POST',
      url: '/api/v1/usuarios',
      payload: {
        nome: 'Tentativa Analista',
        email: uniqueEmail(),
        senha: 'Teste@1234',
        perfil: 'ANALISTA',
      },
    })
    expect(response.statusCode).toBe(403)
  })

  it('bloqueia alteração de perfil por perfil ANALISTA (403)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/usuarios/${criadoId}/perfil`,
      payload: { perfil: 'COORDENADOR' },
    })
    expect(response.statusCode).toBe(403)
  })

  it('bloqueia desativação de usuário por perfil ANALISTA (403)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'DELETE',
      url: `/api/v1/usuarios/${criadoId}`,
    })
    expect(response.statusCode).toBe(403)
  })

  // ─── 8. Alteração de perfil ─────────────────────────────────────────────────

  it('altera perfil do usuário criado para COORDENADOR (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/usuarios/${criadoId}/perfil`,
      payload: { perfil: 'COORDENADOR' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { perfil: string } }
    expect(body.data.perfil).toBe('COORDENADOR')
  })

  // ─── 9. Desativação ────────────────────────────────────────────────────────

  it('desativa o usuário criado (204)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'DELETE',
      url: `/api/v1/usuarios/${criadoId}`,
    })
    expect(response.statusCode).toBe(204)
  })

  it('impede admin de desativar a própria conta (403)', async () => {
    // Primeiro obtemos o ID do admin logado via /auth/me
    const meResponse = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/auth/me',
    })
    expect(meResponse.statusCode).toBe(200)
    const meBody = meResponse.json() as { data: { id: string } }
    const adminId = meBody.data.id

    const response = await authedRequest(app, adminToken, {
      method: 'DELETE',
      url: `/api/v1/usuarios/${adminId}`,
    })
    expect(response.statusCode).toBe(403)
  })

  // ─── 10. Validação de schema ────────────────────────────────────────────────

  it('rejeita criação sem nome (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/usuarios',
      payload: {
        email: uniqueEmail(),
        senha: 'Teste@1234',
        perfil: 'ANALISTA',
        // nome ausente
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação com senha fraca (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/usuarios',
      payload: {
        nome: 'Senha Fraca',
        email: uniqueEmail(),
        senha: '123', // sem maiúscula, curta
        perfil: 'ANALISTA',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação com perfil inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/usuarios',
      payload: {
        nome: 'Perfil Inválido',
        email: uniqueEmail(),
        senha: 'Teste@1234',
        perfil: 'DIRETOR', // perfil não existe no enum
      },
    })
    expect(response.statusCode).toBe(400)
  })
})
