FROM node:20-alpine AS base
# openssl: necessário para o engine do Prisma detectar/rodar no Alpine (musl)
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Dependências ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @repo/api... --prod=false

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/api apps/api
COPY packages packages
# Gera o Prisma Client ANTES do tsc (o build importa @prisma/client e precisa dos tipos)
RUN pnpm --filter @repo/api exec prisma generate
# Filtro "..." constrói os pacotes-dependência (@repo/schemas/types/utils) antes do api,
# em ordem topológica — fora do Docker quem faz isso é o turbo
RUN pnpm --filter "@repo/api..." build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Copia os artefatos já construídos do builder (node_modules com Prisma Client gerado +
# pacotes-workspace com dist + symlinks pnpm intactos). Evita rebuild/regenerate no runner.
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages packages
COPY --from=builder /app/apps/api/package.json apps/api/package.json
# node_modules do pacote api (symlinks pnpm p/ @prisma/client, @repo/*, fastify...) —
# no pnpm as deps ficam no node_modules de cada pacote, não só na raiz
COPY --from=builder /app/apps/api/node_modules apps/api/node_modules
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma
# prisma CLI global: usado pelo serviço `migrate` do compose (que reusa esta imagem)
RUN npm i -g prisma@5.22.0

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
