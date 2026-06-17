import { afterAll, beforeAll, expect, it, vi } from 'vitest'

// Mesmos test doubles dos demais testes de integração (bullmq + redis)
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

vi.mock('../../infra/cache/redis.js', () => ({
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

import { buildApp } from '../../app.js'
import { prisma } from '../../infra/database/prisma.js'
import { assertIntegrationDatabaseAvailable, describeIntegration } from '../../test/integration.js'
import { authedRequest, loginDemo } from '../../test/helpers.js'
import { setupTenantB, type TenantBContext } from '../../test/tenant-b.js'

type AppInstance = Awaited<ReturnType<typeof buildApp>>

// Estes testes são a rede de segurança que faltava: provam que o tenant A
// não consegue ler/alterar recursos do tenant B. Cada caso reproduz exatamente
// um IDOR corrigido (V-01 ia/defesas, V-02 documentos, V-03 empreendimentos).
describeIntegration('Isolamento cross-tenant (regressão V-01/V-02/V-03)', () => {
  let app: AppInstance
  let tokenA: string
  let tenantB: TenantBContext

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    tokenA = await loginDemo(app) // admin do tenant demo (tenant A)
    tenantB = await setupTenantB(app)
  })

  afterAll(async () => {
    await app?.close()
  })

  it('V-03: tenant A não cria empreendimento usando empresa do tenant B', async () => {
    const res = await authedRequest(app, tokenA, {
      method: 'POST',
      url: '/api/v1/empreendimentos',
      payload: {
        empresaId: tenantB.empresaId, // empresa pertence ao tenant B
        nome: 'Tentativa cross-tenant',
        logradouro: 'Av. Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
        atividades: ['Revenda de combustíveis'],
      },
    })
    expect(res.statusCode).toBe(404)
  })

  it('V-01: tenant A não altera defesa técnica do tenant B', async () => {
    const auto = await prisma.autoInfracao.create({
      data: {
        tenantId: tenantB.tenantId,
        empreendimentoId: tenantB.empreendimentoId,
        orgao: 'ANP',
        numeroAuto: `AUTO-B-${Date.now()}`,
        dataLavratura: new Date('2026-01-10'),
        descricao: 'Auto de infração confidencial do tenant B',
        prazoDefesa: new Date('2026-02-10'),
      },
      select: { id: true },
    })
    const defesa = await prisma.defesaTecnica.create({
      data: { autoId: auto.id, rascunhoIA: 'Defesa jurídica confidencial do tenant B', status: 'RASCUNHO' },
      select: { id: true },
    })

    const res = await authedRequest(app, tokenA, {
      method: 'PATCH',
      url: `/api/v1/ia/defesas/${defesa.id}`,
      payload: { status: 'REVISADO', revisaoHumana: 'tentativa de invasão' },
    })
    expect(res.statusCode).toBe(404)

    // Garante que o recurso do tenant B permaneceu intacto
    const depois = await prisma.defesaTecnica.findUnique({
      where: { id: defesa.id },
      select: { status: true, revisaoHumana: true },
    })
    expect(depois?.status).toBe('RASCUNHO')
    expect(depois?.revisaoHumana).toBeNull()

    await prisma.defesaTecnica.delete({ where: { id: defesa.id } })
    await prisma.autoInfracao.delete({ where: { id: auto.id } })
  })

  it('V-02: tenant A não aprova versão de documento do tenant B', async () => {
    const documento = await prisma.documento.create({
      data: {
        tenantId: tenantB.tenantId,
        empreendimentoId: tenantB.empreendimentoId,
        tipoDocumentoId: tenantB.tipoDocumentoId,
        nome: 'Documento confidencial do tenant B',
        alertaDiasAntes: [],
      },
      select: { id: true },
    })
    const versao = await prisma.documentoVersao.create({
      data: {
        documentoId: documento.id,
        numeroVersao: 1,
        arquivoChaveS3: `tenant-b/${documento.id}.pdf`,
        arquivoNome: 'doc.pdf',
        arquivoMime: 'application/pdf',
        arquivoBytes: BigInt(1024),
        hashSha256: 'hash-teste-b',
        enviadoPorId: tenantB.usuarioId,
        status: 'ENVIADA',
      },
      select: { id: true },
    })

    const res = await authedRequest(app, tokenA, {
      method: 'POST',
      url: `/api/v1/documentos/${documento.id}/versoes/${versao.id}/aprovar`,
    })
    expect(res.statusCode).toBe(404)

    const depois = await prisma.documentoVersao.findUnique({
      where: { id: versao.id },
      select: { status: true },
    })
    expect(depois?.status).toBe('ENVIADA')

    await prisma.documentoVersao.delete({ where: { id: versao.id } })
    await prisma.documento.delete({ where: { id: documento.id } })
  })
})
