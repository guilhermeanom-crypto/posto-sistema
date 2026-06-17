import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'
import { assertEmpreendimento, assertTanque } from '../../shared/validators/assert-empreendimento.js'

// ─────────────────────────────────────────────────────────────────────────────
// ESTANQUEIDADE SERVICE — Tanques + Testes
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string; perfil: string }

export interface CriarTanqueInput {
  empreendimentoId: string
  numero: number
  capacidadeLitros: number
  combustivel: string
  material?: string
  materialTanque?: 'ACO_PAREDE_SIMPLES' | 'ACO_PAREDE_DUPLA' | 'FIBRA_PAREDE_SIMPLES' | 'FIBRA_PAREDE_DUPLA' | 'JAQUETADO'
  dataInstalacao?: string
  observacoes?: string | null
}

export interface CriarTesteInput {
  empresa: string
  responsavel?: string
  dataExecucao: string
  resultado: string
  metodo?: string
  proximoTeste: string
  observacoes?: string
}

class EstanqueidadeService {
  // ── Tanques ───────────────────────────────────────────────────────────────────

  async listarTanques(ctx: Ctx, filtros: { page: number; limit: number; empreendimentoId?: string; status?: string }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.status && { status: filtros.status }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.tanque.count({ where }),
      prisma.tanque.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          testes: { orderBy: { dataExecucao: 'desc' }, take: 1 },
          _count: { select: { testes: true } },
        },
        orderBy: [{ empreendimentoId: 'asc' }, { numero: 'asc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarTanquePorId(ctx: Ctx, id: string) {
    const tanque = await prisma.tanque.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
        testes: { orderBy: { dataExecucao: 'desc' } },
        _count: { select: { testes: true } },
      },
    })
    if (!tanque) throw new NotFoundError('Tanque', id)
    return tanque
  }

  async criarTanque(ctx: Ctx, data: CriarTanqueInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)

    return prisma.tanque.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        numero: data.numero,
        capacidadeLitros: data.capacidadeLitros,
        combustivel: data.combustivel,
        material: data.material,
        materialTanque: data.materialTanque,
        dataInstalacao: data.dataInstalacao ? new Date(data.dataInstalacao) : undefined,
        observacoes: data.observacoes,
      },
      include: { empreendimento: { select: { id: true, nome: true } } },
    })
  }

  async atualizarTanque(ctx: Ctx, id: string, data: Partial<CriarTanqueInput> & { status?: string; observacoes?: string | null }) {
    await this.buscarTanquePorId(ctx, id)
    return prisma.tanque.update({
      where: { id },
      data: {
        ...(data.combustivel && { combustivel: data.combustivel }),
        ...(data.material !== undefined && { material: data.material }),
        ...(data.materialTanque !== undefined && { materialTanque: data.materialTanque }),
        ...(data.dataInstalacao && { dataInstalacao: new Date(data.dataInstalacao) }),
        ...(data.status && { status: data.status }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      },
    })
  }

  // ── Testes de Estanqueidade ───────────────────────────────────────────────────

  async listarTestes(ctx: Ctx, filtros: { page: number; limit: number; tanqueId?: string; resultado?: string }) {
    const where = {
      tanque: { tenantId: ctx.tenantId },
      ...(filtros.tanqueId && { tanqueId: filtros.tanqueId }),
      ...(filtros.resultado && { resultado: filtros.resultado }),
    }
    const [total, items] = await prisma.$transaction([
      prisma.testeEstanqueidade.count({ where }),
      prisma.testeEstanqueidade.findMany({
        where,
        include: {
          tanque: {
            select: { id: true, numero: true, combustivel: true, empreendimento: { select: { id: true, nome: true } } },
          },
        },
        orderBy: { proximoTeste: 'asc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])
    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async criarTeste(ctx: Ctx, tanqueId: string, data: CriarTesteInput) {
    await assertTanque(ctx.tenantId, tanqueId)

    return prisma.testeEstanqueidade.create({
      data: {
        tanqueId,
        empresa: data.empresa,
        responsavel: data.responsavel,
        dataExecucao: new Date(data.dataExecucao),
        resultado: data.resultado,
        metodo: data.metodo,
        proximoTeste: new Date(data.proximoTeste),
        observacoes: data.observacoes,
      },
      include: {
        tanque: { select: { id: true, numero: true, combustivel: true } },
      },
    })
  }
}

export const estanqueidadeService = new EstanqueidadeService()
