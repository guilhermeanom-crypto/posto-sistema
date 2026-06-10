# 36. Onda 3.1 - Revisao Final do Schema do Handoff

## 1. Objetivo

Esta revisao final teve como objetivo conferir se a modelagem de `HandoffComercial` esta estruturalmente consistente no `apps/api/prisma/schema.prisma` antes de qualquer liberacao de migration.

Escopo efetivamente revisado:

- enum `StatusHandoffComercial`;
- model `HandoffComercial`;
- relacoes com `Tenant`, `PropostaComercial`, `LeadWhatsApp`, `Empreendimento` e `Usuario`;
- back-relations adicionadas;
- compatibilidade de `String[]` e `Json` com PostgreSQL;
- consistencia das multiplas relacoes com `Usuario`;
- ausencia de acoplamento com `Contrato`, `OS`, `Financeiro`, `Processo`, `Tarefa`, `Documento` e `onboarding`;
- validacao final com `prisma validate`.

## 2. Trecho final do enum

Trecho conferido no schema:

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

Conclusao:

- nomes coerentes com a maquina de estados aprovada;
- enum separado corretamente de `StatusPropostaComercial`;
- sem conflito nominal com enums existentes.

## 3. Trecho final do model

Trecho final conferido:

```prisma
model HandoffComercial {
  id                       String                      @id @default(uuid())
  tenantId                 String                      @map("tenant_id")
  propostaComercialId      String                      @map("proposta_comercial_id")
  leadWhatsAppId           String?                     @map("lead_whatsapp_id")
  empreendimentoId         String?                     @map("empreendimento_id")
  criadoPorId              String                      @map("criado_por_id")
  responsavelComercialId   String                      @map("responsavel_comercial_id")
  responsavelOperacionalId String?                     @map("responsavel_operacional_id")
  status                   StatusHandoffComercial      @default(AGUARDANDO_HANDOFF)
  statusPropostaOrigem     StatusPropostaComercial     @map("status_proposta_origem")
  origemProposta           OrigemPropostaComercial     @map("origem_proposta")
  numeroProposta           String                      @map("numero_proposta")
  dataAprovacaoProposta    DateTime?                   @map("data_aprovacao_proposta")
  dataValidadeProposta     DateTime?                   @map("data_validade_proposta") @db.Date
  nomeLead                 String?                     @map("nome_lead")
  empresaLead              String?                     @map("empresa_lead")
  documentoLead            String?                     @map("documento_lead")
  emailContato             String?                     @map("email_contato")
  telefoneContato          String?                     @map("telefone_contato")
  municipio                String?
  uf                       String?                     @db.Char(2)
  cnaePrincipalCodigo      String?                     @map("cnae_principal_codigo")
  cnaePrincipalDescricao   String?                     @map("cnae_principal_descricao")
  riscoNivel               NivelRiscoComercial?        @map("risco_nivel")
  riscoScore               Int?                        @map("risco_score")
  potencialPoluidor        PotencialPoluidorComercial? @map("potencial_poluidor")
  licenciamentoTipo        String?                     @map("licenciamento_tipo")
  orgaoCompetente          String?                     @map("orgao_competente")
  esfera                   EsferaRegulatoria?
  alertasResumo            String[]                    @default([]) @map("alertas_resumo")
  proximosPassosResumo     String[]                    @default([]) @map("proximos_passos_resumo")
  observacoesLiberadas     String?                     @map("observacoes_liberadas") @db.Text
  servicosResumo           Json                        @map("servicos_resumo")
  origemSnapshotSaneado    Json                        @map("origem_snapshot_saneado")
  pendenciasOperacionais   String[]                    @default([]) @map("pendencias_operacionais")
  observacoesOperacionais  String?                     @map("observacoes_operacionais") @db.Text
  assumidoEm               DateTime?                   @map("assumido_em")
  concluidoEm              DateTime?                   @map("concluido_em")
  canceladoEm              DateTime?                   @map("cancelado_em")
  criadoEm                 DateTime                    @default(now()) @map("criado_em")
  atualizadoEm             DateTime                    @updatedAt @map("atualizado_em")

  tenant                 Tenant            @relation(fields: [tenantId], references: [id])
  propostaComercial      PropostaComercial @relation(fields: [propostaComercialId], references: [id])
  leadWhatsApp           LeadWhatsApp?     @relation(fields: [leadWhatsAppId], references: [id])
  empreendimento         Empreendimento?   @relation(fields: [empreendimentoId], references: [id])
  criadoPor              Usuario           @relation("HandoffComercialCriador", fields: [criadoPorId], references: [id])
  responsavelComercial   Usuario           @relation("HandoffComercialResponsavelComercial", fields: [responsavelComercialId], references: [id])
  responsavelOperacional Usuario?          @relation("HandoffComercialResponsavelOperacional", fields: [responsavelOperacionalId], references: [id])

  @@index([tenantId, status, criadoEm(sort: Desc)])
  @@index([tenantId, propostaComercialId, status])
  @@index([tenantId, leadWhatsAppId, status])
  @@index([tenantId, empreendimentoId, status])
  @@index([tenantId, responsavelComercialId, status])
  @@index([tenantId, responsavelOperacionalId, status])
  @@map("handoffs_comerciais")
}
```

## 4. Conferencia estrutural

### 4.1 Nomes dos campos

Conferencia:

- nomes seguem o padrao ja usado em `PropostaComercial`;
- campos de leitura herdados da proposta estao nomeados de forma clara;
- nomes de usuario deixam explicitos os tres papeis: criador, comercial e operacional.

Conclusao:

- aprovados estruturalmente.

### 4.2 Tipos Prisma

Conferencia:

- IDs como `String`;
- datas como `DateTime`;
- campos com resumo textual como `String?` e `@db.Text` quando apropriado;
- `uf` como `String? @db.Char(2)`;
- risco e potencial poluidor reutilizando enums existentes;
- campos resumidos de lista como `String[]`;
- snapshots saneados como `Json`.

Conclusao:

- coerentes com o schema atual e com o uso existente na base.

### 4.3 Campos obrigatorios e opcionais

Obrigatorios relevantes:

- `tenantId`
- `propostaComercialId`
- `criadoPorId`
- `responsavelComercialId`
- `status`
- `statusPropostaOrigem`
- `origemProposta`
- `numeroProposta`
- `servicosResumo`
- `origemSnapshotSaneado`
- `criadoEm`
- `atualizadoEm`

Opcionais relevantes:

- `leadWhatsAppId`
- `empreendimentoId`
- `responsavelOperacionalId`
- dados de contexto como `nomeLead`, `empresaLead`, `documentoLead`, `emailContato`, `telefoneContato`
- marcadores de ciclo como `assumidoEm`, `concluidoEm`, `canceladoEm`

Conclusao:

- a opcionalidade esta alinhada com a decisao de nao forcar `Empreendimento`, `LeadWhatsApp` ou responsavel operacional na criacao.

### 4.4 `@map` e `@@map`

Conferencia:

- todos os campos sensiveis ao padrao SQL snake_case foram mapeados com `@map`;
- o model usa `@@map("handoffs_comerciais")`;
- o padrao esta consistente com o resto do schema.

Conclusao:

- aprovado.

### 4.5 Indices

Indices conferidos:

- `@@index([tenantId, status, criadoEm(sort: Desc)])`
- `@@index([tenantId, propostaComercialId, status])`
- `@@index([tenantId, leadWhatsAppId, status])`
- `@@index([tenantId, empreendimentoId, status])`
- `@@index([tenantId, responsavelComercialId, status])`
- `@@index([tenantId, responsavelOperacionalId, status])`

Conclusao:

- cobrem bem listagem e filtros basicos;
- ajudam a sustentar a futura regra de handoff ativo unico por proposta;
- nao substituem um indice parcial no banco, se essa garantia for endurecida na migration.

## 5. Relacoes conferidas

Relacoes do model `HandoffComercial` conferidas:

- `Tenant`: presente e obrigatoria
- `PropostaComercial`: presente e obrigatoria
- `LeadWhatsApp`: presente e opcional
- `Empreendimento`: presente e opcional
- `Usuario` como criador: presente e obrigatoria
- `Usuario` como responsavel comercial: presente e obrigatoria
- `Usuario` como responsavel operacional: presente e opcional

Conclusao:

- todas as relacoes solicitadas existem;
- nenhuma relacao nova foi criada com dominio operacional final ou financeiro.

## 6. Back-relations conferidas

Back-relations adicionadas e conferidas:

- `Tenant.handoffsComerciais`
- `Usuario.handoffsComerciaisCriados`
- `Usuario.handoffsComerciaisComercial`
- `Usuario.handoffsComerciaisOperacional`
- `LeadWhatsApp.handoffsComerciais`
- `Empreendimento.handoffsComerciais`
- `PropostaComercial.handoffs`

Conclusao:

- todas as relacoes reversas esperadas estao presentes;
- nomes sao consistentes e legiveis.

## 7. Ausencias conferidas

Foi conferida a ausencia de relacao do `HandoffComercial` com:

- `Contrato`
- `OS`
- `Financeiro`
- `Processo`
- `Tarefa`
- `Documento`
- `onboarding`

Conclusao:

- a camada de transicao permaneceu desacoplada, como definido na arquitetura aprovada.

## 8. Compatibilidade de `String[]` e `Json`

O datasource do schema esta definido como:

```prisma
datasource db {
  provider = "postgresql"
}
```

Conferencia:

- o schema ja usa `String[]` em diversos modelos existentes, como `Empreendimento.atividades`, `DiagnosticoComercial.alertas`, `DiagnosticoComercial.proximosPassos` e outros;
- o schema ja usa `Json` em diversos modelos existentes, como `Tenant.configuracoes`, `ServicoCatalogo.metadata`, `DiagnosticoComercial.inputSnapshot` e `resultadoSnapshot`.

Conclusao:

- `String[]` e `Json` sao compativeis com o banco atual;
- o uso em `HandoffComercial` esta consistente com o padrao ja adotado no projeto.

## 9. Risco com multiplas relacoes para `Usuario`

Conferencia:

- existem tres relacoes distintas de `HandoffComercial` para `Usuario`;
- todas possuem nomes explicitos:
  - `HandoffComercialCriador`
  - `HandoffComercialResponsavelComercial`
  - `HandoffComercialResponsavelOperacional`
- as back-relations correspondentes em `Usuario` usam exatamente os mesmos nomes.

Conclusao:

- nao ha ambiguidade estrutural no Prisma;
- a nomeacao das relacoes esta correta;
- o principal cuidado futuro nao e de schema, e sim de implementacao de permissao e atribuicao de papeis no servico.

## 10. `prisma validate`

Validacao executada:

```bash
node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js validate --schema apps/api/prisma/schema.prisma
```

Resultado:

```text
The schema at apps/api/prisma/schema.prisma is valid
```

Conclusao:

- o schema continua valido apos a modelagem de `HandoffComercial`.

## 11. Riscos encontrados

Riscos relevantes ainda presentes:

- `PropostaComercial` ainda depende de `raw SQL` no backend comercial;
- o `Prisma Client` nao foi regenerado depois da adicao de `HandoffComercial`;
- existe divergencia observada entre a versao declarada em `apps/api/package.json` (`^5.16.0`) e o Prisma/client presente no workspace (`5.22.0`);
- a regra de um handoff ativo por proposta ainda nao esta endurecida no banco via indice parcial;
- `servicosResumo` e `origemSnapshotSaneado` ainda precisam de contrato de payload bem definido antes da implementacao da API.

## 12. Ajustes aplicados

Ajustes aplicados nesta revisao final:

- nenhum ajuste adicional no schema;
- nenhuma alteracao em modulos fora do `schema.prisma`;
- nenhuma alteracao em regra comercial da proposta.

## 13. Pendencias antes da migration

Pendencias recomendadas antes de liberar migration:

1. Confirmar a estrategia final para impedir mais de um handoff ativo por proposta.
2. Decidir se a unicidade sera apenas de servico inicialmente ou se a migration ja levara indice parcial manual.
3. Alinhar a versao de `prisma` e `@prisma/client` no workspace.
4. Executar `prisma generate` somente depois da aprovacao formal da migration.
5. Definir com precisao a estrutura do `Json` em `servicosResumo`.
6. Definir com precisao a estrutura do `Json` em `origemSnapshotSaneado`.
7. Planejar a implementacao da API considerando a pendencia atual de `raw SQL` em `PropostaComercial`.

## 14. Recomendacao objetiva

Recomendacao desta revisao final:

- **nao liberar migration ainda**.

Justificativa objetiva:

- o schema esta valido e a modelagem esta estruturalmente consistente;
- porem ainda existem pendencias tecnicas suficientes para tornar a liberacao da migration precoce:
  - divergencia de versao Prisma/client no workspace;
  - client ainda nao sincronizado com `HandoffComercial`;
  - decisao ainda nao consolidada sobre o reforco de unicidade de handoff ativo por proposta;
  - necessidade de fechar melhor o contrato dos campos `Json`.

Conclusao executiva:

- a modelagem pode ser considerada **aprovada estruturalmente**;
- a migration deve permanecer **bloqueada** ate fechar as pendencias acima.

MIGRATION NÃO EXECUTADA.
