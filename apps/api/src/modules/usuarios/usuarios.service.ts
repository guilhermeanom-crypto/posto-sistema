import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import argon2 from 'argon2'
import type { CriarUsuarioInput, AtualizarUsuarioInput, AlterarSenhaInput } from '@repo/schemas'

// ─────────────────────────────────────────────────────────────────────────────
// USUARIOS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

interface ContextoUsuario {
  id: string
  tenantId: string
  perfil: string
  nome: string
  email: string
  ip: string
  empreendimentoIds?: string[] | null
}

const PERFIS_COM_ACESSO_POR_EMPREENDIMENTO = new Set(['ANALISTA', 'ANALISTA_CAMPO', 'REPRESENTANTE_POSTO'])

export class UsuariosService {
  async listar(ctx: ContextoUsuario, filtros: { page: number; limit: number; busca?: string; perfil?: string; ativo?: boolean }) {
    const where = {
      tenantId: ctx.tenantId,
      ...(filtros.perfil && { perfil: filtros.perfil as never }),
      ...(filtros.ativo !== undefined && { ativo: filtros.ativo }),
      ...(filtros.busca && {
        OR: [
          { nome: { contains: filtros.busca, mode: 'insensitive' as const } },
          { email: { contains: filtros.busca, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [total, items] = await prisma.$transaction([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true,
          bloqueadoAte: true,
          criadoEm: true,
          ultimoAcesso: true,
        },
        orderBy: { nome: 'asc' },
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
      }),
    ])

    return { items, total, page: filtros.page, limit: filtros.limit }
  }

  async buscarPorId(ctx: ContextoUsuario, id: string) {
    const usuario = await prisma.usuario.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
        ultimoAcesso: true,
        _count: { select: { tarefasResponsavel: true, empreendimentosAcesso: true } },
      },
    })

    if (!usuario) throw new NotFoundError('Usuário', id)
    return usuario
  }

  async criar(ctx: ContextoUsuario, data: CriarUsuarioInput) {
    if (!['ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)) {
      throw new ForbiddenError('Apenas administradores podem criar usuários')
    }
    // SUPER_ADMIN administra TODOS os tenants — só um SUPER_ADMIN pode atribuí-lo
    if (data.perfil === 'SUPER_ADMIN' && ctx.perfil !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Apenas SUPER_ADMIN pode atribuir o perfil SUPER_ADMIN')
    }

    const existente = await prisma.usuario.findFirst({ where: { email: data.email } })
    if (existente) throw new ConflictError(`E-mail '${data.email}' já está em uso`)

    const senhaHash = await argon2.hash(data.senha, { type: argon2.argon2id })

    const empreendimentoIds = await this.validarEmpreendimentosDoTenant(ctx.tenantId, data.empreendimentoIds)

    const usuario = await prisma.$transaction(async (tx) => {
      const criado = await tx.usuario.create({
        data: {
          tenantId: ctx.tenantId,
          nome: data.nome,
          email: data.email,
          senhaHash,
          perfil: data.perfil,
        },
        select: { id: true, nome: true, email: true, perfil: true, criadoEm: true },
      })

      if (empreendimentoIds.length > 0 && PERFIS_COM_ACESSO_POR_EMPREENDIMENTO.has(data.perfil)) {
        await tx.empreendimentoAcesso.createMany({
          data: empreendimentoIds.map((empreendimentoId) => ({
            usuarioId: criado.id,
            empreendimentoId,
            criadoPorId: ctx.id,
          })),
          skipDuplicates: true,
        })
      }

      return criado
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'usuario.criado',
      entidadeTipo: 'usuario',
      entidadeId: usuario.id,
      dadosDepois: { nome: data.nome, email: data.email, perfil: data.perfil, empreendimentoIds },
      ipOrigem: ctx.ip,
    })

    return usuario
  }

  async atualizar(ctx: ContextoUsuario, id: string, data: AtualizarUsuarioInput) {
    await this.buscarPorId(ctx, id)

    // Usuários só podem editar a si mesmos; admin pode editar qualquer um do tenant
    if (id !== ctx.id && !['ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)) {
      throw new ForbiddenError('Sem permissão para editar este usuário')
    }

    const atualizado = await prisma.usuario.update({
      where: { id },
      data: { nome: data.nome },
      select: { id: true, nome: true, email: true, perfil: true },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'usuario.atualizado',
      entidadeTipo: 'usuario',
      entidadeId: id,
      dadosDepois: data,
      ipOrigem: ctx.ip,
    })

    return atualizado
  }

  async alterarPerfil(ctx: ContextoUsuario, id: string, perfil: string, empreendimentoIdsInput?: string[]) {
    if (!['ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)) {
      throw new ForbiddenError('Apenas administradores podem alterar perfis')
    }
    // Só um SUPER_ADMIN pode promover alguém a SUPER_ADMIN (admin de todos os tenants)
    if (perfil === 'SUPER_ADMIN' && ctx.perfil !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Apenas SUPER_ADMIN pode atribuir o perfil SUPER_ADMIN')
    }
    await this.buscarPorId(ctx, id)

    const empreendimentoIds = await this.validarEmpreendimentosDoTenant(ctx.tenantId, empreendimentoIdsInput)

    const atualizado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data: { perfil: perfil as never },
        select: { id: true, nome: true, email: true, perfil: true },
      })

      if (empreendimentoIdsInput !== undefined) {
        await tx.empreendimentoAcesso.deleteMany({ where: { usuarioId: id } })

        if (empreendimentoIds.length > 0 && PERFIS_COM_ACESSO_POR_EMPREENDIMENTO.has(perfil)) {
          await tx.empreendimentoAcesso.createMany({
            data: empreendimentoIds.map((empreendimentoId) => ({
              usuarioId: id,
              empreendimentoId,
              criadoPorId: ctx.id,
            })),
            skipDuplicates: true,
          })
        }
      }

      return usuario
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'usuario.perfil_alterado',
      entidadeTipo: 'usuario',
      entidadeId: id,
      dadosDepois: { perfil, ...(empreendimentoIdsInput !== undefined && { empreendimentoIds }) },
      ipOrigem: ctx.ip,
    })

    return atualizado
  }

  async alterarSenha(ctx: ContextoUsuario, id: string, data: AlterarSenhaInput) {
    if (id !== ctx.id) throw new ForbiddenError('Só é possível alterar a própria senha')

    const usuario = await prisma.usuario.findUnique({ where: { id } })
    if (!usuario) throw new NotFoundError('Usuário', id)

    const senhaCorreta = await argon2.verify(usuario.senhaHash, data.senhaAtual)
    if (!senhaCorreta) throw new ForbiddenError('Senha atual incorreta')

    const novaSenhaHash = await argon2.hash(data.novaSenha, { type: argon2.argon2id })
    await prisma.usuario.update({ where: { id }, data: { senhaHash: novaSenhaHash } })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'usuario.senha_alterada',
      entidadeTipo: 'usuario',
      entidadeId: id,
      ipOrigem: ctx.ip,
    })
  }

  async desativar(ctx: ContextoUsuario, id: string) {
    if (!['ADMIN_TENANT', 'SUPER_ADMIN'].includes(ctx.perfil)) {
      throw new ForbiddenError('Apenas administradores podem desativar usuários')
    }
    if (id === ctx.id) throw new ForbiddenError('Não é possível desativar a própria conta')

    await this.buscarPorId(ctx, id)
    await prisma.usuario.update({ where: { id }, data: { ativo: false } })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'usuario.desativado',
      entidadeTipo: 'usuario',
      entidadeId: id,
      ipOrigem: ctx.ip,
    })
  }

  private async validarEmpreendimentosDoTenant(tenantId: string, ids?: string[]): Promise<string[]> {
    const empreendimentoIds = [...new Set(ids ?? [])]
    if (empreendimentoIds.length === 0) return []

    const encontrados = await prisma.empreendimento.findMany({
      where: { tenantId, id: { in: empreendimentoIds } },
      select: { id: true },
    })

    if (encontrados.length !== empreendimentoIds.length) {
      throw new ValidationError('Um ou mais empreendimentos não pertencem ao tenant informado', {
        empreendimentoIds: ['Informe apenas empreendimentos do tenant atual'],
      })
    }

    return empreendimentoIds
  }
}

export const usuariosService = new UsuariosService()
