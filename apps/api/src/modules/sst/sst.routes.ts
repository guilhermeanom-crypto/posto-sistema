import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'
import { sstService } from './sst.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// SST ROUTES — Funcionários, ASOs, Treinamentos, EPI, Documentos SST
// ─────────────────────────────────────────────────────────────────────────────

const tiposASO = ['ADMISSIONAL', 'PERIODICO', 'DEMISSIONAL', 'RETORNO', 'MUDANCA_FUNCAO'] as const
const aptidoes = ['APTO', 'INAPTO', 'APTO_RESTRICOES'] as const
const tiposDocSST = ['PCMSO', 'PPRA', 'PGR', 'LTCAT', 'LAUDO_ERGONOMICO', 'PPCI_SST', 'OUTROS'] as const
const vinculos = ['CLT', 'PJ', 'TERCEIRIZADO', 'ESTAGIO', 'TEMPORARIO'] as const
const normativas = ['NR-20', 'NR-35', 'NR-10', 'NR-12', 'NR-06', 'NR-07', 'CIPA', 'BRIGADA', 'OUTROS'] as const

const pag = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const sstRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)
  const ctx = (req: FastifyRequest) => ({
    id: req.user.id, tenantId: req.user.tenantId, perfil: req.user.perfil,
    nome: req.user.nome, email: req.user.email, ip: extrairIp(req),
  })

  // ══ FUNCIONÁRIOS ═════════════════════════════════════════════════════════════

  app.get('/funcionarios', {
    schema: {
      querystring: pag.extend({
        empreendimentoId: z.string().uuid().optional(),
        ativo: z.coerce.boolean().optional(),
        cargo: z.string().optional(),
        setor: z.string().optional(),
      }),
      tags: ['sst'],
      summary: 'Lista funcionários com status semáforo',
    },
  }, async (req, reply) => {
    const result = await sstService.listarFuncionarios(ctx(req), req.query)
    return reply.send({
      data: result.items,
      kpis: result.kpis,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })

  app.get('/funcionarios/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['sst'] },
  }, async (req, reply) => {
    const f = await sstService.buscarFuncionarioPorId(ctx(req), req.params.id)
    return reply.send({ data: f })
  })

  app.post('/funcionarios', {
    schema: {
      body: z.object({
        empreendimentoId: z.string().uuid(),
        nome: z.string().min(2),
        cpf: z.string().optional(),
        rg: z.string().optional(),
        dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        cargo: z.string().min(2),
        setor: z.string().optional(),
        vinculo: z.enum(vinculos).default('CLT'),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        dataAdmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        observacoes: z.string().optional(),
      }),
      response: { 201: z.object({ data: z.record(z.unknown()) }) },
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const f = await sstService.criarFuncionario(ctx(req), req.body)
    return reply.status(201).send({ data: f })
  })

  app.patch('/funcionarios/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        nome: z.string().optional(),
        cargo: z.string().optional(),
        setor: z.string().optional(),
        vinculo: z.enum(vinculos).optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        observacoes: z.string().optional(),
        dataDemissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        motivoDemissao: z.string().optional(),
        ativo: z.boolean().optional(),
      }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const f = await sstService.atualizarFuncionario(ctx(req), req.params.id, req.body)
    return reply.send({ data: f })
  })

  // ══ ASOs ═════════════════════════════════════════════════════════════════════

  app.get('/asos', {
    schema: {
      querystring: pag.extend({
        empreendimentoId: z.string().uuid().optional(),
        tipo: z.enum(tiposASO).optional(),
        aptidao: z.enum(aptidoes).optional(),
      }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const result = await sstService.listarASOs(ctx(req), req.query)
    return reply.send({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })

  app.get('/asos/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['sst'] },
  }, async (req, reply) => {
    const aso = await sstService.buscarASOPorId(ctx(req), req.params.id)
    return reply.send({ data: aso })
  })

  app.post('/asos', {
    schema: {
      body: z.object({
        empreendimentoId: z.string().uuid(),
        funcionarioId: z.string().uuid().optional(),
        funcionarioNome: z.string().min(1),
        funcionarioCPF: z.string().optional(),
        cargo: z.string().optional(),
        tipo: z.enum(tiposASO),
        dataExame: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        aptidao: z.enum(aptidoes),
        medicoResponsavel: z.string().optional(),
        observacoes: z.string().optional(),
      }),
      response: { 201: z.object({ data: z.record(z.unknown()) }) },
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const aso = await sstService.criarASO(ctx(req), req.body)
    return reply.status(201).send({ data: aso })
  })

  // PATCH /asos/:id — atualizar ASO
  app.patch('/asos/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        funcionarioNome: z.string().min(1).optional(),
        cargo: z.string().optional(),
        tipo: z.enum(tiposASO).optional(),
        dataExame: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        aptidao: z.enum(aptidoes).optional(),
        medicoResponsavel: z.string().nullable().optional(),
        observacoes: z.string().nullable().optional(),
      }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const aso = await sstService.atualizarASO(ctx(req), req.params.id, req.body)
    return reply.send({ data: aso })
  })

  // ══ TREINAMENTOS — Tipos ═════════════════════════════════════════════════════

  app.get('/treinamentos/tipos', {
    schema: {
      querystring: z.object({
        ativo: z.coerce.boolean().optional(),
        normativa: z.string().optional(),
      }),
      tags: ['sst'],
      summary: 'Lista tipos/templates de treinamento',
    },
  }, async (req, reply) => {
    const data = await sstService.listarTreinamentoTipos(ctx(req), req.query)
    return reply.send({ data })
  })

  app.post('/treinamentos/tipos', {
    schema: {
      body: z.object({
        nome: z.string().min(3),
        normativa: z.enum(normativas),
        cargaHoraria: z.number().int().min(1),
        periodicidadeMeses: z.number().int().min(0),
        obrigatorioParaCargos: z.array(z.string()).default([]),
        conteudoProgramatico: z.array(z.string()).default([]),
      }),
      response: { 201: z.object({ data: z.record(z.unknown()) }) },
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const t = await sstService.criarTreinamentoTipo(ctx(req), req.body)
    return reply.status(201).send({ data: t })
  })

  app.patch('/treinamentos/tipos/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        nome: z.string().optional(),
        cargaHoraria: z.number().int().optional(),
        periodicidadeMeses: z.number().int().optional(),
        obrigatorioParaCargos: z.array(z.string()).optional(),
        conteudoProgramatico: z.array(z.string()).optional(),
        ativo: z.boolean().optional(),
      }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const t = await sstService.atualizarTreinamentoTipo(ctx(req), req.params.id, req.body)
    return reply.send({ data: t })
  })

  // ══ TREINAMENTOS — Execuções ═════════════════════════════════════════════════

  app.get('/treinamentos', {
    schema: {
      querystring: pag.extend({
        empreendimentoId: z.string().uuid().optional(),
        tipoId: z.string().uuid().optional(),
        status: z.string().optional(),
        normativa: z.string().optional(),
      }),
      tags: ['sst'],
      summary: 'Lista execuções de treinamento',
    },
  }, async (req, reply) => {
    const result = await sstService.listarTreinamentoExecucoes(ctx(req), req.query)
    return reply.send({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })

  app.get('/treinamentos/:id', {
    schema: { params: z.object({ id: z.string().uuid() }), tags: ['sst'] },
  }, async (req, reply) => {
    const t = await sstService.buscarTreinamentoExecucaoPorId(ctx(req), req.params.id)
    return reply.send({ data: t })
  })

  app.post('/treinamentos', {
    schema: {
      body: z.object({
        empreendimentoId: z.string().uuid(),
        tipoId: z.string().uuid(),
        dataRealizacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        instrutor: z.string().optional(),
        cargaHorariaRealizada: z.number().int().optional(),
        local: z.string().optional(),
        observacoes: z.string().optional(),
        participanteIds: z.array(z.string().uuid()).default([]),
      }),
      response: { 201: z.object({ data: z.record(z.unknown()) }) },
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const t = await sstService.criarTreinamentoExecucao(ctx(req), req.body)
    return reply.status(201).send({ data: t })
  })

  // Participantes — adicionar / atualizar / remover
  app.post('/treinamentos/:id/participantes', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ funcionarioId: z.string().uuid() }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const p = await sstService.adicionarParticipante(ctx(req), req.params.id, req.body.funcionarioId)
    return reply.status(201).send({ data: p })
  })

  app.patch('/treinamentos/:id/participantes/:funcionarioId', {
    schema: {
      params: z.object({ id: z.string().uuid(), funcionarioId: z.string().uuid() }),
      body: z.object({ presenca: z.boolean().optional(), aprovado: z.boolean().optional() }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const p = await sstService.atualizarParticipante(ctx(req), req.params.id, req.params.funcionarioId, req.body)
    return reply.send({ data: p })
  })

  app.delete('/treinamentos/:id/participantes/:funcionarioId', {
    schema: {
      params: z.object({ id: z.string().uuid(), funcionarioId: z.string().uuid() }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    await sstService.removerParticipante(ctx(req), req.params.id, req.params.funcionarioId)
    return reply.status(204).send()
  })

  // ══ EPI ══════════════════════════════════════════════════════════════════════

  app.get('/epis', {
    schema: {
      querystring: pag.extend({
        empreendimentoId: z.string().uuid().optional(),
        funcionarioId: z.string().uuid().optional(),
        status: z.enum(['VIGENTE', 'VENCIDO', 'DEVOLVIDO']).optional(),
      }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const result = await sstService.listarEntregasEPI(ctx(req), req.query)
    return reply.send({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })

  app.post('/epis', {
    schema: {
      body: z.object({
        empreendimentoId: z.string().uuid(),
        funcionarioId: z.string().uuid(),
        tipoEPI: z.string().min(2),
        ca: z.string().optional(),
        quantidade: z.number().int().positive().default(1),
        dataEntrega: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        observacoes: z.string().optional(),
      }),
      response: { 201: z.object({ data: z.record(z.unknown()) }) },
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const epi = await sstService.criarEntregaEPI(ctx(req), req.body)
    return reply.status(201).send({ data: epi })
  })

  app.patch('/epis/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        status: z.enum(['VIGENTE', 'VENCIDO', 'DEVOLVIDO']).optional(),
        observacoes: z.string().optional(),
      }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const epi = await sstService.atualizarEntregaEPI(ctx(req), req.params.id, req.body)
    return reply.send({ data: epi })
  })

  // ══ DOCUMENTOS SST ═══════════════════════════════════════════════════════════

  app.get('/documentos', {
    schema: {
      querystring: pag.extend({
        empreendimentoId: z.string().uuid().optional(),
        tipo: z.enum(tiposDocSST).optional(),
      }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const result = await sstService.listarDocumentosSST(ctx(req), req.query)
    return reply.send({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  })

  app.post('/documentos', {
    schema: {
      body: z.object({
        empreendimentoId: z.string().uuid(),
        tipo: z.enum(tiposDocSST),
        responsavel: z.string().optional(),
        dataElaboracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        observacoes: z.string().optional(),
      }),
      response: { 201: z.object({ data: z.record(z.unknown()) }) },
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const doc = await sstService.criarDocumentoSST(ctx(req), req.body)
    return reply.status(201).send({ data: doc })
  })

  app.patch('/documentos/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        tipo: z.enum(tiposDocSST).optional(),
        responsavel: z.string().optional(),
        dataElaboracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        status: z.string().optional(),
        observacoes: z.string().optional(),
      }),
      tags: ['sst'],
    },
  }, async (req, reply) => {
    const doc = await sstService.atualizarDocumentoSST(ctx(req), req.params.id, req.body)
    return reply.send({ data: doc })
  })
}
