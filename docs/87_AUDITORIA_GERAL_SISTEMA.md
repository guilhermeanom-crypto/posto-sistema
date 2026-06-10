# 87. Auditoria Geral do Sistema — 2026-05-28

## 1. Escopo

Auditoria completa cobrindo seguranca, duplicacoes, consistencia arquitetural, nivel de implementacao e composicao de desenvolvimento. Executada sobre o estado do codigo apos conclusao das Ondas 1 a 4.

## 2. Seguranca

### 2.1 Criticos (corrigir antes de producao)

**SEC-01: Magic link tokens armazenados sem hash**
- Arquivo: `apps/api/src/modules/auth/auth.service.ts` (tokenPortal.create)
- Problema: Token UUID salvo em texto puro no banco. Refresh tokens usam SHA-256 corretamente, mas magic links nao.
- Risco: Dump do banco expoe todos os links ativos do portal.
- Correcao: Aplicar `this.hashToken(token)` antes de persistir, e hash novamente no lookup.

**SEC-02: INTEGRATION_SHARED_SECRET opcional**
- Arquivo: `apps/api/src/config/env.ts` (linha 38, `.optional()`)
- Problema: Endpoint `/api/v1/integracoes/itecologica/crm-win` retorna 503 se secret nao estiver definido, mas nao impede o deploy.
- Risco: Misconfig em producao abre endpoint para POST nao autenticado.
- Correcao: Tornar campo obrigatorio no schema Zod do env, ou adicionar assertion no startup.

### 2.2 Altos (corrigir logo)

**SEC-03: Sem rate limit dedicado em /auth/login e /auth/refresh**
- Arquivo: `apps/api/src/app.ts` (linhas 101-106)
- Problema: Limite global de 100 req/min aplica-se uniformemente. Atacante pode tentar 100 logins/min por IP.
- Correcao: Rate limit especifico de 10 req/min nas rotas de autenticacao.

**SEC-04: trustProxy: true sem restricao**
- Arquivo: `apps/api/src/app.ts` (linha 75)
- Problema: Com `trustProxy: true` incondicional, qualquer cliente pode forjar `X-Forwarded-For` e burlar rate limit.
- Correcao: Configurar `trustProxy` com numero exato de hops do proxy reverso (ex: `1`).

**SEC-05: Argon2 inconsistente — tenants.routes.ts usa argon2d**
- Arquivo: `apps/api/src/modules/tenants/tenants.routes.ts` (linha 137)
- Problema: `argon2.hash(senhaTemporaria)` sem `{ type: argon2.argon2id }`. Padrao cai para argon2d (mais fraco).
- Correcao: Adicionar `{ type: argon2.argon2id }` em toda chamada de hash.

### 2.3 Medios

- **SEC-06**: `contentSecurityPolicy: false` no Helmet — OK para API pura, mas se Swagger UI estiver habilitado, nao ha CSP.
- **SEC-07**: `.env.example` contem credenciais AWS de documentacao que podem triggerar scanners.
- **SEC-08**: Cobertura de `.gitignore` para `.env` em subdiretorios pode nao ser suficiente. Recomenda-se `**/.env` e `**/.env.local`.

### 2.4 Baixos

- **SEC-09**: HSTS depende do proxy reverso em producao — verificar configuracao do nginx/caddy.
- **SEC-10**: Upload de 50MB sem restricao de MIME type no multipart direto (presigned URLs ja validam MIME).

## 3. Duplicacoes e Consistencia

### 3.1 Tipos duplicados frontend vs backend

~293 definicoes de tipo locais em `apps/web/src/app/(app)/`. Nenhuma usa `@repo/types` ou `@repo/schemas`.

Exemplos de duplicacao:
- `EntregavelResumo` definido em `entregaveis/page.tsx` E `apps/api/src/modules/operacao/entregaveis.types.ts`
- `interface Empreendimento` redefinido em pelo menos 3 paginas do frontend
- Contratos, OS, Handoff — todos com tipos locais no frontend que espelham o backend

Impacto: Se um campo muda no backend, o frontend nao sabe e pode quebrar silenciosamente.

### 3.2 Helpers de teste copy/paste

5 funcoes identicas (`loginDemo`, `authedRequest`, `buildPropostaPayload`, `createApprovedProposal`, `createHandoffFixture`) copiadas em 5 arquivos de teste. Nenhum modulo compartilhado.

Correcao: Criar `apps/api/src/test/helpers.ts` e importar.

### 3.3 Mock restante

`apps/web/src/app/(app)/servicos/page.tsx` importa `servicosCatalogo` e `moeda` de `gestao-interna/data.ts`. API de catalogo (`GET /api/v1/comercial/catalogo`) ja existe.

Exports mortos em `gestao-interna/data.ts`: `gestaoInternaCards`, `percentual`, `statusTone` — sem nenhum import restante.

### 3.4 Padrao de modulos inconsistente

- 15 modulos com routes-only (sem service): alertas, audit, cockpit, compliance, config, conhecimento, crm, fila, ia, legislacao, metricas, portal, risco, tenants, whatsapp.
- 24 modulos com routes + service.
- Apenas os modulos `operacao` e `comercial` tem `types.ts` + `schemas.ts` dedicados.

### 3.5 Filas worker sem parelha

| Fila definida em bullmq.ts | Tem processor no worker? |
|---|---|
| email | Sim |
| alertas | Sim |
| compliance | Sim |
| scheduler | Sim |
| notificacoes | **NAO** (definida mas sem processor) |
| entregaveis | Sim |

| Processor no worker | Tem fila definida em bullmq.ts? |
|---|---|
| ai.processor | **NAO** |
| relatorio.processor | **NAO** |
| whatsapp.processor | **NAO** |
| entregavel.processor | Sim |

## 4. Banco de Dados

### 4.1 Modelos sem indice (risco de performance)

`Tenant`, `Usuario`, `EmpreendimentoAcesso`, `RequisitoTipoProcesso`, `TarefaDependencia`, `RegraAutomatica`, `AuditLog`, `MTR`, `LaudoAgua`

**AuditLog e Usuario** sao tabelas de alto volume — ausencia de indices e risco real.

### 4.2 Modelos sem @@map (inconsistencia de nomenclatura)

`Tenant`, `Usuario`, `RequisitoTipoProcesso`, `RegraAutomatica`, `AuditLog`, `MTR`, `LaudoAgua`

### 4.3 Multi-tenant

28 modelos sem `tenantId` direto. Maioria sao sub-entidades que herdam via FK do pai (correto). `ServicoCatalogo` e `ObrigacaoRegulatoriaBase` sao intencionalmente globais (dados de catalogo compartilhados).

## 5. Cobertura de Testes

| Modulos com testes | Modulos sem testes |
|---|---|
| auth, comercial (propostas + contratos), operacao (handoffs + OS + entregaveis) | **36 modulos restantes** incluindo documentos, processos, condicionantes, compliance, empreendimentos, usuarios, fiscalizacoes, audit |

Cobertura: **3 de 39 modulos (8%)**. Suite total: 66 testes verdes.

## 6. Nivel de implementacao por superficie

| Superficie | Telas com dado real | Telas mockadas | Telas estaticas |
|---|---|---|---|
| Sistema interno (`/app`) | ~92% | 1 (servicos) | 3 (comercial/triagem, propostas list, propostas/[id]) |
| Portal do cliente | 100% | 0 | 0 |
| Area de campo | 100% | 0 | 0 |
| Site institucional | 100% | 0 | 0 |

## 7. Panorama geral

O sistema tem **fundacao production-grade** (stack madura, multi-tenant, ACID, auditoria, worker assincrono) mas precisa de:

1. **Correcoes de seguranca** (5 itens, sendo 2 criticos) antes de qualquer deploy em producao.
2. **Testes** — cobertura de 8% e inaceitavel para sistema regulatorio/fiscal. Meta minima: 50% dos modulos criticos.
3. **Unificacao de tipos** — frontend e backend precisam compartilhar definicoes via `packages/types`.
4. **Padronizacao de modulos** — os 15 routes-only precisam de service separado gradualmente.
5. **Indices no banco** — AuditLog e Usuario precisam de indices imediatamente.
