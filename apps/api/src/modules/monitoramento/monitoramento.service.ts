import { Decimal } from '@prisma/client/runtime/library.js'
import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// MONITORAMENTO SERVICE — Campanhas + Parâmetros + Poços de Monitoramento
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string; perfil: string }

export interface CriarCampanhaInput {
  empreendimentoId: string
  pocoMonitoramentoId?: string
  tipo: string
  dataColeta: string
  laboratorio: string
  resultado: string
  observacoes?: string
  parametros?: Array<{ nome: string; valorMedido: number; limiteVMP?: number; unidade: string; emAlerta: boolean }>
}

export interface CriarPocoMonitoramentoInput {
  empreendimentoId: string
  codigo: string
  profundidade?: number
  coordenadas?: string
  dataInstalacao?: string
}

class MonitoramentoService {
  async listarCampanhas(ctx: Ctx, filtros: { page: number; limit: number; empreendimentoId?: string; tipo?: string; resultado?: string }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.tipo && { tipo: filtros.tipo }),
      ...(filtros.resultado && { resultado: filtros.resultado }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.campanhaMonitoramento.count({ where }),
      prisma.campanhaMonitoramento.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          pocoMonitoramento: { select: { id: true, codigo: true } },
          _count: { select: { parametros: true } },
        },
        orderBy: { dataColeta: 'desc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarCampanhaPorId(ctx: Ctx, id: string) {
    const campanha = await prisma.campanhaMonitoramento.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
        pocoMonitoramento: true,
        parametros: { orderBy: { emAlerta: 'desc' } },
      },
    })
    if (!campanha) throw new NotFoundError('CampanhaMonitoramento', id)
    return campanha
  }

  async criarCampanha(ctx: Ctx, data: CriarCampanhaInput) {
    return prisma.campanhaMonitoramento.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        pocoMonitoramentoId: data.pocoMonitoramentoId,
        tipo: data.tipo,
        dataColeta: new Date(data.dataColeta),
        laboratorio: data.laboratorio,
        resultado: data.resultado,
        observacoes: data.observacoes,
        parametros: data.parametros ? {
          create: data.parametros.map((p) => ({
            nome: p.nome,
            valorMedido: p.valorMedido,
            limiteVMP: p.limiteVMP,
            unidade: p.unidade,
            emAlerta: p.emAlerta,
          })),
        } : undefined,
      },
      include: {
        empreendimento: { select: { id: true, nome: true } },
        parametros: true,
        _count: { select: { parametros: true } },
      },
    })
  }

  async listarPocos(ctx: Ctx, filtros: { page: number; limit: number; empreendimentoId?: string }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.pocoMonitoramento.count({ where }),
      prisma.pocoMonitoramento.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          _count: { select: { campanhas: true } },
        },
        orderBy: { codigo: 'asc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async criarPoco(ctx: Ctx, data: CriarPocoMonitoramentoInput) {
    return prisma.pocoMonitoramento.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        codigo: data.codigo,
        profundidade: data.profundidade,
        coordenadas: data.coordenadas,
        dataInstalacao: data.dataInstalacao ? new Date(data.dataInstalacao) : undefined,
      },
    })
  }

  async buscarPocoPorId(ctx: Ctx, id: string) {
    const poco = await prisma.pocoMonitoramento.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, nomeFantasia: true } },
        campanhas: {
          include: {
            parametros: { orderBy: { emAlerta: 'desc' } },
            _count: { select: { parametros: true } },
          },
          orderBy: { dataColeta: 'desc' },
          take: 20,
        },
      },
    })
    if (!poco) throw new NotFoundError('PoçoMonitoramento', id)
    return poco
  }

  async atualizarPoco(ctx: Ctx, id: string, data: {
    periodicidade?: string
    proximaColeta?: string
    status?: string
    observacoes?: string
  }) {
    const poco = await prisma.pocoMonitoramento.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!poco) throw new NotFoundError('PoçoMonitoramento', id)
    return prisma.pocoMonitoramento.update({
      where: { id },
      data: {
        ...(data.periodicidade !== undefined ? { periodicidade: data.periodicidade } : {}),
        ...(data.proximaColeta !== undefined ? { proximaColeta: data.proximaColeta ? new Date(data.proximaColeta) : null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
      },
    })
  }

  // Returns per-parameter historical values for the poço sorted by date (for trend analysis)
  async tendenciaParametros(ctx: Ctx, pocoId: string) {
    const poco = await prisma.pocoMonitoramento.findFirst({ where: { id: pocoId, tenantId: ctx.tenantId } })
    if (!poco) throw new NotFoundError('PoçoMonitoramento', pocoId)

    const campanhas = await prisma.campanhaMonitoramento.findMany({
      where: { pocoMonitoramentoId: pocoId, tenantId: ctx.tenantId },
      include: { parametros: true },
      orderBy: { dataColeta: 'asc' },
    })

    // Group by parameter name
    const parametroMap: Record<string, { data: string; valor: number; limiteVMP: number | null; emAlerta: boolean }[]> = {}
    for (const c of campanhas) {
      for (const p of c.parametros) {
        if (!parametroMap[p.nome]) parametroMap[p.nome] = []
        parametroMap[p.nome]!.push({
          data: c.dataColeta.toISOString().slice(0, 10),
          valor: Number(p.valorMedido),
          limiteVMP: p.limiteVMP ? Number(p.limiteVMP) : null,
          emAlerta: p.emAlerta,
        })
      }
    }

    return Object.entries(parametroMap).map(([nome, leituras]) => ({
      nome,
      leituras,
      tendencia: leituras.length >= 2
        ? leituras[leituras.length - 1]!.valor > leituras[leituras.length - 2]!.valor ? 'SUBINDO'
          : leituras[leituras.length - 1]!.valor < leituras[leituras.length - 2]!.valor ? 'DESCENDO'
          : 'ESTAVEL'
        : 'SEM_DADOS',
      ultimoAlerta: leituras[leituras.length - 1]?.emAlerta ?? false,
    }))
  }

  // ── Limites de Parâmetros ─────────────────────────────────────────────────────

  async listarLimites(ctx: Ctx, tipoMedio?: string) {
    return prisma.limiteParametro.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(tipoMedio ? { tipoMedio } : {}),
      },
      orderBy: [{ tipoMedio: 'asc' }, { nomeParametro: 'asc' }],
    })
  }

  async upsertLimite(ctx: Ctx, data: {
    nomeParametro: string
    tipoMedio: string
    limiteVMP: number
    unidade: string
    referencia?: string
  }) {
    return prisma.limiteParametro.upsert({
      where: {
        tenantId_nomeParametro_tipoMedio: {
          tenantId: ctx.tenantId,
          nomeParametro: data.nomeParametro,
          tipoMedio: data.tipoMedio,
        },
      },
      create: {
        tenantId: ctx.tenantId,
        nomeParametro: data.nomeParametro,
        tipoMedio: data.tipoMedio,
        limiteVMP: new Decimal(data.limiteVMP),
        unidade: data.unidade,
        referencia: data.referencia,
      },
      update: {
        limiteVMP: new Decimal(data.limiteVMP),
        unidade: data.unidade,
        referencia: data.referencia,
      },
    })
  }

  async deletarLimite(ctx: Ctx, id: string) {
    const limite = await prisma.limiteParametro.findFirst({ where: { id, tenantId: ctx.tenantId } })
    if (!limite) throw new NotFoundError('LimiteParametro', id)
    return prisma.limiteParametro.delete({ where: { id } })
  }
}

export const monitoramentoService = new MonitoramentoService()
