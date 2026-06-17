import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError, ConflictError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import {
  assertEmpreendimento,
  assertFuncionario,
} from '../../shared/validators/assert-empreendimento.js'

// ─────────────────────────────────────────────────────────────────────────────
// SST SERVICE — Funcionários, ASOs, Treinamentos, EPI, Documentos SST
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string; perfil: string; nome?: string; email?: string; ip?: string }

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CriarFuncionarioInput {
  empreendimentoId: string
  nome: string
  cpf?: string
  rg?: string
  dataNascimento?: string
  cargo: string
  setor?: string
  vinculo?: string
  email?: string
  telefone?: string
  dataAdmissao: string
  observacoes?: string
}

export interface AtualizarFuncionarioInput {
  nome?: string
  cargo?: string
  setor?: string
  vinculo?: string
  email?: string
  telefone?: string
  observacoes?: string
  dataDemissao?: string
  motivoDemissao?: string
  ativo?: boolean
}

export interface CriarASOInput {
  empreendimentoId: string
  funcionarioId?: string
  funcionarioNome: string
  funcionarioCPF?: string
  cargo?: string
  tipo: string
  dataExame: string
  dataVencimento?: string
  aptidao: string
  medicoResponsavel?: string
  observacoes?: string
}

export interface CriarDocumentoSSTInput {
  empreendimentoId: string
  tipo: string
  responsavel?: string
  dataElaboracao?: string
  dataVencimento?: string
  observacoes?: string
}

export interface CriarTreinamentoTipoInput {
  nome: string
  normativa: string
  cargaHoraria: number
  periodicidadeMeses: number
  obrigatorioParaCargos?: string[]
  conteudoProgramatico?: string[]
}

export interface CriarTreinamentoExecucaoInput {
  empreendimentoId: string
  tipoId: string
  dataRealizacao: string
  dataVencimento?: string
  instrutor?: string
  cargaHorariaRealizada?: number
  local?: string
  observacoes?: string
  participanteIds?: string[]
}

export interface CriarEntregaEPIInput {
  empreendimentoId: string
  funcionarioId: string
  tipoEPI: string
  ca?: string
  quantidade?: number
  dataEntrega: string
  dataVencimento?: string
  observacoes?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcularStatusDoc(dataVencimento: Date): string {
  const dias = Math.ceil((dataVencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (dias < 0) return 'VENCIDO'
  if (dias <= 90) return 'A_RENOVAR'
  return 'VIGENTE'
}

function statusASO(aptidao: string, dataVencimento: Date | null | undefined): string {
  if (aptidao === 'INAPTO') return 'INAPTO'
  if (!dataVencimento) return 'OK'
  const dias = Math.ceil((dataVencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (dias < 0) return 'VENCIDO'
  if (dias <= 30) return 'VENCENDO'
  return 'OK'
}

// ─── Service ─────────────────────────────────────────────────────────────────

class SSTService {

  // ── Funcionários ─────────────────────────────────────────────────────────────

  async listarFuncionarios(ctx: Ctx, filtros: {
    page: number; limit: number
    empreendimentoId?: string; ativo?: boolean; cargo?: string; setor?: string
  }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.ativo !== undefined && { ativo: filtros.ativo }),
      ...(filtros.cargo && { cargo: { contains: filtros.cargo, mode: 'insensitive' as const } }),
      ...(filtros.setor && { setor: filtros.setor }),
    }
    const [total, items, allForKpis] = await prisma.$transaction([
      prisma.funcionario.count({ where }),
      prisma.funcionario.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true, nomeFantasia: true } },
          asos: {
            orderBy: { dataExame: 'desc' },
            take: 1,
            select: { aptidao: true, dataVencimento: true, tipo: true },
          },
          treinamentosParticipados: {
            include: {
              execucao: {
                select: { status: true, dataVencimento: true, tipo: { select: { normativa: true } } },
              },
            },
          },
          entregasEPI: {
            where: { status: 'VIGENTE' },
            select: { tipoEPI: true, dataVencimento: true, status: true },
          },
          _count: { select: { asos: true, treinamentosParticipados: true, entregasEPI: true } },
        },
        orderBy: { nome: 'asc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
      // Para KPIs agregados sobre toda a base filtrada (não só a página atual)
      prisma.funcionario.findMany({
        where,
        select: {
          id: true,
          asos: {
            orderBy: { dataExame: 'desc' },
            take: 1,
            select: { aptidao: true, dataVencimento: true },
          },
          treinamentosParticipados: {
            select: { execucao: { select: { dataVencimento: true } } },
          },
          entregasEPI: {
            where: { status: 'VIGENTE' },
            select: { dataVencimento: true },
          },
        },
      }),
    ])

    const computeStatuses = (f: {
      asos: { aptidao: string; dataVencimento: Date | null }[]
      treinamentosParticipados: { execucao: { dataVencimento: Date | null } }[]
      entregasEPI: { dataVencimento: Date | null }[]
    }) => {
      const ultimoASO = f.asos[0]
      const asoStatus = ultimoASO ? statusASO(ultimoASO.aptidao, ultimoASO.dataVencimento) : 'AUSENTE'

      const hoje = new Date()
      const treinamentosVencidos = f.treinamentosParticipados.filter(
        (p) => p.execucao.dataVencimento && p.execucao.dataVencimento < hoje,
      ).length
      const treinamentoStatus = f.treinamentosParticipados.length === 0 ? 'AUSENTE'
        : treinamentosVencidos > 0 ? 'VENCIDO' : 'OK'

      const episVencendoOuVencidos = f.entregasEPI.filter(
        (e) => e.dataVencimento && e.dataVencimento <= new Date(Date.now() + 30 * 86400000),
      ).length
      const epiStatus = f.entregasEPI.length === 0 ? 'AUSENTE'
        : episVencendoOuVencidos > 0 ? 'ATENCAO' : 'OK'

      // Semântica: AUSENTE de ASO ou Treinamento (obrigatórios por lei) = CRITICO.
      // AUSENTE de EPI (ou EPI vencendo) = ATENCAO. Apenas tudo OK = OK.
      const criticosObrigatorios = [asoStatus, treinamentoStatus]
      const todos = [asoStatus, treinamentoStatus, epiStatus]
      const statusGeral = todos.includes('VENCIDO') || criticosObrigatorios.includes('INAPTO') || criticosObrigatorios.includes('AUSENTE')
        ? 'CRITICO'
        : todos.includes('VENCENDO') || todos.includes('ATENCAO') || todos.includes('AUSENTE')
          ? 'ATENCAO'
          : 'OK'

      return { asoStatus, treinamentoStatus, epiStatus, statusGeral }
    }

    const enriched = items.map((f) => ({ ...f, ...computeStatuses(f) }))

    const kpis = allForKpis.reduce(
      (acc, f) => {
        const { statusGeral } = computeStatuses(f)
        if (statusGeral === 'OK') acc.ok += 1
        else if (statusGeral === 'ATENCAO') acc.atencao += 1
        else if (statusGeral === 'CRITICO') acc.critico += 1
        return acc
      },
      { total, ok: 0, atencao: 0, critico: 0 },
    )

    return { items: enriched, total, page: filtros.page, limit: filtros.limit, kpis }
  }

  async buscarFuncionarioPorId(ctx: Ctx, id: string) {
    const f = await prisma.funcionario.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, nomeFantasia: true } },
        asos: {
          orderBy: { dataExame: 'desc' },
          include: { empreendimento: { select: { nome: true } } },
        },
        treinamentosParticipados: {
          include: {
            execucao: {
              include: { tipo: true, empreendimento: { select: { nome: true } } },
            },
          },
          orderBy: { criadoEm: 'desc' },
        },
        entregasEPI: {
          orderBy: { dataEntrega: 'desc' },
        },
      },
    })
    if (!f) throw new NotFoundError('Funcionário', id)
    return f
  }

  async criarFuncionario(ctx: Ctx, data: CriarFuncionarioInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)

    const f = await prisma.funcionario.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        nome: data.nome,
        cpf: data.cpf,
        rg: data.rg,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
        cargo: data.cargo,
        setor: data.setor,
        vinculo: data.vinculo ?? 'CLT',
        email: data.email,
        telefone: data.telefone,
        dataAdmissao: new Date(data.dataAdmissao),
        observacoes: data.observacoes,
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId, usuarioId: ctx.id, usuarioNome: ctx.nome,
      usuarioEmail: ctx.email, usuarioPerfil: ctx.perfil,
      acao: 'funcionario.admitido', entidadeTipo: 'Funcionario', entidadeId: f.id,
      ipOrigem: ctx.ip, contexto: { empreendimentoId: data.empreendimentoId, cargo: data.cargo },
    })

    return f
  }

  async atualizarFuncionario(ctx: Ctx, id: string, data: AtualizarFuncionarioInput) {
    const f = await prisma.funcionario.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!f) throw new NotFoundError('Funcionário', id)

    const updated = await prisma.funcionario.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.cargo !== undefined && { cargo: data.cargo }),
        ...(data.setor !== undefined && { setor: data.setor }),
        ...(data.vinculo !== undefined && { vinculo: data.vinculo }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.telefone !== undefined && { telefone: data.telefone }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
        ...(data.dataDemissao && { dataDemissao: new Date(data.dataDemissao), ativo: false }),
        ...(data.motivoDemissao !== undefined && { motivoDemissao: data.motivoDemissao }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
      },
    })

    if (data.dataDemissao) {
      await registrarAuditoria({
        tenantId: ctx.tenantId, usuarioId: ctx.id, usuarioNome: ctx.nome,
        usuarioEmail: ctx.email, usuarioPerfil: ctx.perfil,
        acao: 'funcionario.desligado', entidadeTipo: 'Funcionario', entidadeId: id,
        ipOrigem: ctx.ip, dadosAntes: f, dadosDepois: updated,
        contexto: { empreendimentoId: f.empreendimentoId },
      })
    }

    return updated
  }

  // ── ASOs ─────────────────────────────────────────────────────────────────────

  async listarASOs(ctx: Ctx, filtros: { page: number; limit: number; empreendimentoId?: string; tipo?: string; aptidao?: string }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.aptidao && { aptidao: filtros.aptidao }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.aSO.count({ where }),
      prisma.aSO.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          funcionario: { select: { id: true, nome: true, cargo: true } },
        },
        orderBy: [{ dataVencimento: 'asc' }, { criadoEm: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarASOPorId(ctx: Ctx, id: string) {
    const aso = await prisma.aSO.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true } },
        funcionario: { select: { id: true, nome: true, cargo: true } },
      },
    })
    if (!aso) throw new NotFoundError('ASO', id)
    return aso
  }

  async criarASO(ctx: Ctx, data: CriarASOInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)

    // Se tem funcionarioId, preenche nome/cpf automaticamente
    let funcionarioNome = data.funcionarioNome
    let funcionarioCPF = data.funcionarioCPF
    if (data.funcionarioId) {
      const f = await assertFuncionario(ctx.tenantId, data.funcionarioId, {
        empreendimentoId: data.empreendimentoId,
      })
      funcionarioNome = f.nome
      funcionarioCPF = f.cpf ?? funcionarioCPF
    }

    return prisma.aSO.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        funcionarioId: data.funcionarioId,
        funcionarioNome,
        funcionarioCPF,
        cargo: data.cargo,
        tipo: data.tipo,
        dataExame: new Date(data.dataExame),
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
        aptidao: data.aptidao,
        medicoResponsavel: data.medicoResponsavel,
        observacoes: data.observacoes,
      },
      include: {
        empreendimento: { select: { id: true, nome: true } },
        funcionario: { select: { id: true, nome: true } },
      },
    })
  }

  async atualizarASO(ctx: Ctx, id: string, data: {
    funcionarioNome?: string; cargo?: string; tipo?: string; dataExame?: string
    dataVencimento?: string | null; aptidao?: string; medicoResponsavel?: string | null
    observacoes?: string | null
  }) {
    const aso = await prisma.aSO.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!aso) throw new NotFoundError('ASO', id)

    return prisma.aSO.update({
      where: { id },
      data: {
        ...(data.funcionarioNome && { funcionarioNome: data.funcionarioNome }),
        ...(data.cargo !== undefined && { cargo: data.cargo }),
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.dataExame && { dataExame: new Date(data.dataExame) }),
        ...(data.dataVencimento !== undefined && { dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : null }),
        ...(data.aptidao && { aptidao: data.aptidao }),
        ...(data.medicoResponsavel !== undefined && { medicoResponsavel: data.medicoResponsavel }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      },
      include: {
        empreendimento: { select: { id: true, nome: true } },
      },
    })
  }

  // ── Treinamentos — Tipos (templates) ─────────────────────────────────────────

  async listarTreinamentoTipos(ctx: Ctx, filtros: { ativo?: boolean; normativa?: string }) {
    return prisma.treinamentoTipo.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(filtros.ativo !== undefined && { ativo: filtros.ativo }),
        ...(filtros.normativa && { normativa: filtros.normativa }),
      },
      orderBy: [{ normativa: 'asc' }, { nome: 'asc' }],
    })
  }

  async criarTreinamentoTipo(ctx: Ctx, data: CriarTreinamentoTipoInput) {
    return prisma.treinamentoTipo.create({
      data: {
        tenantId: ctx.tenantId,
        nome: data.nome,
        normativa: data.normativa,
        cargaHoraria: data.cargaHoraria,
        periodicidadeMeses: data.periodicidadeMeses,
        obrigatorioParaCargos: data.obrigatorioParaCargos ?? [],
        conteudoProgramatico: data.conteudoProgramatico ?? [],
      },
    })
  }

  async atualizarTreinamentoTipo(ctx: Ctx, id: string, data: Partial<CriarTreinamentoTipoInput> & { ativo?: boolean }) {
    const t = await prisma.treinamentoTipo.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!t) throw new NotFoundError('Tipo de treinamento', id)
    return prisma.treinamentoTipo.update({ where: { id }, data })
  }

  // ── Treinamentos — Execuções ──────────────────────────────────────────────────

  async listarTreinamentoExecucoes(ctx: Ctx, filtros: {
    page: number; limit: number
    empreendimentoId?: string; tipoId?: string; status?: string; normativa?: string
  }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.tipoId && { tipoId: filtros.tipoId }),
      ...(filtros.status && { status: filtros.status }),
      ...(filtros.normativa && { tipo: { normativa: filtros.normativa } }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.treinamentoExecucao.count({ where }),
      prisma.treinamentoExecucao.findMany({
        where,
        include: {
          tipo: true,
          empreendimento: { select: { id: true, nome: true, nomeFantasia: true } },
          participantes: {
            include: { funcionario: { select: { id: true, nome: true, cargo: true } } },
          },
        },
        orderBy: [{ dataRealizacao: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarTreinamentoExecucaoPorId(ctx: Ctx, id: string) {
    const t = await prisma.treinamentoExecucao.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        tipo: true,
        empreendimento: { select: { id: true, nome: true, nomeFantasia: true } },
        participantes: {
          include: { funcionario: { select: { id: true, nome: true, cargo: true, setor: true } } },
        },
      },
    })
    if (!t) throw new NotFoundError('Treinamento', id)
    return t
  }

  async criarTreinamentoExecucao(ctx: Ctx, data: CriarTreinamentoExecucaoInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)

    const tipo = await prisma.treinamentoTipo.findFirst({ where: { id: data.tipoId, tenantId: ctx.tenantId } })
    if (!tipo) throw new NotFoundError('Tipo de treinamento', data.tipoId)

    if (data.participanteIds?.length) {
      await Promise.all(
        data.participanteIds.map((funcionarioId) =>
          assertFuncionario(ctx.tenantId, funcionarioId, { empreendimentoId: data.empreendimentoId }),
        ),
      )
    }

    // Calcular dataVencimento a partir da periodicidade se não fornecida
    let dataVencimento: Date | undefined = data.dataVencimento ? new Date(data.dataVencimento) : undefined
    if (!dataVencimento && tipo.periodicidadeMeses > 0) {
      dataVencimento = new Date(data.dataRealizacao)
      dataVencimento.setMonth(dataVencimento.getMonth() + tipo.periodicidadeMeses)
    }

    const exec = await prisma.treinamentoExecucao.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        tipoId: data.tipoId,
        dataRealizacao: new Date(data.dataRealizacao),
        dataVencimento,
        status: 'REALIZADO',
        instrutor: data.instrutor,
        cargaHorariaRealizada: data.cargaHorariaRealizada ?? tipo.cargaHoraria,
        local: data.local,
        observacoes: data.observacoes,
        participantes: data.participanteIds?.length ? {
          create: data.participanteIds.map((fId) => ({
            funcionarioId: fId,
            presenca: true,
            aprovado: true,
          })),
        } : undefined,
      },
      include: {
        tipo: true,
        participantes: { include: { funcionario: { select: { id: true, nome: true } } } },
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId, usuarioId: ctx.id, usuarioNome: ctx.nome,
      usuarioEmail: ctx.email, usuarioPerfil: ctx.perfil,
      acao: 'treinamento.realizado', entidadeTipo: 'TreinamentoExecucao', entidadeId: exec.id,
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: data.empreendimentoId, normativa: tipo.normativa, participantes: data.participanteIds?.length ?? 0 },
    })

    return exec
  }

  async adicionarParticipante(ctx: Ctx, execucaoId: string, funcionarioId: string) {
    const exec = await prisma.treinamentoExecucao.findFirst({ where: { id: execucaoId, tenantId: ctx.tenantId } })
    if (!exec) throw new NotFoundError('Treinamento', execucaoId)
    await assertFuncionario(ctx.tenantId, funcionarioId, { empreendimentoId: exec.empreendimentoId })

    try {
      return await prisma.treinamentoParticipante.create({
        data: { execucaoId, funcionarioId, presenca: true, aprovado: true },
        include: { funcionario: { select: { id: true, nome: true, cargo: true } } },
      })
    } catch {
      throw new ConflictError('Funcionário já adicionado a este treinamento')
    }
  }

  async atualizarParticipante(ctx: Ctx, execucaoId: string, funcionarioId: string, data: { presenca?: boolean; aprovado?: boolean }) {
    const exec = await prisma.treinamentoExecucao.findFirst({ where: { id: execucaoId, tenantId: ctx.tenantId } })
    if (!exec) throw new NotFoundError('Treinamento', execucaoId)
    return prisma.treinamentoParticipante.update({
      where: { execucaoId_funcionarioId: { execucaoId, funcionarioId } },
      data,
    })
  }

  async removerParticipante(ctx: Ctx, execucaoId: string, funcionarioId: string) {
    const exec = await prisma.treinamentoExecucao.findFirst({ where: { id: execucaoId, tenantId: ctx.tenantId } })
    if (!exec) throw new NotFoundError('Treinamento', execucaoId)
    await prisma.treinamentoParticipante.delete({
      where: { execucaoId_funcionarioId: { execucaoId, funcionarioId } },
    })
  }

  // ── EPI ───────────────────────────────────────────────────────────────────────

  async listarEntregasEPI(ctx: Ctx, filtros: {
    page: number; limit: number
    empreendimentoId?: string; funcionarioId?: string; status?: string
  }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.funcionarioId && { funcionarioId: filtros.funcionarioId }),
      ...(filtros.status && { status: filtros.status }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.entregaEPI.count({ where }),
      prisma.entregaEPI.findMany({
        where,
        include: {
          funcionario: { select: { id: true, nome: true, cargo: true } },
          empreendimento: { select: { id: true, nome: true } },
        },
        orderBy: [{ dataEntrega: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async criarEntregaEPI(ctx: Ctx, data: CriarEntregaEPIInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)
    await assertFuncionario(ctx.tenantId, data.funcionarioId, {
      empreendimentoId: data.empreendimentoId,
    })

    return prisma.entregaEPI.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        funcionarioId: data.funcionarioId,
        tipoEPI: data.tipoEPI,
        ca: data.ca,
        quantidade: data.quantidade ?? 1,
        dataEntrega: new Date(data.dataEntrega),
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
        observacoes: data.observacoes,
        status: 'VIGENTE',
      },
      include: { funcionario: { select: { id: true, nome: true, cargo: true } } },
    })
  }

  async atualizarEntregaEPI(ctx: Ctx, id: string, data: { status?: string; observacoes?: string }) {
    const epi = await prisma.entregaEPI.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!epi) throw new NotFoundError('Entrega de EPI', id)
    return prisma.entregaEPI.update({ where: { id }, data })
  }

  // ── Documentos SST ────────────────────────────────────────────────────────────

  async listarDocumentosSST(ctx: Ctx, filtros: { page: number; limit: number; empreendimentoId?: string; tipo?: string }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.tipo && { tipo: filtros.tipo }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.documentoSST.count({ where }),
      prisma.documentoSST.findMany({
        where,
        include: { empreendimento: { select: { id: true, nome: true } } },
        orderBy: [{ dataVencimento: 'asc' }, { criadoEm: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async criarDocumentoSST(ctx: Ctx, data: CriarDocumentoSSTInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)

    const dataVenc = data.dataVencimento ? new Date(data.dataVencimento) : undefined
    const status = dataVenc ? calcularStatusDoc(dataVenc) : 'VIGENTE'
    return prisma.documentoSST.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        tipo: data.tipo,
        responsavel: data.responsavel,
        dataElaboracao: data.dataElaboracao ? new Date(data.dataElaboracao) : undefined,
        dataVencimento: dataVenc,
        status,
        observacoes: data.observacoes,
      },
      include: { empreendimento: { select: { id: true, nome: true } } },
    })
  }

  async atualizarDocumentoSST(ctx: Ctx, id: string, data: Partial<CriarDocumentoSSTInput> & { status?: string }) {
    const doc = await prisma.documentoSST.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!doc) throw new NotFoundError('DocumentoSST', id)
    const dataVenc = data.dataVencimento ? new Date(data.dataVencimento) : undefined
    return prisma.documentoSST.update({
      where: { id },
      data: {
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.responsavel !== undefined && { responsavel: data.responsavel }),
        ...(data.dataElaboracao && { dataElaboracao: new Date(data.dataElaboracao) }),
        ...(dataVenc && { dataVencimento: dataVenc, status: data.status ?? calcularStatusDoc(dataVenc) }),
        ...(data.status && { status: data.status }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      },
    })
  }
}

export const sstService = new SSTService()
