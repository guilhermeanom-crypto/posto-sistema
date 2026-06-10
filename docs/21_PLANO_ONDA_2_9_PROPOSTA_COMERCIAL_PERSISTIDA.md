# 21_PLANO_ONDA_2_9_PROPOSTA_COMERCIAL_PERSISTIDA

## 1. Resumo

Este documento planeja tecnicamente a Onda 2.9 sem executar codigo.

Objetivo futuro da Onda 2.9:
- permitir que uma triagem comercial validada vire uma proposta salva
- preservar o diagnostico que originou a proposta
- persistir itens, totais e status comercial sem iniciar contrato, OS ou operacao

Decisao arquitetural recomendada:
- criar **`DiagnosticoComercial`**, **`PropostaComercial`** e **`ItemProposta`**
- **nao criar `LeadComercial` nesta primeira fase**
- reutilizar relacoes opcionais com **`LeadWhatsApp`**, **`Empreendimento`**, **`Tenant`** e **`Usuario`**
- usar **snapshot de diagnostico e de precos por item** para impedir que o catalogo altere propostas antigas

---

## 2. Estado Atual

### 2.1. O que ja existe

O repositorio ja possui base comercial suficiente para suportar proposta persistida:

- **`ServicoCatalogo`** global em `apps/api/prisma/schema.prisma`
- **`PoliticaPrecificacaoDiagnostico`** por tenant
- endpoint **`POST /api/v1/comercial/diagnostico/cnae`**
- motor de diagnostico por CNAE validado e com testes automatizados
- UI interna de triagem comercial no frontend
- build final do frontend aprovado

Tambem existem entidades que podem ser reaproveitadas:

- **`Tenant`**
- **`Usuario`**
- **`Empreendimento`**
- **`LeadWhatsApp`**
- **`FollowUpLead`**
- **`AuditLog`**

### 2.2. O que foi auditado e nao existe como dominio real

Nao foram encontrados modelos persistidos de:

- `PropostaComercial`
- `ItemProposta`
- `DiagnosticoComercial`
- `Contrato`
- `Orcamento` comercial persistido
- entidade financeira de cobranca/parcela

Achados relevantes:

- o modulo `crm` hoje trabalha sobre **`LeadWhatsApp`** e funil simples por estagio
- o estagio `PROPOSTA_ENVIADA` existe no CRM, mas **a proposta em si ainda nao existe como entidade**
- o endpoint de onboarding `gap-analysis/:empreendimentoId/orcamento-preview` gera apenas **preview operacional/regulatorio**, nao proposta comercial
- as telas `contratos` e `financeiro` no frontend hoje sao **visoes derivadas/placeholder**, sem backend transacional correspondente

### 2.3. O que pode ser aproveitado

- **`ServicoCatalogo`** deve ser a referencia oficial de servicos
- **`LeadWhatsApp`** pode ser ligado opcionalmente a uma proposta
- **`Empreendimento`** pode ser ligado opcionalmente quando o lead ja estiver materializado
- **`AuditLog`** deve registrar criacao, recalculo, envio e alteracoes importantes

### 2.4. O que nao deve ser misturado ainda

- **CRM**: nao criar um segundo funil paralelo nem duplicar lead
- **Onboarding/gap analysis**: e um fluxo operacional/regulatorio, nao a fonte principal da proposta comercial da triagem CNAE
- **Contrato**: so depois que proposta persistida estiver madura
- **Financeiro**: parcelas, cobranca, margem operacional e recebimento devem ficar fora da 2.9

---

## 3. Decisao de Modelagem Recomendada

Recomendacao principal:

1. criar **`DiagnosticoComercial`** para persistir o contexto e o resultado da triagem
2. criar **`PropostaComercial`** como cabecalho da proposta
3. criar **`ItemProposta`** como linhas persistidas com snapshot de preco
4. **nao criar `LeadComercial` agora**

Justificativa:

- o repositorio ja possui um lead real: `LeadWhatsApp`
- criar `LeadComercial` agora aumentaria escopo, migracao e risco de duplicar CRM
- a proposta precisa nascer da triagem e nao de um CRM novo
- a separacao entre `DiagnosticoComercial` e `PropostaComercial` preserva rastreabilidade e facilita reuso futuro

Decisao complementar:

- `LeadWhatsApp` entra apenas como **relacao opcional**
- `Empreendimento` entra apenas como **relacao opcional**
- propostas devem continuar existindo mesmo sem lead CRM e mesmo antes de virar empreendimento

---

## 4. Modelo de Dados Proposto

## 4.1. Enums propostos

### `StatusPropostaComercial`

Finalidade:
- controlar o ciclo de vida comercial sem misturar contrato

Valores recomendados:
- `RASCUNHO`
- `PRONTA`
- `ENVIADA`
- `EM_NEGOCIACAO`
- `APROVADA`
- `REJEITADA`
- `EXPIRADA`
- `CANCELADA`

### `OrigemPropostaComercial`

Finalidade:
- registrar de onde a proposta nasceu

Valores recomendados:
- `TRIAGEM_CNAE`
- `CRM`
- `ONBOARDING`
- `MANUAL`

Na 2.9, o uso esperado e `TRIAGEM_CNAE`.

### `PorteDiagnosticoComercial`

Valores:
- `MICRO`
- `PEQUENO`
- `MEDIO`
- `GRANDE`
- `MUITO_GRANDE`

### `SituacaoDiagnosticoComercial`

Valores:
- `PLANEJADO`
- `IMPLANTACAO`
- `OPERACAO`
- `IRREGULAR`
- `RENOVACAO`

### `NivelRiscoComercial`

Valores:
- `BAIXO`
- `MEDIO`
- `ALTO`
- `CRITICO`

### `PotencialPoluidorComercial`

Valores:
- `BAIXO`
- `MEDIO`
- `ALTO`

### `DecisaoItemProposta`

Valores:
- `OBRIGATORIO`
- `CONDICIONAL`
- `OPCIONAL`
- `MANUAL`

---

## 4.2. `DiagnosticoComercial`

Finalidade:
- persistir o input da triagem e o output do diagnostico que originou a proposta
- servir como snapshot auditavel do raciocinio comercial

Campos recomendados:

- `id`: UUID
- `tenantId`: FK `Tenant`
- `criadoPorId`: FK `Usuario`
- `leadWhatsAppId`: FK opcional `LeadWhatsApp`
- `empreendimentoId`: FK opcional `Empreendimento`
- `origem`: `OrigemPropostaComercial`
- `cnaes`: `String[]`
- `uf`: `String` char(2)
- `municipio`: `String?`
- `porte`: `PorteDiagnosticoComercial`
- `situacao`: `SituacaoDiagnosticoComercial`
- `temLicencaAnterior`: `Boolean`
- `temOutorgaAnterior`: `Boolean`
- `cnaePrincipalCodigo`: `String`
- `cnaePrincipalDescricao`: `String`
- `riscoScore`: `Int`
- `riscoNivel`: `NivelRiscoComercial`
- `potencialPoluidor`: `PotencialPoluidorComercial`
- `licenciamentoTipo`: `String`
- `orgaoCompetente`: `String`
- `esfera`: `EsferaRegulatoria`
- `necessitaEIA`: `Boolean`
- `necessitaOutorga`: `Boolean`
- `necessitaMonitoramento`: `Boolean`
- `principaisImpactos`: `String[]`
- `orcamentoMinimo`: `Decimal(12,2)`
- `orcamentoBase`: `Decimal(12,2)`
- `orcamentoMaximo`: `Decimal(12,2)`
- `alertas`: `String[]`
- `proximosPassos`: `String[]`
- `coberturaLimitada`: `Boolean`
- `inputSnapshot`: `Json`
- `resultadoSnapshot`: `Json`
- `criadoEm`: `DateTime`

Relacoes:

- N:1 com `Tenant`
- N:1 com `Usuario`
- N:1 opcional com `LeadWhatsApp`
- N:1 opcional com `Empreendimento`
- 1:N com `PropostaComercial`

Indices:

- `[tenantId, criadoEm]`
- `[tenantId, leadWhatsAppId, criadoEm]`
- `[tenantId, empreendimentoId, criadoEm]`
- `[tenantId, riscoNivel, criadoEm]`

Campos sensiveis:

- `inputSnapshot` e `resultadoSnapshot` sao internos de persistencia
- nao devem ser enviados integralmente para um frontend publico futuro

Campos publicos seguros:

- risco, score, alertas, proximos passos, totais e lista sanitizada de recomendacoes

Impacto multi-tenant:

- obrigatorio
- sempre filtrado por `tenantId`

---

## 4.3. `PropostaComercial`

Finalidade:
- representar a proposta salva que o comercial acompanha e negocia

Campos recomendados:

- `id`: UUID
- `tenantId`: FK `Tenant`
- `diagnosticoId`: FK `DiagnosticoComercial`
- `leadWhatsAppId`: FK opcional `LeadWhatsApp`
- `empreendimentoId`: FK opcional `Empreendimento`
- `criadoPorId`: FK `Usuario`
- `atualizadoPorId`: FK opcional `Usuario`
- `numero`: `String`
- `origem`: `OrigemPropostaComercial`
- `status`: `StatusPropostaComercial`
- `titulo`: `String`
- `nomeLead`: `String?`
- `empresaLead`: `String?`
- `documentoLead`: `String?`
- `emailContato`: `String?`
- `telefoneContato`: `String?`
- `municipio`: `String?`
- `uf`: `String` char(2)
- `subtotalMinimo`: `Decimal(12,2)`
- `subtotalBase`: `Decimal(12,2)`
- `subtotalMaximo`: `Decimal(12,2)`
- `descontoValor`: `Decimal(12,2)` default `0`
- `acrescimoValor`: `Decimal(12,2)` default `0`
- `totalMinimo`: `Decimal(12,2)`
- `totalBase`: `Decimal(12,2)`
- `totalMaximo`: `Decimal(12,2)`
- `moeda`: `String` default `BRL`
- `dataValidade`: `DateTime`
- `observacoesComerciais`: `String?`
- `observacoesInternas`: `String?`
- `catalogoSnapshotEm`: `DateTime`
- `enviadaEm`: `DateTime?`
- `aprovadaEm`: `DateTime?`
- `rejeitadaEm`: `DateTime?`
- `expiradaEm`: `DateTime?`
- `criadoEm`: `DateTime`
- `atualizadoEm`: `DateTime`

Relacoes:

- N:1 com `Tenant`
- N:1 com `DiagnosticoComercial`
- N:1 opcional com `LeadWhatsApp`
- N:1 opcional com `Empreendimento`
- N:1 com `Usuario` criador
- N:1 opcional com `Usuario` atualizador
- 1:N com `ItemProposta`

Indices:

- `@@unique([tenantId, numero])`
- `[tenantId, status, criadoEm]`
- `[tenantId, leadWhatsAppId, criadoEm]`
- `[tenantId, empreendimentoId, criadoEm]`
- `[tenantId, dataValidade]`

Campos sensiveis:

- `observacoesInternas`
- qualquer campo futuro de excecao comercial

Campos publicos seguros:

- numero, status, validade, observacoesComerciais, totais, itens sanitizados

Impacto multi-tenant:

- numero precisa ser unico por tenant
- toda leitura/escrita deve aplicar `tenantId`

Observacao importante:

- a proposta deve salvar **snapshot proprio**
- propostas antigas **nao podem** recalcular automaticamente quando o catalogo mudar

---

## 4.4. `ItemProposta`

Finalidade:
- materializar cada servico incluido na proposta com snapshot do valor daquele momento

Campos recomendados:

- `id`: UUID
- `tenantId`: FK `Tenant`
- `propostaId`: FK `PropostaComercial`
- `servicoCatalogoId`: FK opcional `ServicoCatalogo`
- `ordem`: `Int`
- `origem`: `OrigemPropostaComercial`
- `decisao`: `DecisaoItemProposta`
- `codigoServico`: `String`
- `nomeServico`: `String`
- `categoriaServico`: `String`
- `justificativa`: `String?`
- `quantidade`: `Int` default `1`
- `precoMinimoUnitario`: `Decimal(12,2)`
- `precoBaseUnitario`: `Decimal(12,2)`
- `precoMaximoUnitario`: `Decimal(12,2)`
- `precoAplicadoUnitario`: `Decimal(12,2)`
- `valorMinimoLinha`: `Decimal(12,2)`
- `valorBaseLinha`: `Decimal(12,2)`
- `valorMaximoLinha`: `Decimal(12,2)`
- `valorAplicadoLinha`: `Decimal(12,2)`
- `observacaoLinha`: `String?`
- `editavel`: `Boolean` default `true`
- `ativo`: `Boolean` default `true`
- `snapshotCatalogo`: `Json?`
- `criadoEm`: `DateTime`
- `atualizadoEm`: `DateTime`

Relacoes:

- N:1 com `PropostaComercial`
- N:1 opcional com `ServicoCatalogo`
- N:1 com `Tenant`

Indices:

- `[tenantId, propostaId, ordem]`
- `[tenantId, servicoCatalogoId]`
- `[tenantId, codigoServico]`

Campos sensiveis:

- `snapshotCatalogo` se armazenar dados internos deve permanecer backend-only

Campos publicos seguros:

- codigo, nome, categoria, justificativa, faixa de valores, preco aplicado, totais

Impacto multi-tenant:

- forte
- `tenantId` proprio simplifica filtros e auditoria

---

## 5. Fluxo Funcional Proposto

Fluxo recomendado para a Onda 2.9:

1. Usuario preenche a Triagem Comercial
2. Backend gera o diagnostico via `POST /api/v1/comercial/diagnostico/cnae`
3. Usuario revisa servicos sugeridos e totais preliminares
4. Usuario clica em **Gerar proposta**
5. Backend abre transacao e salva:
   - `DiagnosticoComercial`
   - `PropostaComercial`
   - `ItemProposta`
6. Backend registra auditoria de criacao
7. Tela mostra a proposta salva com numero, status e itens
8. Futuramente a proposta podera:
   - gerar PDF
   - criar nova versao
   - virar contrato

Regra de ouro:

- a triagem continua sendo **ephemera**
- a persistencia comeca apenas ao clicar em **Gerar proposta**

---

## 6. Endpoints Propostos

Os endpoints abaixo sao apenas planejamento.

## 6.1. `POST /api/v1/comercial/propostas`

Finalidade:
- criar proposta persistida a partir de um resultado de triagem

Payload recomendado:

```json
{
  "leadWhatsAppId": "uuid-opcional",
  "empreendimentoId": "uuid-opcional",
  "contato": {
    "nome": "Posto Exemplo",
    "empresa": "Rede Exemplo",
    "documento": "00.000.000/0001-00",
    "email": "contato@exemplo.com",
    "telefone": "62999999999"
  },
  "diagnostico": {
    "input": {
      "cnaes": ["4731-8/00"],
      "uf": "GO",
      "municipio": "Goiania",
      "porte": "MEDIO",
      "situacao": "IRREGULAR",
      "temLicencaAnterior": false,
      "temOutorgaAnterior": false
    },
    "resultado": {}
  },
  "itens": [
    {
      "servicoId": "uuid",
      "codigo": "LIC-004",
      "quantidade": 1,
      "precoAplicadoUnitario": 8000
    }
  ],
  "dataValidade": "2026-06-30T00:00:00.000Z",
  "observacoesComerciais": "Prazo preliminar de mobilizacao de 15 dias."
}
```

Comportamentos esperados:

- validar autenticacao
- validar que todos os itens existem no `ServicoCatalogo` ou estao explicitamente marcados como `MANUAL`
- persistir snapshot do diagnostico e dos itens
- calcular totais no backend
- retornar proposta sanitizada

Resposta recomendada:

```json
{
  "data": {
    "id": "uuid",
    "numero": "PROP-2026-000123",
    "status": "RASCUNHO",
    "totalBase": 45500,
    "totalMinimo": 26800,
    "totalMaximo": 135000,
    "dataValidade": "2026-06-30T00:00:00.000Z",
    "itens": []
  }
}
```

## 6.2. `GET /api/v1/comercial/propostas`

Finalidade:
- listar propostas do tenant

Query sugerida:

- `status`
- `leadWhatsAppId`
- `empreendimentoId`
- `busca`
- `page`
- `limit`

Resposta:

- lista paginada
- numero, lead, status, validade, totais, criadoEm

## 6.3. `GET /api/v1/comercial/propostas/:id`

Finalidade:
- obter detalhe completo de uma proposta

Resposta:

- cabecalho da proposta
- itens
- resumo do diagnostico associado
- auditoria minima ou metadados de criacao

## 6.4. `PATCH /api/v1/comercial/propostas/:id`

Finalidade:
- atualizar dados editaveis da proposta

Escopo minimo recomendado:

- `status`
- `dataValidade`
- `observacoesComerciais`
- `observacoesInternas`
- `itens` editaveis
  - incluir/remover linha
  - alterar quantidade
  - alterar `precoAplicadoUnitario` dentro da regra de permissao

Resposta:

- proposta recalculada e sanitizada

## 6.5. `POST /api/v1/comercial/propostas/:id/recalcular`

Finalidade:
- recalcular proposta em rascunho a partir do catalogo atual

Regra recomendada:

- permitido apenas para `RASCUNHO` e `PRONTA`
- deve atualizar os snapshots dos itens e os totais
- precisa registrar auditoria

Observacao:

- propostas `ENVIADA`, `APROVADA`, `REJEITADA` ou `EXPIRADA` nao devem sofrer recalculo destrutivo

## 6.6. `POST /api/v1/comercial/propostas/:id/aprovar`

Planejamento:

- endpoint pode existir no desenho, mas **nao deve entrar na primeira entrega**
- na fase inicial, mudanca de status via `PATCH` e suficiente

---

## 7. Frontend Proposto

Planejamento de evolucao do frontend, sem implementacao agora:

### 7.1. Triagem Comercial

- adicionar botao **Gerar proposta** apos diagnostico valido
- permitir revisar servicos sugeridos antes da persistencia
- mostrar mensagem clara quando a proposta for salva

### 7.2. Lista de propostas

Rota sugerida:

- `/comercial/propostas`

Conteudo:

- busca
- filtros por status
- lista com numero, lead, validade, total base e atualizacao

### 7.3. Detalhe da proposta

Rota sugerida:

- `/comercial/propostas/[id]`

Conteudo:

- cabecalho
- dados do lead/empreendimento
- resumo do diagnostico
- itens
- totais
- historico minimo

### 7.4. Edicao de itens

Planejamento:

- incluir/remover servicos
- alterar quantidade
- editar preco aplicado conforme permissao
- recalcular no backend

### 7.5. Status da proposta

Exibir:

- `RASCUNHO`
- `PRONTA`
- `ENVIADA`
- `EM_NEGOCIACAO`
- `APROVADA`
- `REJEITADA`
- `EXPIRADA`

---

## 8. Seguranca e Regras

## 8.1. Quem pode criar proposta

Recomendacao:

- `EXECUTIVO`
- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Justificativa:

- sao perfis alinhados com uso comercial e decisao de precificacao

## 8.2. Quem pode ver proposta

Recomendacao minima:

- os mesmos perfis acima
- `ANALISTA` apenas se houver necessidade operacional explicita no futuro

## 8.3. Quem pode editar preco

Recomendacao:

- `EXECUTIVO` pode editar **dentro da faixa** `[precoMinimoUnitario, precoMaximoUnitario]`
- `COORDENADOR`, `ADMIN_TENANT` e `SUPER_ADMIN` podem fazer excecao fora da faixa, com auditoria obrigatoria

## 8.4. Quem pode ver custo e margem

Recomendacao:

- **ninguem no frontend comum**
- custo interno, margem e `valorReferenciaHora` permanecem backend-only
- se um dia houver visao administrativa interna, ela deve ser endpoint separado e restrito

## 8.5. Campos que nunca vao para frontend publico

- `custoInternoEstimado`
- `margemLucroAlvo`
- `valorReferenciaHora`
- `metadata` bruto do catalogo
- `inputSnapshot` bruto
- `resultadoSnapshot` bruto
- `observacoesInternas`
- detalhes de auditoria interna

## 8.6. Snapshot de preco

Decisao obrigatoria:

- proposta salva precisa registrar snapshot de preco por item
- o catalogo pode mudar depois, mas a proposta antiga nao muda junto

Implementacao recomendada:

- `ItemProposta` salva faixa minima/base/maxima e preco aplicado
- `PropostaComercial` salva `catalogoSnapshotEm`
- `DiagnosticoComercial` salva o resultado que originou a selecao

## 8.7. Auditoria

Recomendacao:

- usar a tabela existente **`AuditLog`**
- registrar no minimo:
  - criacao da proposta
  - alteracao de status
  - recalculo
  - alteracao de preco fora da faixa

---

## 9. Riscos e Travas

### Risco 1. Duplicar CRM existente

Problema:
- criar `LeadComercial` agora pode gerar dois leads para o mesmo prospect

Trava:
- nao criar `LeadComercial` na 2.9.1
- reutilizar `LeadWhatsApp` opcionalmente

### Risco 2. Misturar proposta com contrato cedo demais

Problema:
- contaminar modelagem com vigencia contratual, aditivo e operacao

Trava:
- `PropostaComercial` so representa fase pre-contrato
- nenhum campo de contrato entra nesta onda

### Risco 3. Perder snapshot de preco

Problema:
- proposta antiga muda quando o catalogo for alterado

Trava:
- snapshot por item e total persistido na proposta

### Risco 4. Alterar catalogo e mudar proposta antiga

Problema:
- recalculo automatico pode destruir historico comercial

Trava:
- recalculo so em `RASCUNHO` ou `PRONTA`
- status enviados/fechados nao recalculam destrutivamente

### Risco 5. Expor margem ou custo

Problema:
- dado sensivel vazando para frontend ou API comum

Trava:
- DTO sanitizado proprio para proposta
- nenhum serializer reutiliza `ServicoCatalogo` bruto

### Risco 6. Criar migration grande demais

Problema:
- tentar resolver proposta, contrato, PDF e financeiro em uma unica mudanca

Trava:
- dividir em subondas curtas
- primeira migration cria apenas 3 entidades e enums essenciais

### Risco 7. Quebrar multi-tenant

Problema:
- listagem cruzada entre propostas de tenants diferentes

Trava:
- todas as tabelas com `tenantId`
- indices por tenant
- filtros obrigatorios em todas as queries

### Risco 8. Misturar onboarding/orcamento-preview com proposta comercial

Problema:
- preview operacional usa logica e campos que nao sao a proposta da triagem CNAE

Trava:
- proposta 2.9 nasce do diagnostico comercial da triagem
- onboarding continua separado

---

## 10. Plano de Execucao Sugerido

## Onda 2.9.1 — Modelagem Prisma de proposta

Escopo:

- criar enums novos
- criar `DiagnosticoComercial`
- criar `PropostaComercial`
- criar `ItemProposta`
- relacionar com `Tenant`, `Usuario`, `LeadWhatsApp`, `Empreendimento`

Observacao:

- subonda mais segura para comecar

## Onda 2.9.2 — API de proposta

Escopo:

- schemas Zod
- service de criacao/listagem/detalhe/edicao/recalculo
- DTOs sanitizados
- auditoria

## Onda 2.9.3 — UI de proposta a partir da triagem

Escopo:

- botao `Gerar proposta`
- lista de propostas
- detalhe de proposta
- edicao de itens

## Onda 2.9.4 — Testes e build

Escopo:

- testes automatizados da API
- testes de seguranca e sanitizacao
- typecheck/build

## Onda 2.9.5 — PDF ou handoff, somente depois

Escopo posterior:

- exportacao PDF
- eventual handoff para contrato ou onboarding

Pre-condicao:

- proposta persistida precisa estar estavel antes

---

## 11. Recomendacao Final

Recomendacao final:

- iniciar a Onda 2.9 pela **subonda 2.9.1**
- adotar modelagem com **3 entidades novas**:
  - `DiagnosticoComercial`
  - `PropostaComercial`
  - `ItemProposta`
- **nao criar `LeadComercial` agora**
- **nao acoplar contrato, financeiro ou onboarding** nesta primeira entrega

Status da migration:

- **nao liberada nesta etapa**

Motivo:

- esta rodada foi apenas de planejamento tecnico
- ainda falta validacao humana das decisoes de modelagem, nomes finais de enums/campos e estrategia de numeracao da proposta

