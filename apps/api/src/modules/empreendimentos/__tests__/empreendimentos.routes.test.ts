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

// Sufixo único por execução para evitar colisões de CNPJ/nome entre runs
const RUN_SUFFIX = Date.now().toString().slice(-6)

// Retorna uma empresa do tenant demo para ser usada como empresaId nos payloads
async function getEmpresaDemoId(): Promise<string> {
  const empresa = await prisma.empresa.findFirst({
    where: { cnpj: '12345678000100' },
    select: { id: true },
  })
  if (!empresa) throw new Error('Empresa demo não encontrada no banco. Execute o seed primeiro.')
  return empresa.id
}

function buildPayload(empresaId: string, suffix = RUN_SUFFIX) {
  return {
    empresaId,
    nome: `Posto Teste ${suffix}`,
    nomeFantasia: `PT-${suffix}`,
    cnpj: `${suffix.padStart(8, '0')}000100`,
    codigoInterno: `TST-${suffix}`,
    bandeira: 'Ipiranga',
    tipo: 'revendedor' as const,
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Loja 01',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP' as const,
    cep: '01310100',
    atividades: ['Revenda de combustíveis', 'Troca de óleo'],
    dataInicioOperacao: '2020-03-15',
  }
}

describeIntegration('API de empreendimentos', () => {
  let app: AppInstance
  let accessToken: string
  let empresaId: string
  const empreendimentoIds: string[] = []
  const tokenPortalIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    accessToken = await loginDemo(app)
    empresaId = await getEmpresaDemoId()
  })

  afterAll(async () => {
    // Remover tokens de portal criados automaticamente pelo service (contatoEmail)
    if (tokenPortalIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM tokens_portal WHERE empreendimento_id = ANY($1::text[])`,
        empreendimentoIds,
      )
    }
    if (empreendimentoIds.length > 0) {
      // Remover acessos de equipe antes de remover o empreendimento
      await prisma.$executeRawUnsafe(
        `DELETE FROM empreendimento_acessos WHERE empreendimento_id = ANY($1::text[])`,
        empreendimentoIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM empreendimentos WHERE id = ANY($1::text[])`,
        empreendimentoIds,
      )
    }

    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  })

  // ── Autenticação ────────────────────────────────────────────────────────────

  it('bloqueia listagem sem JWT', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/empreendimentos',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação sem JWT', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/empreendimentos',
      headers: { 'content-type': 'application/json' },
      payload: buildPayload(empresaId),
    })
    expect(response.statusCode).toBe(401)
  })

  // ── Listagem ────────────────────────────────────────────────────────────────

  it('lista empreendimentos do tenant com paginação', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/empreendimentos?page=1&limit=10',
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: Array<Record<string, unknown>>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }

    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination).toMatchObject({
      page: 1,
      limit: 10,
    })
    expect(typeof body.pagination.total).toBe('number')
    expect(typeof body.pagination.totalPages).toBe('number')
    expect(body.pagination.totalPages).toBeGreaterThanOrEqual(1)
  })

  // ── Criação ─────────────────────────────────────────────────────────────────

  it('cria empreendimento com payload válido e retorna 201', async () => {
    const payload = buildPayload(empresaId)
    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/empreendimentos',
      payload,
    })

    expect(response.statusCode).toBe(201)

    const body = response.json() as {
      data: {
        id: string
        nome: string
        cnpj: string
        cidade: string
        estado: string
        ativo: boolean
        atividades: string[]
      }
    }

    expect(body.data.id).toBeTruthy()
    expect(body.data.nome).toBe(payload.nome)
    expect(body.data.cnpj).toBe(payload.cnpj)
    expect(body.data.cidade).toBe(payload.cidade)
    expect(body.data.estado).toBe(payload.estado)
    expect(body.data.ativo).toBe(true)
    expect(body.data.atividades).toEqual(payload.atividades)

    empreendimentoIds.push(body.data.id)
  })

  it('rejeita criação sem o campo obrigatório "atividades" (400)', async () => {
    const payload = buildPayload(empresaId, `${RUN_SUFFIX}x`)
    const { atividades: _dropped, ...payloadSemAtividades } = payload

    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/empreendimentos',
      payload: payloadSemAtividades,
    })

    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação com array "atividades" vazio (400)', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/empreendimentos',
      payload: { ...buildPayload(empresaId, `${RUN_SUFFIX}y`), atividades: [] },
    })

    expect(response.statusCode).toBe(400)
  })

  // ── Busca por ID ─────────────────────────────────────────────────────────────

  it('retorna empreendimento criado pelo ID (200)', async () => {
    const id = empreendimentoIds[0]
    if (!id) throw new Error('Nenhum empreendimento criado nos testes anteriores')

    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: `/api/v1/empreendimentos/${id}`,
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as { data: { id: string; nome: string } }
    expect(body.data.id).toBe(id)
    expect(body.data.nome).toBe(buildPayload(empresaId).nome)
  })

  it('retorna 404 para ID inexistente', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/empreendimentos/11111111-1111-1111-1111-111111111111',
    })

    expect(response.statusCode).toBe(404)
  })

  // ── Atualização ──────────────────────────────────────────────────────────────

  it('atualiza empreendimento e reflete a mudança (200)', async () => {
    const id = empreendimentoIds[0]
    if (!id) throw new Error('Nenhum empreendimento criado nos testes anteriores')

    const novoNomeFantasia = `PT-Atualizado-${RUN_SUFFIX}`

    const response = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/empreendimentos/${id}`,
      payload: { nomeFantasia: novoNomeFantasia },
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as { data: { id: string; nomeFantasia: string } }
    expect(body.data.id).toBe(id)
    expect(body.data.nomeFantasia).toBe(novoNomeFantasia)
  })

  it('retorna 404 ao tentar atualizar ID inexistente', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: '/api/v1/empreendimentos/11111111-1111-1111-1111-111111111111',
      payload: { nomeFantasia: 'Qualquer nome' },
    })

    expect(response.statusCode).toBe(404)
  })

  // ── Filtros ──────────────────────────────────────────────────────────────────

  it('filtra empreendimentos por estado', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/empreendimentos?estado=SP&limit=50',
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: Array<{ estado: string }>
      pagination: { total: number }
    }

    expect(body.data.every((e) => e.estado === 'SP')).toBe(true)
  })

  it('busca empreendimento pelo nome via parâmetro busca', async () => {
    const id = empreendimentoIds[0]
    if (!id) throw new Error('Nenhum empreendimento criado nos testes anteriores')

    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: `/api/v1/empreendimentos?busca=Posto+Teste+${RUN_SUFFIX}`,
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as { data: Array<{ id: string }> }
    const encontrado = body.data.find((e) => e.id === id)
    expect(encontrado).toBeTruthy()
  })

  // ── Equipe ───────────────────────────────────────────────────────────────────

  it('lista equipe do empreendimento criado (200)', async () => {
    const id = empreendimentoIds[0]
    if (!id) throw new Error('Nenhum empreendimento criado nos testes anteriores')

    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: `/api/v1/empreendimentos/${id}/equipe`,
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as { data: unknown[] }
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('adiciona usuário à equipe do empreendimento (201)', async () => {
    const id = empreendimentoIds[0]
    if (!id) throw new Error('Nenhum empreendimento criado nos testes anteriores')

    // Buscar o usuário analista do seed demo
    const analista = await prisma.usuario.findFirst({
      where: { email: 'analista@postodemo.com.br' },
      select: { id: true },
    })
    if (!analista) throw new Error('Usuário analista demo não encontrado')

    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: `/api/v1/empreendimentos/${id}/equipe`,
      payload: { usuarioId: analista.id },
    })

    expect(response.statusCode).toBe(201)

    const body = response.json() as { data: { ok: boolean } }
    expect(body.data.ok).toBe(true)
  })

  it('remove usuário da equipe do empreendimento (204)', async () => {
    const id = empreendimentoIds[0]
    if (!id) throw new Error('Nenhum empreendimento criado nos testes anteriores')

    const analista = await prisma.usuario.findFirst({
      where: { email: 'analista@postodemo.com.br' },
      select: { id: true },
    })
    if (!analista) throw new Error('Usuário analista demo não encontrado')

    const response = await authedRequest(app, accessToken, {
      method: 'DELETE',
      url: `/api/v1/empreendimentos/${id}/equipe/${analista.id}`,
    })

    expect(response.statusCode).toBe(204)
  })

  // ── Soft delete ──────────────────────────────────────────────────────────────

  it('desativa (soft delete) empreendimento e retorna 204', async () => {
    // Criar um empreendimento dedicado para este teste de deleção
    const suffix = `${RUN_SUFFIX}2`
    const payload = buildPayload(empresaId, suffix)

    // Ajustar CNPJ para ser único (14 dígitos numéricos)
    payload.cnpj = `${RUN_SUFFIX.padStart(8, '0')}000199`

    const criar = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/empreendimentos',
      payload,
    })
    expect(criar.statusCode).toBe(201)

    const { id } = (criar.json() as { data: { id: string } }).data
    empreendimentoIds.push(id)

    const deletar = await authedRequest(app, accessToken, {
      method: 'DELETE',
      url: `/api/v1/empreendimentos/${id}`,
    })

    expect(deletar.statusCode).toBe(204)

    // Confirmar que o registro ficou com ativo=false no banco
    const registro = await prisma.empreendimento.findUnique({ where: { id } })
    expect(registro?.ativo).toBe(false)
  })
})
