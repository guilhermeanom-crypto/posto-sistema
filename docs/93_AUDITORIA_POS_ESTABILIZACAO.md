# 93. Auditoria Pos-Estabilizacao — 2026-05-28

Auditoria completa executada via `PROMPT_AUDITORIA_SISTEMA.md` apos a Onda 5. Validacao empirica + 3 auditores paralelos (seguranca, arquitetura/banco, qualidade/testes) + verificacao manual dos achados criticos.

## 1. Resumo executivo

O sistema esta SAUDAVEL no geral — a estabilizacao da Onda 5 se manteve integra (seguranca, banco, testes, tipos). POReM a auditoria encontrou **1 bug CRITICO de producao**: o portal do cliente esta 100% inacessivel (autenticacao quebrada). Tambem ha achados ALTOS de seguranca latente e cobertura. Nada disso impede o sistema interno de funcionar — mas o portal do cliente precisa de correcao antes de qualquer cliente usar.

## 2. Validacao empirica

| Verificacao | Resultado |
|---|---|
| `pnpm test` (apps/api) | ✅ 400/400 verdes (23 arquivos) |
| `pnpm typecheck` apps/api | ✅ Limpo |
| `pnpm typecheck` apps/web | ✅ Limpo |
| `prisma migrate status` | ✅ Up to date |

## 3. Achados por gravidade

| ID | Gravidade | Dimensao | Arquivo:linha | Problema | Correcao |
|---|---|---|---|---|---|
| **F-01** | **CRITICO** | Seguranca/Auth | `authenticate.ts:22` + `auth.service.ts:247` + `portal.routes.ts:15` | Portal do cliente 100% inacessivel. O JWT do portal usa `sub="portal:<empreendimentoId>"`, mas o middleware `authenticate` busca `usuario.findUnique({ id: sub })` — nunca encontra "portal:..." → lanca 401 em TODA rota do portal. CONFIRMADO manualmente. | Adicionar branch no `authenticate` que detecta o prefixo `portal:` no `sub`, pula a busca de usuario e popula `request.user` direto do JWT (tenantId, perfil, empreendimentoIds). |
| **F-02** | **ALTO** | Seguranca/Multi-tenant | `portal/portal.routes.ts:38` | `empreendimento.findFirst({ where: { id } })` sem `tenantId`. Latente hoje (portal quebrado), mas vira vazamento cross-tenant assim que F-01 for corrigido. | Adicionar `tenantId: request.user.tenantId` ao where. |
| **F-03** | **ALTO** | Seguranca | `integracoes-itecologica.routes.ts:210` | Comparacao do segredo de integracao com `!==` (nao constant-time) — vulneravel a ataque de timing para descobrir o segredo. | Usar `crypto.timingSafeEqual`. |
| **C-01** | **ALTO** | Cobertura | 7-9 modulos de negocio | Modulos com service e SEM teste: `integracoes` (971 linhas!), `onboarding` (gap-analysis 598 + budget-preview), `relatorios`, `outorga-hidrica`, `regulatorio-urbano`, `logistica-reversa`, `anp-inmetro`, `equipamentos`. Logica de negocio sem rede de seguranca. | Escrever testes de rota, 1 modulo por vez (padrao ja estabelecido). |
| **Q-01** | **ALTO** | Duplicacao tipos | `apps/web/.../empreendimentos`, `sst`, etc. | ~115 tipos locais no frontend redefinindo respostas da API (empreendimentos 35, sst 26, fiscalizacoes 9, monitoramento 9...). Risco de divergencia silenciosa. | Migrar dominios para `@repo/types` (5.4 fase 2), incremental. |
| **A-01** | **ALTO** | Arquitetura | `cockpit.routes.ts` (606 linhas, 50 queries Prisma), `portal.routes.ts` (762 linhas, 34 queries) | Dois modulos grandes com toda a logica inline na rota — dificil testar, sem camada de service. | Extrair service quando tocar (decisao Onda 5.5). cockpit e portal sao os prioritarios. |
| **F-04** | **MEDIO** | Seguranca | `integracoes-itecologica.routes.ts:190` | Webhook `/crm-win` so tem rate limit global (100/min); brute-force do segredo possivel nessa janela. | Rate limit dedicado 10/min na rota. |
| **A-03** | **MEDIO** | Arquitetura | `tenants.routes.ts:347` | Provisionamento de tenant (cria tenant + usuario + empresa) inline sem `$transaction` — falha no meio deixa dados parciais. | Extrair `tenants.service.ts` com `prisma.$transaction`. |
| **D-01** | **MEDIO** | Banco | `schema.prisma` — `SessaoRefresh` | Sem indice composto `(tokenHash, expiresAt)` — lookup de sessao em toda request autenticada. | Adicionar `@@index([tokenHash, expiresAt])`. |
| **D-04** | **MEDIO** | Banco | `schema.prisma` — `ScoreRisco` | `onDelete: Cascade` apaga historico de scores ao deletar empreendimento — perde trilha de auditoria. | Mudar para `Restrict` ou `SetNull`. |
| **E-01** | **MEDIO** | Backend | `app.ts:157` | Handler de rate limit checa so `statusCode === 429`; algumas versoes emitem `code === 'FST_ERR_RATE_LIMIT'` → cairia no 500 generico. | Adicionar `|| error.code === 'FST_ERR_RATE_LIMIT'`. |
| **F-05** | **BAIXO** | Config | `env.ts` (API) | `ANTHROPIC_API_KEY` usado pelo worker mas nao validado no env da API (no worker esta OK). | Documentar separacao ou adicionar opcional. |
| **F-06** | **BAIXO** | Config | `.env.example:39` | Credencial AWS de exemplo da documentacao (`AKIAIOSFODNN7EXAMPLE`) dispara falso-positivo em scanners de segredo. | Trocar por placeholder generico. |
| **A-08** | **BAIXO** | Arquitetura | ~26 modulos | Schemas Zod declarados inline nas rotas em vez de `*.schemas.ts` dedicado — dificulta reuso/teste. | Extrair gradualmente quando tocar. |

## 4. O que esta SAUDAVEL (confirmado empiricamente)

**Seguranca (Onda 5.1 integra):**
- JWT secret do env (min 32 chars), nao hardcoded; expiracao configurada.
- Refresh token e magic-link/portal token hasheados (SHA-256) antes de gravar.
- Rate limit 10/min em `/login` e `/refresh` + lockout no banco apos 5 falhas.
- argon2id em 100% das chamadas de hash.
- `trustProxy` = numero de hops (env), nao incondicional.
- `INTEGRATION_SHARED_SECRET` obrigatorio e documentado.
- Todos os `$queryRaw` usam `Prisma.sql` parametrizado (sem SQL injection). `$executeRawUnsafe` so em teardown de teste.
- Sem vazamento de hash de senha nas respostas; stack trace escondido em producao.
- Upload com limite de 50MB + validacao de MIME.
- `.env` no `.gitignore`.

**Backend/Banco:**
- Handler de erro global tratando AppError, Zod, rate-limit, desconhecido.
- 40 rotas registradas, todas mapeadas a modulos reais (sem orfas).
- Indices compostos nas tabelas de alto volume (AuditLog, Tarefa, Documento, Processo, comerciais/operacao).
- Multi-tenant em 78/81 modelos (3 sem sao intencionais: SessaoRefresh, PublicacaoDO, catalogos globais).
- 8/8 filas BullMQ com processor correspondente.
- 81/81 modelos com `@@map`.

**Qualidade/Testes:**
- 400 testes verdes, 23 arquivos, 17/39 modulos (44%) — todo o fluxo critico coberto.
- Zero mock no frontend.
- 100% dos testes usam helpers compartilhados (sem duplicacao).
- Dominios comercial-operacional com fonte unica de tipos (`@repo/types`).
- Sem asserts frouxos de status (`.not.toBe(401)`) escondendo bugs.

## 5. Metricas

| Metrica | Valor |
|---|---|
| Testes | 400/400 verdes |
| Modulos com teste | 17/39 (44%) |
| Falhas CRITICAS | 1 (portal auth) |
| Falhas ALTAS | 5 |
| Falhas MEDIAS | 5 |
| Falhas BAIXAS | 3 |
| Migrations | up to date |
| Typecheck (api+web) | limpo |
| Mock no frontend | 0 |

## 6. Plano de consolidacao priorizado

1. **[CRITICO, rapido] F-01 — Corrigir auth do portal.** Branch no `authenticate` para tokens `portal:`. Adicionar teste de portal (que pegaria isso). ~1h.
2. **[ALTO, rapido] F-02 + F-03 + F-04 — Endurecer portal e integracao.** tenantId no findFirst, timingSafeEqual, rate limit no webhook. ~1h.
3. **[MEDIO, rapido] D-01, D-04, E-01 — Indice de sessao, cascade do ScoreRisco, guard de rate-limit.** Migration + ajuste. ~1h.
4. **[ALTO, medio] C-01 — Testes dos 7-9 modulos de negocio sem cobertura.** Incremental, 1 por vez.
5. **[ALTO, medio] A-01/A-03 — Extrair service de cockpit, portal, tenants** (este ultimo com transacao).
6. **[ALTO, longo] Q-01 — Migrar tipos dos dominios antigos para @repo/types** (5.4 fase 2).
7. **[BAIXO] F-05, F-06, A-08 — Cosmeticos.**

## 7. Veredito

Estabilizacao da Onda 5 confirmada integra. O fluxo do SISTEMA INTERNO esta solido e testado. O achado critico (portal) e exatamente o tipo de coisa que a auditoria existe para pegar — estava invisivel por falta de teste de portal. Recomendacao: corrigir F-01 + F-02 imediatamente (portal e seguranca de cliente externo), depois seguir o plano priorizado.
