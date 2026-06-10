# 34. Onda 3.1 - Modelagem do Handoff Operacional

## 1. Resumo da decisao arquitetural

A Onda 3.1 deve introduzir uma entidade propria de transicao chamada `HandoffComercial`.

Essa entidade deve:

- nascer exclusivamente a partir de uma `PropostaComercial` aprovada;
- preservar rastreabilidade entre comercial e operacao;
- carregar somente um snapshot saneado e operacionalmente util;
- permanecer desacoplada de `Contrato`, `Ordem de Servico`, `Financeiro`, `Processo`, `Tarefa`, `Empreendimento` e `onboarding` como entidades raiz;
- permitir vinculacao opcional com `Empreendimento` quando ele ja existir, sem forcar criacao automatica.

Decisao executiva consolidada:

- `HandoffComercial` e a ancora correta da transicao;
- `Empreendimento`, `Processo`, `Tarefa`, `onboarding`, `Contrato`, `OS` e `Financeiro` permanecem como destinos ou integracoes futuras, nunca como substitutos do handoff.

## 2. Justificativa para entidade propria

O estado atual do sistema mostra que a proposta comercial ja esta bem definida, mas os modulos operacionais existentes assumem um contexto mais maduro do que o handoff inicial permite.

Achados relevantes da auditoria:

- `PropostaComercial` ja possui vinculo com `DiagnosticoComercial`, `LeadWhatsApp`, `Empreendimento` opcional e `Usuario`.
- `Processo` exige `empreendimentoId` obrigatorio e representa execucao regulatoria formal.
- `Tarefa` exige `empreendimentoId` obrigatorio e representa unidade atomica de trabalho.
- `Documento` exige `empreendimentoId` obrigatorio e nao serve como pacote inicial de entrada.
- `ChecklistExecucao` exige `empreendimentoId` obrigatorio e pressupoe operacao mais estabelecida.
- `onboarding` atual opera por `empreendimentoId`, com gap analysis, preview de orcamento e geracao de tarefas.

Conclusao tecnica:

- o handoff precisa existir antes de `Processo`, `Tarefa`, `Documento`, `ChecklistExecucao` e `onboarding`;
- por isso, reutilizar qualquer uma dessas entidades como raiz criaria acoplamento precoce, risco de duplicidade e perda de rastreabilidade.

## 3. Modelo conceitual recomendado

`HandoffComercial` deve ser um agregado de transicao entre a proposta aprovada e a entrada controlada na operacao.

Responsabilidades da entidade:

- congelar um snapshot saneado da proposta aprovada no momento do handoff;
- registrar quem iniciou o handoff e quem assumiu a operacao;
- controlar status operacional proprio;
- armazenar pendencias iniciais e observacoes operacionais;
- servir de ancora futura para checklist inicial, solicitacoes documentais e desdobramentos operacionais.

Nao e responsabilidade da entidade:

- substituir contrato;
- substituir ordem de servico;
- substituir financeiro;
- abrir automaticamente processo regulatorio;
- gerar tarefas automaticamente no ato da criacao;
- disparar onboarding paralelo.

## 4. Desenho tecnico sugerido

Modelo de referencia em nivel de schema:

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

model HandoffComercial {
  id                       String                   @id @default(uuid())
  tenantId                 String                   @map("tenant_id")
  propostaComercialId      String                   @map("proposta_comercial_id")
  leadWhatsAppId           String?                  @map("lead_whatsapp_id")
  empreendimentoId         String?                  @map("empreendimento_id")
  criadoPorId              String                   @map("criado_por_id")
  responsavelComercialId   String                   @map("responsavel_comercial_id")
  responsavelOperacionalId String?                  @map("responsavel_operacional_id")
  status                   StatusHandoffComercial   @default(AGUARDANDO_HANDOFF)
  statusPropostaOrigem     StatusPropostaComercial  @map("status_proposta_origem")
  origemProposta           OrigemPropostaComercial  @map("origem_proposta")
  numeroProposta           String                   @map("numero_proposta")
  dataAprovacaoProposta    DateTime?                @map("data_aprovacao_proposta")
  dataValidadeProposta     DateTime?                @map("data_validade_proposta") @db.Date
  nomeLead                 String?                  @map("nome_lead")
  empresaLead              String?                  @map("empresa_lead")
  documentoLead            String?                  @map("documento_lead")
  emailContato             String?                  @map("email_contato")
  telefoneContato          String?                  @map("telefone_contato")
  municipio                String?
  uf                       String?                  @db.Char(2)
  cnaePrincipalCodigo      String?                  @map("cnae_principal_codigo")
  cnaePrincipalDescricao   String?                  @map("cnae_principal_descricao")
  riscoNivel               NivelRiscoComercial?     @map("risco_nivel")
  riscoScore               Int?                     @map("risco_score")
  potencialPoluidor        PotencialPoluidorComercial? @map("potencial_poluidor")
  licenciamentoTipo        String?                  @map("licenciamento_tipo")
  orgaoCompetente          String?                  @map("orgao_competente")
  esfera                   EsferaRegulatoria?
  alertasResumo            String[]                 @default([]) @map("alertas_resumo")
  proximosPassosResumo     String[]                 @default([]) @map("proximos_passos_resumo")
  observacoesLiberadas     String?                  @map("observacoes_liberadas") @db.Text
  servicosResumo           Json                     @map("servicos_resumo")
  origemSnapshotSaneado    Json                     @map("origem_snapshot_saneado")
  pendenciasOperacionais   String[]                 @default([]) @map("pendencias_operacionais")
  observacoesOperacionais  String?                  @map("observacoes_operacionais") @db.Text
  assumidoEm               DateTime?                @map("assumido_em")
  concluidoEm              DateTime?                @map("concluido_em")
  canceladoEm              DateTime?                @map("cancelado_em")
  criadoEm                 DateTime                 @default(now()) @map("criado_em")
  atualizadoEm             DateTime                 @updatedAt @map("atualizado_em")
}
```

Observacoes importantes do desenho:

- `propostaComercialId` deve ser obrigatorio.
- `empreendimentoId` deve continuar opcional.
- `leadWhatsAppId` deve ser opcional para nao presumir que toda proposta nasceu do CRM.
- `origemSnapshotSaneado` deve guardar somente payload publico e reduzido, nunca snapshots brutos.
- `servicosResumo` deve ser um array saneado de itens aprovados, nao uma copia integral do catalogo.

## 5. Campos recomendados

### 5.1 Campos obrigatorios

| Campo | Tipo sugerido | Motivo |
|---|---|---|
| `id` | `uuid` | Identificador do handoff |
| `tenantId` | `uuid/string` | Isolamento multi-tenant |
| `propostaComercialId` | `uuid/string` | Rastreabilidade obrigatoria |
| `criadoPorId` | `uuid/string` | Quem iniciou o handoff |
| `responsavelComercialId` | `uuid/string` | Dono comercial do contexto |
| `status` | enum | Estado operacional proprio |
| `statusPropostaOrigem` | enum | Snapshot da situacao comercial no momento do handoff |
| `origemProposta` | enum | Origem da proposta |
| `numeroProposta` | string | Referencia humana |
| `servicosResumo` | `json` | Escopo aprovado saneado |
| `origemSnapshotSaneado` | `json` | Snapshot imutavel e reduzido |
| `criadoEm` | datetime | Auditoria |
| `atualizadoEm` | datetime | Auditoria |

### 5.2 Campos opcionais, mas recomendados

| Campo | Tipo sugerido | Regra |
|---|---|---|
| `leadWhatsAppId` | `uuid/string` | Reaproveitar referencia existente quando houver |
| `empreendimentoId` | `uuid/string` | Preencher apenas se ja existir empreendimento valido |
| `responsavelOperacionalId` | `uuid/string` | Pode nascer nulo e ser atribuido depois |
| `dataAprovacaoProposta` | datetime | Congelar marco comercial |
| `dataValidadeProposta` | date | Referencia temporal do snapshot |
| `nomeLead` | string | Snapshot de leitura |
| `empresaLead` | string | Snapshot de leitura |
| `documentoLead` | string | Apenas se ja estiver saneado |
| `emailContato` | string | Contato operacional |
| `telefoneContato` | string | Contato operacional |
| `municipio` | string | Contexto de localidade |
| `uf` | char(2) | Contexto de localidade |
| `cnaePrincipalCodigo` | string | Base tecnica |
| `cnaePrincipalDescricao` | string | Base tecnica |
| `riscoNivel` | enum | Priorizacao |
| `riscoScore` | int | Priorizacao |
| `potencialPoluidor` | enum | Priorizacao/regulatorio |
| `licenciamentoTipo` | string | Contexto tecnico |
| `orgaoCompetente` | string | Contexto tecnico |
| `esfera` | enum | Contexto tecnico |
| `alertasResumo` | `string[]` | Alertas saneados |
| `proximosPassosResumo` | `string[]` | Proximos passos saneados |
| `observacoesLiberadas` | text | Somente trecho comercial liberado para operacao |
| `pendenciasOperacionais` | `string[]` | Pendencias curtas e objetivas |
| `observacoesOperacionais` | text | Uso exclusivo da operacao |
| `assumidoEm` | datetime | Marco de atribuicao operacional |
| `concluidoEm` | datetime | Encerramento |
| `canceladoEm` | datetime | Cancelamento |

### 5.3 Campo que nao deve existir agora

Nao recomendar neste momento:

- `contratoId`
- `ordemServicoId`
- `financeiroId`
- `processoId`
- `tarefaId`
- `checklistExecucaoId`

Esses campos forcariam acoplamento cedo demais ou dependeriam de `empreendimentoId` obrigatorio.

## 6. Enums e status recomendados

### 6.1 Status do handoff

| Status | Uso |
|---|---|
| `AGUARDANDO_HANDOFF` | registro criado, ainda sem triagem operacional |
| `EM_TRIAGEM_OPERACIONAL` | operacao analisando escopo, documentos e responsavel |
| `AGUARDANDO_DOCUMENTOS` | handoff depende de intake inicial |
| `EM_PLANEJAMENTO` | escopo confirmado e preparando desdobramentos |
| `EM_EXECUCAO` | handoff ja virou frente operacional ativa |
| `PAUSADO` | bloqueio temporario com motivo |
| `CANCELADO` | encerrado sem seguir para operacao |
| `CONCLUIDO` | transicao encerrada e absorvida pela operacao |

### 6.2 Regras de transicao

- criar apenas com proposta `APROVADA`;
- nao criar a partir de `RASCUNHO`, `PRONTA`, `ENVIADA`, `EM_NEGOCIACAO`, `REJEITADA`, `EXPIRADA` ou `CANCELADA`;
- impedir mais de um handoff ativo por proposta dentro do mesmo tenant;
- permitir `AGUARDANDO_HANDOFF -> EM_TRIAGEM_OPERACIONAL`;
- permitir `EM_TRIAGEM_OPERACIONAL -> AGUARDANDO_DOCUMENTOS`, `EM_PLANEJAMENTO`, `CANCELADO`;
- permitir `AGUARDANDO_DOCUMENTOS -> EM_TRIAGEM_OPERACIONAL`, `EM_PLANEJAMENTO`, `CANCELADO`;
- permitir `EM_PLANEJAMENTO -> EM_EXECUCAO`, `PAUSADO`, `CANCELADO`;
- permitir `EM_EXECUCAO -> PAUSADO`, `CONCLUIDO`, `CANCELADO`;
- permitir `PAUSADO -> EM_TRIAGEM_OPERACIONAL`, `EM_PLANEJAMENTO`, `EM_EXECUCAO`, `CANCELADO`;
- tratar `CANCELADO` e `CONCLUIDO` como finais.

## 7. Relacoes recomendadas

### 7.1 Relacoes diretas

- `Tenant` -> obrigatoria
- `PropostaComercial` -> obrigatoria
- `LeadWhatsApp` -> opcional
- `Empreendimento` -> opcional
- `Usuario` (`criadoPorId`) -> obrigatoria
- `Usuario` (`responsavelComercialId`) -> obrigatoria
- `Usuario` (`responsavelOperacionalId`) -> opcional

### 7.2 Relacoes futuras, mas nao raiz

- `Tarefa`: somente depois que houver regra clara para `empreendimentoId`, ou via tarefa derivada com referencia indireta ao handoff
- `Processo`: somente quando a triagem operacional concluir que um processo formal deve ser aberto
- `onboarding`: apenas como etapa posterior, disparada a partir do detalhe do handoff, nunca em fluxo paralelo
- `Documento`: preferencialmente via solicitacao documental propria do handoff antes de usar a entidade `Documento`, porque `Documento` atual exige `empreendimentoId`

### 7.3 Observacao critica da auditoria

Hoje `Processo`, `Tarefa`, `Documento`, `ChecklistExecucao` e as rotas de `onboarding` exigem `empreendimentoId`. Esse fato reforca que `HandoffComercial` precisa existir antes deles e com `empreendimentoId` opcional.

## 8. Regras de criacao a partir de `PropostaComercial`

Fluxo recomendado:

1. Receber `POST /api/v1/comercial/propostas/:id/handoff`.
2. Buscar a proposta no tenant autenticado.
3. Validar que a proposta esta em `APROVADA`.
4. Validar que nao existe handoff ativo para a mesma proposta.
5. Montar snapshot saneado a partir do payload publico da proposta e do diagnostico resumido.
6. Preencher `responsavelComercialId` com o dono comercial atual.
7. Criar o handoff em transacao unica.
8. Registrar auditoria de criacao.

Regras complementares:

- nao criar `Empreendimento` automaticamente;
- se `proposta.empreendimentoId` existir, apenas referenciar;
- se `leadWhatsAppId` existir, apenas referenciar;
- nao copiar snapshots brutos do diagnostico;
- nao copiar snapshot bruto do catalogo;
- nao gerar tarefa, processo ou documento no mesmo passo da criacao;
- nao editar a proposta original dentro da transacao do handoff, exceto se uma regra futura formal exigir marcacao de origem.

Regra pratica para `responsavelComercialId`:

- enquanto nao houver campo explicito de owner comercial em `PropostaComercial`, derivar de `proposta.criadoPorId`;
- manter `criadoPorId` do handoff como o usuario que acionou o endpoint.

## 9. Dados que podem ser herdados da proposta

Podem ser herdados, de forma saneada:

- `propostaComercialId`
- `numero`
- `origem`
- `status` da proposta no momento do handoff
- `aprovadaEm`
- `dataValidade`
- `leadWhatsAppId`, se existir
- `empreendimentoId`, se existir
- `nomeLead`
- `empresaLead`
- `documentoLead`, se ja estiver saneado
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
- `alertas`
- `proximosPassos`
- `itens` aprovados em formato reduzido
- `observacoesComerciais`, somente no campo `observacoesLiberadas`

Recomendacao adicional:

- nao duplicar totais comerciais no handoff por padrao;
- se algum valor comercial precisar continuar visivel, ele deve ser lido da `PropostaComercial` vinculada sob permissao especifica, e nao replicado como dado operacional padrao.

## 10. Dados bloqueados

Devem ficar bloqueados no handoff:

- `custoInternoEstimado`
- `margemLucroAlvo`
- `valorReferenciaHora`
- `metadata` bruta
- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- `observacoesInternas`
- estados intermediarios de negociacao
- qualquer payload bruto de precificacao
- dados de contrato
- dados de ordem de servico
- dados financeiros
- qualquer documento binario copiado da proposta

Recomendacao de seguranca:

- o PDF da proposta deve ser acessado por referencia autenticada a `PropostaComercial`, nunca copiado para dentro do handoff nesta subonda.

## 11. Regras de permissao por perfil

### 11.1 Criar handoff

Perfis autorizados:

- `EXECUTIVO`
- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

### 11.2 Ler handoff

Perfis autorizados:

- `EXECUTIVO`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Restricoes de leitura:

- perfis operacionais leem somente o snapshot saneado;
- valores internos e campos comerciais bloqueados nao entram na resposta.

### 11.3 Atualizar handoff

Pode atualizar campos operacionais:

- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Pode alterar `responsavelOperacionalId`, `CANCELADO` e `CONCLUIDO`:

- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Nao deve ter acesso por padrao:

- `REPRESENTANTE_POSTO`

## 12. Eventos minimos de auditoria

Eventos minimos recomendados:

- `handoff_comercial.criado`
- `handoff_comercial.responsavel_operacional_atribuido`
- `handoff_comercial.status_alterado`
- `handoff_comercial.observacoes_operacionais_atualizadas`
- `handoff_comercial.pausado`
- `handoff_comercial.cancelado`
- `handoff_comercial.concluido`

Payload minimo em cada evento:

- `tenantId`
- `handoffId`
- `propostaComercialId`
- `usuarioId`
- `usuarioPerfil`
- `statusAnterior`, quando aplicavel
- `statusNovo`, quando aplicavel
- `contexto` resumido
- `timestamp`

Base tecnica existente para reaproveitamento:

- `apps/api/src/shared/middleware/audit.ts`
- tabela `audit_log`

## 13. Riscos tecnicos

| Risco | Impacto | Mitigacao |
|---|---|---|
| Acoplar handoff a `Processo`, `Tarefa` ou `Documento` cedo demais | Alto | Manter `HandoffComercial` autonomo na criacao |
| Gerar fluxo paralelo ao onboarding | Alto | Tratar onboarding como desdobramento opcional e posterior |
| Duplicar `Empreendimento` automaticamente | Alto | Reutilizar referencia existente e bloquear autocriacao cega |
| Duplicar lead/cliente | Medio | Reusar `leadWhatsAppId` e snapshots saneados, sem novas entidades |
| Expor dados comerciais sensiveis | Alto | Herdar apenas payload publico e reduzido |
| Perder imutabilidade do contexto aprovado | Alto | Congelar `origemSnapshotSaneado` no ato da criacao |
| Permitir varios handoffs ativos por proposta | Alto | Validacao de servico e indice parcial futuro |
| Herdar a complexidade atual de raw SQL em propostas | Medio | Planejar handoff usando a saida publica da proposta e revisar sincronizacao do Prisma Client antes da implementacao |
| Usar `Documento` atual para intake sem `empreendimentoId` | Alto | Modelar solicitacao documental propria em subonda posterior |
| Tornar o handoff um mini-CRM ou mini-contrato | Medio | Limitar o agregado a transicao operacional |

## 14. Arquivos candidatos a alteracao na proxima subonda

### 14.1 Backend obrigatorio na subonda 3.2

Arquivos existentes que devem ser alterados:

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.ts`
- `apps/api/src/modules/comercial/propostas.service.ts`
- `apps/api/src/modules/comercial/comercial.routes.ts`
- `apps/api/src/modules/comercial/propostas.types.ts`
- `apps/api/src/modules/comercial/propostas.schemas.ts`
- `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts`

Arquivos novos recomendados:

- `apps/api/src/modules/operacao/handoffs.routes.ts`
- `apps/api/src/modules/operacao/handoffs.service.ts`
- `apps/api/src/modules/operacao/handoffs.types.ts`
- `apps/api/src/modules/operacao/handoffs.schemas.ts`
- `apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts`

### 14.2 Shared schemas recomendados

Arquivos candidatos:

- `packages/schemas/src/index.ts`
- `packages/schemas/src/handoffs.schema.ts`

### 14.3 Frontend muito provavel na subonda 3.3

Arquivos existentes que devem ser alterados:

- `apps/web/src/app/(app)/comercial/propostas/shared.ts`
- `apps/web/src/app/(app)/comercial/propostas/actions.ts`
- `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx`
- `apps/web/src/app/(app)/comercial/propostas/page.tsx`

Arquivos novos recomendados:

- `apps/web/src/app/(app)/operacao/handoffs/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/actions.ts`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`

### 14.4 Integracoes posteriores, nao na criacao inicial

Arquivos candidatos futuros:

- `apps/api/src/modules/onboarding/onboarding.routes.ts`
- `apps/api/src/modules/tarefas/tarefas.routes.ts`
- `apps/api/src/modules/processos/processos.routes.ts`
- `apps/web/src/app/(app)/empreendimentos/[id]/onboarding/actions.ts`
- `apps/web/src/app/(app)/empreendimentos/[id]/onboarding/page.tsx`

Observacao:

- esses arquivos nao devem ser alterados na criacao inicial do handoff, apenas quando a integracao posterior estiver aprovada.

## 15. Checklist de aprovacao antes de liberar migration

Antes de criar a migration da Onda 3.1, aprovar explicitamente:

1. Nome final da entidade: `HandoffComercial`.
2. Status finais e maquina de transicao.
3. Definicao de um handoff ativo por proposta.
4. Estrategia para `responsavelComercialId` enquanto a proposta nao tiver owner formal.
5. Lista final de campos herdados.
6. Lista final de campos bloqueados.
7. Forma do `servicosResumo`.
8. Forma do `origemSnapshotSaneado`.
9. Regra de permissao por perfil.
10. Politica para `empreendimentoId` opcional.
11. Politica para nao disparar onboarding paralelo.
12. Estrategia para intake documental sem depender de `Documento` atual.
13. Estrategia para evitar duplicidade de handoff ativo.
14. Impacto da pendencia atual de sincronizacao do Prisma Client em `PropostaComercial`.
15. Nomenclatura final das rotas (`/comercial/propostas/:id/handoff` e `/operacao/handoffs`).

## 16. Encerramento

`HandoffComercial` deve nascer como camada de transicao fina, auditavel e saneada, ancorada em `PropostaComercial` aprovada e sem assumir obrigacoes de contrato, financeiro, OS, processo, tarefa ou onboarding no mesmo passo.

MIGRATION NAO EXECUTADA. A modelagem precisa ser aprovada antes da criacao de migration na Onda 3.1.
