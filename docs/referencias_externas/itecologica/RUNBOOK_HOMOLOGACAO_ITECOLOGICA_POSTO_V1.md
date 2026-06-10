# Runbook Homologacao ITECOLOGICA -> Posto V1

## Objetivo

Validar o primeiro fluxo ponta a ponta da integracao:

```text
lead fechado no CRM ITECOLOGICA
  -> handoff operacional emitido
  -> evento recebido no Posto
  -> empresa criada ou reaproveitada
  -> empreendimento criado ou reaproveitado
  -> tarefa inicial criada
```

Este runbook complementa:

- [CONTRATO_TECNICO_CRM_WIN_POSTO_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/CONTRATO_TECNICO_CRM_WIN_POSTO_V1.md)
- [PLANO_EXECUCAO_CONSOLIDADA_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/PLANO_EXECUCAO_CONSOLIDADA_V1.md)

---

## 1. Pre-requisitos

Antes da validacao manual, garantir:

- banco Supabase da `ITECOLOGICA` acessivel
- banco PostgreSQL do `Posto` acessivel
- API do `Posto` iniciando sem erro
- credenciais e variaveis de ambiente configuradas

---

## 2. Aplicacoes obrigatorias de schema

### ITECOLOGICA

Aplicar:

- [backend/supabase/operational_handoff_v1.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/operational_handoff_v1.sql)
- se a tabela ja existir em ambiente anterior, aplicar tambem [backend/supabase/operational_handoff_delivery_tracking_v1.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/operational_handoff_delivery_tracking_v1.sql)
- e [backend/supabase/operational_handoff_posto_links_v1.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/operational_handoff_posto_links_v1.sql)

Resultado esperado:

- tabela `crm_operational_handoffs` criada
- indices de idempotencia ativos
- RLS ativo

### Posto

Aplicar:

- [Posto/sistema/apps/api/prisma/migrations/20260510123000_add_integracao_eventos/migration.sql](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/migrations/20260510123000_add_integracao_eventos/migration.sql)

Depois rodar a geracao do Prisma no `Posto`.

Resultado esperado:

- tabela `integracao_eventos` criada
- client Prisma atualizado

---

## 3. Variaveis de ambiente

### ITECOLOGICA

Configurar na edge function:

- `POSTO_API_BASE_URL`
- `POSTO_INTEGRATION_SHARED_SECRET`

Regra:

- `POSTO_API_BASE_URL` deve apontar para a base da API do `Posto`
- `POSTO_INTEGRATION_SHARED_SECRET` deve ser identica a `INTEGRATION_SHARED_SECRET` do `Posto`

### Posto

Configurar:

- `INTEGRATION_SHARED_SECRET`

Regra:

- nao subir a API com segredo vazio em ambiente de homologacao real

---

## 4. Dados minimos para o teste

No CRM da `ITECOLOGICA`, o lead precisa estar:

- com `status = fechado`
- vinculado a um `diagnosis_case_id`
- com tenant de destino definido

No bloco `Handoff Operacional`, preencher no minimo:

- razao social
- CNPJ valido
- contato principal
- email principal
- telefone principal
- nome do empreendimento
- tipo do empreendimento
- endereco completo
- atividades
- tarefa inicial

---

## 5. Sequencia manual de homologacao

### Etapa 1. Preparar o lead

No CRM:

1. abrir um lead real ou de homologacao
2. confirmar `status = fechado`
3. confirmar existencia de caso de diagnostico
4. preencher o bloco `Handoff Operacional`

### Etapa 2. Emitir o handoff

No CRM:

1. acionar `Emitir handoff operacional`
2. aguardar retorno da edge function

Resultado esperado:

- registro criado em `crm_operational_handoffs`
- `status = queued`, `acknowledged` ou `failed`

### Etapa 3. Verificar a origem na ITECOLOGICA

Confirmar no banco:

- `id`
- `lead_id`
- `diagnosis_case_id`
- `idempotency_key`
- `status`
- `delivery_attempts`
- `last_delivery_attempt_at`
- `last_delivery_http_status`
- `last_delivery_response_body`
- `posto_event_id`
- `posto_empresa_id`
- `posto_empreendimento_id`
- `posto_tarefa_id`

Se `status = failed`, a investigacao comeca por:

- URL incorreta do `Posto`
- segredo divergente
- API do `Posto` indisponivel
- payload incompleto

### Etapa 4. Verificar o recebimento no Posto

Usar a nova rota autenticada:

- `GET /api/v1/integracoes/itecologica/eventos`
- `GET /api/v1/integracoes/itecologica/eventos/:id`
- `POST /api/v1/integracoes/itecologica/eventos/:id/reprocessar`

Na origem `ITECOLOGICA`, o CRM tambem pode reenviar o mesmo handoff pela edge function:

- `retry-operational-handoff`

Resultado esperado:

- evento presente em `integracao_eventos`
- `eventName = crm.win_to_posto.v1`
- `sourceSystem = itecologica`
- `status = materialized` quando a materializacao concluir

### Etapa 5. Verificar a materializacao

No banco do `Posto`, confirmar:

- `Empresa` criada ou reaproveitada por CNPJ
- `Empreendimento` criado ou reaproveitado
- `EmpreendimentoAcesso` para o ator de integracao
- `Tarefa` inicial criada com `regraOrigemId = handoff_id`

### Etapa 6. Verificar auditoria

Consultar a trilha de auditoria do `Posto` e validar:

- `integracao.itecologica.crm_win.recebida`
- `integracao.itecologica.crm_win.materializada`

---

## 6. Criterio de aceite

O fluxo esta homologado quando:

- o handoff sai do CRM sem erro
- o `Posto` recebe o evento com idempotencia valida
- o evento fica auditavel no modulo de integracoes
- `Empresa`, `Empreendimento` e `Tarefa` existem no tenant correto
- a repeticao do mesmo handoff nao duplica a materializacao

---

## 7. Falhas mais provaveis

### 1. Segredo divergente

Sintoma:

- resposta `401` no `Posto`

### 2. Tenant inexistente

Sintoma:

- erro de `Tenant` no receptor

### 3. Sem usuario ativo para assumir a integracao

Sintoma:

- erro de materializacao no `Posto`

Acao:

- garantir ao menos um usuario ativo no tenant alvo

### 4. Dados incompletos do empreendimento

Sintoma:

- validacao falha antes do envio ou rejeicao do payload

### 5. Reenvio do mesmo handoff

Sintoma esperado:

- resposta `200`
- `duplicate = true`
- sem criar nova empresa, novo empreendimento ou nova tarefa

### 6. Materializacao falhou no Posto

Sintoma:

- evento salvo com `status = failed`
- `errorMessage` preenchido

Acao:

- corrigir a causa
- executar `POST /api/v1/integracoes/itecologica/eventos/:id/reprocessar`

### 7. Entrega falhou entre ITECOLOGICA e Posto

Sintoma:

- `crm_operational_handoffs.status = failed`
- erro visivel no historico do CRM

Acao:

- corrigir URL, segredo ou disponibilidade da API
- usar o botao `Reenviar ao Posto` no CRM
- ou chamar a edge function `retry-operational-handoff`

---

## 8. Proximo passo apos homologacao

Depois do aceite do fluxo base:

- expandir onboarding operacional
- abrir criacao de portal do cliente
- acoplar o financeiro inicial
- adicionar monitoracao e reprocessamento controlado para handoffs falhos
