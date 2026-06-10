import { Queue } from 'bullmq'
import { prisma } from '../infra/prisma.js'
import { redis } from '../infra/redis.js'

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE SCHEDULER
// Recalcula o compliance de todos os empreendimentos ativos periodicamente.
// ─────────────────────────────────────────────────────────────────────────────

const complianceQueue = new Queue('compliance', { connection: redis })

export async function enfileirarRecalculoCompliance(): Promise<void> {
  const empreendimentos = await prisma.empreendimento.findMany({
    where: { ativo: true },
    select: { id: true, tenantId: true },
  })

  for (const emp of empreendimentos) {
    await complianceQueue.add(
      'calcular-compliance',
      { tenantId: emp.tenantId, empreendimentoId: emp.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    )
  }

  console.log(`[scheduler] ${empreendimentos.length} empreendimentos enfileirados para recálculo de compliance`)
}
