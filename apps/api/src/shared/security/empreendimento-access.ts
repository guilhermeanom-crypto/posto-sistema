import { prisma } from '../../infra/database/prisma.js'
import { ForbiddenError, NotFoundError } from '../errors/app-errors.js'

export interface ContextoAcessoEmpreendimento {
  id: string
  tenantId: string
  perfil: string
  empreendimentoIds?: string[] | null
}

const PERFIS_ACESSO_TOTAL = new Set(['SUPER_ADMIN', 'ADMIN_TENANT', 'COORDENADOR', 'EXECUTIVO'])

export function temAcessoTotalEmpreendimentos(perfil: string): boolean {
  return PERFIS_ACESSO_TOTAL.has(perfil)
}

export function assertAcessoEmpreendimento(
  ctx: ContextoAcessoEmpreendimento,
  empreendimentoId: string,
): void {
  if (temAcessoTotalEmpreendimentos(ctx.perfil)) return

  const permitidos = ctx.empreendimentoIds ?? []
  if (!permitidos.includes(empreendimentoId)) {
    throw new ForbiddenError('Sem acesso a este empreendimento')
  }
}

export function montarFiltroEscopoEmpreendimento(
  ctx: ContextoAcessoEmpreendimento,
  campo: 'id' | 'empreendimentoId' = 'empreendimentoId',
  empreendimentoId?: string,
): Record<string, string | { in: string[] }> {
  if (empreendimentoId) {
    assertAcessoEmpreendimento(ctx, empreendimentoId)
    return { [campo]: empreendimentoId }
  }

  if (temAcessoTotalEmpreendimentos(ctx.perfil)) return {}
  return { [campo]: { in: ctx.empreendimentoIds ?? [] } }
}

export async function assertEmpreendimentoPermitido(
  ctx: ContextoAcessoEmpreendimento,
  empreendimentoId: string,
): Promise<void> {
  const empreendimento = await prisma.empreendimento.findFirst({
    where: { id: empreendimentoId, tenantId: ctx.tenantId },
    select: { id: true },
  })

  if (!empreendimento) throw new NotFoundError('Empreendimento', empreendimentoId)
  assertAcessoEmpreendimento(ctx, empreendimentoId)
}
