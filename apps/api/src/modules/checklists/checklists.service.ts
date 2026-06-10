import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError, ConflictError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'

interface Ctx {
  id: string
  tenantId: string
  perfil: string
  nome?: string
  email?: string
  ip?: string
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const checklistsService = {
  // ── Templates ──────────────────────────────────────────────────────────────

  async listarTemplates(ctx: Ctx, filters: { modulo?: string; ativo?: boolean }) {
    const templates = await prisma.checklistTemplate.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(filters.modulo ? { modulo: filters.modulo } : {}),
        ...(filters.ativo !== undefined ? { ativo: filters.ativo } : {}),
      },
      include: { itens: { orderBy: { ordem: 'asc' } } },
      orderBy: [{ modulo: 'asc' }, { nome: 'asc' }],
    })
    return templates
  },

  async obterTemplate(ctx: Ctx, id: string) {
    const template = await prisma.checklistTemplate.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { itens: { orderBy: { ordem: 'asc' } } },
    })
    if (!template) throw new NotFoundError('Template')
    return template
  },

  async criarTemplate(ctx: Ctx, data: {
    nome: string
    descricao?: string
    modulo: string
    periodicidade: string
    itens: { ordem: number; descricao: string; obrigatorio?: boolean; categoria?: string }[]
  }) {
    const template = await prisma.checklistTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        nome: data.nome,
        descricao: data.descricao,
        modulo: data.modulo,
        periodicidade: data.periodicidade,
        itens: {
          create: data.itens.map((item) => ({
            ordem: item.ordem,
            descricao: item.descricao,
            obrigatorio: item.obrigatorio ?? true,
            categoria: item.categoria,
          })),
        },
      },
      include: { itens: { orderBy: { ordem: 'asc' } } },
    })
    return template
  },

  async atualizarTemplate(ctx: Ctx, id: string, data: { nome?: string; descricao?: string; periodicidade?: string; ativo?: boolean }) {
    const template = await prisma.checklistTemplate.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!template) throw new NotFoundError('Template')

    return prisma.checklistTemplate.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
        ...(data.periodicidade !== undefined ? { periodicidade: data.periodicidade } : {}),
        ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
      },
    })
  },

  // ── Execuções ──────────────────────────────────────────────────────────────

  async listarExecucoes(ctx: Ctx, filters: {
    empreendimentoId?: string
    templateId?: string
    status?: string
    page: number
    limit: number
  }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filters.empreendimentoId ? { empreendimentoId: filters.empreendimentoId } : {}),
      ...(filters.templateId ? { templateId: filters.templateId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }
    const [total, items] = await Promise.all([
      prisma.checklistExecucao.count({ where }),
      prisma.checklistExecucao.findMany({
        where,
        include: {
          template: { select: { nome: true, modulo: true } },
          empreendimento: { select: { nome: true, nomeFantasia: true } },
          executadoPor: { select: { nome: true } },
          respostas: { select: { status: true } },
        },
        orderBy: { iniciadaEm: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
    ])
    return { items, total, page: filters.page, limit: filters.limit }
  },

  async obterExecucao(ctx: Ctx, id: string) {
    const execucao = await prisma.checklistExecucao.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        template: { include: { itens: { orderBy: { ordem: 'asc' } } } },
        empreendimento: { select: { nome: true, nomeFantasia: true } },
        executadoPor: { select: { nome: true } },
        respostas: true,
      },
    })
    if (!execucao) throw new NotFoundError('Execução')
    return execucao
  },

  async iniciarExecucao(ctx: Ctx, data: { templateId: string; empreendimentoId: string }) {
    // Verify template belongs to tenant
    const template = await prisma.checklistTemplate.findFirst({
      where: { id: data.templateId, tenantId: ctx.tenantId, ativo: true },
      include: { itens: { orderBy: { ordem: 'asc' } } },
    })
    if (!template) throw new NotFoundError('Template')

    // Verify empreendimento belongs to tenant
    const emp = await prisma.empreendimento.findFirst({
      where: { id: data.empreendimentoId, tenantId: ctx.tenantId },
    })
    if (!emp) throw new NotFoundError('Empreendimento')

    const execucao = await prisma.checklistExecucao.create({
      data: {
        tenantId: ctx.tenantId,
        templateId: data.templateId,
        empreendimentoId: data.empreendimentoId,
        executadoPorId: ctx.id,
        status: 'EM_ANDAMENTO',
      },
      include: {
        template: { include: { itens: { orderBy: { ordem: 'asc' } } } },
        empreendimento: { select: { nome: true, nomeFantasia: true } },
        respostas: true,
      },
    })
    return execucao
  },

  async responderItem(ctx: Ctx, execucaoId: string, itemId: string, data: {
    status: string
    observacao?: string
  }) {
    // Verify execucao belongs to tenant and is in progress
    const execucao = await prisma.checklistExecucao.findFirst({
      where: { id: execucaoId, tenantId: ctx.tenantId },
    })
    if (!execucao) throw new NotFoundError('Execução')
    if (execucao.status !== 'EM_ANDAMENTO') throw new ConflictError('Execução já finalizada')

    // Upsert resposta
    await prisma.checklistResposta.upsert({
      where: { execucaoId_itemId: { execucaoId, itemId } },
      create: { execucaoId, itemId, status: data.status, observacao: data.observacao },
      update: { status: data.status, observacao: data.observacao },
    })

    return { ok: true }
  },

  async finalizarExecucao(ctx: Ctx, execucaoId: string, data: { observacoes?: string }) {
    const execucao = await prisma.checklistExecucao.findFirst({
      where: { id: execucaoId, tenantId: ctx.tenantId },
      include: {
        template: { include: { itens: true } },
        respostas: true,
      },
    })
    if (!execucao) throw new NotFoundError('Execução')
    if (execucao.status !== 'EM_ANDAMENTO') throw new ConflictError('Execução já finalizada')

    // Compute status from responses
    const respostas = execucao.respostas
    const temCritico = respostas.some((r) => r.status === 'CRITICO')
    const temAtencao = respostas.some((r) => r.status === 'ATENCAO')

    // Check if all required items answered
    const itensObrigatorios = execucao.template.itens.filter((i) => i.obrigatorio).map((i) => i.id)
    const respondidos = new Set(respostas.map((r) => r.itemId))
    const todosCobertos = itensObrigatorios.every((id) => respondidos.has(id))

    let status: string
    if (!todosCobertos) {
      status = 'PARCIAL'
    } else if (temCritico) {
      status = 'NAO_CONFORME'
    } else if (temAtencao) {
      status = 'PARCIAL'
    } else {
      status = 'CONFORME'
    }

    const resultado = await prisma.checklistExecucao.update({
      where: { id: execucaoId },
      data: {
        status,
        finalizadaEm: new Date(),
        observacoes: data.observacoes,
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      usuarioEmail: ctx.email,
      usuarioPerfil: ctx.perfil,
      acao: `checklist.${status.toLowerCase()}`,
      entidadeTipo: 'ChecklistExecucao',
      entidadeId: execucaoId,
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: execucao.empreendimentoId },
    })

    // Criar tarefas automáticas para cada item CRITICO
    const itensCriticos = respostas.filter((r) => r.status === 'CRITICO')
    if (itensCriticos.length > 0) {
      const itensMap = new Map(execucao.template.itens.map((i) => [i.id, i]))
      for (const resp of itensCriticos) {
        const item = itensMap.get(resp.itemId)
        const descricaoItem = item?.descricao ?? `Item ${resp.itemId.slice(0, 8)}`

        // Verifica se já existe tarefa para este item + execução
        const existente = await prisma.tarefa.findFirst({
          where: {
            tenantId: ctx.tenantId,
            empreendimentoId: execucao.empreendimentoId,
            origem: 'WORKFLOW',
            metadados: { path: ['checklistRespId'], equals: resp.id },
          },
        })
        if (existente) continue

        // Rotear: buscar analista de campo com acesso ao empreendimento
        const acessos = await prisma.empreendimentoAcesso.findMany({
          where: { empreendimentoId: execucao.empreendimentoId },
          include: { usuario: { select: { id: true, perfil: true, ativo: true } } },
        })
        const candidatos = acessos.map((a) => a.usuario).filter((u) => u.ativo)
        const preferido = candidatos.find((u) => ['ANALISTA_CAMPO', 'ANALISTA'].includes(u.perfil))
          ?? candidatos.find((u) => u.perfil === 'COORDENADOR')
        const responsavelId = preferido?.id ?? null

        await prisma.tarefa.create({
          data: {
            tenantId: ctx.tenantId,
            empreendimentoId: execucao.empreendimentoId,
            titulo: `NC: ${descricaoItem}`,
            descricao: `Não conformidade crítica identificada no checklist "${execucao.template.nome}". Item: ${descricaoItem}${resp.observacao ? `. Obs: ${resp.observacao}` : ''}`,
            origem: 'WORKFLOW',
            prioridade: 'ALTA',
            status: 'PENDENTE',
            criadorId: ctx.id,
            responsavelId,
            scoreCriticidade: 42, // WORKFLOW(12) + sem vencimento(5) + sem inação(0) + margem
            metadados: {
              checklistExecucaoId: execucaoId,
              checklistRespId: resp.id,
              geradoAutomaticamente: true,
            },
          },
        })
      }
    }

    return resultado
  },
}
