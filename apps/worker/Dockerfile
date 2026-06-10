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
RUN pnpm --filter @posto/worker build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @posto/worker... --prod

COPY --from=builder /app/apps/worker/dist apps/worker/dist
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma

CMD ["node", "apps/worker/dist/worker.js"]
