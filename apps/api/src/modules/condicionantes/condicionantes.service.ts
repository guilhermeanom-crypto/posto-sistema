import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError, ForbiddenError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { eventBus } from '../../shared/events/event-bus.js'
import { adicionarDias, adicionarMeses, adicionarAnos } from '@repo/utils'
import type { CriarCondicionanteInput, CumprirCondicionanteInput, DispensarCondicionanteInput } from '@repo/schemas'

// ─────────────────────────────────────────────────────────────────────────────
// CONDICIONANTES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

interface ContextoUsuario {
  id: string
  tenantId: string
  perfil: string
  nome: string
  email: string
  ip: string
}

export class CondicionantesService {
  async listar(
    ctx: ContextoUsuario,
    filtros: {
      page: number
      limit: number
      empreendimentoId?: string
      processoId?: string
      status?: string
    },
  ) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.processoId && { processoId: filtros.processoId }),
      ...(filtros.status && { status: filtros.status as never }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.condicionante.count({ where }),
      prisma.condicionante.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          processo: { select: { id: true, numeroProtocolo: true, numeroLicenca: true } },
          responsavel: { select: { id: true, nome: true } },
          _count: { select: { ciclos: true } },
        },
        orderBy: [{ proximoVencimento: 'asc' }, { criadoEm: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarPorId(ctx: ContextoUsuario, id: string) {
    const condicionante = await prisma.condicionante.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true } },
        processo: { select: { id: true, numeroProtocolo: true, numeroLicenca: true } },
        responsavel: { select: { id: true, nome: true } },
        ciclos: {
          orderBy: { criadoEm: 'desc' },
          take: 10,
          include: { cumpridoPor: { select: { id: true, nome: true } } },
        },
      },
    })

    if (!condicionante) throw new NotFoundError('Condicionante', id)
    return condicionante
  }

  async criar(ctx: ContextoUsuario, data: CriarCondicionanteInput) {
    const condicionante = await prisma.condicionante.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        processoId: data.processoId,
        descricao: data.descricao,
        numeroCondicionante: data.numeroCondicionante,
        tipo: data.tipo,
        periodicidade: data.periodicidade,
        intervaloDias: data.intervaloDias,
        prazoCumprimento: data.prazoCumprimento ? new Date(data.prazoCumprimento) : undefined,
        proximoVencimento: data.prazoCumprimento ? new Date(data.prazoCumprimento) : undefined,
        evidenciaExigida: data.evidenciaExigida,
        responsavelId: data.responsavelId,
        gerarTarefaAuto: data.gerarTarefaAuto,
        diasAlertaAntes: data.diasAlertaAntes,
        status: 'PENDENTE',
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'condicionante.criada',
      entidadeTipo: 'condicionante',
      entidadeId: condicionante.id,
      dadosDepois: { descricao: data.descricao, tipo: data.tipo },
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: data.empreendimentoId },
    })

    return condicionante
  }

  async cumprir(ctx: ContextoUsuario, id: string, data: CumprirCondicionanteInput) {
    const condicionante = await this.buscarPorId(ctx, id)

    if (!['PENDENTE', 'VENCIDA'].includes(condicionante.status)) {
      throw new ForbiddenError(`Condicionante com status '${condicionante.status}' não pode ser cumprida`)
    }

    const agora = new Date()
    const proximoVencimento = this.calcularProximoVencimento(condicionante)

    // Conta ciclos existentes para determinar o numeroCiclo
    const totalCiclos = await prisma.cicloCondicionante.count({ where: { condicionanteId: id } })

    await prisma.$transaction(async (tx) => {
      await tx.cicloCondicionante.create({
        data: {
          condicionanteId: id,
          numeroCiclo: totalCiclos + 1,
          periodoInicio: condicionante.proximoVencimento ?? agora,
          periodoFim: agora,
          status: 'CUMPRIDA',
          documentoEvidenciaId: data.documentoEvidenciaId,
          observacoes: data.observacoes,
          cumpridoEm: agora,
          cumpridoPorId: ctx.id,
        },
      })

      await tx.condicionante.update({
        where: { id },
        data: {
          status: proximoVencimento ? 'PENDENTE' : 'CUMPRIDA',
          proximoVencimento,
          cumpridaEm: agora,
        },
      })
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'condicionante.cumprida',
      entidadeTipo: 'condicionante',
      entidadeId: id,
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: condicionante.empreendimentoId },
    })

    eventBus.emit('condicionante.cumprida', {
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      condicionanteId: id,
      processoId: condicionante.processoId ?? '',
      empreendimentoId: condicionante.empreendimentoId,
      timestamp: new Date(),
    })

    return this.buscarPorId(ctx, id)
  }

  async dispensar(ctx: ContextoUsuario, id: string, data: DispensarCondicionanteInput) {
    if (!['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)) {
      throw new ForbiddenError('Apenas coordenadores podem dispensar condicionantes')
    }

    const condicionante = await this.buscarPorId(ctx, id)

    await prisma.condicionante.update({
      where: { id },
      data: {
        status: 'DISPENSADA',
        motivoDispensa: data.motivoDispensa,
        dispensadoPorId: ctx.id,
        dispensadoEm: new Date(),
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'condicionante.dispensada',
      entidadeTipo: 'condicionante',
      entidadeId: id,
      dadosDepois: { motivo: data.motivoDispensa },
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: condicionante.empreendimentoId },
    })
  }

  private calcularProximoVencimento(condicionante: {
    periodicidade: string
    intervaloDias: number | null
    proximoVencimento: Date | null
  }): Date | null {
    const base = condicionante.proximoVencimento ?? new Date()

    switch (condicionante.periodicidade) {
      case 'DIARIA': return adicionarDias(base, 1)
      case 'SEMANAL': return adicionarDias(base, 7)
      case 'QUINZENAL': return adicionarDias(base, 15)
      case 'MENSAL': return adicionarMeses(base, 1)
      case 'BIMESTRAL': return adicionarMeses(base, 2)
      case 'TRIMESTRAL': return adicionarMeses(base, 3)
      case 'SEMESTRAL': return adicionarMeses(base, 6)
      case 'ANUAL': return adicionarAnos(base, 1)
      case 'PERSONALIZADA': return condicionante.intervaloDias ? adicionarDias(base, condicionante.intervaloDias) : null
      case 'UNICA': return null
      default: return null
    }
  }
}

export const condicionantesService = new CondicionantesService()
