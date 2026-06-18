# 107 — INVENTÁRIO DO CONHECIMENTO DO WORKSPACE (o que existe e está se perdendo)

> Varredura read-only de `/home/guilherme/Projetos VS CODE/` (2026-06-17). Objetivo: mapear TODO o conhecimento construído à mão que vive fora do sistema e corre risco de se perder. Marcado: ✅ confirmado por arquivo · 🔎 inferido.

---

## 0. A constatação

O sistema no ar implementa **uma fatia** (o motor de diagnóstico por CNAE). O **núcleo intelectual** — o modelo de conhecimento, a metodologia de criação, os casos reais, as metodologias operacionais e os orçamentos reais — vive **espalhado em 15 pastas do workspace, fora do sistema.** É isto que está se perdendo.

---

## 1. Os 5 ativos CRÍTICOS que estão se perdendo

### A. O MODELO de conhecimento (a estrutura da "análise justificada") ✅
`HABILIS_AI/modelos/base_modelo_conhecimento.json` — **o esquema que você fez à mão** de um bloco de conhecimento normativo:
- `meta` (tema, versão, status_validacao, escopo_territorial)
- `base_oficial` (leis, decretos, INs, resoluções, normas técnicas, portarias, órgãos, sistemas oficiais, fontes oficiais)
- `enquadramento` (quem_se_sujeita, quando_aplica, quando_nao_aplica, critérios entrada/exclusão, objeto_obrigacao)
- `operacao` (fluxo_operacional, etapas_execucao, decisões_condicionais…)

👉 **Isto é exatamente a "análise justificada por fato" que você quer** — muito mais rico que o motor de CNAE atual. O motor é uma fatia disto.

### B. A METODOLOGIA de criação de conhecimento (os agentes) ✅
`HABILIS_AI/agentes/`: `agente_01_coletor`, `agente_02_estruturador`, `agente_03_operacional`, `agente_04_auditor` (prompts .txt). É a fábrica de conhecimento que você desenhou — e **com saídas reais** (ver C).

### C. CASOS REAIS já processados (a prova de que funciona) ✅
`HABILIS_AI/`: PGRSS Senador Canedo (input+output), Região Iturama/Indiaporã, Regularização Ambiental — pares input→output JSON reais + `relatorio_pgrss.md`. **A metodologia já rodou em casos reais.**

### D. O APP "Analista" (a UI da análise) ✅
`posto-compliance-unico/analista` e `analista_v2`: app de questionário/análise (modules/case-operations, state/questionnaire, ui/renderers, services/analyst-api). É o **fluxo caracterização→análise** num app dedicado — mais desenvolvido como ferramenta de analista do que a aba atual do sistema.

### E. CASO REAL DE CLIENTE + ORÇAMENTOS REAIS ✅
`Z+Z - América/PROJ_Z+Z_AMERICAPOSTO_GUAPÓ/`: documento consolidado, alinhamentos executivos (v1-v3), **cotações de terceiros reais** (ex.: `COT-2026-001_MCO_CONAMA273`), procuração modelo Hábilis. 👉 **Aqui estão os números reais** que respondem ao "orçamento não é fidedigno": custos reais de serviços CONAMA 273.

---

## 2. Metodologias operacionais completas (fora do sistema)

| Acervo | Conteúdo | Status |
|---|---|---|
| `Estanqueidade/HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL` ✅ | matriz regulatória + **POPs (POP-EST-01..05)** + checklists (pré/campo/pós) + ref. ABNT NBR 16795/2019 + fontes oficiais | só CRUD no sistema; metodologia **perdida** + **DUPLICADA** (pasta "(2)") |
| `Logística Reversa/` ✅ | manual Recicla Goiás + **Matriz_Precificacao_Logistica_Reversa_GO.xlsx** + mapa mental + nodes.json | fora do sistema |
| `Diretrizes de Licenciamento/07_referencias_externas` ✅ | **~300 PDFs/docx oficiais**: outorga/Veredas (83), SEMAD/órgãos (54: Lei 20.694, Decreto 9.710…), CNAE, CREA/ART, DAI, regularização fundiária/CAR | matéria-prima bruta, não carregada |

---

## 3. Mapa-mestra do workspace (todas as 15 pastas)

| Pasta | Arquivos | O que é | Valor | Status |
|---|---|---|---|---|
| `Diretrizes de Licenciamento` | 1001 (302 pdf, 307 docx, 205 md) | base normativa + governança + bruto | **ALTÍSSIMO** | referência viva |
| `Posto` | 1350 | o sistema atual + design/imagens | — | em produção |
| `posto-compliance-unico` | 141 | **sistema paralelo** com app **Analista** (v1/v2), backend, crm | **ALTO** | legado/perdido |
| `Z+Z - América` | 122 (51 pdf, 21 docx) | **caso real de cliente + cotações reais** | **ALTO** | perdido (só pasta) |
| `INTERFACE/enviro-clarity` | 276 | protótipo Lovable (CaracterizacaoPage, knowledge) | médio | referência |
| `HABILIS_AI` | 24 (9 json) | **modelo de conhecimento + agentes + casos reais** | **ALTÍSSIMO** | perdido (só pasta) |
| `ITECOLOGICA` + `ITECOLOGICA-copia` | 98+98 | plataforma maior (CRM/analista) | médio | **DUPLICADO** |
| `Estanqueidade` | 59 | metodologia SASC completa | **ALTO** | perdido + duplicado |
| `Mestra/Docs` | 7 md | VISÃO_MESTRA, DATA_MODEL, DECISIONS, INVENTARIO, VISION | meta-visão | referência |
| `Logística Reversa` | 10 | manual + matriz de preço | **ALTO** (preço) | perdido |
| `HABILIS` | 2 md | — | baixo | — |
| `Extintores_Posto_Habilis` | 1 | — | baixo | — |
| `PROJETO G.P` / `Node` | 6 / 2 | rascunho | baixo | — |

---

## 4. Duplicações e riscos (verificado)
- `ITECOLOGICA` × `ITECOLOGICA-copia` — cópia integral (98×98). Risco de divergência.
- `HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL` × `..._OFICIAL (2)` — duplicado.
- Conhecimento do mesmo tema em ≥3 lugares (ex.: estanqueidade em `Estanqueidade/`, em `Diretrizes/07/02`, e CRUD no sistema).

---

## 5. O que isto muda na leitura do projeto (neutro)

1. **A "análise justificada" que você quer já tem forma**: é o `base_modelo_conhecimento.json` (HABILIS_AI), não o motor de CNAE. O motor é um pedaço; o modelo completo é mais rico (base oficial + enquadramento + operação por tema).
2. **A metodologia de criação existe e já rodou** (agentes 01-04 + casos PGRSS/regularização reais).
3. **Os números reais de orçamento existem** (cotações Z+Z América; matriz de preço logística reversa) — o caminho para o "orçamento fidedigno" passa por estes dados reais, não por horas genéricas.
4. **Metodologias operacionais inteiras** (SASC com POPs/checklists) estão prontas e fora do sistema.
5. **Há um app Analista** (posto-compliance-unico) que é a UI da análise — anterior e mais focado.

---

## 6. Recomendação neutra (para parar a perda — antes de qualquer código)

1. **Este inventário (107) já é o primeiro passo**: o mapa existe; nada mais "some por esquecimento".
2. **Eleger o formato-canônico do conhecimento**: o `base_modelo_conhecimento.json` é forte candidato a "modelo oficial de bloco". Confirmar com você.
3. **Consolidar fisicamente (sem perder)**: resolver duplicações (ITECOLOGICA, SASC) e reunir os ativos críticos (A-E) num lugar versionado.
4. **Integrar por bloco, com cliente real** (alinha com docs/106 Passo 3): começar pelo tema que tem caso real pronto (PGRSS, ou Z+Z/posto), usando o modelo + a metodologia + os números reais já existentes.

> Não falta conhecimento — **sobra, espalhado.** O risco real é perder o que já foi feito à mão. Consolidar = reunir, desduplicar e eleger o modelo canônico, **antes** de produzir mais.

---

## 7. Onde olhar primeiro (atalhos)
- Modelo: `HABILIS_AI/modelos/base_modelo_conhecimento.json`
- Metodologia: `HABILIS_AI/agentes/*.txt`
- Caso real + custo: `Z+Z - América/PROJ_Z+Z_AMERICAPOSTO_GUAPÓ/`
- Metodologia SASC: `Estanqueidade/HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL/`
- Governança normativa: `Diretrizes de Licenciamento/02_governanca_normativa/`
- Visão-mestra: `Mestra/Docs/`
