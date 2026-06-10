import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'
import type { StatusAutoInfracao, InstanciaRecurso } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// FISCALIZAÇÕES SERVICE — Autos de Infração + Recursos Administrativos
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string; perfil: string }

export interface CriarAutoInput {
  empreendimentoId: string
  orgao: string
  numeroAuto: string
  dataLavratura: string
  dataRecebimento?: string
  artigo?: string
  descricao: string
  valorMulta?: number
  prazoDefesa: string
  observacoes?: string
}

export interface CriarRecursoInput {
  instancia: InstanciaRecurso
  dataProtocolo: string
  prazoResposta?: string
  numeroProtocolo?: string
  observacoes?: string
}

export interface AtualizarRecursoInput {
  resultado?: string
  dataJulgamento?: string
  numeroProtocolo?: string | null
  observacoes?: string | null
}

class FiscalizacoesService {
  async listar(
    ctx: Ctx,
    filtros: { page: number; limit: number; empreendimentoId?: string; status?: string; orgao?: string },
  ) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.status && { status: filtros.status as StatusAutoInfracao }),
      ...(filtros.orgao && { orgao: filtros.orgao }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.autoInfracao.count({ where }),
      prisma.autoInfracao.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          _count: { select: { recursos: true } },
        },
        orderBy: [{ prazoDefesa: 'asc' }, { criadoEm: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarPorId(ctx: Ctx, id: string) {
    const auto = await prisma.autoInfracao.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
        recursos: { orderBy: { criadoEm: 'asc' } },
      },
    })
    if (!auto) throw new NotFoundError('AutoInfracao', id)
    return auto
  }

  async criar(ctx: Ctx, data: CriarAutoInput) {
    return prisma.autoInfracao.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        orgao: data.orgao,
        numeroAuto: data.numeroAuto,
        dataLavratura: new Date(data.dataLavratura),
        dataRecebimento: data.dataRecebimento ? new Date(data.dataRecebimento) : undefined,
        artigo: data.artigo,
        descricao: data.descricao,
        valorMulta: data.valorMulta,
        prazoDefesa: new Date(data.prazoDefesa),
        observacoes: data.observacoes,
      },
      include: { empreendimento: { select: { id: true, nome: true } } },
    })
  }

  async atualizarStatus(ctx: Ctx, id: string, status: StatusAutoInfracao, observacoes?: string) {
    await this.buscarPorId(ctx, id)
    return prisma.autoInfracao.update({
      where: { id },
      data: {
        status,
        ...(observacoes !== undefined && { observacoes }),
      },
    })
  }

  // ── Recursos ──────────────────────────────────────────────────────────────────

  async criarRecurso(ctx: Ctx, autoId: string, data: CriarRecursoInput) {
    await this.buscarPorId(ctx, autoId)

    const [recurso] = await prisma.$transaction([
      prisma.recursoAdministrativo.create({
        data: {
          autoId,
          instancia: data.instancia,
          dataProtocolo: new Date(data.dataProtocolo),
          prazoResposta: data.prazoResposta ? new Date(data.prazoResposta) : undefined,
          numeroProtocolo: data.numeroProtocolo,
          resultado: 'PENDENTE',
          observacoes: data.observacoes,
        },
      }),
      prisma.autoInfracao.update({
        where: { id: autoId },
        data: { status: 'EM_RECURSO' },
      }),
    ])

    return recurso
  }

  async atualizarRecurso(ctx: Ctx, autoId: string, recursoId: string, data: AtualizarRecursoInput) {
    await this.buscarPorId(ctx, autoId)

    const recurso = await prisma.recursoAdministrativo.findFirst({ where: { id: recursoId, autoId } })
    if (!recurso) throw new NotFoundError('RecursoAdministrativo', recursoId)

    const updatedRecurso = await prisma.recursoAdministrativo.update({
      where: { id: recursoId },
      data: {
        ...(data.resultado && { resultado: data.resultado }),
        ...(data.dataJulgamento && { dataJulgamento: new Date(data.dataJulgamento) }),
        ...(data.numeroProtocolo !== undefined && { numeroProtocolo: data.numeroProtocolo }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      },
    })

    // Atualiza status do auto conforme resultado do recurso
    if (data.resultado === 'FAVORAVEL') {
      await prisma.autoInfracao.update({ where: { id: autoId }, data: { status: 'JULGADO_FAVORAVEL' } })
    } else if (data.resultado === 'DESFAVORAVEL') {
      await prisma.autoInfracao.update({ where: { id: autoId }, data: { status: 'JULGADO_DESFAVORAVEL' } })
    }

    return updatedRecurso
  }

  // ── Job: verificar prazos de defesa ──────────────────────────────────────────

  async verificarPrazosDefesa() {
    const hoje = new Date()
    const diasAlerta = [7, 3, 1]

    for (const dias of diasAlerta) {
      const alvo = new Date(hoje)
      alvo.setDate(alvo.getDate() + dias)

      const autos = await prisma.autoInfracao.findMany({
        where: {
          status: { in: ['RECEBIDO', 'EM_DEFESA'] },
          prazoDefesa: {
            gte: new Date(alvo.toDateString()),
            lt: new Date(new Date(alvo.toDateString()).getTime() + 86400000),
          },
        },
        include: { empreendimento: { select: { tenantId: true, nome: true } } },
      })

      for (const auto of autos) {
        await prisma.alerta.create({
          data: {
            tenantId: auto.tenantId,
            empreendimentoId: auto.empreendimentoId,
            tipo: 'COMPLIANCE_CRITICO',
            nivel: dias === 1 ? 'CRITICO' : dias === 3 ? 'ALTO' : 'MEDIO',
            titulo: `Prazo de defesa em ${dias} dia${dias !== 1 ? 's' : ''}`,
            mensagem: `Auto de infração ${auto.numeroAuto} (${auto.orgao}) — prazo de defesa vence em ${dias} dia${dias !== 1 ? 's' : ''}.`,
            entidadeTipo: 'AutoInfracao',
            entidadeId: auto.id,
          },
        })
      }
    }
  }
}

export const fiscalizacoesService = new FiscalizacoesService()
