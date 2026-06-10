import { PrismaClient } from '@prisma/client'
import { env } from '../../config/env.js'

// ─────────────────────────────────────────────────────────────────────────────
// Singleton do PrismaClient com logging configurado por ambiente
// ─────────────────────────────────────────────────────────────────────────────

const logLevels =
  env.NODE_ENV === 'development'
    ? (['query', 'error', 'warn'] as const)
    : (['error', 'warn'] as const)

export const prisma = new PrismaClient({
  log: logLevels as never,
  errorFormat: env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
})

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
