import { prisma } from '../../infra/database/prisma.js'
import { montarFiltroEscopoEmpreendimento, type ContextoAcessoEmpreendimento } from '../../shared/security/empreendimento-access.js'
import type { CriarDocumentoInput } from '@repo/schemas'

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTOS REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export class DocumentosRepository {
  async findMany(ctx: ContextoAcessoEmpreendimento, filtros: {
    page: number
    limit: number
    empreendimentoId?: string
    tipoDocumentoId?: string
    status?: string
    vencendoEm?: number
    busca?: string
  }) {
    const dataLimite = filtros.vencendoEm
      ? new Date(Date.now() + filtros.vencendoEm * 24 * 60 * 60 * 1000)
      : undefined

    const where = {
      tenantId: ctx.tenantId,
      ...montarFiltroEscopoEmpreendimento(ctx, 'empreendimentoId', filtros.empreendimentoId),
      ...(filtros.tipoDocumentoId && { tipoDocumentoId: filtros.tipoDocumentoId }),
      ...(filtros.status && { status: filtros.status as never }),
      ...(dataLimite && { dataValidade: { lte: dataLimite } }),
      ...(filtros.busca && {
        OR: [
          { nome: { contains: filtros.busca, mode: 'insensitive' as const } },
          { tipoDocumento: { nome: { contains: filtros.busca, mode: 'insensitive' as const } } },
        ],
      }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.documento.count({ where }),
      prisma.documento.findMany({
        where,
        include: {
          tipoDocumento: { select: { id: true, nome: true, categoria: true } },
          empreendimento: { select: { id: true, nome: true, cidade: true, estado: true } },
          versaoAtual: {
            select: {
              id: true,
              status: true,
              arquivoBytes: true,
              arquivoMime: true,
              criadoEm: true,
              enviadoPor: { select: { id: true, nome: true } },
            },
          },
        },
        orderBy: [{ dataValidade: 'asc' }, { criadoEm: 'desc' }],
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async findById(tenantId: string, id: string) {
    return prisma.documento.findFirst({
      where: { id, tenantId },
      include: {
        tipoDocumento: true,
        empreendimento: { select: { id: true, nome: true } },
        versaoAtual: true,
        versoes: {
          orderBy: { criadoEm: 'desc' },
          include: {
            enviadoPor: { select: { id: true, nome: true } },
            validadoPor: { select: { id: true, nome: true } },
          },
        },
      },
    })
  }

  async create(tenantId: string, data: CriarDocumentoInput) {
    return prisma.documento.create({
      data: {
        tenantId,
        empreendimentoId: data.empreendimentoId,
        tipoDocumentoId: data.tipoDocumentoId,
        processoId: data.processoId,
        condicionanteId: data.condicionanteId,
        nome: data.nome,
        descricao: data.descricao,
        dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : undefined,
        dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
        orgaoEmissor: data.orgaoEmissor,
        alertaDiasAntes: data.alertaDiasAntes ?? [],
        status: 'PENDENTE',
      },
    })
  }

  async criarVersao(params: {
    documentoId: string
    enviadoPorId: string
    arquivoChaveS3: string
    arquivoNome: string
    arquivoMime: string
    arquivoBytes: number
    hashSha256: string
  }) {
    // Determina o próximo número de versão
    const ultimaVersao = await prisma.documentoVersao.findFirst({
      where: { documentoId: params.documentoId },
      orderBy: { numeroVersao: 'desc' },
      select: { numeroVersao: true },
    })
    const numeroVersao = (ultimaVersao?.numeroVersao ?? 0) + 1

    return prisma.documentoVersao.create({
      data: {
        documentoId: params.documentoId,
        numeroVersao,
        arquivoChaveS3: params.arquivoChaveS3,
        arquivoNome: params.arquivoNome,
        arquivoMime: params.arquivoMime,
        arquivoBytes: params.arquivoBytes,
        hashSha256: params.hashSha256,
        enviadoPorId: params.enviadoPorId,
        status: 'AGUARDANDO_UPLOAD',
      },
    })
  }

  async confirmarUpload(versaoId: string, observacoesEnvio?: string) {
    return prisma.documentoVersao.update({
      where: { id: versaoId },
      data: {
        status: 'ENVIADA',
        observacoesEnvio,
      },
    })
  }

  async aprovarVersao(versaoId: string, validadoPorId: string) {
    const versao = await prisma.documentoVersao.findUniqueOrThrow({ where: { id: versaoId } })

    return prisma.$transaction(async (tx) => {
      // Marca versão anterior como substituída
      await tx.documentoVersao.updateMany({
        where: {
          documentoId: versao.documentoId,
          id: { not: versaoId },
          status: 'ATIVA',
        },
        data: { status: 'SUBSTITUIDA' },
      })

      // Ativa a nova versão
      const versaoAtiva = await tx.documentoVersao.update({
        where: { id: versaoId },
        data: {
          status: 'ATIVA',
          validadoPorId,
          validadoEm: new Date(),
        },
      })

      // Atualiza o documento
      await tx.documento.update({
        where: { id: versao.documentoId },
        data: {
          versaoAtualId: versaoId,
          status: 'APROVADO',
          totalVersoes: { increment: 1 },
        },
      })

      return versaoAtiva
    })
  }

  async reprovarVersao(versaoId: string, validadoPorId: string, motivoRejeicao: string) {
    const versao = await prisma.documentoVersao.findUniqueOrThrow({ where: { id: versaoId } })

    await prisma.documentoVersao.update({
      where: { id: versaoId },
      data: {
        status: 'REJEITADA',
        validadoPorId,
        validadoEm: new Date(),
        motivoRejeicao,
      },
    })

    // Volta o documento para REJEITADO se não tiver versão ativa anterior
    const versaoAtiva = await prisma.documentoVersao.findFirst({
      where: { documentoId: versao.documentoId, status: 'ATIVA' },
    })

    if (!versaoAtiva) {
      await prisma.documento.update({
        where: { id: versao.documentoId },
        data: { status: 'REJEITADO' },
      })
    }

    return versao
  }

  async findVersao(versaoId: string) {
    return prisma.documentoVersao.findUnique({
      where: { id: versaoId },
      include: { documento: true },
    })
  }

  async findVersaoPorChaveS3(documentoId: string, chaveS3: string) {
    return prisma.documentoVersao.findFirst({
      where: { documentoId, arquivoChaveS3: chaveS3, status: 'AGUARDANDO_UPLOAD' },
    })
  }
}

export const documentosRepository = new DocumentosRepository()
