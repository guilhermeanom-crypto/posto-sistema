# 82. Guia de Testes Integrados da API

## 1. Objetivo

Deixar explicito que as suites atuais de teste em `apps/api/src/modules/**/__tests__` sao testes integrados de rota, com dependencia real de banco PostgreSQL.

Esses testes nao devem ser confundidos com testes unitarios ou suites totalmente hermeticas.

Nesta rodada, uma trilha minima hermetica tambem passou a existir para regras puras da API, via `test:unit`.

## 2. Estado atual

Hoje as suites existentes cobrem principalmente:

- diagnostico comercial;
- propostas comerciais;
- contratos comerciais;
- handoff operacional;
- ordens de servico.

Caracteristicas atuais:

- suites unitarias puras ja cobrem regras isoladas sem banco nem Redis;
- sobem a app Fastify real;
- exercitam login real;
- usam Prisma real;
- dependem de dados seedados no banco;
- o Redis foi desacoplado por mocks nas suites para evitar dependencia acidental de infraestrutura de fila/cache durante a validacao da regra de negocio.

## 3. Dependencias para execucao

Antes de rodar os testes integrados da API, garantir:

1. PostgreSQL disponivel e acessivel pelo `DATABASE_URL`
2. schema migrado
3. seed minima carregada
4. Redis acessivel pelo `REDIS_URL`
5. se a execucao ocorrer em ambiente sandboxado ou restrito, acesso TCP local liberado para `localhost:5432` e `localhost:6379`

Comandos tipicos:

```bash
corepack pnpm --filter @repo/api test:unit
docker compose up -d postgres
corepack pnpm --filter @repo/api db:migrate
corepack pnpm --filter @repo/api db:seed
corepack pnpm --filter @repo/api test
```

## 4. Gate de execucao

As suites foram marcadas como integradas e respeitam a variavel:

```bash
RUN_API_INTEGRATION_TESTS=1
```

Os scripts do pacote `@repo/api` ja setam essa variavel por padrao:

```bash
corepack pnpm --filter @repo/api test:unit
corepack pnpm --filter @repo/api test
corepack pnpm --filter @repo/api test:integration
```

Leitura pratica:

- `test:unit` roda a malha hermetica e deixa as suites integradas em `skip`;
- `test` e `test:integration` ativam deliberadamente a trilha com banco real.

Se alguem rodar `vitest` diretamente sem esse gate, as suites integradas ficam claramente segregadas.

## 5. Falha esperada e mensagem amigavel

Se o banco nao estiver disponivel, os testes agora falham cedo com mensagem objetiva, em vez de seguir ate um erro ruidoso de rota/login.

Objetivo:

- reduzir diagnostico confuso;
- deixar claro que o problema e de infraestrutura de teste, nao necessariamente da regra de negocio.

Observacao importante:

- em ambiente restrito, um bloqueio de socket local pode se manifestar como `P1001` do Prisma;
- antes de tratar isso como bug do sistema, confirmar se o executor consegue abrir conexao TCP local com Postgres e Redis.

## 6. Trilhas atuais

Hoje o pacote `@repo/api` tem dois usos claros:

- `test:unit`: validacao rapida, hermetica, voltada a regras puras;
- `test` / `test:integration`: validacao integrada de rota, com dependencia real de PostgreSQL.

Estado validado em 2026-06-15:

- `test:unit` passou com a malha hermetica isolada;
- `test` passou integralmente com `25` arquivos e `408` testes, desde que a infraestrutura local estivesse acessivel.

Exemplos de regras ja cobertas na trilha unitária:

- parse de duracao de token em auth;
- validacao de transicao e aceite de handoff operacional.

## 7. Proximo nivel recomendado

Para a proxima etapa de maturidade, recomenda-se:

- expandir as suites unitarias puras para outros servicos e regras isoladas;
- criar fixtures de banco mais controladas;
- separar no CI:
  - testes unitarios/hermeticos
  - testes integrados com infra

## 8. Definicao pratica

Regra operacional para o time:

- `apps/api test` hoje significa `teste integrado de rota`;
- se a intencao for validar regra isolada e rapidamente, o ideal e evoluir novas suites unitarias dedicadas;
- enquanto isso, este guia deve ser tratado como contrato oficial da malha de testes atual.
