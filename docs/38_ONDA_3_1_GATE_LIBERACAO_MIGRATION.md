# 38. Onda 3.1 - Gate de Liberacao de Migration

## 1. Objetivo

Este documento formaliza o gate final de liberacao da primeira migration da entidade `HandoffComercial`.

Escopo desta auditoria:

- verificar coerencia entre os documentos 33 a 37;
- confirmar se a modelagem de `HandoffComercial` esta aprovada estruturalmente;
- confirmar se os contratos de `servicosResumo` e `origemSnapshotSaneado` estao fechados;
- confirmar se a regra de handoff ativo unico por proposta esta decidida na camada de service;
- confirmar que a primeira migration nao deve levar indice parcial SQL manual;
- auditar as versoes de `prisma` e `@prisma/client` no workspace;
- recomendar o ajuste minimo antes da migration;
- definir exatamente o escopo da primeira migration;
- definir exatamente o que nao pode entrar na primeira migration.

## 2. Coerencia dos documentos anteriores

Documentos auditados:

- `docs/33_PLANO_ONDA_3_HANDOFF_COMERCIAL_OPERACAO.md`
- `docs/34_ONDA_3_1_MODELAGEM_HANDOFF_OPERACIONAL.md`
- `docs/35_ONDA_3_1_SCHEMA_HANDOFF_COMERCIAL.md`
- `docs/36_ONDA_3_1_REVISAO_FINAL_SCHEMA_HANDOFF.md`
- `docs/37_ONDA_3_1_CONTRATOS_TECNICOS_PRE_MIGRATION.md`

### 2.1 Resultado da checagem

Os documentos estao coerentes entre si nos pontos centrais:

- `HandoffComercial` e a entidade raiz aprovada para a transicao;
- a modelagem permanece desacoplada de contrato, OS, financeiro, processo, tarefa, documento e onboarding;
- `Empreendimento` continua opcional;
- `LeadWhatsApp` continua opcional;
- a regra de um handoff ativo por proposta foi consolidada como responsabilidade inicial da camada de service;
- a primeira migration nao deve carregar indice parcial SQL manual;
- os contratos de `servicosResumo` e `origemSnapshotSaneado` foram fechados;
- os campos sensiveis proibidos permanecem bloqueados.

### 2.2 Refinamento importante desta auditoria

Os documentos 35, 36 e 37 trataram a divergencia Prisma/client como risco relevante. A auditoria atual refinou esse ponto:

- **nao existe mismatch real entre `prisma` e `@prisma/client` instalados no lockfile**;
- ambos estao resolvidos em `5.22.0`;
- o problema remanescente esta no manifesto do `apps/api`, que ainda declara `^5.16.0`.

Conclusao:

- a linha argumentativa dos documentos anteriores continua coerente;
- o risco de versao precisa apenas ser reinterpretado como risco de governanca/reprodutibilidade, e nao como quebra real entre binario e client instalados.

## 3. Status da modelagem estrutural

### 3.1 Aprovacao estrutural

A modelagem de `HandoffComercial` esta aprovada estruturalmente, com:

- enum proprio `StatusHandoffComercial`;
- model proprio `HandoffComercial`;
- relacoes corretas com `Tenant`, `PropostaComercial`, `LeadWhatsApp`, `Empreendimento` e `Usuario`;
- back-relations corretas;
- indices normais adequados para consulta;
- `@map` e `@@map` consistentes com o schema existente;
- compatibilidade confirmada com PostgreSQL;
- validacao em `prisma validate` ja registrada anteriormente.

### 3.2 Gate estrutural

Resultado do gate estrutural:

- **PASSOU**.

## 4. Status dos contratos `Json`

### 4.1 `servicosResumo`

Situacao:

- contrato fechado em `docs/37_ONDA_3_1_CONTRATOS_TECNICOS_PRE_MIGRATION.md`;
- formato enxuto, saneado e orientado a operacao;
- campos sensiveis explicitamente proibidos.

Resultado:

- **PASSOU**.

### 4.2 `origemSnapshotSaneado`

Situacao:

- contrato fechado em `docs/37_ONDA_3_1_CONTRATOS_TECNICOS_PRE_MIGRATION.md`;
- possui shape conhecido;
- inclui `schemaVersion`;
- carrega apenas dados resumidos, publicos e operacionais.

Resultado:

- **PASSOU**.

### 4.3 Politica de `Json`

Situacao:

- a politica oficial agora proibe uso de `Json` como espelho bruto da proposta ou do diagnostico;
- exige montagem manual e shape conhecido;
- veda `inputSnapshot`, `resultadoSnapshot`, `snapshotCatalogo`, metadata bruta e precificacao sensivel.

Resultado:

- **PASSOU**.

## 5. Regra de handoff ativo unico por proposta

### 5.1 Estado da decisao

Decisao consolidada:

- manter no maximo um handoff ativo por proposta e tenant;
- aplicar a garantia inicialmente na camada de service;
- nao criar `@@unique` simples em `propostaComercialId`.

Estados ativos consolidados:

- `AGUARDANDO_HANDOFF`
- `EM_TRIAGEM_OPERACIONAL`
- `AGUARDANDO_DOCUMENTOS`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `PAUSADO`

Estados nao ativos:

- `CANCELADO`
- `CONCLUIDO`

Resultado do gate:

- **PASSOU**.

## 6. Politica para indice parcial SQL manual

Decisao consolidada:

- a primeira migration **nao** deve conter indice parcial SQL manual;
- endurecimento por indice parcial fica para fase posterior, caso o projeto formalize esse uso.

Resultado do gate:

- **PASSOU**.

## 7. Auditoria de versoes Prisma

### 7.1 Arquivos auditados

- `package.json` raiz
- `apps/api/package.json`
- `pnpm-lock.yaml`

### 7.2 Resultado por arquivo

#### Raiz

No `package.json` raiz:

- nao existe declaracao direta de `prisma`;
- nao existe declaracao direta de `@prisma/client`.

Conclusao:

- sem conflito na raiz;
- o controle de Prisma relevante para esta etapa esta em `apps/api`.

#### `apps/api/package.json`

Declaracoes encontradas:

- `@prisma/client`: `^5.16.0`
- `prisma`: `^5.16.0`

Conclusao:

- manifesto declara faixa iniciando em `5.16.x`.

#### `pnpm-lock.yaml`

Resolucao encontrada:

- `@prisma/client`: `5.22.0(prisma@5.22.0)`
- `prisma`: `5.22.0`

Conclusao:

- lockfile esta coerente;
- Prisma CLI e Prisma Client resolvidos na mesma versao.

### 7.3 Existe divergencia real de versao Prisma/client?

Resposta objetiva:

- **nao existe divergencia real entre `prisma` e `@prisma/client` instalados**;
- ambos estao alinhados em `5.22.0` no lockfile.

Existe, porem, uma divergencia de governanca entre:

- o manifesto do `apps/api` que declara `^5.16.0`; e
- a resolucao efetiva do lockfile em `5.22.0`.

Essa diferenca nao caracteriza mismatch funcional imediato entre client e binario, mas ainda representa:

- ambiguidade de manutencao;
- risco de reproducao diferente em ambiente novo;
- chance de leituras equivocadas sobre a versao efetivamente suportada.

## 8. Ajuste minimo recomendado antes da migration

### 8.1 Ajuste minimo

Antes de liberar a migration, o ajuste minimo recomendado e:

- atualizar `apps/api/package.json` para declarar explicitamente:
  - `@prisma/client: "5.22.0"`
  - `prisma: "5.22.0"`

### 8.2 Motivo

Esse ajuste:

- elimina ambiguidade entre manifesto e lockfile;
- cristaliza a versao que ja esta instalada;
- reduz risco de reproducao diferente em outro ambiente;
- deixa a etapa de migration mais auditavel.

### 8.3 O que nao e necessario concluir aqui

Nesta etapa de gate, nao e necessario:

- executar `prisma generate`;
- executar migration;
- implementar service.

## 9. Escopo exato da primeira migration

A primeira migration de `HandoffComercial` deve conter somente:

1. criacao do enum `StatusHandoffComercial`;
2. criacao da tabela `handoffs_comerciais`;
3. colunas do model `HandoffComercial` conforme schema aprovado;
4. foreign keys para:
   - `tenant_id`
   - `proposta_comercial_id`
   - `lead_whatsapp_id`
   - `empreendimento_id`
   - `criado_por_id`
   - `responsavel_comercial_id`
   - `responsavel_operacional_id`
5. indices normais aprovados no schema;
6. `@@map` e `@map` refletidos no SQL gerado naturalmente pelo Prisma.

## 10. O que NAO pode entrar na primeira migration

Nao pode entrar:

- indice parcial SQL manual;
- trigger;
- check customizado de unicidade ativa;
- `@@unique` simples em `propostaComercialId`;
- qualquer alteracao em `PropostaComercial` alem do necessario para convivio relacional no schema;
- qualquer alteracao em regra comercial;
- qualquer acoplamento com contrato;
- qualquer acoplamento com OS;
- qualquer acoplamento com financeiro;
- qualquer acoplamento com processo;
- qualquer acoplamento com tarefa;
- qualquer acoplamento com documento;
- qualquer acoplamento com onboarding;
- qualquer coluna para margem, custo, valor hora, metadata bruta, `inputSnapshot`, `resultadoSnapshot` ou `snapshotCatalogo`;
- qualquer automacao de criacao de `Empreendimento`.

## 11. Resultado do gate

### 11.1 Resumo dos gates

- coerencia documental: **PASSOU**
- modelagem estrutural: **PASSOU**
- contrato de `servicosResumo`: **PASSOU**
- contrato de `origemSnapshotSaneado`: **PASSOU**
- politica de `Json`: **PASSOU**
- regra de handoff ativo unico no service: **PASSOU**
- decisao de nao usar indice parcial na primeira migration: **PASSOU**
- auditoria de versao Prisma/client instalada: **PASSOU**
- alinhamento manifesto/lockfile: **PENDENTE**

### 11.2 Decisao final

**B) MANTER MIGRATION BLOQUEADA**

Justificativa objetiva:

- nao existe mismatch real entre `prisma` e `@prisma/client` instalados;
- porem o manifesto do `apps/api` ainda nao foi ajustado para refletir a versao efetivamente resolvida no lockfile;
- como este documento e o gate de liberacao formal, o ajuste minimo de alinhamento deve acontecer antes da migration para remover ambiguidade operacional.

Conclusao executiva:

- a modelagem do handoff esta pronta;
- os contratos tecnicos estao fechados;
- o escopo da primeira migration esta definido;
- a migration deve permanecer bloqueada ate o ajuste minimo de versao em `apps/api/package.json`.

MIGRATION NÃO EXECUTADA.
