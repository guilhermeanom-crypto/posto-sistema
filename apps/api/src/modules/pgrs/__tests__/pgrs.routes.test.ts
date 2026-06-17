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

describeIntegration('API de PGRS', () => {
  let app: AppInstance
  let adminToken: string
  let analistaToken: string

  let empreendimentoId: string
  let foreignEmpreendimentoId: string
  let documentoId: string

  // IDs rastreados para cleanup
  const pgrsIds: string[] = []
  const exigenciaIds: string[] = []
  const evidenciaIds: string[] = []
  const documentoIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()

    adminToken = await loginDemo(app, 'admin@postodemo.com.br')
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')

    // Busca empreendimento do tenant demo como FK obrigatória
    const empreendimento = await prisma.empreendimento.findFirst({
      where: { tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47' },
      select: { id: true },
    })
    if (!empreendimento) {
      throw new Error(
        'Nenhum empreendimento encontrado no tenant de demo. Execute o seed antes de rodar os testes.',
      )
    }
    empreendimentoId = empreendimento.id

    const foreignEmp = await prisma.empreendimento.findFirst({
      where: { tenantId: { not: '173fa80b-edaf-47f8-92cf-7958da22ea47' } },
      select: { id: true },
    })
    if (!foreignEmp) {
      throw new Error('Nenhum empreendimento de outro tenant encontrado. Execute o seed antes de rodar os testes.')
    }
    foreignEmpreendimentoId = foreignEmp.id

    // Cria um documento de suporte para usar como FK nas evidências
    const tipoDocumento = await prisma.tipoDocumento.findFirst({
      where: { tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47' },
      select: { id: true },
    })
    if (!tipoDocumento) {
      throw new Error('Nenhum tipo de documento encontrado no tenant de demo. Execute o seed antes de rodar os testes.')
    }

    const doc = await prisma.documento.create({
      data: {
        tenantId: '173fa80b-edaf-47f8-92cf-7958da22ea47',
        empreendimentoId,
        tipoDocumentoId: tipoDocumento.id,
        nome: 'Documento PGRS Teste — pode deletar',
        status: 'APROVADO',
        alertaDiasAntes: [],
      },
    })
    documentoId = doc.id
    documentoIds.push(documentoId)
  })

  afterAll(async () => {
    // Respeita ordem de FK: evidências → exigências → pgrs → documentos criados
    if (evidenciaIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM pgrs_evidencias WHERE id = ANY($1::text[])`,
        evidenciaIds,
      )
    }
    if (exigenciaIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM pgrs_exigencias WHERE id = ANY($1::text[])`,
        exigenciaIds,
      )
    }
    if (pgrsIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM pgrs WHERE id = ANY($1::text[])`,
        pgrsIds,
      )
    }
    if (documentoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM documentos WHERE id = ANY($1::text[])`,
        documentoIds,
      )
    }
    await app?.close()
    await prisma.$disconnect()
  })

  // ─── 1. Autenticação ────────────────────────────────────────────────────────

  it('bloqueia GET / sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/pgrs' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia GET /:id sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/pgrs/00000000-0000-0000-0000-000000000000',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia POST / sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pgrs',
      headers: { 'content-type': 'application/json' },
      payload: {
        empreendimentoId,
        versao: '2024-v1',
        responsavelTecnico: 'Sem Token',
        dataAprovacao: '2024-01-01',
        dataVencimento: '2026-01-01',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem ────────────────────────────────────────────────────────────

  it('lista PGRS do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/pgrs',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; versao: string; status: string }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination.page).toBe(1)
    expect(typeof body.pagination.total).toBe('number')
  })

  it('aceita filtro por empreendimentoId (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/pgrs?empreendimentoId=${empreendimentoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ empreendimento: { id: string } }>
    }
    expect(Array.isArray(body.data)).toBe(true)
    for (const item of body.data) {
      expect(item.empreendimento.id).toBe(empreendimentoId)
    }
  })

  it('aceita filtro por status (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/pgrs?status=VIGENTE',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ status: string }>
    }
    expect(Array.isArray(body.data)).toBe(true)
    for (const item of body.data) {
      expect(item.status).toBe('VIGENTE')
    }
  })

  // ─── 3. Criação ─────────────────────────────────────────────────────────────

  let pgrsId: string

  it('cria PGRS com payload válido (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/pgrs',
      payload: {
        empreendimentoId,
        versao: '2024-v1-teste',
        responsavelTecnico: 'Eng. Responsável Teste',
        artNumero: 'ART-2024-TEST-001',
        dataAprovacao: '2024-01-15',
        dataVencimento: '2026-01-15',
        observacoes: 'PGRS criado pelo teste automatizado',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        versao: string
        responsavelTecnico: string
        status: string
        empreendimento: { id: string; nome: string }
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.versao).toBe('2024-v1-teste')
    expect(body.data.responsavelTecnico).toBe('Eng. Responsável Teste')
    expect(body.data.status).toBe('VIGENTE')
    expect(body.data.empreendimento.id).toBe(empreendimentoId)
    pgrsId = body.data.id
    pgrsIds.push(pgrsId)
  })

  it('rejeita criação de PGRS com empreendimento de outro tenant (404)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/pgrs',
      payload: {
        empreendimentoId: foreignEmpreendimentoId,
        versao: '2024-v1-externo',
        responsavelTecnico: 'Eng. Externo',
        dataAprovacao: '2024-01-01',
        dataVencimento: '2026-01-01',
      },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 4. Busca por ID ────────────────────────────────────────────────────────

  it('retorna o PGRS criado pelo ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/pgrs/${pgrsId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      id: string
      versao: string
      exigencias: unknown[]
    }
    expect(body.id).toBe(pgrsId)
    expect(body.versao).toBe('2024-v1-teste')
    expect(Array.isArray(body.exigencias)).toBe(true)
  })

  it('retorna 404 para ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/pgrs/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 5. Atualização ─────────────────────────────────────────────────────────

  it('atualiza campos do PGRS (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/pgrs/${pgrsId}`,
      payload: {
        responsavelTecnico: 'Eng. Atualizado',
        status: 'A_RENOVAR',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      responsavelTecnico: string
      status: string
    }
    expect(body.responsavelTecnico).toBe('Eng. Atualizado')
    expect(body.status).toBe('A_RENOVAR')
  })

  it('retorna 404 ao atualizar PGRS inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: '/api/v1/pgrs/00000000-0000-0000-0000-000000000099',
      payload: { responsavelTecnico: 'Ninguém' },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 6. Exigências ──────────────────────────────────────────────────────────

  let exigenciaId: string

  it('cria exigência no PGRS (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/pgrs/${pgrsId}/exigencias`,
      payload: {
        descricao: 'Destinação de óleo lubrificante usado conforme CONAMA 362',
        tipoResiduo: 'OLEO_LUBRIFICANTE',
        periodicidade: 'TRIMESTRAL',
        prazoComprovacaoDias: 30,
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        descricao: string
        tipoResiduo: string
        periodicidade: string
        prazoComprovacaoDias: number
        status: string
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.descricao).toBe('Destinação de óleo lubrificante usado conforme CONAMA 362')
    expect(body.data.tipoResiduo).toBe('OLEO_LUBRIFICANTE')
    expect(body.data.periodicidade).toBe('TRIMESTRAL')
    expect(body.data.prazoComprovacaoDias).toBe(30)
    expect(body.data.status).toBe('PENDENTE')
    exigenciaId = body.data.id
    exigenciaIds.push(exigenciaId)
  })

  it('retorna 404 ao criar exigência em PGRS inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/pgrs/00000000-0000-0000-0000-000000000099/exigencias',
      payload: {
        descricao: 'Exigência órfã',
        tipoResiduo: 'FILTRO',
        periodicidade: 'ANUAL',
        prazoComprovacaoDias: 60,
      },
    })
    expect(response.statusCode).toBe(404)
  })

  it('atualiza status de exigência para EM_CUMPRIMENTO (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/pgrs/${pgrsId}/exigencias/${exigenciaId}`,
      payload: { status: 'EM_CUMPRIMENTO' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { status: string }
    expect(body.status).toBe('EM_CUMPRIMENTO')
  })

  it('marca exigência como não aplicável com justificativa (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/pgrs/${pgrsId}/exigencias/${exigenciaId}`,
      payload: {
        naoAplicavel: true,
        naoAplicavelJustificativa: 'Empreendimento não gera este tipo de resíduo',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { naoAplicavel: boolean; status: string }
    expect(body.naoAplicavel).toBe(true)
    expect(body.status).toBe('NAO_APLICAVEL')
  })

  // ─── 7. Evidências ──────────────────────────────────────────────────────────

  it('vincula evidência à exigência (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/pgrs/${pgrsId}/exigencias/${exigenciaId}/evidencias`,
      payload: {
        documentoId,
        periodoRef: '2024-T3',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        periodoRef: string
        documento: { id: string }
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.periodoRef).toBe('2024-T3')
    expect(body.data.documento.id).toBe(documentoId)
    evidenciaIds.push(body.data.id)
  })

  it('retorna 404 ao vincular evidência em exigência inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/pgrs/${pgrsId}/exigencias/00000000-0000-0000-0000-000000000099/evidencias`,
      payload: {
        documentoId,
        periodoRef: '2024-T4',
      },
    })
    expect(response.statusCode).toBe(404)
  })

  it('verifica que GET /:id inclui exigência com evidência vinculada (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/pgrs/${pgrsId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      id: string
      exigencias: Array<{
        id: string
        status: string
        evidencias: Array<{ id: string; periodoRef: string }>
      }>
    }
    const exig = body.exigencias.find((e) => e.id === exigenciaId)
    expect(exig).toBeDefined()
    // Após vincular evidência, status deve ter sido promovido para COMPROVADO
    expect(exig!.status).toBe('COMPROVADO')
    expect(exig!.evidencias.length).toBeGreaterThanOrEqual(1)
    const ev = exig!.evidencias.find((e) => e.periodoRef === '2024-T3')
    expect(ev).toBeDefined()
  })

  // ─── 8. Validação de schema ─────────────────────────────────────────────────

  it('rejeita criação de PGRS sem empreendimentoId (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/pgrs',
      payload: {
        versao: '2024-v1',
        responsavelTecnico: 'Sem empreendimento',
        dataAprovacao: '2024-01-01',
        dataVencimento: '2026-01-01',
        // empreendimentoId ausente
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de PGRS com data no formato errado (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/pgrs',
      payload: {
        empreendimentoId,
        versao: '2024-v1',
        responsavelTecnico: 'Engenheiro',
        dataAprovacao: '15/01/2024', // formato inválido (dd/mm/yyyy ao invés de yyyy-mm-dd)
        dataVencimento: '2026-01-01',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de exigência com periodicidade inválida (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/pgrs/${pgrsId}/exigencias`,
      payload: {
        descricao: 'Exigência com periodicidade errada',
        tipoResiduo: 'FILTRO',
        periodicidade: 'DIARIA', // valor inválido para o enum
        prazoComprovacaoDias: 10,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita vincular evidência sem documentoId (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/pgrs/${pgrsId}/exigencias/${exigenciaId}/evidencias`,
      payload: {
        periodoRef: '2024-T4',
        // documentoId ausente
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 9. Acesso por perfil ANALISTA ──────────────────────────────────────────

  it('permite listagem por perfil ANALISTA (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: '/api/v1/pgrs',
    })
    expect(response.statusCode).toBe(200)
  })

  it('permite leitura de PGRS por ID por perfil ANALISTA (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'GET',
      url: `/api/v1/pgrs/${pgrsId}`,
    })
    expect(response.statusCode).toBe(200)
  })
})
