# 91. Relatorio da Onda 5.3 — Limpeza Imediata

## 1. Objetivo

Executar a limpeza imediata prevista em `88_PLANO_ONDA_5_ESTABILIZACAO.md`, reduzindo duplicacao barata em testes, removendo mock da tela de servicos e eliminando exports mortos de `gestao-interna/data.ts`.

## 2. Correcoes executadas

| Item | Status | Correcao |
|---|---|---|
| Helpers de teste | Concluido parcial | Criado `apps/api/src/test/helpers.ts` com `loginDemo`, `authedRequest`, `buildPropostaPayload`, `createApprovedProposal`, `createHandoffFixture` e `createContratoFixture`. |
| Refactor de testes | Concluido parcial | Cinco arquivos de teste passaram a usar `loginDemo` e `authedRequest` compartilhados. Fixtures mais especificas ficaram locais para evitar mudanca ampla de comportamento. |
| `/servicos` sem mock | Concluido | Tela passou a consumir `GET /api/v1/comercial/catalogo?limit=100` via client server-side autenticado. |
| Exports mortos | Concluido | Removidos `servicosCatalogo`, `percentual`, `statusTone` e `gestaoInternaCards` de `gestao-interna/data.ts`; ficou apenas `moeda`, ainda usado pela tela. |

## 3. Arquivos alterados

- `apps/api/src/test/helpers.ts`
- `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts`
- `apps/api/src/modules/comercial/__tests__/contratos.routes.test.ts`
- `apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts`
- `apps/api/src/modules/operacao/__tests__/ordens-servico.routes.test.ts`
- `apps/api/src/modules/operacao/__tests__/entregaveis.routes.test.ts`
- `apps/web/src/app/(app)/servicos/page.tsx`
- `apps/web/src/app/(app)/gestao-interna/data.ts`

## 4. Validacao

Comandos executados:

```bash
./node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json
./node_modules/.bin/tsc --noEmit -p apps/web/tsconfig.json
```

Resultado: passaram.

```bash
./node_modules/.bin/vitest run src/modules/auth/auth-duration.unit.test.ts src/modules/operacao/handoffs-rules.unit.test.ts src/modules/auth/auth.service.test.ts src/modules/auth/auth.routes.test.ts
```

Resultado: 4 arquivos passaram, 13 testes passaram.

## 5. Observacoes

- A refatoracao dos helpers foi mantida incremental: os helpers comuns foram criados e usados, mas fixtures com detalhes especificos de contrato/OS/entregavel nao foram forçadas para o helper nesta onda.
- A pagina `/servicos` agora depende de sessao autenticada. Sem token, exibe estado vazio em vez de dados mockados.
- Os testes de integracao completos continuam dependentes de Postgres/Redis locais; nao foram executados nesta rodada.

## 6. Status

Onda 5.3 concluida em codigo.
