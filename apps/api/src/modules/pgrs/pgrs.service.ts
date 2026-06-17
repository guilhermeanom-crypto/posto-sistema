import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { assertDocumento, assertEmpreendimento } from '../../shared/validators/assert-empreendimento.js'
import type { StatusPGRS, StatusPGRSExigencia, PeriodicidadeCondicionante } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// PGRS SERVICE — Plano de Gerenciamento de Resíduos Sólidos
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string; perfil: string; nome: string; email: string; ip: string }

// ── Inputs ──────────────────────────────────────────────────────────────────

export interface CriarPGRSInput {
  empreendimentoId: string
  versao: string
  responsavelTecnico: string
  artNumero?: string
  dataAprovacao: string
  dataVencimento: string
  documentoId?: string
  observacoes?: string
}

export interface CriarExigenciaInput {
  descricao: string
  tipoResiduo: string
  periodicidade: PeriodicidadeCondicionante
  prazoComprovacaoDias: number
}

export interface VincularEvidenciaInput {
  documentoId: string
  periodoRef: string
}

// ── Service ─────────────────────────────────────────────────────────────────

class PGRSService {
  // ── PGRS CRUD ─────────────────────────────────────────────────────────────

  async listar(ctx: Ctx, filtros: {
    page: number; limit: number; empreendimentoId?: string; status?: string
  }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.status && { status: filtros.status as StatusPGRS }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.pGRS.count({ where }),
      prisma.pGRS.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          _count: { select: { exigencias: true } },
        },
        orderBy: [{ dataVencimento: 'asc' }, { criadoEm: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarPorId(ctx: Ctx, id: string) {
    const pgrs = await prisma.pGRS.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
        documento: { select: { id: true, nome: true, status: true } },
        exigencias: {
          orderBy: { criadoEm: 'asc' },
          include: {
            evidencias: {
              orderBy: { criadoEm: 'desc' },
              include: {
                documento: { select: { id: true, nome: true, status: true } },
              },
            },
          },
        },
      },
    })
    if (!pgrs) throw new NotFoundError('PGRS', id)
    return pgrs
  }

  async criar(ctx: Ctx, data: CriarPGRSInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)
    if (data.documentoId) {
      await assertDocumento(ctx.tenantId, data.documentoId, { empreendimentoId: data.empreendimentoId })
    }

    const pgrs = await prisma.pGRS.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        versao: data.versao,
        responsavelTecnico: data.responsavelTecnico,
        artNumero: data.artNumero,
        dataAprovacao: new Date(data.dataAprovacao),
        dataVencimento: new Date(data.dataVencimento),
        documentoId: data.documentoId,
        observacoes: data.observacoes,
      },
      include: { empreendimento: { select: { id: true, nome: true } } },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      entidadeTipo: 'PGRS',
      entidadeId: pgrs.id,
      acao: 'CREATE',
      dadosDepois: pgrs,
      ipOrigem: ctx.ip,
    })

    return pgrs
  }

  async atualizar(ctx: Ctx, id: string, data: Partial<CriarPGRSInput> & { status?: StatusPGRS }) {
    const existente = await this.buscarPorId(ctx, id)

    if (data.documentoId) {
      await assertDocumento(ctx.tenantId, data.documentoId, { empreendimentoId: existente.empreendimento.id })
    }

    const pgrs = await prisma.pGRS.update({
      where: { id },
      data: {
        ...(data.versao && { versao: data.versao }),
        ...(data.responsavelTecnico && { responsavelTecnico: data.responsavelTecnico }),
        ...(data.artNumero !== undefined && { artNumero: data.artNumero }),
        ...(data.dataAprovacao && { dataAprovacao: new Date(data.dataAprovacao) }),
        ...(data.dataVencimento && { dataVencimento: new Date(data.dataVencimento) }),
        ...(data.documentoId !== undefined && { documentoId: data.documentoId }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
        ...(data.status && { status: data.status }),
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      entidadeTipo: 'PGRS',
      entidadeId: pgrs.id,
      acao: 'UPDATE',
      dadosAntes: existente,
      dadosDepois: pgrs,
      ipOrigem: ctx.ip,
    })

    return pgrs
  }

  // ── EXIGÊNCIAS ────────────────────────────────────────────────────────────

  async criarExigencia(ctx: Ctx, pgrsId: string, data: CriarExigenciaInput) {
    await this.buscarPorId(ctx, pgrsId)

    const exigencia = await prisma.pGRSExigencia.create({
      data: {
        pgrsId,
        descricao: data.descricao,
        tipoResiduo: data.tipoResiduo,
        periodicidade: data.periodicidade,
        prazoComprovacaoDias: data.prazoComprovacaoDias,
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      entidadeTipo: 'PGRSExigencia',
      entidadeId: exigencia.id,
      acao: 'CREATE',
      dadosDepois: exigencia,
      ipOrigem: ctx.ip,
    })

    return exigencia
  }

  async atualizarExigencia(
    ctx: Ctx,
    pgrsId: string,
    exigenciaId: string,
    data: { status?: StatusPGRSExigencia; naoAplicavel?: boolean; naoAplicavelJustificativa?: string },
  ) {
    await this.buscarPorId(ctx, pgrsId)

    const exigencia = await prisma.pGRSExigencia.findFirst({ where: { id: exigenciaId, pgrsId } })
    if (!exigencia) throw new NotFoundError('PGRSExigencia', exigenciaId)

    const updated = await prisma.pGRSExigencia.update({
      where: { id: exigenciaId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.naoAplicavel !== undefined && {
          naoAplicavel: data.naoAplicavel,
          naoAplicavelJustificativa: data.naoAplicavelJustificativa ?? null,
          naoAplicavelPorId: data.naoAplicavel ? ctx.id : null,
          status: data.naoAplicavel ? 'NAO_APLICAVEL' as StatusPGRSExigencia : exigencia.status,
        }),
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      entidadeTipo: 'PGRSExigencia',
      entidadeId: exigenciaId,
      acao: 'UPDATE',
      dadosAntes: exigencia,
      dadosDepois: updated,
      ipOrigem: ctx.ip,
    })

    return updated
  }

  // ── EVIDÊNCIAS ────────────────────────────────────────────────────────────

  async vincularEvidencia(ctx: Ctx, pgrsId: string, exigenciaId: string, data: VincularEvidenciaInput) {
    const pgrs = await this.buscarPorId(ctx, pgrsId)
    await assertDocumento(ctx.tenantId, data.documentoId, { empreendimentoId: pgrs.empreendimento.id })

    const exigencia = await prisma.pGRSExigencia.findFirst({ where: { id: exigenciaId, pgrsId } })
    if (!exigencia) throw new NotFoundError('PGRSExigencia', exigenciaId)

    const evidencia = await prisma.pGRSEvidencia.create({
      data: {
        exigenciaId,
        documentoId: data.documentoId,
        periodoRef: data.periodoRef,
        vinculadoPorId: ctx.id,
      },
      include: {
        documento: { select: { id: true, nome: true, status: true } },
      },
    })

    // Atualiza status da exigência para COMPROVADO se tinha evidência
    await prisma.pGRSExigencia.update({
      where: { id: exigenciaId },
      data: { status: 'COMPROVADO' },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      entidadeTipo: 'PGRSEvidencia',
      entidadeId: evidencia.id,
      acao: 'CREATE',
      dadosDepois: evidencia,
      ipOrigem: ctx.ip,
    })

    return evidencia
  }
}

export const pgrsService = new PGRSService()
