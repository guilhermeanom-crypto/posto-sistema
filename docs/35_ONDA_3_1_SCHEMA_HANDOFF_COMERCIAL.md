# 35. Onda 3.1 - Schema do Handoff Comercial

## 1. Objetivo desta etapa

Esta etapa prepara a modelagem tecnica de `HandoffComercial` diretamente no `schema.prisma`, sem criar endpoints, telas, automacoes ou migration.

Escopo executado:

- auditoria do `apps/api/prisma/schema.prisma`;
- auditoria dos enums e modelos relacionados;
- proposta e insercao do enum `StatusHandoffComercial`;
- proposta e insercao do model `HandoffComercial`;
- definicao das relacoes Prisma com `Tenant`, `PropostaComercial`, `LeadWhatsApp`, `Empreendimento` e `Usuario`;
- definicao de indices de consulta;
- documentacao da estrategia para impedir mais de um handoff ativo por proposta.

Escopo que permaneceu explicitamente fora:

- migration;
- `prisma generate`;
- endpoints;
- telas;
- tarefas automaticas;
- processo automatico;
- integracao com contrato, OS ou financeiro;
- disparo de onboarding;
- criacao automatica de empreendimento.

## 2. Auditoria do schema atual

### 2.1 Enums auditados

Enums existentes verificados no schema:

- `StatusPropostaComercial`
- `OrigemPropostaComercial`
- `NivelRiscoComercial`
- `PotencialPoluidorComercial`
- `EsferaRegulatoria`

Conclusao:

- os enums existentes sao suficientes para ancorar o snapshot saneado do handoff;
- faltava apenas um enum proprio para o ciclo operacional da transicao.

### 2.2 Modelos auditados

Modelos existentes verificados:

- `Tenant`
- `Usuario`
- `PropostaComercial`
- `LeadWhatsApp`
- `Empreendimento`

Achados principais:

- `PropostaComercial` ja carrega os dados comerciais e o vinculo com `DiagnosticoComercial`, `LeadWhatsApp`, `Empreendimento` opcional e `Usuario`;
- `Tenant` e `Usuario` ja suportam bem a adicao de relacoes novas;
- `LeadWhatsApp` e `Empreendimento` podem ser referencias opcionais do handoff sem obrigar duplicacao;
- nao existia entidade de transicao entre proposta aprovada e operacao.

### 2.3 Pendencia atual em `PropostaComercial`

O backend comercial continua com uso relevante de `raw SQL` em `apps/api/src/modules/comercial/propostas.service.ts`, incluindo:

- criacao;
- listagem;
- detalhe;
- atualizacao;
- persistencia de itens.

Isso confirma a observacao ja registrada nos documentos 33 e 34:

- existe pendencia real de implementacao em `PropostaComercial`;
- essa pendencia nao bloqueia a modelagem do schema;
- ela aumenta o cuidado exigido antes de qualquer migration seguida de implementacao da API.

## 3. Alteracoes aplicadas ao `schema.prisma`

### 3.1 Novo enum

Foi inserido:

```prisma
enum StatusHandoffComercial {
  AGUARDANDO_HANDOFF
  EM_TRIAGEM_OPERACIONAL
  AGUARDANDO_DOCUMENTOS
  EM_PLANEJAMENTO
  EM_EXECUCAO
  PAUSADO
  CANCELADO
  CONCLUIDO
}
```

Motivo:

- separar o ciclo operacional do handoff do ciclo comercial da proposta.

### 3.2 Novo model

Foi inserido o model `HandoffComercial` com os seguintes grupos de campos:

- identificacao e tenant;
- referencia obrigatoria a `PropostaComercial`;
- referencias opcionais a `LeadWhatsApp` e `Empreendimento`;
- tres papeis de usuario distintos:
  - criador;
  - responsavel comercial;
  - responsavel operacional;
- status proprio;
- snapshot saneado de origem;
- campos resumidos de contexto tecnico/comercial liberado;
- pendencias e observacoes operacionais;
- timestamps de assumido, concluido e cancelado.

Campos centrais inseridos:

- `tenantId`
- `propostaComercialId`
- `leadWhatsAppId`
- `empreendimentoId`
- `criadoPorId`
- `responsavelComercialId`
- `responsavelOperacionalId`
- `status`
- `statusPropostaOrigem`
- `origemProposta`
- `numeroProposta`
- `dataAprovacaoProposta`
- `dataValidadeProposta`
- `nomeLead`
- `empresaLead`
- `documentoLead`
- `emailContato`
- `telefoneContato`
- `municipio`
- `uf`
- `cnaePrincipalCodigo`
- `cnaePrincipalDescricao`
- `riscoNivel`
- `riscoScore`
- `potencialPoluidor`
- `licenciamentoTipo`
- `orgaoCompetente`
- `esfera`
- `alertasResumo`
- `proximosPassosResumo`
- `observacoesLiberadas`
- `servicosResumo`
- `origemSnapshotSaneado`
- `pendenciasOperacionais`
- `observacoesOperacionais`
- `assumidoEm`
- `concluidoEm`
- `canceladoEm`
- `criadoEm`
- `atualizadoEm`

## 4. Relacoes Prisma definidas

### 4.1 Relacoes do `HandoffComercial`

Foram definidas:

- `tenant -> Tenant`
- `propostaComercial -> PropostaComercial`
- `leadWhatsApp -> LeadWhatsApp?`
- `empreendimento -> Empreendimento?`
- `criadoPor -> Usuario`
- `responsavelComercial -> Usuario`
- `responsavelOperacional -> Usuario?`

### 4.2 Back-relations adicionadas

Foram adicionadas relacoes reversas em:

- `Tenant.handoffsComerciais`
- `Usuario.handoffsComerciaisCriados`
- `Usuario.handoffsComerciaisComercial`
- `Usuario.handoffsComerciaisOperacional`
- `LeadWhatsApp.handoffsComerciais`
- `Empreendimento.handoffsComerciais`
- `PropostaComercial.handoffs`

Observacao:

- nenhuma relacao com `Contrato`, `OS`, `Financeiro`, `Processo`, `Tarefa` ou `onboarding` foi criada.

## 5. Indices e constraints recomendadas

### 5.1 Indices inseridos no model

Foram adicionados:

- `@@index([tenantId, status, criadoEm(sort: Desc)])`
- `@@index([tenantId, propostaComercialId, status])`
- `@@index([tenantId, leadWhatsAppId, status])`
- `@@index([tenantId, empreendimentoId, status])`
- `@@index([tenantId, responsavelComercialId, status])`
- `@@index([tenantId, responsavelOperacionalId, status])`

Objetivo:

- acelerar listagem operacional por tenant;
- facilitar filtros por proposta, responsavel, lead e empreendimento;
- preparar consultas de regra de unicidade de handoff ativo.

### 5.2 Constraint de unicidade de handoff ativo

Nao foi criada no Prisma uma `@@unique` em `propostaComercialId`, porque isso bloquearia historico futuro de reabertura/revisao.

Recomendacao aprovada para esta fase:

- impedir mais de um handoff ativo por proposta prioritariamente na camada de servico;
- considerar um indice parcial no banco quando a migration for aprovada.

Indice parcial recomendado para futura migration manual:

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

Observacao tecnica:

- Prisma schema nao expressa bem esse tipo de unicidade parcial;
- por isso a regra deve nascer primeiro no servico, com eventual reforco posterior por SQL manual na migration.

## 6. Dados explicitamente nao modelados no handoff

Nao foram introduzidos campos para:

- margem;
- custo interno;
- valor hora;
- metadata bruta;
- `inputSnapshot`;
- `resultadoSnapshot`;
- `snapshotCatalogo`;
- contrato;
- ordem de servico;
- financeiro;
- onboarding;
- processo automatico;
- tarefa automatica.

Tambem nao foi criada nenhuma regra de autocriacao de `Empreendimento`.

## 7. Estado do Prisma Client

### 7.1 Validacao do schema

Foi executada validacao de schema com o binario Prisma presente no workspace:

- resultado: `The schema at apps/api/prisma/schema.prisma is valid`

### 7.2 Estado de sincronizacao do client

Diagnostico atual:

- existe client gerado no workspace raiz em `node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/...`;
- esse client ja conhece `PropostaComercial` e os enums comerciais auditados;
- porem, depois desta modelagem, o client nao esta sincronizado com o novo `HandoffComercial`, porque `prisma generate` nao foi executado nesta etapa.

Risco adicional observado:

- `apps/api/package.json` declara `prisma` e `@prisma/client` em `^5.16.0`;
- o client presente no workspace esta em `5.22.0`;
- isso sugere divergencia de versao entre declaracao do pacote e artefato efetivamente instalado/gerado.

Conclusao operacional:

- o schema esta valido;
- o client atual nao deve ser considerado sincronizado com a nova modelagem;
- antes de implementar API ou migration definitiva, vale alinhar versao de Prisma e executar `generate` de forma controlada.

## 8. Riscos desta alteracao

| Risco | Impacto | Mitigacao |
|---|---|---|
| Divergencia entre schema novo e client gerado atual | Alto | Executar `prisma generate` somente apos aprovacao da modelagem |
| Divergencia de versao Prisma `5.16.x` vs client `5.22.x` | Medio/Alto | Alinhar dependencias antes da proxima etapa executavel |
| `PropostaComercial` ainda depender de `raw SQL` | Medio | Implementar API do handoff com cuidado e testes de regressao |
| Prisma nao expressar unicidade parcial de handoff ativo | Medio | Regra de servico agora, indice parcial em migration futura |
| Tentar acoplar o handoff cedo a modulos operacionais finais | Alto | Manter o schema isolado nesta subonda |

## 9. Diff logico do schema

Resumo do diff aplicado:

- adicao do enum `StatusHandoffComercial`;
- adicao do model `HandoffComercial`;
- adicao de back-relations em `Tenant`, `Usuario`, `LeadWhatsApp`, `Empreendimento` e `PropostaComercial`;
- adicao de indices de consulta do handoff;
- nenhuma alteracao em `Processo`, `Tarefa`, `Documento`, `Contrato`, `OS`, `Financeiro` ou `onboarding`.

## 10. Conclusao

O `schema.prisma` ficou preparado para a entidade `HandoffComercial` respeitando as decisoes arquiteturais aprovadas e sem violar as restricoes da Onda 3.1.

Pontos que exigem aprovacao antes de qualquer migration:

- estrategia final de handoff ativo unico;
- alinhamento do Prisma Client com o schema novo;
- alinhamento de versoes Prisma no workspace;
- avaliacao do impacto do `raw SQL` ainda existente em `PropostaComercial`.

MIGRATION NAO EXECUTADA.
