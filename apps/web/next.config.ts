import type { NextConfig } from 'next'

if (process.env.NEXT_DIST_DIR && process.env.NEXT_DIST_DIR !== '.next') {
  console.warn(
    `[apps/web] Ignorando NEXT_DIST_DIR="${process.env.NEXT_DIST_DIR}" para evitar servir artefatos antigos.`
  )
}

// Origens permitidas para Server Actions. Em produção, atrás do domínio real,
// é OBRIGATÓRIO incluir o(s) host(s) — senão login/uploads falham por mismatch de Origin.
// Defina WEB_ALLOWED_ORIGINS no build (host(s) separados por vírgula, ex.: app.seudominio.com.br).
const allowedOrigins = [
  'localhost:3000',
  ...(process.env.WEB_ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
]

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: '.next',
  transpilePackages: ['@repo/types', '@repo/schemas', '@repo/utils'],
  experimental: {
    serverActions: { allowedOrigins },
  },
}

export default nextConfig
