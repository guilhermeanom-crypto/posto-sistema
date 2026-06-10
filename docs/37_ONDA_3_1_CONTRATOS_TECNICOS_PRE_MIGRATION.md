# 37. Onda 3.1 - Contratos Tecnicos Pre-Migration

## 1. Objetivo

Este documento fecha as decisoes tecnicas pendentes da Onda 3.1 antes de qualquer liberacao de migration para `HandoffComercial`.

Escopo deliberado nesta etapa:

- regra final para impedir mais de um handoff ativo por proposta;
- decisao sobre indice parcial SQL manual na primeira migration;
- contrato exato de `servicosResumo`;
- contrato exato de `origemSnapshotSaneado`;
- politica de uso de `Json` sem virar payload bruto;
- politica para `prisma generate`;
- registro do risco de divergencia entre Prisma declarado e client instalado;
- checklist objetivo para liberar migration na proxima etapa.

Fora de escopo nesta etapa:

- migration;
- endpoint;
- service;
- tela;
- teste;
- onboarding;
- tarefa automatica;
- processo automatico.

## 2. Decisao final sobre handoff ativo por proposta

### 2.1 Decisao

A regra oficial da Onda 3.1 sera:

- **manter no maximo um `HandoffComercial` ativo por proposta dentro do tenant**;
- **implementar essa garantia inicialmente na camada de service**;
- **nao criar `@@unique` simples em `propostaComercialId`**.

### 2.2 Motivacao

Um `@@unique([tenantId, propostaComercialId])` simples impediria historico legitimo de:

- reabertura posterior;
- revisao de handoff;
- novo handoff apos cancelamento ou conclusao do anterior.

Como a modelagem aprovada admite historico, a unicidade precisa ser:

- por proposta;
- por tenant;
- apenas para estados ativos.

### 2.3 Estados considerados ativos

Para efeito de bloqueio de duplicidade, considerar ativos:

- `AGUARDANDO_HANDOFF`
- `EM_TRIAGEM_OPERACIONAL`
- `AGUARDANDO_DOCUMENTOS`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `PAUSADO`

Estados nao ativos:

- `CANCELADO`
- `CONCLUIDO`

### 2.4 Regra de service recomendada

Na criacao do handoff, o service devera:

1. validar que a proposta esta em `APROVADA`;
2. buscar handoff existente no mesmo tenant para a mesma proposta com status ativo;
3. bloquear criacao se encontrar handoff ativo;
4. permitir criacao apenas se nao existir handoff ativo anterior.

Conclusao:

- essa e a estrategia oficial inicial;
- o banco podera reforcar depois, mas nao sera a primeira linha de defesa na Onda 3.1.

## 3. Decisao sobre indice parcial SQL manual na primeira migration

### 3.1 Decisao

A **primeira migration do handoff nao deve conter indice parcial SQL manual**.

### 3.2 Justificativa

Apesar de o projeto usar arquivos `migration.sql`, isso por si so nao significa que o fluxo de manutencao ja esteja formalmente pronto para:

- SQL manual de endurecimento;
- revisao operacional de indice parcial;
- alinhamento entre schema Prisma, SQL manual e client gerado.

Somado a isso, ainda existem pendencias abertas:

- divergencia de versoes Prisma;
- client nao sincronizado com `HandoffComercial`;
- pendencia de `raw SQL` em `PropostaComercial`;
- necessidade de estabilizar primeiro o contrato dos campos `Json`.

### 3.3 Posicao recomendada

Sequencia recomendada:

1. primeira migration: criar enum, tabela, FKs e indices normais do handoff;
2. primeira implementacao: garantir unicidade ativa na camada de service;
3. fase posterior de endurecimento: avaliar indice parcial manual em migration de hardening, se o fluxo de SQL customizado estiver aprovado.

### 3.4 Indice parcial futuro recomendado

Se o projeto formalizar o uso de SQL manual em migration futura, o indice alvo recomendado continua sendo:

```sql
CREATE UNIQUE INDEX uk_handoffs_comerciais_proposta_ativa
ON handoffs_comerciais (tenant_id, proposta_comercial_id)
WHERE status IN (
  'AGUARDANDO_HANDOFF',
  'EM_TRIAGEM_OPERACIONAL',
  'AGUARDANDO_DOCUMENTOS',
  'EM_PLANEJAMENTO',
  'EM_EXECUCAO',
  'PAUSADO'
);
```

Conclusao:

- **nao incluir esse SQL na primeira migration**;
- **reavaliar em subetapa posterior de endurecimento**.

## 4. Contrato exato de `servicosResumo`

### 4.1 Formato oficial

Formato obrigatorio aprovado:

```ts
type ServicosResumoHandoff = Array<{
  itemId?: string;
  nome: string;
  categoria?: string;
  quantidade?: number;
  unidade?: string;
  escopoAprovado?: string;
  observacaoOperacional?: string;
}>;
```

### 4.2 Origem dos dados

`servicosResumo` deve ser montado exclusivamente a partir de itens aprovados e saneados da `PropostaComercial`.

Fonte permitida:

- `ItemProposta`
- campos publicos da proposta
- complemento operacional curto adicionado no proprio handoff, quando aplicavel

### 4.3 Regras de preenchimento

- `itemId`: opcional, usar quando houver rastreabilidade com `ItemProposta.id`
- `nome`: obrigatorio, derivado do nome comercial do servico aprovado
- `categoria`: opcional, derivada da classificacao visivel do servico
- `quantidade`: opcional, quando fizer sentido operacional
- `unidade`: opcional, usar apenas valor semantico simples como `un`, `licenca`, `posto`, `vistoria`
- `escopoAprovado`: opcional, descricao curta do que foi efetivamente aprovado
- `observacaoOperacional`: opcional, somente observacao operacional resumida e nao sensivel

### 4.4 Campos proibidos dentro de `servicosResumo`

Nao incluir:

- `precoMinimoUnitario`
- `precoBaseUnitario`
- `precoMaximoUnitario`
- `precoAplicadoUnitario`
- `valorMinimoLinha`
- `valorBaseLinha`
- `valorMaximoLinha`
- `valorAplicadoLinha`
- `custoInternoEstimado`
- `margemLucroAlvo`
- `valorReferenciaHora`
- `snapshotCatalogo`
- `metadata`
- qualquer identificador tecnico interno de precificacao

### 4.5 Politica de tamanho e forma

- armazenar somente os itens relevantes para entrada operacional;
- evitar texto longo em `escopoAprovado` e `observacaoOperacional`;
- preferir listas pequenas, estaveis e auditaveis;
- nao transformar `servicosResumo` em espelho integral de `ItemProposta`.

## 5. Contrato exato de `origemSnapshotSaneado`

### 5.1 Objetivo

`origemSnapshotSaneado` deve congelar o contexto minimo e publico da origem do handoff sem carregar payload bruto comercial.

### 5.2 Formato oficial recomendado

```ts
type OrigemSnapshotSaneadoHandoff = {
  schemaVersion: 1;
  proposta: {
    id: string;
    numero: string;
    origem: 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL';
    statusOrigem: 'APROVADA';
    dataAprovacao?: string | null;
    dataValidade?: string | null;
  };
  contato: {
    nomeLead?: string | null;
    empresaLead?: string | null;
    documentoLead?: string | null;
    emailContato?: string | null;
    telefoneContato?: string | null;
    municipio?: string | null;
    uf?: string | null;
  };
  referencias: {
    tenantId: string;
    leadWhatsAppId?: string | null;
    empreendimentoId?: string | null;
    propostaComercialId: string;
  };
  diagnostico: {
    cnaePrincipalCodigo?: string | null;
    cnaePrincipalDescricao?: string | null;
    riscoNivel?: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' | null;
    riscoScore?: number | null;
    potencialPoluidor?: 'BAIXO' | 'MEDIO' | 'ALTO' | null;
    licenciamentoTipo?: string | null;
    orgaoCompetente?: string | null;
    esfera?: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | null;
    alertasResumo?: string[];
    proximosPassosResumo?: string[];
  };
  comercial: {
    observacoesLiberadas?: string | null;
  };
};
```

### 5.3 Regras de uso

- `schemaVersion` e obrigatorio para permitir evolucao controlada do contrato;
- `statusOrigem` deve refletir o status no momento do handoff;
- `referencias` guardam somente IDs necessarios para rastreabilidade;
- `diagnostico` deve conter apenas resumo tecnico e publico;
- `comercial.observacoesLiberadas` deve conter somente trecho explicitamente liberado para operacao.

### 5.4 Campos proibidos dentro de `origemSnapshotSaneado`

Nao incluir:

- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- `observacoesInternas`
- estrutura integral da proposta
- estrutura integral do diagnostico
- arrays integrais de itens com precificacao
- metadata bruta
- margem, custo ou valor hora
- qualquer anexo binario

## 6. Politica de uso de `Json` sem virar payload bruto

### 6.1 Principio geral

Campos `Json` em `HandoffComercial` nao podem funcionar como escape hatch para copiar payloads inteiros do comercial.

### 6.2 Politica oficial

Para `servicosResumo` e `origemSnapshotSaneado`, adotar obrigatoriamente:

- shape conhecido e documentado;
- sem campos livres arbitrarios;
- sem append de blocos nao mapeados;
- sem copia de snapshots brutos;
- sem metadata tecnica de precificacao;
- sem dados sensiveis nao liberados;
- com versionamento explicito quando o contrato puder evoluir.

### 6.3 Regra de governanca

Toda alteracao futura nesses contratos deve:

1. atualizar a documentacao tecnica;
2. explicitar novos campos;
3. justificar por que o campo e operacional e saneado;
4. manter compatibilidade retroativa ou versionar o shape.

### 6.4 Regra pratica de implementacao futura

Na implementacao do service:

- montar manualmente o objeto `Json`;
- nunca serializar a proposta inteira;
- nunca serializar o diagnostico inteiro;
- nunca serializar objetos Prisma completos.

## 7. Politica para `prisma generate`

### 7.1 Decisao

`prisma generate` **nao deve ser executado em etapas documentais ou de pre-modelagem**.

### 7.2 Momento correto

`prisma generate` deve ocorrer somente quando todos os itens abaixo forem verdadeiros:

- schema aprovado;
- migration aprovada;
- versoes Prisma alinhadas no workspace;
- branch pronta para implementacao que dependa do novo model;
- expectativa clara de uso do client gerado no codigo.

### 7.3 Ordem recomendada na proxima etapa executavel

Sequencia recomendada:

1. alinhar versoes de `prisma` e `@prisma/client`;
2. revisar schema final;
3. criar migration;
4. aplicar `prisma generate`;
5. entao iniciar implementacao de service/API.

### 7.4 O que nao fazer

- nao usar `generate` como substituto de aprovacao de schema;
- nao gerar client com versoes divergentes sem antes alinhar o workspace;
- nao gerar client antes da decisao sobre migration.

## 8. Risco da divergencia entre Prisma declarado e client instalado

### 8.1 Estado observado

Estado atual identificado:

- `apps/api/package.json` declara `prisma` e `@prisma/client` em `^5.16.0`;
- o client presente no workspace foi identificado em `5.22.0`.

### 8.2 Risco tecnico

Essa divergencia pode gerar:

- comportamento diferente entre schema e client;
- geracao de tipos com versao diferente da esperada pelo pacote;
- ruido de debug em migrations, generate e runtime;
- inseguranca na reproducao da proxima etapa.

### 8.3 Posicao oficial

Antes da liberacao da migration de `HandoffComercial`, deve existir:

- alinhamento explicito de versao Prisma;
- confirmacao de que o workspace inteiro esta usando a mesma linha de versao.

### 8.4 Recomendacao pratica

Tratar o alinhamento de versao como pre-requisito obrigatorio da proxima etapa de migration, nao como detalhe opcional.

## 9. Checklist objetivo para liberar migration

Antes de liberar a proxima etapa de migration, confirmar todos os itens abaixo:

1. `HandoffComercial` esta aprovado estruturalmente.
2. `StatusHandoffComercial` esta aprovado sem novas alteracoes.
3. Regra de um handoff ativo por proposta esta aprovada na camada de service.
4. Foi decidido formalmente que a primeira migration nao levara indice parcial manual.
5. `servicosResumo` esta aprovado com o contrato fechado deste documento.
6. `origemSnapshotSaneado` esta aprovado com o contrato fechado deste documento.
7. Politica de `Json` saneado esta aprovada.
8. Foi decidido quando `prisma generate` sera executado.
9. As versoes de `prisma` e `@prisma/client` foram alinhadas no workspace.
10. O impacto do `raw SQL` em `PropostaComercial` foi aceito para a proxima etapa de implementacao.
11. Nao ha exigencia nova de acoplamento com contrato, OS, financeiro, processo, tarefa, documento ou onboarding.
12. Foi confirmada a intencao de nao criar `Empreendimento` automaticamente.

## 10. Recomendacao executiva

Recomendacao final desta etapa:

- **ainda nao liberar migration**.

Motivo:

- a modelagem do schema ja esta madura;
- os contratos tecnicos de `Json` agora estao fechados;
- mas a migration deve esperar o fechamento operacional de dois pontos de gate:
  - alinhamento de versao Prisma/client;
  - aprovacao final da estrategia de execucao da proxima etapa com service-first para unicidade ativa.

Conclusao:

- documentacao pre-migration: concluida;
- migration: permanece bloqueada ate a proxima aprovacao executiva/tecnica.

MIGRATION NÃO EXECUTADA.
