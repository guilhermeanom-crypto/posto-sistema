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

const TENANT_ID = '173fa80b-edaf-47f8-92cf-7958da22ea47'

describeIntegration('API de checklists', () => {
  let app: AppInstance
  let adminToken: string

  // IDs tracked for cleanup (FK order: respostas → execucoes → itens (cascade) → templates)
  const templateIds: string[] = []
  const execucaoIds: string[] = []

  let empreendimentoId: string
  let templateCriadoId: string
  let templateItemId: string
  let execucaoCriadaId: string

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    adminToken = await loginDemo(app, 'admin@postodemo.com.br')

    // Busca um empreendimento real do tenant de demo
    const emp = await prisma.empreendimento.findFirst({
      where: { tenantId: TENANT_ID },
      select: { id: true },
    })
    if (!emp) throw new Error('Nenhum empreendimento encontrado para o tenant de demo')
    empreendimentoId = emp.id
  })

  afterAll(async () => {
    // 1. Apaga respostas das execuções criadas (cascade via FK, mas fazemos explícito por segurança)
    if (execucaoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM checklist_respostas WHERE execucao_id = ANY($1::text[])`,
        execucaoIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM checklist_execucoes WHERE id = ANY($1::text[])`,
        execucaoIds,
      )
    }

    // 2. Apaga itens e templates (itens têm onDelete: Cascade no template)
    if (templateIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM checklist_itens WHERE template_id = ANY($1::text[])`,
        templateIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM checklist_templates WHERE id = ANY($1::text[])`,
        templateIds,
      )
    }

    await app?.close()
    await prisma.$disconnect()
  })

  // ─── 1. Autenticação ────────────────────────────────────────────────────────

  it('bloqueia listagem de templates sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/checklists/templates' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia GET /templates/:id sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/checklists/templates/00000000-0000-0000-0000-000000000000',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia POST /templates sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/checklists/templates',
      headers: { 'content-type': 'application/json' },
      payload: {
        nome: 'Sem Token',
        modulo: 'GERAL',
        periodicidade: 'DIARIO',
        itens: [{ ordem: 1, descricao: 'Item 1' }],
      },
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia POST /execucoes sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/checklists/execucoes',
      headers: { 'content-type': 'application/json' },
      payload: {
        templateId: '00000000-0000-0000-0000-000000000000',
        empreendimentoId: '00000000-0000-0000-0000-000000000000',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem de templates ───────────────────────────────────────────────

  it('lista templates do tenant (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/checklists/templates',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ id: string; nome: string; modulo: string; ativo: boolean }> }
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('filtra templates por módulo (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/checklists/templates?modulo=GERAL',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ modulo: string }> }
    for (const t of body.data) {
      expect(t.modulo).toBe('GERAL')
    }
  })

  it('filtra templates por ativo=true (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/checklists/templates?ativo=true',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ ativo: boolean }> }
    for (const t of body.data) {
      expect(t.ativo).toBe(true)
    }
  })

  // ─── 3. Criação de template ─────────────────────────────────────────────────

  it('cria template com payload válido (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/checklists/templates',
      payload: {
        nome: 'Checklist de Teste Automatizado',
        descricao: 'Template criado pelo teste de integração',
        modulo: 'OPERACIONAL',
        periodicidade: 'DIARIO',
        itens: [
          { ordem: 1, descricao: 'Verificar extintores', obrigatorio: true, categoria: 'Segurança' },
          { ordem: 2, descricao: 'Checar nível de óleo', obrigatorio: true, categoria: 'Operação' },
          { ordem: 3, descricao: 'Inspecionar bombas', obrigatorio: false, categoria: 'Equipamentos' },
        ],
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        nome: string
        modulo: string
        periodicidade: string
        ativo: boolean
        itens: Array<{ id: string; descricao: string; ordem: number; obrigatorio: boolean }>
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.nome).toBe('Checklist de Teste Automatizado')
    expect(body.data.modulo).toBe('OPERACIONAL')
    expect(body.data.periodicidade).toBe('DIARIO')
    expect(body.data.ativo).toBe(true)
    expect(body.data.itens).toHaveLength(3)
    const primeiroItem = body.data.itens[0]!
    expect(primeiroItem.ordem).toBe(1)

    templateCriadoId = body.data.id
    templateItemId = primeiroItem.id
    templateIds.push(templateCriadoId)
  })

  // ─── 4. Busca de template por ID ────────────────────────────────────────────

  it('obtém template criado pelo seu ID com itens (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/checklists/templates/${templateCriadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: { id: string; nome: string; itens: Array<{ id: string }> }
    }
    expect(body.data.id).toBe(templateCriadoId)
    expect(body.data.nome).toBe('Checklist de Teste Automatizado')
    expect(Array.isArray(body.data.itens)).toBe(true)
    expect(body.data.itens.length).toBeGreaterThan(0)
  })

  it('retorna 404 para template com ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/checklists/templates/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 5. Atualização de template ─────────────────────────────────────────────

  it('atualiza nome e periodicidade do template (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/checklists/templates/${templateCriadoId}`,
      payload: { nome: 'Checklist Atualizado', periodicidade: 'SEMANAL' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; nome: string; periodicidade: string } }
    expect(body.data.nome).toBe('Checklist Atualizado')
    expect(body.data.periodicidade).toBe('SEMANAL')
  })

  it('desativa template (PATCH ativo: false → 200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/checklists/templates/${templateCriadoId}`,
      payload: { ativo: false },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { ativo: boolean } }
    expect(body.data.ativo).toBe(false)

    // Reativa para os próximos testes (execução requer template ativo)
    const reativar = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/checklists/templates/${templateCriadoId}`,
      payload: { ativo: true },
    })
    expect(reativar.statusCode).toBe(200)
  })

  it('retorna 404 ao atualizar template inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: '/api/v1/checklists/templates/00000000-0000-0000-0000-000000000099',
      payload: { nome: 'Fantasma' },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 6. Listagem de execuções ───────────────────────────────────────────────

  it('lista execuções com paginação (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/checklists/execucoes',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: unknown[]
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination.page).toBe(1)
    expect(body.pagination.limit).toBe(20)
    expect(typeof body.pagination.total).toBe('number')
  })

  // ─── 7. Criação de execução ─────────────────────────────────────────────────

  it('inicia execução com template e empreendimento válidos (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/checklists/execucoes',
      payload: {
        templateId: templateCriadoId,
        empreendimentoId,
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: {
        id: string
        status: string
        templateId: string
        empreendimentoId: string
        template: { nome: string; itens: Array<{ id: string }> }
        respostas: unknown[]
      }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.status).toBe('EM_ANDAMENTO')
    expect(body.data.templateId).toBe(templateCriadoId)
    expect(body.data.empreendimentoId).toBe(empreendimentoId)
    expect(Array.isArray(body.data.respostas)).toBe(true)
    expect(body.data.respostas).toHaveLength(0)

    execucaoCriadaId = body.data.id
    execucaoIds.push(execucaoCriadaId)
  })

  it('rejeita execução com templateId de outro tenant / inexistente (404)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/checklists/execucoes',
      payload: {
        templateId: '00000000-0000-0000-0000-000000000099',
        empreendimentoId,
      },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 8. Busca de execução por ID ────────────────────────────────────────────

  it('obtém execução criada com respostas (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/checklists/execucoes/${execucaoCriadaId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: {
        id: string
        status: string
        template: { nome: string; itens: Array<{ id: string }> }
        respostas: unknown[]
      }
    }
    expect(body.data.id).toBe(execucaoCriadaId)
    expect(body.data.status).toBe('EM_ANDAMENTO')
    expect(Array.isArray(body.data.template.itens)).toBe(true)
    expect(Array.isArray(body.data.respostas)).toBe(true)
  })

  it('retorna 404 para execução com ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/checklists/execucoes/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 9. Filtros de listagem de execuções ────────────────────────────────────

  it('filtra execuções por empreendimentoId (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/checklists/execucoes?empreendimentoId=${empreendimentoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ empreendimentoId: string }>
      pagination: { total: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    // A execução criada deve aparecer no resultado
    expect(body.pagination.total).toBeGreaterThanOrEqual(1)
  })

  it('filtra execuções por templateId (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/checklists/execucoes?templateId=${templateCriadoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ templateId: string }> }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(1)
  })

  // ─── 10. Responder item ─────────────────────────────────────────────────────

  it('registra resposta OK em um item da execução (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PUT',
      url: `/api/v1/checklists/execucoes/${execucaoCriadaId}/itens/${templateItemId}`,
      payload: { status: 'OK', observacao: 'Tudo em ordem' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { ok: boolean } }
    expect(body.data.ok).toBe(true)
  })

  it('atualiza resposta existente (upsert → 200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PUT',
      url: `/api/v1/checklists/execucoes/${execucaoCriadaId}/itens/${templateItemId}`,
      payload: { status: 'ATENCAO', observacao: 'Verificar novamente amanhã' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { ok: boolean } }
    expect(body.data.ok).toBe(true)
  })

  it('retorna 404 ao responder item em execução inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PUT',
      url: `/api/v1/checklists/execucoes/00000000-0000-0000-0000-000000000099/itens/${templateItemId}`,
      payload: { status: 'OK' },
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 11. Finalizar execução ─────────────────────────────────────────────────

  it('finaliza execução com observações (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/checklists/execucoes/${execucaoCriadaId}/finalizar`,
      payload: { observacoes: 'Checklist concluído no teste automatizado' },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: { id: string; status: string; finalizadaEm: string }
    }
    expect(body.data.id).toBe(execucaoCriadaId)
    // Status pode ser CONFORME, NAO_CONFORME ou PARCIAL dependendo das respostas
    expect(['CONFORME', 'NAO_CONFORME', 'PARCIAL']).toContain(body.data.status)
    expect(body.data.finalizadaEm).toBeTruthy()
  })

  it('bloqueia dupla finalização de execução (409)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/checklists/execucoes/${execucaoCriadaId}/finalizar`,
      payload: {},
    })
    expect(response.statusCode).toBe(409)
  })

  it('bloqueia responder item em execução já finalizada (409)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PUT',
      url: `/api/v1/checklists/execucoes/${execucaoCriadaId}/itens/${templateItemId}`,
      payload: { status: 'OK' },
    })
    expect(response.statusCode).toBe(409)
  })

  // ─── 12. Validação de schema ────────────────────────────────────────────────

  it('rejeita criação de template sem itens (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/checklists/templates',
      payload: {
        nome: 'Template Sem Itens',
        modulo: 'GERAL',
        periodicidade: 'MENSAL',
        itens: [], // array vazio — min(1)
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de template com módulo inválido (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/checklists/templates',
      payload: {
        nome: 'Template Módulo Inválido',
        modulo: 'INEXISTENTE',
        periodicidade: 'DIARIO',
        itens: [{ ordem: 1, descricao: 'Item 1' }],
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação de template com periodicidade inválida (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/checklists/templates',
      payload: {
        nome: 'Template Periodicidade Inválida',
        modulo: 'GERAL',
        periodicidade: 'BIMESTRAL', // não existe no enum
        itens: [{ ordem: 1, descricao: 'Item 1' }],
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita início de execução com UUID inválido no body (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/checklists/execucoes',
      payload: {
        templateId: 'nao-e-um-uuid',
        empreendimentoId,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita resposta de item com status inválido (400)', async () => {
    // Cria uma execução nova para este teste de validação
    const execResponse = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/checklists/execucoes',
      payload: { templateId: templateCriadoId, empreendimentoId },
    })
    expect(execResponse.statusCode).toBe(201)
    const execBody = execResponse.json() as { data: { id: string } }
    execucaoIds.push(execBody.data.id)

    const response = await authedRequest(app, adminToken, {
      method: 'PUT',
      url: `/api/v1/checklists/execucoes/${execBody.data.id}/itens/${templateItemId}`,
      payload: { status: 'INVALIDO' }, // não é OK | ATENCAO | CRITICO | NA
    })
    expect(response.statusCode).toBe(400)
  })
})
