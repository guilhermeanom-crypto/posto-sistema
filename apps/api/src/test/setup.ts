process.env.NODE_ENV = 'test'
process.env.API_PORT ??= '3001'
process.env.API_HOST ??= '0.0.0.0'
process.env.API_URL ??= 'http://localhost:3001/api/v1'
process.env.WEB_URL ??= 'http://localhost:3000'
process.env.LOG_LEVEL ??= 'error'
process.env.TRUST_PROXY_HOPS ??= '1'

// Preenche defaults de teste antes da primeira importação de `env.ts`.
// Assim o runtime de teste não depende do `.env` local do app.
process.env.DATABASE_URL ??= 'postgresql://posto:posto_dev_secret@localhost:5432/posto_dev'
process.env.REDIS_URL ??= 'redis://localhost:6379'

process.env.JWT_SECRET ??= 'test-jwt-secret-with-at-least-thirty-two-chars'
process.env.JWT_EXPIRES_IN ??= '15m'
process.env.REFRESH_TOKEN_EXPIRES_IN ??= '7d'
process.env.INTEGRATION_SHARED_SECRET ??= 'test-integration-secret-with-at-least-24-chars'

process.env.STORAGE_PROVIDER ??= 'minio'
process.env.S3_ENDPOINT ??= 'http://localhost:9000'
process.env.S3_REGION ??= 'us-east-1'
process.env.S3_BUCKET ??= 'posto-documentos'
process.env.S3_ACCESS_KEY_ID ??= 'posto_minio'
process.env.S3_SECRET_ACCESS_KEY ??= 'posto_minio_secret'
process.env.PRESIGNED_URL_EXPIRES_SECONDS ??= '900'

process.env.RESEND_API_KEY ??= 're_test_placeholder'
process.env.EMAIL_FROM ??= 'noreply@posto.local'
process.env.EMAIL_FROM_NAME ??= 'Posto Test'
