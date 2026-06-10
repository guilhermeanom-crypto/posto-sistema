# 01_LEVANTAMENTO_PASTAS_EXTERNAS

## 1. Resumo executivo

Foram encontradas e auditadas 11 pastas na raiz do workspace (excluindo o projeto oficial).
Destas, **5 possuem altíssimo potencial de aproveitamento** (`INTERFACE`, `posto-compliance-unico`, `ITECOLOGICA`, `HABILIS_AI`, `HABILIS`), trazendo soluções maduras para as lacunas do projeto oficial, especialmente em CRM, comercial, orçamentos, inteligência regulatória e integrações.
Existem **3 pastas ricas em conteúdo técnico e de referência** (`Estanqueidade`, `Logística Reversa`, `Z+Z - América`), úteis para abastecer o banco de dados e os prompts de IA, mas que não contêm código de aplicação a ser migrado.
Por fim, **3 pastas parecem ser apenas protótipos antigos, estudos ou legado** (`Node`, `PROJETO G.P`, duplicatas) e devem ser arquivadas.

A principal descoberta é que a arquitetura comercial, o funil de CRM avançado, o motor de orçamentos e a orquestração de analistas já existem e estão implementados em `INTERFACE` e nos backends baseados em Supabase (`posto-compliance-unico`, `ITECOLOGICA`). O desafio principal da consolidação será fundir esse frontend/backend descentralizado (Vite + Supabase) com a stack do projeto oficial (Next.js + Prisma + Fastify).

---

## 2. Mapa geral das pastas

| Pasta | Tipo | Stack | Status | Relação com o projeto oficial | Potencial de aproveitamento |
|---|---|---|---|---|---|
| `INTERFACE` | Frontend Full | Vite, React, Supabase | Funcional | Complementar (Comercial, Engine, UI) | Alto |
| `posto-compliance-unico` | Backend/Fullstack | Supabase (SQL/Functions), HTML/JS | Funcional | Complementar (CRM estruturado, Handoff) | Alto |
| `ITECOLOGICA` | Fullstack | Supabase, HTML/JS, Docs | Funcional | Complementar (Portal, CRM, Transplante) | Alto |
| `HABILIS_AI` | Scripts/IA | Python, Prompts TXT, JSON | Funcional | Complementar (Pipelines de IA, Relatórios) | Alto |
| `HABILIS` | Documentação | Markdown | Documentação | Norteador arquitetural avançado | Alto |
| `Estanqueidade` | Conhecimento | HTML, Markdown, JSON | Documentação | Base de conhecimento SASC/Checklists | Médio |
| `Logística Reversa` | Conhecimento | HTML, JSON, Excel | Documentação | Base de conhecimento e fluxos | Médio |
| `Z+Z - América` | Dados de Cliente | Documentos, HTML | Documentação | Exemplo real de relatórios e painéis | Médio |
| `Extintores_Posto_Habilis` | Conhecimento | HTML | Documentação | Base de conhecimento técnica | Baixo |
| `Node` | Estudo | Node.js, JS | Protótipo | Sem relação | Nenhum |
| `PROJETO G.P` | Protótipos UI | HTML | Legado | Desatualizado | Nenhum |

---

## 3. Auditoria individual de cada pasta

### INTERFACE (`enviro-clarity-main`)
#### Caminho
`/home/guilherme/Projetos VS CODE/INTERFACE/enviro-clarity-main`
#### Finalidade aparente
Frontend "Hábilis Intelligence". Trata-se de uma aplicação React madura voltada para a gestão comercial, inteligência regulatória, triagem, motor de orçamento e CRM.
#### Stack identificada
React 18, Vite, TypeScript, Tailwind, shadcn/ui, Supabase (auth/db).
#### Estrutura encontrada
Mais de 200 componentes, 40 páginas. Pasta `src/lib/` contém a lógica rica de `proposal-generator.ts`, `regulatory-commercial-framework.ts`, `regulatory-engine.ts`.
#### Conteúdo útil encontrado
- Telas completas de CRM, Triagem Comercial, Motor de Orçamentos, Diagnóstico.
- Engine de regras regulatórias (`regulatory-engine.ts`).
- Componentes de UI muito ricos (shadcn customizado).
- Geração de PDF no frontend (jsPDF).
#### Comparação com o projeto oficial
O projeto oficial é forte no "pós-venda" e operação. A pasta `INTERFACE` é excepcionalmente forte no "pré-venda", orçamentação inteligente baseada em CNAE, e UX visual.
#### O que pode ser aproveitado
Telas de orçamento, triagem, componentes visuais, lógica de regras e serviços canônicos.
#### O que não deve ser aproveitado
A conexão direta com Supabase no frontend (deve ser roteada pela API Fastify do projeto oficial).
#### Riscos
Conflito de stack: Vite/React Query vs Next.js Server Components.
#### Classificação final
Migrar parcialmente (refatorando a camada de dados).

### posto-compliance-unico
#### Caminho
`/home/guilherme/Projetos VS CODE/posto-compliance-unico`
#### Finalidade aparente
Backend Supabase focado em CRM, "Handoff" operacional, e Área do Analista.
#### Stack identificada
Supabase Edge Functions (Deno/TypeScript), SQL migrations, Frontend vanilla (HTML/JS/CSS).
#### Estrutura encontrada
`backend/supabase/functions`, `schema.sql` completo para CRM (`crm_leads_public`, `crm_operational_handoffs`), `domain/diagnostic`.
#### Conteúdo útil encontrado
- Schemas SQL muito bem definidos para CRM e Handoff.
- Lógica de diagnóstico estruturada (`decision-engine.ts`).
- Prompts de IA refinados (`agente_01`, `02`, etc).
#### Comparação com o projeto oficial
Preenche a lacuna exata de como um Lead vira um Projeto Operacional ("Handoff"). O projeto oficial tem CRM básico, mas este tem o esquema de integração.
#### O que pode ser aproveitado
Modelagem de dados SQL, tipos de domínio (diagnostic), prompts de IA.
#### O que não deve ser aproveitado
Frontend em vanilla JS, Edge Functions puras (devem virar rotas no Fastify).
#### Riscos
A lógica de negócio está espalhada em Edge Functions do Supabase.
#### Classificação final
Usar como referência e refatorar lógica para API.

### ITECOLOGICA
#### Caminho
`/home/guilherme/Projetos VS CODE/ITECOLOGICA`
#### Finalidade aparente
Portal institucional, CRM e orquestração de unificação com a Hábilis.
#### Stack identificada
HTML/JS, Supabase. Markdown de planejamento.
#### Estrutura encontrada
Pastas `crm`, `docs`, `shared`. Vários `RUNBOOK` e planos de transplante.
#### Conteúdo útil encontrado
- Documentos de arquitetura detalhados planejando exatamente esta consolidação (`ORQUESTRACAO_HABILIS_ITECOLOGICA_V1.md`, `PLANO_EXECUCAO_CONSOLIDADA_V1.md`).
- Interfaces de CRM front.
#### Comparação com o projeto oficial
Traz o planejamento arquitetural da integração e fluxos comerciais.
#### O que pode ser aproveitado
Os documentos de arquitetura são o verdadeiro tesouro aqui.
#### O que não deve ser aproveitado
O código HTML/JS legado.
#### Riscos
Documentos podem conflitar com decisões recentes do monorepo.
#### Classificação final
Arquivar código, manter `docs` como referência arquitetural.

### HABILIS_AI
#### Caminho
`/home/guilherme/Projetos VS CODE/HABILIS_AI`
#### Finalidade aparente
Pipeline de IA e geração de relatórios técnicos automatizados.
#### Stack identificada
Python, Markdown, JSON.
#### Estrutura encontrada
`agentes/` (prompts), `modelos/` (base de conhecimento), `scripts/` (geradores de PDF/HTML).
#### Conteúdo útil encontrado
- Textos de prompts refinados para 4 agentes (Coletor, Estruturador, Operacional, Auditor).
- Bases de conhecimento estruturadas.
- Scripts de montagem de relatório.
#### Comparação com o projeto oficial
O projeto oficial usa Claude via TS/Worker. Esta pasta tem a engenharia de prompt pronta e dados de teste excelentes.
#### O que pode ser aproveitado
Os prompts e as bases JSON.
#### O que não deve ser aproveitado
Os scripts Python (o projeto oficial usa TS no worker).
#### Riscos
Nenhum.
#### Classificação final
Migrar integralmente os artefatos de IA para a pasta do worker.

### HABILIS
#### Caminho
`/home/guilherme/Projetos VS CODE/HABILIS`
#### Finalidade aparente
Repositório de documentação arquitetural macro.
#### Stack identificada
Markdown.
#### Estrutura encontrada
Arquivos `ARQUITETURA_HABILIS.md`, `ARQUITETURA_HABILIS_LACUNAS.md`.
#### Conteúdo útil encontrado
- O plano diretor completo do sistema, incluindo modelagem de dados, LGPD, Billing, etc.
#### Comparação com o projeto oficial
É o "blueprint" do que o projeto oficial deve se tornar.
#### O que pode ser aproveitado
Tudo, deve ser movido para a pasta `docs/` do projeto oficial.
#### Classificação final
Migrar integralmente.

### Estanqueidade
#### Caminho
`/home/guilherme/Projetos VS CODE/Estanqueidade`
#### Finalidade aparente
Base de conhecimento técnica para o módulo de Estanqueidade (SASC).
#### Stack identificada
Markdown, HTML, JSON.
#### Estrutura encontrada
`HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL` (Matriz Regulatória, POPs, Checklists, Modelos).
#### Conteúdo útil encontrado
- Checklists de campo, árvore de decisão, modelos de laudo, base de conhecimento JSON profunda.
#### Comparação com o projeto oficial
O projeto oficial tem a tabela no banco, mas falta a riqueza técnica deste conteúdo para alimentar os templates e a IA.
#### O que pode ser aproveitado
JSON de base de conhecimento, textos de checklist e árvore de decisão.
#### Classificação final
Usar como referência e seed data.

### Z+Z - América
#### Caminho
`/home/guilherme/Projetos VS CODE/Z+Z - América`
#### Finalidade aparente
Dados reais de um cliente satélite (Auto Posto Guapó).
#### Estrutura encontrada
Painéis HTML gerados, PDFs, Documentação Recebida.
#### Conteúdo útil encontrado
- Exemplos reais de dashboards de cliente, laudos e documentos. Útil para validar o sistema com "mock data" realista.
#### O que pode ser aproveitado
Os dados para criar um Seed realista no Prisma.
#### Classificação final
Usar como referência de dados.

### Logística Reversa / Extintores_Posto_Habilis / Node / PROJETO G.P
#### Finalidade aparente
Estudos, manuais HTML consolidados, scripts isolados e protótipos UI antigos.
#### Classificação final
- `Logística Reversa`: Extrair JSON/Excel como referência de regras.
- `Extintores`: Usar HTML como referência técnica.
- `Node` e `PROJETO G.P`: Descartar/Arquivar.

---

## 4. Matriz de aproveitamento

| Pasta origem | Item encontrado | Tipo do item | Destino provável no projeto oficial | Ação recomendada | Prioridade |
|---|---|---|---|---|---|
| `INTERFACE` | Telas de Triagem e Orçamento | Tela/Componente | `apps/web/src/app/(app)/comercial` | Refatorar antes | Alta |
| `INTERFACE` | Componentes UI (Cards, Dashboards) | Componente | `apps/web/src/components/ui` | Migrar | Alta |
| `INTERFACE` | `regulatory-engine.ts`, `proposal-generator.ts` | Regra de negócio | `apps/api/src/modules/comercial` | Refatorar antes (TS -> Backend) | Alta |
| `posto-compliance-unico` | Schema SQL de CRM e Handoff | Schema/DB | `apps/api/prisma/schema.prisma` | Usar como referência | Alta |
| `posto-compliance-unico` | Types e Lógica Diagnóstica | Model/Domain | `packages/types` e API | Migrar | Média |
| `HABILIS_AI` | Prompts (`agente_01`, etc) | IA | `apps/worker/src/ai/prompts` | Migrar | Alta |
| `HABILIS_AI` | Modelos de conhecimento (JSON) | Dado/IA | `apps/worker/src/ai/knowledge` | Migrar | Alta |
| `HABILIS` | Docs Arquiteturais | Documento | `docs/arquitetura/` | Migrar | Alta |
| `ITECOLOGICA` | Docs de Orquestração | Documento | `docs/arquitetura/` | Migrar | Média |
| `Estanqueidade` | Checklists e Árvore Decisão | Checklist/Regra | Seed Prisma / Banco de dados | Refatorar antes | Média |
| `Logística Reversa` | Mapas Mentais (JSON) | Regra de negócio | Seed Prisma | Usar como referência | Baixa |

---

## 5. Lacunas do projeto oficial que as outras pastas podem preencher

| Lacuna | Existe algo nas pastas externas? | Onde foi encontrado | Qualidade | Recomendação |
|---|---|---|---|---|
| Contratos | **Sim** | `INTERFACE` (Modelos e geradores) | Muito Boa | Refatorar gerador para backend |
| Ordens de serviço | Parcial | `INTERFACE` e `posto-compliance-unico` | Boa | Usar modelos do Handoff |
| Entregáveis | Parcial | `HABILIS_AI` (Relatórios) | Alta (IA) | Conectar worker aos prompts do AI |
| Financeiro | **Sim** | `INTERFACE` (Motor de orçamento) | Excelente | Incorporar UX de orçamento |
| Serviços internos | **Sim** | `INTERFACE` (`habilis-services.ts`) | Excelente | Migrar catálogo para Seed/DB |
| CRM/comercial | **Sim** | `posto-compliance-unico` (Schema) e `INTERFACE` (Telas) | Excelente | Fundir SQL com Prisma, importar telas |
| Propostas | **Sim** | `INTERFACE` (`ProposalGenerator`) | Excelente | Migrar fluxo para app web |
| Relatórios | **Sim** | `HABILIS_AI` e Paineis HTML Z+Z | Excelente | Usar scripts IA + templates reais |
| Checklists | **Sim** | `Estanqueidade` | Muito Boa | Inserir no banco via Seed |
| Módulos técnicos | **Sim** | `Estanqueidade`, `Logística Reversa` | Boa (HTML/JSON) | Transformar em dados estruturados |
| IA | **Sim** | `HABILIS_AI` | Excelente | Substituir prompts simples por estes |
| Dashboards | **Sim** | `INTERFACE` | Muito Boa | Absorver gráficos Recharts |
| Componentes visuais| **Sim** | `INTERFACE` | Excelente | Mesclar libs shadcn |

---

## 6. Itens duplicados

| Pasta origem | Item duplicado | Item equivalente no projeto oficial | Qual versão parece melhor | Recomendação |
|---|---|---|---|---|
| `INTERFACE` | Auth/Routing | Next.js App Router | Next.js (Projeto Oficial) | Descartar Auth Supabase do INTERFACE |
| `ITECOLOGICA` | CRM Frontend HTML | Telas App Router | `INTERFACE` ou Projeto Oficial | Descartar legado |
| `posto-compliance-unico` | Banco de Dados Auth/Users | PostgreSQL Prisma | Prisma (Projeto Oficial) | Manter apenas regras de negócio/schema de CRM |

---

## 7. Itens superiores ao projeto oficial

- **Interface Visual (UI/UX) Comercial:** A UI da pasta `INTERFACE` é muito mais madura visualmente, com cards detalhados, cores semânticas e fluxos (Stepper) excelentes.
- **Motor de Orçamentos e Triagem:** A lógica de cruzamento de CNAE x Obrigações x Serviços da pasta `INTERFACE` (`regulatory-engine`) não tem paralelo no oficial.
- **Engenharia de Prompt:** Os agentes da pasta `HABILIS_AI` estão divididos em pipeline (Coletor -> Estruturador -> Operacional) o que é superior à abordagem monolítica.
- **Modelagem de Integração:** O SQL de `crm_operational_handoffs` do `posto-compliance-unico` resolve perfeitamente a ponte entre Comercial e Operação.

---

## 8. Itens que devem virar apenas referência

- Arquivos HTML gerados (`Estanqueidade`, `Z+Z - América`).
- JSONs de base de conhecimento (`base_conhecimento_estanqueidade.json`).
- Documentos PDF e planilhas de precificação (`Logística Reversa`).
- Schemas SQL raw do Supabase (devem ser transcritos para Prisma schema).

---

## 9. Itens que devem ser arquivados

- A pasta `PROJETO G.P` (protótipos de tela isolados e defasados).
- A pasta `Node` (apenas script de teste de estudo).
- Os frontends HTML/JS vanilla de `ITECOLOGICA` e `posto-compliance-unico/analista`.
- Cópias duplicadas exatas (ex: `HABILIS_ESTANQUEIDADE_SASC_V10_OFICIAL (2)`).

---

## 10. Recomendações para o plano de consolidação

### Onda 1 — Baixo risco (Conhecimento e Documentação)
1. Migrar a documentação arquitetural da pasta `HABILIS` e `ITECOLOGICA` para `docs/` do projeto oficial.
2. Copiar os arquivos de IA (Prompts e Modelos JSON) da pasta `HABILIS_AI` para `apps/worker/src/ai/`.
3. Usar os checklists de `Estanqueidade` para atualizar os Seeds do Prisma.

### Onda 2 — Médio risco (UI, Componentes e Catálogos)
1. Importar os componentes visuais ricos da pasta `INTERFACE/src/components/ui` para o projeto oficial.
2. Traduzir o catálogo canônico de serviços (`habilis-services.ts`) para Seed no banco oficial.
3. Transcrever a lógica do `regulatory-engine.ts` e `proposal-generator.ts` para Services no backend Fastify.

### Onda 3 — Alto risco (Banco, Autenticação e Domínio)
1. Integrar os schemas de CRM e Handoff do `posto-compliance-unico` (`schema.sql`) no arquivo `schema.prisma` oficial.
2. Migrar e adaptar as telas complexas de CRM, Triagem e Motor de Orçamento da pasta `INTERFACE` para o Next.js App Router do projeto oficial, apontando para a nova API Fastify em vez do Supabase.

### Onda 4 — Não migrar
1. Autenticação via Supabase e Edge Functions (já substituídos pelo padrão Fastify/Next do oficial).
2. Protótipos em Vanilla JS e projetos marcados como Legado.
