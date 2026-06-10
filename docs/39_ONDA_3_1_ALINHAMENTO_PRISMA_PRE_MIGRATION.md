# 39. Onda 3.1 - Alinhamento Prisma Pre-Migration

## 1. Objetivo

Esta etapa executa o ajuste minimo identificado no gate de liberacao da migration de `HandoffComercial`: alinhar o manifesto do `apps/api` com a versao de Prisma efetivamente resolvida no lockfile.

## 2. Problema identificado no documento 38

O documento `docs/38_ONDA_3_1_GATE_LIBERACAO_MIGRATION.md` registrou que:

- o lockfile ja estava coerente em `5.22.0` para `prisma` e `@prisma/client`;
- o `apps/api/package.json` ainda declarava `^5.16.0` para ambos;
- isso nao configurava mismatch funcional real entre binario e client instalados;
- mas mantinha ambiguidade de governanca e reproducao antes da migration.

Resumo do problema:

- manifesto do `apps/api` desatualizado em relacao ao lockfile efetivo.

## 3. Ajuste aplicado em `apps/api/package.json`

Foi aplicado o alinhamento minimo abaixo:

```diff
- "@prisma/client": "^5.16.0"
+ "@prisma/client": "5.22.0"

- "prisma": "^5.16.0"
+ "prisma": "5.22.0"
```

Arquivo alterado:

- `apps/api/package.json`

## 4. Confirmacao da versao final declarada

Estado final declarado no manifesto do `apps/api`:

- `@prisma/client`: `"5.22.0"`
- `prisma`: `"5.22.0"`

Conclusao:

- o manifesto agora reflete exatamente a mesma versao resolvida no workspace.

## 5. Confirmacao do estado do lockfile

O `pnpm-lock.yaml` foi auditado e ja estava coerente antes da alteracao do manifesto.

Estado confirmado:

- `@prisma/client`: `5.22.0(prisma@5.22.0)`
- `prisma`: `5.22.0`

Conclusao:

- nao foi necessario executar `pnpm install --lockfile-only`;
- o lockfile ja estava consistente com a versao final declarada.

## 6. `prisma validate`

Validacao executada:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js validate --schema apps/api/prisma/schema.prisma
```

Resultado:

```text
Environment variables loaded from .env
Prisma schema loaded from apps/api/prisma/schema.prisma
The schema at apps/api/prisma/schema.prisma is valid
```

Conclusao:

- `prisma validate` foi executado com sucesso;
- o schema continua valido apos o alinhamento do manifesto.

## 7. Situacao final do alinhamento Prisma/client

Estado final desta etapa:

- manifesto do `apps/api`: alinhado em `5.22.0`;
- lockfile: coerente em `5.22.0`;
- schema: valido;
- nenhuma migration executada;
- nenhum `prisma generate` executado.

Conclusao:

- o problema apontado no documento 38 foi resolvido.

## 8. Decisao para a proxima etapa

Com base no ajuste aplicado nesta etapa:

- a pendencia minima de alinhamento Prisma/client foi resolvida;
- o gate documental de versao deixa de ser bloqueador;
- a Onda 3.1 pode seguir para a proxima etapa controlada de migration do `HandoffComercial`.

Recomendacao objetiva:

**LIBERAR PRÓXIMA ETAPA: migration controlada do HandoffComercial.**

## 9. Observacoes de escopo

Nenhuma destas acoes foi executada nesta etapa:

- migration;
- `prisma generate`;
- endpoint;
- service;
- tela;
- teste;
- alteracao de schema adicional;
- alteracao em modulos comercial, processo, tarefa, documento, contrato, OS, financeiro ou onboarding.

MIGRATION NÃO EXECUTADA.
