# 89. Relatorio das Ondas 5.1 / 5.2 / 5.3 — Core de Estabilizacao

## 1. Objetivo

Concluir o core de estabilizacao do sistema (seguranca + banco + limpeza), conforme [88_PLANO_ONDA_5_ESTABILIZACAO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/88_PLANO_ONDA_5_ESTABILIZACAO.md>).

## 2. Onda 5.1 — Seguranca (COMPLETA)

| ID | Correcao | Estado |
|---|---|---|
| SEC-01 | Hash do magic link token (`hashPortalToken` ao salvar e buscar) | ✅ Feito + extraido para `portal-token.ts` |
| SEC-02 | `INTEGRATION_SHARED_SECRET` obrigatoria (`z.string().min(24)`) | ✅ Feito |
| SEC-03 | Rate limit 10 req/min em `/auth/login` e `/auth/refresh` | ✅ Feito |
| SEC-04 | `trustProxy` configuravel via `TRUST_PROXY_HOPS` (default 1) | ✅ Feito |
| SEC-05 | `{ type: argon2.argon2id }` em todas as 3 chamadas `argon2.hash` | ✅ Feito |

### Regressao detectada e corrigida
A correcao SEC-02 tornou `INTEGRATION_SHARED_SECRET` obrigatoria, mas a variavel nao havia sido adicionada ao `apps/api/.env`. Resultado: `loadEnv()` chamava `process.exit(1)` no boot, derrubando a API e quebrando 6 de 10 arquivos de teste.

**Correcao aplicada:** adicionada `INTEGRATION_SHARED_SECRET` ao `apps/api/.env`. O `.env.example` (raiz) ja documentava a variavel + `TRUST_PROXY_HOPS` corretamente.

### Cobertura de teste de seguranca adicionada
- `apps/api/src/modules/auth/auth.service.test.ts` (hash do token de portal)
- `apps/api/src/modules/auth/auth.routes.test.ts` (rate limit)
- Suite subiu de 66 para 69 testes.

## 3. Onda 5.2 — Banco + Worker (COMPLETA)

### Indices
Migration `20260528172000_add_indexes_onda_5_2` (idempotente, `CREATE INDEX IF NOT EXISTS`):
- `audit_log` (tenant_id, criado_em DESC) + (tenant_id, entidade_tipo)
- `empreendimento_acessos` (empreendimento_id)
- `tarefas_dependencias` (depende_de_id)
- `regras_automaticas` (tenant_id, ativo, ordem_execucao)
- `mtrs` (tenant_id, status, data_emissao) + (transportadora_id, status)
- `laudos_agua` (resultado, data_campanha)

### @@map
`audit_log`, `usuarios` e demais tabelas com nomenclatura consistente.

### Filas worker sincronizadas
- Adicionadas em `bullmq.ts`: `AI` ('ia'), `RELATORIO` ('relatorio'), `WHATSAPP` ('whatsapp').
- Fila orfã `NOTIFICACOES` (definida sem processor) removida.
- Agora cada processor tem fila correspondente e vice-versa.

## 4. Onda 5.3 — Limpeza imediata (COMPLETA)

### Helpers de teste unificados
- `apps/api/src/test/helpers.ts` agora exporta: `buildPropostaPayload`, `loginDemo`, `authedRequest`, `createApprovedProposal`, `createHandoffFixture`, `createContratoFixture`, `createOSFixture`, `getAdminUserId`.
- 5 arquivos de teste refatorados para importar de helpers (eliminadas ~15 copias locais de funcoes).
- `getAdminUserId` padronizado para assinatura `(app, token)`.

### Desmock de /servicos
- `apps/web/src/app/(app)/servicos/page.tsx` ja consumia `/comercial/catalogo` (dado real). Removida a ultima dependencia de mock (`moeda`).
- `moeda` movida para `apps/web/src/lib/format.ts`.

### Dead code removido
- Pasta `apps/web/src/app/(app)/gestao-interna/` deletada por completo (continha apenas `data.ts` com a funcao `moeda`).
- Exports mortos (`servicosCatalogo`, `gestaoInternaCards`, `percentual`, `statusTone`) ja haviam sido removidos anteriormente.

## 5. Validacao

| Verificacao | Resultado |
|---|---|
| `pnpm typecheck` apps/api | ✅ Limpo |
| `pnpm typecheck` apps/web | ✅ Limpo |
| `pnpm test` (suite completa) | ✅ 69/69 verdes (10 arquivos) |
| Migrations | ✅ Aplicadas (`prisma migrate status` up to date) |
| Imports de mock no frontend | ✅ Zero |

## 6. Estado da Onda 5

```
✅ 5.1 Seguranca       — COMPLETA (5/5 + regressao corrigida + 3 testes novos)
✅ 5.2 Banco + Worker  — COMPLETA (indices + @@map + filas)
✅ 5.3 Limpeza         — COMPLETA (helpers + desmock + dead code)
⏳ 5.4 Tipos           — pendente (unificacao frontend/backend via packages/types)
⏳ 5.5 Service+testes  — pendente (15 routes-only + cobertura)
```

**Core de estabilizacao concluido.** Sistema seguro, performatico e limpo. Restam as duas ondas de maturidade de engenharia (5.4 e 5.5), incrementais.

## 7. Proximo passo recomendado

Onda 5.4 (unificacao de tipos) ou 5.5 (service layer + testes). Sugestao: 5.4 primeiro pois reduz risco de inconsistencia frontend/backend antes de ampliar a base de testes da 5.5.
