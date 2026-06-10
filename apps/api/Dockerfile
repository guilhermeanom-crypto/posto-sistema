FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Dependências ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @repo/api... --prod=false

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/api apps/api
COPY packages packages
# Gera o Prisma Client ANTES do tsc (o build importa @prisma/client e precisa dos tipos)
RUN pnpm --filter @repo/api exec prisma generate
RUN pnpm --filter @repo/api build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @repo/api... --prod
# prisma CLI global: usado para `prisma generate` aqui e por `prisma migrate deploy`
# no serviço `migrate` do compose (que reusa esta mesma imagem)
RUN npm i -g prisma@5.22.0

COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma
# Regenera o client no node_modules de produção (o layout pnpm do runner difere do builder)
RUN prisma generate --schema apps/api/prisma/schema.prisma

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
