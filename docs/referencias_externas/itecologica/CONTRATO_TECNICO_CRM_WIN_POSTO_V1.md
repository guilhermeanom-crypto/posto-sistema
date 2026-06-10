# Contrato Tecnico CRM Win -> Posto V1

## Status documental

Documento tecnico da Fase 1.

Ele define o contrato oficial entre:

- a camada comercial e de diagnostico da `ITECOLOGICA`
- o nucleo operacional do `Posto`

Escopo desta V1:

- quando um caso comercial e considerado ganho
- quais dados minimos precisam existir
- como o evento deve ser enviado
- como o `Posto` deve materializar o handoff
- quais lacunas do estado atual precisam ser resolvidas

Este documento detalha o item previsto em [PLANO_EXECUCAO_CONSOLIDADA_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/PLANO_EXECUCAO_CONSOLIDADA_V1.md).

A validacao manual do fluxo implementado esta em [RUNBOOK_HOMOLOGACAO_ITECOLOGICA_POSTO_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/RUNBOOK_HOMOLOGACAO_ITECOLOGICA_POSTO_V1.md).

---

## 1. Objetivo

Permitir que um lead ganho na `ITECOLOGICA` gere, de forma rastreavel e idempotente, o inicio da operacao no `Posto`.

Na pratica:

```text
lead ganho na ITECOLOGICA
  -> handoff estruturado
  -> criacao de empresa no Posto
  -> criacao de empreendimento no Posto
  -> criacao de tarefa inicial no Posto
  -> status auditavel de sincronizacao
```

---

## 2. Fontes reais no estado atual

### Origem atual na ITECOLOGICA

Tabelas reais:

- `crm_leads_public`
- `crm_lead_interactions`
- `crm_diagnosis_cases`
- `crm_diagnosis_inputs`
- `crm_diagnosis_runs`
- `crm_diagnosis_artifacts`

Arquivos-base:

- [backend/supabase/schema.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/schema.sql)
- [backend/supabase/crm_interactions_v1.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/crm_interactions_v1.sql)
- [backend/supabase/diagnosis_v1.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/diagnosis_v1.sql)
- [backend/supabase/functions/update-crm-lead/index.ts](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/functions/update-crm-lead/index.ts)
- [backend/supabase/functions/open-diagnosis-case/index.ts](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/functions/open-diagnosis-case/index.ts)

### Destino atual no Posto

Modelos reais:

- `Tenant`
- `Empresa`
- `Empreendimento`
- `EmpreendimentoAcesso`
- `Tarefa`
- `TokenPortal`

Arquivos-base:

- [prisma/schema.prisma](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/schema.prisma)
- [packages/schemas/src/empreendimentos.schema.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/packages/schemas/src/empreendimentos.schema.ts)
- [packages/schemas/src/tarefas.schema.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/packages/schemas/src/tarefas.schema.ts)
- [apps/api/src/modules/empreendimentos/empreendimentos.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/empreendimentos/empreendimentos.service.ts)
- [apps/api/src/modules/onboarding/onboarding.routes.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/onboarding/onboarding.routes.ts)

---

## 3. Decisao tecnica principal

### Decisao 1. O handoff nao entra no LeadWhatsApp

O modulo atual de CRM do `Posto` e focado em `LeadWhatsApp`.

Ele nao deve ser usado como destino do handoff da `ITECOLOGICA`.

Motivo:

- a `ITECOLOGICA` ja e o CRM comercial principal
- o caso ganho nao precisa voltar para um segundo CRM
- o `Posto` deve receber diretamente a estrutura operacional

Consequencia:

- o destino do evento nao e `LeadWhatsApp`
- o destino do evento e `Empresa + Empreendimento + Tarefa inicial`

### Decisao 2. O status `fechado` sozinho nao basta

No CRM atual da `ITECOLOGICA`, existe `status = fechado`.

Isso nao e suficiente, sozinho, para disparar a operacao no `Posto`, porque o lead atual nao contem todos os dados obrigatorios exigidos no core operacional.

Consequencia:

- nao disparar sync automaticamente apenas por `status = fechado`
- criar uma etapa explicita de `handoff operacional`
- essa etapa e a emissora do payload oficial

### Decisao 3. O evento deve nascer em modulo proprio de integracao

No `Posto`, o endpoint nao deve ser encaixado no `crm.routes.ts` atual.

Recomendacao:

- criar modulo novo `integracoes`
- ou criar submodulo dedicado `integracoes/itecologica`

Motivo:

- o comportamento e de sistema-para-sistema
- nao e fluxo de usuario interno comum
- nao e CRM nativo do `Posto`

---

## 4. Lacunas identificadas no estado atual

### Lacuna 1. CNPJ da empresa

Na `ITECOLOGICA`, `crm_leads_public.cnpj` e opcional.

No `Posto`, `Empresa.cnpj` e obrigatorio.

Impacto:

- nao e possivel criar `Empresa` no `Posto` sem CNPJ valido

### Lacuna 2. Endereco operacional do empreendimento

Na `ITECOLOGICA`, o lead atual registra:

- `city`
- `state`

No `Posto`, `Empreendimento` exige:

- `logradouro`
- `numero`
- `bairro`
- `cidade`
- `estado`
- `cep`
- `atividades`

Impacto:

- o lead atual nao possui dados suficientes para criar um `Empreendimento`

### Lacuna 3. Atividades do empreendimento

No `Posto`, `Empreendimento.atividades` e obrigatorio e deve ter ao menos um item.

No CRM atual da `ITECOLOGICA`, esse dado nao existe em estrutura pronta para o core.

### Lacuna 4. Financeiro minimo

No estado auditado atual do `Posto`, nao foi encontrado modulo/modelo financeiro pronto para:

- contrato
- fatura
- pagamento
- cobranca

Impacto:

- o slice tecnico da Fase 1 deve materializar a operacao base
- o financeiro entra como extensao obrigatoria da fase seguinte de schema

### Lacuna 5. Usuario criador da tarefa

No `Posto`, `Tarefa.criadorId` e obrigatorio.

No handoff sistema-para-sistema, nao existe ainda um usuario tecnico padrao de integracao definido.

Impacto:

- sera necessario um `usuario integracao` no tenant alvo
- ou um mapeamento claro para o usuario humano responsavel pela conversao

---

## 5. Gatilho oficial do handoff

### Regra

O handoff operacional so pode ser emitido quando houver:

1. fechamento comercial confirmado
2. dados minimos operacionais preenchidos
3. tenant de destino definido

### Evento canonico

Nome recomendado:

- `crm.win_to_posto.v1`

### Acao emissora

Nova edge function recomendada na `ITECOLOGICA`:

- `emit-operational-handoff`

Ela nao substitui `update-crm-lead`.
Ela acontece depois do fechamento comercial.

---

## 6. Dados minimos obrigatorios para emissao

### Bloco A. Identificacao do handoff

- `handoff_id`
- `handoff_version`
- `occurred_at`
- `idempotency_key`
- `target_tenant_slug`

### Bloco B. Origem comercial

- `lead_id`
- `lead_status`
- `qualification_status`
- `assigned_to`
- `source`
- `source_page`
- `utm_source`
- `utm_medium`
- `utm_campaign`

### Bloco C. Dados da empresa

- `company_name`
- `legal_name`
- `cnpj`
- `primary_contact_name`
- `primary_contact_email`
- `primary_contact_phone`

### Bloco D. Dados do empreendimento

- `enterprise_name`
- `enterprise_type`
- `brand`
- `logradouro`
- `numero`
- `complemento`
- `bairro`
- `cidade`
- `estado`
- `cep`
- `atividades`
- `data_inicio_operacao`

### Bloco E. Contexto tecnico

- `diagnosis_case_id`
- `diagnosis_type`
- `briefing_summary`
- `declared_need`
- `territorial_scope`
- `recommended_next_step`
- `official_diagnostic_artifact_id`
- `official_execution_plan_artifact_id`
- `official_artifacts_generated_at`
- `official_diagnostic_result`
- `official_execution_plan`

### Bloco F. Contexto comercial

- `proposal_external_id`
- `proposal_value`
- `proposal_scope_summary`
- `commercial_notes`

### Bloco G. Operacao inicial

- `responsavel_tecnico_nome`
- `responsavel_tecnico_crea`
- `responsavel_tecnico_email`
- `operational_owner_email`
- `initial_task_title`
- `initial_task_description`
- `initial_due_date`

---

## 7. Payload oficial V1

```json
{
  "handoff_id": "uuid",
  "handoff_version": 1,
  "occurred_at": "2026-05-10T14:30:00.000Z",
  "idempotency_key": "crm-win:lead-uuid:proposal-001",
  "target_tenant_slug": "posto-america",
  "source": {
    "lead_id": "uuid",
    "lead_status": "fechado",
    "qualification_status": "aderente",
    "assigned_to": "comercial@empresa.com",
    "source": "landing-page",
    "source_page": "/",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "postos-goias"
  },
  "company": {
    "company_name": "Auto Posto Exemplo",
    "legal_name": "Auto Posto Exemplo Ltda",
    "cnpj": "00.000.000/0001-00",
    "primary_contact_name": "Joao Silva",
    "primary_contact_email": "joao@posto.com.br",
    "primary_contact_phone": "62999999999"
  },
  "enterprise": {
    "enterprise_name": "Auto Posto Exemplo - Unidade 01",
    "enterprise_type": "revendedor",
    "brand": "bandeira x",
    "logradouro": "Avenida Central",
    "numero": "1000",
    "complemento": "Lote A",
    "bairro": "Centro",
    "cidade": "Goiania",
    "estado": "GO",
    "cep": "74000-000",
    "atividades": [
      "revenda de combustiveis",
      "loja de conveniencia"
    ],
    "data_inicio_operacao": "2024-01-10"
  },
  "diagnosis": {
    "diagnosis_case_id": "uuid",
    "diagnosis_type": "regularizacao_ambiental",
    "briefing_summary": "regularizacao inicial do posto",
    "declared_need": "licenciamento e estrutura operacional",
    "territorial_scope": "Goiania/GO",
    "recommended_next_step": "abrir onboarding e gerar tarefas base",
    "official_diagnostic_artifact_id": "uuid",
    "official_execution_plan_artifact_id": "uuid",
    "official_artifacts_generated_at": "2026-05-10T14:20:00.000Z",
    "official_diagnostic_result": {
      "riskScore": 78,
      "riskLevel": "alto",
      "impactClass": "classe_3",
      "licensingType": "Licenciamento corretivo ou ordinario"
    },
    "official_execution_plan": {
      "summary": {
        "totalPhases": 4,
        "totalTasks": 6,
        "totalDeadlines": 5,
        "totalMonitorings": 2
      }
    }
  },
  "commercial": {
    "proposal_external_id": "PROP-2026-001",
    "proposal_value": 12500.00,
    "proposal_scope_summary": "licenciamento, SST e logistica reversa",
    "commercial_notes": "cliente confirmou inicio imediato"
  },
  "operation": {
    "responsavel_tecnico_nome": "Guilherme de Paula",
    "responsavel_tecnico_crea": "CREA-GO 000000",
    "responsavel_tecnico_email": "diretoria@empresa.com",
    "operational_owner_email": "analista@empresa.com",
    "initial_task_title": "Abrir onboarding tecnico do empreendimento",
    "initial_task_description": "Conferir documentos iniciais, abrir gap analysis e estruturar plano base.",
    "initial_due_date": "2026-05-15T12:00:00.000Z"
  }
}
```

---

## 8. Mapeamento oficial de materializacao

### 8.1 Empresa

Destino:

- `Empresa`

Mapeamento:

- `company.legal_name` -> `Empresa.razaoSocial`
- `company.company_name` -> `Empresa.nome`
- `company.cnpj` -> `Empresa.cnpj`

Regras:

- buscar empresa existente por `tenant + cnpj`
- se existir, reutilizar
- se nao existir, criar

### 8.2 Empreendimento

Destino:

- `Empreendimento`

Mapeamento:

- `empresa.id` -> `Empreendimento.empresaId`
- `enterprise.enterprise_name` -> `Empreendimento.nome`
- `enterprise.enterprise_name` -> `Empreendimento.nomeFantasia` quando aplicavel
- `company.cnpj` ou `enterprise.cnpj` futuro -> `Empreendimento.cnpj`
- `enterprise.brand` -> `Empreendimento.bandeira`
- `enterprise.enterprise_type` -> `Empreendimento.tipo`
- endereco -> campos de endereco do `Empreendimento`
- `operation.responsavel_tecnico_*` -> campos do responsavel tecnico
- `company.primary_contact_email` -> `Empreendimento.contatoEmail`
- `company.primary_contact_phone` -> `Empreendimento.contatoTelefone`
- `enterprise.atividades` -> `Empreendimento.atividades`

Regras:

- buscar por `tenant + cnpj + nome`
- se existir, nao duplicar
- se nao existir, criar

### 8.3 Acesso inicial

Destino:

- `EmpreendimentoAcesso`

Regra:

- se `operation.operational_owner_email` mapear para usuario existente do tenant, criar acesso inicial

### 8.4 Tarefa inicial

Destino:

- `Tarefa`

Mapeamento:

- `enterprise.id` -> `Tarefa.empreendimentoId`
- `operation.initial_task_title` -> `Tarefa.titulo`
- `operation.initial_task_description` -> `Tarefa.descricao`
- `operation.initial_due_date` -> `Tarefa.dataVencimento`
- origem fixa -> `OrigemTarefa.WORKFLOW`

Regras:

- criar com `criadorId` do usuario de integracao ou usuario mapeado
- nao duplicar se ja existir tarefa equivalente para o mesmo `handoff_id`

### 8.5 Financeiro

Destino futuro:

- modulo financeiro do `Posto`

Status:

- fora do schema atual auditado
- deve ser tratado como extensao obrigatoria da proxima fase

---

## 9. Endpoint alvo no Posto

### Rota recomendada

- `POST /api/v1/integracoes/itecologica/crm-win`

### Motivo

- separa integracao de fluxo humano
- evita misturar com `crm.routes.ts`
- deixa claro o boundary de sistema

### Autenticacao recomendada

V1 recomendada:

- `Authorization: Bearer <service-token>`
- `X-Idempotency-Key`
- `X-Source-System: itecologica`

Implementacao atual no `Posto`:

- `X-Integration-Key`
- `X-Source-System: itecologica`
- `X-Idempotency-Key`

Variaveis de ambiente da entrega automatica:

- `ITECOLOGICA`: `POSTO_API_BASE_URL`, `POSTO_INTEGRATION_SHARED_SECRET`
- `Posto`: `INTEGRATION_SHARED_SECRET`

V2 recomendada:

- assinatura HMAC do corpo
- timestamp anti-replay

### Respostas esperadas

#### `202 Accepted`

Evento aceito para processamento.

#### `200 OK`

Evento ja processado anteriormente com mesmo `idempotency_key`.

#### `409 Conflict`

Payload inconsistente com registro ja existente.

#### `422 Unprocessable Entity`

Dados minimos ausentes.

---

## 10. Idempotencia e auditoria

### Chave de idempotencia

Formato recomendado:

- `crm-win:{lead_id}:{proposal_external_id}`

Fallback quando ainda nao houver `proposal_external_id`:

- `crm-win:{lead_id}:{handoff_id}`

### Registro de sync na ITECOLOGICA

Tabela nova recomendada:

- `crm_operational_handoffs`

Campos minimos:

- `id`
- `lead_id`
- `diagnosis_case_id`
- `target_tenant_slug`
- `idempotency_key`
- `payload_json`
- `status`
- `sent_at`
- `acknowledged_at`
- `error_message`

### Registro de sync no Posto

Tabela nova recomendada:

- `integracao_eventos`

Campos minimos:

- `id`
- `source_system`
- `event_name`
- `idempotency_key`
- `payload_json`
- `status`
- `processed_at`
- `error_message`
- `empresa_id`
- `empreendimento_id`
- `tarefa_id`

---

## 11. Criterio de validacao da V1

O contrato V1 esta validado quando:

1. o operador fecha o caso na `ITECOLOGICA`
2. preenche o handoff operacional
3. a `ITECOLOGICA` emite o evento
4. o `Posto` cria ou reutiliza `Empresa`
5. o `Posto` cria ou reutiliza `Empreendimento`
6. o `Posto` cria a tarefa inicial
7. o status fica auditavel dos dois lados
8. o reenvio do mesmo evento nao duplica dados

---

## 12. Ordem de implementacao recomendada

### Passo 1

Criar o documento de payload e os enums compartilhados.

### Passo 2

Criar a tabela `crm_operational_handoffs` na `ITECOLOGICA`.

### Passo 3

Criar a edge function `emit-operational-handoff`.

### Passo 4

Criar o modulo `integracoes` no `Posto`.

### Passo 5

Criar persistencia de idempotencia e auditoria no `Posto`.

### Passo 6

Criar materializador de:

- empresa
- empreendimento
- acesso inicial
- tarefa inicial

### Passo 7

Criar teste manual ponta a ponta com um handoff real.

---

## 13. Decisao final sintetica

O contrato correto nao e:

- `lead fechado -> criar empreendimento automaticamente`

O contrato correto e:

- `lead ganho + handoff estruturado -> criar operacao inicial no Posto`

Esse ajuste evita sincronizacao incompleta, reduz erro de cadastro e permite que o core operacional nasca com dados suficientes para trabalhar de verdade.
