# Hábilis — Sistema de Gestão Regulatória para Postos de Combustível

Plataforma SaaS multi-tenant para consultorias regulatórias do setor de postos de combustível (ambiental, SST, ANP/Inmetro).

## Arquitetura

Monolito modular em TypeScript com 4 aplicações no monorepo:

| App | Porta | Descrição |
|---|---|---|
| `apps/api` | 3001 | Backend Fastify 4 com Prisma + PostgreSQL |
| `apps/web` | 3000 | Frontend Next.js 15 (sistema interno + portal + campo) |
| `apps/site` | 3100 | Site institucional Next.js 15 |
| `apps/worker` | — | Worker BullMQ para jobs assíncronos (IA, e-mail, PDF, compliance) |

Pacotes compartilhados: `packages/schemas`, `packages/types`, `packages/utils`.

## Stack

- **Linguagem:** TypeScript 5
- **Backend:** Fastify 4, Prisma 5, PostgreSQL, Zod (validação end-to-end)
- **Frontend:** Next.js 15 (App Router, Server Components)
- **Cache/Filas:** Redis + BullMQ
- **Auth:** JWT + Argon2 + RBAC (CASL)
- **Storage:** MinIO (S3-compatible)
- **Email:** Resend + MailHog (dev)
- **PDF:** PDFKit (propostas, entregáveis)
- **Logs:** Pino (estruturado, JSON)
- **Monorepo:** Turborepo + pnpm workspaces

## Infraestrutura local

```bash
docker compose up -d          # Postgres, Redis, MinIO, MailHog
pnpm install                  # Dependências
pnpm -F @repo/api db:migrate  # Migrations
pnpm -F @repo/api db:seed     # Seed demo
pnpm dev                      # Sobe API + Web + Site + Worker
```

## Credenciais demo

| Persona | URL | Email | Senha |
|---|---|---|---|
| Sistema interno | http://localhost:3000/login | admin@postodemo.com.br | Demo@1234 |
| Portal do cliente | http://localhost:3000/portal/login | representante@postodemo.com.br | Demo@1234 |
| Equipe de campo | http://localhost:3000/equipe/login | — | — |
| Site público | http://localhost:3100 | — | — |

## Fluxo comercial-operacional

```
Lead → Diagnóstico → Proposta (PDF) → Aprovação
→ Handoff (triagem operacional)
→ Contrato (vigência, MRR)
→ Ordem de Serviço (campo)
→ Entregável (PDF gerado pelo worker)
→ Financeiro (MRR/ARR agregado)
```

## Módulos backend (39)

auth, usuarios, empreendimentos, processos, documentos, condicionantes, tarefas, alertas, compliance, portal, conhecimento, config, licencas-ambientais, regulatorio-urbano, sst, anp-inmetro, estanqueidade, logistica-reversa, outorga-hidrica, monitoramento, fiscalizacoes, cockpit, relatorios, ia, legislacao, risco, whatsapp, checklists, audit, onboarding, crm, tenants, pgrs, equipamentos, fila, metricas, integracoes, comercial (catálogo + diagnóstico + propostas + contratos + financeiro), operacao (handoffs + ordens-servico + entregaveis).

## Banco de dados

- **83 models** Prisma
- **28 migrations** versionadas
- Multi-tenant (`tenantId` obrigatório em toda tabela de domínio)
- Auditoria persistente (`AuditLog`)

## Testes

```bash
pnpm -F @repo/api test        # 66 testes integration (Postgres real)
pnpm -F @repo/api typecheck   # TypeScript
pnpm -F @posto/web typecheck  # TypeScript
```

## Segurança

- Helmet (security headers OWASP)
- CORS restrito
- JWT com expiração
- Argon2 (hash de senha)
- Rate-limit com Redis (100 req/min)
- RBAC por perfil (CASL)
- Validação Zod em toda entrada
- `.env` no `.gitignore`

## Documentação técnica

86 documentos em `docs/` cobrindo planejamento, modelagem, execução e validação de cada onda de desenvolvimento.
