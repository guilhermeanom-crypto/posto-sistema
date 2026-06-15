import { prisma } from '../../infra/database/prisma.js'
import { NotFoundError } from '../errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// Garante que o empreendimento existe E pertence ao tenant antes de um create.
// Sem isto, um empreendimentoId inválido estoura a FK do Prisma e vira 500 cru
// em vez de um 404 limpo (e mascara isolamento entre tenants).
// ─────────────────────────────────────────────────────────────────────────────
export async function assertEmpreendimento(
  tenantId: string,
  empreendimentoId: string,
): Promise<void> {
  const emp = await prisma.empreendimento.findFirst({
    where: { id: empreendimentoId, tenantId },
    select: { id: true },
  })
  if (!emp) throw new NotFoundError('Empreendimento', empreendimentoId)
}
