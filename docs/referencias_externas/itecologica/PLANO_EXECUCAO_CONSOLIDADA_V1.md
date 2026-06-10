# Plano de Execucao Consolidada V1

## Status documental

Documento operacional de construcao.

Ele pega a direcao definida em [ARQUITETURA_CONSOLIDADA_ITECOLOGICA_POSTO_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/ARQUITETURA_CONSOLIDADA_ITECOLOGICA_POSTO_V1.md) e a converte em:

- ordem de implementacao
- fases
- dependencias
- ownership
- criterio de pronto
- primeiro fluxo obrigatorio

Este documento nao substitui a arquitetura.
Ele e o plano pratico para executar a arquitetura.

---

## 1. Objetivo de construcao

Construir uma esteira unica para a consultoria, onde:

- o lead entra pela `ITECOLOGICA`
- o comercial qualifica e converte
- o diagnostico produz plano tecnico inicial
- o `Posto` recebe o cliente e o empreendimento
- a operacao passa a ser conduzida no `Posto`
- o financeiro fecha o ciclo

Resultado esperado:

> nenhum caso novo depende de planilha, controle paralelo ou perda de contexto entre comercial, tecnico e operacao

---

## 2. Regra de construcao

### Regra 1. Construir por fluxo

Nao comecar por "fazer todas as telas".

Comecar por um fluxo completo:

```text
lead
  -> crm
  -> diagnostico
  -> proposta
  -> ganho
  -> cliente
  -> empreendimento
  -> tarefa inicial
  -> prazo inicial
  -> registro financeiro inicial
```

### Regra 2. Um modulo so entra se tiver dono

- `ITECOLOGICA` cuida do pre-venda
- `Posto` cuida da operacao
- `HABILIS` cuida da inteligencia

### Regra 3. Nao abrir migracao ampla antes do primeiro fluxo

Antes de migrar mais modulos, o primeiro fio ponta a ponta precisa estar validado.

### Regra 4. Integracao antes de redesign

Primeiro fazer os sistemas conversarem.
Depois redesenhar interfaces se necessario.

---

## 3. Fontes de implementacao

### Base comercial e diagnostico

- [ITECOLOGICA/app/](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/app/)
- [ITECOLOGICA/crm/](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/crm/)
- [ITECOLOGICA/analista/](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/analista/)
- [ITECOLOGICA/backend/supabase/](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/)
- [ITECOLOGICA/backend/domain/diagnostic/](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/domain/diagnostic/)

### Base operacional principal

- [Posto/sistema/apps/api/src/modules/](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/)
- [Posto/sistema/apps/web/src/app/](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/app/)
- [Posto/sistema/apps/worker/src/](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/worker/src/)

### Base metodologica

- [HABILIS_AI/agentes/](/home/guilherme/Projetos%20VS%20CODE/HABILIS_AI/agentes/)
- [HABILIS_AI/modelos/](/home/guilherme/Projetos%20VS%20CODE/HABILIS_AI/modelos/)

### Base visual oficial do core operacional

- [INTERFACE/enviro-clarity-main/src/components/AppLayout.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/components/AppLayout.tsx)
- [INTERFACE/enviro-clarity-main/src/components/AppSidebar.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/components/AppSidebar.tsx)
- [INTERFACE/enviro-clarity-main/src/components/Header.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/components/Header.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/Dashboard.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/Dashboard.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/EmpreendimentosList.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/EmpreendimentosList.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/EmpreendimentoDossier.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/EmpreendimentoDossier.tsx)

Regra:

- o `Posto` nao deve nascer com um front novo inventado do zero
- o core operacional usa a linguagem visual consolidada do `Habilis Posto`
- a adaptacao e de dados, integracao, nomenclatura e branding fino, nao de ruptura de UX

---

## 4. Fase 0. Fundacao decisoria

### Objetivo

Fechar as regras que impedem retrabalho.

### Entregas

- arquitetura consolidada aprovada
- `Posto` eleito como core operacional
- `ITECOLOGICA` congelada como front office
- `HABILIS` definido como motor interno
- naming final dos eventos de integracao

### Criterio de pronto

- documento de arquitetura aprovado
- documento de execucao aprovado
- equipe sabe onde cada feature nova deve nascer

### Status

- concluido documentalmente

---

## 5. Fase 1. Contrato de integracao

### Objetivo

Definir exatamente o que sai da `ITECOLOGICA` e entra no `Posto`.

Documento tecnico desta fase:

- [CONTRATO_TECNICO_CRM_WIN_POSTO_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/CONTRATO_TECNICO_CRM_WIN_POSTO_V1.md)
- [RUNBOOK_HOMOLOGACAO_ITECOLOGICA_POSTO_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/RUNBOOK_HOMOLOGACAO_ITECOLOGICA_POSTO_V1.md)

### Entregas obrigatorias

#### 1. Evento de conversao comercial

Payload minimo:

- `lead_id`
- `lead_source`
- `cliente_nome`
- `cliente_cnpj`
- `contato_principal`
- `email_principal`
- `telefone_principal`
- `endereco_base`
- `escopo_contratado`
- `tipo_empreendimento`
- `cidade`
- `uf`
- `proposal_id`
- `contract_value`
- `diagnosis_case_id`

#### 2. Evento de criacao operacional

Payload derivado:

- `client`
- `enterprise`
- `initial_execution_plan`
- `initial_deadlines`
- `initial_tasks`
- `initial_financial_entry`

#### 3. Chave de idempotencia

Formato recomendado:

- `crm-win:{lead_id}:{proposal_id}`

#### 4. Mapa de estado

Estados minimos:

- `lead_novo`
- `lead_em_contato`
- `lead_qualificado`
- `proposta_emitida`
- `ganho`
- `cliente_ativo`
- `empreendimento_em_onboarding`
- `operacao_ativa`

### Ownership tecnico

- origem: `ITECOLOGICA/backend/supabase/functions/`
- destino: novo modulo `Posto/sistema/apps/api/src/modules/integracoes/itecologica`
- materializacao: `modules/onboarding`, `modules/empreendimentos` e `modules/tarefas`

### Criterio de pronto

- payload documentado
- endpoint receptor definido
- chave de idempotencia definida
- tabela ou log de sincronizacao definida

---

## 6. Fase 2. Primeiro vertical slice

### Objetivo

Fazer o primeiro caso atravessar a esteira inteira.

### Escopo do slice

#### Na ITECOLOGICA

- lead entra
- CRM qualifica
- diagnostico e aberto
- proposta e marcada como ganha

#### Na integracao

- evento de ganho dispara sincronizacao

#### No Posto

- cliente e criado
- empreendimento e criado
- tarefa inicial e criada
- prazo inicial e criado
- item financeiro inicial e criado

### Entregas tecnicas

#### Backend

- endpoint `POST /integracoes/itecologica/crm-win`
- servico de idempotencia
- persistencia de sync status
- criacao de `client`
- criacao de `enterprise`
- criacao de `task`
- criacao de `deadline`

Observacao importante:

- o financeiro minimo continua obrigatorio no programa
- mas o schema financeiro nao apareceu pronto no estado atual auditado do `Posto`
- por isso, a materializacao financeira deve entrar como extensao da fase seguinte, nao como precondicao para o primeiro handoff tecnico

#### Frontend

- sinal visivel no CRM de que o caso foi sincronizado
- visao inicial no `Posto` para localizar o empreendimento criado

#### Auditoria

- log de entrada
- log de processamento
- log de erro
- log de sucesso

### Ownership tecnico

- `ITECOLOGICA`: disparo
- `Posto API`: recebimento e materializacao
- `Posto Web`: visualizacao minima

### Criterio de pronto

- um lead ganho cria operacao real no `Posto`
- o fluxo nao duplica registro em reenvio
- o status de sync pode ser auditado

---

## 7. Fase 3. Operacao base

### Objetivo

Transformar o `Posto` no lugar real da rotina operacional.

### Modulos que entram nesta fase

- `empreendimentos`
- `documentos`
- `tarefas`
- `condicionantes`
- `processos`
- `cockpit`
- `alertas`

### Entregas

- dossie do empreendimento
- calendario operacional minimo
- lista de prazos
- lista de tarefas
- armazenamento de documento e evidencia
- painel com pendencias prioritarias
- shell visual consolidado com `sidebar + header + dashboard + dossier` no padrao `Habilis Posto`

### Ownership tecnico

- `Posto/sistema/apps/api/src/modules/empreendimentos`
- `Posto/sistema/apps/api/src/modules/documentos`
- `Posto/sistema/apps/api/src/modules/tarefas`
- `Posto/sistema/apps/api/src/modules/condicionantes`
- `Posto/sistema/apps/api/src/modules/cockpit`
- `Posto/sistema/apps/api/src/modules/alertas`

### Criterio de pronto

- o analista consegue conduzir um empreendimento sem planilha paralela
- o analista reconhece continuidade visual e operacional entre o prototipo consolidado e o sistema vivo

---

## 8. Fase 4. Materializacao do diagnostico

### Objetivo

Fazer o resultado do diagnostico gerar estrutura operacional automaticamente.

### Regra

Diagnostico aprovado nao pode virar anotacao morta.

Ele deve gerar:

- tarefas
- prazos
- documentos requeridos
- checklists
- observacoes iniciais

### Entregas

- contrato de saida oficial do diagnostico
- tradutor `diagnostico -> execution_plan`
- materializador `execution_plan -> operacao`

### Ownership tecnico

- origem: `ITECOLOGICA/backend/domain/diagnostic/`
- motor: `HABILIS_AI/`
- destino: `Posto/sistema/apps/api/src/modules/onboarding`, `tarefas`, `condicionantes`, `documentos`

### Criterio de pronto

- um diagnostico aprovado gera esqueleto operacional utilizavel sem recadastro manual

---

## 9. Fase 5. Modulos prioritarios de posto

### Objetivo

Atacar primeiro as dores mais concretas da operacao.

### Ordem recomendada

1. `licencas-ambientais`
2. `sst`
3. `logistica-reversa`
4. `estanqueidade`
5. `fiscalizacoes`

### Motivo da ordem

- licencas estruturam risco e vencimento
- SST gera recorrencia forte
- logistica reversa gera operacao continua
- estanqueidade e essencial no nicho
- fiscalizacoes entram como camada critica de contingencia

### Criterio de pronto

- o empreendimento ativo possui cobertura basica das obrigacoes mais recorrentes

---

## 10. Fase 6. Financeiro minimo obrigatorio

### Objetivo

Fechar o ciclo economico do servico dentro do sistema.

### Entregas

- cliente
- contrato
- parcela
- cobranca
- pagamento
- status de recebimento
- resumo de carteira

### Regra

Nao deixar o financeiro para uma fase distante.

Sem isso, o sistema continua incompleto do ponto de vista da empresa.

### Ownership tecnico

- criar ou adaptar modulo financeiro no `Posto`
- integrar com `crm` e `empreendimentos`

### Criterio de pronto

- cada cliente ativo tem vinculo claro com contrato e cobranca

---

## 11. Fase 7. Portal do cliente

### Objetivo

Abrir acompanhamento controlado para o cliente.

### Escopo

- documentos
- tarefas
- alertas
- condicionantes
- mensagens controladas

### Base tecnica

- `Posto/sistema/apps/api/src/modules/portal`
- `Posto/sistema/apps/web/src/app/portal`

### Criterio de pronto

- cliente consegue acompanhar sem acessar a operacao interna completa

---

## 12. Fase 8. IA operacional

### Objetivo

Plugar inteligencia no dia a dia real, nao apenas no diagnostico inicial.

### Casos de uso priorizados

- leitura de PDF
- extração de condicionantes
- classificacao documental
- sugestao de prazo
- rascunho de defesa tecnica
- resumo executivo

### Base tecnica

- `Posto/sistema/apps/api/src/modules/ia`
- `HABILIS_AI/agentes`
- `ITECOLOGICA/backend/domain/diagnostic`

### Criterio de pronto

- IA reduz tempo operacional em atividade concreta e auditavel

---

## 13. Quadro de prioridade

### Prioridade altissima

- contrato de integracao
- primeiro vertical slice
- operacao base
- financeiro minimo

### Prioridade alta

- materializacao do diagnostico
- licencas
- SST
- logistica reversa

### Prioridade media

- estanqueidade
- fiscalizacoes detalhadas
- portal expandido

### Prioridade posterior

- automacoes mais sofisticadas
- score preditivo mais avancado
- refinamentos visuais amplos

---

## 14. Backlog imediato de construcao

### Bloco 1. Documentar contrato tecnico

- criar documento de payload `crm win -> posto`
- definir endpoint e autenticacao
- definir tabela de sync

### Bloco 2. Implementar recepcao no Posto

- endpoint receptor
- validacao
- idempotencia
- auditoria

### Bloco 3. Implementar materializacao minima

- cliente
- empreendimento
- tarefa inicial
- prazo inicial
- item financeiro inicial

### Bloco 4. Dar visibilidade do resultado

- status no CRM
- visualizacao no Posto

### Bloco 5. Fechar teste manual

- criar lead de ponta a ponta
- marcar ganho
- validar se a operacao nasceu corretamente

### Bloco 6. Preservar o padrao visual oficial

- mapear quais componentes do `INTERFACE/enviro-clarity-main` serao transplantados primeiro
- definir quais telas do `Posto` devem herdar esse shell
- impedir desvio para um layout novo sem necessidade funcional

---

## 15. Definicao de pronto do programa

O programa pode ser considerado validado quando:

- um cliente entra pela `ITECOLOGICA`
- a proposta e ganha
- o caso nasce automaticamente no `Posto`
- o analista opera o empreendimento no `Posto`
- o financeiro acompanha o contrato no `Posto`
- o cliente acompanha pelo portal
- a inteligencia acelera diagnostico e operacao sem romper a trilha de auditoria

---

## 16. Proximo passo recomendado

O proximo passo tecnico, depois deste documento, e:

1. criar o contrato detalhado de integracao `crm win -> posto`
2. mapear quais tabelas do `Posto` vao receber `client`, `enterprise`, `task`, `deadline` e `financial_entry`
3. implementar o primeiro endpoint de sincronizacao

Esse e o ponto em que a consolidacao deixa de ser planejamento e vira sistema.
