FROM node:20-alpine AS base
# openssl: necessário para o engine do Prisma detectar/rodar no Alpine (musl)
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @posto/worker... --prod=false

FROM deps AS builder
COPY apps/worker apps/worker
COPY packages packages
# O worker consome @prisma/client mas o schema vive em apps/api. Copia o schema para
# DENTRO do pacote worker: o Prisma infere o project root subindo a partir do schema e
# precisa achar um package.json que declare prisma/@prisma/client — senão tenta
# auto-instalar (pnpm add) e quebra o build.
COPY apps/api/prisma apps/worker/prisma
RUN pnpm --filter @posto/worker exec prisma generate --schema prisma/schema.prisma
# Filtro "..." constrói os pacotes-dependência antes do worker (ordem topológica)
RUN pnpm --filter "@posto/worker..." build

FROM base AS runner
ENV NODE_ENV=production

# Copia os artefatos construídos do builder (node_modules com Prisma Client + pacotes com dist)
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages packages
COPY --from=builder /app/apps/worker/package.json apps/worker/package.json
# node_modules do pacote worker (symlinks pnpm p/ @prisma/client, @repo/*, bullmq...)
COPY --from=builder /app/apps/worker/node_modules apps/worker/node_modules
COPY --from=builder /app/apps/worker/dist apps/worker/dist

EXPOSE 9090

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:9090/health || exit 1

CMD ["node", "apps/worker/dist/worker.js"]
