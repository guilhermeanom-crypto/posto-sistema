# 100 — O FLUXO REAL DO ANALISTA: diagnóstico e proposta
> Investigação multi-agente (9 domínios) cruzando o sistema atual com as pastas-fonte originais (enviro-clarity-main, posto-compliance-unico, HABILIS_AI, Estanqueidade...). Gerado em 2026-06-15.

---

Vou consolidar as 9 investigações num relatório único. Antes de escrever, preciso confirmar que tenho o conteúdo completo dos 9 domínios — o JSON foi truncado no domínio 5 (SST). Deixe-me verificar se há mais dados disponíveis no repositório, mas trabalharei principalmente com o material fornecido.

O JSON entregue contém 5 domínios completos (Onboarding, Comercial, Operação, Regulatório núcleo, Ambiental & técnico) e o 6º (SST & Pessoas) truncado. Os domínios 7, 8 e 9 não chegaram no texto. Vou produzir o relatório com base no que recebi, sinalizando honestamente onde o material foi cortado, e inferindo os domínios faltantes a partir do "posicaoNoFluxoGeral" que os outros domínios citam (Financeiro, Calendário/Alertas, Portal do Cliente / Cockpit, Documentos).

Como meu retorno é o relatório em si (texto verbatim para o script chamador), produzo-o diretamente abaixo.

---

# RELATÓRIO DE CONSOLIDAÇÃO — POSTO SISTEMA (Hábilis RegPosto)
## Visão de Analista-Chefe / Arquiteto de Produto

> Nota de honestidade sobre os dados recebidos: o JSON das investigações chegou completo para 5 domínios (Onboarding & Diagnóstico, Comercial, Operação, Regulatório núcleo, Ambiental & técnico) e foi truncado no 6º (SST & Pessoas). Os domínios 7, 8 e 9 não vieram no payload. Onde os outros domínios os citam ("posicaoNoFluxoGeral"), eles aparecem como Financeiro/Faturamento, Calendário & Alertas e Portal do Cliente / Cockpit (mais Documentos como camada transversal). Trato esses três como "domínios inferidos" e os marco como tal. O diagnóstico estrutural abaixo vale para o sistema inteiro porque o furo é o MESMO em todos.

---

# 1. O FLUXO REAL DO ANALISTA (ponta a ponta)

Hoje o sistema é um conjunto de ~30 abas. Um escritório de consultoria regulatória de verdade não trabalha por aba — trabalha por **caso**, seguindo o ciclo de vida do cliente. Esta é a espinha dorsal que está faltando:

**ETAPA 0 — CAPTAÇÃO (CRM)**
Lead chega por WhatsApp/indicação. O analista qualifica: o que o cliente declara ("recebi auto de infração", "vou abrir posto", "minha LO vence em 60 dias"), urgência, dono do lead. O sistema deveria pontuar e dizer "ligar HOJE".
→ Aba: **CRM**.

**ETAPA 1 — IDENTIFICAÇÃO & ENQUADRAMENTO (Onboarding/Triagem)**
Identifica o posto pelo CNPJ → puxa razão social, endereço, município (código IBGE), CNAE principal + secundários. A partir de **CNAE + município + UF + porte** o sistema determina: classe de risco, potencial poluidor, **esfera** (municipal/estadual/federal) e **qual órgão** licencia (CETESB-SP, IAP-PR, INEA-RJ, SEMAD-GO...). Isso muda o rito, os documentos e os prazos.
→ Abas: **Cadastrar posto** + **Triagem comercial**. Hoje são DUAS portas que não conversam.

**ETAPA 2 — PERFIL FÍSICO/OPERACIONAL (Cadastro rico)**
Levanta: nº e idade dos tanques (parede simples × dupla), bombas, SAO/caixa separadora, poço/captação, área, situação (implantação/operação/irregular/renovação), licenças/outorgas e vencimentos, histórico de passivo e autos. **São esses dados — e não o endereço — que determinam o diagnóstico.**

**ETAPA 3 — DIAGNÓSTICO REGULATÓRIO (motor único)**
Cruza tudo e devolve: (a) obrigações **aplicáveis a ESTE posto** (não as 34 genéricas), (b) score de risco com **fatores nomeados** ("LO vencida +30", "captação sem outorga +15"), (c) consequência jurídica + multa máxima de cada gap, (d) classificação de licenciamento e órgão.
→ Abas: **Onboarding (gap-analysis)** + **Diagnóstico comercial** + **Diagnóstico por eixos (hub)**. Hoje são QUATRO diagnósticos com QUATRO scores que não se reconciliam.

**ETAPA 4 — PLANO DE AÇÃO EM FASES**
Estratégia de regularização sequenciada (Documental → Licenciamento → Programas → Monitoramento), com prazo por fase e **orçamento por porte/situação/área**. Priorizada por risco real × prazo legal, não só por criticidade.
→ Aba: **Plano de ação (onboarding wizard)**.

**ETAPA 5 — ORÇAMENTO & PROPOSTA (Comercial)**
A partir dos serviços recomendados (classificados **obrigatório/condicional/VEDADO**), o analista ajusta linha a linha (quantidade, preço dentro da faixa, desconto de volume), o motor **valida consistência** (anti-redundância de estudos, ausência crítica), e gera a **proposta narrativa** (resumo executivo, escopo por área, marcos de pagamento, exclusões, prazo, validade) → PDF → envia → acompanha status.
→ Abas: **Motor de Orçamento** + **Propostas**.

**ETAPA 6 — FECHAMENTO & HANDOFF**
Aprovou: vira empreendimento + contrato + OS, a agenda de obrigações **já nasce populada pelo diagnóstico**, o lead no CRM marca GANHO. O handoff é a costura Comercial→Operação.
→ Aba: **Handoffs**.

**ETAPA 7 — PLANEJAMENTO DA EXECUÇÃO (derivação automática)**
Do handoff, o sistema deriva o plano executável: as **Ordens de Serviço** (uma por fase/serviço), as **tarefas** de cada OS (responsável sugerido por especialidade, prazo por prioridade×risco), os **entregáveis** esperados e os documentos a pedir ao cliente. O analista revisa, não digita do zero.
→ Abas: **Ordens de Serviço** + **Tarefas** + **Fila**.

**ETAPA 8 — EXECUÇÃO TÉCNICA RECORRENTE**
Cada OS vira trabalho: vistoria, coleta, ensaio, protocolo. Aqui mora o motor de decisão técnica: estanqueidade aplica a **árvore de decisão pós-ensaio**, monitoramento **compara valor medido contra o VMP** sozinho, calibração vencida **bloqueia** o ensaio.
→ Abas: **Estanqueidade, Monitoramento, PGRS, Logística Reversa, Equipamentos, Risco**.

**ETAPA 9 — EMISSÃO REGULATÓRIA & CICLO DE VIDA DA LICENÇA**
Sai a licença → IA extrai condicionantes **com periodicidade** → instancia condicionantes recorrentes com ciclos → cumprimento periódico com evidência → renovação automática na janela legal → se vier auto de infração, defesa alimentada pelo histórico de cumprimento.
→ Abas: **Licenças, Condicionantes, Processos, Fiscalizações, Outorga, Regulatório Urbano, ANP/INMETRO**.

**ETAPA 10 — PESSOAS & SST (transversal ao cliente)**
Ao cadastrar o posto, o sistema já sabe que aquele CNAE dispara PGR+PCMSO+LTCAT, NR-20 na pista, NR-33 na tancagem, hemograma semestral por benzeno. Gera a **matriz SST esperada** e a lista de quem está irregular AGORA.
→ Abas: **SST, Funcionários, Treinamentos, EPIs**.

**ETAPA 11 — ENTREGÁVEL & FATURAMENTO**
Entregável DISPONÍVEL = marco de faturamento. Atuação técnica registra a prova do que foi feito.
→ Abas: **Entregáveis, Atuações** + **Financeiro** (inferido).

**ETAPA 12 — COMPLIANCE CONTÍNUO**
Cada obrigação cumprida realimenta o calendário com o próximo vencimento → alimenta o score de Risco → desvios críticos reabrem o ciclo. O cliente vê tudo no portal.
→ Abas: **Calendário/Alertas** (inferido) + **Cockpit/Portal do cliente** (inferido).

**A regra de ouro do fluxo:** os dados fluem numa direção só — CNAE/porte/instalações capturados na Etapa 1-2 condicionam TODAS as demais. Hoje cada etapa recoleta na mão o que a anterior já sabia.

---

# 2. O FURO PRINCIPAL (diagnóstico honesto)

**As abas existem mas não conversam porque o sistema foi construído como ~30 CRUDs paralelos, cada um com seu próprio modelo de dados, seu próprio status machine e seu próprio cálculo de score — sem chaves estrangeiras ligando uma à outra e sem uma fonte única de verdade.** A consequência aparece em todo domínio na mesma forma: há quatro diagnósticos com quatro scores que não se reconciliam (onboarding/comercial/eixos/snapshot); o handoff termina em CONCLUÍDO sem gerar nada (a própria UI diz "nenhuma OS/contrato/execução foi iniciada"); a OS nasce de `contratoId` sem saber de qual handoff veio; o entregável fica preso em GERANDO porque a fila existe mas não há worker; a Fila ordena por um `scoreCriticidade` hardcoded em 42. O analista preenche o posto, recebe um checklist genérico, e a cada aba recria à mão a informação que a aba anterior já tinha.

**O que foi perdido na fusão dos projetos originais é a INTELIGÊNCIA, não as telas.** Os projetos-fonte (`enviro-clarity-main`, `posto-compliance-unico`, `HABILIS_AI`, o kit `SASC V10`) tinham motores prontos e testados que foram **amputados** na consolidação: a base oficial de 1.336 CNAEs virou 3 CNAEs hardcoded; o motor regulatório que cruzava CNAE×obrigação×serviço×órgão×porte virou 34 obrigações fixas de "revendedor"; o catálogo de 63 serviços com horas/complexidade/margem virou nome+preço; o motor de decisão obrigatório/condicional/VEDADO sumiu (hoje tudo é obrigatório); a precificação por horas×fator×multiplicador virou soma de preço-base; o gerador de proposta narrativa, o motor de plano de execução, a árvore de decisão pós-ensaio, a regra de periodicidade por idade do tanque e a matriz setor→NR→EPI viraram texto morto em outro repositório. **O cérebro foi deixado para trás; ficaram os formulários.** O furo não é "falta uma feature" — é que o conhecimento consultivo que diferencia o escritório está inerte nas fontes em vez de rodando no sistema.

---

# 3. PROPOSTA POR DOMÍNIO

## Domínio 1 — Onboarding & Diagnóstico Regulatório (porta de entrada)

**Estado atual:** TRÊS/QUATRO diagnósticos paralelos que não conversam; o cadastro captura só endereço+RT (sem CNAE, porte, instalações), então o gap-analysis devolve o MESMO checklist de 34 itens para qualquer posto do Brasil.

**Fluxo ideal:** identificar por CNPJ → enquadrar por CNAE+município+órgão → levantar perfil físico → diagnóstico com obrigações aplicáveis + risco com fatores nomeados → plano em fases → virar tarefas/proposta com o analista só revisando.

**O furo:** três camadas — (1) dado de entrada amputado (sem CNAE/porte/instalações no modelo `Empreendimento`); (2) motor simplificado (3 CNAEs + 34 obrigações fixas); (3) fragmentação (4 scores que não se reconciliam, `DiagnosticoComercial` com `empreendimentoId` nullable que não retroalimenta nada).

**Propostas priorizadas:**
- **[ALTA]** Adicionar campos regulatórios ao cadastro e ao modelo `Empreendimento` (CNAE, porte, código IBGE, situação, bloco Instalações). É a causa-raiz — tudo a jusante depende disto.
- **[ALTA]** Importar base oficial de 1.336 CNAEs + matriz regulatória para o banco, substituindo os 3 CNAEs hardcoded.
- **[ALTA]** Unificar os 4 diagnósticos num `DiagnosticoService` único que roda no cadastro e alimenta onboarding, hub e comercial.
- **[ALTA]** Tornar o catálogo de obrigações condicional (outorga só se há captação; passivo se tanque parede-simples/idade>20a) em vez de fixo em "revendedor".
- **[MÉDIA]** Mostrar consequência de cada gap (risco jurídico, multa, custo, base legal), não só "faltando".
- **[MÉDIA]** Plano de ação em fases com prazos e orçamento.
- **[BAIXA]** Validação de consistência rito×serviço.

**Trazer de volta:** `enviro-clarity-main/src/lib/diagnostic-engine.ts` (DiagnosticInput de 18 campos, calculateRiskScore, buildStrategy), `regulatory-engine.ts` (findMatrixByCnae), `cnae-service.ts`, `public/data/cnae_base_oficial.csv`, `posto-inteligencia.ts` (POSTO_FATORES_RISCO, POSTO_OBRIGACOES, calcularRiscoFinanceiro), `regulatory-commercial-framework.ts`.

---

## Domínio 2 — Comercial (pré-venda): Triagem, Motor de Orçamento, Propostas, CRM

**Estado atual:** 4 telas-ilha com DOIS/TRÊS motores de orçamento paralelos que dão números diferentes para o mesmo posto; a Triagem só conhece 3 CNAEs; a "Validação do Orçamento" tem 3 booleanos chumbados; a Proposta não é editável; o CRM é cego (lead sem qualificação).

**Fluxo ideal:** lead qualificado → triagem que diz órgão/rito/classe e classifica serviços obrigatório/condicional/VEDADO → orçamento ajustável com precificação por horas+multiplicador+desconto de volume + validação anti-redundância → proposta narrativa → fechamento → handoff.

**O furo:** o motor que sobrou é o mais pobre dos disponíveis. Abismo de cobertura (3 CNAEs), três orçamentos que não conversam, zero decisão de VEDADO, zero precificação real (só soma de preço-base), proposta não montável nem narrada, CRM sem qualificação nem ligação com a proposta.

**Propostas priorizadas:**
- **[ALTA]** Unificar num único motor e aposentar a matriz de 3 CNAEs; migrar o catálogo de 63 serviços ricos.
- **[ALTA]** Trazer a decisão obrigatório/condicional/VEDADO por rito.
- **[ALTA]** Precificação real: horas × hourRate × complexityFactor × multiplicador de porte + desconto de volume.
- **[ALTA / RÁPIDO]** Substituir a "Validação do Orçamento" chumbada pela `validateBudgetConsistency` real.
- **[ALTA]** Tornar a Proposta montável (editor de itens: quantidade, preço, desconto).
- **[MÉDIA]** Gerar narrativa da proposta (resumo executivo, escopo por área, marcos 40/30/30, exclusões).
- **[MÉDIA]** Qualificar o lead no CRM e ligá-lo ao diagnóstico/proposta.
- **[MÉDIA]** Unir Triagem e Motor de Orçamento num fluxo só.

**Trazer de volta:** `regulatory-commercial-framework.ts` (classifyEnterpriseContext, resolveLicensingPath, classifyServiceDecision, validateBudgetConsistency), `habilis-services.ts` (63 serviços), `budget-engine.ts` (calculateBudget, getEnterpriseMultiplier), `proposal-generator.ts` (builders + renderProposalHtml), `posto-compliance-unico/crm/state/lead-priority.js`, `backend/domain/diagnostic/decision-engine.ts` (deriveSignals), `backend/supabase/whatsapp_first_contact_v1.sql`.

---

## Domínio 3 — Operação (pós-venda → entrega)

**Estado atual:** 6 abas que NÃO se conversam, cada uma entidade isolada sem FK; o handoff termina em CONCLUÍDO sem gerar nada; OS nasce de contrato sem rastro do handoff; o worker de entregáveis não existe; o `scoreCriticidade` é 42 fixo.

**Fluxo ideal:** receber/triar handoff → o sistema deriva plano→OS→tarefas→entregáveis→documentos automaticamente → executar com evidências → produzir entregável de template → fechar e instalar monitoramentos recorrentes.

**O furo:** o sistema tem o COMEÇO da corrente (handoff rico) e o FIM (tarefa/evidência), mas o MEIO — a derivação — está vazio, e justamente esse meio já existia pronto na fonte. Mais duas automações fantasma (worker inexistente, score fictício).

**Propostas priorizadas:**
- **[ALTA]** Portar `buildOfficialExecutionPlan` para gerar OS+tarefas automaticamente ao aceitar o handoff (rascunho editável).
- **[ALTA]** Ligar a corrente: adicionar `handoffId` na OS, herança de contexto handoff→OS→entregável.
- **[ALTA]** Implementar o Worker BullMQ que consome `entregavelQueue` e gera o entregável (campos s3_key/nome_arquivo já existem no schema).
- **[ALTA]** Motor real de `scoreCriticidade` para a Fila (dias até vencimento, prioridade, risco, inação).
- **[MÉDIA]** Conceito de prontidão (readiness) + responsável técnico no handoff.
- **[MÉDIA / RÁPIDO]** Enriquecer `servicosResumo` com horas, SLA e vínculo a obrigação.
- **[BAIXA]** Atuações como registro técnico real + marco de faturamento.

**Trazer de volta:** `posto-compliance-unico/backend/domain/diagnostic/official-execution-plan.ts` (buildOfficialExecutionPlan, inferOwner, buildMonitorings), `official-diagnostic-engine.ts` (buildServices, SERVICE_CATALOG), `emit-operational-handoff/index.ts` (payload com execution_plan + responsável técnico), `process-flow.ts` (buildCaseReadiness, ANALYST_STAGES), `decision-engine.ts` (computeCasePriority), `HABILIS_AI/agentes/agente_03_operacional.txt` (templates de entregáveis).

---

## Domínio 4 — Regulatório núcleo (Licenças, Condicionantes, Processos, Fiscalizações, Outorga, Urbano, ANP/INMETRO)

**Estado atual:** 7 CRUDs isolados; DOIS modelos de condicionante (uma "burra" presa à licença, uma "rica" presa ao processo) que não se ligam; a IA extrai condicionantes mas as joga no modelo sem periodicidade; o catálogo de 494 linhas de obrigações é só diagnóstico read-only, nunca instancia nada.

**Fluxo ideal:** o analista raciocina por **ciclo de vida da licença** (protocolo→emissão→condicionantes→renovação→autos→defesa), não por aba; quer UMA linha do tempo encadeada.

**O furo:** o conhecimento existe (seed + regulatory-engine) mas é inerte; licença e condicionante vivem em mundos separados; processos rodam sobre `numeroLicenca` STRING sem FK; nada do diagnóstico instancia obrigações reais aqui.

**Propostas priorizadas:**
- **[ALTA]** Unificar os dois modelos de condicionante e ligar Licença↔Processo↔Condicionante (migrar a extração de IA para criar Condicionante rica).
- **[ALTA]** Linha do tempo / ciclo de vida POR LICENÇA (espelhar o HubTabs, mas por licença).
- **[ALTA]** Renovação automática na janela legal (≤90d → abre Processo de renovação anexando dossiê de cumprimento).
- **[ALTA]** Instanciar obrigações/condicionantes a partir do perfil do posto (ativar o conhecimento inerte).
- **[MÉDIA]** Geração de peças regulatórias (RAC, requerimento de renovação), não só defesa.
- **[MÉDIA / RÁPIDO]** Classificar periodicidade/criticidade na extração de IA do PDF.
- **[BAIXA]** Score de risco regulatório por licença/posto.

**Trazer de volta:** `enviro-clarity-main/src/lib/fuel-station-operational.ts` (buildFuelStationOperationalView — o grafo licensing↔condicionantes↔prazos, criação automática do prazo de renovação), `posto-inteligencia.ts` (POSTO_OBRIGACOES, calcularRiscoFinanceiro), `regulatory-engine.ts` (analyzeRegulatoryByCnae), `data/prazosReferencia.json`, `base-regulatoria.ts`.

---

## Domínio 5 — Ambiental & técnico (PGRS, Logística Reversa, Monitoramento, Estanqueidade, Risco, Equipamentos)

**Estado atual:** 6 formulários de registro com alertas de prazo, sem inteligência regulatória nem conversa entre si; o sistema confia no humano para TUDO (digita o próximo vencimento, marca se está em alerta, escolhe o resultado da campanha).

**Fluxo ideal:** o domínio exige um **MOTOR DE DECISÃO**, não um formulário — calcular periodicidade pela idade do tanque, comparar valor medido contra VMP sozinho, rodar a árvore de decisão pós-ensaio, e ao reprovar um tanque acionar passivo+licenciamento+monitoramento+tarefa corretiva.

**O furo:** (1) inteligência decisória existe pronta na fonte mas não foi codificada; (2) periodicidade errada por design (+1 ano fixo a todo APROVADO, contra a regra SASC quinquenal/bienal/anual por idade); (3) monitoramento não detecta anomalia sozinho (tem a tabela VMP e os valores, mas ninguém compara); (4) abas não conversam (tanque NÃO ESTANQUE vira só badge vermelho).

**Propostas priorizadas:**
- **[ALTA / RÁPIDO]** Calcular periodicidade do ensaio pela idade do tanque (regra SASC), não +1 ano fixo.
- **[ALTA]** Auto-classificar campanhas comparando valor medido contra o VMP (remover o dropdown manual de resultado).
- **[ALTA]** Motor de decisão pós-ensaio que aciona outras abas (NÃO ESTANQUE → passivo+licenciamento+tarefa; INCONCLUSIVO → bloqueia encerramento).
- **[MÉDIA]** Laudo estruturado por componente com gates de emissão (sem ART/croqui/calibração não emite).
- **[MÉDIA]** Aba de Equipamentos com bloqueio por calibração vencida.
- **[MÉDIA]** OS + checklists pré/campo/pós como espinha do fluxo técnico.
- **[BAIXA]** Logística Reversa com base normativa Recicla Goiás (metas escalonadas 22%→30%, CDF).
- **[BAIXA]** Derivar exigências do PGRS dos resíduos gerados e cruzar com MTRs.

**Trazer de volta (kit SASC V10):** `01_MATRIZ_REGULATORIA/MATRIZ_MASTER_REQUISITOS.md` (periodicidade por idade), `06_DECISAO_E_PASSIVO/ARVORE_DE_DECISAO_POS_ENSAIO.md` + `INTEGRACAO_COM_PASSIVO_AMBIENTAL.md`, `05_MODELOS/MODELO_ESTRUTURAL_LAUDO.md`, `03_POPS/POP-EST-01..05`, `04_CHECKLISTS/`, `07_CONTROLE/`, `Logística Reversa/recicla_goias_nodes.json`.

---

## Domínio 6 — SST & Pessoas (ASOs, EPIs, Treinamentos, Funcionários)

**Estado atual:** tecnicamente sólido (CRUD bem-feito com semáforo agregado por funcionário e automação de vencimento por DATA já funcionando), MAS cego para obrigações que deveriam existir. O campo `obrigatorioParaCargos` existe no schema, é coletado no form, e NENHUMA lógica o usa.

**Fluxo ideal:** o analista trabalha por OBRIGATORIEDADE — ao admitir "João, Frentista, PISTA", o sistema deveria listar imediatamente o que falta (ASO admissional, NR-20, integração, ficha de EPI, hemograma semestral por benzeno). Hoje a ficha nasce "verde por ausência".

**O furo:** (1) obrigatoriedade não é calculada — o sistema gerencia registros que EXISTEM, é cego para ausência total de obrigação (o caso mais autuado pelo MTE); (2) a inteligência setor→NR→EPI está perdida em outro projeto; (3) benzeno/PCMSO/hemograma semestral não existe nem como conceito; (4) "Pessoas" está no lugar errado (é board de tarefas, faz join por nome frágil).

**Propostas priorizadas:**
- **[ALTA]** Motor de obrigatoriedade SST: cruzar `obrigatorioParaCargos` + setor→NRs contra treinamentos efetivos → lista de AUSENTES e VENCIDAS por funcionário.
- **[ALTA]** Seed da matriz de risco do posto (setor→NRs→EPIs→procedimentos) + tipos de treinamento canônicos.
- **[ALTA]** Alertas SST por AUSÊNCIA, não só por data (admitido sem ASO, cargo obrigado sem treinamento, posto sem PGR/PCMSO/LTCAT, exposto a benzeno sem hemograma).
- **[MÉDIA]** Vínculo exposição a benzeno → PCMSO/hemograma semestral.
- **[MÉDIA / RÁPIDO]** Agendamento de turma de treinamento a partir das pendências.
- **[MÉDIA]** Dossiê SST do posto exportável para fiscalização.

**Trazer de volta:** `enviro-clarity-main/src/knowledge/blocks/posto-sst.ts` (POSTO_SETORES_RISCO, POSTO_SST_CARDS, CHECKLIST, NEXT_STEPS), `src/knowledge/alerts/alert-rules.ts` (alertNr20Vencido, alertAsoVencido, alertPgrAusente, alertBenzeno + HARD_FAILURE_IDS), `HABILIS/ARQUITETURA_HABILIS.md` (conceito "ASO vence e não há novo agendado: alertar"; matriz SST por empreendimento).
*Ação de produto:* mover "Pessoas" para fora de SST (é gestão de carga de trabalho/operação).

---

## Domínios 7–9 — INFERIDOS (não vieram no payload)

> Marcados como inferência a partir do "posicaoNoFluxoGeral" dos outros 6 domínios. Precisam das investigações originais para detalhar.

**Domínio 7 — Financeiro / Faturamento.** Citado como costura com Operação: "entregável DISPONÍVEL = marco de faturamento — hoje desconectado". Furo provável: faturamento não ligado a entregável/contrato/OS; margem por contrato impossível porque o handoff não carrega horas/custo. **Trazer de volta:** os campos de margem/custo interno do `habilis-services.ts` e o `budget-engine.ts` para fechar o elo orçamento→custo→faturamento.

**Domínio 8 — Calendário & Alertas.** Citado por quase todos como destino dos vencimentos. Parte já funciona (`vencimentos.scheduler.ts` varre licenças/condicionantes/ASO/calibração e gera alertas com deep-link). Furo provável: calendário reflete só o que tem data, não o que falta (mesma cegueira do SST); os 4 scores não reconciliados poluem a priorização.

**Domínio 9 — Cockpit / Portal do Cliente (+ Documentos transversal).** Citado como "único lugar onde o fluxo se reúne por cliente" (HubTabs) e como camada de transparência. Furo provável: o cockpit agrega 4 scores que não batem; Documentos é repositório passivo em vez de fonte de evidência ligada a condicionantes/entregáveis.

---

# 4. O ASSISTENTE COMO CÉREBRO

A visão do usuário é certeira: o **Assistente Hábilis** não deve ser mais uma aba — deve ser o **consolidador** que conversa com todas as seções e que executa o fluxo da Seção 1 por baixo das telas. Ele é a resposta natural ao furo: se as abas não conversam por FK, o assistente as costura por **orquestração**.

**Arquitetura de agentes (reaproveitando os 4 do `HABILIS_AI`):**

- **Agente 1 — Diagnóstico/Enquadramento.** Recebe CNAE+município+porte+instalações, roda o motor regulatório unificado (Domínio 1+2), devolve obrigações aplicáveis, risco com fatores nomeados, órgão e rito. É o cérebro das Etapas 1–3.
- **Agente 2 — Comercial/Proposta.** Pega o diagnóstico, classifica serviços obrigatório/condicional/VEDADO, precifica (horas×fator×multiplicador), valida consistência e gera a narrativa da proposta. Etapas 4–6.
- **Agente 3 — Estruturador Operacional** (`agente_03_operacional.txt`, já especificado). Transforma o handoff em plano: fases, OS, tarefas (owner por especialidade), entregáveis, documentos a pedir, pontos de controle, provas obrigatórias, gatilhos de automação. Etapas 7–9.
- **Agente 4 — Compliance/Monitoramento.** Vigia o ciclo de vida: dispara renovação na janela legal, instancia condicionantes recorrentes, compara monitoramento contra VMP, calcula obrigatoriedade SST por ausência, alimenta o calendário e o score de risco. Etapas 10–12.

**O que o assistente faz em cada etapa:** na captação, qualifica o lead e diz "ligar hoje"; no cadastro, puxa CNAE pelo CNPJ e pré-preenche o enquadramento; no diagnóstico, explica em linguagem de consultor "este posto precisa de LO + outorga DAEE + AVCB porque..."; na proposta, monta o escopo e barra o estudo errado para o rito errado; no handoff, gera o plano de execução para o analista só revisar; na execução, avisa "tanque 3 reprovou → abri tarefa de passivo e sinalizei o licenciamento"; no contínuo, "5 frentistas com NR-20 vencendo em 30 dias — agendar turma?" e "LO vence em 90 dias, já abri o processo de renovação com o RAC anexado".

**Pré-requisito honesto:** o assistente só vira cérebro depois que existir UMA fonte de verdade (modelo de dados unificado e motor único). Um assistente sobre 4 scores que não batem só reproduz a confusão com voz amigável. Por isso a Seção 5 coloca a unificação ANTES do assistente.

---

# 5. ROADMAP PRIORIZADO

Organizado por alavancagem, separando "já existe nas fontes (rápido)" de "construir novo (maior)".

## FASE 0 — Destravar as promessas quebradas (rápido, alto impacto visível)
*Quase tudo é "trazer de volta" ou ligar fio solto.*
- Worker do `entregavelQueue` (entregável preso em GERANDO). [construir, médio]
- `validateBudgetConsistency` real no lugar dos 3 booleanos chumbados. [trazer, rápido]
- Periodicidade de estanqueidade pela idade do tanque (regra SASC). [trazer, rápido]
- Auto-classificação de monitoramento contra VMP. [trazer/construir, médio]
- `scoreCriticidade` real na Fila. [construir, médio]

## FASE 1 — A causa-raiz: dado de entrada + motor único (a maior alavancagem do sistema)
- Campos regulatórios no cadastro e no modelo `Empreendimento` (CNAE, porte, IBGE, situação, instalações). [construir, médio]
- Importar base de 1.336 CNAEs + matriz regulatória para o banco. [trazer, grande]
- `DiagnosticoService` ÚNICO que roda no cadastro e alimenta onboarding+comercial+hub. [trazer+construir, grande]
- Obrigações condicionais (por CNAE/porte/instalações/UF) no lugar das 34 fixas. [trazer, médio]

## FASE 2 — Comercial de verdade (converte diagnóstico em venda)
- Catálogo de 63 serviços + decisão obrigatório/condicional/VEDADO. [trazer, médio]
- Precificação real (horas×fator×multiplicador + desconto de volume). [trazer, médio]
- Proposta montável (editor de itens) + narrativa (resumo/escopo/marcos/exclusões). [trazer, médio]
- Qualificação do lead no CRM ligada ao diagnóstico/proposta. [trazer, médio]

## FASE 3 — A corrente da operação (handoff→plano→OS→tarefas→entregável)
- `buildOfficialExecutionPlan` derivando OS+tarefas+entregáveis do handoff. [trazer, grande]
- FKs ligando handoff↔OS↔entregável + herança de contexto. [construir, médio]
- Readiness + responsável técnico no handoff; `servicosResumo` com horas/SLA. [trazer, médio]

## FASE 4 — Ciclo de vida regulatório + execução técnica como motor
- Unificar os dois modelos de condicionante; ligar Licença↔Processo↔Condicionante. [construir, grande]
- Instanciar condicionantes/obrigações a partir do perfil; renovação automática na janela legal. [trazer, grande]
- Árvore de decisão pós-ensaio acionando passivo/licenciamento; laudo estruturado por componente. [trazer, médio→grande]
- Motor de obrigatoriedade SST + alertas por ausência + matriz setor→NR→EPI. [trazer+construir, médio]

## FASE 5 — O assistente como cérebro + fechar os elos finais
- Orquestração dos 4 agentes sobre a fonte única já existente. [construir, grande]
- Elo Operação→Financeiro (entregável=marco de faturamento); cockpit com score reconciliado. [construir, médio]
- Peças regulatórias geradas (RAC, requerimento de renovação); dossiê SST exportável. [trazer, médio]

---

# 6. RECOMENDAÇÃO FINAL

**Ataque PRIMEIRO a Fase 1: o dado de entrada e o motor único de diagnóstico.** É o ponto de maior alavancagem do sistema inteiro, e a razão é simples e consultiva: **todo o resto herda a pobreza da entrada.** Enquanto o cadastro capturar só endereço e o motor conhecer 3 CNAEs e 34 obrigações fixas, o onboarding gera o mesmo checklist para qualquer posto, a proposta comercial usa uma matriz de 3 linhas, a operação recebe um enquadramento raso e o analista refaz o trabalho — e nenhuma das outras melhorias consegue brilhar sobre um diagnóstico genérico. Capturar CNAE/porte/instalações e ter um diagnóstico único e correto é o que faz o sistema parar de ser "abas soltas": pela primeira vez existe uma fonte de verdade que as demais abas podem consumir em vez de recoletar.

**Mas comece a Fase 0 em paralelo, no mesmo sprint**, porque ela é barata e restaura a credibilidade: o entregável preso em GERANDO, a "Validação do Orçamento" que sempre diz "Sim", o tanque novo cobrado cedo demais e a Fila que ordena por 42 fixo são **promessas visivelmente quebradas** que minam a confiança do analista no produto — e quase todas são "trazer de volta" de inteligência que já existe nas fontes, não construir do zero. Restaurar essas peças prontas dá vitórias rápidas enquanto a fundação (Fase 1) é construída.

**A sequência lógica é inegociável:** fonte única de dados e diagnóstico (Fase 1) → comercial e operação que consomem essa fonte (Fases 2–3) → ciclo de vida e execução técnica como motores (Fase 4) → e só então o **Assistente Hábilis como cérebro** (Fase 5), porque um assistente é tão bom quanto a verdade sobre a qual ele raciocina. O insight central deste relatório é que **o cérebro do escritório já foi escrito** — está em `enviro-clarity-main`, `posto-compliance-unico`, `HABILIS_AI` e no kit `SASC V10` — e foi amputado na fusão. A maior parte do trabalho não é inventar inteligência nova; é **reconectar a inteligência que já existe** às telas que hoje só registram dados. Esse é o caminho mais curto entre o que o sistema é (formulários paralelos) e o que o escritório precisa (o fluxo de trabalho real de um analista regulatório).

---

# ANEXO — Detalhe por domínio (as 9 investigações na íntegra)

> A síntese acima recebeu apenas os 5-6 primeiros domínios (corte de payload). Este anexo traz os 9 completos — em especial **Documentos**, **Inteligência/Assistente** e **Decisão**, que ficaram de fora da síntese.

## Onboarding & Diagnóstico Regulatório (porta de entrada)
**Abas:** Meus Postos (lista) — empreendimentos/page.tsx, Cadastrar novo posto — empreendimentos/novo/page.tsx + novo-empreendimento-form.tsx + actions.ts, Diagnóstico / Gap-analysis — empreendimentos/[id]/onboarding/page.tsx + onboarding-wizard.tsx, Plano de ação — onboarding-wizard.tsx steps 3-4 + onboarding.routes.ts gerar-tarefas, Diagnóstico de Conformidade por eixo no hub — empreendimentos/[id]/page.tsx + diagnostico-eixos.tsx

**Estado atual:** A porta de entrada hoje tem TRÊS diagnósticos diferentes que não conversam:

1) CADASTRO (novo-empreendimento-form.tsx) captura só identificação + endereço + RT. NÃO pergunta CNAE, porte, número de tanques/bombas, idade dos equipamentos, captação de água, histórico de contaminação, licenças existentes. O campo `tipo` tem 4 opções fixas (revendedor/distribuidor/transportador/outros) e `atividades` vem HARDCODED (`novo-empreendimento-form.tsx:218` injeta hidden 'Revendedor varejista de combustíveis'). O modelo Prisma `Empreendimento` (schema.prisma:553-625) confirma: não existe coluna cnae, porte, classeRisco, municipioCodigo nem instalações. Ao salvar, redireciona direto para /onboarding (actions.ts:96).

2) GAP-ANALYSIS pós-cadastro (gap-analysis.service.ts) é o motor do onboarding. Busca obrigações por `tipoEmpreendimento` (normalizado de tipo, linha 529-537) + UF (linha 540-548) e roda checkers contra documentos/tanques/ASOs já cadastrados. Saída: CONFORME/A_RENOVAR/SEM_DADOS/NAO_APLICAVEL + scoreBase. O catálogo `ObrigacaoRegulatoriaBase` é seedado com apenas 34 itens, TODOS marcados `tipoEmpreendimento: 'revendedor'` e SEM UF (seed/obrigacoes-regulatorias.ts). Ou seja: o gap-analysis na prática é idêntico para qualquer posto do Brasil. O wizard (onboarding-wizard.tsx) apenas converte gaps SEM_DADOS/A_RENOVAR em tarefas filtrando por módulo+criticidade (gerar-tarefas em onboarding.routes.ts).

3) DIAGNÓSTICO COMERCIAL por CNAE (comercial/diagnostico.service.ts) — este SIM cruza CNAE×porte×situação, mas vive no fluxo comercial/triagem (rota POST /comercial/diagnostico/cnae) e está DESCONECTADO do cadastro do empreendimento. Pior: a matriz regulatória é hardcoded com apenas 3 CNAEs (diagnostico.service.ts:6-46: 4731-8/00, 4520-0/01, 4520-0/05); todo o resto cai num fallback genérico (linha 63-78). O resultado pode ser salvo em DiagnosticoComercial (schema.prisma:2346, com campos ricos: cnaes, porte, riscoScore, potencialPoluidor, esfera, necessitaEIA/Outorga/Monitoramento, orçamento min/base/max) mas o empreendimentoId é opcional/nullable e nada disso volta para a tela de onboarding nem para o cadastro.

4) Há ainda um 4º "Diagnóstico de Conformidade por eixo" no hub (diagnostico-eixos.tsx, alimentado por /cockpit/diagnostico/:id, page.tsx:57) — baseado em evidências por eixo, mais um cálculo de score independente dos outros três.

**Fluxo ideal do analista:** O analista ambiental de postos trabalha assim:

PASSO 1 — Identificar o posto pelo CNPJ. Idealmente o sistema puxa razão social, endereço, município (com código IBGE) e CNAE principal + secundários de uma consulta de cadastro. Hoje ele digita tudo na mão e nem informa CNAE.

PASSO 2 — Enquadrar regulatoriamente. A partir do CNAE + município + UF o analista determina: classe de risco, potencial poluidor, ESFERA (municipal/estadual/federal) e QUAL ÓRGÃO licencia (CETESB-SP, IAP-PR, INEA-RJ...). Isso muda tudo: o rito, os documentos e os prazos. Hoje o sistema não pergunta CNAE e assume sempre "revendedor estadual".

PASSO 3 — Levantar o perfil físico/operacional do posto: número e idade dos tanques (parede simples x dupla), bombas, presença de SAO/caixa separadora, poço artesiano/captação, área, situação (implantação x operação x irregular x renovação), licenças/outorgas existentes e vencimentos, histórico de passivo/contaminação e autos de infração. São esses dados que determinam se aplica investigação de passivo, outorga, monitoramento de águas subterrâneas, etc.

PASSO 4 — Diagnóstico: o sistema deveria cruzar tudo isso e devolver (a) a lista de obrigações APLICÁVEIS a ESTE posto (não as 34 genéricas), (b) score de risco com FATORES NOMEADOS (ex.: 'LO vencida +30', 'captação sem outorga +15'), (c) consequências jurídicas e multas máximas de cada gap, (d) classificação de licenciamento e órgão.

PASSO 5 — Plano de ação priorizado por risco real (risco jurídico/financeiro × prazo legal), com estimativa de esforço/orçamento e sequenciamento em fases (regularização documental → licenciamento → programas → monitoramento contínuo).

PASSO 6 — Converter em tarefas/processos e, no comercial, em proposta. O analista quer que o cadastro JÁ tenha gerado o diagnóstico e o plano; ele só revisa e aprova.

**Inteligência disponível nas fontes:** A pasta INTERFACE/enviro-clarity-main/src/lib tem o motor que foi amputado:

1) BASE OFICIAL DE CNAE COMPLETA: INTERFACE/enviro-clarity-main/public/data/cnae_base_oficial.csv (1336 CNAEs) + cnae-service.ts (busca, import, cache). No Posto, o cadastro nem tem campo CNAE.

2) MOTOR REGULATÓRIO POR CNAE: regulatory-engine.ts cruza regulatory_matrix (classe_risco, potencial_poluidor, licenciamento_tipo, orgao_competente, impactos_ambientais, necessita_eia/outorga/monitoramento, nivel_risco, probable_environmental_licenses, regulatory_agencies_involved, recommended_environmental_services) × regulatory_obligations (obrigação→periodicidade→órgão fiscalizador→documento gerado) × regulatory_services_map (obrigação→serviço→prioridade→profissional) × regulatory_organs (órgão por município/UF). Tem matching por CNAE exato→prefixo→grupo (findMatrixByCnae, linhas 201-218). No Posto isso virou 3 CNAEs hardcoded em comercial/diagnostico.service.ts.

3) MOTOR DE DIAGNÓSTICO v2: diagnostic-engine.ts — DiagnosticInput com 18 campos (situação, área, porte, usoRecursosNaturais, captacaoAgua, geracaoResiduos, potencialPoluidor, emissaoAtmosferica, produtosPerigosos, licencaAmbiental, outorgaAgua, multasAmbientais, licencasVencidas). Produz: risco com FATORES NOMEADOS (calculateRiskScore, linhas 302-369), estratégia em FASES com prazos (buildStrategy, 373-453), orçamento com multiplicador de complexidade por porte/área/situação (getComplexityMultiplier, 274-298), classificação de licenciamento e necessidades. O onboarding atual ignora todos esses inputs.

4) INTELIGÊNCIA ESPECÍFICA DE POSTO: posto-inteligencia.ts — POSTO_FATORES_RISCO (6 riscos com probabilidade empírica, severidade, consequência jurídica, multa máxima, custo de resolução, serviço Hábilis vinculado), POSTO_OBRIGACOES (6 obrigações com baseLegal, consequenciaSemFazer, multaMaxima, custoServico, prazoAntecedencia), POSTO_MONITORAMENTO (parâmetros CONAMA: BTEX/TPH, limites, frequência), calcularRiscoFinanceiro() e GESTAO_CONTINUADA_POSTOS (recorrência). Nada disso aparece no diagnóstico atual — o usuário vê só 'SEM_DADOS' sem entender a consequência.

5) FRAMEWORK COMERCIAL-REGULATÓRIO: regulatory-commercial-framework.ts — resolve o RITO aplicável (manual_pontual, implantacao_licenciamento, regularizacao_operacional, renovacao, outorga_pontual, validacao_tecnica) e classifica cada serviço como obrigatorio/condicional/VEDADO com justificativa e validação de consistência do orçamento (hasCriticalAbsence, hasStudyRedundancy). É o que evita propor estudo errado para o rito errado — perdido na fusão.

**O furo:** O furo é estrutural e tem três camadas:

1) DADO DE ENTRADA AMPUTADO: o cadastro coleta endereço, mas não coleta o que define o diagnóstico (CNAE, porte, instalações físicas, captação, situação, licenças/passivo). Sem CNAE e sem porte no modelo Empreendimento, o gap-analysis é forçado a usar só tipo+UF e, na prática, devolve o MESMO checklist de 34 itens para todo posto.

2) MOTOR SIMPLIFICADO: o motor original cruzava CNAE×obrigação×serviço×órgão×porte×perfil de impacto, com 1336 CNAEs e uma matriz regulatória dinâmica. Na fusão isso virou (a) 34 obrigações fixas de 'revendedor' no gap-analysis e (b) 3 CNAEs hardcoded no diagnóstico comercial. Perdeu-se: enquadramento por município/órgão, fatores de risco nomeados, consequência jurídica/multa por gap, estratégia em fases com prazos, e a validação de consistência rito×serviço.

3) FRAGMENTAÇÃO: existem 4 diagnósticos paralelos (gap-analysis do onboarding, diagnóstico comercial por CNAE, eixos do hub, snapshot de compliance) com 4 cálculos de score diferentes que não se reconciliam. O DiagnosticoComercial (rico) tem empreendimentoId nullable e não retroalimenta o cadastro nem o onboarding. Resultado: o analista preenche o posto, recebe um checklist genérico de 'faltando', e o conhecimento real (qual o risco, qual a multa, qual o órgão, qual o rito, quanto custa) fica invisível.

**Posição no fluxo geral:** É o PRIMEIRO passo do fluxo ponta a ponta do escritório e o que condiciona todos os demais. Sequência geral: (1) Onboarding/Cadastro do posto → (2) Diagnóstico regulatório (enquadramento + gaps + risco) → (3) Plano de ação/regularização → (4) Diagnóstico comercial e Proposta → (5) Contrato/Handoff comercial→operacional → (6) Execução operacional (processos, documentos, condicionantes, monitoramento, estanqueidade, SST, logística reversa) → (7) Compliance contínuo (snapshots, alertas, renovações). Como a entrada captura dados pobres e produz um diagnóstico genérico, todo o resto herda imprecisão: as tarefas geradas são as mesmas para qualquer posto, a proposta comercial usa uma matriz de 3 CNAEs, e os scores de compliance no hub não se reconciliam com o diagnóstico de entrada. Corrigir esta porta (capturar CNAE/porte/instalações e unificar o motor) é o ponto de maior alavancagem do sistema inteiro.

**Propostas:**

- **[ALTA/medio] Adicionar campos regulatórios ao cadastro e ao modelo Empreendimento** — Estender o form de novo posto e o modelo Prisma Empreendimento com: cnaePrincipal + cnaesSecundarios (autocomplete vindo da base oficial), porte, municipioCodigoIBGE, situacao (implantacao/operacao/irregular/renovacao), e um bloco 'Instalações' (nº tanques + parede simples/dupla, nº bombas, possui SAO, captação/poço, área m2). Marcar isso como Passo 1 real do wizard (hoje o Passo 1 'Identificação' não captura nada disso). _Por quê:_ É a causa-raiz do furo: sem esses dados o diagnóstico nunca poderá cruzar CNAE×porte×instalações. Tudo a jusante depende disto. _(trazer de: INTERFACE/enviro-clarity-main/src/lib/diagnostic-engine.ts (DiagnosticInput, linhas 15-40) define exatamente o conjunto de campos a coletar)_
- **[ALTA/grande] Importar a base oficial de CNAE e a matriz regulatória para o banco** — Carregar cnae_base_oficial.csv (1336 CNAEs) numa tabela e criar uma RegulatoryMatrix (CNAE→classe risco, potencial poluidor, licenciamento, órgão, impactos, necessita EIA/outorga/monitoramento, serviços recomendados). Substituir os 3 CNAEs hardcoded de comercial/diagnostico.service.ts por consulta a essa matriz com matching exato→prefixo→grupo. _Por quê:_ O diagnóstico por CNAE hoje só conhece 3 atividades; qualquer outra cai em fallback genérico. A inteligência já existe pronta na fonte, só precisa ser migrada para o Prisma. _(trazer de: public/data/cnae_base_oficial.csv + src/lib/regulatory-engine.ts (loadMatrix/findMatrixByCnae/analyzeRegulatoryByCnae) + src/lib/cnae-service.ts)_
- **[ALTA/grande] Unificar os diagnósticos: um único motor que roda no cadastro e alimenta onboarding, hub e comercial** — Criar um DiagnosticoService único que, ao salvar o posto, recebe os campos novos, cruza com a matriz regulatória e o catálogo de obrigações, e persiste UM resultado (risco, enquadramento, obrigações aplicáveis, plano em fases). O gap-analysis passa a partir dessa lista APLICÁVEL (não das 34 fixas); o hub (eixos) e o comercial leem o mesmo resultado. Ligar DiagnosticoComercial.empreendimentoId obrigatoriamente quando vier de um posto. _Por quê:_ Hoje há 4 diagnósticos com 4 scores que não conversam; o analista não confia em nenhum. Unificar elimina a fragmentação que é o sintoma central do 'furo'. _(trazer de: src/lib/diagnostic-engine.ts (runDiagnostic, matchObrigacoes, convertToServicos, buildStrategy))_
- **[ALTA/medio] Tornar o catálogo de obrigações condicional (CNAE/porte/instalações/UF), não fixo em 'revendedor'** — Adicionar condições de aplicabilidade a cada ObrigacaoRegulatoriaBase (ex.: outorga só se captação=true; investigação de passivo se tanque parede-simples ou idade>20a; AVCB sempre; SCANC só revendedor de etanol). Variar por UF/órgão. Ampliar além das 34 entradas. _Por quê:_ O gap-analysis hoje aplica o mesmo checklist a todos, gerando falsos 'SEM_DADOS' (ex.: cobra outorga de quem não capta) e omitindo obrigações reais de quem tem passivo. O matchObrigacoes da fonte já faz esse filtro por flags. _(trazer de: src/lib/diagnostic-engine.ts (matchObrigacoes por flags, linhas 161-216) + seed/obrigacoes-regulatorias.ts (estrutura atual a estender))_
- **[MEDIA/medio] Mostrar a consequência de cada gap (risco jurídico, multa, custo) — não só 'faltando'** — Em cada item do diagnóstico/plano, exibir consequenciaSemFazer, multaMaxima, custoServico e baseLegal vindos da inteligência de posto. Calcular um risco financeiro consolidado do posto. Ordenar o plano por risco real × prazo legal, não só por criticidade. _Por quê:_ Hoje o analista vê 'SEM_DADOS' sem dimensão do problema; o cliente não entende a urgência. Isso é o que transforma diagnóstico em venda/ação. A fonte já tem todos os números. _(trazer de: src/lib/posto-inteligencia.ts (POSTO_FATORES_RISCO, POSTO_OBRIGACOES, calcularRiscoFinanceiro) + src/lib/diagnostic-engine.ts (calculateRiskScore com fatores nomeados))_
- **[MEDIA/medio] Plano de ação em fases com prazos e orçamento, no lugar do gerador de tarefas plano** — Substituir o step 3 do wizard (toggle de módulo+criticidade → tarefas) por uma estratégia de regularização em fases (Documental → Licenciamento → Programas → Monitoramento) com prazo estimado por fase e orçamento por porte/situação/área; a partir dela gerar tarefas/processo e, no comercial, a proposta. _Por quê:_ O plano atual é uma lista plana de tarefas sem sequência nem prazo; o analista precisa de ordem de execução e estimativa para negociar. buildStrategy e getComplexityMultiplier da fonte já entregam isso. _(trazer de: src/lib/diagnostic-engine.ts (buildStrategy linhas 373-453, getComplexityMultiplier 274-298))_
- **[BAIXA/grande] Validação de consistência rito×serviço no diagnóstico/orçamento** — Antes de fechar plano/proposta, rodar a checagem de aderência ao rito: bloquear estudos incompatíveis com a fase (vedado), sinalizar redundância e ausência crítica, classificar cada serviço como obrigatorio/condicional/vedado com justificativa. _Por quê:_ Evita propor o estudo errado para o rito errado (ex.: EIA/RIMA onde cabe RCA, ou outorga onde não há captação) — erro caro e que mina a credibilidade técnica. Essa lógica existe pronta e foi perdida. _(trazer de: src/lib/regulatory-commercial-framework.ts (resolveLicensingPath, decisões obrigatorio/condicional/vedado, BudgetConsistencyValidation))_


## Comercial (pré-venda) — Triagem, Motor de Orçamento, Propostas, CRM
**Abas:** Triagem (/comercial/triagem), Motor de Orçamento (/motor-orcamento), Propostas (/comercial/propostas + /[id]), CRM (/crm)

**Estado atual:** As quatro abas existem mas operam como ilhas, com DOIS motores de orçamento paralelos que não conversam.

TRIAGEM — `apps/web/src/app/(app)/comercial/triagem/triagem-form.tsx` envia para `POST /comercial/diagnostico/cnae` (actions.ts:63). O cérebro é `diagnostico.service.ts:6` REGULATORY_MATRIX: um Record HARDCODED com APENAS 3 CNAEs (4731-8/00, 4520-0/01, 4520-0/05). Qualquer outro CNAE cai no fallback "Atividade não mapeada" (diagnostico.service.ts:63-78). O score é uma soma simplória: risco do CNAE (70/40/20) + porte (±15/-10) + situação (+20/-5), capado em 100 (linhas 124-136). A seleção de serviços é só `cnaeData.servicosBase` + 4 regras condicionais por situação (buildRecomendacoes:145-207). A própria UI admite a perda: campos `licencaVencida`, `possuiPgrs`, `possuiAutoInfracao` "ainda não entram no payload automatizado" (triagem-form.tsx:210-234) — são coletados e jogados fora.

MOTOR DE ORÇAMENTO — `motor-orcamento/page.tsx` é um stepper de 7 etapas (triagem→caracterização→diagnóstico→obrigações→execução→documentos→financeiro, linhas 201-209) que NÃO usa o diagnóstico da Triagem. Ele puxa de `/onboarding/gap-analysis/:id/orcamento-preview` (page.tsx:310) — um terceiro motor, no módulo onboarding. A aba "Validação do Orçamento" (FinanceiroPanel:1173-1175) tem 3 linhas HARDCODED: "Aderente ao rito" sempre Sim, "Há redundância de estudos" sempre Não, "Há ausência crítica" só olha gaps. Tipo de licenciamento é derivado por if/else de score (page.tsx:893-897), não por motor regulatório.

PROPOSTAS — `propostas.service.ts:238` cria proposta re-rodando `diagnosticoService.gerarDiagnostico` e persistindo snapshot (diagnostico + itens + faixas min/base/max). A detail page (`propostas/[id]/page.tsx`) só permite editar status, dataValidade e observações (actions.ts:102). Itens são `editavel:true` no banco (propostas.service.ts:352) mas a UI NÃO expõe edição de quantidade, preço aplicado, desconto ou inclusão/remoção de serviço — o usuário não monta a proposta, só aceita o que o motor cuspiu. Desconto/acréscimo gravam 0 fixo (propostas.service.ts:450-451). Há handoff operacional funcionando (actions.ts:133) e geração de PDF (propostas.pdf.ts).

CRM — `crm/page.tsx` + `crm/crm.routes.ts`. Kanban de leads WhatsApp por estágio, fila prioritária com `leadScore` (page.tsx:86-95) e handoff para operação. Lead tem só: numero, nome, empresa, quantidadePostos, estagio, valorEstimado, dataProximoContato, notas (crm.routes.ts:28-41). Não há qualificação (urgência, necessidade, responsável atribuído, CNAE, origem). O CRM não está ligado à Triagem nem às Propostas (a proposta tem `leadWhatsAppId` mas o kanban não mostra propostas do lead).

**Fluxo ideal do analista:** O analista comercial de uma consultoria ambiental trabalha assim, ponta a ponta:

1. LEAD CHEGA (WhatsApp/indicação). Ele registra contato e QUALIFICA: o que o cliente declara que precisa ("recebi auto de infração", "vou abrir posto novo", "minha LO vence em 60 dias"), urgência, quem é o dono do lead. O sistema deveria pontuar/priorizar e dizer "ligar hoje".

2. TRIAGEM/DIAGNÓSTICO. Com CNAE(s) + UF/município + porte + situação + histórico (tem licença? vencida? outorga? PGRS? auto de infração?), o analista quer saber: qual o ÓRGÃO competente, qual o RITO/modalidade de licenciamento aplicável, qual a CLASSE de impacto, e — crucial — QUAIS SERVIÇOS são OBRIGATÓRIOS vs CONDICIONAIS vs VEDADOS para aquele cenário. Ele não quer uma lista chapada; quer o motor dizendo "neste caso é renovação, então NÃO empilhe EIA/RIMA; foque em RAC + condicionantes + LIC-015".

3. MONTAGEM DO ORÇAMENTO. A partir dos serviços recomendados, ele AJUSTA: muda quantidade, aplica preço dentro da faixa, dá desconto de volume, inclui/remove serviços condicionais, e vê em tempo real subtotal/desconto/total. O motor deveria sugerir preço base por horas×fator×multiplicador-de-porte e aplicar desconto automático por volume — mas tudo editável. E deve VALIDAR a consistência: "você incluiu 2 estudos principais redundantes" ou "falta o estudo X obrigatório para este rito".

4. PROPOSTA. Ele gera uma proposta com narrativa: resumo executivo do risco, escopo agrupado por área técnica, marcos de pagamento (sinal/desenvolvimento/protocolo), condições, exclusões, prazo estimado, validade. Edita o texto, gera PDF, envia. Acompanha status (enviada→negociação→aprovada).

5. FECHAMENTO → HANDOFF. Aprovou: vira posto/empreendimento, contrato, OS, e a agenda de obrigações já começa populada pelo diagnóstico. O lead no CRM marca GANHO e some da fila ativa.

O sistema deveria fazer POR ELE: enquadramento órgão/rito/classe automático por CNAE real, decisão obrigatório/condicional/vedado por fase, precificação por horas com multiplicador e desconto de volume, validação anti-redundância, e geração da narrativa da proposta.

**Inteligência disponível nas fontes:** A inteligência comercial RICA foi simplificada na fusão. O que existe nas fontes:

1. CATÁLOGO REAL DE 63 SERVIÇOS — `INTERFACE/enviro-clarity-main/src/lib/habilis-services.ts`. Cada serviço (LIC-001…LIC-020, OUT-001…OUT-016, MON, EST, GES, PKG) traz: basePrice/minPrice/maxPrice, internalCost, margin, complexity (Baixa/Média/Alta), domain, category/subcategory, sphere, agencies (AMMA/SEMAD-GO/IBAMA/ANA), demandType, whenToApply, triggers, referenceTimeline (ex: "60–120 dias úteis"), steps, commercialNotes. O sistema atual só usa nome/categoria/preço.

2. MOTOR DE DECISÃO COMERCIAL — `regulatory-commercial-framework.ts` (1236 linhas). `classifyEnterpriseContext` (l.816) deriva fase, situação, órgão, escopo, driver primário. `resolveRegulatoryFramework` (l.909) dá modalidade+rito+nota técnica por fase. `resolveLicensingPath` (l.966) resolve 7 ritos (manual_pontual, implantacao, regularizacao/renovacao_operacional, operacao_monitorada, outorga_pontual, validacao_tecnica), cada um com flags allowsOperationalServices/allowsConditionalStudies/requiresTechnicalValidation. `classifyServiceDecision` (l.523) classifica CADA serviço como obrigatorio/condicional/VEDADO com justificativa (ex: bloqueia LIC-014 por incompatibilidade de modalidade; bloqueia estudos amplos em cenário hídrico pontual). `validateBudgetConsistency` (l.1130) detecta hasStudyRedundancy (2+ estudos principais), hasCriticalAbsence (falta LIC-015 em renovação), adherentToRite, e retorna status validado/revisar/inconsistente — exatamente o que a aba "Validação do Orçamento" finge fazer com 3 booleanos chumbados.

3. MOTOR DE PRECIFICAÇÃO — `budget-engine.ts`. Fórmula real: total = horas × hourRate × complexityFactor × enterpriseMultiplier. `getEnterpriseMultiplier` (l.127) cruza porte (0.9/1.15/1.4), situação (irregular 1.3, implantação 1.1, ampliação 1.15), potencial poluidor e área m². Desconto de volume: 10% para 3+ na mesma categoria, 5% para 5+ serviços, cap 15% (l.74-89). O atual só soma precoBase do catálogo, sem horas, sem multiplicador, sem desconto.

4. GERADOR DE PROPOSTA NARRATIVA — `proposal-generator.ts` (962 linhas). buildScopeSectionsFromServices (l.301, agrupa por domínio técnico), buildExecutiveSummary, buildStrategicNotes (l.363, usa indicadores ambientais alto/médio), buildDefaultMilestones (40/30/30 sinal/desenvolvimento/protocolo, l.343), buildPaymentTerms, buildConditions, buildExclusions, estimateDeadlineFromServices (l.334), renderProposalHtml (l.688) com ProposalField{value,meta:{source:engine|manual,edited}} para rastrear o que foi editado. O atual gera proposta sem narrativa, sem marcos, sem exclusões.

5. CRM RICO — `posto-compliance-unico/crm/state/lead-priority.js` (getLeadPriorityScore: overdue+500, hoje+350, novo-sem-contato+300, sem-responsável+160, sem-próxima-ação+80, urgência crítica+60). Schema `backend/supabase/whatsapp_first_contact_v1.sql` tem first_contact_channel/status/attempted/sent/replied, crm_lead_contact_attempts (tentativas de contato rastreadas). `backend/domain/diagnostic/decision-engine.ts` deriva sinais (regulatory_exposure por "passivo/auto de infração/embargo/multa", time_constraint por "prazo/fiscalização") e computa prioridade crítica/alta/normal/baixa — inteligência de qualificação que o LeadWhatsApp atual não tem.

**O furo:** O furo é que o comercial foi montado como 4 telas + 3 motores de orçamento desconectados, e o motor que sobrou é o mais pobre dos disponíveis.

1. ABISMO DE COBERTURA: a Triagem só conhece 3 CNAEs hardcoded (diagnostico.service.ts:6). O cliente real "Z+Z América" ou qualquer atividade fora de combustível/lava-rápido cai em "não mapeada". A fonte tem 63 serviços e um framework que enquadra por fase, não por tabela de 3 linhas.

2. DOIS/TRÊS ORÇAMENTOS QUE NÃO CONVERSAM: Triagem usa diagnostico.service; Motor de Orçamento usa onboarding/gap-analysis/orcamento-preview; Propostas re-roda o diagnostico. Não há fonte única. O analista vê números diferentes na Triagem e no Motor para o mesmo posto.

3. SEM DECISÃO obrigatório/condicional/VEDADO: o atual marca tudo como OBRIGATORIO (servicosBase) ou CONDICIONAL, nunca VEDADO. Resultado: empilha estudos redundantes sem ninguém barrar — justamente o que `validateBudgetConsistency` resolvia. A aba "Validação do Orçamento" tem 3 booleanos chumbados (FinanceiroPanel:1173) simulando uma validação que existe pronta na fonte.

4. SEM PRECIFICAÇÃO REAL: zero horas×fator×multiplicador-de-porte, zero desconto de volume. Só soma de precoBase. Margem/custo interno existem no banco mas são sanitizados (catalogo.service.ts:102) e nunca usados para precificar.

5. PROPOSTA NÃO É MONTÁVEL nem narrada: a UI não deixa editar item/quantidade/preço/desconto (campos editavel:true no banco, sem editor na tela); não há resumo executivo, escopo por área, marcos de pagamento, exclusões — tudo existe em proposal-generator.ts.

6. CRM CEGO: lead sem qualificação (urgência, necessidade declarada, responsável, CNAE, origem), sem priorização por sinais regulatórios, sem ligação visível com a proposta/diagnóstico. A inteligência de qualificação (decision-engine.ts) e o schema de first-contact ficaram para trás.

**Posição no fluxo geral:** Comercial é a PORTA DE ENTRADA do escritório e a origem de quase todo o dado regulatório a jusante. Fluxo ponta a ponta: CRM (lead) → Triagem/Diagnóstico (enquadramento + serviços) → Motor de Orçamento (precificação) → Proposta (narrativa + PDF + status) → Aprovação → Handoff Operacional (cria empreendimento + contrato + OS + agenda de obrigações). O diagnóstico comercial é o que SEMEIA o gap-analysis, as condicionantes e o calendário da operação. Hoje o handoff existe (propostas/[id] iniciarHandoffOperacional e o card de handoff no CRM), mas como o diagnóstico de entrada é raso (3 CNAEs, sem rito/órgão real, sem decisão de serviços), a operação herda um enquadramento pobre e o analista re-faz o trabalho. Consertar o comercial melhora tudo que vem depois: quanto mais rico o diagnóstico de pré-venda, menos retrabalho na operação.

**Propostas:**

- **[ALTA/grande] Unificar em um único motor de diagnóstico/orçamento e aposentar a matriz de 3 CNAEs** — Substituir o REGULATORY_MATRIX hardcoded (diagnostico.service.ts:6) por uma fonte de regras baseada no framework da fonte: portar classifyEnterpriseContext + resolveRegulatoryFramework + resolveLicensingPath para o módulo comercial da API, e fazer Triagem, Motor de Orçamento e Propostas consumirem ESSE motor (uma fonte só). Migrar o catálogo de 63 serviços (habilis-services.ts) para a tabela ServicoCatalogo com os campos ricos (complexity, domain, sphere, agencies, triggers, referenceTimeline). _Por quê:_ Hoje há 3 motores divergentes e a triagem só cobre combustível/lava-rápido; qualquer outro CNAE vira 'não mapeada'. O analista vê números diferentes para o mesmo posto. É a causa-raiz do furo. _(trazer de: INTERFACE/enviro-clarity-main/src/lib/regulatory-commercial-framework.ts (classifyEnterpriseContext, resolveLicensingPath) + habilis-services.ts (catálogo de 63 serviços))_
- **[ALTA/medio] Trazer a decisão obrigatório / condicional / VEDADO por rito** — Portar classifyServiceDecision (l.523) e resolveServicePortfolio (l.1085): cada serviço recomendado deve vir com decisao em {OBRIGATORIO, CONDICIONAL, VEDADO} + justificativa, agrupado em stageBlocks (diagnóstico, regularização/licenciamento, estudos condicionais, adequações, operação/monitoramento). A UI da Triagem (que já tem o badge DECISAO_LABEL) passa a mostrar também os VEDADOS com o motivo, e o builder de proposta só permite incluir não-vedados. _Por quê:_ Hoje tudo é OBRIGATORIO/CONDICIONAL e nada é barrado, então o orçamento empilha estudos redundantes. Esta é a inteligência consultiva central que diferencia o escritório. _(trazer de: regulatory-commercial-framework.ts (classifyServiceDecision, resolveServicePortfolio, STAGE_META))_
- **[ALTA/medio] Precificação real por horas × fator × multiplicador de porte + desconto de volume** — Portar budget-engine.ts: total = horas × hourRate × complexityFactor × enterpriseMultiplier(porte, situação, potencial poluidor, área). Aplicar desconto de volume (10% para 3+ na mesma categoria, 5% para 5+, cap 15%). Usar os campos horasTecnicasBase/fatorComplexidade que JÁ existem no ServicoCatalogo (catalogo.service.ts:39-40) mas hoje são ignorados na faixa. _Por quê:_ O orçamento atual é só soma de precoBase, sem lógica de porte nem desconto. O multiplicador e o desconto são exatamente o que justifica a faixa min/recomendado/máx que a tela já exibe. _(trazer de: INTERFACE/enviro-clarity-main/src/lib/budget-engine.ts (calculateBudget, getEnterpriseMultiplier))_
- **[ALTA/rapido] Substituir a 'Validação do Orçamento' chumbada pela validação real de consistência** — Implementar validateBudgetConsistency no backend e expor no Motor de Orçamento: adherentToRite, hasStudyRedundancy, hasCriticalAbsence, status {validado|revisar|inconsistente} + summary. Trocar os 3 booleanos hardcoded em FinanceiroPanel (motor-orcamento/page.tsx:1173-1175) por esse retorno. _Por quê:_ A aba já existe e finge validar (sempre 'Aderente: Sim', 'Redundância: Não'). A lógica de verdade está pronta na fonte e detecta empilhamento de estudos e ausência crítica. _(trazer de: regulatory-commercial-framework.ts (validateBudgetConsistency))_
- **[ALTA/medio] Tornar a Proposta montável: editor de itens com quantidade, preço aplicado e desconto** — Na propostas/[id]/page.tsx adicionar editor de linha: alterar quantidade, preço aplicado (validado contra faixa min/máx que o backend já checa em propostas.service.ts:294), incluir serviços condicionais do diagnóstico, remover itens, e aplicar desconto/acréscimo no total (hoje gravados como 0 fixo, linhas 450-451). Recalcular totais ao vivo. _Por quê:_ Os itens já são editavel:true no banco, mas a UI só deixa mudar status/validade/observações. O analista monta o orçamento de verdade ajustando linha a linha — isso é metade do trabalho de pré-venda.
- **[MEDIA/medio] Gerar narrativa da proposta (resumo executivo, escopo por área, marcos, exclusões)** — Portar os builders de proposal-generator.ts: buildScopeSectionsFromServices (agrupa por domínio), buildExecutiveSummary/buildStrategicNotes (a partir do risco e impactos), buildDefaultMilestones (40/30/30), buildPaymentTerms, buildConditions, buildExclusions, estimateDeadlineFromServices. Persistir como campos editáveis (padrão ProposalField{source:engine|manual,edited}) e alimentar o PDF (propostas.pdf.ts). _Por quê:_ Hoje a proposta é uma lista de itens sem texto comercial. Uma proposta profissional precisa de resumo, escopo, prazo, marcos de pagamento e exclusões — tudo já escrito e testado na fonte (proposal-generator.test.ts existe). _(trazer de: INTERFACE/enviro-clarity-main/src/lib/proposal-generator.ts (buildScopeSectionsFromServices, buildDefaultMilestones, buildExclusions, renderProposalHtml))_
- **[MEDIA/medio] Qualificar o lead no CRM e ligá-lo ao diagnóstico/proposta** — Adicionar ao LeadWhatsApp campos de qualificação: necessidadeDeclarada, urgencia, responsavelAtribuido, cnae, origem, e priorização por sinais regulatórios (portar deriveSignals/getLeadPriorityScore: 'passivo/auto de infração/embargo' = exposição crítica). No kanban, mostrar propostas vinculadas ao lead (a proposta já tem leadWhatsAppId) e permitir 'gerar triagem a partir do lead' pré-preenchendo CNAE. _Por quê:_ O CRM atual é cego: lead sem urgência/necessidade/responsável e desconectado da Triagem e Propostas. A fonte tem priorização por sinais e o schema de first-contact prontos. _(trazer de: posto-compliance-unico/crm/state/lead-priority.js + backend/domain/diagnostic/decision-engine.ts (deriveSignals) + backend/supabase/whatsapp_first_contact_v1.sql)_
- **[MEDIA/grande] Unir Triagem e Motor de Orçamento em um único fluxo de pré-venda** — Fazer o Motor de Orçamento (stepper de 7 etapas) consumir o diagnóstico da Triagem como etapa 'diagnóstico' em vez de re-buscar onboarding/gap-analysis. Permitir iniciar pela Triagem (lead sem posto cadastrado) e, ao avançar, reaproveitar o mesmo diagnóstico para gerar a proposta — sem refazer o cálculo. _Por quê:_ Hoje Triagem (lead/CNAE solto) e Motor (empreendimento já cadastrado) são dois mundos. O fluxo real é um só: qualifica → enquadra → orça → propõe. A duplicação de motores é o que gera números divergentes.


## Operação (pós-venda → entrega): Handoffs, Ordens de Serviço, Entregáveis, Fila de Trabalho, Tarefas, Atuações
**Abas:** Handoffs (operacao/handoffs), Ordens de Serviço (ordens-servico), Entregáveis (entregaveis), Fila de Trabalho (fila), Tarefas (tarefas), Atuações Técnicas (atuacoes)

**Estado atual:** Seis abas que NÃO se conversam, cada uma uma entidade isolada com seu próprio status machine, sem chave estrangeira ligando uma à outra.

HANDOFFS — É a aba mais rica. `apps/api/src/modules/operacao/handoffs.service.ts` cria um handoff a partir de uma `propostaComercial` APROVADA, copiando um snapshot saneado (diagnostico CNAE/risco, servicosResumo, alertas, proximosPassos) para `handoffs_comerciais`. O ciclo de status (handoffs-rules.ts:4-13) é AGUARDANDO_HANDOFF → EM_TRIAGEM_OPERACIONAL → AGUARDANDO_DOCUMENTOS → EM_PLANEJAMENTO → EM_EXECUCAO → CONCLUIDO. O analista só pode registrar: responsável operacional, prioridade, 3 flags booleanas (necessidadeDocumentos/Visita/Terceiro), pendências (texto livre) e observações. A página de detalhe (web .../operacao/handoffs/[id]/page.tsx:824,955,1122,1262) declara EXPLICITAMENTE e repetidamente: "Nenhuma OS, contrato ou execução foi iniciada nesta etapa". O handoff é um beco sem saída — termina em CONCLUIDO sem gerar NADA a jusante.

ORDENS DE SERVIÇO — `ordens-servico.service.ts:165` cria OS a partir de `contratoId` (não de handoff). NÃO existe campo `handoffId` na OS (grep confirmou zero referências a handoff em ordens-servico.service.ts/types.ts). Status PLANEJADA→EM_EXECUCAO→AGUARDANDO_REVISAO→CONCLUIDA. A listagem web (ordens-servico/page.tsx) é só leitura — NÃO há tela "nova OS"; o próprio rodapé admite "Próxima evolução: anexar entregáveis e gerar PDF" (linha 175). OS tem `titulo`/`escopo` digitados à mão, sem herança do serviço/obrigação diagnosticada.

ENTREGÁVEIS — `entregaveis.service.ts:137` enfileira job `gerar-entregavel` em `entregavelQueue`, MAS não existe Worker consumindo a fila (find por *worker*/*processor* = vazio; bullmq.ts só define a Queue, linha 146). Logo todo entregável fica PENDENTE/GERANDO eternamente. Conteúdo (laudo/relatório) nunca é gerado.

FILA — `fila/fila.routes.ts:63` ordena `tarefa` por `scoreCriticidade DESC`. Mas esse score é estático: schema default 0, e o único lugar que o seta é `checklists.service.ts:277` com valor HARDCODED 42. Não há motor de criticidade real.

TAREFAS — `tarefas.service.ts` é um CRUD de tarefa com evidências (TEXTO/LINK/DOCUMENTO) e ciclo PENDENTE→EM_ANDAMENTO→CONCLUIDA. Boa base, mas tarefas só nascem MANUAL ou de regras de vencimento — nunca de um handoff/OS.

ATUAÇÕES — `atuacoes/page.tsx` é puramente cosmética: faz 4 GETs (processos/documentos/tarefas/alertas), mistura num array e mostra timeline. Não registra nada, não tem ação.

**Fluxo ideal do analista:** O analista operacional recebe um projeto vendido e o executa até entregar. Sequência real:

1. RECEBER & TRIAR — Chega um handoff (proposta ganha). O analista lê o diagnóstico, os serviços contratados e o escopo. Decide: aceito? Falta documento/visita/terceiro? Quem conduz? Qual a urgência? (hoje existe, parcialmente.)

2. PLANEJAR A EXECUÇÃO — Aqui está o salto que o sistema deveria fazer POR ELE: a partir dos serviços aprovados + obrigações do diagnóstico, gerar AUTOMATICAMENTE o plano de execução — fases (diagnóstico→regularização→implantação→monitoramento), as Ordens de Serviço, as tarefas de cada OS (com responsável sugerido por especialidade, prazo estimado por prioridade), os entregáveis esperados de cada serviço, e os documentos que ele precisa pedir ao cliente. O analista REVISA e ajusta, não digita do zero.

3. EXECUTAR — Cada OS vira trabalho concreto: vistoria, coleta, protocolo. O analista (ou equipe de campo, via app /equipe/os) registra avanço, sobe evidências, marca tarefas. O sistema deveria mostrar "o que está bloqueando" e "o que vence primeiro".

4. PRODUZIR ENTREGÁVEL — Concluída a OS, gerar o documento técnico (laudo/relatório/protocolo) — idealmente com template pré-preenchido com os dados do empreendimento e do diagnóstico. Revisão técnica → disponibilizar ao cliente.

5. FECHAR & MONITORAR — Entregue, registra-se a atuação técnica (prova do que foi feito, com data e responsável) e instalam-se os monitoramentos recorrentes (renovações, periodicidades) que viram tarefas futuras na fila.

Em cada passo o analista precisa ver: o contexto do caso (diagnóstico/obrigações), o que falta, o prazo, e a próxima ação clara. O sistema deveria automatizar a DERIVAÇÃO (handoff→plano→OS→tarefas→entregáveis→monitoramento) e deixar o humano só decidir e executar.

**Inteligência disponível nas fontes:** A fonte `posto-compliance-unico` tem o motor de planejamento operacional que foi INTEIRAMENTE perdido na fusão:

1. `backend/domain/diagnostic/official-execution-plan.ts` (buildOfficialExecutionPlan, linha 179) — deriva DO diagnóstico um plano completo: PHASES (diagnostico/regularizacao/implantacao/monitoramento, linha 28-55), TASKS por obrigação com `owner` inferido por especialidade (inferOwner: especialista hídrico/resíduos/monitoramento/analista, linha 57-62), `expectedDays` por prioridade×risco (linha 64-67), `phaseCode` inferido do título (linha 69-97); DEADLINES com flag `recurring` (linha 135-146); MONITORINGS com `periodicity` (trimestral/semestral/mensal/anual, linha 148-156) e `requiresEvidence`. Isso é EXATAMENTE o "gerar OS/tarefas/entregáveis/monitoramento automaticamente" que falta.

2. `backend/domain/diagnostic/official-diagnostic-engine.ts` — buildServices (linha 249) cruza obrigações × SERVICE_CATALOG (linha 186: licenciamento 42h/R$220, outorga 28h, efluentes 24h, resíduos, emissões, territorial...) gerando serviço com `estimatedHours`, `hourlyRate`, `complexityFactor`, `total` e `linkedObligationCode`. buildStrategy (linha 275) gera milestones com `expectedDays`. Hoje o handoff carrega só `servicosResumo` (nome/categoria) sem horas/SLA/vínculo a obrigação.

3. `backend/supabase/functions/emit-operational-handoff/index.ts` — o payload de handoff ORIGINAL carregava `official_diagnostic_result` E `official_execution_plan` completos (linha 404-405), além de `responsavel_tecnico` (CREA, nome, email, linha 414-416) e `initial_task_title/description/due_date` (linha 418-420). O handoff atual descartou o plano de execução e o responsável técnico.

4. `HABILIS_AI/agentes/agente_03_operacional.txt` — o "Agente Estruturador Operacional" produz JSON com `fluxo_operacional`, `etapas_execucao`, `documentos_necessarios`, `pontos_de_controle`, `provas_obrigatorias`, `riscos_operacionais`, `entregaveis`, `delimitacao_escopo` e `gatilhos_automacao` (linha 47-72). É o blueprint do que cada OS/entregável deveria conter.

5. `posto-compliance-unico/backend/domain/diagnostic/process-flow.ts` — define o ANALYST_STAGES canônico (handoff→briefing→documentos→ready_to_run→execution→human_review→closure, linha 44-87) e `buildCaseReadiness` (linha 137) com checks de prontidão (lead, briefing, tema, escopo, necessidade, contexto mínimo) e score. É o "fluxo do analista" que o sistema atual nunca modelou — o handoff atual tem status, mas não tem o conceito de prontidão (o que falta para avançar).

**O furo:** A operação foi construída como 6 CRUDs paralelos, não como UM fluxo. O furo tem três camadas:

1. CADEIA QUEBRADA NAS JUNTAS. Handoff → OS → Entregável deveriam ser elos de uma corrente, mas não há FK ligando-os. O handoff termina em CONCLUIDO sem criar nada (a própria UI diz "nenhuma OS/contrato/execução"). OS nasce de `contratoId`, sem saber de qual handoff veio nem quais serviços/obrigações deve cobrir. Entregável nasce de OS mas com título digitado à mão. O analista precisa recriar manualmente, em cada aba, a informação que já existe na anterior.

2. INTELIGÊNCIA DE PLANEJAMENTO PERDIDA. O motor que transformava diagnóstico em plano executável (official-execution-plan.ts: fases, tarefas com owner/prazo, deadlines recorrentes, monitoramentos com periodicidade) NÃO foi portado. O handoff guarda um `servicosResumo` raso (só nome/categoria) e descartou horas, SLA, vínculo obrigação↔serviço e o plano de execução inteiro. Resultado: o "EM_PLANEJAMENTO" do handoff é só uma caixa de texto livre, não um plano gerado.

3. AUTOMAÇÕES FANTASMA. Duas peças prometem automação e não entregam: (a) `entregavelQueue` enfileira job mas NÃO há Worker — entregável fica preso em GERANDO para sempre; (b) a Fila ordena por `scoreCriticidade` que é hardcoded 42/default 0 — não há motor de criticidade, a "priorização inteligente" é fictícia. A aba Atuações é só uma timeline cosmética somando 4 listas.

Em suma: o sistema tem o COMEÇO da corrente (handoff rico) e o FIM (tarefa/evidência), mas o MEIO — derivar plano→OS→tarefas→entregáveis→monitoramento — está vazio, e justamente esse meio já existia pronto na fonte.

**Posição no fluxo geral:** Este domínio é o CORAÇÃO EXECUTOR do escritório, posicionado entre o Comercial (a montante) e o Financeiro/Cliente (a jusante):

Onboarding/Diagnóstico → Comercial (proposta APROVADA) → [HANDOFF é a porta de entrada da Operação] → Planejamento/OS → Execução/Tarefas → Entregáveis → Fechamento/Atuações → Financeiro (faturamento por entregável) → Monitoramento contínuo (gera novas tarefas na Fila).

A Operação é onde a venda vira trabalho real e o trabalho vira entregável faturável. O handoff é o ÚNICO ponto de costura entre Comercial e Operação — e está costurado pela metade (recebe, mas não dispara execução). A Fila é o ponto de entrada DIÁRIO do analista (deveria consolidar tudo que precisa de ação, de todos os módulos). Entregável é a costura com o Financeiro (entregável disponível = marco de faturamento — hoje desconectado, ver rodapé de entregaveis/page.tsx:167). Monitoramentos recorrentes alimentam a Fila de volta, fechando o ciclo de vida do cliente.

**Propostas:**

- **[ALTA/grande] Portar o motor de plano de execução (official-execution-plan.ts) para gerar OS + tarefas automaticamente ao aceitar o handoff** — Trazer buildOfficialExecutionPlan da fonte para o módulo operacao. Ao handoff transicionar para EM_PLANEJAMENTO, derivar do diagnóstico+serviços: as Ordens de Serviço (uma por fase/serviço), as tarefas de cada OS (com owner sugerido por especialidade e prazo por prioridade×risco), os entregáveis esperados e os documentos a solicitar. Apresentar como rascunho editável para o analista revisar e confirmar, não criar cego. _Por quê:_ É o furo central: o handoff termina sem gerar nada e o analista recria tudo à mão. A lógica já existe pronta na fonte (fases, tasks com owner/expectedDays, monitorings). Transforma 6 CRUDs isolados numa corrente de trabalho. _(trazer de: /home/guilherme/Projetos VS CODE/posto-compliance-unico/backend/domain/diagnostic/official-execution-plan.ts (buildOfficialExecutionPlan, inferOwner, inferExpectedDays, inferPhase, buildMonitorings))_
- **[ALTA/medio] Ligar a corrente: adicionar handoffId na OS e garantir herança de contexto handoff→OS→entregável** — Adicionar FK handoffId em ordens_servico e ordemServicoId já existe em entregavel. Ao criar OS a partir do handoff, herdar empreendimento, serviços aprovados, escopo e diagnóstico. No detalhe do handoff, mostrar as OSs geradas e seu status; no detalhe da OS, link de volta ao handoff e ao diagnóstico original. _Por quê:_ Hoje OS nasce só de contratoId, sem rastro do handoff/diagnóstico. Sem o elo, a aba Operação/Handoffs e a aba Ordens de Serviço nunca se enxergam — o analista perde o contexto a cada passo. _(trazer de: /home/guilherme/Projetos VS CODE/posto-compliance-unico/backend/supabase/functions/emit-operational-handoff/index.ts (estrutura do payload com diagnosis+execution_plan+operation))_
- **[ALTA/medio] Implementar o Worker que consome entregavelQueue e gera o entregável** — Criar o Worker BullMQ que processa o job 'gerar-entregavel': preencher template do tipo (laudo/relatório/protocolo) com dados do empreendimento+diagnóstico, gerar PDF, subir no storage (s3Key) e marcar DISPONIVEL; em falha marcar ERRO com erroMsg. Usar os campos já existentes (s3_key, nome_arquivo, tamanho_bytes, erro_msg, gerado_em). _Por quê:_ A fila é definida mas nenhum Worker a consome (bullmq.ts:146) — todo entregável fica preso em GERANDO. O schema já tem todos os campos esperando o conteúdo. É promessa quebrada visível ao usuário. _(trazer de: agente_03_operacional.txt (lista de entregaveis/provas_obrigatorias por serviço) para definir os templates)_
- **[ALTA/medio] Construir um motor real de scoreCriticidade para a Fila** — Substituir o score hardcoded por cálculo: dias até vencimento, prioridade, risco do empreendimento, tempo em inação, origem (condicionante/licença/etc). Recalcular em job periódico. A Fila já está pronta para ordenar por ele (fila.routes.ts:63) e os KPIs (críticas>70) já assumem a escala. _Por quê:_ A Fila vende 'priorização por criticidade' mas o score é 42 fixo (checklists.service.ts:277) ou 0. A inteligência central da aba é fictícia. Sem ela, a Fila é só uma lista por data. _(trazer de: /home/guilherme/Projetos VS CODE/posto-compliance-unico/backend/domain/diagnostic/decision-engine.ts (computeCasePriority, deriveSignals))_
- **[MEDIA/medio] Trazer o conceito de prontidão (readiness) e responsável técnico para o handoff** — No detalhe do handoff, mostrar checklist de prontidão (documentos recebidos, escopo confirmado, responsável técnico/CREA, visita necessária) com score, no estilo buildCaseReadiness. Bloquear avanço para execução enquanto faltar item. Capturar responsável técnico (nome/CREA/email) que o payload original já carregava. _Por quê:_ Hoje o avanço só checa pendências em texto livre. O analista não tem visão clara do 'o que falta para executar'. A fonte já modela isso (process-flow.ts ANALYST_STAGES + buildCaseReadiness) e o handoff original carregava o responsável técnico (perdido na fusão). _(trazer de: /home/guilherme/Projetos VS CODE/posto-compliance-unico/backend/domain/diagnostic/process-flow.ts (buildCaseReadiness, ANALYST_STAGES))_
- **[MEDIA/rapido] Enriquecer servicosResumo do handoff com horas, SLA e vínculo a obrigação** — Ao montar o snapshot do handoff (buildServicosResumo, handoffs.service.ts:204), trazer estimatedHours, expectedDays/SLA e linkedObligationCode de cada serviço, usando buildServices/SERVICE_CATALOG. Esses dados alimentam a geração de OS (prazos) e o financeiro (margem). _Por quê:_ O handoff hoje guarda serviço raso (só nome/categoria). Sem horas/SLA/obrigação vinculada, o plano de execução não tem como calcular prazos nem o financeiro tem como medir margem por contrato. _(trazer de: /home/guilherme/Projetos VS CODE/posto-compliance-unico/backend/domain/diagnostic/official-diagnostic-engine.ts (buildServices, SERVICE_CATALOG linha 186))_
- **[BAIXA/grande] Transformar Atuações de timeline cosmética em registro técnico real com marco de faturamento** — Tornar a Atuação uma entidade própria registrada na conclusão de OS/entregável (o que foi feito, data, responsável, prova vinculada), e expor o entregável DISPONIVEL como marco de faturamento ligado ao Financeiro (já sinalizado em entregaveis/page.tsx:167). _Por quê:_ Atuações hoje só soma 4 listas existentes sem registrar nada (atuacoes/page.tsx:58). O escritório precisa de prova técnica rastreável do que entregou e de fechar o elo Operação→Financeiro. _(trazer de: agente_03_operacional.txt (provas_obrigatorias, pontos_de_controle))_


## Regulatório núcleo
**Abas:** Licenças Ambientais, Condicionantes, Processos, Fiscalizações, Outorga Hídrica, Regulatório Urbano, ANP/INMETRO

**Estado atual:** As 7 abas são CRUDs isolados, cada uma com seu próprio modelo Prisma sem relação entre si. CONCRETAMENTE:

• Licenças Ambientais (licencas-ambientais.service.ts): CRUD de LicencaAmbiental + sub-tabela CondicaoLicenca. calcularStatus() (linha 202-209) classifica VIGENTE/A_RENOVAR(≤90d)/VENCIDA só pela dataVencimento. A página (page.tsx:69-95) mostra KPIs e lista com dias restantes. Há análise de PDF por IA: botão (analisar-ia-btn.tsx) → POST /ia/licencas/:id/analisar → aiQueue → ai.processor.ts:21-53 chama Claude haiku-4-5 (ai.service.ts:40), extrai condicionantes e cria CondicaoLicenca em massa (ai.processor.ts:39-47). Funciona, mas a CondicaoLicenca criada é "burra": só numero/descricao/prazo/status string, SEM periodicidade, sem ciclos, sem evidência, sem tarefa.

• Condicionantes (condicionantes.service.ts): modelo Condicionante RICO e SEPARADO — tem tipo, periodicidade (UNICA…ANUAL/PERSONALIZADA), intervaloDias, proximoVencimento, evidenciaExigida, gerarTarefaAuto, diasAlertaAntes[30,15,7], ciclos (CicloCondicionante), responsável. cumprir() (linha 115-174) fecha o ciclo, calcula próximo vencimento (linha 206-226) e emite evento. PORÉM esse modelo se vincula a Processo (processoId), NÃO a LicencaAmbiental. UI (recorrencia-panel.tsx) faz score de cumprimento e alertas 30d.

• Processos (processos.service.ts): a peça mais sofisticada — máquina de estados (TRANSICOES_PROCESSO), fases ordenadas a partir de TipoProcesso (template), requisitos gerados do template (criar() linha 142-155), avancarFase() bloqueia se requisito obrigatório pendente (linha 269-278), historicoFaseProcesso, dataInicioRenovacao calculada por diasAntecedenciaRenovacao (linha 113-119). É o motor de ciclo de vida — mas roda sobre numeroLicenca como STRING, sem FK para LicencaAmbiental.

• Fiscalizações (fiscalizacoes.service.ts): AutoInfracao + RecursoAdministrativo. verificarPrazosDefesa() (linha 166-200) gera alertas 7/3/1 dias. IA: POST /ia/autos/:id/analisar (extrai artigo) e /gerar-defesa → ai.processor.ts:79-110 gera DefesaTecnica via Claude. É a aba com mais "inteligência de peça".

• Outorga Hídrica (outorga-hidrica.service.ts): PocoArtesiano + LaudoAgua com parâmetros VMP/conforme. Sem renovação automática, sem geração de relatório.

• Regulatório Urbano (regulatorio-urbano.service.ts): AlvaraUrbanistico (AVCB, alvará, habite-se) — CRUD puro, calcularStatus ≤120d.

• ANP/INMETRO (anp-inmetro.service.ts): BombaAbastecimento + registrarCalibracao() que empurra proximaCalibracao.

• Automação de prazos EXISTE e é boa: vencimentos.scheduler.ts varre processos, condicionantes, licenças ambientais, poços/outorga, bombas/calibração, alvarás etc. e enfileira alertas + e-mail + cria tarefa para vencidos (linha 89-513).

**Fluxo ideal do analista:** O analista ambiental de postos trabalha por CLIENTE seguindo o ciclo de vida de cada licença, não por aba:

1. ABERTURA/PROTOCOLO: ao pegar um posto, identifica qual licença ele precisa (LP→LI→LO ou regularização). Abre processo no órgão (CETESB/estadual), monta dossiê de requisitos (MCE, plantas, ART, certidões). O sistema deveria, a partir do CNAE+UF+porte+combustíveis, dizer EXATAMENTE quais licenças/processos abrir, com quais documentos, qual órgão, qual prazo de análise do órgão.

2. EMISSÃO + EXTRAÇÃO DE CONDICIONANTES: sai a LO. O analista lê o PDF e cadastra cada condicionante COM sua periodicidade (monitoramento trimestral, RAC anual, etc.). O sistema deveria extrair isso do PDF E classificar periodicidade/responsável/evidência automaticamente, instanciando condicionantes recorrentes com ciclos.

3. CUMPRIMENTO RECORRENTE: a cada ciclo (trimestre, ano) executa o monitoramento/relatório, anexa evidência, fecha o ciclo. O sistema deveria gerar a tarefa do próximo ciclo automaticamente, alertar com antecedência e bloquear a renovação se houver condicionante em atraso.

4. RENOVAÇÃO: ~90-120 dias antes do vencimento da LO, protocola renovação (que reabre um processo) levando o RAC e todas as evidências de condicionantes. O sistema deveria abrir o processo de renovação sozinho, na janela legal, já anexando o dossiê de cumprimento acumulado.

5. FISCALIZAÇÃO/DEFESA: chega auto de infração. Analista cruza o auto com o histórico de cumprimento (que prova boa-fé/regularidade), monta defesa no prazo. O sistema deveria gerar a minuta de defesa JÁ alimentada pelo histórico de condicionantes cumpridas e evidências do próprio posto, não só pelo texto do auto.

Em todos os passos o analista quer ver UMA linha do tempo da licença: protocolo→emissão→condicionantes→renovação→autos→defesas, com tudo encadeado.

**Inteligência disponível nas fontes:** A fonte enviro-clarity-main/src/lib tem a inteligência integrada que a fusão dissolveu em CRUDs:

• fuel-station-operational.ts: É LITERALMENTE o ciclo de vida integrado do posto. buildFuelStationOperationalView() (linha 240-370) liga licensing↔processo administrativo↔condicionantes↔prazos↔documentos↔ações num único grafo. Cria automaticamente o prazo de renovação da LO usando payload.licensing.prazo_legal_renovacao_dias e data_alerta_renovacao (linha 284-305), o prazo de vencimento (307-325), e cada condicionante vira prazo com criticidade, recorrência, depende_de (evidências documentais) e pronto_para_execucao (linha 251-282). Tem dependency graph (depende_de) que o sistema novo perdeu.

• posto-inteligencia.ts: catálogo POSTO_OBRIGACOES (linha 149-228) com 6 obrigações típicas trazendo baseLegal, órgão, frequência, prioridade, consequenciaSemFazer, multaMaxima, custoServico e prazoAntecedencia (ex: OBR-001 LO renovação "90 dias antes", OBR-004 RAC anual "30 dias antes da data condicionante"). POSTO_FATORES_RISCO e calcularRiscoFinanceiro() (linha 345) ligam status de licença a R$ de exposição. JORNADA_CLIENTE (linha 437) descreve as etapas. Nada disso foi para o núcleo regulatório.

• regulatory-engine.ts: analyzeRegulatoryByCnae() (linha 237) cruza CNAE→matriz regulatória→obrigações→serviços→órgãos com riskScore. necessita_outorga/necessita_monitoramento/probable_environmental_licenses estão no RegMatrixRow. É o motor que deveria dizer "este posto precisa de LO + outorga DAEE + AVCB + ...".

• data/prazosReferencia.json: prazos de preparação E de análise do órgão por serviço (LIC-001 MCE: análise "30 a 180 dias"). Permite estimar quando protocolar.

• base-regulatoria.ts + matrizObrigacoes.json + baseOrgaos.json: matriz canônica obrigação→serviço→órgão→documento.

No sistema novo, parte virou seed read-only: apps/api/prisma/seed/obrigacoes-regulatorias.ts (494 linhas) tem 20+ obrigações de posto com fundamentoLegal e periodicidade (LO QUADRIENAL, estanqueidade QUINQUENAL, SCANC MENSAL etc.), mas é consumido só pela gap-analysis.service.ts (linha 541-572) como diagnóstico — NUNCA instancia condicionantes/processos reais.

**O furo:** a diferença entre atual e ideal está detalhada acima

**Posição no fluxo geral:** O Regulatório núcleo é o CORAÇÃO operacional do escritório e fica no MEIO do fluxo ponta a ponta: CRM/Comercial (ganha o cliente) → Onboarding/gap-analysis (diagnóstico do que falta) → REGULATÓRIO NÚCLEO (executa e mantém o ciclo de vida de cada licença) → Produção/Tarefas/Documentos (entregáveis) → Monitoramento/Estanqueidade/SST/PGRS (cumprimento das condicionantes) → Alertas/Calendário (prazos) → Portal do cliente (transparência).

É o ponto onde o diagnóstico vira obrigação real e onde toda a operação recorrente se ancora: condicionantes alimentam monitoramento/estanqueidade/PGRS; vencimentos alimentam alertas/calendário/tarefas; fiscalizações puxam defesas. Hoje ele recebe pouco do upstream (a gap-analysis não instancia nada aqui) e exporta de forma fragmentada para o downstream (condicionante rica não nasce da licença). O HubTabs do empreendimento é o único lugar onde o fluxo geral se reúne por cliente — deveria ser espelhado por uma visão de ciclo de vida POR LICENÇA dentro deste domínio.

**Propostas:**

- **[ALTA/grande] Unificar os dois modelos de condicionante e ligar Licença↔Processo↔Condicionante** — Adicionar licencaId (FK) ao modelo Condicionante rico e processoId↔licencaId no Processo. Migrar a extração de IA (ai.processor.ts:39) para criar Condicionante rica (com periodicidade/ciclos/tarefa) em vez de CondicaoLicenca burra. Deprecar CondicaoLicenca ou torná-la view da rica. Assim a cadeia protocolo→licença→condicionante→renovação→fiscalização fica navegável. _Por quê:_ É a raiz do 'furo': hoje a IA extrai condicionantes mas as joga num modelo sem periodicidade/ciclo, e licença e condicionante vivem em mundos separados. Sem isso, nenhuma automação de ciclo de vida funciona. _(trazer de: INTERFACE/enviro-clarity-main/src/lib/fuel-station-operational.ts (grafo licensing↔condicionantes↔prazos))_
- **[ALTA/medio] Linha do tempo / ciclo de vida POR LICENÇA** — Na página da licença (licencas-ambientais/[id]/page.tsx) adicionar uma timeline encadeada: protocolo (Processo) → emissão → condicionantes (com status de ciclos) → janela de renovação → autos de infração vinculados → defesas. Reaproveitar o padrão da HubTabs do empreendimento, mas por licença. _Por quê:_ O analista raciocina por ciclo de vida da licença; hoje precisa pular entre 7 abas desconexas. O agregador só existe por cliente (HubTabs), não por licença. _(trazer de: INTERFACE/enviro-clarity-main/src/lib/fuel-station-operational.ts (buildFuelStationOperationalView, deadlines unshift renovação/vencimento))_
- **[ALTA/medio] Renovação automática na janela legal** — Quando uma licença entra em A_RENOVAR (calcularStatus já detecta ≤90d), abrir/sugerir automaticamente um Processo de renovação a partir do TipoProcesso correspondente, já anexando o dossiê de condicionantes cumpridas. Usar diasAntecedenciaRenovacao do TipoProcesso (processos.service.ts:113) e prazo_legal_renovacao_dias da fonte. _Por quê:_ Hoje o sistema só alerta o vencimento (vencimentos.scheduler.ts:361); o analista ainda abre o processo na mão e remonta o dossiê. A fonte já modela isso (prazo-renovacao-lo auto-criado). _(trazer de: INTERFACE/enviro-clarity-main/src/lib/fuel-station-operational.ts (linha 284-305) + posto-inteligencia.ts OBR-001)_
- **[ALTA/grande] Instanciar obrigações/condicionantes a partir do perfil do posto (ativar o conhecimento inerte)** — Ligar a gap-analysis (que já lê o catálogo obrigacoes-regulatorias.ts) a uma ação 'gerar plano regulatório': a partir de CNAE+UF+combustíveis+porte, instanciar as condicionantes recorrentes (monitoramento trimestral, RAC anual, estanqueidade quinquenal, SCANC mensal) e os processos necessários, com periodicidade e baseLegal já preenchidos. _Por quê:_ O conhecimento existe (seed 494 linhas + regulatory-engine CNAE) mas é só diagnóstico read-only; o analista recria tudo manualmente. Esse é o ponto onde diagnóstico deveria virar operação. _(trazer de: enviro-clarity-main/src/lib/regulatory-engine.ts (analyzeRegulatoryByCnae) + posto-inteligencia.ts (POSTO_OBRIGACOES) + prisma/seed/obrigacoes-regulatorias.ts)_
- **[MEDIA/medio] Geração de peças regulatórias (não só defesa)** — Estender o ai.service para gerar minuta de requerimento de renovação, RAC (Relatório de Atendimento a Condicionantes) puxando os ciclos cumpridos, e relatório de outorga — espelhando o que já existe em gerar-defesa (ai.processor.ts:79). A defesa de auto deve ser alimentada pelo histórico de condicionantes cumpridas do posto, não só pelo texto do auto. _Por quê:_ Só fiscalizações gera peça. RAC e requerimento de renovação são as peças que o analista mais repete; e a defesa fica mais forte com o histórico de cumprimento como prova. _(trazer de: enviro-clarity-main/src/lib/proposal-generator.ts + posto-inteligencia.ts (OBR-004 RAC))_
- **[MEDIA/rapido] Classificar periodicidade/criticidade na extração de IA do PDF da licença** — Melhorar o prompt em ai.service.ts (analisarLicencaAmbiental) para também classificar periodicidade (UNICA/MENSAL/TRIMESTRAL/ANUAL), evidência exigida e responsável de cada condicionante, e mapear para o enum PeriodicidadeCondicionante ao criar. _Por quê:_ Hoje a IA extrai número/descrição/prazo mas perde a periodicidade — exatamente o campo que dispara os ciclos recorrentes e os alertas. É a 'simplificação na fusão' citada no problema central. _(trazer de: posto-inteligencia.ts (POSTO_MONITORAMENTO trimestral, frequências por obrigação))_
- **[BAIXA/medio] Score de risco regulatório por licença/posto** — Trazer calcularRiscoFinanceiro/POSTO_FATORES_RISCO para exibir, na licença e no posto, a exposição (R$ de multa, embargo) quando há condicionante em atraso ou licença vencida, alimentando priorização no cockpit. _Por quê:_ Conecta o regulatório ao comercial/risco e dá ao analista um critério objetivo de priorização; a lógica já existe pronta na fonte e não foi migrada. _(trazer de: enviro-clarity-main/src/lib/posto-inteligencia.ts (calcularRiscoFinanceiro linha 345, POSTO_FATORES_RISCO))_


## Ambiental & técnico (PGRS, Logística Reversa, Monitoramento, Estanqueidade, Risco, Equipamentos)
**Abas:** PGRS, Logística Reversa, Monitoramento, Estanqueidade, Risco, Equipamentos

**Estado atual:** Seis abas que são, hoje, CRUDs isolados com alertas de prazo, sem inteligência regulatória nem conversa entre si.

ESTANQUEIDADE — apps/web/src/app/(app)/estanqueidade/page.tsx: lista tanques, badge de "atenção" se proximoTeste <= 60d ou último REPROVADO. Detalhe em [id]/page.tsx tem LaudoForm (workflow B2) e EquipamentoHistorico. O cálculo do próximo ensaio está em [id]/laudo-form.tsx:15-21 (proximoTesteDefault): hardcoda APROVADO=+1 ano, REPROVADO/INCONCLUSIVO=+3 meses. Serviço estanqueidade.service.ts:124 só persiste o que o usuário digitou (campo proximoTeste é input manual). Não há laudo estruturado, croqui, ART, comunicação prévia, calibração vinculada nem tabela de resultado por componente.

MONITORAMENTO — page.tsx: abas Campanhas/Pontos, badge se NAO_CONFORME ou coleta <=30d. Serviço monitoramento.service.ts: campanhaMonitoramento tem parametros[] com {nome, valorMedido, limiteVMP, emAlerta}, e existe modelo LimiteParametro (VMP por tipoMedio) com upsert (linha 218). PORÉM emAlerta e o resultado da campanha são preenchidos manualmente pelo cliente (monitoramento.service.ts:19 recebe emAlerta:boolean; criar-campanha-form.tsx tem dropdown manual "resultado") — NADA compara valorMedido contra LimiteParametro automaticamente. Existe tendenciaParametros (service.ts:170) que classifica SUBINDO/DESCENDO comparando só os 2 últimos pontos, sem regressão nem detecção de pluma.

PGRS — page.tsx + pgrs.service.ts: PGRS com exigencias e evidencias; vincular evidência move exigência para COMPROVADO (service.ts:238). Bom esqueleto de comprovação, mas exigências são criadas à mão (não derivadas de resíduo×norma) e não há catálogo de resíduos do posto nem ligação com MTR/Logística Reversa.

LOGÍSTICA REVERSA — page.tsx + logistica-reversa.service.ts: MTRs (ABERTO/COLETADO/DESTINADO/ENCERRADO), transportadora, metas anuais por tipoResiduo. Alerta se MTR aberto >30d. Metas são números soltos sem base normativa nem cálculo de % atingido vs CDF/certificado de destinação.

RISCO — risco.routes.ts: lê tabela ScoreRisco pré-calculada por job 'calcular-scores-risco' (enfileirado em /calcular). NÃO encontrei o worker que produz fatores/recomendacoes — a rota só agrega e classifica (>=75 CRITICO etc.). É um placeholder dependente de um cálculo que não está no módulo.

EQUIPAMENTOS — equipamentos-historico.service.ts: histórico genérico por (equipamentoTipo, equipamentoId) com tipoEvento incluindo CALIBRACAO. Schema (schema.prisma:1491-1503) tem bomba com ultimaCalibracao/proximaCalibracao/stickerInmetro e índice em proximaCalibracao, mas não há aba dedicada nem regra que bloqueie uso de equipamento com calibração vencida.

**Fluxo ideal do analista:** O analista técnico trabalha por CLIENTE/UNIDADE e por OBRIGAÇÃO RECORRENTE, não por aba. A sequência real (espelhando o ROTEIRO_IMPLANTACAO e os POPs do SASC):

1. ENTRADA / OS: chega uma demanda (ensaio de estanqueidade, campanha de monitoramento, renovação de PGRS). O analista abre uma Ordem de Serviço, valida cadastro do empreendimento e do RT, e confere se há comunicação prévia exigida pelo órgão.

2. PLANEJAMENTO (pré-campo): para estanqueidade ele precisa saber a IDADE de cada tanque, porque a periodicidade depende dela (quinquenal/bienal/anual — MATRIZ SASC). Confere disponibilidade de equipamento com calibração válida e gera checklist pré-campo. Para monitoramento, define malha de poços, parâmetros (BTEX/TPH/HPA) e periodicidade conforme a condicionante da licença.

3. CAMPO: registra data/hora/produto/condição, fotos de identificação, salva relatório não-editável do equipamento, preenche ficha de campo POR COMPONENTE (tanque e linha separados) e marca anomalias.

4. PÓS-CAMPO / DECISÃO: aqui está o coração técnico. O sistema deveria APLICAR A ÁRVORE DE DECISÃO automaticamente: resultado ESTANQUE → emite laudo, atualiza próximo vencimento (calculado pela idade), protocola; NÃO ESTANQUE → não aprova o componente, gera ação corretiva E aciona trilha de passivo/investigação ambiental; INCONCLUSIVO → exige justificativa técnica e reensaio, nunca encerra como aprovado. Para monitoramento, o sistema deveria comparar cada valorMedido contra o VMP da CETESB e classificar CONFORME/ATENÇÃO/NÃO CONFORME sozinho, e ao detectar tendência de alta de BTEX disparar investigação.

5. EMISSÃO E PROTOCOLO: gera laudo estruturado (16 seções do MODELO SASC), com tabela por componente, ART, croqui, certificados de calibração anexos, assinatura do RT e do responsável legal.

6. CONTROLE DE VENCIMENTOS: cada obrigação cumprida realimenta o calendário (próximo ensaio, próxima coleta, próxima renovação de PGRS, próxima calibração). É isso que alimenta o score de Risco.

O que o sistema deveria fazer POR ELE: calcular periodicidade pela idade do tanque; comparar resultado de monitoramento contra VMP; rodar a árvore de decisão pós-ensaio; ao reprovar um tanque, abrir automaticamente tarefa de ação corretiva + sinalizar passivo + alertar o módulo de licenciamento; bloquear emissão de laudo sem ART/calibração; derivar as exigências do PGRS a partir dos resíduos gerados e cruzar com os MTRs emitidos.

**Inteligência disponível nas fontes:** O kit SASC V10 é o ativo mais rico e está quase totalmente fora do sistema:

- MATRIZ_MASTER_REQUISITOS.md (01_MATRIZ_REGULATORIA): regra de periodicidade por idade do tanque — até 5 anos quinquenal, 5–10 anos bienal, >10 anos anual (IN AMMA 041/2015), CONAMA 273/2000, Portaria Inmetro 716/2025, exigência de protocolo no órgão, ART + croqui + comunicação prévia. NADA disso está codificado; o sistema usa +1 ano fixo.

- ARVORE_DE_DECISAO_POS_ENSAIO.md (06_DECISAO_E_PASSIVO): lógica completa ESTANQUE/NÃO ESTANQUE/INCONCLUSIVO com ações por ramo, incluindo gatilho de investigação de passivo. É um motor de decisão pronto para virar código — hoje inexiste.

- INTEGRACAO_COM_PASSIVO_AMBIENTAL.md: regra de que estanqueidade NÃO pode isolar a informação; resultado crítico deve acionar passivo/licenciamento/monitoramento. É exatamente a "conversa entre abas" que falta.

- MODELO_ESTRUTURAL_LAUDO.md (05_MODELOS): laudo de 16 seções com tabela mínima por componente e regra "não emitir conclusão genérica sem tabela por componente". MODELO_FICHA_CAMPO_TANQUE/LINHA e MODELO_COMUNICACAO_PREVIA_ORGAO também prontos.

- CHECKLIST_PRE_CAMPO / CHECKLIST_CAMPO / CHECKLIST_POS_CAMPO_E_LAUDO (04_CHECKLISTS) e POP-EST-01..05 (03_POPS): o passo-a-passo operacional inteiro, incluindo POP-EST-05 (tratamento de NC e desvios proibidos — não omitir componente reprovado, não substituir arquivo não-editável).

- CADASTRO_MASTER_EMPRESA.md + ROTEIRO_IMPLANTACAO.md: campos de conformidade da empresa executora (certificação Inmetro com validade, CTF IBAMA, registro do RT) e a Etapa 5 de operação (OS → conferir idade dos tanques → comunicação prévia → laudo → protocolo → atualizar vencimentos) — o fluxo ideal já escrito.

- CONTROLE_PRAZOS_E_PERIODICIDADE.md + MODELO_CONTROLE_PRAZOS.csv (07_CONTROLE): planilha de campos para o controle de vencimentos por tanque.

Logística Reversa: recicla_goias_nodes.json é um mapa mental estruturado (categoria/titulo/resumo/explicacao_detalhada/momento_operacional/entradas) com a inteligência do Recicla Goiás — metas escalonadas (22%→30% de massa recuperada), escopo territorial GO, prazo 31/03/2026, conceito de verificador independente, CDF/certificados. Matriz_Precificacao_Logistica_Reversa_GO.xlsx e os manuais HTML têm regras por tipo de resíduo (pneu, bateria, óleo lubrificante, eletro, embalagem). Hoje o módulo só guarda MTRs e metas como números sem essa base.

**O furo:** O furo é que estas abas são FORMULÁRIOS DE REGISTRO, e o que o domínio técnico exige é um MOTOR DE DECISÃO REGULATÓRIA. Quatro lacunas concretas:

1. A inteligência decisória existe pronta na fonte (árvore de decisão pós-ensaio, periodicidade por idade, comparação contra VMP) mas NÃO foi codificada. O sistema confia no humano para tudo: o analista digita o próximo vencimento, digita se está em alerta, escolhe o resultado da campanha. O sistema não calcula nada.

2. Periodicidade errada por design: laudo-form.tsx:15-21 dá +1 ano fixo a todo APROVADO, contrariando a regra SASC quinquenal/bienal/anual por idade. Um tanque novo é cobrado cedo demais e um antigo pode ser subcobrado.

3. Monitoramento não detecta anomalia sozinho: existe a tabela LimiteParametro (VMP) e os valores medidos, mas ninguém os compara — emAlerta e resultado vêm preenchidos do cliente (monitoramento.service.ts:19). A tendência olha só 2 pontos. Não há detecção de pluma nem disparo de investigação.

4. Abas não conversam: um tanque NÃO ESTANQUE deveria, conforme INTEGRACAO_COM_PASSIVO_AMBIENTAL, acionar passivo + licenciamento + monitoramento + tarefa de ação corretiva e alimentar o Risco. Hoje o reprovado vira só um badge vermelho na própria aba. PGRS↔Logística Reversa e Equipamentos↔Estanqueidade (calibração que bloqueia ensaio) também estão desconectados.

**Posição no fluxo geral:** Este domínio é a EXECUÇÃO TÉCNICA RECORRENTE que sustenta a conformidade do posto ao longo do ciclo de vida da licença. No fluxo ponta a ponta do escritório: Comercial/Onboarding capta o cliente e diagnostica obrigações → Licenciamento define as condicionantes (que disparam PGRS, monitoramento, estanqueidade, logística reversa como obrigações recorrentes) → ESTE DOMÍNIO executa e comprova cada obrigação no campo (OS, ensaio, coleta, MTR, evidência) → cada execução realimenta o Calendário/Tarefas com o próximo vencimento e alimenta o Score de RISCO de fiscalização → desvios críticos (tanque não estanque, parâmetro acima do VMP) deveriam reabrir o ciclo acionando Passivo Ambiental e renovação de Licença. É o elo entre "o que o órgão exige" (regulatório) e "o que foi efetivamente feito e provado" (operação). Hoje funciona como ilha terminal; deveria ser o motor que fecha o loop de conformidade e abastece risco, calendário e licenciamento.

**Propostas:**

- **[ALTA/rapido] Calcular periodicidade do ensaio pela idade do tanque (regra SASC), não +1 ano fixo** — Substituir proximoTesteDefault (laudo-form.tsx:15-21) e o cálculo no estanqueidade.service.ts por função que usa dataInstalacao do tanque: até 5 anos→+5 anos, 5–10→+2 anos, >10→+1 ano; REPROVADO/INCONCLUSIVO força reensaio curto. Persistir a faixa de idade e a base normativa no teste. _Por quê:_ Hoje a regra está errada por design e contraria a IN AMMA 041/2015. É o cálculo central do controle de vencimentos e do score de risco. _(trazer de: Estanqueidade/HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL/01_MATRIZ_REGULATORIA/MATRIZ_MASTER_REQUISITOS.md e 07_CONTROLE/CONTROLE_PRAZOS_E_PERIODICIDADE.md)_
- **[ALTA/medio] Auto-classificar campanhas de monitoramento comparando valorMedido contra o VMP (detecção de anomalia)** — No monitoramento.service.ts (criarCampanha), para cada parâmetro buscar o LimiteParametro do tenant por (nome, tipoMedio) e calcular emAlerta = valorMedido > limiteVMP; derivar resultado da campanha (CONFORME/ATENCAO/NAO_CONFORME) do conjunto. Remover o dropdown manual de resultado do criar-campanha-form. _Por quê:_ O sistema tem os dados e a tabela de limites mas não compara nada — o monitoramento não detecta anomalia sozinho. Hoje depende do cliente marcar emAlerta à mão. _(trazer de: Tabela LimiteParametro já existe (monitoramento.service.ts:218); semear VMPs CETESB de BTEX/TPH/HPA)_
- **[ALTA/medio] Motor de decisão pós-ensaio que aciona outras abas** — Ao registrar laudo NÃO ESTANQUE: bloquear aprovação do componente, criar tarefa de ação corretiva de alta prioridade, e disparar gatilhos para Passivo/Investigação, Licenciamento e Monitoramento complementar. INCONCLUSIVO: exigir justificativa e bloquear encerramento como aprovado. Codificar a árvore como serviço reutilizável. _Por quê:_ A integração estanqueidade↔passivo↔licenciamento é regra explícita da fonte e é exatamente a 'conversa entre abas' que falta. Hoje o reprovado vira só um badge. _(trazer de: 06_DECISAO_E_PASSIVO/ARVORE_DE_DECISAO_POS_ENSAIO.md e INTEGRACAO_COM_PASSIVO_AMBIENTAL.md; POP-EST-05)_
- **[MEDIA/grande] Laudo de estanqueidade estruturado por componente, com gates de emissão** — Modelar o laudo nas 16 seções da fonte com tabela de resultado por componente (tanque e linha separados) e bloquear emissão sem ART, croqui e certificado de calibração válido do equipamento usado. Gerar a partir das fichas de campo. _Por quê:_ Hoje o 'laudo' é um único registro plano sem componentes, sem ART nem calibração — não atende ao termo de referência do órgão nem ao POP de emissão. _(trazer de: 05_MODELOS/MODELO_ESTRUTURAL_LAUDO.md, MODELO_FICHA_CAMPO_TANQUE.md, MODELO_FICHA_CAMPO_LINHA.md; 04_CHECKLISTS/CHECKLIST_POS_CAMPO_E_LAUDO.md)_
- **[MEDIA/medio] Aba/visão de Equipamentos com bloqueio por calibração vencida** — Criar visão consolidada de equipamentos (tanques/bombas/equipamento de ensaio) usando o histórico genérico e ultimaCalibracao/proximaCalibracao já no schema; impedir mobilização/uso de equipamento com calibração vencida e alertar antes do vencimento. _Por quê:_ O schema já tem proximaCalibracao indexado (schema.prisma:1503) e o POP exige conferência da calibração antes do campo, mas não há tela nem regra de bloqueio. _(trazer de: 02_IMPLANTACAO_EMPRESA/ROTEIRO_IMPLANTACAO.md (Etapa 4 — equipamentos e calibração); CADASTRO_MASTER_EMPRESA.md)_
- **[MEDIA/grande] Ordem de Serviço + checklists pré/campo/pós como espinha do fluxo técnico** — Introduzir entidade OS que amarra empreendimento + RT + escopo + comunicação prévia, e instanciar os 3 checklists SASC por etapa, exigindo conclusão de cada um antes de avançar (pré→campo→pós→laudo→protocolo). _Por quê:_ Reorganiza as abas em torno do fluxo real do analista (o problema central do 'furo'), em vez de telas isoladas de CRUD. _(trazer de: 03_POPS/POP-EST-01..04 e 04_CHECKLISTS/CHECKLIST_PRE_CAMPO/CAMPO/POS_CAMPO_E_LAUDO.md)_
- **[BAIXA/grande] Logística Reversa baseada na inteligência Recicla Goiás (metas, escopo, prazos, CDF)** — Modelar metas com base normativa (massa colocada × % meta escalonada 22%→30%, escopo territorial GO, prazo do ciclo), calcular % atingido a partir dos MTRs/CDFs e sinalizar gap vs meta; tipificar resíduos (pneu, bateria, óleo, eletro, embalagem) com suas regras. _Por quê:_ Hoje metas são números soltos sem base. A fonte recicla_goias_nodes.json traz o sistema regulatório estruturado pronto para virar regra. _(trazer de: Logística Reversa/recicla_goias_nodes.json e Matriz_Precificacao_Logistica_Reversa_GO.xlsx)_
- **[BAIXA/medio] Derivar exigências do PGRS dos resíduos gerados e cruzar com MTRs/Logística Reversa** — Gerar exigências do PGRS a partir de um catálogo de resíduos do posto×periodicidade de comprovação, e vincular automaticamente os MTRs emitidos como evidência de destinação por período. _Por quê:_ Hoje exigências são digitadas à mão e PGRS não conversa com Logística Reversa, apesar de ambos tratarem dos mesmos resíduos e comprovações. _(trazer de: Catálogo de resíduos de posto; reuso do fluxo de evidências já existente em pgrs.service.ts:238)_


## SST & Pessoas (ASOs, EPIs, Treinamentos, Funcionários, Pessoas)
**Abas:** SST — dashboard (/sst): KPIs + lista ASOs + Documentos SST + criar ASO/Doc, SST/Treinamentos (/sst/treinamentos) + Tipos (/sst/treinamentos/tipos) + Nova execução, SST/EPIs (/sst/epis), Funcionários (/funcionarios) — lista com semáforo ASO/NR/EPI + ficha individual /funcionarios/[id], Pessoas (/pessoas) — board de carga de trabalho por responsável de tarefas (NÃO é SST)

**Estado atual:** O domínio é tecnicamente sólido e mais completo do que se imaginava — é um CRUD bem-feito com semáforo agregado por funcionário e automação de vencimento por data já funcionando.

FUNCIONÁRIOS: lista em apps/web/src/app/(app)/funcionarios/page.tsx com semáforo ASO/NRs/EPI por linha e KPIs OK/Atenção/Crítico. A lógica de status mora no backend, sst.service.ts:180-225 (computeStatuses): ASO ausente/INAPTO=crítico, treinamento vencido=crítico, EPI vencendo=atenção. Ficha individual em funcionarios/[id]/page.tsx mostra ASOs, treinamentos participados e entregas de EPI. Cadastro em novo-funcionario-form.tsx coleta cargo (lista fixa de 13 cargos de posto) e setor (PISTA/DESCARGA/AREA_TECNICA/CONVENIENCIA/ADMINISTRATIVO).

SST: sst.service.ts (689 linhas) cobre Funcionário, ASO, TreinamentoTipo (template), TreinamentoExecucao + Participantes, EntregaEPI, DocumentoSST. Cálculo de vencimento de treinamento a partir de periodicidadeMeses do tipo (sst.service.ts:500-505). Dashboard /sst/page.tsx agrega ASOs/Docs/Treinamentos/EPIs vencidos.

AUTOMAÇÃO DE VENCIMENTO (já existe!): apps/worker/src/schedulers/vencimentos.scheduler.ts varre por DATA e gera alertas para ASO (linha 221), TreinamentoExecucao (398), DocumentoSST (436) e EntregaEPI (473), e faz updateMany de status para VENCIDO (linhas 571-581). Os alertas têm deep-link de volta (alertas.routes.ts:73-79).

PESSOAS (/pessoas): pessoas/page.tsx:24-88 — apesar do nome, NÃO é SST. É um board de "ownership operacional" que cruza /tarefas com /sst/funcionarios só por NOME (string match em buildPessoas, linha 30/45) para montar score de pressão. O join por nome é frágil e o módulo não pertence conceitualmente a SST.

**Fluxo ideal do analista:** O analista de SST de um escritório que atende uma carteira de postos trabalha por OBRIGATORIEDADE, não por registro avulso. Sequência real:

1) ONBOARDING DO POSTO: ao cadastrar um empreendimento (posto), o sistema deveria já saber que CNAE 4731-8 dispara: PGR + PCMSO + LTCAT obrigatórios, NR-20 para todos da pista/descarga, NR-33 para quem entra em tancagem/sumps, NR-10 para casa de máquinas, hemograma semestral (benzeno) para frentistas/operadores. O analista não deveria 'lembrar' disso — o sistema deveria gerar a matriz SST esperada do posto.

2) CADASTRO DO FUNCIONÁRIO: ao admitir 'João, Frentista, setor PISTA', o sistema deveria IMEDIATAMENTE listar o que falta para ele estar regular: ASO admissional, NR-20 básico, integração SST, ficha de EPI (calçado antiestático + uniforme manga longa + luvas neoprene), e marcar exposição a benzeno → hemograma semestral. Hoje o analista cadastra e a ficha nasce 'verde por ausência'.

3) GESTÃO DIÁRIA POR EXCEÇÃO: o analista abre o painel e quer ver, por posto, QUEM está irregular AGORA e POR QUÊ — não só 'ASO X vence em 12 dias', mas 'João (Frentista, PISTA) NÃO TEM NR-20' (ausência total), 'Maria não tem ASO admissional há 40 dias da admissão', 'Pasta de terceiro Y sem NR-20/ASO/EPI'.

4) AÇÃO/AGENDAMENTO: ao detectar vencimento/ausência, o analista agenda treinamento (turma com vários funcionários de uma vez), contrata médico para ASOs em lote, registra entrega de EPI. O sistema deveria sugerir a turma ('5 frentistas com NR-20 vencendo em 30 dias — agendar reciclagem?').

5) EVIDÊNCIA PARA FISCALIZAÇÃO: na visita do MTE, o analista precisa imprimir/exportar o dossiê SST do posto: PGR+PCMSO+LTCAT vigentes, matriz NR-20 por trabalhador, fichas de EPI assinadas, ASOs válidos, pasta de terceiros. É a entrega final do domínio.

**Inteligência disponível nas fontes:** Há uma camada de conhecimento SST RICA na fonte que foi 100% perdida na fusão:

1) INTERFACE/enviro-clarity-main/src/knowledge/blocks/posto-sst.ts — o ativo mais valioso:
   - POSTO_SETORES_RISCO (linhas 24-132): mapeia cada setor do posto → nivelRisco → riscos → NRs aplicáveis → EPIs obrigatórios → procedimentos críticos. Ex: setor PISTA → [NR-20, NR-9 Anexo 2, NR-26], EPIs [calçado antiestático, uniforme manga longa, luvas neoprene]; TANCAGEM → NR-33 (espaço confinado). Isto é exatamente o 'obrigatoriedade por NR e por setor' que falta no sistema atual.
   - POSTO_SST_CARDS (136-315): 10 cards regulatórios (NR-20, Benzeno/hemograma semestral, PGR, PCMSO, LTCAT, extintores, ARLA, documentação que o MTE pede primeiro).
   - POSTO_SST_CHECKLIST (319-341): 21 itens de inspeção de campo.
   - POSTO_SST_NEXT_STEPS (345-466): 13 planos de ação priorizados (immediate/short/medium) com horizonte (7d/30d/90d) já escritos — texto pronto para virar tarefa.

2) INTERFACE/.../src/knowledge/alerts/alert-rules.ts (linhas 249-334): regras de alerta SST de NEGÓCIO (não por data): alertNr20Vencido, alertExtintoresVencidos, alertEletricaImproviso, alertPgrAusente, alertAsoVencido, alertBenzeno — cada uma com severidade, mensagem regulatória e actionLabel. O HARD_FAILURE_IDS (linha 15) define quais falhas são 'críticas que reprovam' (sst-cl-04 NR-20, sst-cl-09 extintor, sst-cl-14 elétrica).

3) HABILIS/ARQUITETURA_HABILIS.md: linha 858 cita explicitamente como Alert Rule modelo: 'Se ASO vence em 30 dias e não há novo agendado: alertar' — o conceito de detectar AUSÊNCIA de renovação agendada, não só vencimento; linhas 215-222 descrevem a 'matriz SST por empreendimento' como saída esperada.

4) INTERFACE/.../src/pages/SSTPage.tsx: a tela original tinha tipos mais ricos de ItemSST (PGR/PCMSO/LTCAT/treinamento/EPI/exame/inspecao/integracao/nao_conformidade) com agrupamento por posto — hoje 'inspeção', 'integração' e 'não conformidade' sumiram como tipos de primeira classe.

**O furo:** O sistema gerencia REGISTROS que existem, mas é cego para OBRIGAÇÕES que deveriam existir. Três furos concretos:

1) OBRIGATORIEDADE NÃO É CALCULADA (o furo central). O campo TreinamentoTipo.obrigatorioParaCargos EXISTE no schema (schema.prisma:1346), é capturado no form (criar-tipo-form.tsx:56-65) e exibido — mas NENHUMA lógica o usa. O sistema nunca cruza 'cargos obrigados × funcionários ativos' para gerar a lista de QUEM está faltando o treinamento. Resultado: um frentista sem NENHUM registro de NR-20 aparece com treinamentoStatus='AUSENTE' que vira só 'ATENCAO/CRITICO' genérico (sst.service.ts:192), sem dizer QUAL NR falta nem POR QUÊ. A automação do worker (vencimentos.scheduler.ts) só alerta sobre registros que EXISTEM e têm data — nunca sobre ausência total de obrigação.

2) A INTELIGÊNCIA SETOR→NR→EPI ESTÁ PERDIDA. O funcionário tem campo 'setor' (PISTA/DESCARGA/etc.) mas o sistema não sabe que PISTA exige NR-20+benzeno, que TANCAGEM exige NR-33, que casa de máquinas exige NR-10. Toda essa matriz (POSTO_SETORES_RISCO) virou texto morto em outro projeto. O EPI é cadastrado como string livre (tipoEPI: String) sem vínculo ao que o setor exige.

3) BENZENO/PCMSO INVISÍVEL. Hemograma semestral para expostos (frentistas/operadores) é a primeira coisa que o MTE pede e não existe nem como conceito — DocumentoSST tem PCMSO genérico, mas não há vínculo funcionário-exposto → exame periódico → vencimento de 6 meses.

4) PESSOAS está no lugar errado: é board de tarefas, não SST, e faz join por nome (frágil). Não pertence a este domínio.

**Posição no fluxo geral:** SST & Pessoas é um domínio operacional 'de carteira contínua': entra DEPOIS do onboarding/diagnóstico (quando o posto vira cliente e o CNAE define que SST é obrigatório) e roda em ciclo perpétuo, alimentando dois fluxos a montante e a jusante. A montante depende de Empreendimentos (cada funcionário/ASO/EPI pertence a um empreendimentoId) e idealmente do diagnóstico regulatório que deveria 'ligar' as obrigações SST. A jusante alimenta: (1) Alertas/Vencimentos — o worker já gera alertas de ASO/treinamento/EPI/DocSST; (2) Checklists de campo — o checklist SST de 21 itens da fonte se conecta à inspeção presencial; (3) Fiscalizações — o dossiê SST é a evidência apresentada ao MTE; (4) potencialmente Tarefas — pendências SST deveriam virar tarefas com prazo. Hoje essas conexões existem só parcialmente (alertas sim; checklist, fiscalização e tarefas não). É um dos poucos domínios onde a automação de vencimento por data JÁ está pronta — o gap não é o 'depois', é o 'antes': calcular a obrigação que deveria existir.

**Propostas:**

- **[ALTA/medio] Motor de obrigatoriedade SST: gerar a lista de PENDÊNCIAS por funcionário (quem falta o quê)** — Criar um service que cruza, por funcionário ativo, o TreinamentoTipo.obrigatorioParaCargos (já no schema) e o setor → NRs esperadas, contra os treinamentos efetivamente participados. Output: para cada funcionário, lista de obrigações AUSENTES (ex: 'NR-20 nunca realizada') e VENCIDAS, separadas de 'a vencer'. Expor em /sst/funcionarios já enriquecido e numa nova visão 'Pendências SST por posto'. _Por quê:_ É o furo central: o sistema é cego para ausência de obrigação. O campo obrigatorioParaCargos existe e é coletado mas nunca usado em lógica. Sem isso o semáforo só reflete o que foi cadastrado, nunca o que falta. _(trazer de: INTERFACE/enviro-clarity-main/src/knowledge/blocks/posto-sst.ts (POSTO_SETORES_RISCO: mapa setor→NRs); HABILIS/ARQUITETURA_HABILIS.md:858 (conceito 'ASO vence e não há novo agendado: alertar'))_
- **[ALTA/medio] Seed da matriz de risco do posto (setor → NRs → EPIs → procedimentos)** — Portar POSTO_SETORES_RISCO para um seed/tabela de referência e pré-cadastrar os TreinamentoTipos canônicos de posto (NR-20 básico/intermediário/avançado, NR-33, NR-10, NR-23/brigada, NR-17, integração SST) com periodicidade e obrigatorioParaCargos/Setores já preenchidos. Hoje cada tenant cadastra tipos do zero. _Por quê:_ Dá a base de conhecimento para o motor de obrigatoriedade funcionar 'out of the box' e elimina trabalho manual repetitivo. A inteligência já existe pronta na fonte, foi só abandonada. _(trazer de: INTERFACE/enviro-clarity-main/src/knowledge/blocks/posto-sst.ts (POSTO_SETORES_RISCO linhas 24-132; lista de EPIs por setor))_
- **[ALTA/medio] Alertas SST por AUSÊNCIA, não só por data** — Adicionar ao apps/worker/src/schedulers/vencimentos.scheduler.ts (ou novo sst.scheduler.ts) regras que alertam: (a) funcionário admitido há >X dias sem ASO admissional; (b) funcionário em cargo/setor obrigado sem o treinamento correspondente; (c) posto sem PGR/PCMSO/LTCAT vigente; (d) exposto a benzeno sem hemograma nos últimos 6 meses. Reaproveitar as mensagens regulatórias prontas. _Por quê:_ O worker hoje só varre registros existentes com dataVencimento (vencimentos.scheduler.ts:221+). A ausência total — o caso mais grave e mais autuado pelo MTE — passa despercebida. _(trazer de: INTERFACE/enviro-clarity-main/src/knowledge/alerts/alert-rules.ts (alertNr20Vencido, alertAsoVencido, alertPgrAusente, alertBenzeno — linhas 251-334, com textos e severidades prontos))_
- **[MEDIA/medio] Vínculo de exposição a benzeno → PCMSO/hemograma semestral** — Adicionar flag de exposição (derivada de setor PISTA/DESCARGA ou cargo Frentista/Operador) e tratar hemograma como exame periódico de 6 meses no PCMSO, com vencimento e alerta próprios. Mostrar na ficha do funcionário um bloco 'Saúde ocupacional / agentes de risco'. _Por quê:_ Hemograma semestral por benzeno é o item nº1 que o fiscal solicita (posto-sst.ts card sst-benzeno/sst-pcmso) e hoje é literalmente inexistente no modelo de dados. _(trazer de: INTERFACE/enviro-clarity-main/src/knowledge/blocks/posto-sst.ts (cards sst-benzeno linhas 157-174 e sst-pcmso 197-214))_
- **[MEDIA/rapido] Agendamento de turma de treinamento a partir das pendências** — No fluxo de TreinamentoExecucao, pré-selecionar como participantes todos os funcionários que estão com aquele tipo ausente/vencido (vindos do motor de obrigatoriedade). O analista cria a turma com 1 clique em vez de adicionar um a um. _Por quê:_ Fecha o loop: detectar pendência → agir. A criação de execução já aceita participanteIds[] (sst.service.ts:519), só falta alimentar a lista automaticamente. É o trabalho real do analista (treinar em lote, não individualmente).
- **[MEDIA/grande] Dossiê SST do posto exportável para fiscalização** — Tela/relatório por empreendimento consolidando: documentos SST vigentes (PGR/PCMSO/LTCAT), matriz NR por trabalhador, ASOs válidos, fichas de EPI, status de extintores/AVCB, pasta de terceiros — com indicação visual do que falta. Exportável em PDF. _Por quê:_ É a entrega final do domínio e o momento de maior valor (visita do MTE). A 'matriz SST por empreendimento' é descrita como saída esperada em HABILIS/ARQUITETURA_HABILIS.md:220-222 e nunca foi construída. _(trazer de: INTERFACE/enviro-clarity-main/src/knowledge/blocks/posto-sst.ts (card sst-documentos linhas 258-276: 'o que o MTE solicita primeiro'))_
- **[BAIXA/medio] Pendência SST → tarefa com plano de ação pronto** — Gerar tarefas a partir das pendências SST usando os textos prontos de plano de ação (immediate/short/medium com horizonte 7d/30d/90d). Ex: NR-20 vencida → tarefa 'Regularizar NR-20 de toda a equipe' com prazo 30d. _Por quê:_ Conecta SST ao fluxo geral de trabalho (tarefas) e elimina redigir manualmente o que já está escrito de forma juridicamente correta na fonte. _(trazer de: INTERFACE/enviro-clarity-main/src/knowledge/blocks/posto-sst.ts (POSTO_SST_NEXT_STEPS linhas 345-466: 13 planos com priority/horizon/descrição prontos))_
- **[BAIXA/rapido] Tratar terceiros (PJ/TERCEIRIZADO) com pasta de documentação própria** — Marcar funcionários de vínculo TERCEIRIZADO/PJ e exigir deles a mesma pasta (NR-20+ASO+EPI) antes de liberar acesso a área de risco; alertar quando incompleta. _Por quê:_ A NR-20 exige verificar terceiros antes do acesso e o posto responde solidariamente em acidente (alert-rules.ts:393-405). O campo vinculo já existe no schema mas não muda nenhuma regra. _(trazer de: INTERFACE/enviro-clarity-main/src/knowledge/alerts/alert-rules.ts (alertTerceirosSemDocumentacao linhas 393-405))_
- **[BAIXA/rapido] Reposicionar a aba Pessoas (não é SST)** — Mover /pessoas para o domínio de Tarefas/Operação (é board de carga de trabalho por responsável) e, se mantida, trocar o join por nome por join por usuarioId. Não deixar como sub-item de SST/Funcionários. _Por quê:_ pessoas/page.tsx cruza tarefas×funcionarios só por string de nome (linhas 30/45) — frágil e conceitualmente errado: 'Pessoas' aqui são responsáveis técnicos de tarefa, não trabalhadores do posto. Confunde o usuário sobre onde está a gestão de equipe SST.


## Documentos, Evidências & Compliance/Auditoria
**Abas:** Documentos, Auditoria, Condicionantes (evidências), Portal (upload), Campo (evidências)

**Estado atual:** As 5 abas existem e funcionam tecnicamente bem, mas isoladas e "burras" (cada uma é um CRUD que não cruza inteligência).

DOCUMENTOS: `apps/web/src/app/(app)/documentos/page.tsx` é uma tabela filtrável por status (Pendente/A Renovar/Vencido/Aprovado/Em Análise) com coluna de validade e alerta de vencimento (page.tsx:88-121). O detalhe `[id]/page.tsx` mostra metadados (categoria, datas, órgão, protocolo) + histórico de versões + upload de nova versão (presigned S3 em 3 fases: upload-documento.tsx:25-78). Aprovar/Reprovar inline (aprovacao-inline.tsx). API: `documentos.service.ts` faz upload presignado com hashSha256 (linha 81-102), aprovação versiona (repository.ts:142-178 — marca anterior SUBSTITUIDA, ativa nova, seta status APROVADO). Reprovar notifica o portal por e-mail (service.ts:213-231).

AUDITORIA: `auditoria/page.tsx` é uma trilha de eventos read-only (timeline + KPIs + filtros por entidade/usuário/data + DiffView antes/depois nas linhas 363-395). API `audit/audit.routes.ts` restrita a ADMIN_TENANT/COORDENADOR/SUPER_ADMIN (linha 11-21). É puramente LOG TÉCNICO de mutações (quem editou o quê), não uma "auditoria de conformidade".

CONDICIONANTES: `condicionantes/page.tsx` lista com periodicidade e próximo vencimento + RecorrenciaPanel. Evidência de cumprimento existe via `CicloCondicionante` com `documentoEvidenciaId` (condicionantes.service.ts:129-136), mas o detalhe só mostra histórico de ciclos (`[id]/page.tsx:84`).

PORTAL: `portal/(portal)/documentos/page.tsx` agrupa documentos solicitados por MOMENTO (ANTES/DURANTE/APOS processo, linhas 48-64) e o cliente faz upload (UploadCard). API `portal.routes.ts` tem upload solicitar/confirmar (linha 174, 586) e dispara alerta "documento recebido" (linha 654).

CAMPO: `equipe/(equipe)/evidencias/page.tsx` é galeria de fotos de vistoria com geotag, setor, nota e status de validação. API `evidencias.routes.ts` cria evidência vinculada a OrdemServico, anexa foto presignada (só imagens, linha 102) e o analista valida/rejeita (PATCH /:id/validar, linha 129).

COMPLIANCE: `compliance/compliance.routes.ts` só LÊ snapshots pré-calculados (índice de conformidade da rede e por empreendimento). O cálculo está no worker `compliance.processor.ts` e conta documentosValidos/total, condicionantesCumpridas, processosRegulares etc., mas o documento só vira "válido" se status===APROVADO — não há verificação de CONTEÚDO.

**Fluxo ideal do analista:** O analista ambiental que renova uma LO de posto trabalha assim (visto literalmente na planilha real Z+Z, ver Inteligência nas Fontes):

1. RECEBER O ACERVO: chega uma pilha de PDFs escaneados (processo histórico SCAN0035-0044, e-mails do cliente, documentação avulsa). Hoje são dezenas de páginas misturadas num único PDF.

2. INVENTARIAR / CLASSIFICAR: para CADA documento (às vezes por página), o analista identifica: tipo documental (Licença / Laudo / MCE / DANFE / Procuração / Certidão), número, órgão emissor, interessado, CNPJ, datas (emissão/protocolo/validade), STATUS (vigente/vencido/sem prazo), finalidade no processo, resumo do conteúdo, relação com a renovação e observações críticas. Isso é trabalho de horas, manual, hoje feito em Excel.

3. CRUZAR COM O CHECKLIST DE EXIGÊNCIAS: comparar o que existe contra a lista de documentos obrigatórios da renovação (Requerimento, RG/CPF dos sócios, Contrato Social, Procuração, DUAM, Publicações, Licenças anteriores...). Marcar cada exigência como Atendido / Atendido parcialmente / Não localizado / Precisa atualizar — com o arquivo correspondente apontado.

4. IDENTIFICAR O FURO (GAP): "o que falta, o que está vencido, o que precisa ser refeito antes do protocolo". Ex.: laudo de estanqueidade vencido, procuração com vigência duvidosa, taxa DUAM não emitida.

5. RECEBER DELTAS: o cliente manda documentos novos depois (RGI 2025, Cercon, Estanqueidade 2024). O analista precisa saber qual documento novo SUBSTITUI qual antigo vencido e re-marcar o checklist.

6. VALIDAR EM CAMPO: gerar um checklist de visita (layout x planta, tanques, bombas, SAO, descarga) e coletar evidências fotográficas geolocalizadas, cruzando com a base documental.

7. CONSOLIDAR E PROTOCOLAR: produzir o dossiê final e a tabela única "o que ainda falta, quem é responsável, prioridade".

O sistema deveria fazer POR ELE os passos 2, 3 e 4: classificar/extrair com IA, casar com o checklist de requisitos do tipo de processo, e gerar a lista de pendências/gaps automaticamente.

**Inteligência disponível nas fontes:** 1. INVENTÁRIO DOCUMENTAL REAL (a peça mais valiosa) — `Z+Z - América/PROJ_Z+Z_AMERICAPOSTO_GUAPÓ/SEMMA GUAPÓ/Notebooklm/Inventário Documental do Licenciamento Ambiental Auto Posto América_consolidacao (1).xlsx`. Tem 6 abas que são literalmente o fluxo do analista:
- Aba "Base 1" (tabela Tabela1, 100 linhas): inventário por documento com colunas EXATAS que uma IA de extração deve produzir: ID, Arquivo de Origem, Página(s), Nome/Título, Tipo Documental, Número Documento/Processo, Órgão Emissor, Interessado/Empreendimento, CNPJ/CPF, Data Emissão, Data Protocolo, Validade, Vencimento, Status Documental, Finalidade no Processo, Resumo do Conteúdo, Relação com a Renovação, Observações. Ex. de linha real: "Laudo de Estanqueidade 08/2020 | Laudo Técnico | 08/2020 | VIPPASI Engenharia | ... | vencido | Condicionante SASC".
- Aba "LO - Renovação": CHECKLIST de exigências x atendimento (Item, Exigência Documental, Documento Correspondente, Arquivo/Página, Status de Atendimento [Atendido integralmente / parcialmente / Não localizado / Precisa atualizar], Observação Técnica).
- Aba "Recebidos 2026": registro de DELTAS — documento novo, o que substitui no inventário, ação recomendada.
- Aba "Visita de Campo": checklist de vistoria por eixo (tanques, bombas, SAO) com evidência esperada e criticidade.
- Aba "Consolidação Reg.": tabela única de pendências (Bloco, Processo, Item, Ação imediata, Validar em campo?, Situação, Prioridade, Responsável).

2. DOCUMENTOS REAIS DE CLIENTE — `Z+Z - América/.../Documentação Recebida 14042026/13042026/`: LO 2025, Extrato de Condicionantes, Teste de Estanqueidade 10-2024, Relatório de Efluentes, RGI, Cercon, MCE — corpus perfeito para treinar/testar a IA de classificação.

3. AGENTE AUDITOR — `HABILIS_AI/agentes/agente_04_auditor.txt`: define uma auditoria REGULATÓRIA (não trilha técnica) que aponta erros_criticos, inconsistencias, extrapolacoes, itens_sem_base, nivel_risco (baixo/medio/alto) e status_validacao (validado/parcialmente_validado/reprovado) — cada apontamento com campo+item+motivo rastreável. É o conceito de "auditoria de conformidade" que falta no sistema.

4. AGENTE COLETOR — `HABILIS_AI/agentes/agente_01_coletor.txt`: estrutura base legal/técnica/instrumentos de comprovação por tema, útil para o motor de checklist saber QUAIS documentos comprovam o quê.

5. PIPELINE LLM JÁ PRONTO — `apps/worker/src/services/ai.service.ts`: já usa Anthropic Claude (claude-haiku-4-5) com PDF nativo via base64 baixado do S3, e `analisarLicencaAmbiental` já extrai dados estruturados E auto-cria condicionantes (ai.processor.ts:36-50). O mesmo padrão se aplica direto a documentos genéricos.

**O furo:** O sistema trata DOCUMENTO como um arquivo + metadados digitados à mão, enquanto o analista precisa de um DOSSIÊ INTELIGENTE que se classifica, se cruza com exigências e se audita sozinho.

1. ZERO CLASSIFICAÇÃO/EXTRAÇÃO POR IA: existe pipeline Claude+PDF para licença e auto de infração, mas o documento genérico exige o analista digitar tipo, número, órgão, datas e status manualmente (documentos.service.ts:criar). A planilha real prova que isso é dezenas de horas por cliente.

2. NÃO HÁ INVENTÁRIO NEM CHECKLIST DE GAP: a aba Documentos é uma lista plana por status; não existe a visão "exigências do processo X documentos existentes = o que falta". O `RequisitoTipoProcesso` (schema.prisma:744) e `momento` (ANTES/DURANTE/APOS) existem mas não geram um checklist de atendimento como na aba "LO - Renovação".

3. "AUDITORIA" É SÓ LOG TÉCNICO: `audit.routes.ts` registra quem editou o quê — não é a auditoria de CONFORMIDADE do agente_04 (gaps, riscos, documento vencido/incoerente, nível de risco regulatório). O analista não tem um botão "auditar a regularidade deste empreendimento".

4. EVIDÊNCIA NÃO COMPROVA NADA AUTOMATICAMENTE: evidência de campo, documento e ciclo de condicionante são silos separados. Validar uma evidência não baixa a pendência da condicionante nem move o índice de compliance de forma rastreável.

5. COMPLIANCE É CONTAGEM, NÃO CONTEÚDO: o índice conta status===APROVADO, mas um documento pode estar "aprovado" e vencido/incoerente. Não há verificação de que o conteúdo do PDF bate com os metadados (data de validade real vs. digitada).

6. DELTAS MANUAIS: quando chega documento novo que substitui um vencido (aba "Recebidos 2026"), nada no sistema sugere "este novo Cercon substitui o ID 84 vencido".

**Posição no fluxo geral:** Este domínio é a CAMADA DE PROVA do escritório — fica no meio e no fim do fluxo ponta a ponta. Sequência geral: (1) Onboarding/Comercial diagnostica obrigações por CNAE/UF e gera o escopo; (2) Processos/Licenças abrem os pedidos regulatórios e definem as exigências (RequisitoTipoProcesso); (3) ESTE DOMÍNIO coleta, classifica, valida e rastreia os documentos/evidências que COMPROVAM o atendimento dessas exigências e o cumprimento de condicionantes; (4) Compliance/Cockpit consome o resultado como índice de conformidade; (5) Fiscalizações/Defesas usam o dossiê auditado como prova. O Portal é a porta de entrada do cliente (upload) e o Campo é a porta de entrada da equipe (evidência in loco). Hoje esse domínio recebe e guarda, mas não classifica nem audita — então quebra a ponte entre 'exigência aberta no processo' e 'compliance verde no cockpit', deixando o analista preencher o vão à mão (como na planilha Z+Z).

**Propostas:**

- **[ALTA/medio] IA de classificação e extração documental (Inventário automático)** — Estender o pipeline Claude+PDF existente para documentos genéricos: ao confirmar upload (documentos.service.ts:confirmarUpload), enfileirar job 'classificar-documento' que baixa o PDF do S3 e retorna JSON com tipo documental, número, órgão emissor, interessado, CNPJ, datas (emissão/protocolo/validade), status (vigente/vencido/sem prazo), finalidade no processo, resumo e observações. Pré-preencher os metadados do Documento (hoje digitados à mão) e exibir como 'sugestão da IA' para o analista confirmar/corrigir, registrando em DocumentoVersao um campo analiseIA (como já existe em LicencaAmbiental). _Por quê:_ É o maior ganho de tempo do domínio: hoje o analista digita tudo à mão (a planilha real tem 100 linhas inventariadas manualmente). O pipeline LLM já existe e funciona para licenças. _(trazer de: apps/worker/src/services/ai.service.ts (analisarLicencaAmbiental como molde); colunas de Z+Z .../Notebooklm/Inventário Documental..._consolidacao (1).xlsx aba Base 1 como schema do JSON de extração)_
- **[ALTA/medio] Checklist de Exigências x Documentos (visão de GAP)** — Criar uma aba/seção que, para um empreendimento+processo, liste as exigências (RequisitoTipoProcesso já no schema:744) e case cada uma com o documento existente, marcando Atendido / Atendido parcialmente / Não localizado / Precisa atualizar / Vencido — com link para o arquivo e a página. Gerar automaticamente a lista de pendências antes do protocolo. _Por quê:_ É exatamente a aba 'LO - Renovação' da planilha real — o passo de decisão central do analista. Hoje o sistema tem os requisitos mas não produz o checklist de atendimento. _(trazer de: Z+Z .../Inventário Documental... aba 'LO - Renovação' (estrutura Item/Exigência/Documento Correspondente/Status de Atendimento/Observação))_
- **[ALTA/grande] Auditoria de Conformidade (não só trilha técnica)** — Criar uma 'Auditoria Regulatória' por empreendimento que rode o conceito do agente_04: aponta documentos vencidos, exigências não atendidas, incoerências (ex. validade do PDF != metadado), condicionantes sem evidência, e classifica nivel_risco (baixo/medio/alto) + status (validado/parcialmente/reprovado), cada item com campo+motivo rastreável. Separar visualmente da aba 'Auditoria' atual (renomear a atual para 'Trilha de eventos'). _Por quê:_ Hoje 'Auditoria' só responde 'quem editou', não 'o empreendimento está regular?'. O analista precisa do segundo. O blueprint do agente Auditor já define a saída. _(trazer de: HABILIS_AI/agentes/agente_04_auditor.txt (estrutura de auditoria, níveis de risco e status de validação))_
- **[MEDIA/medio] Sugestão de substituição (deltas de documentos recebidos)** — Quando um documento novo é classificado pela IA, comparar tipo+empreendimento+órgão com documentos existentes vencidos e sugerir 'este novo Laudo de Estanqueidade 2024 substitui o de 2020 (vencido) — confirmar?'. Ao confirmar, criar nova versão/substituir e re-marcar o checklist de gap. _Por quê:_ Replica a aba 'Recebidos 2026' (documento novo -> o que substitui -> ação). Hoje é 100% manual e propenso a esquecer documento vencido na base. _(trazer de: Z+Z .../Inventário Documental... aba 'Recebidos 2026')_
- **[MEDIA/medio] Unificar evidências (campo + documento + condicionante) num eixo de comprovação** — Permitir que validar uma evidência de campo ou aprovar um documento de evidência baixe automaticamente a pendência da condicionante (CicloCondicionante.documentoEvidenciaId já existe) e recalcule o snapshot de compliance, registrando a cadeia na trilha. Mostrar no detalhe da condicionante e do empreendimento 'evidências que comprovam'. _Por quê:_ Hoje campo/documento/condicionante são silos; o analista valida uma foto e nada acontece no compliance. Fechar o laço torna a comprovação rastreável ponta a ponta. _(trazer de: Z+Z .../Inventário Documental... aba 'Visita de Campo' (evidência esperada x criticidade x encaminhamento))_
- **[BAIXA/grande] Checklist de visita de campo gerado a partir dos gaps** — Ao abrir uma OrdemServico de vistoria, gerar um checklist por eixo (layout/planta, tanques, bombas, SAO, descarga) derivado das pendências documentais ('validar em campo?'), com 'evidência esperada' e criticidade, e amarrar as fotos coletadas (EvidenciaCampo) a cada item. _Por quê:_ A aba 'Visita de Campo' e 'Consolidação Reg.' mostram que a vistoria é guiada pelos gaps documentais; hoje a evidência de campo é uma galeria solta sem roteiro. _(trazer de: Z+Z .../Inventário Documental... abas 'Visita de Campo' e 'Consolidação Reg.')_


## Inteligência & Assistente — a peça consolidadora (cérebro) do sistema
**Abas:** Assistente Hábilis, IA (análise de PDF / geração de defesa), Base de Conhecimento (Conhecimento/Playbooks), WhatsApp (Agente + Leads)

**Estado atual:** Hoje o domínio é composto por QUATRO peças desconectadas, cada uma com sua própria "IA", sem nenhum orquestrador comum:

1) ASSISTENTE HÁBILIS (apps/web/src/app/(app)/assistente-habilis/page.tsx). É uma tela de busca por palavras-chave, NÃO um assistente conversacional. O backend é conhecimento.routes.ts:222 (POST /conhecimento/perguntar) que faz scoreItem() (linhas 82-110) — tokeniza, remove stopwords e soma pontos por match literal. Não há LLM, não há contexto do cliente, não há memória. A própria página declara "Busca local por palavras-chave. Sem IA externa nesta fase" (assistente-form.tsx:161) e "Demo local 100%" / "consulta sem IA externa" (page.tsx:31). A base é estática: habilis-postos-kb.json (8 módulos) + habilis-playbooks-auditados.json (17 playbooks), lidos via readFileSync (conhecimento.routes.ts:55-60). Há ainda um playbooks-fallback.json de 852 KB embutido no front (page.tsx:17) como fallback quando a API falha.

2) IA (apps/api/src/modules/ia/ia.routes.ts + apps/worker/src/services/ai.service.ts + processors/ai.processor.ts). Faz 3 coisas isoladas, sempre acopladas a um registro específico: analisar licença PDF (extrai condicionantes → cria CondicaoLicenca automaticamente, ai.processor.ts:37-50), analisar auto de infração e gerar defesa técnica. Usa Claude (claude-haiku-4-5, ai.service.ts:41) com prompts hardcoded. NÃO há nenhuma tela "IA" central — a IA está embutida dentro de Licenças e Autos. Não existe endpoint conversacional na API (grep por messages.create na API não encontra nada além do JSON).

3) BASE DE CONHECIMENTO. Não tem aba própria: vive dentro do Assistente (PlaybooksWorkspace em page.tsx:199) e expõe GET /conhecimento/modulos, /playbooks, /playbooks/:slug. É conteúdo curado manualmente em JSON, somente leitura. Não há ingestão, não há vínculo com a base regulatória real do sistema (legislacao, condicionantes), nem com os 4-agentes da fonte.

4) WHATSAPP (apps/web/.../whatsapp/page.tsx + apps/api/.../whatsapp/whatsapp.routes.ts + apps/worker/.../agente-whatsapp.service.ts). É a peça MAIS inteligente do domínio e a única com LLM conversacional real. Tem dois modos (agente-whatsapp.service.ts): modo COMPLIANCE para números cadastrados (buscarContextoCliente linha 15 cruza licenças vencendo, autos abertos, scoresRisco e alertas; formata e responde via Claude, linha 100) e modo COMERCIAL para desconhecidos (qualifica lead, extrai nome/empresa/qtd postos/desafios via Claude e grava em LeadWhatsApp, linhas 182-254). Há também digest.service.ts:147 (gerarNarrativaIA) que gera resumo semanal executivo via Claude. Conclusão: a inteligência de verdade (contexto + LLM) já existe, mas só roda pelo WhatsApp/digest, e o "Assistente" da web — que deveria ser o cérebro — é o mais burro de todos.

**Fluxo ideal do analista:** O analista ambiental/regulatório de postos trabalha o dia todo fazendo perguntas e tomando decisões. O Assistente deveria ser a barra de comando única que acompanha esse fluxo:

1) ABRIR O DIA — "o que é urgente hoje?". O analista quer um briefing: prazos de condicionantes vencendo, autos com prazo de defesa correndo, licenças a renovar, tarefas atrasadas, postos com score crítico. (Isso já é calculado por digest.service e agente-whatsapp, mas o analista da web não tem onde perguntar.)

2) DIAGNOSTICAR UM CLIENTE/POSTO — "este posto (CNAE x, UF, atividade) precisa de quê?". O analista quer cruzar CNAE × obrigações × órgãos × serviços e receber o pacote regulatório. Hoje ele não pergunta ao assistente; o assistente só faz keyword-match em 8 PDFs.

3) CONSULTAR PROCEDIMENTO — "quem executa laudo de estanqueidade? que documentos pede a LO? qual prazo dessa condicionante?". Aqui o assistente deveria responder com a base interna E com os dados reais do registro daquele cliente (não só o playbook genérico).

4) GERAR PEÇA — "redija a defesa deste auto", "monte a proposta para este diagnóstico", "gere o ofício de atendimento de condicionante". O analista quer que o assistente acione as ferramentas de geração (já existem para defesa) e devolva rascunho editável.

5) COBRAR/AGIR — "crie tarefa para o responsável X", "avise o cliente pelo WhatsApp que a LO vence em 20 dias", "marque esta condicionante como cumprida". O assistente deveria poder DISPARAR ações no sistema, não só responder.

6) REGISTRAR — toda interação relevante (diagnóstico, peça gerada, alerta enviado) deveria virar histórico rastreável no processo/empreendimento.

Em uma frase: o analista quer um assistente que (a) sabe TUDO que está no banco do tenant, (b) sabe a base regulatória/normativa, (c) conversa em linguagem natural com memória, e (d) executa ações via ferramentas. Hoje ele tem uma busca de PDF que não conversa, não sabe nada do cliente e não faz nada.

**Inteligência disponível nas fontes:** A fonte mais rica e ainda QUASE NÃO aproveitada é /home/guilherme/Projetos VS CODE/HABILIS_AI — um pipeline de 4 agentes de IA com prompts maduros e versionados:
- agentes/agente_01_coletor.txt: coleta base normativa estruturada (leis, decretos, resoluções, normas ABNT, órgãos, sistemas oficiais, instrumentos) com schema rígido e regra "só JSON, não inventar norma".
- agentes/agente_02_estruturador.txt: monta o ENQUADRAMENTO (quem_se_sujeita, quando_aplica/nao_aplica, criterios_de_entrada/exclusao, delimitacao_objeto, objeto_obrigacao) — exatamente a lógica CNAE×obrigação que foi simplificada na fusão.
- agentes/agente_04_auditor.txt: AUDITA o enquadramento e classifica nivel_risco (baixo/medio/alto) e status_validacao — um agente anti-alucinação que falta totalmente hoje.
- agentes/agente_03_operacional.txt: transforma enquadramento validado em fluxo_operacional, entregaveis, precificacao e — chave — "gatilhos_automacao" e "regras_interface" que o sistema deveria aplicar. Tem regra de BLOQUEIO: se auditoria=alto/reprovado, não operacionaliza.
- modelos/base_modelo_conhecimento.json: o schema-mestre que une base_oficial + enquadramento + operacao + documentacao + riscos + servico_habilis + inteligencia_interface (gatilhos_interface, regras_interface, campos_calculados, mensagens_criticas, alertas_contextuais, cards_explicativos). É muito mais rico que o KBItem atual de conhecimento.routes.ts (que só tem resposta_objetiva + checklist + listas planas).
- outputs reais (output_regularizacao_ambiental.json, output_regiao_iturama_indiapora.json, output_pgrss_senador_canedo.json) provam que o pipeline já rodou e produziu base normativa com fontes oficiais rastreáveis (URLs SEMAD/IBAMA, leis).

Em INTERFACE/enviro-clarity-main/src/lib há os motores que o assistente deveria chamar como ferramentas: decisionEngine.ts (93 KB), regulatory-commercial-framework.ts (48 KB — classifyEnterpriseContext, resolveRegulatoryFramework, resolveLicensingPath, resolveStudyEligibility), proposal-generator.ts (38 KB), diagnostic-engine.ts, posto-inteligencia.ts. A pasta HABILIS_AI/base_conhecimento está VAZIA — ou seja, a base estruturada gerada pelos agentes nunca foi materializada/ingerida no Posto.

**O furo:** O furo central é que existem DUAS inteligências paralelas que nunca se encontraram:

1) Inteligência conversacional COM contexto do cliente já existe — mas só no WhatsApp (agente-whatsapp.service.ts) e no digest. O canal web "Assistente Hábilis", que deveria ser o cérebro consolidador, é o mais pobre: keyword-search em 8 PDFs, "sem IA externa", sem contexto do banco, sem memória, sem ações.

2) Inteligência regulatória profunda (o pipeline de 4 agentes Coletor→Estruturador→Auditor→Operacional e os motores de enquadramento de enviro-clarity) existe na fonte — mas foi achatada para um JSON estático plano (KBItem com resposta_objetiva + listas), perdendo enquadramento por CNAE, auditoria anti-alucinação, gatilhos de automação e fontes normativas rastreáveis.

Concretamente: o assistente da web não sabe responder "este posto precisa de quê?" (não tem o enquadramento), não responde "qual o status da MINHA licença?" (não lê o banco — isso só o WhatsApp faz), não gera peça nem dispara ação (só a IA acoplada a Licença/Auto gera defesa), e não tem nenhum agente auditor validando o que diz. As 4 abas são 4 ilhas: o WhatsApp tem contexto mas não tem a base de conhecimento; a Base de Conhecimento tem o conteúdo mas não tem LLM nem contexto; a IA gera peças mas só dentro de telas específicas; e o Assistente é só uma vitrine de busca. Nada disso é um "cérebro que conversa com todas as seções".

**Posição no fluxo geral:** Este domínio é a camada transversal/topo do fluxo ponta a ponta do escritório. O fluxo geral é: Comercial/Lead → Onboarding/Diagnóstico → Contrato → Produção (licenças, condicionantes, SASC, resíduos, outorga, SST) → Monitoramento/Alertas → Fiscalização/Defesa → Entregáveis/Relatórios. O Assistente & IA não é uma etapa isolada: é o orquestrador que deveria atravessar TODAS essas etapas. Ele entra (a) no comercial — o agente WhatsApp já qualifica leads e alimenta o CRM; (b) no diagnóstico — deveria cruzar CNAE×obrigações para dizer o que o posto precisa (hoje não faz, está achatado); (c) na produção — a IA já lê licença e cria condicionantes automaticamente, e gera defesa de auto; (d) no monitoramento — o digest e o WhatsApp de compliance já avisam prazos. O ponto é que essas inserções são pontuais e desconectadas; a visão correta é o Assistente sendo o ÚNICO ponto de conversa que lê e escreve em cada uma dessas seções via ferramentas, fechando o ciclo do analista (perguntar → diagnosticar → gerar peça → cobrar prazo → registrar) sem ele precisar navegar aba por aba.

**Propostas:**

- **[ALTA/medio] Transformar o Assistente web em chat conversacional com tool-use (cérebro central)** — Criar endpoint POST /ia/assistente/chat na API que use Claude com tool-use. Reaproveitar 100% o padrão já provado em agente-whatsapp.service.ts (buscarContextoCliente + anthropic.messages.create). Definir ferramentas que leem o banco do tenant: consultarLicencas, consultarCondicionantes(prazos), consultarAutos, consultarScoreRisco, consultarTarefas, buscarConhecimento (a busca atual vira UMA tool). Trocar a tela assistente-form.tsx de 'submit busca' para um chat com histórico. O agente-whatsapp em modo compliance é literalmente o mesmo cérebro — unificar os dois para que web e WhatsApp compartilhem o mesmo serviço. _Por quê:_ É o pedido explícito: o Assistente deve ser a peça consolidadora que conversa com TODAS as seções. A capacidade já existe no WhatsApp; falta expô-la na web e dar-lhe ferramentas de leitura do banco. Hoje o canal mais importante é o mais burro. _(trazer de: apps/worker/src/services/agente-whatsapp.service.ts (padrão LLM+contexto a generalizar))_
- **[ALTA/medio] Dar ações ao assistente (tools de escrita): criar tarefa, enviar WhatsApp, gerar peça** — Adicionar ao tool-use ferramentas de escrita já existentes no sistema: criarTarefa, enviarWhatsApp (whatsapp.routes /enviar já enfileira), gerarDefesa (ia.routes /autos/:id/gerar-defesa), marcar condicionante. Com confirmação humana antes de executar (human-in-the-loop). _Por quê:_ O analista quer que o sistema faça POR ele (passos 4-5 do fluxo ideal): cobrar prazos, avisar cliente, redigir peça. Sem isso o assistente só fala, não trabalha. Todas as ações já têm rota/queue; falta o assistente saber acioná-las. _(trazer de: apps/api/src/modules/ia/ia.routes.ts (gerar-defesa) e whatsapp.routes.ts (/enviar))_
- **[ALTA/grande] Ingerir a base estruturada dos 4 agentes e religar o diagnóstico por CNAE×obrigação** — Materializar o schema modelos/base_modelo_conhecimento.json no Posto (substituir o KBItem plano por um modelo com enquadramento, riscos, gatilhos_interface e fontes normativas). Rodar/portar o pipeline Coletor→Estruturador→Auditor→Operacional para popular a base por tema. Expor uma tool diagnosticarEmpreendimento(cnae, uf, atividade) que o assistente chama — reaproveitando os motores resolveRegulatoryFramework/resolveLicensingPath de enviro-clarity. _Por quê:_ O 'furo' citado no briefing (diagnóstico do onboarding usa só tipo+UF) tem cura aqui: a inteligência de enquadramento existe nas fontes mas foi achatada. O assistente precisa dela para responder 'este posto precisa de quê?'. _(trazer de: HABILIS_AI/modelos/base_modelo_conhecimento.json + HABILIS_AI/agentes/* + INTERFACE/enviro-clarity-main/src/lib/regulatory-commercial-framework.ts)_
- **[MEDIA/medio] Adicionar agente Auditor anti-alucinação às respostas e peças geradas** — Antes de devolver uma resposta regulatória ou uma defesa/proposta gerada, passar por um segundo passe de validação inspirado em agente_04_auditor.txt: classificar nivel_risco e status_validacao, e marcar visualmente respostas 'parcialmente_validado'/'reprovado'. Bloquear automação quando risco=alto (regra de bloqueio do agente 03). _Por quê:_ O sistema gera defesas jurídicas e diagnósticos com LLM sem nenhuma verificação. A fonte já tem um agente desenhado exatamente para isso. Reduz risco de o analista assinar algo alucinado. _(trazer de: HABILIS_AI/agentes/agente_04_auditor.txt e agente_03_operacional.txt (regra de bloqueio))_
- **[MEDIA/rapido] Briefing diário no Assistente reusando o digest** — Expor na home do Assistente um 'o que é urgente hoje' por tenant: condicionantes vencendo, autos com prazo, licenças a renovar, postos com score crítico — reusando coletarDadosTenant/gerarNarrativaIA do digest.service.ts, que hoje só vira e-mail/HTML semanal. _Por quê:_ É o passo 1 do fluxo do analista (abrir o dia). Os dados já são computados pelo digest; falta apenas mostrá-los no canal onde o analista trabalha em vez de só por e-mail. _(trazer de: apps/worker/src/services/digest.service.ts (coletarDadosTenant, gerarNarrativaIA))_
- **[MEDIA/rapido] Citação de fonte e rastreabilidade nas respostas** — Toda resposta do assistente deve citar a fonte (playbook/módulo, condicionante do registro, ou norma da base). Aproveitar fontes_oficiais com URL já presentes nos outputs do pipeline (output_regularizacao_ambiental.json) para ancorar respostas normativas. _Por quê:_ Confiança e auditabilidade: o analista precisa saber DE ONDE veio a resposta antes de agir. A fonte já carrega URLs oficiais rastreáveis que hoje se perdem no JSON plano. _(trazer de: HABILIS_AI/output_regularizacao_ambiental.json (base_oficial.fontes_oficiais))_
- **[BAIXA/medio] Unificar memória de conversa entre web e WhatsApp** — Persistir o histórico de chat do assistente web no mesmo modelo de mensagens já usado pelo WhatsApp, indexado por usuário/empreendimento, para que uma conversa iniciada no WhatsApp continue na web e vice-versa, e o assistente tenha memória de longo prazo do caso. _Por quê:_ O passo 6 (registrar) e a continuidade entre canais. Hoje o WhatsApp grava MensagemWhatsApp/MensagemLead mas a web não grava nada — cada pergunta é stateless. _(trazer de: apps/api/src/modules/whatsapp/whatsapp.routes.ts (modelos MensagemWhatsApp/MensagemLead))_


## Camada de Decisão (visão do gestor/coordenador)
**Abas:** Dashboard, Painel Executivo, Métricas, Alertas, Calendário, Relatórios, Financeiro

**Estado atual:** As 7 abas existem e CALCULAM de verdade (não são mock); o problema é que são 7 telas paralelas que não se conectam e param de pensar onde o gestor mais precisa.

DASHBOARD (apps/web/src/app/(app)/dashboard/page.tsx): faz 6 chamadas em paralelo (resumo, vencimentos, documentos EM_ANALISE, condicionantes PENDENTE, tarefas PENDENTE, diagnostico/rede — linhas 90-97). Monta 5 KPIs (Conformidade Rede, Vencendo 30d, Alertas Críticos, Autos, Risco Crítico — l.245-286), uma "Fila de gestão"/Decisões pendentes (FilaGestao), Vencimentos com filtro 30/60/90, Radar por eixo e Ranking de conformidade. Tem modo demo hardcoded (l.154-239). É a melhor aba.

PAINEL EXECUTIVO (executivo/page.tsx): 2 chamadas (/cockpit/executivo + /cockpit/resumo). Tabela "Conformidade por Módulo" (8 módulos com score/conformes/total/vencendo), lista "Postos em Atenção/Críticos" e "Top Riscos Regulatórios" (vindos de ScoreRisco). É quase um superset do Dashboard, sobreposição grande.

MÉTRICAS (metricas/page.tsx + /metricas/operacional): única aba focada na EQUIPE — tempo médio de resolução, sem responsável, escalamentos/mês, taxa criadas×concluídas (12 semanas), carga por analista, tendência compliance 12 meses, pendências por módulo. Engine real em metricas.routes.ts l.22-122.

ALERTAS (alertas/page.tsx + alertas.routes.ts): lista por AlertaDestinatario com filtro lido/nível, "marcar todos lidos", deep-link por entidade (entidadeHref l.57-83). É uma caixa de entrada, não um centro de triagem priorizado.

CALENDÁRIO (calendario/page.tsx): reusa /cockpit/vencimentos?dias=365, agrupa por dia num grid mensal. Puramente de leitura; não dá para criar evento, atribuir nem reagendar.

RELATÓRIOS (relatorios/* + relatorios.service.ts): solicita geração assíncrona (BullMQ), lista e baixa. 7 tipos no enum TipoRelatorio (schema.prisma l.2705: COMPLIANCE_GERAL, VENCIMENTOS, SST, MONITORAMENTO_AMBIENTAL, LOGISTICA_REVERSA, AUTOS_INFRACAO, AUDIT_LOG). Sem agendamento recorrente nem envio automático.

FINANCEIRO (financeiro/page.tsx → /comercial/financeiro/resumo, financeiro.service.ts): MRR/ARR/contratos ativos + operação (OSs abertas/concluídas, entregáveis). É financeiro de RECEITA da consultoria, desconectado de custo/margem por contrato e do esforço da operação. Rodapé admite que detalhamento por contrato/NF-e é "próxima evolução" (l.117-120).

INFRA por trás (importante): o motor é real. ComplianceSnapshot é recalculado a cada 6h pelo worker (apps/worker/src/processors/compliance.processor.ts + worker.ts l.24 pattern '0 */6 * * *') usando índice PONDERADO (packages/utils/src/compliance.utils.ts:30-47, COMPLIANCE_PESOS). ScoreRisco recalcula diário ('0 0 * * *'). Há digest-semanal, vencimentos diário, prazos-defesa. Ou seja: os painéis ficam vazios só quando o worker/seed não rodou — não é falta de cálculo.

**Fluxo ideal do analista:** O coordenador/gestor abre o sistema 1x de manhã e precisa responder, em ordem, 5 perguntas — hoje cada uma exige pular entre 3-4 abas:

1. "O que pegou fogo enquanto eu dormi?" — uma fila ÚNICA de TRIAGEM ordenada por gravidade×prazo×impacto financeiro: prazos vencidos, autos com prazo de defesa correndo, condicionantes vencendo em 7d, documentos aguardando MINHA aprovação, bloqueios no fluxo. Cada item com 1 ação ("Aprovar", "Atribuir", "Reagendar", "Escalar") sem sair da tela.

2. "Quem está afundando / onde está o gargalo?" — visão de CARGA e SLA da equipe: quem tem tarefas atrasadas, qual analista está sobrecarregado, quais tarefas estão sem responsável, qual módulo acumula pendência. Decidir REDISTRIBUIR ali mesmo.

3. "Quais CLIENTES estão em risco?" — drill por empreendimento/cliente: ranking de conformidade, quem caiu de score na semana, quem tem renovação de LO/LAO entrando em janela crítica (90/60/30d), quem tem auto de infração ativo. Decidir priorizar atendimento.

4. "Estamos melhorando ou piorando?" — tendência: a conformidade da rede subiu ou caiu no mês? a equipe está fechando mais do que abre? quantos itens vão vencer nos próximos 30/60/90d (FORECAST de carga futura, não só histórico).

5. "A operação está saudável como NEGÓCIO?" — receita recorrente (MRR/ARR) vs. esforço gasto (horas/OSs/entregáveis) por cliente, para ver margem: qual contrato dá prejuízo de horas, qual cliente consome mais do que paga.

E semanalmente: gerar/enviar automaticamente um relatório executivo por cliente (o "Alinhamento Executivo" que o escritório já produz à mão no Z+Z), e fechar a semana com o digest. O sistema deveria FAZER por ele: priorizar a fila, sugerir redistribuição de carga, prever a carga futura, e montar o relatório do cliente sozinho.

**Inteligência disponível nas fontes:** 1) ENVIRO-CLARITY — Dashboard executivo rico (INTERFACE/enviro-clarity-main/src/pages/Dashboard.tsx): tem peças que o Posto perdeu:
- deriveConformidade() (l.223-242): SCORE DE CONFORMIDADE EXECUTIVO PONDERADO POR GRAVIDADE — bloqueio×25, prazo vencido×12, evidência pendente×8, doc pendente×6, obrigação de alto risco×5 → 4 faixas (Conforme/Atenção/Risco/Crítico) com descrição. O Posto só tem média aritmética do índice; perdeu a ponderação por tipo de pendência na leitura executiva.
- "Atenção Imediata" (attentionItems, l.621-692): fila ÚNICA priorizada misturando prazos vencidos + bloqueios + evidências + monitoramentos + docs ausentes, CADA UM com ação e rota ("Resolver", "Desbloquear", "Documentar"). É exatamente a triagem que falta.
- "Gargalos e Bloqueios" (l.1059-1084): lista de bloqueios ativos do fluxo — conceito de bloqueio que o decision-layer do Posto não exibe.
- Bloco "Conformidade Executiva" (l.1009-1052): decompõe o score em prazos vencidos, evidências, docs, monitoramentos, bloqueios — semáforo acionável.
- Overlay COMERCIAL no dashboard (VisaoComercialCnae, l.267-555): risco×obrigações críticas×serviços recomendados×investimento estimado×gestão mensal sugerida — liga decisão a receita.

2) lib/operational-dashboard.ts (computeOperationalDashboardSummary): conta sinais de risco discriminados (criticalDeadlineSignals, missingDocumentSignals, monitoringRiskSignals, blockedStages, diagnosticRiskSignals) e deriva processesAtRisk. Inteligência de "sinais" perdida.

3) Z+Z AMÉRICA — Painel de Gestão real de cliente (Z+Z - América/PROJ_Z+Z_AMERICAPOSTO_GUAPÓ/Painel de Gestão/Dashboard_LAO_Auto_Posto_America_v5.html, 7613 linhas): é o painel que o escritório ENTREGA ao cliente. Estruturado por "Momentos" do processo (Uso do Solo, Renovação LAO, Condicionantes, Compliance Paralelo), cada um com momento-kpis. Traz, com dados reais (l.6157+): cada obrigação/condicionante enriquecida com prioridade (critica/alta/media), custoEst (R$), leadDias, prereq[], baseLegal (ex.: "NR-7 · Portaria MTb 3.214/78"), status (ok/warn/pend/ausente), prazoSugerido, e VÍNCULOS cross-tab. Tem Health Score calculado sobre obrigatórios (l.5947) e separa "Health LAO" de "Health Compliance paralelo". E o mais importante para o gestor: matriz RACI — responsável Cliente vs Hábilis vs Terceiro (107 menções "cliente", 73 "hábilis", 53 "responsável"). NADA disso (base legal por item, custo/lead por obrigação, RACI, momentos do processo) existe no decision-layer do Posto.
Também há os documentos que esse painel gera: Alinhamento_Executivo_AutoPostoAmerica_v3 e Documento_Consolidado_Final — o "relatório executivo por cliente" que Relatórios deveria automatizar.

**O furo:** O motor calcula (índice ponderado, scores de risco, snapshots a cada 6h, digest semanal) — mas a CAMADA DE DECISÃO não sintetiza nem age. Diferenças concretas:

1. FRAGMENTAÇÃO: 7 abas paralelas que não conversam. Dashboard e Executivo são ~80% sobrepostos (ambos mostram conformidade/módulos/críticos). Para "decidir o dia" o gestor precisa abrir Dashboard + Métricas + Alertas + Calendário. Falta uma síntese única.

2. LEITURA EXECUTIVA RASA: o Posto reduz conformidade a média aritmética do índice (cockpit.routes.ts l.134-135). Perdeu o deriveConformidade ponderado por gravidade do enviro-clarity (bloqueio>prazo vencido>evidência>doc). 90% de média pode esconder 1 auto de infração com defesa vencendo.

3. SEM TRIAGEM ACIONÁVEL: a "Fila de gestão" do Dashboard lista doc/condicionante/tarefa, mas não é a fila priorizada única de "Atenção Imediata" do enviro-clarity com ação inline. Alertas é caixa de entrada cronológica, não centro de decisão.

4. SEM FORECAST: tudo é histórico/presente (vencimentos passados-futuros, tendência 12m de trás). Não há projeção de CARGA futura ("vão vencer 40 itens em jul, sua equipe fecha 25/mês → você vai estourar").

5. SEM RACI / RESPONSABILIDADE: o painel real do cliente (Z+Z) separa o que é do Cliente, da Hábilis e de Terceiro. O Posto não distingue — o gestor não vê "o que está parado esperando o CLIENTE" vs "o que minha equipe está devendo".

6. FINANCEIRO DESCONECTADO DA OPERAÇÃO: mostra MRR/ARR mas não cruza com horas/esforço por contrato → o gestor não enxerga margem nem cliente deficitário. Não há base legal/custo/lead por obrigação (que existe no Z+Z).

7. CALENDÁRIO E RELATÓRIOS PASSIVOS: calendário é só leitura (sem criar/atribuir/reagendar); relatórios não têm agendamento recorrente nem entrega automática do "Alinhamento Executivo por cliente" que o escritório já faz à mão.

8. RISCO DE "PAINEL VAZIO": como tudo depende do worker (snapshot 6/6h, scores diário), se o worker/seed não rodou os painéis ficam zerados sem explicar por quê — falta estado de "dados sendo calculados / última atualização há X".

**Posição no fluxo geral:** A Camada de Decisão é o TOPO e o FECHO do fluxo ponta a ponta do escritório. O fluxo geral: (1) Comercial/Onboarding capta e diagnostica o cliente (CNAE→obrigações→orçamento) → (2) Handoff cria empreendimento + processo → (3) Operação/analistas executam por módulo (licenças, SST, ANP, estanqueidade, outorga, condicionantes, fiscalizações), registram documentos/tarefas/evidências → (4) o WORKER agrega tudo em ComplianceSnapshot + ScoreRisco → (5) a CAMADA DE DECISÃO consome esses agregados para o gestor priorizar, redistribuir, cobrar e reportar.

Ou seja, é a camada que transforma o trabalho de TODOS os outros domínios em decisão de gestão. Ela puxa de: cockpit (resumo/executivo/diagnóstico), risco (ScoreRisco), métricas (tarefas/equipe), alertas (scheduler), comercial/financeiro (contratos/OS/entregáveis) e vencimentos de 7 módulos. E ela fecha o ciclo para fora do escritório via Relatórios (o entregável ao cliente) e Financeiro (a saúde do negócio). Hoje ela CONSOME bem mas não FECHA: não devolve priorização para a operação, não automatiza o relatório do cliente, não conecta esforço a receita.

**Propostas:**

- **[ALTA/grande] Fundir Dashboard + Executivo numa Home de Decisão única com triagem acionável** — Eliminar a sobreposição: uma só home com (a) faixa de conformidade executiva PONDERADA por gravidade, (b) fila única 'Atenção Imediata' priorizada (prazo vencido > auto com defesa correndo > condicionante 7d > doc aguardando aprovação > bloqueio), cada item com ação inline (Aprovar/Atribuir/Reagendar/Escalar). Mover a tabela 'por módulo' e 'top riscos' para uma aba 'Rede' acessível por drill, não como segunda home. _Por quê:_ Hoje o gestor abre 2 telas ~80% iguais e nenhuma diz 'faça isto agora'. A fonte enviro-clarity já tem o padrão pronto (attentionItems). _(trazer de: INTERFACE/enviro-clarity-main/src/pages/Dashboard.tsx (attentionItems l.621-692; bloco Conformidade Executiva l.1009-1052))_
- **[ALTA/rapido] Trazer de volta o score de conformidade executivo ponderado por gravidade** — Adicionar ao /cockpit/resumo (ou criar /cockpit/leitura-executiva) uma leitura tipo deriveConformidade: pontuar bloqueios×25, prazos vencidos×12, evidências pendentes×8, docs pendentes×6, alto risco×5 → faixa Conforme/Atenção/Risco/Crítico com descrição, ao lado da média do índice. _Por quê:_ Média aritmética esconde gravidade: 90% de conformidade com 1 auto vencendo não é 'bom'. A ponderação por tipo de pendência é a leitura que o gestor de fato usa. _(trazer de: INTERFACE/enviro-clarity-main/src/pages/Dashboard.tsx (deriveConformidade l.223-242); lib/operational-dashboard.ts (sinais discriminados))_
- **[ALTA/medio] Centro de Carga & SLA da equipe com redistribuição (evoluir Métricas)** — Promover Métricas de 'gráficos' para 'painel de gestão de equipe': carga por analista com alerta de sobrecarga, tarefas sem responsável e atrasadas com botão 'Atribuir', SLA por tipo de tarefa (tempo médio vs meta), e sugestão automática de para quem redistribuir. Já há base em metricas.routes.ts (cargaPorAnalista, semResponsavel, tempoMedioResolucao). _Por quê:_ É a única aba sobre a EQUIPE, mas só mostra; o gestor não consegue agir. Redistribuir carga é a decisão diária número 2. _(trazer de: (usa apps/api/src/modules/metricas/metricas.routes.ts já existente))_
- **[MEDIA/medio] Forecast de carga e de vencimentos (projeção, não só histórico)** — Adicionar painel de projeção: nº de itens que vencem nos próximos 30/60/90d por módulo/cliente vs. capacidade de fechamento da equipe (média de tarefas concluídas/semana já calculada em metricas). Sinalizar 'estouro previsto' quando entrada futura > vazão. _Por quê:_ Hoje tudo é retrovisor (tendência 12m de trás, vencimentos já existentes). O gestor decide alocação olhando o futuro, e o sistema tem os dados para prever. _(trazer de: (combina /cockpit/vencimentos com taxaResolucao de metricas.routes.ts))_
- **[MEDIA/grande] Matriz RACI: separar pendências por responsável (Cliente / Equipe / Terceiro)** — Marcar cada obrigação/pendência com responsável (cliente, Hábilis, terceiro) e exibir na decisão 'o que está parado esperando o cliente' vs 'o que minha equipe deve'. Adicionar campo de responsabilidade nos itens e um filtro/seção no painel. _Por quê:_ O painel real entregue ao cliente (Z+Z) já gira em torno disso (107 'cliente', 73 'hábilis', 53 'responsável'). Sem isso o gestor cobra a pessoa errada e não consegue justificar atraso ao cliente. _(trazer de: Z+Z - América/PROJ_Z+Z_AMERICAPOSTO_GUAPÓ/Painel de Gestão/Dashboard_LAO_Auto_Posto_America_v5.html (l.6157+ itens com responsavel/baseLegal/custoEst/leadDias))_
- **[MEDIA/grande] Relatório executivo por cliente automatizado (evoluir Relatórios)** — Adicionar tipo de relatório 'ALINHAMENTO_EXECUTIVO' por cliente que monta automaticamente o documento que o escritório hoje faz à mão (status por momento do processo, condicionantes, prazos, próximos passos), com agendamento recorrente (ex.: mensal) e envio automático. A infra de fila/geração já existe (relatorios.service.ts + relatorioQueue). _Por quê:_ O escritório já produz isso manualmente (Z+Z: Alinhamento_Executivo_AutoPostoAmerica_v3, Documento_Consolidado_Final). Automatizar fecha o ciclo de decisão para fora e é o entregável de maior valor percebido. _(trazer de: Z+Z - América/.../Painel de Gestão/Alinhamento_Executivo_AutoPostoAmerica_v3.docx e Documento_Consolidado_Final_AutoPostoAmerica_v2.docx (estrutura/seções))_
- **[MEDIA/medio] Financeiro conectado à operação: margem por contrato (esforço × receita)** — Cruzar MRR/contrato com horas/OSs/entregáveis consumidos por cliente para mostrar margem e sinalizar contrato deficitário. Hoje financeiro.service.ts já tem MRR por contrato e contagem de OS/entregáveis — falta juntar por cliente e estimar custo/horas. _Por quê:_ O gestor precisa saber qual cliente consome mais do que paga; receita isolada não permite decisão de negócio. O próprio rodapé da aba admite ser a 'próxima evolução'. _(trazer de: (usa apps/api/src/modules/comercial/financeiro.service.ts; horas vêm do orçamento detalhado do motor comercial enviro-clarity))_
- **[BAIXA/rapido] Estado de frescor dos dados + calendário acionável** — (a) Exibir 'última atualização há X' nos painéis e estado 'dados sendo calculados' quando snapshot/score estiver ausente, com botão 'recalcular agora' (rota POST /risco/calcular já existe). (b) Tornar o Calendário acionável: criar/atribuir/reagendar evento direto da célula. _Por quê:_ Como tudo depende do worker (snapshot 6/6h, scores diário), painel zerado hoje parece 'bug'. E calendário só de leitura obriga a sair para outra aba para agir. _(trazer de: (usa worker apps/worker/src/processors/compliance.processor.ts + rota /risco/calcular))_

