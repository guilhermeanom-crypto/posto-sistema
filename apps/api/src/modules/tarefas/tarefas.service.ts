import { prisma } from '../../infra/database/prisma.js'
import {
  NotFoundError,
  ForbiddenError,
  TarefaStatusInvalidoError,
} from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { eventBus } from '../../shared/events/event-bus.js'
import {
  assertCondicionante,
  assertDocumento,
  assertEmpreendimento,
  assertProcesso,
} from '../../shared/validators/assert-empreendimento.js'
import type {
  CriarTarefaInput,
  AtualizarTarefaInput,
  ConcluirTarefaInput,
  ReatribuirTarefaInput,
  CancelarTarefaInput,
} from '@repo/schemas'

// ─────────────────────────────────────────────────────────────────────────────
// TAREFAS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

interface ContextoUsuario {
  id: string
  tenantId: string
  perfil: string
  nome: string
  email: string
  ip: string
}

const TRANSICOES_TAREFA: Record<string, string[]> = {
  PENDENTE: ['EM_ANDAMENTO', 'CANCELADA'],
  EM_ANDAMENTO: ['CONCLUIDA', 'PENDENTE', 'CANCELADA'],
  CONCLUIDA: [],
  CANCELADA: [],
}

export class TarefasService {
  async listar(
    ctx: ContextoUsuario,
    filtros: {
      page: number
      limit: number
      empreendimentoId?: string
      responsavelId?: string
      status?: string
      prioridade?: string
      origem?: string
    },
  ) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.empreendimentoId && { empreendimentoId: filtros.empreendimentoId }),
      ...(filtros.responsavelId && { responsavelId: filtros.responsavelId }),
      ...(filtros.status && { status: filtros.status as never }),
      ...(filtros.prioridade && { prioridade: filtros.prioridade as never }),
      ...(filtros.origem && { origem: filtros.origem as never }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.tarefa.count({ where }),
      prisma.tarefa.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true } },
          responsavel: { select: { id: true, nome: true } },
          criador: { select: { id: true, nome: true } },
          _count: { select: { evidencias: true } },
        },
        orderBy: [{ dataVencimento: 'asc' }, { prioridade: 'desc' }, { criadoEm: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarPorId(ctx: ContextoUsuario, id: string) {
    const tarefa = await prisma.tarefa.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        criador: { select: { id: true, nome: true } },
        escaladoPara: { select: { id: true, nome: true } },
        processo: { select: { id: true, numeroProtocolo: true } },
        condicionante: { select: { id: true, descricao: true } },
        evidencias: { orderBy: { criadoEm: 'desc' } },
      },
    })

    if (!tarefa) throw new NotFoundError('Tarefa', id)
    return tarefa
  }

  async criar(ctx: ContextoUsuario, data: CriarTarefaInput) {
    await assertEmpreendimento(ctx.tenantId, data.empreendimentoId)

    if (data.processoId) {
      await assertProcesso(ctx.tenantId, data.processoId, { empreendimentoId: data.empreendimentoId })
    }

    if (data.condicionanteId) {
      await assertCondicionante(ctx.tenantId, data.condicionanteId, {
        empreendimentoId: data.empreendimentoId,
        processoId: data.processoId,
      })
    }

    if (data.documentoId) {
      await assertDocumento(ctx.tenantId, data.documentoId, { empreendimentoId: data.empreendimentoId })
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        tenantId: ctx.tenantId,
        empreendimentoId: data.empreendimentoId,
        titulo: data.titulo,
        descricao: data.descricao,
        prioridade: data.prioridade,
        responsavelId: data.responsavelId,
        criadorId: ctx.id,
        processoId: data.processoId,
        condicionanteId: data.condicionanteId,
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
        status: 'PENDENTE',
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'tarefa.criada',
      entidadeTipo: 'tarefa',
      entidadeId: tarefa.id,
      dadosDepois: data,
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: data.empreendimentoId },
    })

    eventBus.emit('tarefa.criada', {
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      tarefaId: tarefa.id,
      responsavelId: data.responsavelId,
      empreendimentoId: data.empreendimentoId,
      origem: 'MANUAL',
      prioridade: data.prioridade,
      timestamp: new Date(),
    })

    return tarefa
  }

  async atualizar(ctx: ContextoUsuario, id: string, data: AtualizarTarefaInput) {
    const tarefa = await this.buscarPorId(ctx, id)

    if (['CONCLUIDA', 'CANCELADA'].includes(tarefa.status)) {
      throw new TarefaStatusInvalidoError(tarefa.status, 'atualização')
    }

    const atualizada = await prisma.tarefa.update({
      where: { id },
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        prioridade: data.prioridade,
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'tarefa.atualizada',
      entidadeTipo: 'tarefa',
      entidadeId: id,
      dadosDepois: data,
      ipOrigem: ctx.ip,
    })

    return atualizada
  }

  async concluir(ctx: ContextoUsuario, id: string, data: ConcluirTarefaInput) {
    const tarefa = await this.buscarPorId(ctx, id)

    if (!['EM_ANDAMENTO', 'EM_ATRASO', 'PENDENTE'].includes(tarefa.status)) {
      throw new TarefaStatusInvalidoError(tarefa.status, 'CONCLUIDA')
    }

    // Verifica se o usuário é o responsável ou tem perfil de coordenador+
    const podeConcluir =
      tarefa.responsavelId === ctx.id ||
      ['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)
    if (!podeConcluir) {
      throw new ForbiddenError('Apenas o responsável pode concluir a tarefa')
    }

    await prisma.$transaction(async (tx) => {
      // Registra cada evidência informada
      for (const ev of data.evidencias) {
        if (ev.tipo === 'TEXTO') {
          await tx.evidenciaTarefa.create({
            data: {
              tarefaId: id,
              tipo: ev.tipo,
              descricao: ev.descricao,
              textoLivre: ev.textoLivre,
              enviadoPorId: ctx.id,
            },
          })
        } else if (ev.tipo === 'LINK') {
          await tx.evidenciaTarefa.create({
            data: {
              tarefaId: id,
              tipo: ev.tipo,
              descricao: ev.descricao,
              url: ev.url,
              enviadoPorId: ctx.id,
            },
          })
        } else if (ev.tipo === 'DOCUMENTO') {
          await tx.evidenciaTarefa.create({
            data: {
              tarefaId: id,
              tipo: ev.tipo,
              descricao: ev.descricao,
              documentoVersaoId: ev.documentoVersaoId,
              enviadoPorId: ctx.id,
            },
          })
        }
      }

      await tx.tarefa.update({
        where: { id },
        data: { status: 'CONCLUIDA', dataConclusao: new Date() },
      })
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'tarefa.concluida',
      entidadeTipo: 'tarefa',
      entidadeId: id,
      dadosDepois: { evidencias: data.evidencias.length },
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: tarefa.empreendimentoId },
    })

    eventBus.emit('tarefa.concluida', {
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      tarefaId: id,
      responsavelId: tarefa.responsavelId ?? ctx.id,
      empreendimentoId: tarefa.empreendimentoId,
      timestamp: new Date(),
    })

    return this.buscarPorId(ctx, id)
  }

  async reatribuir(ctx: ContextoUsuario, id: string, data: ReatribuirTarefaInput) {
    if (!['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)) {
      throw new ForbiddenError('Apenas coordenadores podem reatribuir tarefas')
    }

    const tarefa = await this.buscarPorId(ctx, id)

    if (['CONCLUIDA', 'CANCELADA'].includes(tarefa.status)) {
      throw new TarefaStatusInvalidoError(tarefa.status, 'reatribuição')
    }

    const atualizada = await prisma.tarefa.update({
      where: { id },
      data: { responsavelId: data.responsavelId },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'tarefa.reatribuida',
      entidadeTipo: 'tarefa',
      entidadeId: id,
      dadosAntes: { responsavelId: tarefa.responsavelId },
      dadosDepois: { responsavelId: data.responsavelId, motivo: data.motivo },
      ipOrigem: ctx.ip,
    })

    return atualizada
  }

  async cancelar(ctx: ContextoUsuario, id: string, data: CancelarTarefaInput) {
    const tarefa = await this.buscarPorId(ctx, id)

    if (['CONCLUIDA', 'CANCELADA'].includes(tarefa.status)) {
      throw new TarefaStatusInvalidoError(tarefa.status, 'CANCELADA')
    }

    // Somente o criador, responsável ou coordenador+ pode cancelar
    const podeCancelar =
      tarefa.criadorId === ctx.id ||
      tarefa.responsavelId === ctx.id ||
      ['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)
    if (!podeCancelar) {
      throw new ForbiddenError('Sem permissão para cancelar esta tarefa')
    }

    await prisma.tarefa.update({
      where: { id },
      data: { status: 'CANCELADA' },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'tarefa.cancelada',
      entidadeTipo: 'tarefa',
      entidadeId: id,
      dadosDepois: { motivo: data.motivo },
      ipOrigem: ctx.ip,
    })
  }

  async iniciar(ctx: ContextoUsuario, id: string) {
    const tarefa = await this.buscarPorId(ctx, id)

    const transicoesValidas = TRANSICOES_TAREFA[tarefa.status] ?? []
    if (!transicoesValidas.includes('EM_ANDAMENTO')) {
      throw new TarefaStatusInvalidoError(tarefa.status, 'EM_ANDAMENTO')
    }

    if (tarefa.responsavelId !== ctx.id && !['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)) {
      throw new ForbiddenError('Apenas o responsável pode iniciar a tarefa')
    }

    return prisma.tarefa.update({
      where: { id },
      data: { status: 'EM_ANDAMENTO' },
    })
  }
}

export const tarefasService = new TarefasService()
