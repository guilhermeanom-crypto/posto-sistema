import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'
import { assertEmpreendimento } from '../../shared/validators/assert-empreendimento.js'

// ─────────────────────────────────────────────────────────────────────────────
// ANP / INMETRO SERVICE — Bombas de abastecimento e calibração
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string; perfil: string }

export interface CriarBombaInput {
  empreendimentoId: string
  numero: number
  fabricante: string
  modelo?: string
  numeroDeSerie?: string
  combustiveis: string[]
  ultimaCalibracao?: string
  proximaCalibracao?: string
  stickerInmetro?: string
  observacoes?: string
}

export interface AtualizarBombaInput {
  fabricante?: string
  modelo?: string | null
  numeroDeSerie?: string | null
  combustiveis?: string[]
  ultimaCalibracao?: string | null
  proximaCalibracao?: string | null
  stickerInmetro?: string | null
  status?: string
  observacoes?: string | null
}

class AnpInmetroService {
  async listar(ctx: Ctx, filtros: { page: number; limit: number; empreendimentoId?: string; status?: string }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.status && { status: filtros.status }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.bombaAbastecimento.count({ where }),
      prisma.bombaAbastecimento.findMany({
        where,
        include: { empreendimento: { select: { id: true, nome: true } } },
        orderBy: [{ empreendimentoId: 'asc' }, { numero: 'asc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarPorId(ctx: Ctx, id: string) {
    const bomba = await prisma.bombaAbastecimento.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } } },
    })
    if (!bomba) throw new NotFoundError('BombaAbastecimento', id)
    return bomba
  }

  async criar(ctx: Ctx, data: CriarBombaInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)
    return prisma.bombaAbastecimento.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        numero: data.numero,
        fabricante: data.fabricante,
        modelo: data.modelo,
        numeroDeSerie: data.numeroDeSerie,
        combustiveis: data.combustiveis,
        ultimaCalibracao: data.ultimaCalibracao ? new Date(data.ultimaCalibracao) : undefined,
        proximaCalibracao: data.proximaCalibracao ? new Date(data.proximaCalibracao) : undefined,
        stickerInmetro: data.stickerInmetro,
        observacoes: data.observacoes,
      },
      include: { empreendimento: { select: { id: true, nome: true } } },
    })
  }

  async atualizar(ctx: Ctx, id: string, data: AtualizarBombaInput) {
    await this.buscarPorId(ctx, id)
    return prisma.bombaAbastecimento.update({
      where: { id },
      data: {
        ...(data.fabricante && { fabricante: data.fabricante }),
        ...(data.modelo !== undefined && { modelo: data.modelo }),
        ...(data.numeroDeSerie !== undefined && { numeroDeSerie: data.numeroDeSerie }),
        ...(data.combustiveis && { combustiveis: data.combustiveis }),
        ...(data.ultimaCalibracao !== undefined && {
          ultimaCalibracao: data.ultimaCalibracao ? new Date(data.ultimaCalibracao) : null,
        }),
        ...(data.proximaCalibracao !== undefined && {
          proximaCalibracao: data.proximaCalibracao ? new Date(data.proximaCalibracao) : null,
        }),
        ...(data.stickerInmetro !== undefined && { stickerInmetro: data.stickerInmetro }),
        ...(data.status && { status: data.status }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      },
      include: { empreendimento: { select: { id: true, nome: true } } },
    })
  }

  async registrarCalibracao(ctx: Ctx, id: string, dataExecucao: string, proximaCalibracao: string, sticker?: string) {
    await this.buscarPorId(ctx, id)
    return prisma.bombaAbastecimento.update({
      where: { id },
      data: {
        ultimaCalibracao: new Date(dataExecucao),
        proximaCalibracao: new Date(proximaCalibracao),
        ...(sticker && { stickerInmetro: sticker }),
      },
    })
  }
}

export const anpInmetroService = new AnpInmetroService()
