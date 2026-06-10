# 22_RELATORIO_ONDA_2_9_1_MODELAGEM_PRISMA_PROPOSTA

## 1. Objetivo

A Onda 2.9.1 teve como objetivo entregar apenas a base Prisma para proposta comercial persistida.

Escopo executado:

- auditoria do `schema.prisma` atual
- criacao dos enums necessarios
- criacao das models `DiagnosticoComercial`, `PropostaComercial` e `ItemProposta`
- criacao das relacoes opcionais com `LeadWhatsApp` e `Empreendimento`
- criacao de migration segura
- `prisma generate`
- `typecheck`

Escopo explicitamente nao executado:

- Onda 2.9.2
- API de proposta
- UI
- alteracao da tela de triagem
- contrato
- ordem de servico
- financeiro
- PDF
- handoff
- alteracao do motor de diagnostico
- alteracao do catalogo alem das relacoes necessarias

---

## 2. Auditoria do Schema Atual

Antes da alteracao, foram confirmados os seguintes padroes reais do projeto:

- nomes de campos temporais em portugues:
  - `criadoEm`
  - `atualizadoEm`
- colunas mapeadas em snake_case com `@map(...)`
- tabelas mapeadas em snake_case com `@@map(...)`
- chaves multi-tenant usando `tenantId` + indices compostos
- relacoes opcionais com FKs nomeadas em camelCase e coluna mapeada em snake_case
- uso consistente de `Decimal(12,2)` para valores monetarios
- uso de arrays nativos Postgres (`String[]`, `Int[]`) onde faz sentido

Entidades auditadas e reaproveitadas:

- `Tenant`
- `Usuario`
- `Empreendimento`
- `LeadWhatsApp`
- `AuditLog`
- `ServicoCatalogo`

Conclusao da auditoria:

- o repositorio ainda nao possuia `PropostaComercial`, `ItemProposta` ou `DiagnosticoComercial`
- havia CRM via `LeadWhatsApp`, mas sem proposta persistida
- havia `ServicoCatalogo` global pronto para ser relacionado aos itens

---

## 3. Enums Criados

Foram adicionados ao `schema.prisma`:

- `StatusPropostaComercial`
- `OrigemPropostaComercial`
- `PorteDiagnosticoComercial`
- `SituacaoDiagnosticoComercial`
- `NivelRiscoComercial`
- `PotencialPoluidorComercial`
- `DecisaoItemProposta`

Esses enums seguem o plano da Onda 2.9 e mantem o dominio comercial separado de contrato, OS e financeiro.

---

## 4. Models Criadas

## 4.1. `DiagnosticoComercial`

Finalidade:

- persistir o input da triagem
- persistir o resultado do diagnostico que originou a proposta
- manter snapshot auditavel do racional comercial

Campos principais:

- tenant, usuario criador, lead opcional, empreendimento opcional
- origem
- CNAEs, UF, municipio, porte e situacao
- historico de licenca e outorga
- CNAE principal, score, nivel de risco e potencial poluidor
- enquadramento regulatorio
- obrigatoriedades
- orcamento minimo/base/maximo
- alertas e proximos passos
- `inputSnapshot`
- `resultadoSnapshot`

Relacoes:

- N:1 com `Tenant`
- N:1 com `Usuario`
- N:1 opcional com `LeadWhatsApp`
- N:1 opcional com `Empreendimento`
- 1:N com `PropostaComercial`

## 4.2. `PropostaComercial`

Finalidade:

- representar a proposta salva em fase pre-contrato

Campos principais:

- tenant
- diagnostico associado
- lead opcional
- empreendimento opcional
- criador e ultimo atualizador
- numero unico por tenant
- origem e status
- dados de contato comercial
- faixa subtotal/minimo/base/maximo
- desconto, acrescimo e faixa total
- validade
- observacoes comerciais e internas
- `catalogoSnapshotEm`
- timestamps de envio/aprovacao/rejeicao/expiracao

Relacoes:

- N:1 com `Tenant`
- N:1 com `DiagnosticoComercial`
- N:1 opcional com `LeadWhatsApp`
- N:1 opcional com `Empreendimento`
- N:1 com `Usuario` criador
- N:1 opcional com `Usuario` atualizador
- 1:N com `ItemProposta`

## 4.3. `ItemProposta`

Finalidade:

- persistir cada servico da proposta com snapshot de preco no momento da geracao

Campos principais:

- tenant
- proposta
- servico do catalogo opcional
- ordem
- origem e decisao comercial
- codigo, nome e categoria do servico
- justificativa
- quantidade
- faixa de preco unitario
- preco aplicado unitario
- faixa de valor da linha
- valor aplicado da linha
- observacao de linha
- `snapshotCatalogo`

Relacoes:

- N:1 com `Tenant`
- N:1 com `PropostaComercial`
- N:1 opcional com `ServicoCatalogo`

---

## 5. Relacoes Adicionadas em Models Existentes

Foram adicionadas apenas relacoes necessarias:

- `Tenant`
  - `diagnosticosComerciais`
  - `propostasComerciais`
  - `itensProposta`

- `Usuario`
  - `diagnosticosComerciais`
  - `propostasComerciaisCriadas`
  - `propostasComerciaisAtualizadas`

- `Empreendimento`
  - `diagnosticosComerciais`
  - `propostasComerciais`

- `LeadWhatsApp`
  - `diagnosticosComerciais`
  - `propostasComerciais`

- `ServicoCatalogo`
  - `itensProposta`

Nenhuma model existente teve alteracao funcional fora desse acoplamento relacional.

---

## 6. Migration Gerada

Migration criada:

`apps/api/prisma/migrations/20260512110000_add_proposta_comercial_persistida/migration.sql`

Conteudo gerado:

- 7 enums novos
- tabela `diagnosticos_comerciais`
- tabela `propostas_comerciais`
- tabela `itens_proposta`
- indices multi-tenant
- constraint unica de numero da proposta por tenant
- FK opcional para `leads_whatsapp`
- FK opcional para `empreendimentos`
- FK opcional para `servicos_consultoria_base`
- cascade de exclusao apenas entre `PropostaComercial` e `ItemProposta`

Observacao importante:

- `prisma migrate dev` nao pode ser usado neste ambiente por ser nao interativo
- por isso, a migration foi gerada com:
  - `prisma migrate diff`
- e aplicada com:
  - `prisma migrate deploy`

Esse fluxo preservou seguranca e rastreabilidade da migration.

---

## 7. Comandos Executados

No diretorio:

`/home/guilherme/Projetos VS CODE/Posto/sistema/apps/api`

Comandos executados:

```bash
npx prisma format --schema prisma/schema.prisma
npx prisma validate --schema prisma/schema.prisma
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script --output prisma/migrations/20260512110000_add_proposta_comercial_persistida/migration.sql
npx prisma migrate deploy --schema prisma/schema.prisma
npm run db:generate
npm run typecheck
```

---

## 8. Resultado das Validacoes

### 8.1. Prisma format

Resultado:

- sucesso

### 8.2. Prisma validate

Resultado:

- schema valido

### 8.3. Migration

Resultado:

- migration criada e aplicada com sucesso no banco `posto_dev`

### 8.4. Prisma generate

Resultado:

- sucesso

### 8.5. Typecheck

Comando:

```bash
npm run typecheck
```

Resultado:

- sucesso

Conclusao:

- a nova modelagem Prisma nao quebrou o backend atual

---

## 9. Arquivos Alterados

Arquivos alterados nesta onda:

| Arquivo | Acao | Finalidade |
|---|---|---|
| `apps/api/prisma/schema.prisma` | Alterado | Inclusao dos enums, models e relacoes da proposta comercial persistida |
| `apps/api/prisma/migrations/20260512110000_add_proposta_comercial_persistida/migration.sql` | Criado | Migration SQL da Onda 2.9.1 |
| `docs/22_RELATORIO_ONDA_2_9_1_MODELAGEM_PRISMA_PROPOSTA.md` | Criado | Registro tecnico da entrega |

Nao houve alteracao em:

- seed
- API de proposta
- UI
- motor de diagnostico
- contrato
- OS
- financeiro

---

## 10. Conclusao

A Onda 2.9.1 foi concluida com sucesso.

Entrega efetiva:

- base Prisma pronta para persistir proposta comercial
- diagnostico persistido separado da proposta
- itens com snapshot de preco
- relacoes opcionais com `LeadWhatsApp` e `Empreendimento`
- separacao preservada entre proposta e contrato/financeiro/operacao

Proxima etapa natural:

- **Onda 2.9.2 — API de proposta**

