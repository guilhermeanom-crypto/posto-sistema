import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

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
const NIL_UUID = '00000000-0000-0000-0000-000000000000'

describeIntegration('API de SST', () => {
  let app: AppInstance
  let adminToken: string

  // IDs para cleanup — ordem de exclusão: filhos antes dos pais
  const participanteIds: Array<{ execucaoId: string; funcionarioId: string }> = []
  const epiIds: string[] = []
  const asoIds: string[] = []
  const treinamentoExecucaoIds: string[] = []
  const treinamentoTipoIds: string[] = []
  const documentoIds: string[] = []
  const funcionarioIds: string[] = []

  // Fixtures compartilhadas
  let empreendimentoId: string
  let empreendimentoSecundarioId: string
  let foreignEmpreendimentoId: string
  let funcionarioId: string
  let treinamentoTipoId: string

  beforeAll(async () => {
    await assertIntegrationDatabaseAvailable(prisma)
    app = await buildApp()
    adminToken = await loginDemo(app, 'admin@postodemo.com.br')

    // Buscar empreendimento do tenant de demo
    const emp = await prisma.empreendimento.findFirst({
      where: { tenantId: TENANT_ID },
      select: { id: true },
    })
    if (!emp) throw new Error('Empreendimento do tenant de demo não encontrado')
    empreendimentoId = emp.id

    const empSecundario = await prisma.empreendimento.findFirst({
      where: { tenantId: TENANT_ID, id: { not: empreendimentoId } },
      select: { id: true },
    })
    if (!empSecundario) throw new Error('Segundo empreendimento do tenant de demo não encontrado')
    empreendimentoSecundarioId = empSecundario.id

    const foreignEmp = await prisma.empreendimento.findFirst({
      where: { tenantId: { not: TENANT_ID } },
      select: { id: true },
    })
    if (!foreignEmp) throw new Error('Empreendimento de outro tenant não encontrado')
    foreignEmpreendimentoId = foreignEmp.id

    // Criar funcionário fixture via API
    const funcResp = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/sst/funcionarios',
      payload: {
        empreendimentoId,
        nome: 'Funcionário Teste SST',
        cargo: 'Operador de Teste',
        setor: 'TI',
        vinculo: 'CLT',
        dataAdmissao: '2024-01-15',
      },
    })
    if (funcResp.statusCode !== 201) {
      throw new Error(`Falha ao criar funcionário fixture: ${funcResp.body}`)
    }
    const funcBody = funcResp.json() as { data: { id: string } }
    funcionarioId = funcBody.data.id
    funcionarioIds.push(funcionarioId)

    // Criar tipo de treinamento fixture via API
    const tipoResp = await authedRequest(app, adminToken, {
      method: 'POST',
      url: '/api/v1/sst/treinamentos/tipos',
      payload: {
        nome: 'NR-20 Básico (Teste)',
        normativa: 'NR-20',
        cargaHoraria: 8,
        periodicidadeMeses: 12,
        obrigatorioParaCargos: ['Frentista'],
        conteudoProgramatico: ['Segurança com combustíveis'],
      },
    })
    if (tipoResp.statusCode !== 201) {
      throw new Error(`Falha ao criar tipo de treinamento fixture: ${tipoResp.body}`)
    }
    const tipoBody = tipoResp.json() as { data: { id: string } }
    treinamentoTipoId = tipoBody.data.id
    treinamentoTipoIds.push(treinamentoTipoId)
  })

  afterAll(async () => {
    // Remover participantes de treinamentos
    for (const p of participanteIds) {
      await prisma.treinamentoParticipante
        .delete({
          where: { execucaoId_funcionarioId: { execucaoId: p.execucaoId, funcionarioId: p.funcionarioId } },
        })
        .catch(() => undefined)
    }

    // Remover entregas de EPI
    if (epiIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM entregas_epi WHERE id = ANY($1::text[])`,
        epiIds,
      )
    }

    // Remover ASOs
    if (asoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM asos WHERE id = ANY($1::text[])`,
        asoIds,
      )
    }

    // Remover execuções de treinamento (participantes já excluídos acima)
    if (treinamentoExecucaoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM treinamento_execucoes WHERE id = ANY($1::text[])`,
        treinamentoExecucaoIds,
      )
    }

    // Remover tipos de treinamento
    if (treinamentoTipoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM treinamento_tipos WHERE id = ANY($1::text[])`,
        treinamentoTipoIds,
      )
    }

    // Remover documentos SST
    if (documentoIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM documentos_sst WHERE id = ANY($1::text[])`,
        documentoIds,
      )
    }

    // Remover funcionários
    if (funcionarioIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM funcionarios WHERE id = ANY($1::text[])`,
        funcionarioIds,
      )
    }

    await app?.close()
    await prisma.$disconnect()
  })

  // ─── 1. Autenticação — rotas principais bloqueadas sem JWT ──────────────────

  it('bloqueia GET /funcionarios sem JWT (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/sst/funcionarios' })
    expect(res.statusCode).toBe(401)
  })

  it('bloqueia GET /asos sem JWT (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/sst/asos' })
    expect(res.statusCode).toBe(401)
  })

  it('bloqueia GET /treinamentos sem JWT (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/sst/treinamentos' })
    expect(res.statusCode).toBe(401)
  })

  it('bloqueia GET /epis sem JWT (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/sst/epis' })
    expect(res.statusCode).toBe(401)
  })

  it('bloqueia GET /documentos sem JWT (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/sst/documentos' })
    expect(res.statusCode).toBe(401)
  })

  // ─── 2. Funcionários ────────────────────────────────────────────────────────

  describe('Funcionários', () => {
    it('lista funcionários (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: '/api/v1/sst/funcionarios',
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as {
        data: unknown[]
        kpis: { total: number; ok: number; atencao: number; critico: number }
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.pagination.page).toBe(1)
      expect(body.kpis).toHaveProperty('total')
    })

    it('filtra funcionários por empreendimentoId (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: `/api/v1/sst/funcionarios?empreendimentoId=${empreendimentoId}`,
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: Array<{ empreendimento: { id: string } }> }
      for (const f of body.data) {
        expect(f.empreendimento.id).toBe(empreendimentoId)
      }
    })

    it('busca funcionário fixture por ID (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: `/api/v1/sst/funcionarios/${funcionarioId}`,
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: { id: string; nome: string; cargo: string } }
      expect(body.data.id).toBe(funcionarioId)
      expect(body.data.nome).toBe('Funcionário Teste SST')
      expect(body.data.cargo).toBe('Operador de Teste')
    })

    it('retorna 404 para funcionário inexistente', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: `/api/v1/sst/funcionarios/${NIL_UUID}`,
      })
      expect(res.statusCode).toBe(404)
    })

    it('cria novo funcionário (201)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/funcionarios',
        payload: {
          empreendimentoId,
          nome: 'Segundo Funcionário Teste',
          cargo: 'Frentista',
          setor: 'Pista',
          vinculo: 'CLT',
          dataAdmissao: '2025-03-01',
          email: 'frentista.teste@postodemo.com.br',
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json() as { data: { id: string; nome: string; vinculo: string } }
      expect(body.data.id).toBeTruthy()
      expect(body.data.nome).toBe('Segundo Funcionário Teste')
      expect(body.data.vinculo).toBe('CLT')
      funcionarioIds.push(body.data.id)
    })

    it('rejeita criação de funcionário com empreendimento de outro tenant (404)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/funcionarios',
        payload: {
          empreendimentoId: foreignEmpreendimentoId,
          nome: 'Funcionario Externo',
          cargo: 'Frentista',
          dataAdmissao: '2025-01-01',
        },
      })
      expect(res.statusCode).toBe(404)
    })

    it('rejeita criação sem cargo (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/funcionarios',
        payload: {
          empreendimentoId,
          nome: 'Sem Cargo',
          // cargo ausente
          dataAdmissao: '2025-01-01',
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('rejeita criação com dataAdmissao em formato inválido (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/funcionarios',
        payload: {
          empreendimentoId,
          nome: 'Data Inválida',
          cargo: 'Frentista',
          dataAdmissao: '01/01/2025', // formato errado
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('atualiza setor do funcionário (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'PATCH',
        url: `/api/v1/sst/funcionarios/${funcionarioId}`,
        payload: { setor: 'Manutenção' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: { id: string; setor: string } }
      expect(body.data.setor).toBe('Manutenção')
    })
  })

  // ─── 3. ASOs ────────────────────────────────────────────────────────────────

  describe('ASOs', () => {
    let asoId: string

    it('lista ASOs (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: '/api/v1/sst/asos',
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as {
        data: unknown[]
        pagination: { total: number; page: number }
      }
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.pagination.page).toBe(1)
    })

    it('cria ASO vinculado ao funcionário fixture (201)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/asos',
        payload: {
          empreendimentoId,
          funcionarioId,
          funcionarioNome: 'Funcionário Teste SST',
          cargo: 'Operador de Teste',
          tipo: 'ADMISSIONAL',
          dataExame: '2024-01-15',
          dataVencimento: '2025-01-15',
          aptidao: 'APTO',
          medicoResponsavel: 'Dr. Teste',
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json() as {
        data: { id: string; tipo: string; aptidao: string; funcionarioNome: string }
      }
      expect(body.data.id).toBeTruthy()
      expect(body.data.tipo).toBe('ADMISSIONAL')
      expect(body.data.aptidao).toBe('APTO')
      asoId = body.data.id
      asoIds.push(asoId)
    })

    it('rejeita ASO quando funcionário e empreendimento não combinam (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/asos',
        payload: {
          empreendimentoId: empreendimentoSecundarioId,
          funcionarioId,
          funcionarioNome: 'Funcionário Teste SST',
          cargo: 'Operador de Teste',
          tipo: 'ADMISSIONAL',
          dataExame: '2024-01-15',
          aptidao: 'APTO',
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('cria ASO sem funcionarioId (apenas nome) (201)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/asos',
        payload: {
          empreendimentoId,
          funcionarioNome: 'Funcionário Avulso',
          tipo: 'PERIODICO',
          dataExame: '2025-06-01',
          aptidao: 'APTO_RESTRICOES',
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json() as { data: { id: string; funcionarioNome: string } }
      expect(body.data.funcionarioNome).toBe('Funcionário Avulso')
      asoIds.push(body.data.id)
    })

    it('busca ASO por ID (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: `/api/v1/sst/asos/${asoId}`,
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: { id: string; tipo: string } }
      expect(body.data.id).toBe(asoId)
      expect(body.data.tipo).toBe('ADMISSIONAL')
    })

    it('retorna 404 para ASO inexistente', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: `/api/v1/sst/asos/${NIL_UUID}`,
      })
      expect(res.statusCode).toBe(404)
    })

    it('rejeita criação sem aptidao (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/asos',
        payload: {
          empreendimentoId,
          funcionarioNome: 'Sem Aptidão',
          tipo: 'ADMISSIONAL',
          dataExame: '2025-01-01',
          // aptidao ausente
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('rejeita criação com tipo inválido (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/asos',
        payload: {
          empreendimentoId,
          funcionarioNome: 'Tipo Inválido',
          tipo: 'REVISAO', // não existe no enum
          dataExame: '2025-01-01',
          aptidao: 'APTO',
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('atualiza aptidao do ASO (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'PATCH',
        url: `/api/v1/sst/asos/${asoId}`,
        payload: { aptidao: 'APTO_RESTRICOES', medicoResponsavel: 'Dr. Atualizado' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: { id: string; aptidao: string } }
      expect(body.data.aptidao).toBe('APTO_RESTRICOES')
    })
  })

  // ─── 4. Treinamentos — Tipos ────────────────────────────────────────────────

  describe('Treinamentos — Tipos', () => {
    it('lista tipos de treinamento (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: '/api/v1/sst/treinamentos/tipos',
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: unknown[] }
      expect(Array.isArray(body.data)).toBe(true)
    })

    it('lista tipos filtrados por normativa (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: '/api/v1/sst/treinamentos/tipos?normativa=NR-20',
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: Array<{ normativa: string }> }
      for (const t of body.data) {
        expect(t.normativa).toBe('NR-20')
      }
    })

    it('rejeita criação de tipo com normativa inválida (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/treinamentos/tipos',
        payload: {
          nome: 'NR-99 Fantasia',
          normativa: 'NR-99', // não existe no enum
          cargaHoraria: 4,
          periodicidadeMeses: 12,
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('rejeita criação de tipo sem nome (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/treinamentos/tipos',
        payload: {
          // nome ausente
          normativa: 'NR-35',
          cargaHoraria: 8,
          periodicidadeMeses: 24,
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('atualiza cargaHoraria do tipo de treinamento (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'PATCH',
        url: `/api/v1/sst/treinamentos/tipos/${treinamentoTipoId}`,
        payload: { cargaHoraria: 16 },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: { id: string; cargaHoraria: number } }
      expect(body.data.cargaHoraria).toBe(16)
    })

    it('retorna 404 ao atualizar tipo inexistente', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'PATCH',
        url: `/api/v1/sst/treinamentos/tipos/${NIL_UUID}`,
        payload: { cargaHoraria: 4 },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  // ─── 5. Treinamentos — Execuções ────────────────────────────────────────────

  describe('Treinamentos — Execuções', () => {
    let execucaoId: string

    it('lista execuções de treinamento (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: '/api/v1/sst/treinamentos',
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as {
        data: unknown[]
        pagination: { total: number; page: number }
      }
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.pagination.page).toBe(1)
    })

    it('cria execução de treinamento (201)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/treinamentos',
        payload: {
          empreendimentoId,
          tipoId: treinamentoTipoId,
          dataRealizacao: '2025-05-10',
          instrutor: 'Instrutor Teste',
          cargaHorariaRealizada: 8,
          local: 'Sala de Treinamento',
          participanteIds: [funcionarioId],
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json() as {
        data: {
          id: string
          status: string
          tipo: { normativa: string }
          participantes: Array<{ funcionarioId: string }>
        }
      }
      expect(body.data.id).toBeTruthy()
      expect(body.data.status).toBe('REALIZADO')
      expect(body.data.tipo.normativa).toBe('NR-20')
      execucaoId = body.data.id
      treinamentoExecucaoIds.push(execucaoId)
      // participante já foi criado junto, anotar para cleanup
      participanteIds.push({ execucaoId, funcionarioId })
    })

    it('busca execução por ID (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: `/api/v1/sst/treinamentos/${execucaoId}`,
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as {
        data: { id: string; status: string; participantes: unknown[] }
      }
      expect(body.data.id).toBe(execucaoId)
      expect(body.data.participantes.length).toBeGreaterThanOrEqual(1)
    })

    it('retorna 404 para execução inexistente', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: `/api/v1/sst/treinamentos/${NIL_UUID}`,
      })
      expect(res.statusCode).toBe(404)
    })

    it('rejeita criação sem tipoId (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/treinamentos',
        payload: {
          empreendimentoId,
          // tipoId ausente
          dataRealizacao: '2025-05-10',
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('rejeita criação com tipoId inexistente (404)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/treinamentos',
        payload: {
          empreendimentoId,
          tipoId: NIL_UUID,
          dataRealizacao: '2025-05-10',
        },
      })
      expect(res.statusCode).toBe(404)
    })

    describe('Participantes', () => {
      let segundoFuncionarioId: string

      beforeAll(async () => {
        // Criar segundo funcionário para testar adição de participante
        const res = await authedRequest(app, adminToken, {
          method: 'POST',
          url: '/api/v1/sst/funcionarios',
          payload: {
            empreendimentoId,
            nome: 'Terceiro Funcionário Teste',
            cargo: 'Gerente de Teste',
            dataAdmissao: '2025-01-01',
          },
        })
        expect(res.statusCode).toBe(201)
        const body = res.json() as { data: { id: string } }
        segundoFuncionarioId = body.data.id
        funcionarioIds.push(segundoFuncionarioId)
      })

      it('adiciona participante à execução (201)', async () => {
        const res = await authedRequest(app, adminToken, {
          method: 'POST',
          url: `/api/v1/sst/treinamentos/${execucaoId}/participantes`,
          payload: { funcionarioId: segundoFuncionarioId },
        })
        expect(res.statusCode).toBe(201)
        const body = res.json() as {
          data: { funcionarioId: string; presenca: boolean; aprovado: boolean }
        }
        expect(body.data.funcionarioId).toBe(segundoFuncionarioId)
        expect(body.data.presenca).toBe(true)
        participanteIds.push({ execucaoId, funcionarioId: segundoFuncionarioId })
      })

      it('atualiza presença do participante (200)', async () => {
        const res = await authedRequest(app, adminToken, {
          method: 'PATCH',
          url: `/api/v1/sst/treinamentos/${execucaoId}/participantes/${segundoFuncionarioId}`,
          payload: { presenca: false, aprovado: false },
        })
        expect(res.statusCode).toBe(200)
        const body = res.json() as { data: { presenca: boolean; aprovado: boolean } }
        expect(body.data.presenca).toBe(false)
        expect(body.data.aprovado).toBe(false)
      })

      it('remove participante (204)', async () => {
        const res = await authedRequest(app, adminToken, {
          method: 'DELETE',
          url: `/api/v1/sst/treinamentos/${execucaoId}/participantes/${segundoFuncionarioId}`,
        })
        expect(res.statusCode).toBe(204)
        // Remover do array de cleanup pois já foi deletado
        const idx = participanteIds.findIndex(
          (p) => p.execucaoId === execucaoId && p.funcionarioId === segundoFuncionarioId,
        )
        if (idx !== -1) participanteIds.splice(idx, 1)
      })
    })
  })

  // ─── 6. EPI ─────────────────────────────────────────────────────────────────

  describe('EPI — Entregas', () => {
    let epiId: string

    it('lista entregas de EPI (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: '/api/v1/sst/epis',
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as {
        data: unknown[]
        pagination: { total: number; page: number }
      }
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.pagination.page).toBe(1)
    })

    it('cria entrega de EPI (201)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/epis',
        payload: {
          empreendimentoId,
          funcionarioId,
          tipoEPI: 'Calçado de Segurança',
          ca: '12345',
          quantidade: 1,
          dataEntrega: '2025-05-01',
          dataVencimento: '2026-05-01',
          observacoes: 'Entregue na admissão',
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json() as {
        data: {
          id: string
          tipoEPI: string
          status: string
          funcionario: { id: string; nome: string }
        }
      }
      expect(body.data.id).toBeTruthy()
      expect(body.data.tipoEPI).toBe('Calçado de Segurança')
      expect(body.data.status).toBe('VIGENTE')
      expect(body.data.funcionario.id).toBe(funcionarioId)
      epiId = body.data.id
      epiIds.push(epiId)
    })

    it('filtra EPIs por funcionarioId (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: `/api/v1/sst/epis?funcionarioId=${funcionarioId}`,
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: Array<{ funcionario: { id: string } }> }
      for (const epi of body.data) {
        expect(epi.funcionario.id).toBe(funcionarioId)
      }
    })

    it('rejeita criação sem funcionarioId (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/epis',
        payload: {
          empreendimentoId,
          // funcionarioId ausente
          tipoEPI: 'Luva',
          dataEntrega: '2025-05-01',
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('rejeita criação com funcionarioId inexistente (404)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/epis',
        payload: {
          empreendimentoId,
          funcionarioId: NIL_UUID,
          tipoEPI: 'Luva',
          dataEntrega: '2025-05-01',
        },
      })
      expect(res.statusCode).toBe(404)
    })

    it('atualiza status de EPI para DEVOLVIDO (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'PATCH',
        url: `/api/v1/sst/epis/${epiId}`,
        payload: { status: 'DEVOLVIDO', observacoes: 'Devolvido ao desligamento' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: { id: string; status: string } }
      expect(body.data.status).toBe('DEVOLVIDO')
    })
  })

  // ─── 7. Documentos SST ──────────────────────────────────────────────────────

  describe('Documentos SST', () => {
    let documentoId: string

    it('lista documentos SST (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: '/api/v1/sst/documentos',
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as {
        data: unknown[]
        pagination: { total: number; page: number }
      }
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.pagination.page).toBe(1)
    })

    it('cria documento SST (201)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/documentos',
        payload: {
          empreendimentoId,
          tipo: 'PCMSO',
          responsavel: 'Dr. Medicina do Trabalho',
          dataElaboracao: '2025-01-10',
          dataVencimento: '2026-01-10',
          observacoes: 'Documento anual',
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json() as {
        data: {
          id: string
          tipo: string
          status: string
          empreendimento: { id: string }
        }
      }
      expect(body.data.id).toBeTruthy()
      expect(body.data.tipo).toBe('PCMSO')
      expect(body.data.empreendimento.id).toBe(empreendimentoId)
      documentoId = body.data.id
      documentoIds.push(documentoId)
    })

    it('filtra documentos por tipo (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'GET',
        url: '/api/v1/sst/documentos?tipo=PCMSO',
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: Array<{ tipo: string }> }
      for (const doc of body.data) {
        expect(doc.tipo).toBe('PCMSO')
      }
    })

    it('rejeita criação sem tipo (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/documentos',
        payload: {
          empreendimentoId,
          // tipo ausente
          responsavel: 'Alguém',
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('rejeita criação com tipo inválido (400)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'POST',
        url: '/api/v1/sst/documentos',
        payload: {
          empreendimentoId,
          tipo: 'RELATORIO_FANTASMA', // não existe no enum
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('atualiza responsável do documento SST (200)', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'PATCH',
        url: `/api/v1/sst/documentos/${documentoId}`,
        payload: { responsavel: 'Dr. Novo Responsável', observacoes: 'Atualizado no teste' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { data: { id: string; responsavel: string } }
      expect(body.data.responsavel).toBe('Dr. Novo Responsável')
    })

    it('retorna 404 ao atualizar documento inexistente', async () => {
      const res = await authedRequest(app, adminToken, {
        method: 'PATCH',
        url: `/api/v1/sst/documentos/${NIL_UUID}`,
        payload: { responsavel: 'Qualquer Um' },
      })
      expect(res.statusCode).toBe(404)
    })
  })
})
