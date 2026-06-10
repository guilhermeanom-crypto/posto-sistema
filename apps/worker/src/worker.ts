import './config/env.js' // valida env antes de tudo
import { env } from './config/env.js'
import http from 'node:http'
import { Queue } from 'bullmq'
import { criarEmailWorker } from './processors/email.processor.js'
import { criarComplianceWorker } from './processors/compliance.processor.js'
import { criarAlertaWorker } from './processors/alerta.processor.js'
import { criarSchedulerWorker } from './processors/scheduler.processor.js'
import { criarAIWorker } from './processors/ai.processor.js'
import { criarRelatorioWorker } from './processors/relatorio.processor.js'
import { criarEntregavelWorker } from './processors/entregavel.processor.js'
import { criarWhatsAppWorker } from './processors/whatsapp.processor.js'
import { zapiDisponivel } from './services/zapi.service.js'
import { redis } from './infra/redis.js'
import { prisma } from './infra/prisma.js'

// ─────────────────────────────────────────────────────────────────────────────
// WORKER ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

// Filas de agendamento (apenas para registrar schedulers — processamento feito pelos workers acima)
const schedulerQueue = new Queue('scheduler', { connection: redis })

async function registrarSchedulers() {
  // Verifica vencimentos diariamente às 07:00
  await schedulerQueue.upsertJobScheduler(
    'verificar-vencimentos-diario',
    { pattern: '0 7 * * *' },
    { name: 'verificar-vencimentos', data: {}, opts: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } } },
  )

  // Verifica tarefas atrasadas a cada hora
  await schedulerQueue.upsertJobScheduler(
    'verificar-tarefas-atrasadas-horario',
    { pattern: '0 * * * *' },
    { name: 'verificar-tarefas-atrasadas', data: {}, opts: { attempts: 2 } },
  )

  // Recalcula compliance a cada 6 horas
  await schedulerQueue.upsertJobScheduler(
    'recalcular-compliance-6h',
    { pattern: '0 */6 * * *' },
    { name: 'recalcular-compliance', data: {}, opts: { attempts: 3, backoff: { type: 'exponential', delay: 10000 } } },
  )

  // Monitora Diário Oficial diariamente às 07:30
  await schedulerQueue.upsertJobScheduler(
    'monitorar-diario-oficial-diario',
    { pattern: '30 7 * * 1-5' }, // seg–sex
    { name: 'monitorar-diario-oficial', data: {}, opts: { attempts: 2, backoff: { type: 'exponential', delay: 30000 } } },
  )

  // Recalcula scores de risco diariamente à meia-noite
  await schedulerQueue.upsertJobScheduler(
    'calcular-scores-risco-diario',
    { pattern: '0 0 * * *' },
    { name: 'calcular-scores-risco', data: {}, opts: { attempts: 3, backoff: { type: 'exponential', delay: 15000 } } },
  )

  // Digest semanal toda segunda-feira às 08:00
  await schedulerQueue.upsertJobScheduler(
    'digest-semanal-segunda',
    { pattern: '0 8 * * 1' },
    { name: 'digest-semanal', data: {}, opts: { attempts: 2, backoff: { type: 'exponential', delay: 30000 } } },
  )

  // Detecção de anomalias VMP: diariamente às 06:00
  await schedulerQueue.upsertJobScheduler(
    'detectar-anomalias-vmp-diario',
    { pattern: '0 6 * * *' },
    { name: 'detectar-anomalias-vmp', data: {}, opts: { attempts: 3, backoff: { type: 'exponential', delay: 10000 } } },
  )

  // Verifica prazos de defesa e recurso de autos de infração diariamente às 07:15
  await schedulerQueue.upsertJobScheduler(
    'verificar-prazos-defesa-diario',
    { pattern: '15 7 * * *' },
    { name: 'verificar-prazos-defesa', data: {}, opts: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } } },
  )

  // Motor operacional: recalcula scores + roteia + escala — diariamente às 06:30
  await schedulerQueue.upsertJobScheduler(
    'motor-operacional-diario',
    { pattern: '30 6 * * *' },
    { name: 'recalcular-motor-operacional', data: {}, opts: { attempts: 3, backoff: { type: 'exponential', delay: 10000 } } },
  )

  console.log('⏰ Schedulers registrados via BullMQ (verificar-vencimentos, tarefas, compliance, diario-oficial, scores-risco, digest-semanal, anomalias-vmp, prazos-defesa, motor-operacional)')
}

async function main() {
  console.log('🚀 Worker iniciando...')

  // Inicializa processors
  const emailWorker = criarEmailWorker(env.WORKER_CONCURRENCY)
  const complianceWorker = criarComplianceWorker(3)
  const alertaWorker = criarAlertaWorker(5)
  const schedulerWorker = criarSchedulerWorker(1)
  const aiWorker = criarAIWorker(2)
  const relatorioWorker = criarRelatorioWorker(2)
  const entregavelWorker = criarEntregavelWorker(2)
  const whatsappWorker = zapiDisponivel() ? criarWhatsAppWorker(3) : null
  if (whatsappWorker) console.log('📱 WhatsApp worker ativo (Z-API configurado)')

  console.log('✅ Processors registrados: email, compliance, alertas, scheduler, ia, relatorio, entregavel', whatsappWorker ? ', whatsapp' : '')

  // Registra repeat jobs no BullMQ (idempotente — upsert)
  await registrarSchedulers()

  // Health endpoint (para healthcheck do Docker/orquestrador detectar worker travado)
  const healthPort = Number(process.env.WORKER_HEALTH_PORT ?? 9090)
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', uptime: Math.round(process.uptime()) }))
    } else {
      res.writeHead(404)
      res.end()
    }
  })
  healthServer.listen(healthPort, () => console.log(`[worker] Health endpoint em :${healthPort}/health`))

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Encerrando worker...`)
    healthServer.close()
    await Promise.all([
      emailWorker.close(),
      complianceWorker.close(),
      alertaWorker.close(),
      schedulerWorker.close(),
      aiWorker.close(),
      relatorioWorker.close(),
      entregavelWorker.close(),
      ...(whatsappWorker ? [whatsappWorker.close()] : []),
    ])
    await schedulerQueue.close()
    await redis.quit()
    await prisma.$disconnect()
    console.log('Worker encerrado.')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // Monitora erros dos workers
  const allWorkers = [emailWorker, complianceWorker, alertaWorker, schedulerWorker, aiWorker, relatorioWorker, entregavelWorker]
  const allNames = ['email', 'compliance', 'alertas', 'scheduler', 'ia', 'relatorio', 'entregavel']
  if (whatsappWorker) { allWorkers.push(whatsappWorker); allNames.push('whatsapp') }

  for (let i = 0; i < allWorkers.length; i++) {
    const nome = allNames[i]
    const worker = allWorkers[i]!
    worker.on('failed', (job, err) => {
      console.error(`[${nome}] Job ${job?.id} falhou:`, (err as Error).message)
    })
    worker.on('error', (err) => {
      console.error(`[${nome}] Worker error:`, (err as Error).message)
    })
  }
}

main().catch((err) => {
  console.error('Falha fatal no worker:', err)
  process.exit(1)
})
