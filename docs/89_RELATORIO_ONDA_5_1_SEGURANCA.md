# 89. Relatorio da Onda 5.1 — Seguranca

## 1. Objetivo

Executar o bloco critico de seguranca previsto em `88_PLANO_ONDA_5_ESTABILIZACAO.md`, fechando os pontos que bloqueavam producao: magic link em texto puro, secret de integracao opcional, rate limit fraco para auth, `trustProxy` amplo e hash de senha sem `argon2id`.

## 2. Correcoes executadas

| ID | Status | Correcao |
|---|---|---|
| SEC-01 | Concluido | Tokens de portal agora sao persistidos como SHA-256 e validados pelo hash. |
| SEC-02 | Concluido | `INTEGRATION_SHARED_SECRET` passou a ser obrigatoria no schema de env. |
| SEC-03 | Concluido | `/auth/login` e `/auth/refresh` passaram a ter limite dedicado de 10 req/min. |
| SEC-04 | Concluido | `trustProxy` deixou de ser `true` e passou a usar `TRUST_PROXY_HOPS`, default `1`. |
| SEC-05 | Concluido | Hash de senha inicial de tenant agora usa `argon2.argon2id`. |

## 3. Arquivos alterados

- `apps/api/src/modules/auth/portal-token.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.routes.ts`
- `apps/api/src/modules/auth/auth.service.test.ts`
- `apps/api/src/modules/auth/auth.routes.test.ts`
- `apps/api/src/modules/empreendimentos/empreendimentos.service.ts`
- `apps/api/src/modules/integracoes/integracoes-itecologica.service.ts`
- `apps/api/src/modules/tenants/tenants.routes.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/app.ts`
- `.env.example`

## 4. Validacao

Comandos executados:

```bash
./node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json
```

Resultado: passou.

```bash
./node_modules/.bin/vitest run src/modules/auth/auth.service.test.ts src/modules/auth/auth.routes.test.ts
```

Resultado: 2 arquivos passaram, 3 testes passaram.

```bash
./node_modules/.bin/vitest run src/modules/auth/auth-duration.unit.test.ts src/modules/operacao/handoffs-rules.unit.test.ts src/modules/auth/auth.service.test.ts src/modules/auth/auth.routes.test.ts
```

Resultado: 4 arquivos passaram, 13 testes passaram.

## 5. Observacoes

- O teste de rate limit foi implementado como teste unitario de rota com `authService` mockado. Isso valida o comportamento real do Fastify/rate-limit sem depender de Postgres/Redis.
- Uma tentativa de rodar o teste em modo integracao (`RUN_API_INTEGRATION_TESTS=1`) falhou porque Postgres e Redis locais nao estavam acessiveis no ambiente de execucao.
- Tokens de portal existentes gravados antes desta onda em texto puro deixam de validar, porque a busca agora compara contra o hash. Isso e esperado para eliminar o vazamento de token persistido.

## 6. Status

Onda 5.1 concluida.
