import { Worker } from 'bullmq'
import { prisma } from '../infra/prisma.js'
import { redis } from '../infra/redis.js'
import { logger } from "../lib/logger.js"

// ─────────────────────────────────────────────────────────────────────────────
// ALERTA PROCESSOR
// Cria alertas no banco e dispara enfileiramento de e-mail.
// ─────────────────────────────────────────────────────────────────────────────

interface AlertaJobData {
  tenantId: string
  empreendimentoId: string
  tipo: string
  nivel: string
  titulo: string
  mensagem: string
  entidadeTipo?: string
  entidadeId?: string
  destinatarioIds: string[]
  canais?: string[]
}

export function criarAlertaWorker(concurrency = 5) {
  return new Worker<AlertaJobData>(
    'alertas',
    async (job) => {
      const { tenantId, empreendimentoId, tipo, nivel, titulo, mensagem, entidadeTipo, entidadeId, destinatarioIds, canais = ['app'] } = job.data

      // Evita duplicação: alerta do mesmo tipo/entidade nas últimas 24h
      const existente = await prisma.alerta.findFirst({
        where: {
          tenantId,
          empreendimentoId,
          tipo: tipo as never,
          entidadeId,
          criadoEm: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      })

      if (existente) {
        logger.info(`[alerta] Duplicado ignorado: ${tipo} para ${entidadeId}`)
        return
      }

      const alerta = await prisma.alerta.create({
        data: {
          tenantId,
          empreendimentoId,
          tipo: tipo as never,
          nivel: nivel as never,
          titulo,
          mensagem,
          entidadeTipo,
          entidadeId,
        },
      })

      // Cria registros de destinatários
      if (destinatarioIds.length > 0) {
        await prisma.alertaDestinatario.createMany({
          data: destinatarioIds.map((usuarioId) => ({
            alertaId: alerta.id,
            usuarioId,
            canais,
          })),
          skipDuplicates: true,
        })
      }

      logger.info(`[alerta] Criado: ${nivel} — ${titulo}`)
    },
    { connection: redis, concurrency },
  )
}
