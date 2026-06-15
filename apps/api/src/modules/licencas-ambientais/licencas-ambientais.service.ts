import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'
import { assertEmpreendimento } from '../../shared/validators/assert-empreendimento.js'
import type { TipoLicencaAmbiental, StatusLicenca } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// LICENÇAS AMBIENTAIS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx {
  id: string
  tenantId: string
  perfil: string
}

export interface CriarLicencaInput {
  empreendimentoId: string
  tipo: TipoLicencaAmbiental
  numero: string
  orgaoEmissor: string
  responsavelTecnico?: string
  dataEmissao: string
  dataVencimento: string
  observacoes?: string
}

export interface AtualizarLicencaInput {
  numero?: string
  orgaoEmissor?: string
  responsavelTecnico?: string | null
  dataEmissao?: string
  dataVencimento?: string
  status?: StatusLicenca
  observacoes?: string | null
}

export interface CriarCondicaoInput {
  numero?: string
  descricao: string
  prazo?: string
  status?: string
  observacoes?: string
}

export interface AtualizarCondicaoInput {
  numero?: string
  descricao?: string
  prazo?: string
  status?: string
  observacoes?: string
}

class LicencasAmbientaisService {
  async listar(
    ctx: Ctx,
    filtros: {
      page: number
      limit: number
      empreendimentoId?: string
      status?: string
      tipo?: string
    },
  ) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.status && { status: filtros.status as StatusLicenca }),
      ...(filtros.tipo && { tipo: filtros.tipo as TipoLicencaAmbiental }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.licencaAmbiental.count({ where }),
      prisma.licencaAmbiental.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          _count: { select: { condicoes: true } },
        },
        orderBy: [{ dataVencimento: 'asc' }, { criadoEm: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarPorId(ctx: Ctx, id: string) {
    const licenca = await prisma.licencaAmbiental.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
        condicoes: { orderBy: { criadoEm: 'asc' } },
      },
    })

    if (!licenca) throw new NotFoundError('LicencaAmbiental', id)
    return licenca
  }

  async criar(ctx: Ctx, data: CriarLicencaInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)
    return prisma.licencaAmbiental.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        tipo: data.tipo,
        numero: data.numero,
        orgaoEmissor: data.orgaoEmissor,
        responsavelTecnico: data.responsavelTecnico,
        dataEmissao: new Date(data.dataEmissao),
        dataVencimento: new Date(data.dataVencimento),
        observacoes: data.observacoes,
        status: this.calcularStatus(new Date(data.dataVencimento)),
      },
      include: {
        empreendimento: { select: { id: true, nome: true } },
      },
    })
  }

  async atualizar(ctx: Ctx, id: string, data: AtualizarLicencaInput) {
    await this.buscarPorId(ctx, id)

    const dataVencimento = data.dataVencimento ? new Date(data.dataVencimento) : undefined

    return prisma.licencaAmbiental.update({
      where: { id },
      data: {
        ...(data.numero && { numero: data.numero }),
        ...(data.orgaoEmissor && { orgaoEmissor: data.orgaoEmissor }),
        ...(data.responsavelTecnico !== undefined && { responsavelTecnico: data.responsavelTecnico }),
        ...(data.dataEmissao && { dataEmissao: new Date(data.dataEmissao) }),
        ...(dataVencimento && {
          dataVencimento,
          status: data.status ?? this.calcularStatus(dataVencimento),
        }),
        ...(data.status && { status: data.status }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      },
      include: {
        empreendimento: { select: { id: true, nome: true } },
        condicoes: true,
      },
    })
  }

  async vincularArquivo(ctx: Ctx, id: string, chaveS3: string, nomeArquivo: string) {
    await this.buscarPorId(ctx, id)
    return prisma.licencaAmbiental.update({
      where: { id },
      data: { chaveS3, nomeArquivo },
    })
  }

  // ── Condições ────────────────────────────────────────────────────────────────

  async listarCondicoes(ctx: Ctx, licencaId: string) {
    await this.buscarPorId(ctx, licencaId)
    return prisma.condicaoLicenca.findMany({
      where: { licencaId },
      orderBy: { criadoEm: 'asc' },
    })
  }

  async criarCondicao(ctx: Ctx, licencaId: string, data: CriarCondicaoInput) {
    await this.buscarPorId(ctx, licencaId)
    return prisma.condicaoLicenca.create({
      data: {
        licencaId,
        numero: data.numero,
        descricao: data.descricao,
        prazo: data.prazo ? new Date(data.prazo) : undefined,
        status: data.status ?? 'PENDENTE',
        observacoes: data.observacoes,
      },
    })
  }

  async atualizarCondicao(ctx: Ctx, licencaId: string, condicaoId: string, data: AtualizarCondicaoInput) {
    await this.buscarPorId(ctx, licencaId)

    const condicao = await prisma.condicaoLicenca.findFirst({
      where: { id: condicaoId, licencaId },
    })
    if (!condicao) throw new NotFoundError('CondicaoLicenca', condicaoId)

    return prisma.condicaoLicenca.update({
      where: { id: condicaoId },
      data: {
        ...(data.numero !== undefined && { numero: data.numero }),
        ...(data.descricao && { descricao: data.descricao }),
        ...(data.prazo !== undefined && { prazo: data.prazo ? new Date(data.prazo) : null }),
        ...(data.status && { status: data.status }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      },
    })
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private calcularStatus(dataVencimento: Date): StatusLicenca {
    const hoje = new Date()
    const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

    if (diasRestantes < 0) return 'VENCIDA'
    if (diasRestantes <= 90) return 'A_RENOVAR'
    return 'VIGENTE'
  }
}

export const licencasAmbientaisService = new LicencasAmbientaisService()
