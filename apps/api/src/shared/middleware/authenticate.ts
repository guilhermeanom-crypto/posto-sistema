import type { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../errors/app-errors.js'
import { prisma } from '../../infra/database/prisma.js'

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE DE AUTENTICAÇÃO
// Verifica o JWT e injeta o contexto do usuário no request.
// ─────────────────────────────────────────────────────────────────────────────

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()

    const payload = request.user as unknown as {
      sub: string
      tenantId: string
      perfil: string
      empreendimentoIds: string[] | null
    }

    // Token de portal do cliente: `sub` = "portal:<empreendimentoId>", sem usuário no banco.
    // Popula o contexto direto do JWT (o vínculo com o tenant é revalidado nas rotas do portal).
    if (typeof payload.sub === 'string' && payload.sub.startsWith('portal:')) {
      request.user = {
        id: payload.sub,
        tenantId: payload.tenantId,
        perfil: payload.perfil,
        empreendimentoIds: payload.empreendimentoIds,
        nome: 'Representante do posto',
        email: '',
      }
      return
    }

    // Busca o usuário no banco para garantir que ainda está ativo
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, tenantId: true, perfil: true, nome: true, email: true, ativo: true, bloqueadoAte: true },
    })

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedError('Usuário inativo ou não encontrado')
    }

    if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
      throw new UnauthorizedError('Conta temporariamente bloqueada. Tente novamente mais tarde.')
    }

    request.user = {
      id: usuario.id,
      tenantId: usuario.tenantId,
      perfil: usuario.perfil,
      empreendimentoIds: payload.empreendimentoIds,
      nome: usuario.nome,
      email: usuario.email,
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    throw new UnauthorizedError('Token inválido ou expirado')
  }
}

/** Middleware que autentica opcionalmente — não bloqueia se não houver token */
export async function authenticateOptional(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    await authenticate(request, _reply)
  } catch {
    // Sem token: request.user permanece undefined
  }
}
