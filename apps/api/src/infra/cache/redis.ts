import { Redis } from 'ioredis'
import { env } from '../../config/env.js'

// ─────────────────────────────────────────────────────────────────────────────
// Singleton do Redis com reconexão automática
// ─────────────────────────────────────────────────────────────────────────────

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,       // BullMQ exige null
  enableReadyCheck: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

redis.on('error', (err: Error) => {
  console.error('[Redis] Erro de conexão:', err.message)
})

redis.on('connect', () => {
  console.info('[Redis] Conectado.')
})

// ─────────────────────────────────────────────────────────────────────────────
// Prefixos de keyspace (evitar colisões entre contextos)
// ─────────────────────────────────────────────────────────────────────────────

export const REDIS_KEYS = {
  session: (tokenHash: string) => `session:${tokenHash}`,
  complianceCache: (tenantId: string, empreendimentoId: string) =>
    `cache:${tenantId}:compliance:${empreendimentoId}`,
  dashboardCache: (tenantId: string, key: string) => `cache:${tenantId}:dashboard:${key}`,
  magicLink: (token: string) => `magic_link:${token}`,
  loginAttempts: (email: string) => `login_attempts:${email}`,
} as const
