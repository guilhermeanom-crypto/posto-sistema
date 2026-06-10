import { documentosRepository } from './documentos.repository.js'
import {
  NotFoundError,
  ForbiddenError,
  UploadNaoConfirmadoError,
} from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { storageService, StorageService } from '../../infra/storage/storage.service.js'
import { eventBus } from '../../shared/events/event-bus.js'
import { emailQueue } from '../../infra/queue/bullmq.js'
import { prisma } from '../../infra/database/prisma.js'
import type {
  CriarDocumentoInput,
  FiltrosDocumentoInput,
  SolicitarUploadUrlInput,
  ConfirmarUploadInput,
  ReprovarVersaoInput,
} from '@repo/schemas'

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTOS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

interface ContextoUsuario {
  id: string
  tenantId: string
  perfil: string
  nome: string
  email: string
  ip: string
}

export class DocumentosService {
  async listar(ctx: ContextoUsuario, filtros: FiltrosDocumentoInput) {
    return documentosRepository.findMany(ctx.tenantId, {
      page: filtros.page,
      limit: filtros.limit,
      empreendimentoId: filtros.empreendimentoId,
      tipoDocumentoId: filtros.tipoDocumentoId,
      status: filtros.status,
      vencendoEm: filtros.vencendoEm,
      busca: filtros.busca,
    })
  }

  async buscarPorId(ctx: ContextoUsuario, id: string) {
    const documento = await documentosRepository.findById(ctx.tenantId, id)
    if (!documento) throw new NotFoundError('Documento', id)
    return documento
  }

  async criar(ctx: ContextoUsuario, data: CriarDocumentoInput) {
    // Valida que o empreendimento alvo pertence ao tenant (evita vincular doc cross-tenant)
    const empreendimento = await prisma.empreendimento.findFirst({
      where: { id: data.empreendimentoId, tenantId: ctx.tenantId },
      select: { id: true },
    })
    if (!empreendimento) throw new NotFoundError('Empreendimento', data.empreendimentoId)

    const documento = await documentosRepository.create(ctx.tenantId, data)

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'documento.criado',
      entidadeTipo: 'documento',
      entidadeId: documento.id,
      dadosDepois: { nome: data.nome, tipoDocumentoId: data.tipoDocumentoId },
      ipOrigem: ctx.ip,
    })

    return documento
  }

  /**
   * Fase 1: gera URL presignada + cria versão AGUARDANDO_UPLOAD.
   * O schema `solicitarUploadUrlSchema` inclui: documentoId (URL param),
   * nomeArquivo, mimeType, tamanhoBytes, hashSha256.
   */
  async solicitarUrlUpload(ctx: ContextoUsuario, documentoId: string, data: SolicitarUploadUrlInput) {
    const documento = await this.buscarPorId(ctx, documentoId)

    const ext = data.nomeArquivo.split('.').pop() ?? 'bin'
    // Gera chave temporária — será confirmada na fase 2
    const chaveS3 = StorageService.gerarChaveTemporaria(ctx.tenantId, `${documentoId}.${ext}`)

    const versao = await documentosRepository.criarVersao({
      documentoId: documento.id,
      enviadoPorId: ctx.id,
      arquivoChaveS3: chaveS3,
      arquivoNome: data.nomeArquivo,
      arquivoMime: data.mimeType,
      arquivoBytes: data.tamanhoBytes,
      hashSha256: data.hashSha256,
    })

    const resultado = await storageService.gerarUrlUpload(chaveS3, data.mimeType)
    const expiresIn = Math.floor((resultado.expiraEm.getTime() - Date.now()) / 1000)

    return { versaoId: versao.id, uploadUrl: resultado.uploadUrl, chaveS3, expiresIn }
  }

  /**
   * Fase 2: confirma que o cliente concluiu o PUT.
   * Schema `confirmarUploadSchema` inclui: documentoId (URL), chaveS3, observacoesEnvio.
   */
  async confirmarUpload(ctx: ContextoUsuario, documentoId: string, data: ConfirmarUploadInput) {
    // Garante que o documento pertence ao tenant antes de confirmar o upload
    await this.buscarPorId(ctx, documentoId)

    const versao = await documentosRepository.findVersaoPorChaveS3(documentoId, data.chaveS3)
    if (!versao) throw new UploadNaoConfirmadoError()

    // Verifica se o arquivo existe no storage
    const { existe } = await storageService.verificarArquivo(data.chaveS3)
    if (!existe) throw new UploadNaoConfirmadoError()

    const atualizada = await documentosRepository.confirmarUpload(versao.id, data.observacoesEnvio)

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'documento.versao_enviada',
      entidadeTipo: 'documento_versao',
      entidadeId: versao.id,
      ipOrigem: ctx.ip,
      contexto: { documentoId },
    })

    return atualizada
  }

  async aprovarVersao(ctx: ContextoUsuario, documentoId: string, versaoId: string) {
    if (!['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN', 'ANALISTA'].includes(ctx.perfil)) {
      throw new ForbiddenError('Sem permissão para aprovar documentos')
    }

    const versao = await documentosRepository.findVersao(versaoId)
    if (!versao || versao.documentoId !== documentoId || versao.documento.tenantId !== ctx.tenantId) {
      throw new NotFoundError('Versão de documento', versaoId)
    }

    if (versao.status !== 'ENVIADA' && versao.status !== 'EM_VALIDACAO') {
      throw new ForbiddenError(`Versão com status '${versao.status}' não pode ser aprovada`)
    }

    const aprovada = await documentosRepository.aprovarVersao(versaoId, ctx.id)

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'documento.versao_aprovada',
      entidadeTipo: 'documento_versao',
      entidadeId: versaoId,
      ipOrigem: ctx.ip,
      contexto: { documentoId },
    })

    eventBus.emit('documento.versao_aprovada', {
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      documentoId,
      versaoId,
      empreendimentoId: versao.documento.empreendimentoId,
      timestamp: new Date(),
    })

    return aprovada
  }

  async reprovarVersao(
    ctx: ContextoUsuario,
    documentoId: string,
    versaoId: string,
    data: ReprovarVersaoInput,
  ) {
    if (!['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN', 'ANALISTA'].includes(ctx.perfil)) {
      throw new ForbiddenError('Sem permissão para reprovar documentos')
    }

    const versao = await documentosRepository.findVersao(versaoId)
    if (!versao || versao.documentoId !== documentoId || versao.documento.tenantId !== ctx.tenantId) {
      throw new NotFoundError('Versão de documento', versaoId)
    }

    await documentosRepository.reprovarVersao(versaoId, ctx.id, data.motivoRejeicao)

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'documento.versao_rejeitada',
      entidadeTipo: 'documento_versao',
      entidadeId: versaoId,
      dadosDepois: { motivoRejeicao: data.motivoRejeicao },
      ipOrigem: ctx.ip,
      contexto: { documentoId },
    })

    eventBus.emit('documento.versao_rejeitada', {
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      documentoId,
      versaoId,
      empreendimentoId: versao.documento.empreendimentoId,
      motivo: data.motivoRejeicao,
      timestamp: new Date(),
    })

    // Notificar representante do portal (se existir token ativo)
    try {
      const tokenPortal = await prisma.tokenPortal.findFirst({
        where: { empreendimentoId: versao.documento.empreendimentoId, usadoEm: { not: null } },
        orderBy: { criadoEm: 'desc' },
        select: { emailDestinatario: true, nomeContato: true },
      })
      if (tokenPortal?.emailDestinatario) {
        await emailQueue.add('documento-rejeitado', {
          tipo: 'documento_rejeitado',
          email: tokenPortal.emailDestinatario,
          nome: tokenPortal.nomeContato ?? 'Representante',
          documento: versao.documento.nome,
          motivo: data.motivoRejeicao,
        })
      }
    } catch {
      // Não bloqueia a reprovação se a notificação falhar
    }
  }

  async gerarUrlDownload(ctx: ContextoUsuario, documentoId: string, versaoId: string) {
    const versao = await documentosRepository.findVersao(versaoId)
    if (!versao || versao.documento.tenantId !== ctx.tenantId || versao.documentoId !== documentoId) {
      throw new NotFoundError('Versão de documento', versaoId)
    }

    const url = await storageService.gerarUrlDownload(versao.arquivoChaveS3)
    return { url, expiresIn: 3600 }
  }
}

export const documentosService = new DocumentosService()
