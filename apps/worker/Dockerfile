FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @posto/worker... --prod=false

FROM deps AS builder
COPY apps/worker apps/worker
COPY packages packages
# O worker consome @prisma/client mas o schema vive em apps/api. Copia o schema e
# gera o client ANTES do tsc (o build importa @prisma/client e precisa dos tipos).
COPY apps/api/prisma apps/api/prisma
RUN npm i -g prisma@5.22.0
RUN prisma generate --schema apps/api/prisma/schema.prisma
RUN pnpm --filter @posto/worker build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @posto/worker... --prod
RUN npm i -g prisma@5.22.0

COPY --from=builder /app/apps/worker/dist apps/worker/dist
COPY apps/api/prisma apps/api/prisma
# Regenera o client no node_modules de produção do worker
RUN prisma generate --schema apps/api/prisma/schema.prisma

CMD ["node", "apps/worker/dist/worker.js"]
