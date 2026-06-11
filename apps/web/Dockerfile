FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @posto/web...

FROM deps AS builder
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG WEB_ALLOWED_ORIGINS
ENV WEB_ALLOWED_ORIGINS=$WEB_ALLOWED_ORIGINS
COPY apps/web apps/web
COPY packages packages
# Filtro "..." constrói os pacotes-dependência (@repo/types/schemas/utils) antes do web,
# em ordem topológica — eles exportam ./dist, que o .dockerignore exclui (precisa compilar aqui)
RUN pnpm --filter "@posto/web..." build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public apps/web/public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "apps/web/server.js"]
