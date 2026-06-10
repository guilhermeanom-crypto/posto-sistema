# 40. Onda 3.1 - Migration do Handoff Comercial

## 1. Objetivo

Esta etapa executou a migration controlada da entidade `HandoffComercial` com base no schema e nos gates aprovados da Onda 3.1.

## 2. Nome da migration criada

Migration criada:

- `20260513100800_add_handoff_comercial`

Arquivo gerado:

- `apps/api/prisma/migrations/20260513100800_add_handoff_comercial/migration.sql`

## 3. Comandos executados

### 3.1 Tentativa inicial

Tentativa inicial realizada:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js migrate dev \
  --schema apps/api/prisma/schema.prisma \
  --name add_handoff_comercial \
  --skip-generate
```

Resultado:

- o comando conectou ao banco local;
- mas falhou porque `prisma migrate dev` nao suporta ambiente nao interativo.

Erro retornado:

- `Prisma Migrate has detected that the environment is non-interactive`

### 3.2 Fluxo equivalente controlado adotado

Como substituicao controlada e equivalente para ambiente nao interativo, foram executados:

1. inspeção do estado das migrations:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js migrate status \
  --schema apps/api/prisma/schema.prisma
```

2. geracao do SQL da diferenca entre o banco atual e o schema aprovado:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js migrate diff \
  --from-url "postgresql://posto:posto_dev_secret@localhost:5432/posto_dev" \
  --to-schema-datamodel apps/api/prisma/schema.prisma \
  --script
```

3. aplicacao do SQL da migration:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js db execute \
  --schema apps/api/prisma/schema.prisma \
  --file apps/api/prisma/migrations/20260513100800_add_handoff_comercial/migration.sql
```

4. registro da migration como aplicada no historico do Prisma:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js migrate resolve \
  --schema apps/api/prisma/schema.prisma \
  --applied 20260513100800_add_handoff_comercial
```

5. validacao final do schema:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js validate \
  --schema apps/api/prisma/schema.prisma
```

6. checagem final do estado das migrations:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js migrate status \
  --schema apps/api/prisma/schema.prisma
```

## 4. Resumo do SQL gerado

O SQL gerado contem somente:

- criacao do enum `StatusHandoffComercial`;
- criacao da tabela `handoffs_comerciais`;
- criacao das colunas aprovadas do model `HandoffComercial`;
- criacao dos indices normais do model;
- criacao das foreign keys para:
  - `tenants`
  - `propostas_comerciais`
  - `leads_whatsapp`
  - `empreendimentos`
  - `usuarios` como criador
  - `usuarios` como responsavel comercial
  - `usuarios` como responsavel operacional

Tipos relevantes observados no SQL:

- `TEXT[]` para os campos de arrays saneados;
- `JSONB` para `servicos_resumo` e `origem_snapshot_saneado`;
- `CHAR(2)` para `uf`;
- enums existentes reutilizados para risco, potencial poluidor, origem da proposta e esfera.

## 5. Confirmacoes obrigatorias

### 5.1 Indice parcial SQL manual

Confirmacao:

- **nao entrou indice parcial SQL manual**.

### 5.2 `@@unique` simples em `propostaComercialId`

Confirmacao:

- **nao entrou `@@unique` simples em `propostaComercialId`**;
- nao foi criado nenhum `UNIQUE` simples em `proposta_comercial_id`.

### 5.3 Ausencia de acoplamentos indevidos

Confirmacao:

- **nao houve acoplamento com contrato**;
- **nao houve acoplamento com OS**;
- **nao houve acoplamento com financeiro**;
- **nao houve acoplamento com processo**;
- **nao houve acoplamento com tarefa**;
- **nao houve acoplamento com documento**;
- **nao houve acoplamento com onboarding**.

### 5.4 Campos sensiveis proibidos

Confirmacao:

- nao entrou margem;
- nao entrou custo interno;
- nao entrou valor hora;
- nao entrou metadata bruta;
- nao entrou `inputSnapshot`;
- nao entrou `resultadoSnapshot`;
- nao entrou `snapshotCatalogo`.

## 6. Resultado de `prisma validate`

Comando executado:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js validate \
  --schema apps/api/prisma/schema.prisma
```

Resultado:

```text
The schema at apps/api/prisma/schema.prisma is valid
```

Conclusao:

- `prisma validate` passou com sucesso apos a migration.

## 7. `prisma generate`

Decisao nesta etapa:

- **`prisma generate` nao foi executado**.

Justificativa:

- esta etapa nao criou endpoint, service, tela ou codigo dependente imediato do novo model;
- o objetivo era aplicar a migration controlada e validar o schema;
- gerar client agora nao era estritamente necessario para manter o workspace funcional nesta fase.

## 8. Estado final da migration

Estado confirmado apos execucao:

- 21 migrations encontradas em `prisma/migrations`;
- banco local em `localhost:5432/posto_dev`;
- schema do banco: atualizado;
- historico de migration: atualizado;
- schema Prisma: valido.

Resultado final de status:

- `Database schema is up to date!`

## 9. Riscos remanescentes

Riscos que permanecem apos a migration:

- a regra de um handoff ativo por proposta ainda depende de implementacao na camada de service;
- o indice parcial manual continua adiado para endurecimento futuro, se o projeto optar por isso;
- `servicosResumo` e `origemSnapshotSaneado` ja estao documentados, mas ainda precisam ser respeitados estritamente na implementacao do service;
- `PropostaComercial` segue com pendencias de `raw SQL` no backend comercial;
- o client Prisma ainda nao foi regenerado nesta etapa para expor o model `HandoffComercial` ao codigo.

## 10. Recomendacao para a proxima etapa

Recomendacao objetiva para a proxima etapa:

- iniciar a etapa de implementacao controlada da API/Service do handoff;
- comecar pela camada de service responsavel por:
  - criar handoff a partir de proposta `APROVADA`;
  - aplicar a regra de um handoff ativo por proposta;
  - montar `servicosResumo` e `origemSnapshotSaneado` de forma saneada;
  - registrar auditoria minima.

Antes de codar essa etapa, sera aceitavel executar:

- `prisma generate`, quando o novo model precisar ser consumido pelo codigo.

## 11. Encerramento

**MIGRATION EXECUTADA**
