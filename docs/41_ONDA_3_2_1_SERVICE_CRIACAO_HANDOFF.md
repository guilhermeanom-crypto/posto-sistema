# 41. Onda 3.2.1 - Service de Criacao do Handoff

## 1. Objetivo

Esta subetapa inicia a Onda 3.2 com a implementacao controlada da camada de service para criacao de `HandoffComercial` a partir de uma proposta comercial aprovada.

Escopo executado:

- tentativa de expor o novo model via `prisma generate`;
- criacao da estrutura inicial do modulo `operacao/handoffs`;
- implementacao do service de criacao do handoff;
- implementacao dos helpers internos solicitados;
- validacao por typecheck do backend.

## 2. Arquivos criados e alterados

Arquivos criados:

- `apps/api/src/modules/operacao/handoffs.types.ts`
- `apps/api/src/modules/operacao/handoffs.service.ts`
- `docs/41_ONDA_3_2_1_SERVICE_CRIACAO_HANDOFF.md`

Arquivos alterados nesta subetapa:

- nenhum outro modulo de dominio foi alterado;
- nenhuma route publica foi criada;
- nenhum schema Prisma adicional foi alterado.

## 3. `prisma generate`

### 3.1 Execucao

`prisma generate` foi executado nesta subetapa porque a implementacao do service dependia da exposicao do model `HandoffComercial` ao codigo.

Comando utilizado:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js generate --schema apps/api/prisma/schema.prisma
```

### 3.2 Resultado prático

O comando foi executado sem erro, mas o artifact de client disponivel nesta sessao nao passou a expor `HandoffComercial` de forma tipada e consumivel no `@prisma/client` resolvido pelo app.

Consequencia:

- a leitura de `PropostaComercial` e `ItemProposta` continuou usando Prisma Client normalmente;
- a leitura e gravacao de `handoffs_comerciais` nesta subetapa foi implementada com SQL pontual via `prisma.$queryRaw`, mantendo o escopo controlado.

Conclusao:

- `prisma generate` **foi executado**;
- ainda assim, a implementacao precisou contornar a indisponibilidade pratica do model gerado neste ambiente.

## 4. Funcao principal criada

Funcao principal implementada:

- `HandoffsService.criar(input: CriarHandoffComercialInput)`

Arquivo:

- `apps/api/src/modules/operacao/handoffs.service.ts`

Entrada esperada:

- `tenantId`
- `propostaComercialId`
- `usuarioId`

Saida:

- retorna o handoff criado em formato tipado por `HandoffComercialCriado`.

## 5. Regras implementadas

### 5.1 Busca e validacao da proposta

O service:

- busca a proposta dentro do tenant informado;
- carrega somente os campos necessarios para montar o handoff;
- carrega `diagnostico` resumido;
- carrega `itens` ativos da proposta.

Se a proposta nao existir no tenant:

- lanca `NotFoundError`.

### 5.2 Validacao de proposta aprovada

Helper implementado:

- `assertPropostaAprovada`

Regra aplicada:

- a proposta precisa estar em `APROVADA`;
- qualquer outro status bloqueia a criacao do handoff.

Se a proposta nao estiver aprovada:

- lanca `ConflictError` com codigo `PROPOSTA_NAO_APROVADA`.

### 5.3 Regra de handoff ativo unico

Helper implementado:

- `assertSemHandoffAtivo`

Status ativos considerados:

- `AGUARDANDO_HANDOFF`
- `EM_TRIAGEM_OPERACIONAL`
- `AGUARDANDO_DOCUMENTOS`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `PAUSADO`

Regra aplicada:

- antes de inserir, o service consulta `handoffs_comerciais` no mesmo tenant e proposta;
- se encontrar handoff ativo, bloqueia a criacao.

Se houver handoff ativo:

- lanca `ConflictError` com codigo `HANDOFF_ATIVO_EXISTENTE`.

### 5.4 Responsavel comercial

Regra aplicada:

- `responsavelComercialId` e preenchido a partir de `proposta.criadoPorId`;
- isso segue a decisao da Onda 3.1 enquanto nao existe owner comercial formal.

### 5.5 Criacao do handoff

O service cria o registro com:

- `status = AGUARDANDO_HANDOFF`
- `statusPropostaOrigem = APROVADA`
- `origemProposta` herdada da proposta
- referencias opcionais a `leadWhatsAppId` e `empreendimentoId`
- snapshot saneado e servicos resumidos conforme contratos da Onda 3.1

### 5.6 Comportamentos explicitamente nao implementados

O service **nao**:

- altera a proposta original;
- cria `Empreendimento`;
- cria `Tarefa`;
- cria `Processo`;
- cria `Documento`;
- dispara `onboarding`.

## 6. Helpers internos implementados

Helpers implementados no service:

- `buildServicosResumo`
- `buildOrigemSnapshotSaneado`
- `assertPropostaAprovada`
- `assertSemHandoffAtivo`

Helpers auxiliares adicionais:

- `normalizeNullableText`
- `toIsoDate`
- `textArraySql`
- `mapHandoffRow`

## 7. Como `servicosResumo` foi montado

Implementacao aplicada:

- origem: `itens` ativos da proposta;
- cada item gera objeto saneado no formato contratado pela Onda 3.1;
- foram usados:
  - `itemId`
  - `nome`
  - `categoria`
  - `quantidade`
  - `escopoAprovado` derivado de `observacaoLinha`, quando presente

Campos explicitamente nao copiados:

- precificacao;
- custo interno;
- margem;
- valor hora;
- snapshot de catalogo;
- metadata bruta.

## 8. Como `origemSnapshotSaneado` foi montado

Implementacao aplicada:

- `schemaVersion: 1`
- bloco `proposta` com:
  - `id`
  - `numero`
  - `origem`
  - `statusOrigem`
  - `dataAprovacao`
  - `dataValidade`
- bloco `contato` com dados saneados de lead/contato
- bloco `referencias` com IDs minimos de rastreabilidade
- bloco `diagnostico` com contexto tecnico resumido
- bloco `comercial` com `observacoesLiberadas`

Campos explicitamente nao copiados:

- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- `observacoesInternas`
- payload bruto integral da proposta
- payload bruto integral do diagnostico

## 9. Confirmacoes de nao acoplamento indevido

Confirmacoes desta subetapa:

- nao houve endpoint publico;
- nao houve tela;
- nao houve botao de frontend;
- nao houve criacao automatica de tarefa;
- nao houve criacao automatica de processo;
- nao houve criacao automatica de documento;
- nao houve disparo de onboarding;
- nao houve alteracao de regra comercial da proposta;
- nao houve acoplamento com contrato, OS ou financeiro.

## 10. Auditoria

O service registra evento de auditoria:

- `handoff_comercial.criado`

Dados registrados:

- `tenantId`
- `usuarioId`
- `usuarioNome`
- `usuarioEmail`
- `usuarioPerfil`
- `entidadeId`
- `propostaComercialId`
- `responsavelComercialId`
- `status`

## 11. Validacoes executadas

Validacao executada:

```bash
node node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --noEmit
```

Resultado:

- typecheck do backend concluiu com sucesso apos um ajuste de tipagem no helper transacional.

Observacao:

- nenhum teste de API foi criado nesta subetapa;
- nenhum build adicional foi necessario.

## 12. Pendencias para a proxima etapa

Pendencias abertas para a proxima subetapa:

1. Expor o service por route controlada da Onda 3.2.
2. Decidir se sera necessario insistir no alinhamento do artifact gerado do Prisma Client para uso direto de `prisma.handoffComercial`.
3. Criar schemas/contratos de entrada HTTP apenas quando a rota for aberta.
4. Implementar leitura detalhada e listagem de handoffs.
5. Garantir cobertura de testes da regra de handoff ativo unico.

## 13. Encerramento

**SERVICE DE CRIAÇÃO IMPLEMENTADO**
