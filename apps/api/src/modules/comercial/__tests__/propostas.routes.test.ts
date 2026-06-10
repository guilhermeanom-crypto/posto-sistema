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
    queueAdd,
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
          if (redisStore.delete(key)) {
            removidos += 1
          }
        }
        return removidos
      }),
      exists: vi.fn(async (...keys: string[]) => keys.filter((key) => redisStore.has(key)).length),
      expire: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(-1),
    },
  }
})

vi.mock('bullmq', () => ({
  Queue: testDoubles.QueueMock,
}))

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

describeIntegration('API de propostas comerciais', () => {
  let app: AppInstance
  let accessToken: string
  const propostaIds: string[] = []
  const diagnosticoIds: string[] = []
  const handoffIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    accessToken = await loginDemo(app)
  })

  afterAll(async () => {
    if (handoffIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM handoffs_comerciais WHERE id = ANY($1::text[])`,
        handoffIds,
      )
    }
    if (propostaIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM propostas_comerciais WHERE id = ANY($1::text[])`,
        propostaIds,
      )
    }
    if (diagnosticoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM diagnosticos_comerciais WHERE id = ANY($1::text[])`,
        diagnosticoIds,
      )
    }

    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  })

  it('bloqueia criação de proposta sem JWT', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/comercial/propostas',
      payload: buildPayload(),
    })

    expect(response.statusCode).toBe(401)
  })

  it('bloqueia atualização de proposta sem JWT', async () => {
    const proposta = await createProposal(app, accessToken, propostaIds, diagnosticoIds)

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/comercial/propostas/${proposta.id}`,
      payload: { status: 'PRONTA' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('bloqueia download de PDF sem JWT', async () => {
    const proposta = await createProposal(app, accessToken, propostaIds, diagnosticoIds)

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/comercial/propostas/${proposta.id}/pdf`,
    })

    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação de handoff sem JWT', async () => {
    const proposta = await createApprovedProposal(app, accessToken, propostaIds, diagnosticoIds)

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/comercial/propostas/${proposta.id}/handoff`,
    })

    expect(response.statusCode).toBe(401)
  })

  it('cria proposta comercial persistida sem expor snapshots ou campos sensíveis', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/propostas',
      payload: buildPayload(),
    })

    expect(response.statusCode).toBe(201)

    const body = response.json() as {
      data: {
        id: string
        status: string
        numero: string
        observacoesComerciais: string | null
        totalMinimo: number
        totalBase: number
        totalMaximo: number
        itens: Array<Record<string, unknown> & { codigoServico: string }>
        diagnostico: {
          id: string
          riscoGeral: { score: number; nivel: string }
          cnaePrincipal: { codigo: string }
        }
      }
    }

    propostaIds.push(body.data.id)
    diagnosticoIds.push(body.data.diagnostico.id)

    expect(body.data.status).toBe('RASCUNHO')
    expect(body.data.numero).toMatch(/^PROP-\d{4}-[A-Z0-9]{8}$/)
    expect(body.data.observacoesComerciais).toBe('Proposta inicial para triagem crítica.')
    expect(body.data.totalMinimo).toBe(15500)
    expect(body.data.totalBase).toBe(27000)
    expect(body.data.totalMaximo).toBe(52000)
    expect(body.data.diagnostico.cnaePrincipal.codigo).toBe('4731-8/00')
    expect(body.data.diagnostico.riscoGeral).toEqual({ score: 90, nivel: 'CRITICO' })
    expect(body.data.itens.map((item) => item.codigoServico)).toEqual(['LIC-004', 'LIC-008', 'LIC-011'])

    expect(body.data).not.toHaveProperty('observacoesInternas')
    expect(body.data.diagnostico).not.toHaveProperty('inputSnapshot')
    expect(body.data.diagnostico).not.toHaveProperty('resultadoSnapshot')

    for (const item of body.data.itens) {
      expect(item).not.toHaveProperty('snapshotCatalogo')
      expect(item).not.toHaveProperty('custoInternoEstimado')
      expect(item).not.toHaveProperty('margemLucroAlvo')
      expect(item).not.toHaveProperty('valorReferenciaHora')
      expect(item).not.toHaveProperty('metadata')
    }

    const persisted = await prisma.$queryRaw<Array<{
      proposta_id: string
      itens_quantidade: number
      cnae_principal_codigo: string
      resultado_snapshot: unknown
    }>>`
      SELECT
        p.id AS proposta_id,
        COUNT(i.id)::int AS itens_quantidade,
        d.cnae_principal_codigo,
        d.resultado_snapshot
      FROM propostas_comerciais p
      INNER JOIN diagnosticos_comerciais d ON d.id = p.diagnostico_id
      LEFT JOIN itens_proposta i ON i.proposta_id = p.id
      WHERE p.id = ${body.data.id}
      GROUP BY p.id, d.cnae_principal_codigo, d.resultado_snapshot
    `

    expect(persisted).toHaveLength(1)
    expect(persisted[0]?.itens_quantidade).toBe(3)
    expect(persisted[0]?.cnae_principal_codigo).toBe('4731-8/00')
    expect(persisted[0]?.resultado_snapshot).toBeTruthy()
  })

  it('lista e consulta detalhe de proposta do tenant', async () => {
    const proposta = await createProposal(app, accessToken, propostaIds, diagnosticoIds)

    const listResponse = await authedRequest(app, accessToken, {
      method: 'GET',
      url: `/api/v1/comercial/propostas?busca=${encodeURIComponent(proposta.numero)}`,
    })

    expect(listResponse.statusCode).toBe(200)
    const listBody = listResponse.json() as {
      data: Array<{ id: string; numero: string; itensQuantidade: number; riscoNivel: string }>
    }

    expect(listBody.data.some((item) => item.id === proposta.id)).toBe(true)
    const listItem = listBody.data.find((item) => item.id === proposta.id)!
    expect(listItem.numero).toBe(proposta.numero)
    expect(listItem.itensQuantidade).toBe(3)
    expect(listItem.riscoNivel).toBe('CRITICO')

    const detailResponse = await authedRequest(app, accessToken, {
      method: 'GET',
      url: `/api/v1/comercial/propostas/${proposta.id}`,
    })

    expect(detailResponse.statusCode).toBe(200)
    const detailBody = detailResponse.json() as {
      data: {
        id: string
        itensQuantidade: number
        emailContato: string | null
        diagnostico: Record<string, unknown> & { coberturaLimitada: boolean }
        itens: Array<Record<string, unknown>>
      }
    }

    expect(detailBody.data.id).toBe(proposta.id)
    expect(detailBody.data.itensQuantidade).toBe(3)
    expect(detailBody.data.emailContato).toBe('comercial@redealpha.com.br')
    expect(detailBody.data.diagnostico.coberturaLimitada).toBe(false)
    expect(detailBody.data.diagnostico).not.toHaveProperty('inputSnapshot')
    expect(detailBody.data.diagnostico).not.toHaveProperty('resultadoSnapshot')
    expect(detailBody.data.itens[0]).not.toHaveProperty('snapshotCatalogo')
  })

  it('gera PDF da proposta sem expor campos sensíveis', async () => {
    const proposta = await createProposal(app, accessToken, propostaIds, diagnosticoIds)

    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: `/api/v1/comercial/propostas/${proposta.id}/pdf`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/pdf')
    expect(response.headers['content-disposition']).toContain('.pdf')

    const pdfText = response.body
    expect(pdfText).toContain('%PDF-')
    expect(pdfText).toContain('Proposta Comercial')
    expect(pdfText).toContain(proposta.numero)
    expect(pdfText).not.toContain('inputSnapshot')
    expect(pdfText).not.toContain('resultadoSnapshot')
    expect(pdfText).not.toContain('snapshotCatalogo')
    expect(pdfText).not.toContain('observacoesInternas')
    expect(pdfText).not.toContain('custoInternoEstimado')
    expect(pdfText).not.toContain('margemLucroAlvo')
    expect(pdfText).not.toContain('valorReferenciaHora')
    expect(pdfText).not.toContain('metadata')
  })

  it('atualiza status, validade e observações comerciais sem expor campos sensíveis', async () => {
    const proposta = await createProposal(app, accessToken, propostaIds, diagnosticoIds)

    const response = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/comercial/propostas/${proposta.id}`,
      payload: {
        status: 'PRONTA',
        dataValidade: '2026-12-31',
        observacoesComerciais: 'Proposta revisada para envio comercial.',
      },
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: {
        id: string
        status: string
        dataValidade: string
        observacoesComerciais: string | null
        atualizadoPor: { email: string } | null
        diagnostico: Record<string, unknown>
        itens: Array<Record<string, unknown>>
      }
    }

    expect(body.data.id).toBe(proposta.id)
    expect(body.data.status).toBe('PRONTA')
    expect(body.data.dataValidade).toContain('2026-12-31')
    expect(body.data.observacoesComerciais).toBe('Proposta revisada para envio comercial.')
    expect(body.data.atualizadoPor?.email).toBe('admin@postodemo.com.br')
    expect(body.data.diagnostico).not.toHaveProperty('inputSnapshot')
    expect(body.data.diagnostico).not.toHaveProperty('resultadoSnapshot')
    expect(body.data.itens[0]).not.toHaveProperty('snapshotCatalogo')

    const persisted = await prisma.$queryRaw<Array<{
      status: string
      data_validade: Date
      observacoes_comerciais: string | null
      atualizado_por_email: string | null
    }>>`
      SELECT
        p.status,
        p.data_validade,
        p.observacoes_comerciais,
        u.email AS atualizado_por_email
      FROM propostas_comerciais p
      LEFT JOIN usuarios u ON u.id = p.atualizado_por_id
      WHERE p.id = ${proposta.id}
      LIMIT 1
    `

    expect(persisted).toHaveLength(1)
    expect(persisted[0]?.status).toBe('PRONTA')
    expect(persisted[0]?.data_validade.toISOString()).toContain('2026-12-31')
    expect(persisted[0]?.observacoes_comerciais).toBe('Proposta revisada para envio comercial.')
    expect(persisted[0]?.atualizado_por_email).toBe('admin@postodemo.com.br')
  })

  it('rejeita transição inválida de status', async () => {
    const proposta = await createProposal(app, accessToken, propostaIds, diagnosticoIds)

    const response = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/comercial/propostas/${proposta.id}`,
      payload: {
        status: 'APROVADA',
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('rejeita inclusão de serviço fora das recomendações do diagnóstico', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: '/api/v1/comercial/propostas',
      payload: buildPayload({
        itens: [{ codigo: 'GES-001', quantidade: 1 }],
      }),
    })

    expect(response.statusCode).toBe(400)
  })

  it('cria handoff comercial a partir de proposta aprovada sem expor payload bruto', async () => {
    const proposta = await createApprovedProposal(app, accessToken, propostaIds, diagnosticoIds)

    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: `/api/v1/comercial/propostas/${proposta.id}/handoff`,
    })

    expect(response.statusCode).toBe(201)

    const body = response.json() as {
      data: {
        id: string
        tenantId: string
        propostaComercialId: string
        status: string
        statusPropostaOrigem: string
        responsavelComercialId: string
        servicosResumo: Array<Record<string, unknown>>
        origemSnapshotSaneado: {
          schemaVersion: number
          proposta: { id: string; statusOrigem: string }
          referencias: { propostaComercialId: string }
          comercial: Record<string, unknown>
        }
      }
    }

    handoffIds.push(body.data.id)

    expect(body.data.propostaComercialId).toBe(proposta.id)
    expect(body.data.status).toBe('AGUARDANDO_HANDOFF')
    expect(body.data.statusPropostaOrigem).toBe('APROVADA')
    expect(body.data.responsavelComercialId).toBeTruthy()
    expect(body.data.servicosResumo).toHaveLength(3)
    expect(body.data.servicosResumo[0]).toHaveProperty('nome')
    expect(body.data.servicosResumo[0]).toHaveProperty('quantidade', 1)
    expect(body.data.servicosResumo[0]).not.toHaveProperty('custoInternoEstimado')
    expect(body.data.servicosResumo[0]).not.toHaveProperty('margemLucroAlvo')
    expect(body.data.origemSnapshotSaneado.schemaVersion).toBe(1)
    expect(body.data.origemSnapshotSaneado.proposta.id).toBe(proposta.id)
    expect(body.data.origemSnapshotSaneado.proposta.statusOrigem).toBe('APROVADA')
    expect(body.data.origemSnapshotSaneado.referencias.propostaComercialId).toBe(proposta.id)
    expect(body.data.origemSnapshotSaneado.comercial).not.toHaveProperty('metadata')
    expect(body.data.origemSnapshotSaneado).not.toHaveProperty('inputSnapshot')
    expect(body.data.origemSnapshotSaneado).not.toHaveProperty('resultadoSnapshot')
    expect(body.data.origemSnapshotSaneado).not.toHaveProperty('snapshotCatalogo')

    const persisted = await prisma.$queryRaw<Array<{
      id: string
      status: string
      status_proposta_origem: string
      proposta_comercial_id: string
    }>>`
      SELECT id, status, status_proposta_origem, proposta_comercial_id
      FROM handoffs_comerciais
      WHERE id = ${body.data.id}
      LIMIT 1
    `

    expect(persisted).toHaveLength(1)
    expect(persisted[0]?.status).toBe('AGUARDANDO_HANDOFF')
    expect(persisted[0]?.status_proposta_origem).toBe('APROVADA')
    expect(persisted[0]?.proposta_comercial_id).toBe(proposta.id)
  })

  it('rejeita handoff para proposta ainda não aprovada', async () => {
    const proposta = await createProposal(app, accessToken, propostaIds, diagnosticoIds)

    const response = await authedRequest(app, accessToken, {
      method: 'POST',
      url: `/api/v1/comercial/propostas/${proposta.id}/handoff`,
    })

    expect(response.statusCode).toBe(409)
  })

  it('rejeita criação duplicada quando já existe handoff ativo para a proposta', async () => {
    const proposta = await createApprovedProposal(app, accessToken, propostaIds, diagnosticoIds)

    const firstResponse = await authedRequest(app, accessToken, {
      method: 'POST',
      url: `/api/v1/comercial/propostas/${proposta.id}/handoff`,
    })

    expect(firstResponse.statusCode).toBe(201)
    const firstBody = firstResponse.json() as { data: { id: string } }
    handoffIds.push(firstBody.data.id)

    const secondResponse = await authedRequest(app, accessToken, {
      method: 'POST',
      url: `/api/v1/comercial/propostas/${proposta.id}/handoff`,
    })

    expect(secondResponse.statusCode).toBe(409)
  })

  it('rejeita criação de handoff para perfil sem permissão', async () => {
    const proposta = await createApprovedProposal(app, accessToken, propostaIds, diagnosticoIds)
    const analistaToken = await loginDemo(app, 'analista@postodemo.com.br')

    const response = await authedRequest(app, analistaToken, {
      method: 'POST',
      url: `/api/v1/comercial/propostas/${proposta.id}/handoff`,
    })

    expect(response.statusCode).toBe(403)
  })
})

function buildPayload(overrides?: Record<string, unknown>) {
  return {
    contato: {
      nome: 'Posto Alpha',
      empresa: 'Rede Alpha',
      email: 'comercial@redealpha.com.br',
      telefone: '62999998888',
    },
    diagnostico: {
      cnaes: ['4731-8/00'],
      uf: 'SP',
      municipio: 'Campinas',
      porte: 'MEDIO',
      situacao: 'IRREGULAR',
      temOutorgaAnterior: false,
    },
    itens: [
      { codigo: 'LIC-004', quantidade: 1 },
      { codigo: 'LIC-008', quantidade: 1 },
      { codigo: 'LIC-011', quantidade: 1 },
    ],
    observacoesComerciais: 'Proposta inicial para triagem crítica.',
    ...overrides,
  }
}

async function createProposal(
  app: AppInstance,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
) {
  const response = await authedRequest(app, token, {
    method: 'POST',
    url: '/api/v1/comercial/propostas',
    payload: buildPayload(),
  })

  expect(response.statusCode).toBe(201)
  const body = response.json() as { data: { id: string; numero: string; diagnostico: { id: string } } }
  propostaIds.push(body.data.id)
  diagnosticoIds.push(body.data.diagnostico.id)
  return body.data
}

async function createApprovedProposal(
  app: AppInstance,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
) {
  const proposta = await createProposal(app, token, propostaIds, diagnosticoIds)

  for (const status of ['PRONTA', 'ENVIADA', 'APROVADA'] as const) {
    const response = await authedRequest(app, token, {
      method: 'PATCH',
      url: `/api/v1/comercial/propostas/${proposta.id}`,
      payload: { status },
    })

    expect(response.statusCode).toBe(200)
  }

  return proposta
}
