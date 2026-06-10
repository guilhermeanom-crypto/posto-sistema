# 94. Relatório de Execução — Correções de Segurança, Lógica, Dados e Deploy (2026-06-09)

Execução em fases sobre os achados das auditorias 87/93 e de uma caça a falhas dedicada
(IDOR, lógica de worker, integridade de dados). Cada fase foi validada (typecheck + testes)
e commitada isoladamente. Este é o registro oficial até o ponto de pausa.

## 0. Fundação — versionamento (commit `bbe386e`)

O monorepo **passou a ser versionado em git** (antes os `.git` estavam vazios/quebrados e
o CI nunca rodava). `.gitignore` reforçado (ignora `wsn`, `*.zip`, chaves TLS). Branch `main`.

## 1. Segurança cross-tenant (commit `b384df9`)

3 IDOR **novos e exploráveis** (não pegos pelas auditorias anteriores) + endurecimento:

| ID | Gravidade | Correção |
|---|---|---|
| V-01 | CRÍTICO | `PATCH /ia/defesas/:id` buscava defesa sem tenant → valida via `auto.tenantId` |
| V-02 | ALTO | aprovar/reprovar versão de documento sem checar tenant → valida `versao.documento.tenantId` |
| V-03 | ALTO | criar empreendimento aceitava `empresaId` de outro tenant → valida empresa do tenant |
| N-02 | ALTO | criar documento valida empreendimento do tenant; `confirmarUpload` idem |
| F-01 | CRÍTICO | `authenticate` trata token de portal (`sub=portal:`) → **portal voltou a funcionar** |
| F-02 | ALTO | preHandler do portal revalida empreendimento × tenant (defesa única p/ todas as rotas) |
| F-03 | ALTO | segredo de integração comparado em tempo constante (`timingSafeEqual`) |
| F-04 | MÉDIO | rate limit dedicado 10/min no webhook `/itecologica/crm-win` |

## 2. Rede de testes de isolamento de tenant (commit `e8d89b2`)

Causa-raiz dos IDOR: **o seed só tinha 1 tenant**, então nenhum teste provava isolamento.
- Novo helper `setupTenantB` ([apps/api/src/test/tenant-b.ts](../apps/api/src/test/tenant-b.ts)) — cria tenant B completo, idempotente.
- Novo suite [tenant-isolation.routes.test.ts](../apps/api/src/modules/__tests__/tenant-isolation.routes.test.ts) — 3 testes de regressão (V-01/02/03) provando que o tenant A recebe 404 ao tocar recurso do tenant B.

## 3. Bugs de lógica do worker (commit `20ecfad`)

| ID | Correção |
|---|---|
| L-01 | score de risco ANP/INMETRO/Bombeiros: `pontos` exibido agora = score somado (CETESB já estava certo) |
| L-02 | alertas de vencimento toleram 1 execução perdida (dispara em `H` ou `H-1`); dedup 24h evita duplicar |
| L-03 | tarefa automática filtra por `entidadeTipo` E `entidadeId` na query (não pós-filtra um único resultado) |
| L-04 | anomalia VMP conta streak consecutivo real; campanha conforme quebra o streak |
| L-05 | proposta só valida faixa de preço quando há faixa configurada (`precoMaximo > 0`) |
| L-06 | digest calcula média só sobre empreendimentos com snapshot |
| L-07 | gap-analysis zera horas no cálculo de dias (resultado não depende da hora de execução) |

## 4. Integridade de dados (commit `6a0dd5d`, migration `20260609215850`)

- N-03/N-04/N-05: `onDelete Cascade → Restrict` em LaudoAgua→Poço, TesteEstanqueidade→Tanque,
  RecursoAdministrativo/DefesaTecnica→AutoInfração (protege evidência regulatória/jurídica).
- N-06 mantido **Cascade** (ParametroContaminante são as medições intrínsecas da campanha).
- N-07: proposta carimba `enviada_em/aprovada_em/rejeitada_em/expirada_em` na transição de status.
- D-01: `@@index([expiresAt])` em SessaoRefresh.

## 5. Deploy funcional (commit `ff0be73`)

Bloqueadores que impediam `docker compose up`:
- Prisma Client nunca gerado → Dockerfiles api+worker geram no **builder** (p/ o tsc) e no **runner** (runtime).
- Worker sem schema/CLI → copia `apps/api/prisma` + prisma CLI global + generate.
- `migrate` sem `--schema` → adicionado; api/worker agora `depends_on: migrate` (completed_successfully).
- `.dockerignore` criado; serviço **postgres-backup** (pg_dump agendado); scaffolding de certs nginx
  ([infra/gerar-certs-autoassinado.sh](../infra/gerar-certs-autoassinado.sh) + [infra/nginx/README.md](../infra/nginx/README.md)).

> Recomenda-se rodar `docker compose -f docker-compose.prod.yml build` antes do deploy real
> (a validação aqui foi de lógica + YAML, não um build completo).

## 6. Config/observabilidade — PARCIAL (commit `af49ed4`)

- ✅ Guard de produção no `prisma/seed.ts` (bloqueia seed demo em produção).
- ⏳ **Pendente**: logging estruturado (pino) no worker; health endpoint + healthcheck do worker;
  error tracking (Sentry); monitor de filas (bull-board); limpar `AUTH_COOKIE_SECRET` (var morta);
  garantir `ANTHROPIC_API_KEY`/`TRUST_PROXY_HOPS` no `.env` de produção. (Requerem deps novas / lockfile.)

## Validação acumulada

| Verificação | Resultado |
|---|---|
| `pnpm --filter @repo/api typecheck` | ✅ limpo |
| `pnpm --filter @posto/worker typecheck` | ✅ limpo |
| `pnpm --filter @repo/api test` | ✅ **403/403** (400 + 3 de isolamento) |
| `prisma migrate status` | ✅ up to date (28 migrations) |

## Pendências (próximas sessões)

- **Fase 6 (resto)**: observabilidade do worker (pino, health, Sentry, bull-board) + limpeza de env.
- **Fase 7 — Frontend**: auth real do app `/equipe` (hoje é fake), ligar OS/checklists, criar endpoints
  de pendências/evidências de campo, redirect em 401 (`serverApi` morto), corrigir divergências de tipo
  (`atualizadoEm`/`calculadoEm`, `diasAteVencimento`, `enviadoPor`).
- **Fase 8 — Limpeza**: renumerar/arquivar docs duplicados (81-84, 89-91), remover `wsn`, consolidar
  cópias ITECOLOGICA, mover zips pesados, atualizar memória.
- **Follow-up**: harness de testes do worker (adicionar vitest ao pacote).
