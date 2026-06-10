import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// OUTORGA HÍDRICA SERVICE — Poços Artesianos + Laudos de Água
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string; perfil: string }

export interface CriarPocoInput {
  empreendimentoId: string
  codigo: string
  profundidade?: number
  coordenadas?: string
  outorgaDAEE?: string
  validadeOutorga?: string
  vazaoAutorizada?: number
  dataPerforacao?: string
  observacoes?: string
}

export interface CriarLaudoAguaInput {
  dataCampanha: string
  laboratorio: string
  resultado: string
  parametros: Array<{ nome: string; valorMedido: number; limiteVMP?: number; unidade: string; conforme: boolean }>
  observacoes?: string
}

class OutorgaHidricaService {
  async listarPocos(ctx: Ctx, filtros: { page: number; limit: number; empreendimentoId?: string; status?: string }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.status && { status: filtros.status }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.pocoArtesiano.count({ where }),
      prisma.pocoArtesiano.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          laudos: { orderBy: { dataCampanha: 'desc' }, take: 1 },
          _count: { select: { laudos: true } },
        },
        orderBy: { criadoEm: 'desc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarPocoPorId(ctx: Ctx, id: string) {
    const poco = await prisma.pocoArtesiano.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
        laudos: { orderBy: { dataCampanha: 'desc' } },
      },
    })
    if (!poco) throw new NotFoundError('PocoArtesiano', id)
    return poco
  }

  async criarPoco(ctx: Ctx, data: CriarPocoInput) {
    return prisma.pocoArtesiano.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        codigo: data.codigo,
        profundidade: data.profundidade,
        coordenadas: data.coordenadas,
        outorgaDAEE: data.outorgaDAEE,
        validadeOutorga: data.validadeOutorga ? new Date(data.validadeOutorga) : undefined,
        vazaoAutorizada: data.vazaoAutorizada,
        dataPerforacao: data.dataPerforacao ? new Date(data.dataPerforacao) : undefined,
        observacoes: data.observacoes,
      },
      include: { empreendimento: { select: { id: true, nome: true } } },
    })
  }

  async criarLaudo(ctx: Ctx, pocoId: string, data: CriarLaudoAguaInput) {
    const poco = await prisma.pocoArtesiano.findFirst({ where: { id: pocoId, tenantId: ctx.tenantId } })
    if (!poco) throw new NotFoundError('PocoArtesiano', pocoId)

    return prisma.laudoAgua.create({
      data: {
        pocoId,
        dataCampanha: new Date(data.dataCampanha),
        laboratorio: data.laboratorio,
        resultado: data.resultado,
        parametros: data.parametros,
        observacoes: data.observacoes,
      },
      include: { poco: { select: { id: true, codigo: true } } },
    })
  }
}

export const outorgaHidricaService = new OutorgaHidricaService()
