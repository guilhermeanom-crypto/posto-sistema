import { buildApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './infra/database/prisma.js'
import { redis } from './infra/cache/redis.js'

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT DO SERVIDOR
// ─────────────────────────────────────────────────────────────────────────────

async function start() {
  const app = await buildApp()

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info(`Recebido sinal ${signal}. Encerrando graciosamente...`)
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST })
    app.log.info(`🚀 API rodando em ${env.API_URL}`)
  } catch (err) {
    app.log.error(err, 'Falha ao iniciar o servidor')
    process.exit(1)
  }
}

start()
