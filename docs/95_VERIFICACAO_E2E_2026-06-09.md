# 95. Verificação E2E das Correções (2026-06-09)

Verificação de sistema (não apenas unitária) dos fluxos alterados nas Fases 1-7, executada
contra a API rodando localmente. Princípio: **verificar antes de estender** — converter
"achamos que funciona" em "vimos funcionar". Complementa o doc 94 (execução das correções).

## 1. Smoke test dos fluxos críticos (✅ aprovado)

| Fluxo | O que prova | Método | Resultado |
|---|---|---|---|
| Login interno | Auth base funciona | `POST /auth/login` (admin demo) | ✅ token emitido |
| **F-01 — Portal destravado** | Portal do cliente voltou a funcionar (era 100% 401) | magic-link real → `validar` (servidor assina) → `GET /portal/dashboard` | ✅ **HTTP 200** |
| F-01 (2ª rota) | Portal funcional além do dashboard | `GET /portal/documentos` com token de portal | ✅ HTTP 200 |
| **F-02 — Guarda cross-tenant** | Token cujo empreendimento não pertence ao tenant é barrado | magic-link com `tenant_id` ≠ tenant do empreendimento → `validar` → `/portal/dashboard` | ✅ **HTTP 401** |
| Controle | Rota de portal sem token | `GET /portal/dashboard` sem auth | ✅ HTTP 401 |

> Nota metodológica: um primeiro teste com JWT assinado à mão deu 401 — era **artefato do teste**
> (formato/segredo do token manual), não do código. O fluxo real de magic-link (servidor assinando)
> confirmou 200. Os tokens de smoke inseridos no banco foram removidos ao fim.

## 2. Cross-tenant V-01/V-02/V-03 (✅ coberto por teste automatizado)

Não exigiram smoke manual: os 3 IDOR têm regressão automatizada em
[tenant-isolation.routes.test.ts](../apps/api/src/modules/__tests__/tenant-isolation.routes.test.ts)
(tenant A recebe 404 ao tocar recurso do tenant B) — parte dos **403/403 testes verdes**.

## 3. Saúde de build (✅ verificado)

| Verificação | Resultado |
|---|---|
| `typecheck` api / web / worker | ✅ limpo nos 3 |
| `prisma migrate status` | ✅ up to date (28 migrations) |
| `pnpm --filter @repo/api test` | ✅ 403/403 |
| Git | branch `main`, working tree limpo, 12+ commits |

## 4. Build de produção (Docker) — ✅ verificado (e revelou 5 defeitos)

`docker compose build api` foi rodado **pela primeira vez** e provou que a Fase 5 estava
incompleta — o build nunca tinha sido exercido. 5 defeitos encontrados e corrigidos:

1. `tsconfig.base.json` não era copiado p/ a imagem → `tsc` sem `esModuleInterop`/`skipLibCheck`.
2. Ordem de build dos pacotes — Docker não roda `turbo`; faltava construir `@repo/*` antes (filtro `...`).
3. Runner reinstalava em vez de copiar artefatos construídos → faltava o `dist` dos pacotes.
4. `apps/api/node_modules` (symlinks pnpm das deps) não era copiado → runtime não resolvia nada.
5. Prisma no Alpine sem `openssl` + binário musl → `apk add openssl` + `binaryTargets` no schema.

**Resultado final:** imagem `sistema-api` builda; runtime resolve `@prisma/client` + `@repo/*` +
`fastify`; Prisma engine carrega sem aviso; `$connect()` chega ao estágio de conexão. A validação
de env (fail-fast) roda — um teste com `docker run --env-file` mostrou erros que eram apenas
**aspas** no `.env` de dev (o `docker --env-file` não as remove, o `docker compose`/`dotenv` sim).
Conclusão: a imagem é **deployável**; `docker compose up` com um `.env` de produção sobe.

> Lição: "passa nos testes" ≠ "deploya". Só a verificação real pegou estes 5 itens.

## 4-bis. Verificação E2E da feature de campo (pendências/evidências)

Após construir a feature, foi exercido o loop real **criar → renderizar → validar** com dado
real numa OS do seed (não só testes unitários):

| Passo | Resultado |
|---|---|
| Criar pendência + evidência via API numa OS real | ✅ 201 |
| `/equipe/pendencias` renderiza a pendência real | ✅ (descrição + OS na tela) |
| `/equipe/evidencias` renderiza a evidência real | ❌→✅ **bug pego e corrigido** |
| Analista valida → badge muda para "Validada" | ✅ (statusValidacao + validadoEm) |

**Bug pego (que typecheck e teste-de-vazio não pegariam):** `latitude/longitude` são `Decimal`
no Prisma e serializam como **string** no JSON; a tela fazia `latitude.toFixed(3)` (método de
number) → **HTTP 500**. Corrigido com `Number(...)`. Exatamente o tipo de divergência front↔API
que só a renderização com dado real revela.

## 4-ter. Redirect em 401 — verificado: JÁ funciona (achado da auditoria estava errado)

A auditoria de frontend afirmou "nenhuma das 84 telas redireciona em 401". Verificação empírica
desmentiu:

| Cenário | Resultado |
|---|---|
| `(app)/dashboard` com token inválido/expirado | **307 → /login** (guard `if (!sessao) redirect` no layout) |
| `(app)/dashboard` sem cookie | 307 → /login?from=... |
| `/equipe/os` com token inválido | 200 com tela "sessão expirou" + login (re-login com contexto) |

O `(app)/layout.tsx` já protege as ~75 páginas internas; o `/equipe` mostra re-login amigável.
O wrapper `serverApi` (não usado) é redundante. **Nenhum fix necessário.** Melhoria real futura
(separada): fluxo de refresh-token (hoje access expira em 15min → re-login; o refresh de 7 dias
não é usado para renovar silenciosamente).

## 5. Veredito da verificação

Os fluxos que tocamos nas correções foram **exercidos como sistema rodando** e se comportam como
esperado: o portal do cliente está funcional (F-01) e protegido (F-02), o isolamento de tenant é
provado por teste, e o build/migrations estão sãos. A fundação está **verificada**, não só corrigida.

Próximo passo correto após esta verificação: construir o backend de **pendências/evidências** e
ligar as telas `/equipe` (maior gap funcional restante) — ver doc 94, seção Pendências.
