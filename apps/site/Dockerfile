FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/site/package.json apps/site/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @posto/site...

FROM deps AS builder
COPY apps/site apps/site
RUN pnpm --filter @posto/site build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# O server.js standalone do Next lê PORT (o script `start -p 3100` não se aplica aqui)
ENV PORT=3100

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/site/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/site/.next/static apps/site/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/site/public apps/site/public

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3100 || exit 1

CMD ["node", "apps/site/server.js"]
