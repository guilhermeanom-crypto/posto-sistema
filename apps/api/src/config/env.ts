import 'dotenv/config'
import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Validação de variáveis de ambiente na inicialização da aplicação.
// Se alguma variável obrigatória estiver faltando, a aplicação não sobe.
// ─────────────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Aplicação
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),

  // URLs
  API_URL: z.string().url(),
  WEB_URL: z.string().url(),

  // Banco de dados
  DATABASE_URL: z.string().min(1),

  // Redis
  REDIS_URL: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+(?:ms|s|m|h|d)?$/, 'JWT_EXPIRES_IN deve usar formato como 15m, 1h ou 900')
    .default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .regex(/^\d+(?:ms|s|m|h|d)?$/, 'REFRESH_TOKEN_EXPIRES_IN deve usar formato como 7d, 24h ou 604800')
    .default('7d'),

  // Integrações sistema-a-sistema
  INTEGRATION_SHARED_SECRET: z.string().min(24),

  // Storage
  STORAGE_PROVIDER: z.enum(['s3', 'minio']).default('minio'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  PRESIGNED_URL_EXPIRES_SECONDS: z.coerce.number().int().default(900),

  // Email
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  EMAIL_FROM_NAME: z.string().default('RegPosto'),
  // WhatsApp via Z-API (opcional)
  ZAPI_INSTANCE_ID: z.string().optional(),
  ZAPI_TOKEN: z.string().optional(),
  ZAPI_CLIENT_TOKEN: z.string().optional(),
})

function loadEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Variáveis de ambiente inválidas:')
    const errors = result.error.flatten().fieldErrors
    for (const [field, messages] of Object.entries(errors)) {
      console.error(`  ${field}: ${messages?.join(', ')}`)
    }
    process.exit(1)
  }

  return result.data
}

export const env = loadEnv()
export type Env = typeof env
