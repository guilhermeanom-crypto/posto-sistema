import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'
import { assertEmpreendimento } from '../../shared/validators/assert-empreendimento.js'
import type { TipoAlvara, StatusLicenca } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// REGULATÓRIO URBANO SERVICE
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx {
  id: string
  tenantId: string
  perfil: string
}

export interface CriarAlvaraInput {
  empreendimentoId: string
  tipo: TipoAlvara
  numero?: string
  orgaoEmissor: string
  dataEmissao?: string
  dataVencimento?: string
  observacoes?: string
}

export interface AtualizarAlvaraInput {
  numero?: string | null
  orgaoEmissor?: string
  dataEmissao?: string
  dataVencimento?: string
  status?: StatusLicenca
  observacoes?: string | null
}

class RegulatorioUrbanoService {
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
      ...(filtros.tipo && { tipo: filtros.tipo as TipoAlvara }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.alvaraUrbanistico.count({ where }),
      prisma.alvaraUrbanistico.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
        },
        orderBy: [{ dataVencimento: 'asc' }, { criadoEm: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarPorId(ctx: Ctx, id: string) {
    const alvara = await prisma.alvaraUrbanistico.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
      },
    })

    if (!alvara) throw new NotFoundError('AlvaraUrbanistico', id)
    return alvara
  }

  async criar(ctx: Ctx, data: CriarAlvaraInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)
    const dataVencimento = data.dataVencimento ? new Date(data.dataVencimento) : undefined

    return prisma.alvaraUrbanistico.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        tipo: data.tipo,
        numero: data.numero,
        orgaoEmissor: data.orgaoEmissor,
        dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : undefined,
        dataVencimento,
        status: dataVencimento ? this.calcularStatus(dataVencimento) : 'VIGENTE',
        observacoes: data.observacoes,
      },
      include: {
        empreendimento: { select: { id: true, nome: true } },
      },
    })
  }

  async atualizar(ctx: Ctx, id: string, data: AtualizarAlvaraInput) {
    await this.buscarPorId(ctx, id)

    const dataVencimento = data.dataVencimento ? new Date(data.dataVencimento) : undefined

    return prisma.alvaraUrbanistico.update({
      where: { id },
      data: {
        ...(data.numero !== undefined && { numero: data.numero }),
        ...(data.orgaoEmissor && { orgaoEmissor: data.orgaoEmissor }),
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
      },
    })
  }

  async vincularArquivo(ctx: Ctx, id: string, chaveS3: string, nomeArquivo: string) {
    await this.buscarPorId(ctx, id)
    return prisma.alvaraUrbanistico.update({
      where: { id },
      data: { chaveS3, nomeArquivo },
    })
  }

  private calcularStatus(dataVencimento: Date): StatusLicenca {
    const hoje = new Date()
    const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

    if (diasRestantes < 0) return 'VENCIDA'
    if (diasRestantes <= 120) return 'A_RENOVAR'
    return 'VIGENTE'
  }
}

export const regulatorioUrbanoService = new RegulatorioUrbanoService()
