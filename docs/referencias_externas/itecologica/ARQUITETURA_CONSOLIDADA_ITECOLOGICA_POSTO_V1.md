# Arquitetura Consolidada ITECOLOGICA + Posto + HABILIS V1

## Status documental

Documento diretor de consolidacao.

Ele organiza, em uma unica leitura:

- o papel final da `ITECOLOGICA`
- o papel final do `Posto`
- o papel final do `HABILIS_AI`
- a arquitetura-alvo do produto
- o plano de construcao em ordem correta
- o corte realista de 24 horas para fechar a direcao

Se houver conflito com documentos anteriores, a regra e:

1. este documento define a arquitetura consolidada de destino
2. os documentos V1 seguem valendo para a operacao atual que ja esta no ar
3. a migracao so acontece por fases, sem quebrar o que hoje ja funciona

Ver tambem:

- [MAPA_SISTEMA_CENTRAL_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/MAPA_SISTEMA_CENTRAL_V1.md)
- [PROCESSO_CONSTRUCAO_V2.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/PROCESSO_CONSTRUCAO_V2.md)
- [PLANO_TRANSPLANTE_HABILIS_GESTAO_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/PLANO_TRANSPLANTE_HABILIS_GESTAO_V1.md)
- [ORQUESTRACAO_HABILIS_ITECOLOGICA_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/ORQUESTRACAO_HABILIS_ITECOLOGICA_V1.md)
- [Posto/ARQUITETURA.md](/home/guilherme/Projetos%20VS%20CODE/Posto/ARQUITETURA.md)
- [Posto/sistema/PLANEJAMENTO.md](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/PLANEJAMENTO.md)

---

## 1. Decisao central

### Decisao oficial

O sistema final da empresa nao deve ser construido inteiramente dentro da base atual da `ITECOLOGICA`.

A consolidacao correta e:

- `ITECOLOGICA` = camada de aquisicao, relacionamento, CRM e intake tecnico
- `Posto` = nucleo operacional principal da empresa
- `HABILIS_AI` = motor metodologico e de automacao tecnica

### Motivo da decisao

A `ITECOLOGICA` ja esta bem posicionada para:

- site publico
- entrada de lead
- CRM comercial
- abertura e estruturacao do diagnostico

O `Posto` ja esta mais proximo de um sistema operacional completo porque possui base mais madura para:

- operacao regulatoria
- modulos de dominio
- backend estruturado
- workers e agendamentos
- portal
- trilhas de auditoria
- expansao para financeiro e automacoes

O `HABILIS_AI` ja contem o conhecimento metodologico que deve orientar:

- leitura documental
- enquadramento tecnico
- diagnostico
- auditoria
- plano de execucao

### Erro que este documento evita

Evitar transformar a `ITECOLOGICA` em um ERP completo em cima de uma base que hoje foi otimizada para:

- site publico
- frontend estatico
- CRM V1
- diagnostico guiado por Supabase

Isso continua util e estrategico, mas nao deve carregar sozinho toda a gestao operacional, financeira e regulatoria de longo prazo.

---

## 2. Perfil da empresa e posicionamento

### Perfil empresarial

A empresa deve ser posicionada como:

> consultoria ambiental e regulatoria especializada em postos de combustivel, com operacao rastreavel, conectada e assistida por inteligencia tecnica

### Tese de produto

O produto nao e um site com CRM.

O produto final e uma esteira operacional completa que cobre:

- captacao
- qualificacao
- diagnostico
- proposta
- onboarding
- execucao tecnica
- acompanhamento regulatorio
- eventos criticos
- portal do cliente
- financeiro
- visao executiva

### Posicionamento de marca

- `ITECOLOGICA` permanece como marca de mercado, autoridade tecnica e porta de entrada comercial
- `Posto` vira a plataforma operacional principal da empresa
- `HABILIS` aparece como camada interna de inteligencia, metodo e automacao

### Posicionamento do site

O site da `ITECOLOGICA` deve comunicar:

- especializacao em postos de combustivel
- metodo tecnico proprietario
- rastreabilidade operacional
- reducao de risco regulatorio
- capacidade de conduzir o empreendimento do primeiro contato ao acompanhamento continuado

Ou seja:

- o cliente entra pela `ITECOLOGICA`
- o caso e estruturado pela `ITECOLOGICA`
- a operacao roda no `Posto`
- a inteligencia vem do `HABILIS`

### Decisao oficial de interface

Sim, o padrao visual e estrutural consolidado do `Habilis Posto` deve ser mantido no sistema operacional principal.

Na pratica, isso significa:

- `ITECOLOGICA` mantém identidade propria no site, landing pages, CRM e entrada comercial
- `Posto` adota como referencia oficial o layout consolidado do `Habilis Posto`
- `HABILIS` permanece como a matriz visual e estrutural do ambiente interno de operacao

Base de referencia principal:

- [INTERFACE/enviro-clarity-main/src/components/AppLayout.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/components/AppLayout.tsx)
- [INTERFACE/enviro-clarity-main/src/components/AppSidebar.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/components/AppSidebar.tsx)
- [INTERFACE/enviro-clarity-main/src/components/Header.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/components/Header.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/Dashboard.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/Dashboard.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/EmpreendimentoDossier.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/EmpreendimentoDossier.tsx)

Regra de produto:

- o ambiente publico pode ter linguagem mais institucional e comercial
- o ambiente operacional deve priorizar continuidade visual, densidade de informacao, navegacao lateral, contexto do empreendimento e ergonomia de trabalho
- nao redesenhar o core operacional a partir de uma identidade nova se o layout `Habilis Posto` ja resolve bem o problema

---

## 3. Arquitetura de negocio

### Fluxo ponta a ponta oficial

```text
Site / Landing
  -> Captacao de lead
  -> CRM comercial
  -> Qualificacao
  -> Diagnostico inicial
  -> Proposta
  -> Fechamento
  -> Criacao do cliente
  -> Criacao do empreendimento
  -> Plano oficial de execucao
  -> Tarefas / prazos / documentos / agendas
  -> Monitoramento regulatorio continuo
  -> Eventos criticos / fiscalizacoes / autos
  -> Financeiro
  -> Dashboard executivo
  -> Portal do cliente
```

### Regra de ownership

#### ITECOLOGICA

Responsavel por:

- captar
- qualificar
- diagnosticar
- converter

#### Posto

Responsavel por:

- operar
- controlar
- provar
- alertar
- consolidar
- faturar

#### HABILIS_AI

Responsavel por:

- ler
- estruturar
- sugerir
- auditar
- acelerar

---

## 4. Arquitetura tecnica consolidada

### Camada 1. Front office

Base principal:

- `ITECOLOGICA/app/`
- `ITECOLOGICA/crm/`
- `ITECOLOGICA/analista/`

Papel:

- site publico
- CRM comercial
- intake tecnico
- abertura de caso
- diagnostico inicial assistido
- geracao de proposta

Stack atual:

- HTML/CSS/JS estatico
- Supabase
- edge functions

Decisao:

- manter operacional
- estabilizar
- nao expandir ate virar ERP
- usar como porta de entrada da esteira

### Camada 2. Core operacional

Base principal:

- `Posto/sistema/apps/web`
- `Posto/sistema/apps/api`
- `Posto/sistema/apps/worker`

Papel:

- dossie do empreendimento
- modulos regulatorios
- tarefas e prazos
- documentos e evidencias
- automacoes
- agenda e notificacoes
- portal do cliente
- financeiro
- painel executivo

Stack atual:

- Next.js
- Fastify
- Prisma
- PostgreSQL
- Redis
- BullMQ
- object storage

Decisao:

- eleger como base oficial do sistema operacional final
- manter como padrao de UI o layout consolidado do `Habilis Posto`, transplantado e adaptado para o `Posto`

### Camada 3. Motor de inteligencia

Base principal:

- `HABILIS_AI/agentes/`
- `HABILIS_AI/modelos/`
- `ITECOLOGICA/backend/domain/diagnostic/`

Papel:

- leitura de documentos
- extração de requisitos
- enquadramento tecnico
- formacao do diagnostico
- auditoria metodologica
- sugestao de plano oficial de execucao

Decisao:

- transformar em servico interno consumido pelo core operacional
- remover dependencia de uso manual desorganizado

---

## 5. Sistema-alvo por modulos

### Modulo A. Presenca digital e captacao

Dono:

- `ITECOLOGICA`

Escopo:

- landing pages
- formularios
- CTA por servico
- WhatsApp inicial
- captura de lead
- entrada de origem de campanha

### Modulo B. CRM comercial

Dono:

- `ITECOLOGICA`

Escopo:

- funil
- follow-up
- historico
- qualificacao
- proposta
- fechamento

### Modulo C. Diagnostico inicial

Dono:

- `ITECOLOGICA` + `HABILIS`

Escopo:

- abertura de caso
- briefing
- intake documental
- pipeline metodologico
- diagnostico inicial
- plano de execucao preliminar

### Modulo D. Cadastro mestre

Dono:

- `Posto`

Escopo:

- cliente
- contrato
- empreendimento
- usuarios
- responsaveis
- escopo contratado

### Modulo E. Gestao operacional

Dono:

- `Posto`

Escopo:

- tarefas
- prazos
- condicionantes
- atuacoes
- documentos
- calendario
- evidencias

### Modulo F. Dominios tecnicos de posto

Dono:

- `Posto`

Escopo:

- licencas ambientais
- regulatorio urbano
- SST
- ANP/INMETRO
- estanqueidade
- logistica reversa
- outorga hidrica
- monitoramento ambiental
- autos e defesa tecnica

### Modulo G. Automacoes e inteligencia

Dono:

- `Posto` + `HABILIS`

Escopo:

- leitura de PDF
- classificacao de documento
- extração de condicionantes
- geracao de alerta
- rascunho tecnico
- defesa preliminar
- resumo executivo

### Modulo H. Portal do cliente

Dono:

- `Posto`

Escopo:

- acompanhamento
- documentos
- tarefas
- alertas
- condicionantes
- comunicacao controlada

### Modulo I. Financeiro

Dono:

- `Posto`

Escopo:

- proposta aceita
- contrato
- cobranca
- parcelas
- recebimento
- inadimplencia
- margem por cliente
- receita por empreendimento

### Modulo J. Inteligencia executiva

Dono:

- `Posto`

Escopo:

- KPIs
- risco
- vencimentos
- carteira
- previsibilidade
- gargalos

---

## 6. Modelo de dados mestre

### Entidades centrais

O sistema final deve girar em torno destas entidades:

- `lead`
- `lead_interaction`
- `diagnosis_case`
- `diagnosis_run`
- `proposal`
- `client`
- `contract`
- `enterprise`
- `execution_plan`
- `task`
- `deadline`
- `document`
- `regulatory_event`
- `inspection`
- `infraction_notice`
- `appeal`
- `financial_entry`
- `invoice`
- `payment`

### Regra de transicao de dados

O `lead` nasce na `ITECOLOGICA`, mas o `cliente` e o `empreendimento` passam a ser entidades do `Posto`.

A transicao oficial e:

```text
lead
  -> proposta
  -> contrato
  -> cliente
  -> empreendimento
  -> plano operacional
```

### Regra de verdade

- CRM e diagnostico inicial guardam a verdade pre-venda
- Posto guarda a verdade pos-fechamento e operacional
- nao duplicar cadastro operacional em dois bancos como rotina

---

## 7. Integracao entre os sistemas

### Integracao 1. ITECOLOGICA -> Posto

Disparo:

- proposta aceita
- contrato fechado
- ou status comercial equivalente a ganho

Efeito:

- cria cliente no core
- cria empreendimento no core
- cria escopo inicial contratado
- cria plano operacional inicial

### Integracao 2. HABILIS -> Posto

Disparo:

- caso de diagnostico aprovado

Efeito:

- materializa plano de execucao
- sugere tarefas iniciais
- sugere prazos
- sugere matriz documental

### Integracao 3. Posto -> ITECOLOGICA

Uso limitado:

- retorno de status comercial relevante
- indicadores de conversao
- fechamento de ciclo para historico de origem

### Estrategia de integracao recomendada

Fase inicial:

- integracao via API/edge function com payload bem definido

Fase seguinte:

- eventos de dominio
- fila
- idempotencia
- trilha de auditoria

---

## 8. Principios de engenharia oficiais

### 1. Um nucleo principal

Nao manter duas verdades operacionais em paralelo.

### 2. Migrar por fluxo, nao por tela

Primeiro fecha um fluxo ponta a ponta.
Depois expande.

### 3. Reaproveitar antes de reescrever

Se um modulo do `Posto` ja resolve 70% ou mais do problema, ele e a base.

### 4. Separar pre-venda de operacao

CRM e intake nao devem carregar toda a complexidade operacional.

### 5. IA acelera, nao governa sozinha

IA sugere, estrutura e audita.
Humano aprova.

### 6. Materializacao automatica

Diagnostico aprovado deve gerar estrutura operacional sem redigitar tudo.

### 7. Financeiro entra cedo

Nao deixar o financeiro para o fim.
Operacao sem fechamento financeiro gera sistema incompleto.

### 8. Tudo rastreavel

Status, documentos, tarefas, autos, prazos e recebimentos precisam de trilha.

---

## 9. O que reaproveitar de cada base

### Reaproveitamento da ITECOLOGICA

Reaproveitar quase integralmente:

- `app/`
- `crm/`
- `analista/`
- edge functions de lead e diagnostico
- fluxo de handoff comercial

Reaproveitar adaptando:

- modelo de diagnostico para alimentar o core
- proposta e fechamento comercial

Nao expandir como base final de ERP:

- gestao operacional profunda
- financeiro estruturado
- modulos regulatorios amplos

### Reaproveitamento do Posto

Reaproveitar como base principal:

- `apps/web`
- `apps/api`
- `apps/worker`
- modulos regulatorios ja modelados
- alertas
- score
- portal
- auditoria

Adaptar:

- remover o que estiver excessivamente acoplado a uma narrativa antiga
- alinhar naming, branding e fluxo comercial de entrada
- conectar com a origem `ITECOLOGICA`

### Reaproveitamento do HABILIS

Reaproveitar como motor:

- agentes
- ordem metodologica
- estrutura de conhecimento
- logica de auditoria

Adaptar:

- transformacao para servico consumivel
- schema de entrada e saida
- integracao com o `Posto`

---

## 10. Roadmap em ordem correta

### Fase 0. Batida de martelo arquitetural

Objetivo:

- decidir oficialmente o `Posto` como core operacional
- congelar a `ITECOLOGICA` como front office
- definir `HABILIS` como camada de inteligencia

Saida:

- documento aprovado
- ownership por modulo definido

### Fase 1. Consolidacao do front office

Objetivo:

- estabilizar `site + CRM + diagnostico`

Entregas:

- revisar origem canonica
- fechar o fluxo lead -> CRM -> diagnostico -> proposta
- limpar duplicidades documentais e de publicacao

### Fase 2. Definicao do contrato de integracao

Objetivo:

- definir payloads oficiais entre `ITECOLOGICA` e `Posto`

Entregas:

- schema de cliente
- schema de empreendimento
- schema de proposta ganha
- schema de plano inicial
- chave de idempotencia

### Fase 3. Primeiro vertical slice completo

Objetivo:

- validar o sistema com um fio ponta a ponta

Fluxo:

```text
Lead
  -> CRM
  -> Diagnostico
  -> Proposta
  -> Ganho
  -> Criacao de cliente
  -> Criacao de empreendimento
  -> Criacao de tarefa e prazo inicial
  -> Criacao de item financeiro inicial
```

### Fase 4. Operacao tecnica base

Objetivo:

- tornar o `Posto` o lugar real da operacao diaria

Entregas:

- empreendimento
- dossie
- tarefas
- prazos
- documentos
- calendario
- alertas

### Fase 5. Dominios regulatorios prioritarios

Objetivo:

- ligar a gestao do posto nas dores mais concretas

Prioridade:

1. licencas ambientais
2. SST
3. logistica reversa
4. estanqueidade
5. fiscalizacoes e autos

### Fase 6. Financeiro operacional

Objetivo:

- fechar o ciclo empresa -> servico -> faturamento

Entregas:

- contratos
- parcelas
- faturamento
- recebimento
- inadimplencia
- indicadores financeiros por cliente

### Fase 7. Portal do cliente e comunicacao

Objetivo:

- externalizar parte da operacao sem perder controle

Entregas:

- documentos
- tarefas
- condicionantes
- mensagens
- comprovacoes

### Fase 8. IA operacional completa

Objetivo:

- plugar o `HABILIS` de forma madura no dia a dia

Entregas:

- extração automatica de documento
- geracao de obrigacoes
- sugestao de plano
- rascunho de resposta tecnica
- resumo executivo

---

## 11. Plano de 24 horas

### O que e possivel fechar em 24h

Nao e construir o sistema inteiro.

E fechar a fundacao correta para construir sem retrabalho.

### Entrega de 24h recomendada

#### Bloco 1. Arquitetura oficial

- aprovar este documento
- bater o martelo no `Posto` como core
- congelar fronteiras da `ITECOLOGICA`

#### Bloco 2. Inventario de reaproveitamento

- listar modulos que entram como estao
- listar modulos que entram adaptados
- listar modulos que saem de escopo

#### Bloco 3. Contrato de integracao

- definir os payloads oficiais
- definir evento de conversao comercial
- definir criacao automatica de cliente/empreendimento

#### Bloco 4. Vertical slice

- escolher o primeiro fluxo obrigatorio

Fluxo recomendado:

```text
lead
  -> crm
  -> diagnostico
  -> proposta
  -> ganho
  -> empreendimento
  -> tarefa/prazo inicial
  -> lancamento financeiro inicial
```

#### Bloco 5. Backlog imediato

- quebrar as primeiras fatias de implementacao
- definir responsavel, dependencia e criterio de pronto

### O que NAO tentar fazer em 24h

- migrar todos os modulos
- redesenhar toda a interface
- fundir bancos sem contrato definido
- refazer o CRM do zero
- plugar IA em tudo ao mesmo tempo

---

## 12. Backlog inicial recomendado

### Sprint 1. Fundacao

- oficializar `Posto` como core
- criar mapa de entidades mestre
- definir contrato de integracao `lead ganho -> cliente/empreendimento`
- definir naming final do sistema

### Sprint 2. Vertical slice comercial-operacional

- concluir proposta -> ganho
- criar sync para `cliente`
- criar sync para `empreendimento`
- criar `execution_plan` inicial

### Sprint 3. Operacao base

- criar tarefa
- criar prazo
- criar dossie documental
- abrir dashboard operacional minimo

### Sprint 4. Financeiro minimo

- contrato
- item de cobranca
- status de recebimento
- visao simples de carteira

### Sprint 5. Dominio tecnico prioritario

- licencas
- SST
- logistica reversa

---

## 13. Riscos e controles

### Risco 1. Duplicidade de sistema

Risco:

- operar metade na `ITECOLOGICA` e metade no `Posto` sem regra clara

Controle:

- ownership por modulo
- contrato de integracao
- verdade operacional unica por etapa

### Risco 2. Crescer a ITECOLOGICA alem do papel correto

Risco:

- transformar o front office em backoffice pesado

Controle:

- toda feature nova precisa declarar onde ela mora

### Risco 3. IA sem governanca

Risco:

- automacao solta sem revisao

Controle:

- padrao `gerar -> auditar -> revisar -> aprovar`

### Risco 4. Financeiro tardio

Risco:

- sistema parecer completo, mas nao fechar a operacao da empresa

Controle:

- financeiro entra ate a Fase 6 no maximo

---

## 14. Decisao final sintetica

Sim, o caminho estava certo.

O ajuste e este:

- voces estavam certos na jornada de negocio
- estavam quase puxando a arquitetura para o lugar errado

O desenho consolidado correto e:

- `ITECOLOGICA` vende, capta, qualifica e inicia
- `HABILIS` pensa, estrutura e orienta
- `Posto` opera, controla, prova e fecha o ciclo

Essa e a arquitetura recomendada para construir uma gestao da empresa como um todo, com rastreabilidade, integracao com financeiro e automacao progressiva sem perder consistencia tecnica.
