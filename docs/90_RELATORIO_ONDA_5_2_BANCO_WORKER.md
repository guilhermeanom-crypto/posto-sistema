# 90. Relatorio da Onda 5.2 — Banco + Worker

## 1. Objetivo

Executar o bloco de saude de banco e worker previsto em `88_PLANO_ONDA_5_ESTABILIZACAO.md`, priorizando ajustes nao destrutivos: indices operacionais e sincronizacao entre filas criadas pela API e processors existentes no worker.

## 2. Correcoes executadas

| Item | Status | Correcao |
|---|---|---|
| Indices AuditLog | Concluido | Adicionados indices por tenant/data e tenant/tipo de entidade. |
| Indices Usuario | Revisado | `(tenantId, email)` ja esta coberto por unique; sem novo indice. |
| Indices EmpreendimentoAcesso | Concluido | Adicionado indice por `empreendimentoId`. |
| Indices TarefaDependencia | Concluido | Adicionado indice por `dependeDeId`. |
| Indices RegraAutomatica | Concluido | Adicionado indice por tenant/ativo/ordem de execucao. |
| Indices MTR | Concluido | Adicionados indices por tenant/status/data de emissao e transportadora/status. |
| Indices LaudoAgua | Concluido | Adicionado indice por resultado/data de campanha. |
| Filas `ia`, `relatorio`, `whatsapp` | Concluido | Centralizadas em `apps/api/src/infra/queue/bullmq.ts` e usadas pelas rotas/services. |
| Fila `notificacoes` | Concluido | Removida da lista central por nao ter instancia nem processor. |
| `@@map` snake_case | Nao executado | Adiado: renomear tabelas e um breaking change que exige plano especifico de migration/rollback. |

## 3. Arquivos alterados

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260528172000_add_indexes_onda_5_2/migration.sql`
- `apps/api/src/infra/queue/bullmq.ts`
- `apps/api/src/modules/ia/ia.routes.ts`
- `apps/api/src/modules/whatsapp/whatsapp.routes.ts`
- `apps/api/src/modules/relatorios/relatorios.service.ts`
- `apps/api/src/modules/legislacao/legislacao.routes.ts`
- `apps/api/src/modules/risco/risco.routes.ts`

## 4. Validacao

Comandos executados:

```bash
./node_modules/.bin/prisma validate --schema prisma/schema.prisma
```

Resultado: passou.

```bash
./node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json
./node_modules/.bin/tsc --noEmit -p apps/worker/tsconfig.json
```

Resultado: passaram.

```bash
./node_modules/.bin/vitest run src/modules/auth/auth-duration.unit.test.ts src/modules/operacao/handoffs-rules.unit.test.ts src/modules/auth/auth.service.test.ts src/modules/auth/auth.routes.test.ts
```

Resultado: 4 arquivos passaram, 13 testes passaram.

## 5. Observacoes

- A migration foi criada manualmente com `CREATE INDEX IF NOT EXISTS` para ser idempotente e nao destrutiva.
- A API agora instancia filas BullMQ apenas no modulo central `infra/queue/bullmq.ts`.
- O worker ja possuia processors para `ia`, `relatorio` e `whatsapp`; a mudanca alinha a API a esses nomes.
- A aplicacao da migration em banco real ainda precisa ser feita com `prisma migrate deploy` ou fluxo equivalente do ambiente.

## 6. Status

Onda 5.2 concluida em codigo.
