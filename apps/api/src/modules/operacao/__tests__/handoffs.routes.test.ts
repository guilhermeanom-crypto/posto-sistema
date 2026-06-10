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

describeIntegration('API de handoffs comerciais', () => {
  let app: AppInstance
  let accessToken: string
  let analistaToken: string
  const propostaIds: string[] = []
  const diagnosticoIds: string[] = []
  const handoffIds: string[] = []
  const usuarioIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    accessToken = await loginDemo(app)
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')
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
    if (usuarioIds.length > 0) {
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

  it('bloqueia listagem sem JWT', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/operacao/handoffs',
    })

    expect(response.statusCode).toBe(401)
  })

  it('lista handoffs do tenant com filtros básicos para perfil autorizado', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)

    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: `/api/v1/operacao/handoffs?status=AGUARDANDO_HANDOFF&propostaComercialId=${fixture.propostaComercialId}`,
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: Array<Record<string, unknown> & { id: string; propostaComercialId: string; status: string }>
      pagination: { total: number }
    }

    expect(body.pagination.total).toBeGreaterThanOrEqual(1)
    const handoff = body.data.find((item) => item.id === fixture.id)
    expect(handoff).toBeTruthy()
    expect(handoff?.propostaComercialId).toBe(fixture.propostaComercialId)
    expect(handoff?.status).toBe('AGUARDANDO_HANDOFF')
    expect(handoff).not.toHaveProperty('origemSnapshotSaneado')
    expect(handoff).not.toHaveProperty('servicosResumo')
    expect(handoff).not.toHaveProperty('metadata')
  })

  it('retorna detalhe saneado de um handoff do tenant', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)

    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: {
        id: string
        status: string
        servicosResumo: Array<Record<string, unknown>>
        origemSnapshotSaneado: Record<string, unknown>
      }
    }

    expect(body.data.id).toBe(fixture.id)
    expect(body.data.status).toBe('AGUARDANDO_HANDOFF')
    expect(body.data.servicosResumo).toHaveLength(3)
    expect(body.data.servicosResumo[0]).not.toHaveProperty('custoInternoEstimado')
    expect(body.data.servicosResumo[0]).not.toHaveProperty('margemLucroAlvo')
    expect(body.data.origemSnapshotSaneado).not.toHaveProperty('inputSnapshot')
    expect(body.data.origemSnapshotSaneado).not.toHaveProperty('resultadoSnapshot')
    expect(body.data.origemSnapshotSaneado).not.toHaveProperty('snapshotCatalogo')
    expect(body.data.origemSnapshotSaneado).not.toHaveProperty('metadata')
    expect(body.data).toMatchObject({
      observacoesPlanejamento: null,
      prioridadeOperacional: null,
      necessidadeDocumentos: null,
      necessidadeVisita: null,
      necessidadeTerceiro: null,
    })
  })

  it('retorna 404 para handoff inexistente no tenant', async () => {
    const response = await authedRequest(app, accessToken, {
      method: 'GET',
      url: '/api/v1/operacao/handoffs/11111111-1111-1111-1111-111111111111',
    })

    expect(response.statusCode).toBe(404)
  })

  it('bloqueia leitura para REPRESENTANTE_POSTO', async () => {
    const representanteEmail = await createRepresentativeUser()
    const representanteToken = await loginDemo(app, representanteEmail)

    const response = await authedRequest(app, representanteToken, {
      method: 'GET',
      url: '/api/v1/operacao/handoffs',
    })

    expect(response.statusCode).toBe(403)
  })

  it('bloqueia patch sem JWT', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/operacao/handoffs/11111111-1111-1111-1111-111111111111',
      headers: { 'content-type': 'application/json' },
      payload: { status: 'EM_TRIAGEM_OPERACIONAL' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('permite atualização operacional não sensível para ANALISTA', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)

    const response = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_TRIAGEM_OPERACIONAL',
        pendenciasOperacionais: ['Enviar licença anterior', 'Confirmar escopo do posto'],
        observacoesOperacionais: 'Triagem operacional iniciada.',
      },
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: {
        status: string
        pendenciasOperacionais: string[]
        observacoesOperacionais: string | null
        servicosResumo: Array<Record<string, unknown>>
        origemSnapshotSaneado: Record<string, unknown>
      }
    }

    expect(body.data.status).toBe('EM_TRIAGEM_OPERACIONAL')
    expect(body.data.pendenciasOperacionais).toEqual([
      'Enviar licença anterior',
      'Confirmar escopo do posto',
    ])
    expect(body.data.observacoesOperacionais).toBe('Triagem operacional iniciada.')
    expect(body.data.servicosResumo[0]).not.toHaveProperty('margemLucroAlvo')
    expect(body.data.origemSnapshotSaneado).not.toHaveProperty('inputSnapshot')
  })

  it('aceita e persiste os campos mínimos de preparação operacional após o aceite', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)
    const analista = await getAnalistaUsuario()

    const triagemResponse = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_TRIAGEM_OPERACIONAL',
        responsavelOperacionalId: analista.id,
      },
    })

    expect(triagemResponse.statusCode).toBe(200)

    const aceiteResponse = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_PLANEJAMENTO',
      },
    })

    expect(aceiteResponse.statusCode).toBe(200)

    const patchResponse = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        observacoesPlanejamento: 'Preparar alinhamento inicial com documentação e visita técnica.',
        prioridadeOperacional: 'ALTA',
        necessidadeDocumentos: true,
        necessidadeVisita: false,
        necessidadeTerceiro: true,
      },
    })

    expect(patchResponse.statusCode).toBe(200)

    const patchBody = patchResponse.json() as {
      data: {
        observacoesPlanejamento: string | null
        prioridadeOperacional: string | null
        necessidadeDocumentos: boolean | null
        necessidadeVisita: boolean | null
        necessidadeTerceiro: boolean | null
      }
    }

    expect(patchBody.data).toMatchObject({
      observacoesPlanejamento: 'Preparar alinhamento inicial com documentação e visita técnica.',
      prioridadeOperacional: 'ALTA',
      necessidadeDocumentos: true,
      necessidadeVisita: false,
      necessidadeTerceiro: true,
    })

    const getResponse = await authedRequest(app, accessToken, {
      method: 'GET',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
    })

    expect(getResponse.statusCode).toBe(200)

    const getBody = getResponse.json() as {
      data: {
        observacoesPlanejamento: string | null
        prioridadeOperacional: string | null
        necessidadeDocumentos: boolean | null
        necessidadeVisita: boolean | null
        necessidadeTerceiro: boolean | null
      }
    }

    expect(getBody.data).toMatchObject({
      observacoesPlanejamento: 'Preparar alinhamento inicial com documentação e visita técnica.',
      prioridadeOperacional: 'ALTA',
      necessidadeDocumentos: true,
      necessidadeVisita: false,
      necessidadeTerceiro: true,
    })
  })

  it('bloqueia ANALISTA ao atribuir responsável operacional', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)
    const analista = await getAnalistaUsuario()

    const response = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        responsavelOperacionalId: analista.id,
      },
    })

    expect(response.statusCode).toBe(403)
  })

  it('preenche assumidoEm ao atribuir responsável operacional pela primeira vez', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)
    const analista = await getAnalistaUsuario()

    const response = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        responsavelOperacionalId: analista.id,
      },
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: {
        responsavelOperacionalId: string | null
        assumidoEm: string | null
      }
    }

    expect(body.data.responsavelOperacionalId).toBe(analista.id)
    expect(body.data.assumidoEm).toBeTruthy()
  })

  it('permite avançar para EM_PLANEJAMENTO com responsável e sem pendências', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)
    const analista = await getAnalistaUsuario()

    const triagem = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_TRIAGEM_OPERACIONAL',
        responsavelOperacionalId: analista.id,
        observacoesOperacionais: 'Triagem concluída e pronta para aceite.',
      },
    })

    expect(triagem.statusCode).toBe(200)

    const response = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_PLANEJAMENTO',
      },
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: {
        status: string
        responsavelOperacionalId: string | null
        pendenciasOperacionais: string[]
      }
    }

    expect(body.data.status).toBe('EM_PLANEJAMENTO')
    expect(body.data.responsavelOperacionalId).toBe(analista.id)
    expect(body.data.pendenciasOperacionais).toEqual([])
  })

  it('bloqueia avanço para EM_PLANEJAMENTO sem responsável operacional', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)

    const triagem = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_TRIAGEM_OPERACIONAL',
        observacoesOperacionais: 'Triagem iniciada sem responsável definido.',
      },
    })

    expect(triagem.statusCode).toBe(200)

    const response = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_PLANEJAMENTO',
      },
    })

    expect(response.statusCode).toBe(409)

    const body = response.json() as {
      error: {
        code: string
        message: string
      }
    }

    expect(body.error.code).toBe('HANDOFF_ACEITE_SEM_RESPONSAVEL')
    expect(body.error.message).toBe('Defina um responsável operacional antes de aceitar este handoff.')
  })

  it('bloqueia avanço para EM_PLANEJAMENTO com pendências operacionais em aberto', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)
    const analista = await getAnalistaUsuario()

    const triagem = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_TRIAGEM_OPERACIONAL',
        responsavelOperacionalId: analista.id,
      },
    })

    expect(triagem.statusCode).toBe(200)

    const response = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_PLANEJAMENTO',
        pendenciasOperacionais: ['Aguardar licença anterior'],
      },
    })

    expect(response.statusCode).toBe(409)

    const body = response.json() as {
      error: {
        code: string
        message: string
      }
    }

    expect(body.error.code).toBe('HANDOFF_ACEITE_COM_PENDENCIAS')
    expect(body.error.message).toBe(
      'Resolva ou remova as pendências operacionais antes de avançar para preparação.',
    )
  })

  it('bloqueia por permissão a tentativa de aceite operacional', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)
    const analista = await getAnalistaUsuario()
    const executivoEmail = await createUserWithPerfil('EXECUTIVO')
    const executivoToken = await loginDemo(app, executivoEmail)

    const triagem = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_TRIAGEM_OPERACIONAL',
        responsavelOperacionalId: analista.id,
      },
    })

    expect(triagem.statusCode).toBe(200)

    const response = await authedRequest(app, executivoToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_PLANEJAMENTO',
      },
    })

    expect(response.statusCode).toBe(403)

    const body = response.json() as {
      error: {
        message: string
      }
    }

    expect(body.error.message).toBe('Seu perfil não possui permissão para aceitar este handoff operacional.')
  })

  it('rejeita transição inválida de status', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)

    const response = await authedRequest(app, analistaToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_EXECUCAO',
      },
    })

    expect(response.statusCode).toBe(409)
  })

  it('bloqueia avanço para EM_PLANEJAMENTO quando a transição de status é inválida', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)
    const analista = await getAnalistaUsuario()

    const response = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_PLANEJAMENTO',
        responsavelOperacionalId: analista.id,
      },
    })

    expect(response.statusCode).toBe(409)

    const body = response.json() as {
      error: {
        code: string
        message: string
      }
    }

    expect(body.error.code).toBe('HANDOFF_ACEITE_TRANSICAO_INVALIDA')
    expect(body.error.message).toBe(
      'A transição para preparação não é permitida a partir do status atual do handoff.',
    )
  })

  it('permite concluir handoff com transições válidas e preenche concluidoEm', async () => {
    const fixture = await createHandoffFixture(app, accessToken, propostaIds, diagnosticoIds, handoffIds)
    const analista = await getAnalistaUsuario()

    const triagem = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: {
        status: 'EM_TRIAGEM_OPERACIONAL',
        responsavelOperacionalId: analista.id,
      },
    })

    expect(triagem.statusCode).toBe(200)

    for (const status of ['EM_PLANEJAMENTO', 'EM_EXECUCAO'] as const) {
      const interim = await authedRequest(app, accessToken, {
        method: 'PATCH',
        url: `/api/v1/operacao/handoffs/${fixture.id}`,
        payload: { status },
      })

      expect(interim.statusCode).toBe(200)
    }

    const response = await authedRequest(app, accessToken, {
      method: 'PATCH',
      url: `/api/v1/operacao/handoffs/${fixture.id}`,
      payload: { status: 'CONCLUIDO' },
    })

    expect(response.statusCode).toBe(200)

    const body = response.json() as {
      data: {
        status: string
        concluidoEm: string | null
        canceladoEm: string | null
      }
    }

    expect(body.data.status).toBe('CONCLUIDO')
    expect(body.data.concluidoEm).toBeTruthy()
    expect(body.data.canceladoEm).toBeNull()
  })

  async function createUserWithPerfil(perfil: 'REPRESENTANTE_POSTO' | 'EXECUTIVO') {
    const admin = await prisma.usuario.findFirstOrThrow({
      where: { email: 'admin@postodemo.com.br' },
      select: {
        tenantId: true,
        senhaHash: true,
      },
    })

    const prefixo = perfil === 'EXECUTIVO' ? 'executivo' : 'representante'
    const email = `${prefixo}.handoff.${Date.now()}@postodemo.com.br`
    const usuario = await prisma.usuario.create({
      data: {
        tenantId: admin.tenantId,
        nome: perfil === 'EXECUTIVO' ? 'Executivo Handoff' : 'Representante Handoff',
        email,
        senhaHash: admin.senhaHash,
        perfil,
        ativo: true,
      },
      select: { id: true, email: true },
    })

    usuarioIds.push(usuario.id)
    return usuario.email
  }

  async function createRepresentativeUser() {
    return createUserWithPerfil('REPRESENTANTE_POSTO')
  }

  async function getAnalistaUsuario() {
    return prisma.usuario.findFirstOrThrow({
      where: { email: 'analista@postodemo.com.br' },
      select: { id: true },
    })
  }
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
  const body = response.json() as { data: { id: string; diagnostico: { id: string } } }
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

async function createHandoffFixture(
  app: AppInstance,
  token: string,
  propostaIds: string[],
  diagnosticoIds: string[],
  handoffIds: string[],
) {
  const proposta = await createApprovedProposal(app, token, propostaIds, diagnosticoIds)

  const response = await authedRequest(app, token, {
    method: 'POST',
    url: `/api/v1/comercial/propostas/${proposta.id}/handoff`,
  })

  expect(response.statusCode).toBe(201)
  const body = response.json() as { data: { id: string; propostaComercialId: string } }
  handoffIds.push(body.data.id)
  return body.data
}
