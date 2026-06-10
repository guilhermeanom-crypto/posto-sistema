import { prisma } from '../../infra/database/prisma.js'
import {
  NotFoundError,
  ForbiddenError,
  ProcessoStatusInvalidoError,
  ProcessoFaseInvalidaError,
  ProcessoRequisitoPendenteError,
} from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { eventBus } from '../../shared/events/event-bus.js'
import { TRANSICOES_PROCESSO, StatusProcesso } from '@repo/types'
import type { CriarProcessoInput, AtualizarProcessoInput, FiltrosProcessoInput } from '@repo/schemas'

// ─────────────────────────────────────────────────────────────────────────────
// PROCESSOS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

interface ContextoUsuario {
  id: string
  tenantId: string
  perfil: string
  nome: string
  email: string
  ip: string
}

export class ProcessosService {
  async listar(ctx: ContextoUsuario, filtros: FiltrosProcessoInput) {
    const { page, limit, status, orgaoId, responsavelId, vencimentoDe, vencimentoAte, busca, empreendimentoId } = filtros

    const where = {
      tenantId: ctx.tenantId,
      ...(empreendimentoId && { empreendimentoId }),
      ...(status && { status }),
      ...(orgaoId && { orgaoId }),
      ...(responsavelId && { responsavelId }),
      ...(vencimentoDe || vencimentoAte
        ? {
            dataVencimento: {
              ...(vencimentoDe && { gte: new Date(vencimentoDe) }),
              ...(vencimentoAte && { lte: new Date(vencimentoAte) }),
            },
          }
        : {}),
      ...(busca && {
        OR: [
          { numeroProtocolo: { contains: busca, mode: 'insensitive' as const } },
          { numeroLicenca: { contains: busca, mode: 'insensitive' as const } },
          { tipoProcesso: { nome: { contains: busca, mode: 'insensitive' as const } } },
        ],
      }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.processo.count({ where }),
      prisma.processo.findMany({
        where,
        include: {
          empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
          tipoProcesso: { select: { id: true, nome: true, categoria: true } },
          orgao: { select: { id: true, nome: true, sigla: true, esfera: true } },
          responsavel: { select: { id: true, nome: true } },
          _count: {
            select: {
              requisitos: { where: { status: 'PENDENTE', obrigatorio: true } },
              condicionantes: { where: { status: { in: ['PENDENTE', 'VENCIDA'] } } },
            },
          },
        },
        orderBy: [{ dataVencimento: 'asc' }, { criadoEm: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return { items, total, page, limit }
  }

  async buscarPorId(ctx: ContextoUsuario, id: string) {
    const processo = await prisma.processo.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        empreendimento: true,
        tipoProcesso: { include: { fases: { orderBy: { ordem: 'asc' } } } },
        orgao: true,
        responsavel: { select: { id: true, nome: true, email: true } },
        requisitos: {
          include: { tipoDocumento: true, documento: true },
          orderBy: { ordem: 'asc' },
        },
        condicionantes: { orderBy: { criadoEm: 'asc' } },
        historicoFases: { orderBy: { iniciouEm: 'asc' }, include: { avancadoPor: { select: { id: true, nome: true } } } },
      },
    })

    if (!processo) throw new NotFoundError('Processo', id)
    return processo
  }

  async criar(ctx: ContextoUsuario, data: CriarProcessoInput) {
    const tipoProcesso = await prisma.tipoProcesso.findFirst({
      where: { id: data.tipoProcessoId, tenantId: ctx.tenantId, ativo: true },
      include: {
        fases: { orderBy: { ordem: 'asc' } },
        requisitos: { include: { tipoDocumento: true } },
      },
    })

    if (!tipoProcesso) throw new NotFoundError('Tipo de Processo', data.tipoProcessoId)

    const processo = await prisma.$transaction(async (tx) => {
      // Calcula data de início de renovação se data de vencimento informada
      const dataInicioRenovacao =
        data.dataVencimento && tipoProcesso.diasAntecedenciaRenovacao
          ? new Date(
              new Date(data.dataVencimento).getTime() -
                tipoProcesso.diasAntecedenciaRenovacao * 24 * 60 * 60 * 1000,
            )
          : null

      const novoProcesso = await tx.processo.create({
        data: {
          tenantId: ctx.tenantId,
          empreendimentoId: data.empreendimentoId,
          tipoProcessoId: data.tipoProcessoId,
          orgaoId: tipoProcesso.orgaoId,
          status: StatusProcesso.EM_ELABORACAO,
          faseAtualOrdem: tipoProcesso.fases[0]?.ordem ?? 1,
          numeroProtocolo: data.numeroProtocolo,
          numeroLicenca: data.numeroLicenca,
          dataAbertura: data.dataAbertura ? new Date(data.dataAbertura) : undefined,
          dataProtocolo: data.dataProtocolo ? new Date(data.dataProtocolo) : undefined,
          dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
          dataInicioRenovacao,
          responsavelId: data.responsavelId,
          observacoes: data.observacoes,
          metadados: data.metadados as never,
        },
      })

      // Gera requisitos a partir do template
      if (tipoProcesso.requisitos.length > 0) {
        await tx.requisitoProcesso.createMany({
          data: tipoProcesso.requisitos.map((req) => ({
            processoId: novoProcesso.id,
            tipoDocumentoId: req.tipoDocumentoId,
            requisitoTipoId: req.id,
            faseTipoProcessoId: req.faseTipoProcessoId,
            descricao: req.descricaoEspecifica,
            obrigatorio: req.obrigatorio,
            status: 'PENDENTE' as const,
            ordem: req.ordem,
          })),
        })
      }

      // Registra fase inicial no histórico
      if (tipoProcesso.fases[0]) {
        await tx.historicoFaseProcesso.create({
          data: {
            processoId: novoProcesso.id,
            faseTipoProcessoId: tipoProcesso.fases[0].id,
            ordemFase: tipoProcesso.fases[0].ordem,
            nomeFase: tipoProcesso.fases[0].nome,
            avancadoPorId: ctx.id,
          },
        })
      }

      return novoProcesso
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'processo.criado',
      entidadeTipo: 'processo',
      entidadeId: processo.id,
      dadosDepois: { tipoProcessoId: data.tipoProcessoId, empreendimentoId: data.empreendimentoId },
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: data.empreendimentoId },
    })

    return processo
  }

  async atualizar(ctx: ContextoUsuario, id: string, data: AtualizarProcessoInput) {
    await this.buscarPorId(ctx, id)

    const atualizado = await prisma.processo.update({
      where: { id },
      data: {
        numeroProtocolo: data.numeroProtocolo,
        numeroLicenca: data.numeroLicenca,
        dataAbertura: data.dataAbertura ? new Date(data.dataAbertura) : undefined,
        dataProtocolo: data.dataProtocolo ? new Date(data.dataProtocolo) : undefined,
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
        responsavelId: data.responsavelId,
        observacoes: data.observacoes,
        metadados: data.metadados as never,
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'processo.atualizado',
      entidadeTipo: 'processo',
      entidadeId: id,
      dadosDepois: data,
      ipOrigem: ctx.ip,
    })

    return atualizado
  }

  async dispensarRequisito(
    ctx: ContextoUsuario,
    processoId: string,
    requisitoId: string,
    motivo: string,
  ) {
    if (!['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)) {
      throw new ForbiddenError('Apenas coordenadores podem dispensar requisitos')
    }

    const processo = await this.buscarPorId(ctx, processoId)
    const requisito = processo.requisitos.find((r) => r.id === requisitoId)
    if (!requisito) throw new NotFoundError('Requisito', requisitoId)

    const atualizado = await prisma.requisitoProcesso.update({
      where: { id: requisitoId },
      data: { status: 'DISPENSADO', motivoDispensa: motivo },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'processo.requisito_dispensado',
      entidadeTipo: 'requisito_processo',
      entidadeId: requisitoId,
      dadosDepois: { motivo },
      ipOrigem: ctx.ip,
      contexto: { processoId },
    })

    return atualizado
  }

  async avancarFase(
    ctx: ContextoUsuario,
    processoId: string,
    opts: { observacoes?: string; forcar?: boolean },
  ) {
    const processo = await this.buscarPorId(ctx, processoId)

    const fases = processo.tipoProcesso.fases
    const faseAtualIndex = fases.findIndex((f) => f.ordem === processo.faseAtualOrdem)
    const proximaFase = fases[faseAtualIndex + 1]

    if (!proximaFase) {
      throw new ProcessoFaseInvalidaError(processo.faseAtualOrdem, processo.faseAtualOrdem + 1)
    }

    // Verifica requisitos obrigatórios pendentes (a menos que forcar e for coordenador+)
    if (!opts.forcar) {
      const requisitosPendentes = processo.requisitos.filter(
        (r) =>
          r.faseTipoProcessoId === fases[faseAtualIndex]?.id &&
          r.obrigatorio &&
          r.status === 'PENDENTE',
      )
      if (requisitosPendentes.length > 0) {
        throw new ProcessoRequisitoPendenteError(requisitosPendentes.length)
      }
    } else if (!['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)) {
      throw new ForbiddenError('Apenas coordenadores podem forçar avanço de fase')
    }

    await prisma.$transaction(async (tx) => {
      // Fecha fase atual no histórico
      await tx.historicoFaseProcesso.updateMany({
        where: { processoId, faseTipoProcessoId: fases[faseAtualIndex]!.id, concluiuEm: null },
        data: { concluiuEm: new Date() },
      })

      // Atualiza processo
      await tx.processo.update({
        where: { id: processoId },
        data: { faseAtualOrdem: proximaFase.ordem },
      })

      // Abre nova fase no histórico
      await tx.historicoFaseProcesso.create({
        data: {
          processoId,
          faseTipoProcessoId: proximaFase.id,
          ordemFase: proximaFase.ordem,
          nomeFase: proximaFase.nome,
          avancadoPorId: ctx.id,
          observacoes: opts.observacoes,
        },
      })
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'processo.fase_avancada',
      entidadeTipo: 'processo',
      entidadeId: processoId,
      dadosAntes: { faseAtualOrdem: processo.faseAtualOrdem, nomeFase: fases[faseAtualIndex]?.nome },
      dadosDepois: { faseAtualOrdem: proximaFase.ordem, nomeFase: proximaFase.nome },
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: processo.empreendimentoId },
    })

    eventBus.emit('processo.fase_avancada', {
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      processoId,
      empreendimentoId: processo.empreendimentoId,
      ordemAnterior: processo.faseAtualOrdem,
      ordemNova: proximaFase.ordem,
      nomeFaseNova: proximaFase.nome,
      timestamp: new Date(),
    })

    return this.buscarPorId(ctx, processoId)
  }

  async alterarStatus(
    ctx: ContextoUsuario,
    processoId: string,
    novoStatus: StatusProcesso,
    observacoes?: string,
  ) {
    const processo = await this.buscarPorId(ctx, processoId)
    const statusAtual = processo.status as StatusProcesso

    const transicoesValidas = TRANSICOES_PROCESSO[statusAtual] ?? []
    if (!transicoesValidas.includes(novoStatus)) {
      throw new ProcessoStatusInvalidoError(statusAtual, novoStatus)
    }

    await prisma.processo.update({
      where: { id: processoId },
      data: { status: novoStatus },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'processo.status_alterado',
      entidadeTipo: 'processo',
      entidadeId: processoId,
      dadosAntes: { status: statusAtual },
      dadosDepois: { status: novoStatus, observacoes },
      ipOrigem: ctx.ip,
      contexto: { empreendimentoId: processo.empreendimentoId },
    })

    eventBus.emit('processo.status_alterado', {
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      processoId,
      empreendimentoId: processo.empreendimentoId,
      statusAnterior: statusAtual,
      statusNovo: novoStatus,
      observacoes,
      timestamp: new Date(),
    })

    return this.buscarPorId(ctx, processoId)
  }
}

export const processosService = new ProcessosService()
