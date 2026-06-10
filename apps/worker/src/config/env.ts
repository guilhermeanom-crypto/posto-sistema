import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  STORAGE_PROVIDER: z.enum(['s3', 'minio']).default('minio'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string().email().default('noreply@posto.app'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).default(5),
  ANTHROPIC_API_KEY: z.string().min(1),
  // WhatsApp via Z-API (opcional — agente desativado se ausente)
  ZAPI_INSTANCE_ID: z.string().optional(),
  ZAPI_TOKEN: z.string().optional(),
  ZAPI_CLIENT_TOKEN: z.string().optional(), // verificação do webhook
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas no worker:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
