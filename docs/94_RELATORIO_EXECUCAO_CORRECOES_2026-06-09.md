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

## 6. Config/observabilidade (commits `af49ed4`, `46e9f1d`)

- ✅ Guard de produção no `prisma/seed.ts` (bloqueia seed demo em produção).
- ✅ Health endpoint do worker (`GET :9090/health`, http nativo) + healthcheck no compose/Dockerfile.
- ✅ `.env.example`: `WORKER_HEALTH_PORT`, `BACKUP_*`, `ALLOW_PROD_SEED` documentados.
- ⏳ **Adiado (requer deps novas + config externa)**: logging estruturado pino no worker,
  error tracking (Sentry — precisa DSN), monitor de filas (bull-board).

## 7. Frontend / app de campo — PARCIAL (commit `2f0b4db`)

- ✅ **Auth real da equipe**: `/equipe/login` deixou de ser fake — autentica na API (`/auth/login`)
  e usa os cookies reais (`posto_access`/`refresh`), então `/equipe/os` mostra dados reais.
  Login por e-mail+senha; layout/página índice usam `getSessao()`.
- ✅ **Divergências de tipo**: motor-orçamento `score.atualizadoEm` → `calculadoEm`; lista de
  documentos passou a trazer `versaoAtual.enviadoPor`.
- ⏳ **Pendente**: wiring de `/equipe/inicio` (KPIs/OS/roteiro ainda mock) e `/equipe/checklists`
  (estado só client); **novos endpoints de pendências e evidências de campo** (não existem no
  backend — exigem modelos Prisma + migration + rotas + wiring); redirect global em 401 (`serverApi`).

## 8. Limpeza — PARCIAL (commit `7ba68f6`)

- ✅ Removido `wsn` (export PostScript de 35MB largado na raiz).
- ✅ Arquivados em `docs/archive/` os 3 relatórios de 28/mai superados (sub-ondas 5.1/5.2/5.3),
  resolvendo a colisão 89/90/91. Colisão 81-84 mantida (séries distintas; renumerar quebra refs).
- ⏳ **Fora do repo (requer confirmação)**: cópias `ITECOLOGICA-copia/`, `posto-compliance-unico/`
  e zips pesados (~470MB) no workspace.

## Validação acumulada

| Verificação | Resultado |
|---|---|
| `pnpm --filter @repo/api typecheck` | ✅ limpo |
| `pnpm --filter @posto/worker typecheck` | ✅ limpo |
| `pnpm --filter @repo/api test` | ✅ **403/403** (400 + 3 de isolamento) |
| `prisma migrate status` | ✅ up to date (28 migrations) |

## Pendências (próximas sessões)

O que falta para 100% técnico, em ordem de valor:

1. **Frontend do app de campo (maior peça)** — ligar `/equipe/inicio` (KPIs/OS/roteiro) e
   `/equipe/checklists` à API, e **construir os endpoints de pendências e evidências de campo**
   (modelos Prisma + migration + rotas + UI). É um build de feature, não ajuste.
2. **Observabilidade com deps** — pino no worker, Sentry (precisa DSN), bull-board.
3. **Redirect global em 401** — adotar `serverApi` (hoje morto) ou tratar expiração de token na UI.
4. **Limpeza externa** — `ITECOLOGICA-copia`/`posto-compliance-unico` e zips (~470MB), fora do repo.
5. **Harness de testes do worker** — adicionar vitest ao pacote (worker hoje sem testes).

**Depende do usuário (não-código):** conferir aderência das regras a ANP/CETESB/Bombeiros;
validar fluxo ponta a ponta com dados reais; definir operação/backup/primeiro cliente.
