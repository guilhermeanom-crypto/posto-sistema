import { Worker } from 'bullmq'
import { redis } from '../infra/redis.js'
import { verificarVencimentos, verificarTarefasAtrasadas } from '../schedulers/vencimentos.scheduler.js'
import { enfileirarRecalculoCompliance } from '../schedulers/compliance.scheduler.js'
import { monitorarDiarioOficial } from '../services/diario-oficial.service.js'
import { calcularScoresRisco } from '../services/risco.service.js'
import { gerarDigestSemanal } from '../services/digest.service.js'
import { detectarAnomaliasVMP } from '../services/anomalias-vmp.service.js'
import { verificarPrazosDefesa } from '../schedulers/fiscalizacoes.scheduler.js'
import { recalcularMotorOperacional } from '../schedulers/motor-operacional.scheduler.js'
import { logger } from "../lib/logger.js"

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULER PROCESSOR
// Processa os jobs agendados via BullMQ repeat jobs, substituindo setInterval.
// ─────────────────────────────────────────────────────────────────────────────

export function criarSchedulerWorker(concurrency = 1) {
  return new Worker(
    'scheduler',
    async (job) => {
      switch (job.name) {
        case 'verificar-vencimentos':
          await verificarVencimentos()
          break
        case 'verificar-tarefas-atrasadas':
          await verificarTarefasAtrasadas()
          break
        case 'recalcular-compliance':
          await enfileirarRecalculoCompliance()
          break
        case 'monitorar-diario-oficial':
          await monitorarDiarioOficial()
          break
        case 'calcular-scores-risco':
          await calcularScoresRisco()
          break
        case 'digest-semanal':
          await gerarDigestSemanal()
          break
        case 'detectar-anomalias-vmp':
          await detectarAnomaliasVMP()
          break
        case 'verificar-prazos-defesa':
          await verificarPrazosDefesa()
          break
        case 'recalcular-motor-operacional':
          await recalcularMotorOperacional()
          break
        default:
          logger.warn(`[scheduler] Job desconhecido: ${job.name}`)
      }
    },
    { connection: redis, concurrency },
  )
}
