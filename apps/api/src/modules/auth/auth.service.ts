import * as argon2 from 'argon2'
import crypto from 'node:crypto'
import { env } from '../../config/env.js'
import { prisma } from '../../infra/database/prisma.js'
import {
  UnauthorizedError,
  ForbiddenError,
} from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { assertEmpreendimentoPermitido, type ContextoAcessoEmpreendimento } from '../../shared/security/empreendimento-access.js'
import type { LoginInput, MagicLinkInput } from '@repo/schemas'
import { parseDurationMs, parseDurationSeconds } from './auth-duration.js'
import { gerarPortalToken, hashPortalToken } from './portal-token.js'

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TENTATIVAS_LOGIN = 5
const LOCKOUT_MINUTOS = 15

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  perfil: string
  tenantId: string
}

export class AuthService {
  /**
   * Realiza o login do usuário com email e senha.
   * Retorna um par de tokens (access + refresh).
   */
  async login(
    input: LoginInput,
    context: { ip: string; userAgent: string; jwtSign: (payload: object) => string },
  ): Promise<{ tokens: TokenPair; usuario: UsuarioLogado }> {
    const usuario = await prisma.usuario.findFirst({
      where: { email: input.email.toLowerCase(), ativo: true },
      include: {
        empreendimentosAcesso: { select: { empreendimentoId: true } },
      },
    })

    // Lockout ativo?
    if (usuario?.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
      const minutosRestantes = Math.ceil(
        (usuario.bloqueadoAte.getTime() - Date.now()) / 60000,
      )
      throw new ForbiddenError(
        `Conta bloqueada por ${minutosRestantes} minuto(s) devido a tentativas falhas de login`,
      )
    }

    // Verifica credenciais
    const senhaValida =
      usuario && (await argon2.verify(usuario.senhaHash, input.senha))

    if (!usuario || !senhaValida) {
      // Incrementar tentativas falhas
      if (usuario) {
        const novasTentativas = usuario.tentativasLoginFalhas + 1
        const bloqueadoAte =
          novasTentativas >= MAX_TENTATIVAS_LOGIN
            ? new Date(Date.now() + LOCKOUT_MINUTOS * 60 * 1000)
            : null

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            tentativasLoginFalhas: novasTentativas,
            bloqueadoAte,
          },
        })

        await registrarAuditoria({
          tenantId: usuario.tenantId,
          usuarioId: usuario.id,
          acao: 'usuario.login_falhou',
          entidadeTipo: 'usuario',
          entidadeId: usuario.id,
          ipOrigem: context.ip,
          userAgent: context.userAgent,
          dadosDepois: { tentativa: novasTentativas },
        })
      }

      throw new UnauthorizedError('E-mail ou senha incorretos')
    }

    // Credenciais válidas: zerar tentativas, atualizar último acesso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tentativasLoginFalhas: 0,
        bloqueadoAte: null,
        ultimoAcesso: new Date(),
      },
    })

    const empreendimentoIds =
      ['ANALISTA', 'ANALISTA_CAMPO', 'REPRESENTANTE_POSTO'].includes(usuario.perfil)
        ? usuario.empreendimentosAcesso.map((a: { empreendimentoId: string }) => a.empreendimentoId)
        : null

    const tokens = await this.gerarTokens(usuario, empreendimentoIds, context)

    await registrarAuditoria({
      tenantId: usuario.tenantId,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      acao: 'usuario.login',
      entidadeTipo: 'usuario',
      entidadeId: usuario.id,
      ipOrigem: context.ip,
      userAgent: context.userAgent,
    })

    return {
      tokens,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        tenantId: usuario.tenantId,
      },
    }
  }

  /**
   * Renova o par de tokens usando um refresh token válido.
   */
  async refresh(
    refreshToken: string,
    context: { ip: string; userAgent: string; jwtSign: (payload: object) => string },
  ): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken)

    const sessao = await prisma.sessaoRefresh.findUnique({
      where: { tokenHash },
      include: {
        usuario: {
          include: {
            empreendimentosAcesso: { select: { empreendimentoId: true } },
          },
        },
      },
    })

    if (!sessao || sessao.revogadoEm || sessao.expiresAt < new Date()) {
      // Possível roubo de token: se sessão existir e foi revogada, bloquear todas
      if (sessao && sessao.revogadoEm) {
        await prisma.sessaoRefresh.updateMany({
          where: { usuarioId: sessao.usuarioId, revogadoEm: null },
          data: { revogadoEm: new Date(), motivoRevogacao: 'suspeita_roubo' },
        })
      }
      throw new UnauthorizedError('Token de renovação inválido ou expirado')
    }

    if (!sessao.usuario.ativo) {
      throw new UnauthorizedError('Usuário inativo')
    }

    // Revogar token atual (rotation)
    await prisma.sessaoRefresh.update({
      where: { id: sessao.id },
      data: { revogadoEm: new Date(), motivoRevogacao: 'rotacao' },
    })

    const empreendimentoIds =
      ['ANALISTA', 'ANALISTA_CAMPO', 'REPRESENTANTE_POSTO'].includes(sessao.usuario.perfil)
        ? sessao.usuario.empreendimentosAcesso.map((a: { empreendimentoId: string }) => a.empreendimentoId)
        : null

    return this.gerarTokens(sessao.usuario, empreendimentoIds, context)
  }

  /**
   * Invalida a sessão do usuário (logout).
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken)
    await prisma.sessaoRefresh.updateMany({
      where: { tokenHash },
      data: { revogadoEm: new Date(), motivoRevogacao: 'logout' },
    })
  }

  /**
   * Gera magic link para acesso ao portal do cliente.
   */
  async gerarMagicLink(
    input: MagicLinkInput,
    solicitadoPorId: string,
    tenantId: string,
    baseUrl: string,
    solicitante?: ContextoAcessoEmpreendimento,
  ): Promise<string> {
    if (solicitante) {
      await assertEmpreendimentoPermitido(solicitante, input.empreendimentoId)
    }

    const token = gerarPortalToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    await prisma.tokenPortal.create({
      data: {
        tenantId,
        empreendimentoId: input.empreendimentoId,
        solicitadoPorId,
        emailDestinatario: input.email,
        nomeContato: input.nomeContato,
        token: hashPortalToken(token),
        expiresAt,
      },
    })

    return `${baseUrl}/portal/acesso?token=${token}`
  }

  /**
   * Valida um magic link e retorna um access token para o portal.
   */
  async validarMagicLink(
    token: string,
    context: { jwtSign: (payload: object) => string },
  ): Promise<{ accessToken: string; empreendimentoId: string }> {
    const registro = await prisma.tokenPortal.findUnique({
      where: { token: hashPortalToken(token) },
    })

    if (!registro || registro.usadoEm || registro.expiresAt < new Date()) {
      throw new UnauthorizedError('Link de acesso inválido ou expirado')
    }

    // Marcar como usado
    await prisma.tokenPortal.update({
      where: { id: registro.id },
      data: { usadoEm: new Date() },
    })

    const accessToken = context.jwtSign({
      sub: `portal:${registro.empreendimentoId}`,
      tenantId: registro.tenantId,
      perfil: 'REPRESENTANTE_POSTO',
      empreendimentoIds: [registro.empreendimentoId],
    })

    return { accessToken, empreendimentoId: registro.empreendimentoId }
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  private async gerarTokens(
    usuario: { id: string; tenantId: string; perfil: string },
    empreendimentoIds: string[] | null,
    context: { ip: string; userAgent: string; jwtSign: (payload: object) => string },
  ): Promise<TokenPair> {
    const accessToken = context.jwtSign({
      sub: usuario.id,
      tenantId: usuario.tenantId,
      perfil: usuario.perfil,
      empreendimentoIds,
    })

    // Refresh token: opaque UUID
    const refreshTokenRaw = crypto.randomUUID() + crypto.randomUUID()
    const tokenHash = this.hashToken(refreshTokenRaw)
    const expiresAt = new Date(Date.now() + parseDurationMs(env.REFRESH_TOKEN_EXPIRES_IN))

    await prisma.sessaoRefresh.create({
      data: {
        usuarioId: usuario.id,
        tokenHash,
        ip: context.ip,
        userAgent: context.userAgent,
        expiresAt,
      },
    })

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: parseDurationSeconds(env.JWT_EXPIRES_IN),
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}

export const authService = new AuthService()
