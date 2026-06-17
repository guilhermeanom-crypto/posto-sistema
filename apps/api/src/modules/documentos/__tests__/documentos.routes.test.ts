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
    storageMock: {
      gerarUrlUpload: vi.fn().mockResolvedValue({
        uploadUrl: 'https://s3.example.com/fake-upload-url?signed=1',
        chaveS3: 'temporario/fake-tenant/fake-file.pdf',
        expiraEm: new Date(Date.now() + 3600 * 1000),
      }),
      gerarUrlDownload: vi.fn().mockResolvedValue('https://s3.example.com/fake-download-url?signed=1'),
      verificarArquivo: vi.fn().mockResolvedValue({ existe: true, tamanhoBytes: 1024 }),
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

vi.mock('../../../infra/storage/storage.service.js', () => ({
  storageService: testDoubles.storageMock,
  StorageService: {
    gerarChaveTemporaria: (sessionId: string, nomeArquivo: string) =>
      `temporario/${sessionId}/${nomeArquivo}`,
    gerarChaveDocumento: (
      tenantId: string,
      documentoId: string,
      versaoId: string,
      nomeArquivo: string,
    ) => {
      const ext = nomeArquivo.split('.').pop() ?? 'pdf'
      return `${tenantId}/documentos/${documentoId}/${versaoId}.${ext}`
    },
  },
}))

import { buildApp } from '../../../app.js'
import { prisma } from '../../../infra/database/prisma.js'
import { assertIntegrationDatabaseAvailable, describeIntegration } from '../../../test/integration.js'
import { authedRequest, loginDemo } from '../../../test/helpers.js'

type AppInstance = Awaited<ReturnType<typeof buildApp>>

const TENANT_ID = '173fa80b-edaf-47f8-92cf-7958da22ea47'

describeIntegration('API de documentos', () => {
  let app: AppInstance
  let adminToken: string
  let analistaToken: string

  let empreendimentoId: string
  let tipoDocumentoId: string

  // IDs criados neste teste — limpos no afterAll
  const documentoIds: string[] = []
  const versaoIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    adminToken = await loginDemo(app, 'admin@postodemo.com.br')
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')

    // Busca um empreendimento existente do tenant demo
    const emp = await prisma.empreendimento.findFirst({
      where: { tenantId: TENANT_ID },
      select: { id: true },
    })
    if (!emp) throw new Error('Nenhum empreendimento seed encontrado para o tenant demo')
    empreendimentoId = emp.id

    // Busca um tipo de documento existente do tenant demo
    const tipo = await prisma.tipoDocumento.findFirst({
      where: { tenantId: TENANT_ID },
      select: { id: true },
    })
    if (!tipo) throw new Error('Nenhum tipoDocumento seed encontrado para o tenant demo')
    tipoDocumentoId = tipo.id
  })

  afterAll(async () => {
    // Remove versões antes de documentos (FK: documento_versoes → documentos)
    if (versaoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM documento_versoes WHERE id = ANY($1::text[])`,
        versaoIds,
      )
    }
    if (documentoIds.length > 0) {
      // Remove FK versao_atual_id antes de deletar documentos para evitar referência circular
      await prisma.$executeRawUnsafe(
        `UPDATE documentos SET versao_atual_id = NULL WHERE id = ANY($1::text[])`,
        documentoIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM documento_versoes WHERE documento_id = ANY($1::text[])`,
        documentoIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM documentos WHERE id = ANY($1::text[])`,
        documentoIds,
      )
    }
    await app?.close()
    await prisma.$disconnect()
  })

  // ─── 1. Autenticação ────────────────────────────────────────────────────────

  it('bloqueia listagem de documentos sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/documentos' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia GET /:id sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/documentos/00000000-0000-0000-0000-000000000000',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação de documento sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/documentos',
      headers: { 'content-type': 'application/json' },
      payload: {
        empreendimentoId,
        tipoDocumentoId,
        nome: 'Documento Sem Token',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem ────────────────────────────────────────────────────────────

  it('lista documentos do tenant (200, paginação)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/documentos',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; nome: string; status: string }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination).toHaveProperty('total')
    expect(body.pagination).toHaveProperty('page')
    expect(body.pagination).toHaveProperty('limit')
    expect(body.pagination).toHaveProperty('totalPages')
    expect(body.pagination.page).toBe(1)
  })

  it('aceita filtro por empreendimentoId (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/documentos?empreendimentoId=${empreendimentoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ empreendimento: { id: string } }>
    }
    for (const doc of body.data) {
      expect(doc.empreendimento.id).toBe(empreendimentoId)
    }
  })

  // ─── 3. Criação ─────────────────────────────────────────────────────────────

  let documentoCriadoId: string

  it('cria documento com payload válido (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/documentos',
      payload: {
        empreendimentoId,
        tipoDocumentoId,
        nome: 'Licença de Operação - Teste',
        descricao: 'Criado pelo teste de integração',
        orgaoEmissor: 'IBAMA',
        dataValidade: '2027-12-31',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        nome: string
        empreendimentoId: string
        tipoDocumentoId: string
        status: string
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.nome).toBe('Licença de Operação - Teste')
    expect(body.data.empreendimentoId).toBe(empreendimentoId)
    expect(body.data.tipoDocumentoId).toBe(tipoDocumentoId)
    expect(body.data.status).toBe('PENDENTE')
    documentoCriadoId = body.data.id
    documentoIds.push(documentoCriadoId)
  })

  // ─── 4. Busca por ID ────────────────────────────────────────────────────────

  it('retorna o documento criado pelo seu ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/documentos/${documentoCriadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: {
        id: string
        nome: string
        status: string
        versoes: unknown[]
      }
    }
    expect(body.data.id).toBe(documentoCriadoId)
    expect(body.data.nome).toBe('Licença de Operação - Teste')
    expect(Array.isArray(body.data.versoes)).toBe(true)
  })

  // ─── 5. 404 para ID inexistente ─────────────────────────────────────────────

  it('retorna 404 para documento com ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/documentos/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 6. Upload: solicitar URL presignada ────────────────────────────────────

  let versaoCriadaId: string
  let chaveS3Criada: string

  it('solicita URL de upload presignada para um documento (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/documentos/${documentoCriadoId}/upload/solicitar`,
      payload: {
        documentoId: documentoCriadoId,
        nomeArquivo: 'licenca.pdf',
        mimeType: 'application/pdf',
        tamanhoBytes: 102400,
        hashSha256: 'a'.repeat(64),
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: {
        versaoId: string
        uploadUrl: string
        chaveS3: string
        expiresIn: number
      }
    }
    expect(body.data.versaoId).toBeTruthy()
    expect(body.data.uploadUrl).toContain('https://')
    expect(body.data.chaveS3).toBeTruthy()
    expect(body.data.expiresIn).toBeGreaterThan(0)
    versaoCriadaId = body.data.versaoId
    chaveS3Criada = body.data.chaveS3
    versaoIds.push(versaoCriadaId)
  })

  // ─── 7. Upload: confirmar upload ────────────────────────────────────────────

  it('confirma upload de versão (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/documentos/${documentoCriadoId}/upload/confirmar`,
      payload: {
        documentoId: documentoCriadoId,
        chaveS3: chaveS3Criada,
        observacoesEnvio: 'Arquivo enviado pelo teste de integração',
      },
    })
    expect(response.statusCode).toBe(200)

    // Confirma no banco diretamente que a versão foi marcada como ENVIADA
    const versao = await prisma.documentoVersao.findUnique({
      where: { id: versaoCriadaId },
      select: { status: true },
    })
    expect(versao?.status).toBe('ENVIADA')
  })

  // ─── 8. Aprovar versão (ANALISTA pode aprovar) ──────────────────────────────

  it('aprova versão de documento (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'POST',
      url: `/api/v1/documentos/${documentoCriadoId}/versoes/${versaoCriadaId}/aprovar`,
    })
    expect(response.statusCode).toBe(200)

    // Confirma no banco que a versão foi aprovada (status ATIVA)
    const versao = await prisma.documentoVersao.findUnique({
      where: { id: versaoCriadaId },
      select: { status: true },
    })
    expect(versao?.status).toBe('ATIVA')
  })

  // ─── 9. Criar segundo documento para testar reprovação ──────────────────────

  let documentoParaReprovar: string
  let versaoParaReprovar: string
  let chaveS3ParaReprovar: string

  it('cria segundo documento para testar reprovação (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/documentos',
      payload: {
        empreendimentoId,
        tipoDocumentoId,
        nome: 'Documento Para Reprovar - Teste',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as { data: { id: string } }
    documentoParaReprovar = body.data.id
    documentoIds.push(documentoParaReprovar)
  })

  it('solicita upload para o segundo documento (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/documentos/${documentoParaReprovar}/upload/solicitar`,
      payload: {
        documentoId: documentoParaReprovar,
        nomeArquivo: 'documento-reprovar.pdf',
        mimeType: 'application/pdf',
        tamanhoBytes: 51200,
        hashSha256: 'b'.repeat(64),
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { versaoId: string; chaveS3: string } }
    versaoParaReprovar = body.data.versaoId
    chaveS3ParaReprovar = body.data.chaveS3
    versaoIds.push(versaoParaReprovar)
  })

  it('confirma upload do segundo documento (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/documentos/${documentoParaReprovar}/upload/confirmar`,
      payload: {
        documentoId: documentoParaReprovar,
        chaveS3: chaveS3ParaReprovar,
      },
    })
    expect(response.statusCode).toBe(200)

    // Confirma no banco que o status foi atualizado para ENVIADA
    const versao = await prisma.documentoVersao.findUnique({
      where: { id: versaoParaReprovar },
      select: { status: true },
    })
    expect(versao?.status).toBe('ENVIADA')
  })

  // ─── 10. Reprovar versão ─────────────────────────────────────────────────────

  it('reprova versão de documento com motivo (200)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'POST',
      url: `/api/v1/documentos/${documentoParaReprovar}/versoes/${versaoParaReprovar}/reprovar`,
      payload: {
        motivoRejeicao: 'Documento ilegível, por favor reenvie com melhor qualidade.',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { mensagem: string } }
    expect(body.data.mensagem).toContain('reprovada')
  })

  // ─── 11. Validação de schema ─────────────────────────────────────────────────

  it('rejeita criação sem nome (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/documentos',
      payload: {
        empreendimentoId,
        tipoDocumentoId,
        // nome ausente
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação sem empreendimentoId (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/documentos',
      payload: {
        tipoDocumentoId,
        nome: 'Documento sem empreendimento',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação sem tipoDocumentoId (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/documentos',
      payload: {
        empreendimentoId,
        nome: 'Documento sem tipo',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita motivo de reprovação com menos de 10 caracteres (400)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'POST',
      url: `/api/v1/documentos/${documentoCriadoId}/versoes/${versaoCriadaId}/reprovar`,
      payload: {
        motivoRejeicao: 'Curto',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 12. Download de versão ──────────────────────────────────────────────────

  it('gera URL de download para versão aprovada (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/documentos/${documentoCriadoId}/versoes/${versaoCriadaId}/download`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { url: string; expiresIn: number } }
    expect(body.data.url).toContain('https://')
    expect(body.data.expiresIn).toBeGreaterThan(0)
  })

  it('retorna 404 ao solicitar download de versão inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/documentos/${documentoCriadoId}/versoes/00000000-0000-0000-0000-000000000099/download`,
    })
    expect(response.statusCode).toBe(404)
  })
})
