# ARQUITETURA HÁBILIS — Documento-Guia Mestre

> **Sistema Único Hábilis** — Plataforma SaaS B2B de Gestão Ambiental e Regulatória para Postos de Combustíveis
> **Audiência:** Guilherme de Paula (Diretor Técnico, idealizador)
> **Modelo de construção:** Greenfield com Salvage (do zero, reaproveitando peças validadas)
> **Versão:** 1.0 — 2026-04-27
> **Localização do código futuro:** `/home/guilherme/Projetos VS CODE/HABILIS/`

---

## ÍNDICE

1. [Visão Executiva](#1-visão-executiva)
2. [Glossário Canônico](#2-glossário-canônico)
3. [Mapa Funcional — Os Módulos do Sistema](#3-mapa-funcional)
4. [Arquitetura Técnica Explicada para Não-Dev](#4-arquitetura-técnica)
5. [Banco de Dados — O Coração do Sistema](#5-banco-de-dados)
6. [Motor de Decisão e Automações](#6-motor-de-decisão-e-automações)
7. [Stack Tecnológica](#7-stack-tecnológica)
8. [Salvage — O Que Reaproveitamos de Onde](#8-salvage)
9. [Checklist Mestre — O Que Temos vs O Que Falta](#9-checklist-mestre)
10. [Fases de Construção](#10-fases-de-construção)
11. [Critérios de Pronto](#11-critérios-de-pronto)
12. [Riscos e Decisões em Aberto](#12-riscos-e-decisões-em-aberto)

---

## 1. Visão Executiva

### O que é o sistema

O **Hábilis** é a plataforma proprietária da consultoria Hábilis Intelligence — um sistema único de gestão regulatória ambiental, projetado para conduzir tecnicamente toda a vida regulatória de uma rede de postos de combustíveis. Não é um ERP genérico, não é um CRM tradicional, não é um sistema de tarefas. É um **motor de inteligência regulatória aplicada**, que transforma normas, prazos, condicionantes, fiscalizações e rotinas operacionais em **decisões executáveis**, **alertas com antecedência**, **defesas técnicas geradas com IA** e **dossiês completos** de cada empreendimento.

O sistema opera em três planos simultâneos. No plano **comercial**, captura leads (via WhatsApp), qualifica oportunidades, gera triagem e orçamento, e converte em contrato. No plano **técnico-regulatório**, faz o diagnóstico inicial do empreendimento (CNAE → obrigações → documentos → órgãos), monta a matriz de obrigações específica, agenda prazos no calendário, e dispara alertas antes de qualquer vencimento. No plano **operacional**, gerencia atuações de campo, eventos regulatórios, atendimentos a fiscalizações, monitoramentos ambientais, controle de SST, logística reversa, estanqueidade e outorga hídrica — tudo conectado a um único banco de dados, com auditoria completa do que foi feito, por quem, quando e por quê.

A diferença em relação a qualquer concorrente está no **motor de decisão proprietário** da Hábilis: enquanto outras ferramentas guardam documentos, o sistema **interpreta o contexto regulatório do empreendimento e decide o que precisa ser feito**, em qual ordem, com quais documentos, por qual órgão, em qual prazo, e quanto cobrar pelo serviço. O motor é alimentado pelas bases de conhecimento construídas ao longo dos anos (CNAE → obrigações, normas ABNT, Recicla Goiás, base SASC de estanqueidade) e por quatro agentes de IA especializados (Coletor, Estruturador, Operacional, Auditor) que mantêm a base normativa atualizada e produzem entregáveis técnicos sob demanda.

### Para quem

| Audiência | Como usa |
|---|---|
| **Hábilis (uso interno)** | Diretor Técnico, Coordenadores, Analistas, Analistas de Campo, Executivos comerciais — operam o sistema completo |
| **Cliente da Hábilis (rede de postos)** | Representante do posto acessa o **Portal Externo** via magic link, vê o que está vencendo, baixa documentos, responde checklists, conversa com o analista |
| **Super Admin (Hábilis-mãe)** | Gerencia múltiplos tenants (cada cliente é um tenant), cobrança, planos, ativação |

### Promessa de valor (o que muda quando o sistema existir)

1. **Zero perda de prazo** — alertas automáticos em D-90, D-30, D-7 para todo vencimento (licenças, ASOs, testes de estanqueidade, calibrações, outorgas, condicionantes, MTRs)
2. **Diagnóstico em minutos, não em semanas** — entrar com CNAE + endereço + porte → sair com lista completa de obrigações federais, estaduais e municipais aplicáveis
3. **Defesas técnicas geradas com IA** — auto de infração entra → rascunho de defesa sai em segundos, com base normativa rastreável
4. **Cliente vê o próprio status** — Portal Externo elimina 80% das ligações "como está minha condicionante?"
5. **Histórico completo e auditável** — toda ação registrada (quem fez, quando, por quê), pronta para auditoria interna e processo judicial
6. **Precificação baseada em motor**, não em "achismo" — orçamento sai do mesmo banco de regras que define o serviço

### O que NÃO é (escopo negativo)

- **NÃO é ERP financeiro** — não substitui contabilidade, folha de pagamento, contas a pagar/receber
- **NÃO é DMS jurídico** — não gerencia contratos genéricos, processos cíveis, trabalhistas
- **NÃO é GED genérico** — armazena documentos do escopo regulatório, não é arquivo morto da empresa
- **NÃO é sistema de campo (mobile-first)** — interface desktop-first; mobile no Portal e em telas críticas, não app nativo
- **NÃO substitui o consultor humano** — automatiza o "como" e o "quando"; o "porquê regulatório" continua sendo decisão técnica

---

## 2. Glossário Canônico

> **Regra de ouro:** uma palavra, um significado. Os termos da coluna "NÃO usar" são banidos do código, da UI e da documentação técnica.

| Termo Canônico | Definição | Onde aparece | NÃO usar (sinônimos descartados) |
|---|---|---|---|
| **Tenant** | Cliente da Hábilis. Pode ser uma rede de postos ou um posto único. Isolamento total de dados | Banco, login, billing | Workspace, Organização, Conta |
| **Empresa** | Pessoa jurídica vinculada a um tenant (CNPJ matriz). Um tenant pode ter várias empresas | Cadastro, dossiê | Razão Social, Holding |
| **Empreendimento** | Unidade operacional concreta (um posto de combustível físico, com endereço e atividades) | Coração do sistema | Posto, Unidade, Filial, Loja, Store |
| **Atividade** | O que o empreendimento faz (CNAE + descrição livre) | Diagnóstico, motor | Negócio, Operação |
| **CNAE** | Classificação Nacional de Atividades Econômicas — chave de entrada do motor regulatório | Diagnóstico | (não usar sinônimos) |
| **Órgão Regulador** | Entidade que emite/fiscaliza (IBAMA, SEMAD, CETESB, INMETRO, ANP, Bombeiros, Vigilância Sanitária...) | Cadastro, processos | Agência, Repartição |
| **Esfera** | Federal / Estadual / Municipal | Filtros, base regulatória | Nível, Camada |
| **Processo** | Pedido formal junto a um órgão (ex: pedido de Licença de Operação) | Acompanhamento | Pleito, Solicitação, Petição |
| **Tipo de Processo** | Categoria do processo (LP, LI, LO, LAS, AVCB, etc.) | Catálogo | Modalidade |
| **Documento** | Arquivo regulatório com data de validade, status e versões (laudo, ART, certificado, licença) | Acervo regulatório | Anexo, Arquivo, PDF |
| **Versão de Documento** | Cada upload concreto de um documento (mantém histórico) | Versionamento | Revisão |
| **Obrigação** | Item regulatório aplicável ao empreendimento (genérico, vem do motor de decisão) | Diagnóstico, matriz | Exigência, Requisito legal |
| **Condicionante** | Obrigação **com prazo específico** vinculada a uma licença concreta | Acompanhamento de licenças | Sub-obrigação, Cláusula |
| **Ciclo de Condicionante** | Cada vencimento concreto de uma condicionante periódica (ex: o ciclo de 2026 do monitoramento trimestral) | Calendário | Período, Recorrência |
| **Tarefa** | Trabalho concreto a ser feito por uma pessoa, com prazo e evidências | Operação diária | To-do, Atividade |
| **Evidência** | Prova de que algo foi feito (documento, foto, texto, link) | Auditoria | Comprovante, Anexo |
| **Atuação** | Registro técnico de uma intervenção da Hábilis no empreendimento (visita, redação de defesa, parecer, reunião) | Condução técnica | Atendimento (ambíguo), Serviço |
| **Evento Regulatório** | Fato externo que afeta o empreendimento (publicação no DO, fiscalização, mudança de norma, autuação) | Timeline | Ocorrência, Acontecimento |
| **Alerta** | Notificação **crítica** automática sobre vencimento, não-conformidade, escalonamento | Painel de alertas | Notificação (genérica), Aviso |
| **Notificação** | Mensagem informativa não-crítica (mensagem do portal, info de sistema) | UI geral | Aviso |
| **Diagnóstico** | Resultado do motor: lista de obrigações, documentos, serviços e preço estimado para um empreendimento | Comercial e técnico | Avaliação, Análise inicial |
| **Triagem** | Etapa comercial pré-diagnóstico — qualifica o lead | CRM | Pré-cadastro |
| **Orçamento** | Proposta comercial com escopo, preço e prazo, gerada pelo motor de orçamento | Comercial | Proposta, Cotação |
| **Score de Risco** | Indicador 0-100 do risco regulatório consolidado de um empreendimento | Painel executivo | Nota, Rating |
| **Compliance Snapshot** | Foto periódica do estado de conformidade (gerada por worker) | Histórico, dashboards | Status (genérico) |
| **Score de Compliance** | Percentual (0-100%) atual de conformidade do empreendimento | UI | Índice, Saúde |
| **Audit Log** | Registro imutável de toda mutação relevante (quem fez, quando, o quê) | Auditoria | Histórico, Trilha |
| **Monitoramento Ambiental** | Conjunto de campanhas, poços e parâmetros para acompanhar solo/água | Módulo ambiental | Análise (ambíguo) |
| **Campanha de Monitoramento** | Período concreto (trimestre, semestre) com coletas e laudos | Operação ambiental | Ciclo |
| **Parâmetro Contaminante** | Substância medida (BTEX, PAH, metais...) com VMP | Laudos | Analyte |
| **VMP** | Valor Máximo Permitido (limite legal por parâmetro) | Análise de laudos | Limite, Tolerância |
| **Tanque** | Tanque de armazenamento de combustível (com testes de estanqueidade periódicos) | Estanqueidade/SASC | Reservatório (no contexto do posto) |
| **Bomba de Abastecimento** | Bomba do posto (com calibração ANP/INMETRO periódica) | Equipamentos | Bico (jargão), Dispenser |
| **Teste de Estanqueidade** | Teste obrigatório periódico de tanques e linhas | SASC | Vazamento (não é sinônimo) |
| **Funcionário** | Trabalhador do empreendimento (com ASO, EPIs, treinamentos) | SST | Colaborador, Empregado |
| **ASO** | Atestado de Saúde Ocupacional — vinculado ao funcionário, vence | SST | Exame médico (genérico) |
| **EPI** | Equipamento de Proteção Individual — controle de entrega | SST | Proteção (genérica) |
| **PGR / PCMSO / LTCAT** | Programas de Saúde e Segurança | SST | (siglas mantidas) |
| **MTR** | Manifesto de Transporte de Resíduos | Logística reversa | Manifesto (genérico) |
| **CCR** | Comprovante de Coleta e Recebimento | Logística reversa | (sigla mantida) |
| **PGRS** | Plano de Gerenciamento de Resíduos Sólidos | Logística reversa | (sigla mantida) |
| **Outorga Hídrica** | Autorização para captação/lançamento de água | Módulo hídrico | Licença de água (incorreto) |
| **Poço Artesiano** | Poço de captação outorgado | Outorga | (manter literal) |
| **Poço de Monitoramento** | Poço para coleta de amostras de água subterrânea | Monitoramento | (manter literal) |
| **Auto de Infração** | Documento lavrado por órgão fiscalizador imputando irregularidade | Fiscalizações | Multa (consequência, não o auto) |
| **Recurso Administrativo** | Defesa formal contra um auto de infração | Fiscalizações | Apelação (jargão jurídico) |
| **Defesa Técnica** | Peça técnica (não jurídica) que embasa o recurso | Fiscalizações | Parecer (genérico) |
| **Lead** | Contato não-cliente (origem WhatsApp ou cadastro manual) | CRM | Prospect (anglicismo) |
| **Estágio do Lead** | NOVO → CONTATADO → PROPOSTA_ENVIADA → NEGOCIACAO → GANHO/PERDIDO | CRM Kanban | Etapa (genérico) |
| **Follow-up** | Ação registrada sobre um lead (ligação, e-mail, reunião, nota) | CRM | Contato (ambíguo) |
| **Token Portal** | Magic link de acesso do representante externo | Portal | Convite (genérico) |
| **Regra Automática** | Configuração por tenant que liga um tipo de evento a perfis e canais de alerta | Configuração | Regra (genérica), Trigger |
| **Procuração** | Documento legal que autoriza a Hábilis a representar o cliente | Documentação cliente | Mandato (jargão) |

---

## 3. Mapa Funcional

> **Como ler:** cada módulo tem entrada (input), saída (output) e conexões. Em conjunto, formam o sistema vivo. Os módulos marcados com ✅ já existem hoje no Posto/sistema; os marcados com 🟡 existem parcialmente; os com ❌ ainda não foram construídos.

### 3.1 Módulo Comercial / CRM ✅

- **Para quê serve:** capturar leads, qualificar, mover pelo funil, fechar venda
- **Quem usa:** Executivo Comercial, Coordenador, Diretor Técnico
- **Input:** mensagens WhatsApp recebidas, cadastros manuais, indicações
- **Output:** lead qualificado → empreendimento cadastrado + orçamento aprovado
- **Conversa com:** WhatsApp (entrada), Triagem (próxima etapa), Onboarding (saída quando ganha)
- **Telas:** funil Kanban, detalhe do lead, métricas de conversão

### 3.2 Módulo Triagem (Pré-Diagnóstico) 🟡

- **Para quê serve:** capturar dados mínimos do potencial cliente para gerar primeira estimativa
- **Quem usa:** Executivo Comercial
- **Input:** CNAE, endereço, porte aproximado, atividades declaradas
- **Output:** estimativa preliminar de obrigações + faixa de preço
- **Conversa com:** Diagnóstico (versão completa), Orçamento, CRM
- **Telas:** wizard de triagem rápida, resumo comercial
- **Salvage:** [TriagemComercialPage.tsx](INTERFACE/enviro-clarity-main/src/pages/TriagemComercialPage.tsx)

### 3.3 Módulo Diagnóstico Regulatório ✅ (motor) 🟡 (UI no Posto)

- **Para quê serve:** rodar o motor de decisão e produzir o quadro completo de obrigações de um empreendimento
- **Quem usa:** Analista, Coordenador, Diretor Técnico
- **Input:** CNAE, atividade real, UF, município, porte, situação (operação/implantação/ampliação)
- **Output:** lista de obrigações (federal/estadual/municipal/porte), documentos exigidos, serviços técnicos sugeridos, preço total
- **Conversa com:** Empreendimentos, Calendário, Obrigações, Documentos
- **Telas:** novo diagnóstico, dossiê do empreendimento, matriz regulatória
- **Salvage crítico:** [decisionEngine.ts](INTERFACE/enviro-clarity-main/src/lib/decisionEngine.ts), [decision-rules/](INTERFACE/enviro-clarity-main/src/lib/decision-rules/), [cnae-engine.ts](INTERFACE/enviro-clarity-main/src/lib/cnae-engine.ts), [diagnostic-engine.ts](INTERFACE/enviro-clarity-main/src/lib/diagnostic-engine.ts), [regulatory-engine.ts](INTERFACE/enviro-clarity-main/src/lib/regulatory-engine.ts)

### 3.4 Módulo Empreendimentos ✅

- **Para quê serve:** cadastro mestre dos postos do cliente, com toda a vida regulatória deles
- **Quem usa:** Todos os perfis internos (controle de acesso por empreendimento)
- **Input:** dados cadastrais, responsável técnico, atividades, geolocalização
- **Output:** dossiê completo (processos, documentos, condicionantes, tarefas, alertas, score)
- **Conversa com:** TODOS os outros módulos operacionais
- **Telas:** lista, dossiê, onboarding wizard
- **Salvage:** [EmpreendimentosList.tsx](INTERFACE/enviro-clarity-main/src/pages/EmpreendimentosList.tsx), [EmpreendimentoDossier.tsx](INTERFACE/enviro-clarity-main/src/pages/EmpreendimentoDossier.tsx)

### 3.5 Módulo Condução Técnica / Atuações ✅ (Posto) + 🟡 (consolidação Intelligence)

- **Para quê serve:** registrar trabalho técnico feito no empreendimento (visitas, pareceres, reuniões, redações)
- **Quem usa:** Analistas, Analistas de Campo, Coordenador
- **Input:** tipo de atuação, descrição, evidências, data
- **Output:** linha do tempo de atuações, base para faturamento e auditoria
- **Conversa com:** Empreendimentos, Tarefas, Eventos Regulatórios
- **Telas:** lista de atuações, registro de atuação, timeline

### 3.6 Módulo Calendário e Prazos ✅

- **Para quê serve:** visão única e cruzada de tudo que vence (licenças, condicionantes, ASOs, calibrações, MTRs, tarefas)
- **Quem usa:** Todos
- **Input:** datas de validade dos modelos abaixo
- **Output:** visão mensal/agenda, alertas D-90/D-30/D-7
- **Conversa com:** Worker `vencimentos.scheduler.ts`, Alertas
- **Telas:** calendário mensal, agenda lista, drill-down por categoria

### 3.7 Módulo Obrigações ✅

- **Para quê serve:** matriz de obrigações regulatórias aplicáveis (gerada pelo motor) com status de atendimento
- **Quem usa:** Analistas, Diretor Técnico
- **Input:** diagnóstico do empreendimento + documentos enviados
- **Output:** matriz obrigação x status (atendida/em andamento/pendente/vencida)
- **Conversa com:** Diagnóstico, Documentos, Tarefas
- **Telas:** matriz por empreendimento, lista global

### 3.8 Módulo Monitoramento Ambiental ✅

- **Para quê serve:** acompanhar campanhas trimestrais/semestrais de coleta de solo e água
- **Quem usa:** Analistas, Analistas de Campo
- **Input:** poços, campanhas, laudos, parâmetros, VMPs
- **Output:** análise comparativa VMP x medido, tendências, alertas de anomalia
- **Conversa com:** Documentos (laudos), Alertas (anomalias), Score de Risco
- **Telas:** lista de campanhas, detalhe de campanha, gráfico VMP

### 3.9 Módulo Documentos ✅

- **Para quê serve:** acervo regulatório com versionamento, validade, upload S3
- **Quem usa:** Todos
- **Input:** arquivos PDF/DOC/XLS, metadados, validade
- **Output:** documento ativo com histórico de versões, alertas de vencimento
- **Conversa com:** S3 (storage), Worker `vencimentos.scheduler.ts`, Auditoria
- **Telas:** acervo, detalhe do documento, versões

### 3.10 Módulo SST (Saúde e Segurança do Trabalho) ✅

- **Para quê serve:** controlar funcionários, ASOs, treinamentos, EPIs, programas (PGR, PCMSO, LTCAT)
- **Quem usa:** Analista responsável SST
- **Input:** cadastro de funcionários, datas de exames, treinamentos realizados
- **Output:** matriz SST por empreendimento, alertas de vencimento
- **Conversa com:** Documentos (PGR, PCMSO), Alertas, Calendário
- **Telas:** lista funcionários, matriz SST por empreendimento

### 3.11 Módulo Logística Reversa ✅

- **Para quê serve:** OLUC, embalagens, pneus, MTR, CCR, metas anuais (Recicla Goiás)
- **Quem usa:** Analista responsável logística reversa
- **Input:** MTRs emitidos, CCRs recebidos, metas por categoria
- **Output:** painel meta x realizado, MTRs em aberto, alertas
- **Conversa com:** Transportadoras, PGRS, Documentos
- **Telas:** painel logística reversa, lista MTRs, lista PGRS
- **Salvage de conhecimento:** [recicla_goias_nodes.json](Logística Reversa/recicla_goias_nodes.json)

### 3.12 Módulo Estanqueidade (SASC) ✅

- **Para quê serve:** controle de tanques, testes de estanqueidade, prazos legais
- **Quem usa:** Analista responsável ANP/Estanqueidade
- **Input:** tanques cadastrados, testes realizados, datas próximas
- **Output:** painel de tanques, alertas D-X de próximo teste
- **Conversa com:** Documentos (laudos SASC), Alertas, Calendário
- **Telas:** lista tanques, detalhe, histórico de testes
- **Salvage de conhecimento:** [base_conhecimento_estanqueidade.json](Estanqueidade/base_conhecimento_estanqueidade.json), [HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL/](Estanqueidade/HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL/)

### 3.13 Módulo Fiscalizações e Defesa Técnica ✅ (parcial UI 🟡)

- **Para quê serve:** lavraturas, autos de infração, recursos administrativos, defesas técnicas (com IA)
- **Quem usa:** Diretor Técnico, Coordenador
- **Input:** auto de infração lavrado, documentos
- **Output:** rascunho de defesa técnica gerado por IA, recurso protocolado, status acompanhado
- **Conversa com:** Worker IA (Claude), Documentos, Alertas (prazo de defesa)
- **Telas:** lista autos, detalhe do auto com sub-fluxos de recurso e defesa

### 3.14 Módulo ANP/INMETRO ✅

- **Para quê serve:** equipamentos do posto (bombas, dispensers) com calibrações periódicas
- **Quem usa:** Analista responsável ANP
- **Input:** bombas cadastradas, datas de calibração
- **Output:** painel ANP, alertas de calibração próxima
- **Conversa com:** Calendário, Documentos (certificados de calibração)
- **Telas:** lista equipamentos, histórico

### 3.15 Módulo Outorga Hídrica ✅

- **Para quê serve:** poços artesianos, outorgas, laudos de água
- **Quem usa:** Analista responsável outorga
- **Input:** poço cadastrado, outorga concedida, laudos periódicos
- **Output:** painel outorga, alertas de renovação
- **Conversa com:** Calendário, Documentos
- **Telas:** lista poços, detalhe

### 3.16 Módulo Regulatório Urbano ✅

- **Para quê serve:** AVCB, Habite-se, Alvará de Funcionamento, PPCI, Licença Sanitária
- **Quem usa:** Analista responsável urbano
- **Input:** alvarás cadastrados
- **Output:** painel urbano, alertas de vencimento
- **Conversa com:** Calendário, Documentos

### 3.17 Módulo Licenças Ambientais ✅

- **Para quê serve:** LP, LI, LO, LAS, LAO, etc — vida do licenciamento
- **Quem usa:** Diretor Técnico, Analistas
- **Input:** licença cadastrada, condições atreladas
- **Output:** condicionantes geradas automaticamente, ciclos, alertas
- **Conversa com:** Condicionantes, Calendário, Processos

### 3.18 Módulo Tarefas ✅

- **Para quê serve:** trabalho concreto a fazer, com responsável, prazo e evidências
- **Quem usa:** Todos
- **Input:** geração automática (regras) ou manual; responsável; prazo
- **Output:** tarefa concluída com evidência, ou escalonada se atrasada
- **Conversa com:** TODOS os módulos operacionais; Worker `motor-operacional.scheduler.ts`
- **Telas:** kanban, lista, detalhe da tarefa

### 3.19 Módulo Alertas ✅

- **Para quê serve:** central de notificações críticas (vencimentos, anomalias, escalonamentos)
- **Quem usa:** Todos
- **Input:** workers schedulers + eventos do sistema
- **Output:** alerta na UI + e-mail + WhatsApp (conforme RegraAutomatica)
- **Conversa com:** Worker (compliance, vencimentos, fiscalizações), E-mail (Resend), WhatsApp (Z-API)
- **Telas:** central de alertas, configuração de regras

### 3.20 Módulo Checklists Operacionais ✅

- **Para quê serve:** templates reutilizáveis de checklist (auditoria interna, vistoria, conformidade)
- **Quem usa:** Analistas de Campo, Representante do Posto (via Portal)
- **Input:** template + execução respondida
- **Output:** execução com respostas e evidências, score de conformidade
- **Conversa com:** Documentos (templates), Tarefas, Score de Risco

### 3.21 Módulo Legislação / DO ✅

- **Para quê serve:** acompanhamento de publicações no Diário Oficial relevantes para os clientes
- **Quem usa:** Coordenador, Diretor Técnico
- **Input:** publicações capturadas, análise (futuro: IA)
- **Output:** publicações taggeadas por empreendimento impactado
- **Conversa com:** Worker IA (futuro: análise automática), Tarefas

### 3.22 Módulo Score de Risco ✅

- **Para quê serve:** indicador 0-100 do risco regulatório consolidado por empreendimento
- **Quem usa:** Diretor Técnico, Executivos
- **Input:** todas as métricas (vencimentos, autos, anomalias, conformidade)
- **Output:** painel de risco da rede + ranking de empreendimentos
- **Conversa com:** Worker `compliance.scheduler.ts`

### 3.23 Módulo Painel Executivo ✅

- **Para quê serve:** visão consolidada KPI da rede (compliance, prazos, financeiro, risco)
- **Quem usa:** Executivos, Diretor Técnico
- **Input:** Compliance Snapshots periódicos, Score de Risco, dados financeiros
- **Output:** dashboard executivo
- **Conversa com:** Todos os módulos (leitura)

### 3.24 Módulo Auditoria (Audit Trail) ✅

- **Para quê serve:** trilha imutável de toda mutação relevante (compliance, segurança, processo)
- **Quem usa:** Diretor Técnico, externos (auditoria externa)
- **Input:** todas as mutações relevantes do sistema
- **Output:** log auditável (quem, quando, o quê, antes/depois)
- **Conversa com:** TODOS os módulos

### 3.25 Módulo Relatórios e Exportações ✅

- **Para quê serve:** geração assíncrona de relatórios PDF/Excel para clientes e uso interno
- **Quem usa:** Coordenadores, Executivos
- **Input:** parâmetros (empreendimento, período, tipo)
- **Output:** PDF/Excel no S3, com link temporário
- **Conversa com:** Worker `relatorio.processor.ts`, S3, E-mail
- **Tipos atuais:** Compliance Geral, Vencimentos, SST, Monitoramento, Logística Reversa, Autuações

### 3.26 Módulo Portal Externo ✅

- **Para quê serve:** acesso do representante do posto (cliente final) ao próprio empreendimento
- **Quem usa:** Representante do Posto
- **Input:** magic link enviado por e-mail; acesso por TokenPortal
- **Output:** vê alertas, condicionantes, tarefas, checklists, documentos; envia mensagens
- **Páginas:** `/portal/inicio`, `/portal/alertas`, `/portal/condicionantes`, `/portal/tarefas`, `/portal/checklists`, `/portal/documentos`, `/portal/mensagens`

### 3.27 Módulo WhatsApp ✅

- **Para quê serve:** dual-mode — leads comerciais e atendimento de compliance
- **Quem usa:** Executivo Comercial (leads); Analista (atendimento cliente)
- **Input:** webhook Z-API (mensagens recebidas); envio manual
- **Output:** lead gerado ou tarefa criada, conversa registrada
- **Conversa com:** CRM (leads), Tarefas, Worker `whatsapp.processor.ts`, Claude (extração de intenção)

### 3.28 Módulo Onboarding Automatizado ✅

- **Para quê serve:** wizard de cadastro de novo cliente (tenant) e seus empreendimentos
- **Quem usa:** Diretor Técnico (admin), Coordenador
- **Input:** dados da empresa, lista de empreendimentos (manual ou CSV), usuários, módulos habilitados
- **Output:** tenant ativado, empreendimentos cadastrados, primeiros usuários convidados

### 3.29 Módulo Administração e Bases ✅ (parcial)

- **Para quê serve:** gestão das bases que alimentam o motor — CNAE, órgãos, tipos de processo, tipos de documento, regras automáticas
- **Quem usa:** Super Admin, Diretor Técnico
- **Input:** edições manuais, importação JSON, alimentação dos agentes IA
- **Output:** motor sempre atualizado
- **Conversa com:** Motor de Decisão, Pipeline IA

### 3.30 Módulo Motor de IA (Agentes Hábilis) 🟡 — base existe, agentes precisam orquestração

- **Para quê serve:** quatro agentes especializados que mantêm a base normativa atualizada e geram entregáveis técnicos
- **Quem usa:** Diretor Técnico, Coordenadores (autorizam execução)
- **Input:** tema regulatório + escopo territorial + base normativa
- **Output:** base normativa atualizada → enquadramento → auditoria → operacionalização (serviço + preço)
- **Agentes:**
  - **01 — Coletor Normativo Oficial:** levanta leis, decretos, resoluções, ABNT, órgãos, sistemas
  - **02 — Estruturador de Enquadramento:** transforma base normativa em quem se sujeita / quando aplica / critérios
  - **04 — Auditor Regulatório:** valida o enquadramento (não corrige, só aponta)
  - **03 — Operacional e de Serviços:** após auditoria validada, gera fluxo executável + serviço Hábilis + preço
- **Salvage:** [HABILIS_AI/agentes/](HABILIS_AI/agentes/) (4 prompts prontos)

---

## 4. Arquitetura Técnica

> **Convenção:** quando aparecer um termo técnico pela primeira vez, vem com analogia. Se já apareceu antes, você pode voltar aqui.

### 4.1 As Quatro Camadas

Pense no sistema como um restaurante:

```
┌──────────────────────────────────────────────────────────────┐
│   FRONTEND (Web Next.js)         → A vitrine, o cardápio,    │
│                                    o garçom anotando o pedido│
└─────────────────────┬────────────────────────────────────────┘
                      │ HTTP (REST)
┌─────────────────────▼────────────────────────────────────────┐
│   BACKEND / API (Fastify)        → A cozinha — recebe pedido,│
│                                    valida, prepara a resposta│
└─────────────────────┬────────────────────────────────────────┘
                      │ SQL (Prisma)
┌─────────────────────▼────────────────────────────────────────┐
│   BANCO DE DADOS (PostgreSQL)    → O armazém — guarda tudo,  │
│                                    nunca esquece, nunca mente│
└──────────────────────────────────────────────────────────────┘
                      ▲
                      │
┌─────────────────────┴────────────────────────────────────────┐
│   WORKERS (BullMQ + Redis)       → O estagiário diligente —  │
│                                    faz tarefas chatas em     │
│                                    background, na hora certa │
└──────────────────────────────────────────────────────────────┘
```

| Camada | O que é | Analogia | No nosso sistema |
|---|---|---|---|
| **Frontend** | Tudo que aparece na tela | Vitrine + atendente | Páginas web (`/empreendimentos`, `/calendario`...) |
| **Backend / API** | Servidor que recebe pedidos do frontend e responde com dados | Cozinha | `/api/empreendimentos`, `/api/diagnostico`... |
| **Banco de Dados** | Onde tudo é gravado em tabelas | Armazém | PostgreSQL com 70+ tabelas |
| **Workers** | Programas que rodam tarefas em background (sem o usuário esperar) | Estagiário | Mandar e-mails, gerar PDFs, calcular alertas |

**Regra de ouro: nada existe se não estiver no banco.** O frontend é descartável (pode trocar de visual amanhã); o banco é a memória institucional permanente.

### 4.2 Fluxo de uma ação típica

Suponha que você clique em **"Cadastrar novo empreendimento"**:

```
1. Você preenche o formulário e clica "Salvar"
   (FRONTEND captura os dados)
                │
2. Frontend faz POST /api/empreendimentos com os dados
   (mensagem HTTP para a API)
                │
3. API valida: campos obrigatórios? CNPJ válido?
   tenantId pertence ao seu usuário? você tem permissão?
                │
4. API chama Prisma → INSERT na tabela "empreendimentos"
                │
5. Banco grava e devolve o ID gerado
                │
6. API responde 201 Created com o objeto novo
                │
7. Frontend recebe, atualiza a lista, mostra "Salvo!"
                │
8. (Em paralelo) API enfileira um job no Worker:
   "rodar diagnóstico inicial deste empreendimento"
                │
9. Worker lê do Redis, executa o motor de decisão,
   grava obrigações no banco, cria tarefas
                │
10. Frontend, ao recarregar, mostra obrigações geradas
```

Esse padrão — **clique → API → banco → resposta → trabalho assíncrono** — vale para 95% das ações do sistema.

### 4.3 Multi-Tenant: por que importa

Cada **cliente** da Hábilis (uma rede de postos, ou um posto único) é um **tenant** isolado. **Mesmo banco**, mas **dados separados** por uma chave (`tenantId`) em todas as tabelas. Significa:

- Posto Alvorada (cliente A) **nunca vê** dados do Posto Centro (cliente B), mesmo ambos estando no banco
- A Hábilis (super admin) vê todos
- Login leva a um único tenant; trocar de tenant = novo login (futuro: troca rápida)

**Por que isso importa:** quando a Hábilis tiver 50 clientes, todos rodam no mesmo sistema, sem que ninguém atrapalhe ninguém. É o que torna o produto **escalável** sem precisar de servidor por cliente.

### 4.4 Autenticação — Como Login e Sessão Funcionam

Existem **dois fluxos de login**, totalmente separados:

#### Login interno (analista, coordenador, diretor)

```
Usuário digita e-mail+senha
         │
API valida senha (Argon2)
         │
Gera JWT (15 min) + Refresh Token (7 dias em Redis)
         │
Web Next.js guarda em cookie HttpOnly (iron-session)
         │
A cada requisição, middleware valida o cookie e injeta
o usuário + tenantId no contexto
```

#### Login externo (representante do cliente)

```
Analista clica "Convidar representante"
         │
API gera Token Portal único, válido por X dias
         │
Envia link por e-mail: https://app/portal/login?token=XYZ
         │
Representante clica → entra direto no portal do
empreendimento, sem senha (magic link)
         │
Token expira ou é renovado a cada acesso
```

**Por que dual-auth:** o representante do cliente não precisa criar conta nem lembrar senha — entrar pelo link é suficiente. Já o analista interno tem credenciais permanentes e pode acessar múltiplos empreendimentos.

### 4.5 IA Integrada (Claude API)

Claude (modelo da Anthropic) entra **só no servidor** (Backend / Worker), nunca no Frontend. É chamado para:

| Caso de uso | Onde dispara | Output |
|---|---|---|
| Gerar rascunho de defesa técnica | Quando usuário clica "Gerar com IA" em auto de infração | Texto da defesa, salvo em `DefesaTecnica.rascunhoIA` |
| Extrair intenção de mensagem WhatsApp | A cada mensagem recebida via webhook | Classificação (lead/compliance), entidades, próxima ação |
| Análise de Diário Oficial | Cron diário do scheduler IA | Tarefas automáticas por publicação relevante |
| Extração de dados de PDF | Upload de documento | Dados estruturados (datas, valores, responsáveis) |
| Resumo executivo semanal | Cron toda segunda 8h | E-mail digest por tenant |
| Detecção de anomalia VMP | Após cada laudo importado | Alerta urgente se desvio detectado |
| Pipeline dos 4 agentes | Acionamento manual pelo Diretor Técnico | Base normativa + enquadramento + auditoria + operacional |

**O que a IA NÃO faz:**
- Não toma decisões finais (só sugere; humano valida)
- Não tem acesso direto ao banco (só recebe contexto via API)
- Não gera enquadramento sem auditoria (regra dos 4 agentes)

### 4.6 Comunicação com o cliente (E-mail e WhatsApp)

| Canal | Tecnologia | Quando dispara |
|---|---|---|
| **E-mail** | Resend (provedor) | Magic link portal, alertas, notificação de relatório pronto, digest semanal |
| **WhatsApp** | Z-API (gateway) | Alertas críticos, dual-mode (lead + compliance), notificação de tarefa |

Tudo configurável por `RegraAutomatica` no painel da Hábilis: por tipo de evento, define quais perfis recebem por qual canal.

---

## 5. Banco de Dados

### 5.1 Por que tudo precisa ir pro banco

> **Regra absoluta:** se uma informação importa, ela mora no PostgreSQL. Nada em arquivos soltos, nada em planilhas, nada em memória, nada em localStorage.

| Razão | Consequência prática |
|---|---|
| **Auditoria** | Quem fez o quê, quando, em qual ordem — só o banco preserva |
| **Multi-tenant** | Sem `tenantId` por linha, não há isolamento de cliente |
| **Concorrência** | Dois analistas editando ao mesmo tempo: o banco resolve |
| **Backup** | Backup do banco = backup de todo o estado |
| **Relatórios** | Relatórios cruzam dados de 5+ tabelas — só SQL faz isso |
| **Motor de decisão** | Motor lê regras + contexto do banco; sem banco, motor não roda |

### 5.2 Inventário de Tabelas (Models Prisma)

> Total real auditado: **71 modelos** + **34 enums** em [Posto/sistema/apps/api/prisma/schema.prisma](Posto/sistema/apps/api/prisma/schema.prisma).
> Agrupados abaixo por domínio funcional para leitura humana.

#### Grupo 1 — Fundação e Acesso (7 tabelas)

| Tabela | Para que serve |
|---|---|
| `Tenant` | Cliente da Hábilis (rede ou posto único) |
| `Usuario` | Pessoas com login no sistema |
| `SessaoRefresh` | Tokens de refresh (renovar JWT) |
| `TokenPortal` | Magic links do portal externo |
| `Empresa` | Pessoa jurídica (CNPJ) vinculada ao tenant |
| `Empreendimento` | **Coração — o posto físico** |
| `EmpreendimentoAcesso` | Quais usuários acessam quais empreendimentos |

#### Grupo 2 — Catálogos Regulatórios (4 tabelas)

| Tabela | Para que serve |
|---|---|
| `OrgaoRegulador` | IBAMA, SEMAD, INMETRO, etc. (por tenant, customizável) |
| `TipoProcesso` | Modalidades (LP, LI, LO, AVCB...) |
| `FaseTipoProcesso` | Etapas internas de cada processo |
| `TipoDocumento` | Categorias de documento |
| `RequisitoTipoProcesso` | Documentos exigidos por processo |

#### Grupo 3 — Vida do Processo (5 tabelas)

| Tabela | Para que serve |
|---|---|
| `Processo` | Pedido formal junto a um órgão |
| `HistoricoFaseProcesso` | Linha do tempo de fases |
| `RequisitoProcesso` | Documentos exigidos do processo concreto |
| `Documento` | Acervo regulatório com validade |
| `DocumentoVersao` | Cada upload concreto (versionamento) |

#### Grupo 4 — Condicionantes e Tarefas (5 tabelas)

| Tabela | Para que serve |
|---|---|
| `Condicionante` | Obrigação atrelada a uma licença |
| `CicloCondicionante` | Vencimento concreto (ex: ciclo Q1/2026) |
| `Tarefa` | Trabalho a fazer com responsável e prazo |
| `TarefaDependencia` | Uma tarefa depende de outra |
| `EvidenciaTarefa` | Prova de execução |

#### Grupo 5 — Compliance, Alertas e Auditoria (5 tabelas)

| Tabela | Para que serve |
|---|---|
| `RegraAutomatica` | Configura quem recebe o quê (por tenant) |
| `Alerta` | Notificação crítica gerada |
| `AlertaDestinatario` | A quem o alerta foi destinado |
| `ComplianceSnapshot` | Foto periódica de conformidade |
| `AuditLog` | Trilha imutável (mutação por mutação) |

#### Grupo 6 — Licenciamento Ambiental e Urbanístico (3 tabelas)

| Tabela | Para que serve |
|---|---|
| `LicencaAmbiental` | LP, LI, LO, LAS, LAO |
| `CondicaoLicenca` | Condições atreladas à licença concreta |
| `AlvaraUrbanistico` | AVCB, Habite-se, PPCI, etc. |

#### Grupo 7 — SST (Saúde e Segurança do Trabalho) (7 tabelas)

| Tabela | Para que serve |
|---|---|
| `Funcionario` | Trabalhador do empreendimento |
| `TreinamentoTipo` | Catálogo de treinamentos |
| `TreinamentoExecucao` | Execução concreta |
| `TreinamentoParticipante` | Quem participou |
| `EntregaEPI` | Entrega de EPI a funcionário |
| `ASO` | Atestado de Saúde Ocupacional |
| `DocumentoSST` | PGR, PCMSO, LTCAT, etc. |

#### Grupo 8 — ANP/INMETRO e Estanqueidade (3 tabelas)

| Tabela | Para que serve |
|---|---|
| `BombaAbastecimento` | Bombas com calibração periódica |
| `EquipamentoHistorico` | Histórico de eventos de equipamento |
| `Tanque` | Tanques de armazenamento |
| `TesteEstanqueidade` | Testes periódicos de tanques |

#### Grupo 9 — Logística Reversa e Resíduos (5 tabelas)

| Tabela | Para que serve |
|---|---|
| `Transportadora` | Operadores logísticos cadastrados |
| `MTR` | Manifesto de Transporte de Resíduos |
| `MetaResiduoAnual` | Meta da meta x realizado |
| `CCR` | Comprovante de Coleta e Recebimento |
| `PGRS` | Plano de Gerenciamento de Resíduos |
| `PGRSExigencia` | Exigências do PGRS |
| `PGRSEvidencia` | Evidências cumpridas |

#### Grupo 10 — Outorga Hídrica e Monitoramento Ambiental (5 tabelas)

| Tabela | Para que serve |
|---|---|
| `PocoArtesiano` | Poço outorgado |
| `LaudoAgua` | Laudos periódicos de água |
| `PocoMonitoramento` | Poço para monitoramento ambiental |
| `LimiteParametro` | VMP por parâmetro/local |
| `CampanhaMonitoramento` | Campanha trimestral/semestral |
| `ParametroContaminante` | Substância medida |

#### Grupo 11 — Fiscalizações (3 tabelas)

| Tabela | Para que serve |
|---|---|
| `AutoInfracao` | Auto lavrado por órgão |
| `RecursoAdministrativo` | Defesa formal |
| `DefesaTecnica` | Peça técnica (com rascunho IA) |

#### Grupo 12 — Risco e Diário Oficial (2 tabelas)

| Tabela | Para que serve |
|---|---|
| `ScoreRisco` | 0-100 por empreendimento |
| `PublicacaoDO` | Publicações no DO |

#### Grupo 13 — WhatsApp e CRM (5 tabelas)

| Tabela | Para que serve |
|---|---|
| `ContatoWhatsApp` | Cadastro de contatos |
| `MensagemWhatsApp` | Histórico de mensagens |
| `LeadWhatsApp` | Lead comercial (com estágio CRM) |
| `FollowUpLead` | Ações sobre lead |
| `MensagemLead` | Mensagens vinculadas a lead |

#### Grupo 14 — Checklists (4 tabelas)

| Tabela | Para que serve |
|---|---|
| `ChecklistTemplate` | Modelo reutilizável |
| `ChecklistItem` | Item do template |
| `ChecklistExecucao` | Execução concreta |
| `ChecklistResposta` | Resposta a um item |

#### Grupo 15 — Bases de Conhecimento (1 tabela + JSONs seed)

| Tabela | Para que serve |
|---|---|
| `ObrigacaoRegulatoriaBase` | Catálogo regulatório que alimenta o motor |

> **Bases JSON existentes** (alimentam `ObrigacaoRegulatoriaBase` e outras tabelas via seed):
> - `baseCnae.json` (1.4 MB) — Classificação Nacional de Atividades Econômicas
> - `baseDocumentos.json` — Tipos de documentos regulatórios canônicos
> - `baseOrgaos.json` — Órgãos por esfera e UF
> - `baseServicos.json` — Serviços técnicos catalogados
> - `matrizObrigacoes.json` — Matriz CNAE × Obrigações
> - `matrizServicos.json` — Matriz Obrigação × Serviço
> - `prazosReferencia.json` — Prazos padrão regulatórios

#### Grupo 16 — Relatórios e Mensagens (2 tabelas)

| Tabela | Para que serve |
|---|---|
| `RelatorioGerado` | Solicitação de relatório (com status, S3 key) |
| `MensagemPortal` | Conversa entre analista e representante |

### 5.3 Diagrama de Relações Principais

```
                 ┌─────────────┐
                 │   Tenant    │  (cliente da Hábilis)
                 └──────┬──────┘
                        │ 1
                        │ N
        ┌───────────────┼────────────────────────────┐
        │               │                            │
        ▼               ▼                            ▼
   ┌────────┐    ┌──────────┐                ┌──────────────┐
   │Usuario │    │ Empresa  │                │ OrgaoRegulador│
   └───┬────┘    └────┬─────┘                └──────────────┘
       │              │ 1                            │
       │              │ N                            │
       │              ▼                              │
       │      ┌───────────────┐                      │
       └──┐   │ Empreendimento├──────────────┐      │
          │   └───────┬───────┘              │      │
          │           │ 1                    │      │
          │           │ N                    │      │
          ▼           ▼                      ▼      ▼
      ┌────────┐  ┌──────────┐         ┌──────────────┐
      │ Acesso │  │ Processo ├────────►│ TipoProcesso │
      └────────┘  └────┬─────┘         └──────────────┘
                       │ 1
                       │ N
                       ▼
                 ┌──────────────┐         ┌────────────┐
                 │  Documento   ├────────►│ TipoDoc.   │
                 └──────┬───────┘         └────────────┘
                        │ 1
                        │ N
                        ▼
                 ┌──────────────┐
                 │  DocVersao   │  (cada upload físico)
                 └──────────────┘

   Empreendimento ─┬─► LicencaAmbiental ──► Condicionante ──► Ciclo
                   ├─► Tarefa ──► EvidenciaTarefa
                   ├─► Alerta
                   ├─► AutoInfracao ──► Recurso ──► DefesaTecnica
                   ├─► [SST]   Funcionario ──► ASO + Treinamento + EPI
                   ├─► [ANP]   Bomba + Tanque ──► TesteEstanqueidade
                   ├─► [Hidri] PocoArtesiano + LaudoAgua
                   ├─► [Monit] CampanhaMonit. ──► ParametroContaminante
                   ├─► [LR]    MTR + PGRS + MetaResiduoAnual
                   └─► ComplianceSnapshot + ScoreRisco
```

### 5.4 Bases Externas que Viram Tabelas

| Origem (formato bruto) | Tabela / Seed destino | Esforço de conversão | Prioridade |
|---|---|---|---|
| `baseCnae.json` | Seed em `ObrigacaoRegulatoriaBase` + lookup | Baixo (já estruturado) | P0 |
| `baseDocumentos.json` | Seed em `TipoDocumento` | Baixo | P0 |
| `baseOrgaos.json` | Seed em `OrgaoRegulador` (por tenant) | Baixo | P0 |
| `baseServicos.json` | Seed em catálogo de serviços | Baixo | P0 |
| `matrizObrigacoes.json` | Seed em `ObrigacaoRegulatoriaBase` | Baixo | P0 |
| `prazosReferencia.json` | Seed em catálogo de prazos | Baixo | P0 |
| `recicla_goias_nodes.json` | Tabelas novas: `LRAtor`, `LRFluxo`, `LRMatriz` (a criar) | **Médio — falta schema** | P1 |
| `base_conhecimento_estanqueidade.json` | Tabelas novas: `EstanqNorma`, `EstanqPOP`, `EstanqChecklist` (a criar) | **Médio — falta schema** | P1 |
| `HABILIS_AI/modelos/*.json` | Seed em `ObrigacaoRegulatoriaBase` (após pipeline 4 agentes validar) | Alto (depende dos agentes) | P2 |

---

## 6. Motor de Decisão e Automações

### 6.1 O que é um Motor de Decisão

> **Analogia:** é o "checklist mental" que você faz quando recebe um cliente novo. Você ouve "tenho um posto Ipiranga em Goiânia, com loja de conveniência e troca de óleo, em operação há 3 anos" e instantaneamente sua cabeça produz: "ele precisa de LO renovada, AVCB, Estanqueidade SASC bienal, MTR para óleos lubrificantes, controle ANP de bombas..." O motor faz isso, mas **com base em regras escritas e auditáveis**, não em cabeça humana.

Tecnicamente: um motor de decisão é um conjunto de **regras codificadas** que recebe um **contexto** (CNAE, UF, município, porte, atividades) e devolve um **plano regulatório completo** (obrigações, documentos, serviços, preço, prazos).

### 6.2 Os Cinco Motores do Hábilis

#### Motor 1 — CNAE → Perfil Regulatório

- **Pergunta que responde:** dado este CNAE, qual o perfil de risco e quais regras federais se aplicam?
- **Entrada:** CNAE
- **Saída:** categoria de atividade, flags regulatórios, fluxo obrigatório
- **Salvage:** [cnae-engine.ts](INTERFACE/enviro-clarity-main/src/lib/cnae-engine.ts), [cnae-rules/cnae-regulatory-profiles.ts](INTERFACE/enviro-clarity-main/src/lib/cnae-rules/cnae-regulatory-profiles.ts), [data/cnae-enrichment.ts](INTERFACE/enviro-clarity-main/src/data/cnae-enrichment.ts)

#### Motor 2 — Diagnóstico Regulatório

- **Pergunta que responde:** dado este empreendimento (CNAE + UF + município + porte), qual a lista completa de obrigações?
- **Entrada:** contexto completo
- **Saída:** matriz de obrigações em camadas: CNAE → Federal → Estadual → Municipal → Porte → Diagnóstico dinâmico
- **Camadas (na ordem):**
  1. CNAE enrichment → perfil base
  2. Federal → CONAMA, IBAMA por categoria
  3. Estadual → regras específicas (GO, SP, MG, MT, MS, DF)
  4. Municipal → overrides (ex: Goiânia/AMMA)
  5. Porte → adicionais por porte
  6. Diagnóstico → condições dinâmicas (ex: passivo ambiental)
- **Salvage:** [decisionEngine.ts](INTERFACE/enviro-clarity-main/src/lib/decisionEngine.ts), [decision-rules/](INTERFACE/enviro-clarity-main/src/lib/decision-rules/), [diagnostic-engine.ts](INTERFACE/enviro-clarity-main/src/lib/diagnostic-engine.ts), [regulatory-engine.ts](INTERFACE/enviro-clarity-main/src/lib/regulatory-engine.ts)

#### Motor 3 — Cálculo de Prazos

- **Pergunta que responde:** dado este documento/processo/condicionante e sua data de emissão, quando vence?
- **Entrada:** tipo + data de emissão + UF (cada UF tem prazos próprios)
- **Saída:** data de vencimento + datas de alerta D-90, D-30, D-7
- **Conecta com:** `prazosReferencia.json` + worker `vencimentos.scheduler.ts`

#### Motor 4 — Orçamento (Precificação)

- **Pergunta que responde:** quanto cobrar pelo serviço Hábilis para atender este empreendimento?
- **Entrada:** lista de obrigações geradas + porte + complexidade + UF
- **Saída:** orçamento detalhado com horas, valor-hora, fator de complexidade, total
- **Salvage:** [budget-engine.ts](INTERFACE/enviro-clarity-main/src/lib/budget-engine.ts), [engine/parametros-orcamento.ts](INTERFACE/enviro-clarity-main/src/engine/parametros-orcamento.ts)

#### Motor 5 — Conformidade (Avaliação de Checklists)

- **Pergunta que responde:** dado este checklist respondido, qual o score de conformidade e quais não-conformidades?
- **Entrada:** ChecklistExecucao com respostas
- **Saída:** score % + lista de não-conformidades + plano de ação
- **Conecta com:** Score de Risco, Audit Trail

### 6.3 Knowledge Layer — A Camada de Inteligência Contextual

A **Knowledge Layer** ([INTERFACE/enviro-clarity-main/src/knowledge/](INTERFACE/enviro-clarity-main/src/knowledge/)) é a "memória organizada" do sistema. Para cada domínio (Ambiental, SST, Logística Reversa), ela mantém:

| Componente | O que faz | Exemplo |
|---|---|---|
| **Cards** | Cartões informativos com aprendizados-chave | "Atenção: testes de estanqueidade têm prazo bienal em GO" |
| **Checklists** | Listas de verificação contextuais | "10 itens para vistoria de chegada" |
| **Next Steps** | Sugestões de próxima ação | "Próximo: solicitar laudo do Q2 ao laboratório" |
| **Alert Rules** | Regras que disparam alertas | "Se ASO vence em 30 dias e não há novo agendado: alertar" |
| **Knowledge Resolver** | Motor que combina input + blocos + alertas e produz a saída unificada | (orquestrador) |

**Por que importa:** o Knowledge Layer é o que faz o sistema "saber falar a língua técnica certa em cada contexto", sem o usuário precisar escolher manualmente o que mostrar.

### 6.4 Os Quatro Agentes de IA — O Pipeline da Hábilis

Os agentes vivem em [HABILIS_AI/agentes/](HABILIS_AI/agentes/). Cada um é um prompt especializado para Claude (modelo da Anthropic) com regras estritas.

#### Agente 01 — Coletor Normativo Oficial

- **Disciplina:** **NÃO** interpreta, **NÃO** conclui, **NÃO** simplifica
- **Função:** dado um tema regulatório, levantar leis, decretos, resoluções, portarias, ABNT, órgãos, sistemas oficiais, instrumentos
- **Saída:** JSON estruturado com base normativa completa
- **Quando dispara:** acionamento manual pelo Diretor Técnico ou cron periódico (atualização semestral)

#### Agente 02 — Estruturador de Enquadramento

- **Disciplina:** vincula expressamente à base normativa recebida; proibido usar fórmulas amplas
- **Função:** transforma a base normativa em estrutura de enquadramento — quem se sujeita, quando aplica, critérios de entrada, critérios de exclusão
- **Saída:** JSON com 8 campos: `quem_se_sujeita`, `quem_pode_ser_afetado_indiretamente`, `quando_aplica`, `quando_nao_aplica`, `criterios_de_entrada`, `criterios_de_exclusao`, `delimitacao_objeto`, `objeto_obrigacao`
- **Recebe:** saída do Agente 01

#### Agente 04 — Auditor Regulatório

- **Disciplina:** **NÃO** corrige, **NÃO** reescreve, **NÃO** sugere — só audita
- **Função:** validar o enquadramento do Agente 02 contra a base normativa do Agente 01
- **Saída:** lista de erros críticos, inconsistências, extrapolações, generalizações + nivel_risco (baixo/médio/alto) + status_validacao (validado/parcial/reprovado)
- **Regra dura:** se nível_risco = "alto" ou status = "reprovado", o pipeline trava aqui — não vai para o Agente 03

#### Agente 03 — Operacional e de Serviços

- **Disciplina:** só roda se a auditoria validou o enquadramento
- **Função:** transforma o enquadramento validado em fluxo operacional executável + serviço Hábilis com escopo + precificação + regras de interface no sistema
- **Saída:** JSON com 4 blocos: `operacional` (fluxo, etapas, documentos, controles, provas, riscos), `servico` (descrição, escopo, entregáveis), `precificacao` (modelo, variáveis, faixa), `interface` (regras e gatilhos para o sistema Hábilis)

#### Pipeline integrado

```
   ┌─────────────┐
   │  TEMA (in)  │  ex: "PGRSS Postos de Combustíveis - GO"
   └──────┬──────┘
          ▼
   ┌─────────────┐
   │ AGENTE 01   │  Coleta normativa oficial completa
   └──────┬──────┘
          ▼
   ┌─────────────┐
   │ AGENTE 02   │  Estrutura enquadramento
   └──────┬──────┘
          ▼
   ┌─────────────┐         ┌──────────────────┐
   │ AGENTE 04   ├────────►│ TRAVA SE RISCO   │
   │  (auditor)  │         │ ALTO OU REPROVADO│
   └──────┬──────┘         └──────────────────┘
          ▼ (validado)
   ┌─────────────┐
   │ AGENTE 03   │  Operacional + Serviço + Preço
   └──────┬──────┘
          ▼
   ┌─────────────────────────────────────┐
   │ INGESTÃO NO SISTEMA:                │
   │ - ObrigacaoRegulatoriaBase (insert) │
   │ - Catálogo de serviços (update)     │
   │ - Regras do motor (update)          │
   └─────────────────────────────────────┘
```

### 6.5 Workers — Automações em Background

Workers são processos que rodam **sem o usuário esperar**. No Hábilis temos 7 processadores e 4 schedulers ([Posto/sistema/apps/worker/src/](Posto/sistema/apps/worker/src/)).

#### Schedulers (cronjobs periódicos)

| Scheduler | Frequência | O que faz |
|---|---|---|
| `vencimentos.scheduler.ts` | Diário 7h | Verifica todos os modelos com data de validade; gera alertas D-90/D-30/D-7 |
| `compliance.scheduler.ts` | Diário | Calcula score de compliance + gera ComplianceSnapshot |
| `motor-operacional.scheduler.ts` | Hora em hora | Monitora tarefas atrasadas, escalona |
| `fiscalizacoes.scheduler.ts` | Diário | Monitora prazos de defesa de autos de infração |

#### Processors (jobs sob demanda)

| Processor | Quando dispara | O que faz |
|---|---|---|
| `ai.processor.ts` | Solicitação de defesa técnica, extração PDF, etc | Chama Claude API, processa contexto, salva resultado |
| `alerta.processor.ts` | Alerta gerado | Resolve destinatários conforme RegraAutomatica, dispara canais |
| `compliance.processor.ts` | Mudança relevante | Recalcula score em tempo real |
| `email.processor.ts` | Job de e-mail | Envia via Resend |
| `relatorio.processor.ts` | Solicitação de relatório | Gera PDF/Excel, sobe pro S3, notifica |
| `scheduler.processor.ts` | Worker hub | Orquestra disparos de schedulers |
| `whatsapp.processor.ts` | Mensagem WhatsApp | Roteia entre lead/compliance, chama Claude |

---

## 7. Stack Tecnológica

> **Como ler:** cada linha é uma peça que vai pro sistema novo. "O que é" em linguagem leiga; "Por que escolhida" em uma frase; "Permite automatizar" mostra o ganho concreto.

### 7.1 Frontend (a vitrine)

| Tecnologia | O que é (leigo) | Por que escolhida | Permite automatizar |
|---|---|---|---|
| **Next.js 15** | Framework para construir sites web modernos com páginas servidas pelo servidor | Padrão atual da indústria; suporta App Router, Server Actions, melhor SEO e performance | Renderização no servidor → telas carregam mais rápido |
| **React 18** | Biblioteca que estrutura a interface em componentes reutilizáveis | Padrão da web; ecossistema gigante | Reuso de componentes; manutenção barata |
| **TypeScript 5.8** | JavaScript com checagem de tipos antes de rodar | Pega erros antes do usuário ver; código auto-documentado | Refatorações seguras |
| **Tailwind CSS** | Forma de escrever estilos visual direto no componente, sem CSS solto | Velocidade absurda de prototipagem; consistência visual | UI consistente sem manual de design |
| **shadcn/ui** | Biblioteca de componentes prontos (botão, modal, tabela...) com identidade configurável | Componentes acessíveis prontos; copia para o projeto, não é dependência externa | 80% da UI sai gratuita |
| **Radix UI** | Camada de baixo nível que dá acessibilidade aos componentes | Padrão WAI-ARIA; teclado, leitor de tela | Conformidade de acessibilidade automática |
| **React Hook Form + Zod** | Lib de formulários + validação de dados | Formulários complexos com validação tipada | Validação cliente espelhada no servidor |
| **TanStack Query** | Gerencia chamadas à API com cache automático | Sincronização entre telas, retry automático | Estado da rede vira automático |
| **Zustand** | Gerenciador de estado leve (carrinho, sidebar, etc.) | Pequeno e direto; sem boilerplate | Estado global sem dor |
| **Recharts 3** | Biblioteca de gráficos | Padrão da indústria; bonita; flexível | Dashboards prontos |
| **Lucide React** | Coleção de ícones | Consistência visual; treeshakable | Ícones uniformes |
| **Sonner** | Toasts (notificações no canto) | Acessível; bonita | Feedback do sistema |

### 7.2 Backend (a cozinha)

| Tecnologia | O que é (leigo) | Por que escolhida | Permite automatizar |
|---|---|---|---|
| **Fastify 4** | Servidor HTTP rápido em Node.js | 2x mais rápido que Express; valida com Zod nativamente | Endpoints servidos por padrões |
| **Prisma 5** | ORM — fala com o banco em vez de escrever SQL na mão | Tipo seguro; migrations automáticas; auto-completa | Queries seguras com auto-complete |
| **PostgreSQL 16** | Banco de dados relacional, robusto, gratuito | Padrão da indústria; suporta JSON, full-text, geo | Tudo que um SaaS precisa |
| **Redis 7** | Banco em memória para cache e filas | Rapidíssimo; suporta filas com BullMQ | Sessões, cache, jobs |
| **BullMQ 5** | Sistema de filas em cima do Redis | Padrão para jobs assíncronos | Workers de e-mail, IA, relatórios |
| **iron-session** | Gestão de sessão em cookie HttpOnly criptografado | Mais seguro que LocalStorage; XSS-proof | Login persistente seguro |
| **Argon2** | Algoritmo de hash de senha | Padrão atual (substituiu bcrypt) | Senhas armazenadas com segurança |
| **Pino** | Logger estruturado | Rápido; logs em JSON | Observabilidade pronta |
| **Zod** | Validação de schemas (mesmo do frontend) | Mesmo schema em frontend e backend | Validação simétrica |

### 7.3 Infra e Operação

| Tecnologia | O que é (leigo) | Por que escolhida | Permite automatizar |
|---|---|---|---|
| **MinIO** | S3 da Amazon, mas que pode rodar na sua máquina | API S3 padrão; gratuito; pode trocar para AWS depois | Upload de documentos |
| **Docker Compose** | Orquestrador local de serviços (banco, redis, minio em 1 comando) | Padrão de dev; mesmo arquivo vira produção | Setup local em 30s |
| **pnpm 9** | Gerenciador de pacotes mais rápido que npm | Melhor para monorepos; usa menos disco | Workspaces compartilhados |
| **Turborepo 2** | Ferramenta para builds de monorepo (caches, paralelismo) | Builds rápidas em projetos grandes | Build incremental |

### 7.4 Integrações Externas

| Tecnologia | O que é (leigo) | Por que escolhida | Permite automatizar |
|---|---|---|---|
| **Anthropic Claude** | IA que entende texto e produz texto | Melhor qualidade técnica para defesas e análises | Defesas técnicas, extração PDF, análise DO |
| **Z-API** | Gateway WhatsApp (via webhook) | Funciona com WhatsApp comum; webhook para entrada | Mensagens automáticas, leads |
| **Resend** | Provedor de e-mail transacional | Setup simples; bom deliverability | Magic links, alertas, digests |
| **AWS S3 / MinIO** | Storage de objetos (arquivos) | Padrão; URLs presigned para download seguro | Upload e download de documentos |
| **pdfkit / exceljs / puppeteer** | Geração de PDFs e planilhas no servidor | Rodam dentro do worker | Relatórios sob demanda |

### 7.5 Qualidade

| Tecnologia | O que é (leigo) | Por que escolhida |
|---|---|---|
| **ESLint** | Linter — aponta erros e padroniza estilo | Código consistente entre desenvolvedores |
| **Prettier** | Formatador automático | Sem brigas de estilo |
| **Vitest** | Test runner moderno | Rápido; nativo TypeScript |
| **@testing-library/react** | Testes de UI | Testa como o usuário usa, não a implementação |

---

## 8. Salvage

> **Princípio do Salvage:** copia se custa pouco e vale muito; descarta se vai virar reescrita.

### 8.1 Tabela Mestra de Salvage

| Origem | Destino no sistema novo | Esforço | Por que vale a pena |
|---|---|---|---|
| **Motor de Decisão** ||||
| [decisionEngine.ts](INTERFACE/enviro-clarity-main/src/lib/decisionEngine.ts) | `packages/engine/src/regulatory.ts` | Baixo | Coração regulatório; zero retrabalho |
| [decision-rules/cnae-regulatory-profiles.ts](INTERFACE/enviro-clarity-main/src/lib/decision-rules/cnae-regulatory-profiles.ts) | `packages/engine/src/cnae-rules.ts` | Baixo | Regras já testadas |
| [cnae-engine.ts](INTERFACE/enviro-clarity-main/src/lib/cnae-engine.ts) | `packages/engine/src/cnae.ts` | Baixo | Já maduro |
| [cnae-rules/fuel-retail.ts](INTERFACE/enviro-clarity-main/src/lib/cnae-rules/fuel-retail.ts) | `packages/engine/src/cnae-rules-fuel.ts` | Baixo | Domínio crítico Hábilis |
| [diagnostic-engine.ts](INTERFACE/enviro-clarity-main/src/lib/diagnostic-engine.ts) | `packages/engine/src/diagnostic.ts` | Baixo | Direto |
| [diagnostic-rules.ts](INTERFACE/enviro-clarity-main/src/lib/diagnostic-rules.ts) | `packages/engine/src/diagnostic-rules.ts` | Baixo | Direto |
| [regulatory-engine.ts](INTERFACE/enviro-clarity-main/src/lib/regulatory-engine.ts) | `packages/engine/src/regulatory-orchestrator.ts` | Baixo | Direto |
| [budget-engine.ts](INTERFACE/enviro-clarity-main/src/lib/budget-engine.ts) | `packages/engine/src/budget.ts` | Baixo | Motor de orçamento |
| [engine/parametros-orcamento.ts](INTERFACE/enviro-clarity-main/src/engine/parametros-orcamento.ts) | `packages/engine/src/budget-params.ts` | Baixo | Parâmetros já calibrados |
| **Knowledge Layer** ||||
| [knowledge/](INTERFACE/enviro-clarity-main/src/knowledge/) | `packages/knowledge/src/` | Médio | Cards, alerts, blocks — adapta tipos |
| [knowledge/blocks/posto-ambiental.ts](INTERFACE/enviro-clarity-main/src/knowledge/blocks/posto-ambiental.ts) | `packages/knowledge/src/blocks/posto-ambiental.ts` | Baixo | Conteúdo direto |
| [knowledge/blocks/posto-sst.ts](INTERFACE/enviro-clarity-main/src/knowledge/blocks/posto-sst.ts) | `packages/knowledge/src/blocks/posto-sst.ts` | Baixo | Conteúdo direto |
| [knowledge/blocks/posto-logistica-reversa.ts](INTERFACE/enviro-clarity-main/src/knowledge/blocks/posto-logistica-reversa.ts) | `packages/knowledge/src/blocks/posto-logistica-reversa.ts` | Baixo | Conteúdo direto |
| [knowledge/alerts/alert-rules.ts](INTERFACE/enviro-clarity-main/src/knowledge/alerts/alert-rules.ts) | `packages/knowledge/src/alerts.ts` | Baixo | Regras de alerta |
| **Schema de Banco** ||||
| [Posto/sistema/apps/api/prisma/schema.prisma](Posto/sistema/apps/api/prisma/schema.prisma) | `apps/api/prisma/schema.prisma` (revisado) | Médio | 71 models já desenhados; revisar 5-10 e podar 0-3 |
| [prisma/seed/checklists.ts](Posto/sistema/apps/api/prisma/seed/checklists.ts) | `apps/api/prisma/seed/checklists.ts` | Baixo | Direto |
| [prisma/seed/obrigacoes-regulatorias.ts](Posto/sistema/apps/api/prisma/seed/obrigacoes-regulatorias.ts) | `apps/api/prisma/seed/obrigacoes.ts` | Baixo | Direto |
| [prisma/seed/operational-scenarios.ts](Posto/sistema/apps/api/prisma/seed/operational-scenarios.ts) | `apps/api/prisma/seed/scenarios.ts` | Baixo | Cenários reais |
| [prisma/seed/pgrs-regras.ts](Posto/sistema/apps/api/prisma/seed/pgrs-regras.ts) | `apps/api/prisma/seed/pgrs-regras.ts` | Baixo | Direto |
| **Bases JSON** ||||
| [Posto/sistema/apps/api/prisma/baseCnae.json](Posto/sistema/apps/api/prisma/baseCnae.json) | Seed mesma localização | Baixo | Direto |
| `baseDocumentos.json`, `baseOrgaos.json`, `baseServicos.json`, `matrizObrigacoes.json`, `matrizServicos.json`, `prazosReferencia.json` | Seeds correspondentes | Baixo | Direto |
| [Estanqueidade/base_conhecimento_estanqueidade.json](Estanqueidade/base_conhecimento_estanqueidade.json) | Schema novo + seed | Médio | Falta modelar tabelas |
| [Logística Reversa/recicla_goias_nodes.json](Logística Reversa/recicla_goias_nodes.json) | Schema novo + seed | Médio | Falta modelar tabelas |
| **Workers** ||||
| [worker/src/processors/](Posto/sistema/apps/worker/src/processors/) | `apps/worker/src/processors/` | Médio | 7 processors funcionais; ajustar imports |
| [worker/src/schedulers/](Posto/sistema/apps/worker/src/schedulers/) | `apps/worker/src/schedulers/` | Médio | 4 schedulers funcionais |
| **Backend** ||||
| [api/src/modules/](Posto/sistema/apps/api/src/modules/) | `apps/api/src/modules/` | Médio | 35 módulos; revisar 1 a 1 conforme reuso |
| **Frontend** ||||
| [Posto web pages](Posto/sistema/apps/web/src/app/) | `apps/web/src/app/` | Médio-Alto | 50+ páginas; manter estrutura, refatorar visual |
| [shadcn/ui customizado Posto](Posto/sistema/packages/ui/) | `packages/ui/` | Baixo | Aproveita 100% |
| **Identidade Visual** ||||
| Tailwind config Intelligence (azul marinho + âmbar) | `packages/ui/theme.ts` | Baixo | Identidade Hábilis Intelligence |
| **IA** ||||
| [HABILIS_AI/agentes/agente_01_coletor.txt](HABILIS_AI/agentes/agente_01_coletor.txt) | `apps/worker/src/agents/coletor.prompt.ts` | Baixo | Prompt pronto |
| [HABILIS_AI/agentes/agente_02_estruturador.txt](HABILIS_AI/agentes/agente_02_estruturador.txt) | `apps/worker/src/agents/estruturador.prompt.ts` | Baixo | Prompt pronto |
| [HABILIS_AI/agentes/agente_03_operacional.txt](HABILIS_AI/agentes/agente_03_operacional.txt) | `apps/worker/src/agents/operacional.prompt.ts` | Baixo | Prompt pronto |
| [HABILIS_AI/agentes/agente_04_auditor.txt](HABILIS_AI/agentes/agente_04_auditor.txt) | `apps/worker/src/agents/auditor.prompt.ts` | Baixo | Prompt pronto |
| [HABILIS_AI/modelos/](HABILIS_AI/modelos/) | Inputs/outputs de teste | Baixo | Cenários reais para validar pipeline |

### 8.2 Tabela do que **NÃO** entra (descarta)

| Origem | Razão do descarte |
|---|---|
| Páginas .tsx do Intelligence (todas) | Refazer em Next.js App Router; layout consistente único |
| React Router do Intelligence | App Router substitui |
| Supabase Auth (Intelligence) | iron-session no novo |
| `localStorage` hacks (`habilis_active_project_id`, `habilis_role`) | Estado no servidor (Server Components) |
| `mock-data.ts`, `posto-mock-data.ts` | Banco real desde o dia 1 |
| `LegacyHubPage.tsx`, `PlaceholderPage.tsx` | Lixo arquitetural |
| Scripts Python `HABILIS_AI/scripts/` | Reescrever em TS dentro do worker |
| HTMLs soltos `Estanqueidade/`, `Logística Reversa/`, `PROJETO G.P/` | Já viraram seeds JSON |
| Pasta duplicada `HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL (2)/` | Lixo |
| `Z+Z - América/` (no repositório principal) | Mover para repositório privado de cliente |
| `Node/` (script standalone) | Substituído por worker BullMQ |

---

## 9. Checklist Mestre

> **Como ler:** linha por módulo. Status sempre real (não documentado). Quando um item está em "Onde está hoje", é base para salvage. Quando está em ❌, é construção zero.

### Status legenda
- ✅ **Existe** — funciona em produção (Posto/sistema)
- 🟡 **Parcial** — código existe mas precisa ajuste/UI/integração
- ❌ **Falta criar** — construção do zero

### Prioridades
- **P0** — bloqueia o sistema (sem isso, nada roda)
- **P1** — bloqueia uma vertical funcional
- **P2** — melhoria/extensão; não bloqueia MVP

| # | Módulo | Item | Status | Onde está hoje | Onde vai morar | Ação | P |
|---|---|---|---|---|---|---|---|
| **FUNDAÇÃO** ||||||||
| 1.1 | Infra | Monorepo pnpm + Turborepo | ✅ | [Posto/sistema/](Posto/sistema/) | `HABILIS/` | Replicar estrutura | P0 |
| 1.2 | Infra | Docker Compose (Postgres + Redis + MinIO) | ✅ | [Posto/sistema/docker-compose.yml](Posto/sistema/docker-compose.yml) | `HABILIS/docker-compose.yml` | Copiar e revisar | P0 |
| 1.3 | Banco | Schema Prisma (71 models) | ✅ | [schema.prisma](Posto/sistema/apps/api/prisma/schema.prisma) | `apps/api/prisma/schema.prisma` | Copiar; revisar nomes; adicionar tabelas Estanq+LR | P0 |
| 1.4 | Banco | Seeds das bases (CNAE, Documentos, Órgãos, Serviços, Matriz) | ✅ | [prisma/seed/](Posto/sistema/apps/api/prisma/seed/) + JSONs | `apps/api/prisma/seed/` | Copiar | P0 |
| 1.5 | Banco | Seed de Estanqueidade | ❌ | JSON em [Estanqueidade/](Estanqueidade/) | `apps/api/prisma/seed/estanqueidade.ts` | Criar tabelas + seed | P1 |
| 1.6 | Banco | Seed de Logística Reversa (Recicla Goiás) | ❌ | JSON em [Logística Reversa/](Logística Reversa/) | `apps/api/prisma/seed/logistica-reversa.ts` | Criar tabelas + seed | P1 |
| 1.7 | Auth | Login interno (JWT + Refresh + iron-session) | ✅ | `api/modules/auth/` | igual | Copiar | P0 |
| 1.8 | Auth | RBAC com 7 perfis (CASL/ability) | ✅ | `api/shared/middleware/authorize.ts` | igual | Copiar | P0 |
| 1.9 | Auth | Token Portal (magic link) | ✅ | `api/modules/portal/` | igual | Copiar | P0 |
| 1.10 | Auth | Multi-tenant (tenantId em todas queries) | ✅ | Shared middleware | igual | Copiar | P0 |
| **PACKAGES COMPARTILHADOS** ||||||||
| 2.1 | Packages | `@habilis/schemas` (Zod) | ✅ | [packages/schemas](Posto/sistema/packages/schemas/) | `packages/schemas` | Copiar | P0 |
| 2.2 | Packages | `@habilis/types` | ✅ | [packages/types](Posto/sistema/packages/types/) | `packages/types` | Copiar | P0 |
| 2.3 | Packages | `@habilis/ui` (shadcn) | ✅ | [packages/ui](Posto/sistema/packages/ui/) | `packages/ui` | Copiar + tema azul/âmbar | P0 |
| 2.4 | Packages | `@habilis/utils` | ✅ | [packages/utils](Posto/sistema/packages/utils/) | `packages/utils` | Copiar | P0 |
| 2.5 | Packages | `@habilis/engine` (motor de decisão) | ❌ | espalhado em [INTERFACE/.../lib/](INTERFACE/enviro-clarity-main/src/lib/) | `packages/engine` | Criar pacote, migrar 8 motores | P0 |
| 2.6 | Packages | `@habilis/knowledge` | ❌ | [INTERFACE/.../knowledge/](INTERFACE/enviro-clarity-main/src/knowledge/) | `packages/knowledge` | Criar pacote, migrar | P1 |
| **MOTOR DE DECISÃO** ||||||||
| 3.1 | Engine | decisionEngine principal | 🟡 | Intelligence | `packages/engine/regulatory.ts` | Migrar + ajustar tipos | P0 |
| 3.2 | Engine | CNAE engine + rules | 🟡 | Intelligence | `packages/engine/cnae*.ts` | Migrar | P0 |
| 3.3 | Engine | Diagnostic engine | 🟡 | Intelligence | `packages/engine/diagnostic.ts` | Migrar | P0 |
| 3.4 | Engine | Budget engine + parâmetros | 🟡 | Intelligence | `packages/engine/budget.ts` | Migrar | P1 |
| 3.5 | Engine | Knowledge resolver | 🟡 | Intelligence | `packages/knowledge/resolver.ts` | Migrar | P1 |
| 3.6 | Engine | Alert rules engine | 🟡 | Intelligence | `packages/knowledge/alerts.ts` | Migrar | P1 |
| **API — MÓDULOS** ||||||||
| 4.1 | API | Auth + Sessões + Tokens | ✅ | `api/modules/auth/` | igual | Copiar | P0 |
| 4.2 | API | Tenants (super admin) | ✅ | `api/modules/tenants/` | igual | Copiar | P0 |
| 4.3 | API | Usuários | ✅ | `api/modules/usuarios/` | igual | Copiar | P0 |
| 4.4 | API | Empreendimentos | ✅ | `api/modules/empreendimentos/` | igual | Copiar | P0 |
| 4.5 | API | Onboarding wizard | ✅ | `api/modules/onboarding/` | igual | Copiar | P1 |
| 4.6 | API | Processos | ✅ | `api/modules/processos/` | igual | Copiar | P1 |
| 4.7 | API | Documentos (S3 presigned) | ✅ | `api/modules/documentos/` | igual | Copiar | P0 |
| 4.8 | API | Condicionantes + Ciclos | ✅ | `api/modules/condicionantes/` | igual | Copiar | P1 |
| 4.9 | API | Tarefas | ✅ | `api/modules/tarefas/` | igual | Copiar | P1 |
| 4.10 | API | Alertas | ✅ | `api/modules/alertas/` | igual | Copiar | P0 |
| 4.11 | API | Compliance | ✅ | `api/modules/compliance/` | igual | Copiar | P1 |
| 4.12 | API | Audit (logs) | ✅ | `api/modules/audit/` | igual | Copiar | P0 |
| 4.13 | API | Licenças Ambientais | ✅ | `api/modules/licencas-ambientais/` | igual | Copiar | P1 |
| 4.14 | API | Regulatório Urbano | ✅ | `api/modules/regulatorio-urbano/` | igual | Copiar | P1 |
| 4.15 | API | SST | ✅ | `api/modules/sst/` | igual | Copiar | P1 |
| 4.16 | API | ANP/INMETRO + Equipamentos | ✅ | `api/modules/anp-inmetro/` | igual | Copiar | P1 |
| 4.17 | API | Estanqueidade | ✅ | `api/modules/estanqueidade/` | igual | Copiar + integrar bases | P1 |
| 4.18 | API | Logística Reversa | ✅ | `api/modules/logistica-reversa/` | igual | Copiar + integrar bases | P1 |
| 4.19 | API | PGRS | ✅ | `api/modules/pgrs/` | igual | Copiar | P2 |
| 4.20 | API | Outorga Hídrica | ✅ | `api/modules/outorga-hidrica/` | igual | Copiar | P2 |
| 4.21 | API | Monitoramento Ambiental | ✅ | `api/modules/monitoramento/` | igual | Copiar | P2 |
| 4.22 | API | Fiscalizações + Defesa | ✅ | `api/modules/fiscalizacoes/` | igual | Copiar | P1 |
| 4.23 | API | Risco | ✅ | `api/modules/risco/` | igual | Copiar | P2 |
| 4.24 | API | Cockpit (executivo) | ✅ | `api/modules/cockpit/` | igual | Copiar | P2 |
| 4.25 | API | Métricas | ✅ | `api/modules/metricas/` | igual | Copiar | P2 |
| 4.26 | API | Legislação / DO | ✅ | `api/modules/legislacao/` | igual | Copiar | P2 |
| 4.27 | API | CRM | ✅ | `api/modules/crm/` | igual | Copiar | P1 |
| 4.28 | API | WhatsApp (webhook + envio) | ✅ | `api/modules/whatsapp/` | igual | Copiar | P1 |
| 4.29 | API | Portal externo | ✅ | `api/modules/portal/` | igual | Copiar | P1 |
| 4.30 | API | Relatórios | ✅ | `api/modules/relatorios/` | igual | Copiar | P1 |
| 4.31 | API | Checklists | ✅ | `api/modules/checklists/` | igual | Copiar | P1 |
| 4.32 | API | Config (RegraAutomatica) | ✅ | `api/modules/config/` | igual | Copiar | P0 |
| 4.33 | API | Fila (gestão BullMQ) | ✅ | `api/modules/fila/` | igual | Copiar | P0 |
| 4.34 | API | IA (Claude) | ✅ | `api/modules/ia/` | igual | Copiar | P1 |
| 4.35 | API | Diagnóstico (motor) | ❌ | nenhum endpoint hoje | `api/modules/diagnostico/` | Criar — chama motor | P0 |
| 4.36 | API | Triagem comercial | ❌ | nenhum endpoint hoje | `api/modules/triagem/` | Criar | P1 |
| 4.37 | API | Orçamento (motor) | ❌ | nenhum endpoint hoje | `api/modules/orcamento/` | Criar — chama budget | P1 |
| 4.38 | API | Atuações (condução técnica) | ❌ | nenhum endpoint hoje | `api/modules/atuacoes/` | Criar | P1 |
| 4.39 | API | Eventos Regulatórios | ❌ | nenhum endpoint hoje | `api/modules/eventos-regulatorios/` | Criar | P2 |
| 4.40 | API | Pipeline IA dos 4 agentes | ❌ | prompts em [HABILIS_AI/agentes/](HABILIS_AI/agentes/) | `api/modules/agentes/` + worker | Criar orquestração | P2 |
| **WORKERS** ||||||||
| 5.1 | Worker | Vencimentos scheduler | ✅ | `worker/schedulers/vencimentos.scheduler.ts` | igual | Copiar | P0 |
| 5.2 | Worker | Compliance scheduler | ✅ | `worker/schedulers/compliance.scheduler.ts` | igual | Copiar | P1 |
| 5.3 | Worker | Motor operacional scheduler | ✅ | `worker/schedulers/motor-operacional.scheduler.ts` | igual | Copiar | P1 |
| 5.4 | Worker | Fiscalizações scheduler | ✅ | `worker/schedulers/fiscalizacoes.scheduler.ts` | igual | Copiar | P1 |
| 5.5 | Worker | Alerta processor (e-mail + WhatsApp) | ✅ | `worker/processors/alerta.processor.ts` | igual | Copiar | P0 |
| 5.6 | Worker | E-mail processor (Resend) | ✅ | `worker/processors/email.processor.ts` | igual | Copiar | P0 |
| 5.7 | Worker | WhatsApp processor (Z-API) | ✅ | `worker/processors/whatsapp.processor.ts` | igual | Copiar | P1 |
| 5.8 | Worker | Compliance processor | ✅ | `worker/processors/compliance.processor.ts` | igual | Copiar | P1 |
| 5.9 | Worker | Relatório processor (PDF/Excel) | ✅ | `worker/processors/relatorio.processor.ts` | igual | Copiar | P1 |
| 5.10 | Worker | AI processor (Claude) | ✅ | `worker/processors/ai.processor.ts` | igual | Copiar | P1 |
| 5.11 | Worker | Scheduler hub | ✅ | `worker/processors/scheduler.processor.ts` | igual | Copiar | P0 |
| 5.12 | Worker | Pipeline 4 agentes (orquestração) | ❌ | prompts soltos | `worker/processors/agentes-pipeline.processor.ts` | Criar | P2 |
| 5.13 | Worker | Diário Oficial (IA captura+análise) | 🟡 | parcial em scheduler IA | igual | Expandir | P2 |
| 5.14 | Worker | Digest semanal (IA) | 🟡 | parcial em scheduler IA | igual | Expandir | P2 |
| 5.15 | Worker | Anomalia VMP detector | 🟡 | parcial | igual | Expandir | P2 |
| **WEB — PÁGINAS INTERNAS** ||||||||
| 6.1 | Web | Layout app + sidebar | ✅ | `web/src/app/(app)/` | igual | Copiar + tema novo | P0 |
| 6.2 | Web | Login | ✅ | `web/src/app/(auth)/login/page.tsx` | igual | Copiar | P0 |
| 6.3 | Web | Dashboard | ✅ | `web/src/app/(app)/dashboard/page.tsx` | igual | Copiar | P0 |
| 6.4 | Web | Empreendimentos (lista, detalhe, novo, onboarding) | ✅ | `web/src/app/(app)/empreendimentos/` | igual | Copiar | P0 |
| 6.5 | Web | Processos (lista, detalhe, novo) | ✅ | `web/src/app/(app)/processos/` | igual | Copiar | P1 |
| 6.6 | Web | Documentos (lista, detalhe) | ✅ | `web/src/app/(app)/documentos/` | igual | Copiar | P0 |
| 6.7 | Web | Condicionantes | ✅ | `web/src/app/(app)/condicionantes/page.tsx` | igual | Copiar | P1 |
| 6.8 | Web | Tarefas | ✅ | `web/src/app/(app)/tarefas/page.tsx` | igual | Copiar | P1 |
| 6.9 | Web | Alertas | ✅ | `web/src/app/(app)/alertas/page.tsx` | igual | Copiar | P0 |
| 6.10 | Web | Calendário | ✅ | `web/src/app/(app)/calendario/page.tsx` | igual | Copiar | P0 |
| 6.11 | Web | Monitoramento Ambiental | ✅ | `web/src/app/(app)/monitoramento/page.tsx` | igual | Copiar | P2 |
| 6.12 | Web | Fiscalizações | ✅ | `web/src/app/(app)/fiscalizacoes/page.tsx` | igual | Copiar | P1 |
| 6.13 | Web | Fiscalização detalhe + recurso + defesa IA | ✅ | `fiscalizacoes/[id]/page.tsx` | igual | Copiar | P1 |
| 6.14 | Web | Legislação / DO | ✅ | `web/src/app/(app)/legislacao/page.tsx` | igual | Copiar | P2 |
| 6.15 | Web | Risco | ✅ | `web/src/app/(app)/risco/page.tsx` | igual | Copiar | P2 |
| 6.16 | Web | WhatsApp (LeadsPanel + chat) | ✅ | `web/src/app/(app)/whatsapp/page.tsx` | igual | Copiar | P1 |
| 6.17 | Web | Checklists | ✅ | `web/src/app/(app)/checklists/` | igual | Copiar | P1 |
| 6.18 | Web | Auditoria | ✅ | `web/src/app/(app)/auditoria/page.tsx` | igual | Copiar | P0 |
| 6.19 | Web | Executivo (cockpit) | ✅ | `web/src/app/(app)/executivo/page.tsx` | igual | Copiar | P2 |
| 6.20 | Web | Usuários | ✅ | `web/src/app/(app)/usuarios/page.tsx` | igual | Copiar | P0 |
| 6.21 | Web | Licenças Ambientais (lista + detalhe) | ✅ | `web/src/app/(app)/licencas-ambientais/` | igual | Copiar | P1 |
| 6.22 | Web | Regulatório Urbano | ✅ | `web/src/app/(app)/regulatorio-urbano/` | igual | Copiar | P1 |
| 6.23 | Web | SST | ✅ | `web/src/app/(app)/sst/page.tsx` | igual | Copiar | P1 |
| 6.24 | Web | ANP/INMETRO | ✅ | `web/src/app/(app)/anp-inmetro/` | igual | Copiar | P1 |
| 6.25 | Web | Estanqueidade | ✅ | `web/src/app/(app)/estanqueidade/page.tsx` | igual | Copiar + integrar bases | P1 |
| 6.26 | Web | Logística Reversa | ✅ | `web/src/app/(app)/logistica-reversa/page.tsx` | igual | Copiar + integrar bases | P1 |
| 6.27 | Web | Outorga Hídrica | ✅ | `web/src/app/(app)/outorga-hidrica/` | igual | Copiar | P2 |
| 6.28 | Web | Relatórios | ✅ | já implementado em fase 8 | igual | Copiar | P1 |
| 6.29 | Web | CRM (Kanban) | ✅ | já implementado em fase 10 | igual | Copiar | P1 |
| 6.30 | Web | Configurações (RegraAutomatica) | ✅ | `web/src/app/(app)/config/page.tsx` | igual | Copiar | P0 |
| 6.31 | Web | Diagnóstico (novo, motor) | ❌ | UI no Intelligence | `web/src/app/(app)/diagnostico/` | Criar | P0 |
| 6.32 | Web | Matriz Regulatória (visualização) | ❌ | UI no Intelligence | `web/src/app/(app)/matriz-regulatoria/` | Criar | P1 |
| 6.33 | Web | Triagem Comercial | ❌ | UI no Intelligence | `web/src/app/(app)/triagem/` | Criar | P1 |
| 6.34 | Web | Orçamento (Motor + lista) | ❌ | UI no Intelligence | `web/src/app/(app)/orcamentos/` | Criar | P1 |
| 6.35 | Web | Atuações (registro, timeline) | ❌ | UI no Intelligence | `web/src/app/(app)/atuacoes/` | Criar | P1 |
| 6.36 | Web | Eventos Regulatórios | ❌ | UI no Intelligence | `web/src/app/(app)/eventos-regulatorios/` | Criar | P2 |
| 6.37 | Web | Bases (Admin: CNAE, Órgãos, Regulatório) | ❌ | UI no Intelligence | `web/src/app/(app)/admin/bases/` | Criar | P1 |
| 6.38 | Web | Pessoas (Diretor Técnico, equipe) | ❌ | UI no Intelligence | `web/src/app/(app)/pessoas/` | Criar | P2 |
| 6.39 | Web | Painel de Agentes IA | ❌ | nenhum hoje | `web/src/app/(app)/agentes/` | Criar | P2 |
| **WEB — PORTAL EXTERNO** ||||||||
| 7.1 | Portal | Login (magic link) | ✅ | `web/src/app/portal/login/page.tsx` | igual | Copiar | P1 |
| 7.2 | Portal | Início (dashboard) | ✅ | `web/src/app/portal/(portal)/inicio/page.tsx` | igual | Copiar | P1 |
| 7.3 | Portal | Alertas | ✅ | `portal/(portal)/alertas/page.tsx` | igual | Copiar | P1 |
| 7.4 | Portal | Condicionantes | ✅ | `portal/(portal)/condicionantes/page.tsx` | igual | Copiar | P1 |
| 7.5 | Portal | Tarefas | ✅ | `portal/(portal)/tarefas/page.tsx` | igual | Copiar | P1 |
| 7.6 | Portal | Documentos | ✅ | `portal/(portal)/documentos/page.tsx` | igual | Copiar | P1 |
| 7.7 | Portal | Mensagens | ✅ | `portal/(portal)/mensagens/page.tsx` | igual | Copiar | P1 |
| 7.8 | Portal | Checklists | ✅ | `portal/(portal)/checklists/page.tsx` | igual | Copiar | P1 |
| **WEB — SUPER ADMIN** ||||||||
| 8.1 | SuperAdmin | Lista de tenants | ✅ | `web/src/app/(superadmin)/tenants/page.tsx` | igual | Copiar | P0 |
| 8.2 | SuperAdmin | Novo tenant | ✅ | `web/src/app/(superadmin)/tenants/novo/page.tsx` | igual | Copiar | P0 |
| 8.3 | SuperAdmin | Detalhe + edição tenant | ✅ | `web/src/app/(superadmin)/tenants/[id]/page.tsx` | igual | Copiar | P0 |
| **TEMA E IDENTIDADE** ||||||||
| 9.1 | Tema | Tema azul marinho + âmbar (Hábilis Intelligence) | 🟡 | Tailwind config Intelligence | `packages/ui/theme.ts` | Migrar | P0 |
| 9.2 | Tema | Logo + assets | 🟡 | múltiplos lugares | `packages/ui/assets/` | Consolidar | P0 |
| 9.3 | Tema | Tipografia + paleta documentadas | ❌ | inconsistente | `packages/ui/design-tokens.ts` | Criar | P1 |
| **QUALIDADE** ||||||||
| 10.1 | Qualidade | TS strict + ESLint + Prettier | ✅ | configs Posto | igual | Copiar | P0 |
| 10.2 | Qualidade | Vitest configurado | ✅ | configs Posto | igual | Copiar | P0 |
| 10.3 | Qualidade | CI/CD (GitHub Actions) | ❌ | inexistente | `.github/workflows/` | Criar | P1 |
| 10.4 | Qualidade | E2E tests (Playwright) | ❌ | inexistente | `apps/web-e2e/` | Criar | P2 |
| 10.5 | Qualidade | Cobertura mínima 50% (módulos críticos) | ❌ | parcial | — | Escrever testes | P2 |
| **DEPLOY E INFRA** ||||||||
| 11.1 | Deploy | Configuração de produção | ✅ | `docker-compose.prod.yml` | igual | Copiar | P1 |
| 11.2 | Deploy | Backup automatizado Postgres | ❌ | inexistente | `infra/backups/` | Configurar | P1 |
| 11.3 | Deploy | Logs centralizados (futuro) | ❌ | só Pino local | infra externa | Configurar | P2 |
| 11.4 | Deploy | Monitoring (uptime, latência) | ❌ | inexistente | infra externa | Configurar | P2 |

> **Resumo numérico:** dos 156 itens, **~110 são copy-paste/baixo esforço**, **~25 precisam migração com adaptação**, **~21 são construção do zero**. O sistema está **70% pronto** para o salvage.

---

## 10. Fases de Construção

> **Princípio:** vertical fina end-to-end em cada fase. Cada fase entrega algo **demonstrável**.

### Fase 0 — Fundação (2-3 semanas)

**Objetivo:** monorepo HABILIS instalado, banco rodando, login interno funcionando, super admin gerenciando tenants.

**Entregáveis:**
- Monorepo `/HABILIS/` com `apps/web`, `apps/api`, `apps/worker`, `packages/{schemas,types,ui,utils}`
- Docker Compose com Postgres + Redis + MinIO operacionais
- Schema Prisma com 71 models migrados, seeds rodando
- Autenticação JWT + iron-session funcionando
- Login interno + 7 perfis de acesso ativos
- Super admin: criar tenant, criar usuários, vincular ao empreendimento
- Tema Hábilis Intelligence aplicado (azul marinho + âmbar)

**Salvage envolvido:** 95% de copy-paste do Posto/sistema; tema vem do Intelligence.

**Dependências:** nenhuma — é a primeira fase.

**Risco principal:** padronizar versões (TS, Tailwind, Recharts). **Mitigação:** definir versões antes da primeira linha.

**Pronto quando:** super admin loga, cria tenant + usuário + empreendimento, e isso aparece no dashboard.

---

### Fase 1 — Vertical Fina: Diagnóstico → Obrigações → Calendário (3-4 semanas)

**Objetivo:** **prova-de-sistema** — um analista cadastra um empreendimento, roda o diagnóstico, vê obrigações, vê prazos no calendário, recebe alerta.

**Entregáveis:**
- Cadastro completo de Empreendimento (UI + API)
- `packages/engine` operacional (motor de decisão migrado)
- Endpoint `/api/diagnostico/:empreendimentoId` que roda o motor
- UI de Diagnóstico com matriz de obrigações resultante
- Geração automática de Condicionantes a partir das obrigações
- Calendário consolidado com prazos
- Worker `vencimentos.scheduler.ts` rodando e gerando alertas
- Central de alertas funcional
- Documentos: upload S3, validade, alertas

**Salvage envolvido:**
- Schema Prisma (✅)
- Módulos API: empreendimentos, documentos, alertas, tarefas, condicionantes (✅)
- Páginas: empreendimentos, calendário, alertas, documentos, condicionantes (✅)
- Motor: 8 arquivos do Intelligence (🟡 — migrar)
- UI Diagnóstico: criar do zero (❌)

**Dependências:** Fase 0.

**Risco principal:** integração do motor com o backend. **Mitigação:** começar pelo motor isolado em `packages/engine` com testes unitários antes de expor via API.

**Pronto quando:** cadastra-se "Posto Alvorada" em GO, roda diagnóstico, sai matriz de obrigações com 15-25 itens, calendário mostra todos os prazos, alerta D-90 dispara para um item de teste.

---

### Fase 2 — Comercial: CRM + Triagem + Orçamento (2-3 semanas)

**Objetivo:** funil comercial operacional do lead à proposta.

**Entregáveis:**
- WhatsApp webhook + dual-mode (lead/compliance)
- CRM Kanban com estágios
- Tela de Lead detalhe com follow-ups + mensagens unificadas
- Triagem rápida (wizard pré-diagnóstico)
- Motor de Orçamento + UI
- Métricas de conversão

**Salvage envolvido:**
- API CRM, WhatsApp (✅)
- Web WhatsApp Panel (✅)
- Web CRM (✅)
- Triagem UI: criar (❌)
- Orçamento UI: criar (❌)
- Motor de orçamento: migrar do Intelligence (🟡)

**Dependências:** Fase 0 (auth, tenants).

**Risco principal:** Z-API depende de configuração externa. **Mitigação:** mockar webhook em dev; validar em staging.

**Pronto quando:** lead chega via WhatsApp → vira lead no Kanban → triagem → orçamento gerado → enviado por e-mail.

---

### Fase 3 — Operação Plena: Atuações + Documentos + Tarefas + Auditoria (2 semanas)

**Objetivo:** dia a dia do analista totalmente funcional.

**Entregáveis:**
- Atuações (registro técnico de visitas, pareceres, reuniões)
- Tarefas com kanban + escalonamento + dependências
- Evidências (upload, foto, texto, link)
- Audit Trail completo (toda mutação registrada)
- Eventos Regulatórios (timeline)

**Salvage envolvido:** Tarefas, Auditoria, Documentos (✅); Atuações + Eventos: criar (❌).

**Dependências:** Fase 1.

**Pronto quando:** analista registra visita ao empreendimento, anexa foto, marca tarefa de "redação de relatório" como em andamento, sistema escala se passar de prazo, tudo aparece no audit log.

---

### Fase 4 — Módulos Especiais: SST + Logística Reversa + Estanqueidade + ANP + Outorga + Monitoramento + Fiscalizações (3-4 semanas)

**Objetivo:** todos os domínios regulatórios cobertos.

**Entregáveis:**
- SST: funcionários, ASOs, treinamentos, EPIs, documentos PGR/PCMSO/LTCAT
- Logística Reversa: MTRs, CCRs, PGRS, metas, **com ingestão da base Recicla Goiás**
- Estanqueidade: tanques, testes, **com ingestão da base SASC**
- ANP/INMETRO: bombas, calibrações, histórico
- Outorga Hídrica: poços, laudos
- Monitoramento Ambiental: campanhas, parâmetros, VMP
- Fiscalizações: autos, recursos, defesa técnica (com IA Claude)

**Salvage envolvido:** quase tudo já existe no Posto (✅); ingestão de base Estanq+LR é o item novo (❌ — schema das tabelas).

**Dependências:** Fase 1.

**Risco principal:** desenhar schema correto para as bases Estanqueidade e Logística Reversa. **Mitigação:** começar pela LR (mais simples — JSON já estruturado em nós); Estanqueidade depois.

**Pronto quando:** os 7 módulos especiais estão acessíveis no menu, com listagem, detalhe, alertas integrados ao calendário.

---

### Fase 5 — IA e Automações: Agentes + Workers IA (2-3 semanas)

**Objetivo:** IA produtiva integrada.

**Entregáveis:**
- Worker `ai.processor.ts` migrado e operacional
- Geração de defesa técnica via Claude no detalhe do auto
- Pipeline dos 4 agentes orquestrado (acionamento manual)
- Tela "Agentes IA" para Diretor Técnico disparar pipeline
- Análise de Diário Oficial automática
- Digest semanal por e-mail
- Detecção de anomalia VMP
- Extração de dados de PDF (laudos, ARTs)

**Salvage envolvido:** worker IA básico (✅); orquestração 4 agentes (❌).

**Dependências:** Fases 1-4.

**Pronto quando:** auto de infração entra → "Gerar com IA" produz rascunho técnico em <30s; pipeline de agentes roda do tema "PGRSS-GO" e produz output operacional validado.

---

### Fase 6 — Portal Externo Completo (1-2 semanas)

**Objetivo:** cliente final acessa o próprio empreendimento.

**Entregáveis:**
- Magic link via e-mail
- 7 páginas do portal (início, alertas, condicionantes, tarefas, checklists, documentos, mensagens)
- Notificações por e-mail quando analista envia mensagem
- Conformidade visual com identidade Hábilis

**Salvage envolvido:** quase tudo existe (✅).

**Dependências:** Fases 1, 3, 4.

**Pronto quando:** representante do Posto Alvorada recebe link → loga sem senha → vê o que está vencendo → responde checklist → conversa com analista.

---

### Fase 7 — Relatórios e Analytics (2 semanas)

**Objetivo:** exportações profissionais para clientes e uso interno.

**Entregáveis:**
- Relatórios PDF: Compliance Geral, Vencimentos, SST, Monitoramento
- Relatórios Excel: Logística Reversa, Autuações
- Painel Executivo (cockpit) consolidado
- Score de Risco operacional
- Compliance Snapshots históricos

**Salvage envolvido:** módulo relatórios + processor (✅); cockpit + risco + compliance (✅).

**Dependências:** Fase 4.

**Pronto quando:** Diretor Técnico solicita "Relatório Compliance Q1 da rede" → recebe e-mail em 2-3 minutos com PDF pronto.

---

### Fase 8 — Migração de Cliente Real (Z+Z América) (2 semanas)

**Objetivo:** validar tudo com um cliente real operacional.

**Entregáveis:**
- Tenant Z+Z criado
- Auto Posto Guapó cadastrado
- Documentação histórica importada
- Procurações cadastradas
- Cliente operando 100% no novo sistema (sistema antigo desligado)

**Dependências:** todas as fases anteriores.

**Pronto quando:** Z+Z América continua operando sem o sistema antigo por 2 semanas sem incidentes.

---

### Cronograma Resumido

```
Fase 0 (Fundação)               ████  (2-3 sem)
Fase 1 (Vertical Diag→Cal)          ██████  (3-4 sem)
Fase 2 (Comercial)                       ████  (2-3 sem)
Fase 3 (Operação Plena)                      ███  (2 sem)
Fase 4 (Módulos Especiais)                       ██████  (3-4 sem)
Fase 5 (IA e Automações)                              ████  (2-3 sem)
Fase 6 (Portal Externo)                                    ██  (1-2 sem)
Fase 7 (Relatórios)                                          ███  (2 sem)
Fase 8 (Migração Z+Z)                                            ███  (2 sem)
                                  └──────────────────────────────────┘
                                            ~5-6 meses total
```

---

## 11. Critérios de Pronto

> **O sistema está em produção quando todas as caixas abaixo estão marcadas.**

### 11.1 Critérios Funcionais

- [ ] Todos os 30 módulos da Seção 3 acessíveis e operacionais
- [ ] Diagnóstico regulatório roda em <5s para qualquer empreendimento
- [ ] Calendário mostra todos os prazos (de qualquer módulo) consolidados
- [ ] Alertas chegam por e-mail e WhatsApp conforme RegraAutomatica
- [ ] Defesa técnica via IA gera rascunho em <30s
- [ ] Portal externo permite ao representante: ver, baixar, responder, mensagem
- [ ] Relatórios PDF e Excel geram e chegam por e-mail em <5min
- [ ] Multi-tenant: 0 vazamentos de dados cross-tenant em testes
- [ ] Audit trail registra 100% das mutações relevantes

### 11.2 Critérios de Qualidade

- [ ] Zero erros TypeScript em todo o monorepo (`pnpm typecheck`)
- [ ] ESLint passa sem warnings
- [ ] Cobertura ≥ 50% nos módulos críticos (engine, alertas, auth, tarefas)
- [ ] Testes E2E (Playwright) cobrem 5 fluxos críticos
- [ ] Todos os schemas validados com Zod (input + output)
- [ ] Todas as queries filtram por tenantId

### 11.3 Critérios Operacionais

- [ ] Deploy automatizado (CI/CD)
- [ ] Backup diário do Postgres
- [ ] Logs estruturados (Pino)
- [ ] Monitoramento de uptime (≥99.5%)
- [ ] Alertas de erro server-side (Sentry ou equivalente)
- [ ] Documentação de API gerada (Swagger)
- [ ] Runbook de incidentes (o que fazer se X cair)
- [ ] Plano de recuperação de desastre testado

### 11.4 Critérios de Migração

- [ ] Z+Z América rodando 100% no novo, com sistema antigo congelado
- [ ] Zero perda de prazo durante migração
- [ ] Treinamento da equipe Hábilis concluído
- [ ] Documentação interna do operador (analista) escrita
- [ ] Manual do representante (cliente final) escrito

---

## 12. Riscos e Decisões em Aberto

| # | Risco / Decisão | Descrição | Impacto | Quando precisa decidir |
|---|---|---|---|---|
| R1 | **Identidade visual final** | Migrar tema Intelligence (azul marinho + âmbar) exige design tokens consolidados | Médio (re-trabalho de UI) | Antes da Fase 0 |
| R2 | **Z+Z América no repo público** | Dados reais de cliente em pasta sem `.gitignore` adequado | Alto (LGPD, sigilo) | Antes da Fase 0 |
| R3 | **Versão Recharts (v2 vs v3)** | Intelligence v2, Posto v3 — incompatíveis | Baixo (novo projeto adota v3) | Já decidido (v3) |
| R4 | **Fase IA → escopo** | 4 agentes podem virar projeto sozinho; risco de inflar Fase 5 | Médio | Início Fase 5 |
| R5 | **Esquemas de Estanqueidade e LR** | JSONs ricos, sem schema relacional definido | Médio (bloqueia Fase 4) | Início Fase 4 |
| R6 | **Performance do Postgres com 71 tabelas** | Pode demandar índices adicionais sob carga | Médio | Após Fase 4 |
| R7 | **Custos Anthropic API** | Defesas técnicas, análise DO, digest podem ser caros em escala | Médio (controle financeiro) | Início Fase 5 |
| R8 | **Custos Z-API WhatsApp** | Por mensagem em escala | Baixo-Médio | Início Fase 2 |
| R9 | **Equipe de desenvolvimento** | Você não codifica — depende de dev contratado ou IA | Crítico | Antes da Fase 0 |
| R10 | **Migração de clientes existentes (além de Z+Z)** | Não está mapeada | Alto (depois do MVP) | Pós Fase 8 |
| R11 | **Domínio próprio + SSL + e-mail transacional** | Infra externa para produção | Médio | Antes da Fase 6 |
| R12 | **Backup e disaster recovery** | Plano não definido | Alto | Antes da Fase 8 |
| R13 | **LGPD: anonimização, retenção, exportação de dados** | Compliance da própria plataforma com LGPD | Alto | Antes da Fase 8 |
| R14 | **Termo de uso e contrato com cliente** | Documentação legal não definida | Médio | Antes da Fase 8 |
| D1 | ⚠️ SUPOSIÇÃO **Estratégia de identidade Hábilis** | Adotar "Hábilis Intelligence" como nome único do produto | — | Confirmar com Diretor |
| D2 | ⚠️ SUPOSIÇÃO **Domínio do produto** | `app.habilis.com.br` ou similar | — | Confirmar |
| D3 | ⚠️ SUPOSIÇÃO **Planos de cobrança** | STARTER/PRO/ENTERPRISE já no schema; preços a definir | — | Antes Fase 0 |
| D4 | **Modelo de hospedagem** | VPS próprio? AWS? Railway? Render? | Médio | Antes Fase 8 |

---

## ANEXO — Próximos Passos Imediatos (Pós-aprovação deste documento)

1. **Decidir os 4 itens em aberto da conversa anterior**
   - Stack final = Posto/sistema (Next 15 + Fastify + Postgres + Prisma + iron-session + BullMQ + MinIO + Claude API)?
   - Identidade visual = Hábilis Intelligence (azul marinho + âmbar)?
   - Z+Z América mover para repo privado antes do início?
   - Estilo de execução = (b) Por camadas (recomendado) ou outro?

2. **Mover Z+Z América para fora do repo principal** (proteção de dados)

3. **Limpar duplicatas** (`HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL (2)/`, HTMLs órfãos)

4. **Setar a pasta `/HABILIS/` como worktree** com Git inicializado

5. **Iniciar Fase 0** — montagem do monorepo a partir do salvage

---

*Fim do documento — Versão 1.0, 2026-04-27*
*Próximas revisões: ao fim de cada fase concluída*
