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

describeIntegration('API de tarefas', () => {
  let app: AppInstance
  let adminToken: string
  let coordenadorToken: string
  let analistaToken: string

  let empreendimentoId: string
  let empreendimentoSecundarioId: string
  let foreignEmpreendimentoId: string
  let adminUserId: string
  let analistaUserId: string
  let processoPrimarioId: string

  // IDs rastreados para limpeza no afterAll
  const tarefaIds: string[] = []

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()

    adminToken = await loginDemo(app, 'admin@postodemo.com.br')
    coordenadorToken = await loginDemo(app, 'coord@postodemo.com.br')
    analistaToken = await loginDemo(app, 'analista@postodemo.com.br')

    // Busca empreendimento do tenant de demonstração para usar como FK
    const emp = await prisma.empreendimento.findFirst({
      where: { tenantId: TENANT_ID },
      select: { id: true },
    })
    if (!emp) throw new Error('Nenhum empreendimento encontrado para o tenant de demonstração')
    empreendimentoId = emp.id

    const empSecundario = await prisma.empreendimento.findFirst({
      where: { tenantId: TENANT_ID, id: { not: empreendimentoId } },
      select: { id: true },
    })
    if (!empSecundario) throw new Error('Nenhum segundo empreendimento encontrado para o tenant de demonstração')
    empreendimentoSecundarioId = empSecundario.id

    const foreignEmp = await prisma.empreendimento.findFirst({
      where: { tenantId: { not: TENANT_ID } },
      select: { id: true },
    })
    if (!foreignEmp) throw new Error('Nenhum empreendimento de outro tenant encontrado')
    foreignEmpreendimentoId = foreignEmp.id

    const tipoProcesso = await prisma.tipoProcesso.findFirst({
      where: { tenantId: TENANT_ID, ativo: true },
      select: { id: true },
    })
    if (!tipoProcesso) throw new Error('Nenhum tipo de processo ativo encontrado para o tenant de demonstração')

    const processo = await prisma.processo.create({
      data: {
        tenantId: TENANT_ID,
        empreendimentoId,
        tipoProcessoId: tipoProcesso.id,
        orgaoId: (
          await prisma.orgaoRegulador.findFirst({
            where: { tenantId: TENANT_ID },
            select: { id: true },
          })
        )!.id,
        status: 'EM_ELABORACAO',
      },
      select: { id: true },
    })
    processoPrimarioId = processo.id

    // Descobre o ID do admin e do analista via /auth/me
    const meAdmin = await authedRequest(app, adminToken, { method: 'GET', url: '/api/v1/auth/me' })
    adminUserId = (meAdmin.json() as { data: { id: string } }).data.id

    const meAnalista = await authedRequest(app, analistaToken, { method: 'GET', url: '/api/v1/auth/me' })
    analistaUserId = (meAnalista.json() as { data: { id: string } }).data.id
  })

  afterAll(async () => {
    if (tarefaIds.length > 0) {
      // Remove evidências antes das tarefas (FK)
      await prisma.$executeRawUnsafe(
        `DELETE FROM evidencias_tarefas WHERE tarefa_id = ANY($1::text[])`,
        tarefaIds,
      )
      // Remove dependências antes das tarefas (FK)
      await prisma.$executeRawUnsafe(
        `DELETE FROM tarefas_dependencias WHERE tarefa_id = ANY($1::text[]) OR depende_de_id = ANY($1::text[])`,
        tarefaIds,
      )
      await prisma.$executeRawUnsafe(
        `DELETE FROM tarefas WHERE id = ANY($1::text[])`,
        tarefaIds,
      )
    }
    if (processoPrimarioId) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM processos WHERE id = $1`,
        processoPrimarioId,
      )
    }
    await app?.close()
    await prisma.$disconnect()
  })

  // ─── 1. Autenticação ────────────────────────────────────────────────────────

  it('bloqueia listagem de tarefas sem JWT (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/tarefas' })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia GET /:id sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tarefas/00000000-0000-0000-0000-000000000000',
    })
    expect(response.statusCode).toBe(401)
  })

  it('bloqueia criação de tarefa sem JWT (401)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/tarefas',
      headers: { 'content-type': 'application/json' },
      payload: {
        empreendimentoId,
        titulo: 'Tarefa sem token',
      },
    })
    expect(response.statusCode).toBe(401)
  })

  // ─── 2. Listagem ────────────────────────────────────────────────────────────

  it('lista tarefas do tenant com admin (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/tarefas',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: Array<{ id: string; titulo: string; status: string }>
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination.page).toBe(1)
    expect(typeof body.pagination.total).toBe('number')
  })

  it('aceita filtro por empreendimentoId (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/tarefas?empreendimentoId=${empreendimentoId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ empreendimento: { id: string } }> }
    for (const t of body.data) {
      expect(t.empreendimento.id).toBe(empreendimentoId)
    }
  })

  it('aceita filtro por status (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/tarefas?status=PENDENTE',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: Array<{ status: string }> }
    for (const t of body.data) {
      expect(t.status).toBe('PENDENTE')
    }
  })

  it('respeita paginação (limit=1)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/tarefas?limit=1&page=1',
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: unknown[]
      pagination: { limit: number; page: number }
    }
    expect(body.data.length).toBeLessThanOrEqual(1)
    expect(body.pagination.limit).toBe(1)
    expect(body.pagination.page).toBe(1)
  })

  // ─── 3. Criação ─────────────────────────────────────────────────────────────

  let tarefaCriadaId: string

  it('cria tarefa com payload válido (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId,
        titulo: 'Tarefa de teste de integração',
        descricao: 'Descrição da tarefa criada pelo teste automatizado',
        prioridade: 'ALTA',
        dataVencimento: '2030-12-31T23:59:59.000Z',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: { id: string; titulo: string; status: string; prioridade: string; empreendimentoId: string }
    }
    expect(body.data.id).toBeTruthy()
    expect(body.data.titulo).toBe('Tarefa de teste de integração')
    expect(body.data.status).toBe('PENDENTE')
    expect(body.data.prioridade).toBe('ALTA')
    expect(body.data.empreendimentoId).toBe(empreendimentoId)
    tarefaCriadaId = body.data.id
    tarefaIds.push(tarefaCriadaId)
  })

  it('cria tarefa com responsável definido (201)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId,
        titulo: 'Tarefa com responsável definido',
        responsavelId: analistaUserId,
        prioridade: 'MEDIA',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as {
      data: { id: string; responsavelId: string }
    }
    expect(body.data.responsavelId).toBe(analistaUserId)
    tarefaIds.push(body.data.id)
  })

  it('rejeita criação com empreendimento de outro tenant (404)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId: foreignEmpreendimentoId,
        titulo: 'Tarefa com empreendimento externo',
      },
    })
    expect(response.statusCode).toBe(404)
  })

  it('rejeita criação quando processo e empreendimento não combinam (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId: empreendimentoSecundarioId,
        processoId: processoPrimarioId,
        titulo: 'Tarefa com contexto incoerente',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 4. Busca por ID ────────────────────────────────────────────────────────

  it('retorna a tarefa criada pelo seu ID (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: `/api/v1/tarefas/${tarefaCriadaId}`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: {
        id: string
        titulo: string
        status: string
        empreendimento: { id: string }
        evidencias: unknown[]
      }
    }
    expect(body.data.id).toBe(tarefaCriadaId)
    expect(body.data.titulo).toBe('Tarefa de teste de integração')
    expect(body.data.status).toBe('PENDENTE')
    expect(body.data.empreendimento.id).toBe(empreendimentoId)
    expect(Array.isArray(body.data.evidencias)).toBe(true)
  })

  it('retorna 404 para ID inexistente', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/tarefas/00000000-0000-0000-0000-000000000099',
    })
    expect(response.statusCode).toBe(404)
  })

  // ─── 5. Atualização ─────────────────────────────────────────────────────────

  it('atualiza título e prioridade da tarefa (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/tarefas/${tarefaCriadaId}`,
      payload: {
        titulo: 'Tarefa de teste atualizada',
        prioridade: 'CRITICA',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; titulo: string; prioridade: string } }
    expect(body.data.id).toBe(tarefaCriadaId)
    expect(body.data.titulo).toBe('Tarefa de teste atualizada')
    expect(body.data.prioridade).toBe('CRITICA')
  })

  // ─── 6. Transição de status: PENDENTE → EM_ANDAMENTO ───────────────────────

  it('inicia a tarefa (PENDENTE → EM_ANDAMENTO) com admin (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${tarefaCriadaId}/iniciar`,
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { id: string; status: string } }
    expect(body.data.status).toBe('EM_ANDAMENTO')

    // Verifica no banco
    const tarefa = await prisma.tarefa.findUnique({ where: { id: tarefaCriadaId } })
    expect(tarefa?.status).toBe('EM_ANDAMENTO')
  })

  it('impede dupla transição: tarefa já EM_ANDAMENTO não pode ser iniciada novamente (400/422)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${tarefaCriadaId}/iniciar`,
    })
    // EM_ANDAMENTO → EM_ANDAMENTO é inválido — deve retornar erro de transição (400 ou 422)
    expect(response.statusCode).toBeGreaterThanOrEqual(400)
    expect(response.statusCode).toBeLessThan(500)
  })

  // ─── 7. Conclusão ────────────────────────────────────────────────────────────

  it('conclui a tarefa com evidência de texto (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${tarefaCriadaId}/concluir`,
      payload: {
        observacoesConclusao: 'Tarefa concluída durante teste de integração',
        evidencias: [
          {
            tipo: 'TEXTO',
            descricao: 'Evidência textual da conclusão',
            textoLivre: 'Texto detalhado descrevendo a conclusão da tarefa automatizada.',
          },
        ],
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as {
      data: { id: string; status: string; dataConclusao: string; evidencias: unknown[] }
    }
    expect(body.data.status).toBe('CONCLUIDA')
    expect(body.data.dataConclusao).toBeTruthy()
    expect(Array.isArray(body.data.evidencias)).toBe(true)
    expect(body.data.evidencias.length).toBeGreaterThanOrEqual(1)

    // Verifica no banco
    const tarefa = await prisma.tarefa.findUnique({ where: { id: tarefaCriadaId } })
    expect(tarefa?.status).toBe('CONCLUIDA')
    expect(tarefa?.dataConclusao).toBeTruthy()
  })

  it('impede atualização de tarefa CONCLUIDA (400/422)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'PATCH',
      url: `/api/v1/tarefas/${tarefaCriadaId}`,
      payload: { titulo: 'Tentativa de atualização após conclusão' },
    })
    expect(response.statusCode).toBeGreaterThanOrEqual(400)
    expect(response.statusCode).toBeLessThan(500)
  })

  // ─── 8. Reatribuição ─────────────────────────────────────────────────────────

  let tarefaParaReatribuirId: string

  it('cria tarefa auxiliar para testes de reatribuição/cancelamento', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId,
        titulo: 'Tarefa para reatribuição e cancelamento',
        responsavelId: analistaUserId,
        prioridade: 'BAIXA',
      },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json() as { data: { id: string } }
    tarefaParaReatribuirId = body.data.id
    tarefaIds.push(tarefaParaReatribuirId)
  })

  it('reatribui tarefa com coordenador (200)', async () => {
    const response = await authedRequest(app, coordenadorToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${tarefaParaReatribuirId}/reatribuir`,
      payload: {
        responsavelId: adminUserId,
        motivo: 'Reatribuição para o admin para fins de teste',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { responsavelId: string } }
    expect(body.data.responsavelId).toBe(adminUserId)
  })

  it('bloqueia reatribuição por perfil ANALISTA (403)', async () => {
    const response = await authedRequest(app, analistaToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${tarefaParaReatribuirId}/reatribuir`,
      payload: {
        responsavelId: analistaUserId,
      },
    })
    expect(response.statusCode).toBe(403)
  })

  // ─── 9. Cancelamento ────────────────────────────────────────────────────────

  it('cancela tarefa com justificativa (200)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${tarefaParaReatribuirId}/cancelar`,
      payload: {
        motivo: 'Cancelamento solicitado para fins de teste automatizado',
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { mensagem: string } }
    expect(body.data.mensagem).toBeTruthy()

    // Verifica no banco
    const tarefa = await prisma.tarefa.findUnique({ where: { id: tarefaParaReatribuirId } })
    expect(tarefa?.status).toBe('CANCELADA')
  })

  it('impede cancelamento duplo de tarefa já CANCELADA (400/422)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${tarefaParaReatribuirId}/cancelar`,
      payload: {
        motivo: 'Tentativa de segundo cancelamento',
      },
    })
    expect(response.statusCode).toBeGreaterThanOrEqual(400)
    expect(response.statusCode).toBeLessThan(500)
  })

  // ─── 10. Validação de schema ─────────────────────────────────────────────────

  it('rejeita criação sem empreendimentoId (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        titulo: 'Tarefa sem empreendimento',
        prioridade: 'MEDIA',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita criação com título muito curto (400)', async () => {
    // 'Curto' tem 5 chars, que é o mínimo permitido (min(5)). Use 4 chars para forçar erro.
    const response2 = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId,
        titulo: 'Cur',
      },
    })
    expect(response2.statusCode).toBe(400)
  })

  it('rejeita criação com prioridade inválida (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId,
        titulo: 'Tarefa com prioridade inválida',
        prioridade: 'URGENTISSIMA',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita cancelamento sem motivo (400)', async () => {
    // Cria uma tarefa nova para tentar cancelar sem motivo
    const criacao = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId,
        titulo: 'Tarefa para rejeição de cancelamento',
      },
    })
    expect(criacao.statusCode).toBe(201)
    const { data } = criacao.json() as { data: { id: string } }
    tarefaIds.push(data.id)

    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${data.id}/cancelar`,
      payload: {
        motivo: 'Cur', // menos de 5 chars
      },
    })
    expect(response.statusCode).toBe(400)
  })

  it('rejeita GET com UUID inválido no path (400)', async () => {
    const response = await authedRequest(app, adminToken, {
      method: 'GET',
      url: '/api/v1/tarefas/nao-e-um-uuid',
    })
    expect(response.statusCode).toBe(400)
  })

  // ─── 11. Conclusão com evidência de link ────────────────────────────────────

  it('conclui tarefa com evidência do tipo LINK (200)', async () => {
    // Cria tarefa específica para este teste
    const criacao = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId,
        titulo: 'Tarefa para conclusão com link',
        responsavelId: adminUserId,
        prioridade: 'MEDIA',
      },
    })
    expect(criacao.statusCode).toBe(201)
    const { data: novaTarefa } = criacao.json() as { data: { id: string } }
    tarefaIds.push(novaTarefa.id)

    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${novaTarefa.id}/concluir`,
      payload: {
        evidencias: [
          {
            tipo: 'LINK',
            descricao: 'Referência externa',
            url: 'https://exemplo.com/evidencia',
          },
        ],
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { status: string; evidencias: Array<{ tipo: string }> } }
    expect(body.data.status).toBe('CONCLUIDA')
    const evidenciaLink = body.data.evidencias.find((e) => e.tipo === 'LINK')
    expect(evidenciaLink).toBeTruthy()
  })

  // ─── 12. Conclusão sem evidências ───────────────────────────────────────────

  it('conclui tarefa sem evidências (array vazio) (200)', async () => {
    const criacao = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/tarefas',
      payload: {
        empreendimentoId,
        titulo: 'Tarefa para conclusão sem evidências',
        responsavelId: adminUserId,
        prioridade: 'BAIXA',
      },
    })
    expect(criacao.statusCode).toBe(201)
    const { data: novaTarefa } = criacao.json() as { data: { id: string } }
    tarefaIds.push(novaTarefa.id)

    const response = await authedRequest(app, adminToken, {
      method: 'POST',
      url: `/api/v1/tarefas/${novaTarefa.id}/concluir`,
      payload: {
        evidencias: [],
      },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { data: { status: string } }
    expect(body.data.status).toBe('CONCLUIDA')
  })
})
