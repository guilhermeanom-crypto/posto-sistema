import type { FastifyRequest } from 'fastify'
import { prisma } from '../../infra/database/prisma.js'

// ─────────────────────────────────────────────────────────────────────────────
// SERVIÇO DE AUDITORIA
// Registra eventos de domínio na tabela audit_log (imutável).
// ─────────────────────────────────────────────────────────────────────────────

interface AuditOptions {
  tenantId: string
  usuarioId?: string
  usuarioNome?: string
  usuarioEmail?: string
  usuarioPerfil?: string
  acao: string
  entidadeTipo: string
  entidadeId: string
  dadosAntes?: unknown
  dadosDepois?: unknown
  ipOrigem?: string
  userAgent?: string
  contexto?: Record<string, unknown>
}

export async function registrarAuditoria(opts: AuditOptions): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: opts.tenantId,
      usuarioId: opts.usuarioId,
      usuarioNome: opts.usuarioNome,
      usuarioEmail: opts.usuarioEmail,
      usuarioPerfil: opts.usuarioPerfil,
      acao: opts.acao,
      entidadeTipo: opts.entidadeTipo,
      entidadeId: opts.entidadeId,
      dadosAntes: opts.dadosAntes ? JSON.parse(JSON.stringify(opts.dadosAntes)) : undefined,
      dadosDepois: opts.dadosDepois ? JSON.parse(JSON.stringify(opts.dadosDepois)) : undefined,
      ipOrigem: opts.ipOrigem,
      userAgent: opts.userAgent,
      contexto: opts.contexto ? JSON.parse(JSON.stringify(opts.contexto)) : undefined,
    },
  })
}

/** Extrai IP do request considerando proxies reversos */
export function extrairIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for']
  if (forwarded) {
    return Array.isArray(forwarded) ? (forwarded[0] ?? '') : forwarded.split(',')[0]?.trim() ?? ''
  }
  return request.ip
}

/** Helper para criar contexto de auditoria a partir do request */
export function contextoDeRequest(request: FastifyRequest): Pick<AuditOptions, 'usuarioId' | 'usuarioNome' | 'usuarioEmail' | 'usuarioPerfil' | 'ipOrigem' | 'userAgent' | 'tenantId'> {
  const user = (request as FastifyRequest & { user?: { id: string; tenantId: string; perfil: string; nome: string; email: string } }).user

  return {
    tenantId: user?.tenantId ?? '',
    usuarioId: user?.id,
    usuarioNome: user?.nome,
    usuarioEmail: user?.email,
    usuarioPerfil: user?.perfil,
    ipOrigem: extrairIp(request),
    userAgent: request.headers['user-agent'],
  }
}
