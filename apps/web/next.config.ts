import type { NextConfig } from 'next'

if (process.env.NEXT_DIST_DIR && process.env.NEXT_DIST_DIR !== '.next') {
  console.warn(
    `[apps/web] Ignorando NEXT_DIST_DIR="${process.env.NEXT_DIST_DIR}" para evitar servir artefatos antigos.`
  )
}

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: '.next',
  transpilePackages: ['@repo/types', '@repo/schemas', '@repo/utils'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
}

export default nextConfig
