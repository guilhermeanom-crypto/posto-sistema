import pino from 'pino'

// Logger estruturado (JSON) do worker. Substitui console.* para dar logs parseáveis
// em produção (nível, timestamp, contexto). Nível via LOG_LEVEL (default info).
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { app: 'worker' },
})
