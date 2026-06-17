import { Decimal } from '@prisma/client/runtime/library.js'
import { prisma } from '../../infra/database/prisma.js'
import { ConflictError, NotFoundError } from '../../shared/errors/app-errors.js'
import {
  assertEmpreendimento,
  assertTransportadora,
} from '../../shared/validators/assert-empreendimento.js'

// ─────────────────────────────────────────────────────────────────────────────
// LOGÍSTICA REVERSA SERVICE — Transportadoras + MTRs + Metas + CCRs
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string; perfil: string }

export interface CriarTransportadoraInput {
  nome: string
  cnpj: string
  licencaAmbiental?: string
  validadeLicenca?: string
  telefone?: string
  email?: string
}

export interface CriarMTRInput {
  empreendimentoId: string
  transportadoraId?: string
  numeroMTR?: string
  dataEmissao: string
  dataColeta?: string
  residuos: Array<{ tipo: string; quantidade: number; unidade: string; destinacao?: string }>
  observacoes?: string
}

class LogisticaReversaService {
  // ── Transportadoras ───────────────────────────────────────────────────────────

  async listarTransportadoras(ctx: Ctx, filtros: { page: number; limit: number; ativo?: boolean }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.ativo !== undefined && { ativo: filtros.ativo }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.transportadora.count({ where }),
      prisma.transportadora.findMany({
        where,
        include: { _count: { select: { mtrs: true } } },
        orderBy: { nome: 'asc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async criarTransportadora(ctx: Ctx, data: CriarTransportadoraInput) {
    return prisma.transportadora.create({
      data: {
        tenantId: ctx.tenantId,
        nome: data.nome,
        cnpj: data.cnpj,
        licencaAmbiental: data.licencaAmbiental,
        validadeLicenca: data.validadeLicenca ? new Date(data.validadeLicenca) : undefined,
        telefone: data.telefone,
        email: data.email,
      },
    })
  }

  // ── MTRs ──────────────────────────────────────────────────────────────────────

  async listarMTRs(ctx: Ctx, filtros: { page: number; limit: number; empreendimentoId?: string; status?: string }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.status && { status: filtros.status }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.mTR.count({ where }),
      prisma.mTR.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          transportadora: { select: { id: true, nome: true, cnpj: true } },
        },
        orderBy: [{ dataEmissao: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarMTRPorId(ctx: Ctx, id: string) {
    const mtr = await prisma.mTR.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
        transportadora: true,
      },
    })
    if (!mtr) throw new NotFoundError('MTR', id)
    return mtr
  }

  async criarMTR(ctx: Ctx, data: CriarMTRInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)
    if (data.transportadoraId) {
      await assertTransportadora(ctx.tenantId, data.transportadoraId)
    }

    return prisma.mTR.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        transportadoraId: data.transportadoraId,
        numeroMTR: data.numeroMTR,
        dataEmissao: new Date(data.dataEmissao),
        dataColeta: data.dataColeta ? new Date(data.dataColeta) : undefined,
        residuos: data.residuos,
        observacoes: data.observacoes,
      },
      include: {
        empreendimento: { select: { id: true, nome: true } },
        transportadora: { select: { id: true, nome: true } },
      },
    })
  }

  async atualizarStatusMTR(ctx: Ctx, id: string, status: string, dataColeta?: string) {
    await this.buscarMTRPorId(ctx, id)
    return prisma.mTR.update({
      where: { id },
      data: {
        status,
        ...(dataColeta && { dataColeta: new Date(dataColeta) }),
      },
    })
  }

  // ── Metas de Resíduo ──────────────────────────────────────────────────────────

  async listarMetas(ctx: Ctx, filtros: { empreendimentoId?: string; ano?: number }) {
    return prisma.metaResiduoAnual.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
        ...(filtros.ano && { ano: filtros.ano }),
      },
      include: { empreendimento: { select: { nome: true, nomeFantasia: true } } },
      orderBy: [{ ano: 'desc' }, { tipoResiduo: 'asc' }],
    })
  }

  async upsertMeta(ctx: Ctx, data: {
    empreendimentoId: string
    ano: number
    tipoResiduo: string
    unidade: string
    metaQuantidade: number
    observacoes?: string
  }) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)

    return prisma.metaResiduoAnual.upsert({
      where: {
        tenantId_empreendimentoId_ano_tipoResiduo: {
          tenantId: ctx.tenantId,
          empreendimentoId: data.empreendimentoId,
          ano: data.ano,
          tipoResiduo: data.tipoResiduo,
        },
      },
      create: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        ano: data.ano,
        tipoResiduo: data.tipoResiduo,
        unidade: data.unidade,
        metaQuantidade: new Decimal(data.metaQuantidade),
        observacoes: data.observacoes,
      },
      update: {
        unidade: data.unidade,
        metaQuantidade: new Decimal(data.metaQuantidade),
        observacoes: data.observacoes,
      },
    })
  }

  async deletarMeta(ctx: Ctx, id: string) {
    const meta = await prisma.metaResiduoAnual.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!meta) throw new NotFoundError('Meta')
    return prisma.metaResiduoAnual.delete({ where: { id } })
  }

  // ── CCRs ─────────────────────────────────────────────────────────────────────

  async listarCCRs(ctx: Ctx, filtros: { mtrId?: string; page: number; limit: number }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.mtrId && { mtrId: filtros.mtrId }),
    }
    const [total, items] = await Promise.all([
      prisma.cCR.count({ where }),
      prisma.cCR.findMany({
        where,
        include: { mtr: { select: { numeroMTR: true, empreendimentoId: true } } },
        orderBy: { dataDestinacao: 'desc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async criarCCR(ctx: Ctx, mtrId: string, data: {
    numeroCCR?: string
    tipoResiduo: string
    quantidadeKg: number
    destinador: string
    cnpjDestinador?: string
    dataDestinacao: string
    tecnologiaUso?: string
  }) {
    // Validate MTR belongs to tenant
    const mtr = await prisma.mTR.findFirst({ where: { id: mtrId, tenantId: ctx.tenantId } })
    if (!mtr) throw new NotFoundError('MTR', mtrId)
    if (mtr.status === 'ABERTO') throw new ConflictError('MTR deve estar COLETADO ou superior para registrar CCR')

    return prisma.cCR.create({
      data: {
        tenantId: ctx.tenantId,
        mtrId,
        numeroCCR: data.numeroCCR,
        tipoResiduo: data.tipoResiduo,
        quantidadeKg: new Decimal(data.quantidadeKg),
        destinador: data.destinador,
        cnpjDestinador: data.cnpjDestinador,
        dataDestinacao: new Date(data.dataDestinacao),
        tecnologiaUso: data.tecnologiaUso,
      },
    })
  }

  async deletarCCR(ctx: Ctx, id: string) {
    const ccr = await prisma.cCR.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!ccr) throw new NotFoundError('CCR')
    return prisma.cCR.delete({ where: { id } })
  }

  // ── Relatório de atingimento de metas ────────────────────────────────────────

  async relatorioMetas(ctx: Ctx, empreendimentoId: string, ano: number) {
    const [metas, mtrs] = await Promise.all([
      prisma.metaResiduoAnual.findMany({
        where: { tenantId: ctx.tenantId, empreendimentoId, ano },
      }),
      prisma.mTR.findMany({
        where: {
          tenantId: ctx.tenantId,
          empreendimentoId,
          dataEmissao: {
            gte: new Date(`${ano}-01-01`),
            lt: new Date(`${ano + 1}-01-01`),
          },
          status: { in: ['DESTINADO', 'ENCERRADO'] },
        },
        select: { residuos: true },
      }),
    ])

    // Aggregate residuos from MTRs by tipo
    const realizado: Record<string, number> = {}
    for (const mtr of mtrs) {
      const residuos = mtr.residuos as Array<{ tipo: string; quantidade: number; unidade: string }>
      for (const r of residuos) {
        realizado[r.tipo] = (realizado[r.tipo] ?? 0) + r.quantidade
      }
    }

    return metas.map((m) => ({
      tipoResiduo: m.tipoResiduo,
      unidade: m.unidade,
      meta: Number(m.metaQuantidade),
      realizado: realizado[m.tipoResiduo] ?? 0,
      percentual: m.metaQuantidade.toNumber() > 0
        ? Math.min(100, ((realizado[m.tipoResiduo] ?? 0) / m.metaQuantidade.toNumber()) * 100)
        : 0,
    }))
  }
}

export const logisticaReversaService = new LogisticaReversaService()
