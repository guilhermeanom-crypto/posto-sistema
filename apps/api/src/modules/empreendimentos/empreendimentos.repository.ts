import { Prisma } from '@prisma/client'
import { prisma } from '../../infra/database/prisma.js'
import { montarFiltroEscopoEmpreendimento, type ContextoAcessoEmpreendimento } from '../../shared/security/empreendimento-access.js'
import type { CriarEmpreendimentoInput, FiltrosEmpreendimentoInput } from '@repo/schemas'

// ─────────────────────────────────────────────────────────────────────────────
// EMPREENDIMENTOS REPOSITORY
// Toda lógica de acesso ao banco para empreendimentos.
// Nenhuma regra de negócio aqui — apenas queries.
// ─────────────────────────────────────────────────────────────────────────────

export class EmpreendimentosRepository {
  async findMany(ctx: ContextoAcessoEmpreendimento, filtros: FiltrosEmpreendimentoInput) {
    const { page, limit, busca, estado, cidade, bandeira, ativo } = filtros

    const where: Prisma.EmpreendimentoWhereInput = {
      tenantId: ctx.tenantId,
      ...montarFiltroEscopoEmpreendimento(ctx, 'id'),
      ...(ativo !== undefined && { ativo }),
      ...(estado && { estado }),
      ...(cidade && { cidade: { contains: cidade, mode: 'insensitive' } }),
      ...(bandeira && { bandeira: { contains: bandeira, mode: 'insensitive' } }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { nomeFantasia: { contains: busca, mode: 'insensitive' } },
          { codigoInterno: { contains: busca, mode: 'insensitive' } },
          { cnpj: { contains: busca } },
        ],
      }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.empreendimento.count({ where }),
      prisma.empreendimento.findMany({
        where,
        include: {
          empresa: { select: { id: true, nome: true, cnpj: true } },
          snapshotsCompliance: {
            orderBy: { calculadoEm: 'desc' },
            take: 1,
            select: {
              indiceConformidade: true,
              statusCompliance: true,
              calculadoEm: true,
            },
          },
          _count: {
            select: {
              processos: { where: { status: { notIn: ['ARQUIVADO', 'CANCELADO'] } } },
              tarefas: { where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] } } },
            },
          },
        },
        orderBy: { nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return { items, total, page, limit }
  }

  async findById(tenantId: string, id: string) {
    return prisma.empreendimento.findFirst({
      where: { id, tenantId },
      include: {
        empresa: { select: { id: true, nome: true, razaoSocial: true, cnpj: true } },
        snapshotsCompliance: {
          orderBy: { calculadoEm: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            processos: true,
            documentos: true,
            tarefas: { where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } },
            condicionantes: { where: { status: 'PENDENTE' } },
          },
        },
      },
    })
  }

  async create(tenantId: string, data: CriarEmpreendimentoInput) {
    return prisma.empreendimento.create({
      data: {
        tenantId,
        empresaId: data.empresaId,
        nome: data.nome,
        nomeFantasia: data.nomeFantasia,
        cnpj: data.cnpj,
        codigoInterno: data.codigoInterno,
        bandeira: data.bandeira,
        tipo: data.tipo,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        latitude: data.latitude,
        longitude: data.longitude,
        responsavelTecnicoNome: data.responsavelTecnicoNome,
        responsavelTecnicoCrea: data.responsavelTecnicoCrea,
        responsavelTecnicoEmail: data.responsavelTecnicoEmail,
        contatoEmail: data.contatoEmail,
        contatoTelefone: data.contatoTelefone,
        atividades: data.atividades,
        dataInicioOperacao: data.dataInicioOperacao ? new Date(data.dataInicioOperacao) : undefined,
        // Caracterização (discriminadores do diagnóstico — Blueprint 101)
        cnaePrincipal: data.cnaePrincipal,
        cnaesSecundarios: data.cnaesSecundarios ?? [],
        porte: data.porte,
        situacaoEmpreendimento: data.situacaoEmpreendimento,
        codigoIBGE: data.codigoIBGE,
        areaM2: data.areaM2,
        possuiCaptacao: data.possuiCaptacao,
        tipoCaptacao: data.tipoCaptacao,
        possuiSAO: data.possuiSAO,
        classeAquifero: data.classeAquifero,
        profundidadeNivelAguaM: data.profundidadeNivelAguaM,
        tipoSolo: data.tipoSolo,
        distanciaPocoAbastecimentoM: data.distanciaPocoAbastecimentoM,
        distanciaCorpoHidricoM: data.distanciaCorpoHidricoM,
        emAPP: data.emAPP,
        captaParaConsumo: data.captaParaConsumo,
        classificacaoAreaContaminada: data.classificacaoAreaContaminada,
      },
    })
  }

  async update(_tenantId: string, id: string, data: Partial<CriarEmpreendimentoInput>) {
    return prisma.empreendimento.update({
      where: { id },
      data: {
        ...data,
        dataInicioOperacao: data.dataInicioOperacao
          ? new Date(data.dataInicioOperacao)
          : undefined,
      },
    })
  }

  async deactivate(_tenantId: string, id: string) {
    return prisma.empreendimento.update({
      where: { id },
      data: { ativo: false },
    })
  }

  /** Verifica se o usuário tem acesso ao empreendimento */
  async verificarAcesso(usuarioId: string, empreendimentoId: string, perfil: string): Promise<boolean> {
    if (['SUPER_ADMIN', 'ADMIN_TENANT', 'COORDENADOR', 'EXECUTIVO'].includes(perfil)) {
      return true
    }
    const acesso = await prisma.empreendimentoAcesso.findUnique({
      where: { usuarioId_empreendimentoId: { usuarioId, empreendimentoId } },
    })
    return !!acesso
  }
}

export const empreendimentosRepository = new EmpreendimentosRepository()
