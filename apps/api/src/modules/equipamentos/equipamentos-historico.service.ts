import { prisma } from '../../infra/database/prisma.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import type { TipoEquipamento, TipoEventoEquipamento } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPAMENTOS HISTÓRICO SERVICE
// Serviço compartilhado para registrar e listar histórico técnico de
// qualquer tipo de equipamento (Tanque, Bomba, Linha, etc.)
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string; nome: string; email: string; ip: string }

export interface RegistrarEventoInput {
  empreendimentoId: string
  equipamentoTipo: TipoEquipamento
  equipamentoId: string
  tipoEvento: TipoEventoEquipamento
  dataEvento: string
  descricao: string
  responsavel?: string
  custo?: number
  documentoId?: string
  observacoes?: string
}

class EquipamentosHistoricoService {
  async listar(
    ctx: Ctx,
    equipamentoTipo: TipoEquipamento,
    equipamentoId: string,
    filtros: { page: number; limit: number },
  ) {
    const where = {
      tenantId: ctx.tenantId,
      equipamentoTipo,
      equipamentoId,
    }

    const [total, items] = await prisma.$transaction([
      prisma.equipamentoHistorico.count({ where }),
      prisma.equipamentoHistorico.findMany({
        where,
        include: {
          criadoPor: { select: { id: true, nome: true } },
          documento: { select: { id: true, nome: true } },
        },
        orderBy: { dataEvento: 'desc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async registrar(ctx: Ctx, data: RegistrarEventoInput) {
    const evento = await prisma.equipamentoHistorico.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        equipamentoTipo: data.equipamentoTipo,
        equipamentoId: data.equipamentoId,
        tipoEvento: data.tipoEvento,
        dataEvento: new Date(data.dataEvento),
        descricao: data.descricao,
        responsavel: data.responsavel,
        custo: data.custo,
        documentoId: data.documentoId,
        observacoes: data.observacoes,
        criadoPorId: ctx.id,
      },
      include: {
        criadoPor: { select: { id: true, nome: true } },
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      entidadeTipo: 'EquipamentoHistorico',
      entidadeId: evento.id,
      acao: 'CREATE',
      dadosDepois: evento,
      ipOrigem: ctx.ip,
    })

    return evento
  }

  async listarPorEmpreendimento(
    ctx: Ctx,
    empreendimentoId: string,
    filtros: { page: number; limit: number; tipo?: TipoEquipamento },
  ) {
    const where = {
      tenantId: ctx.tenantId,
      empreendimentoId,
      ...(filtros.tipo && { equipamentoTipo: filtros.tipo }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.equipamentoHistorico.count({ where }),
      prisma.equipamentoHistorico.findMany({
        where,
        include: {
          criadoPor: { select: { id: true, nome: true } },
          documento: { select: { id: true, nome: true } },
        },
        orderBy: { dataEvento: 'desc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }
}

export const equipamentosHistoricoService = new EquipamentosHistoricoService()
