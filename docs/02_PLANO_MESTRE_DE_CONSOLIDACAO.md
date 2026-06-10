# 02_PLANO_MESTRE_DE_CONSOLIDACAO

## 1. Resumo executivo

O projeto oficial (`/Posto/sistema`) possui um núcleo operacional maduro e funcional, incluindo autenticação multi-tenant, gestão de documentos, processos, tarefas, inteligência artificial integrada, worker (BullMQ) e infraestrutura baseada em Fastify, Prisma e Next.js. No entanto, possui lacunas evidentes na área comercial, pré-venda e gestão financeira, operando atualmente com dados híbridos ou mockados nas telas de gestão interna.

As pastas externas (especialmente `INTERFACE`, `posto-compliance-unico`, `HABILIS_AI`, `ITECOLOGICA` e `HABILIS`) trazem soluções ricas e maduras para essas exatas lacunas, oferecendo motor de orçamento, CRM estruturado, orquestração de handoff (comercial para operação), inteligência regulatória e dashboards superiores. Além disso, as pastas `Estanqueidade`, `Logística Reversa` e `Z+Z - América` contêm grande riqueza de conhecimento técnico (checklists, fluxos, modelos JSON) para popular a base.

A **Estratégia Geral de Consolidação** é incorporar a inteligência, dados e UX das pastas externas no projeto oficial, traduzindo lógicas descentralizadas (Vite/Supabase) para o padrão centralizado (Fastify/Prisma/Next.js). 

A **decisão central** é irrevogável: **manter `/Posto/sistema` como o núcleo oficial**. O código externo nunca substituirá a arquitetura base do monorepo; em vez disso, será absorvido e reescrito sob a forma de novos módulos, serviços, entidades e seeds.

## 2. Princípios obrigatórios da consolidação

1. **O projeto oficial não será substituído**: A base `Posto/sistema` é a fundação intocável.
2. **Nada será migrado diretamente sem comparação**: Código, estilos ou regras só entram se forem claramente superiores ou se preencherem lacunas.
3. **Código Supabase não será copiado cru para o projeto oficial**: Consultas e Auth do Supabase devem ser substituídas pelo padrão Prisma e Iron-Session do projeto oficial.
4. **Lógicas úteis serão reescritas para Fastify/Prisma/Next**: A lógica de cliente (`INTERFACE`) vai para o backend (`Fastify`); a UX vai para os Server Components (`Next`).
5. **HTML/JS legado não será migrado como aplicação**: Frontends de protótipo (`ITECOLOGICA`, `posto-compliance-unico/analista`) não se tornarão rotas diretas, mas sim referências.
6. **Prompts, JSONs, checklists e docs podem ser migrados como base de conhecimento**: A serem consumidos pelo Worker ou salvos via Seeds.
7. **Banco só será alterado após desenho de domínio**: O Prisma schema só será tocado quando a entidade for validada, evitando tabelas órfãs.
8. **Telas só serão migradas quando houver API e entidade correspondentes**: UX sem backend não deve entrar no App Router.
9. **Componentes visuais só entram se não duplicarem padrões já existentes**: Evitar choque de bibliotecas shadcn/ui.
10. **Toda migração deve ser documentada**: Atualizar `walkthrough.md` ou changelog do projeto oficial a cada onda concluída.

## 3. Classificação das fontes externas

| Pasta origem | Classificação | Papel na consolidação | Ação |
|---|---|---|---|
| `INTERFACE` | Migrar código refatorado | Motor comercial, orçamento, UX e catálogo de serviços | Refatorar para Fastify/Next |
| `posto-compliance-unico` | Migrar código refatorado | Schema de CRM, Handoff e engine de diagnóstico | Converter SQL para Prisma, refs de IA |
| `ITECOLOGICA` | Migrar documentação | Docs de arquitetura, transplante e planos de ação | Copiar docs, arquivar HTML legado |
| `HABILIS_AI` | Migrar base de IA | Prompts, scripts refinados e models de conhecimento (JSON) | Migrar para o worker/IA |
| `HABILIS` | Migrar documentação | Docs de arquitetura, plano de negócios, lacunas | Copiar para `docs/arquitetura/` |
| `Estanqueidade` | Migrar como seed | Checklists, POPs, árvores de decisão e matriz regulatória | Extrair texto e JSON para DB |
| `Logística Reversa` | Usar como referência | Mapas mentais, fluxos e tabelas de precificação | Estudo para regras do motor |
| `Z+Z - América` | Usar como referência | Documentos reais para validar a consistência do sistema | Usar como mock data / testes |
| `Extintores_Posto_Habilis` | Usar como referência | HTMLs técnicos e manuais | Consulta técnica futura |
| `Node` | Arquivar | Scripts e testes legados | Nenhuma |
| `PROJETO G.P` | Descartar após backup | Protótipos HTML desatualizados | Remover do fluxo de trabalho |

## 4. Mapa de lacunas do projeto oficial

| Lacuna do projeto oficial | Situação atual | Fonte externa que ajuda | Solução proposta | Prioridade |
|---|---|---|---|---|
| Contratos | Mockado/Inexistente | `INTERFACE` (gerador) | Criar entidade e refatorar `proposal-generator.ts` | Alta |
| Ordens de serviço | Híbrido | `posto-compliance-unico` | Desenhar `OrdemServico` a partir do `handoff` | Alta |
| Entregáveis | Híbrido | `HABILIS_AI` (Relatórios) | Entidade de Entregável e vincular geração no worker | Alta |
| Financeiro | Mockado | `INTERFACE` | Tabela `FinanceiroResumo`, UX de orçamento da INTERFACE | Média |
| Serviços internos | Estático | `INTERFACE` (`habilis-services.ts`) | Transformar em `ServicoCatalogo` via Seed | Alta |
| CRM/comercial | Básico | `posto-compliance-unico` e `INTERFACE` | Converter `crm_leads_public` em Prisma, absorver UI CRM | Alta |
| Propostas | Inexistente | `INTERFACE` (`ProposalGenerator`) | Entidade `Proposta` + PDF Generator no Backend | Alta |
| Motor de orçamento | Mockado / Seed demo | `INTERFACE` | Levar `regulatory-engine.ts` para a API Fastify | Alta |
| Handoff comercial → operação | Inexistente | `posto-compliance-unico` | Converter `crm_operational_handoffs` p/ Prisma | Alta |
| IA/análise documental | Funcional básico | `HABILIS_AI` | Integrar agentes pipeline (Coletor->Auditor) | Média |
| Relatórios | Subconjunto restrito | `Z+Z - América`, `HABILIS_AI` | Incorporar templates reais em rotas PDF | Média |
| Checklists técnicos | Básicos | `Estanqueidade` | Refinar model `ChecklistTemplate` com estes dados | Média |
| Estanqueidade | Estrutura relacional | `Estanqueidade` | Popular dados de SASC usando a base JSON externa | Média |
| Logística reversa | Básico | `Logística Reversa` | Extrair lógica do JSON nodes para regras API | Baixa |
| Extintores | Inexistente | `Extintores_Posto_Habilis` | Usar como base caso precise de módulo específico | Baixa |
| Dashboards | Bons | `INTERFACE` | Absorver componentes do `AnalysisDashboard.tsx` | Baixa |
| Componentes visuais | Básicos/shadcn | `INTERFACE` | Unificar componentes na pasta `packages/ui` ou `web`| Alta |
| Documentação arquitetural | Defasada | `HABILIS`, `ITECOLOGICA` | Juntar tudo na pasta `docs` do oficial | Alta |
| Seeds regulatórios | Incompletos | `Estanqueidade`, `INTERFACE` | Popular catálogos base com estes novos dados | Alta |

## 5. Plano por ondas

### Onda 1 — Baixo risco: documentação, IA e conhecimento
**Objetivo:** migrar conhecimento sem afetar o funcionamento do sistema.
*   **Migrar documentação útil de `HABILIS` para `docs/arquitetura`**: Origem `HABILIS/*`, destino `Posto/sistema/docs/arquitetura/`. Risco: Nulo. Aceite: Docs consolidados e lidos.
*   **Migrar documentos estratégicos de `ITECOLOGICA` para `docs/arquitetura/referencias`**: Origem `ITECOLOGICA/docs/*`, destino `Posto/sistema/docs/arquitetura/referencias/`. Risco: Nulo. Aceite: Disponível para consulta.
*   **Migrar prompts de `HABILIS_AI` para uma pasta adequada do worker**: Origem `HABILIS_AI/agentes/`, destino `apps/worker/src/ai/prompts/`. Risco: Baixo. Aceite: Prompts no repo.
*   **Migrar bases JSON úteis para uma pasta de knowledge base**: Origem `HABILIS_AI/modelos/` e `Estanqueidade`, destino `apps/worker/src/ai/knowledge/`. Risco: Baixo. Aceite: Worker com acesso aos dados.
*   **Extrair checklists de `Estanqueidade`**: Analisar e transformar em JSON/CSV de Seed.
*   **Extrair regras de `Logística Reversa`**: Analisar e documentar localmente para o engine.
*   **Organizar exemplos de `Z+Z - América` como referência de caso real**: Colocar em `docs/exemplos/`.

### Onda 2 — Médio risco: serviços, orçamento e UI comercial
**Objetivo:** consolidar a camada comercial sem mexer em auth ou core operacional.
*   **Analisar `INTERFACE/src/lib/habilis-services.ts`**: Ler os serviços.
*   **Transformar catálogo de serviços em seed ou entidade oficial**: Entidade `ServicoCatalogo`. APIs: `GET /api/v1/servicos`. Risco: Baixo.
*   **Refatorar `regulatory-engine.ts` para service no backend**: Criar lógica no módulo `apps/api/src/modules/comercial`. Risco: Médio (tradução TypeScript/Vite para Fastify).
*   **Refatorar `proposal-generator.ts` para service no backend**: Geração de proposta server-side. Risco: Médio.
*   **Recriar telas de triagem/orçamento no Next.js App Router**: Levar UX do `MotorOrcamentoPage.tsx` para `apps/web/src/app/(app)/comercial/`. Telas: `/comercial/orcamento`. Risco: Médio (choque de states locais vs Server Actions).
*   **Aproveitar componentes visuais da `INTERFACE` apenas quando superiores aos atuais**: Componentes shadcn do `INTERFACE/src/components/ui`.

### Onda 3 — Alto risco: CRM avançado, handoff, contratos e financeiro
**Objetivo:** criar o domínio comercial real, alterando banco de dados.
*   **Estudar schema SQL de CRM/handoff do `posto-compliance-unico`**: Ler `schema.sql`.
*   **Converter o que fizer sentido para Prisma**: Entidades `Lead`, `HandoffOperacional`.
*   **Criar entidades reais para**:
    *   `Contrato`, `OrdemServico`, `Entregavel`, `Proposta`, `ItemProposta`, `Receita`, `Custo`, `FinanceiroResumo`, `HandoffOperacional`.
*   **Integrar CRM atual com handoff operacional**: Fazer API do funil gerar o Handoff.
*   **Permitir que lead ganho vire operação real**: Handoff cria `Empreendimento` e as `Tarefas` bases (OS).
*   **Conectar fluxo**: orçamento → proposta → contrato → OS → entregável → financeiro.
*   **Riscos**: Quebrar relacionamentos do Prisma (porcentagem grande de alterações no Schema). Exige backup e forte teste das migrations (`db:migrate`).

### Onda 4 — Arquivamento e limpeza
**Objetivo:** separar legado e impedir confusão futura.
*   **Arquivar `Node` e `PROJETO G.P`**: Remover da visão do explorador (mover para backup externo).
*   **Arquivar HTML/JS legado não aproveitado**: `ITECOLOGICA/crm`, `posto-compliance-unico/analista`.
*   **Marcar Supabase legado como referência, não como sistema ativo**: Não subir projeto do Supabase.
*   **Criar política de `/legacy`**: Pasta exclusiva isolada do build.
*   **Criar índice do que foi arquivado**.

## 6. Modelo de domínio comercial proposto

*   **Lead**: Prospects advindos da landing page. Relações: Origina Proposta/Diagnostico. (Baseado em `crm_leads_public`).
*   **DiagnosticoComercial**: Coleta de dados (respostas de formulário, CNAE). (Vem do `posto-compliance-unico`).
*   **AnaliseRegulatoriaComercial**: Saída do engine regulatório (Riscos, serviços sugeridos). (Vem de `regulatory-engine.ts`).
*   **ServicoCatalogo**: Dicionário base de serviços ofertados (Preço, nome, categoria). (Vem de `habilis-services.ts`).
*   **Proposta**: Agrupador de Itens de Serviço para um Lead. Relações: Tem vários `ItemProposta`. (Vem de `proposal-generator.ts`).
*   **ItemProposta**: Serviço específico sugerido com valor calculado.
*   **RegraPrecificacao**: Multiplicadores (Complexidade, etc) aplicados na Proposta.
*   **Contrato**: Efetivação da Proposta aceita. Relações: 1 Proposta -> 1 Contrato -> N Ordens de Serviço. Lacuna: Substituto das telas mockadas `contratos`.
*   **OrdemServico**: Pote de tarefas agrupadas para a equipe realizar com prazo. Relações: Pertence ao Contrato. Lacuna: Substituto de `ordens-servico`.
*   **Entregavel**: Produto final (PDF, Laudo) fruto de uma OS. (Lacuna `entregaveis`).
*   **HandoffOperacional**: Registro da transição entre Comercial e Operação. (Vem de `crm_operational_handoffs`).
*   **Faturamento / Receita / Custo / Margem**: Entidades financeiras por Empreendimento/OS. Lacuna: Substituto de `financeiro`.

## 7. Arquitetura de destino

A estrutura permanece firme no padrão do monorepo oficial:
*   **Frontend**: `apps/web` (Next.js 15). Onde entram as telas ricas da pasta INTERFACE.
*   **Backend**: `apps/api` (Fastify 4). Onde rodam as lógicas de engine regulatório, geração de PDF (server-side) e handoff de Supabase.
*   **Worker**: `apps/worker` (BullMQ/Node). Absorverá os prompts de IA e os modelos da `HABILIS_AI`.
*   **Shared**: `packages/types`, `packages/schemas`, `packages/utils` receberão tipos de Domínio Comercial.
*   **Banco**: PostgreSQL orquestrado **estritamente pelo Prisma** (`apps/api/prisma/schema.prisma`). SQLs manuais do Supabase não existirão na produção, serão todos traduzidos para Prisma migrations.
*   Nenhuma lógica da IA rodará direto no navegador. O frontend pede à API, a API enfileira no Worker.
*   As Edge Functions do Supabase deixam de existir, sendo encapsuladas como módulos em `apps/api/src/modules/crm/`.

## 8. Plano de migração técnica

### Sprint 1 — Preparação e segurança
- [ ] Criar backup lógico (dump local do DB).
- [ ] Criar branch de consolidação (`feature/consolidation-master`).
- [ ] Atualizar documentação base (`docs/arquitetura/`).
- [ ] Criar pasta de referências em `docs/referencias_externas`.
- [ ] Definir política de legado e mover pastas para backup.

### Sprint 2 — Conhecimento e IA
- [ ] Migrar prompts TXT para `apps/worker/src/ai/prompts`.
- [ ] Migrar bases JSON para `apps/worker/src/ai/knowledge`.
- [ ] Registrar fontes (atualizar README interno da IA).
- [ ] Validar uso no worker (conferir se os caminhos dos arquivos funcionam).

### Sprint 3 — Catálogo e serviços
- [ ] Analisar catálogo da `INTERFACE` (`habilis-services.ts`).
- [ ] Criar seed do Prisma para `ServicoCatalogo`.
- [ ] Criar APIs Fastify de leitura de Serviços.
- [ ] Atualizar ou criar páginas Next para ver o catálogo.
- [ ] Testar rotas.

### Sprint 4 — Motor comercial
- [ ] Refatorar regulatory engine (`regulatory-engine.ts`) como Service Fastify.
- [ ] Refatorar proposal generator (`proposal-generator.ts`) como endpoint de geração de PDF.
- [ ] Criar tela de triagem (`apps/web/src/app/(app)/comercial/triagem`).
- [ ] Criar tela de proposta (`apps/web/src/app/(app)/comercial/propostas`).

### Sprint 5 — Handoff e contratos
- [ ] Criar entidades Prisma (`Lead`, `HandoffOperacional`, `Contrato`, `Proposta`).
- [ ] Executar `db:migrate`.
- [ ] Criar services e APIs em `apps/api/src/modules/crm/`.
- [ ] Conectar funil CRM do frontend para disparar evento Handoff.

### Sprint 6 — Financeiro e entregáveis
- [ ] Criar entidades financeiras e `OrdemServico` / `Entregavel` no Prisma.
- [ ] Substituir telas mockadas `/contratos`, `/ordens-servico`, `/financeiro`, `/entregaveis`.
- [ ] Validar fluxo de Handoff completo gerando OS e Contratos.

### Sprint 7 — UI e limpeza
- [ ] Avaliar componentes da pasta `INTERFACE` e colocar em `packages/ui` se não existirem.
- [ ] Remover arquivos SQL de Supabase e HTML não usados.
- [ ] Arquivar pastas do filesystem do servidor para limpeza profunda.
- [ ] Atualizar README raiz com o novo mapa.
- [ ] Criar testes básicos unitários para o Engine Regulatório.

## 9. Riscos e travas

*   **Risco**: Colar código Vite/Supabase no Next sem refatorar.
    *   **Trava**: Proibição de importar Supabase client side nas novas telas. Todo data fetch usa API do Fastify.
*   **Risco**: Duplicar entidades.
    *   **Trava**: Revisar Schema Prisma antes da Sprint 5. Comparar `Processo` e `LicencaAmbiental` com novas entidades.
*   **Risco**: Quebrar autenticação multi-tenant.
    *   **Trava**: As novas entidades comerciais **obrigatórias** devem ter `tenantId`.
*   **Risco**: Criar telas sem API / APIs sem domínio.
    *   **Trava**: As Sprints 4 e 5 focam primeiro no Backend (Prisma -> Service -> API) para depois fazer a UI.
*   **Risco**: Alterar schema Prisma sem plano.
    *   **Trava**: Migration gerada deve ser inspecionada. Sempre testar no ambiente demo.
*   **Risco**: Misturar dados mockados com reais.
    *   **Trava**: Limpar `/gestao-interna/data.ts` assim que Sprint 6 for concluída.

## 10. Critérios de aceite da consolidação

*   O projeto oficial continua rodando e buildando (`pnpm build` passa).
*   O login multi-tenant continua intacto.
*   O dashboard operacional não sofre regressões.
*   Telas de `/contratos`, `/ordens-servico`, e `/financeiro` não usam mais o arquivo estático de mock, mas buscam as entidades reais do banco.
*   A Triagem Comercial permite criar uma cotação/proposta e gerar PDF sem Supabase, tudo via Fastify.
*   O Worker consegue usar os Prompts refinados da `HABILIS_AI`.
*   O ato de fechar um `Lead` (Ganho) cria com sucesso as estruturas base de `Empreendimento`, `Tarefas` (OS) e `Contrato`.
*   As pastas legadas (ex: `ITECOLOGICA`, `posto-compliance-unico`, `INTERFACE`) foram purgadas da raiz ativa (ou isoladas no `/legacy`).
*   O `README.md` foi atualizado para refletir que as funcionalidades de comercial e IA já fazem parte do monorepo oficial.

## 11. Interfaces ativas e mini fluxo de apresentação

### 11.1 Entradas principais

#### Site institucional (`http://localhost:3100`)
- `/` — landing institucional com narrativa da Hábilis.
- `/servicos` — visão dos serviços ofertados.
- `/clientes` — leitura de prova social e posicionamento.
- `/noticias` — conteúdo técnico e informativos.
- `/sistema` — página que organiza as 4 superfícies do ecossistema.

#### Sistema operacional (`http://localhost:3000`)
- `/login` — entrada da equipe interna.
- `/dashboard` — cockpit executivo da operação.
- `/empreendimentos` — carteira de ativos monitorados.
- `/documentos` — dossiê documental.
- `/condicionantes` — obrigações e vencimentos.
- `/processos` — trilha processual e regulatória.
- `/tarefas` — fila operacional.

#### Portal do cliente (`http://localhost:3000/portal`)
- `/portal/login` — entrada externa para cliente/parceiro.
- `/portal/inicio` — resumo do empreendimento e conformidade.
- `/portal/documentos` — envio e acompanhamento de documentos.
- `/portal/tarefas` — demandas do cliente.
- `/portal/alertas` — itens que pedem ação.
- `/portal/mensagens` — comunicação com a equipe.

#### Área de campo (`http://localhost:3000/equipe`)
- `/equipe/login` — entrada da operação de campo.
- `/equipe/inicio` — painel do dia.
- `/equipe/os` — ordens de serviço.
- `/equipe/checklists` — execução de vistoria.
- `/equipe/evidencias` — evidências coletadas.
- `/equipe/pendencias` — pendências críticas e retorno.

### 11.2 Credenciais de demonstração

#### Sistema interno
- E-mail: `admin@postodemo.com.br`
- Senha: `Demo@1234`

#### Portal do cliente
- E-mail: `representante@postodemo.com.br`
- Senha: `Demo@1234`

#### Área de campo
- Demo local: qualquer matrícula e senha válidas para apresentação.

### 11.3 Ordem sugerida de apresentação

1. Abrir `http://localhost:3100/` e contextualizar a Hábilis como marca, serviços e narrativa institucional.
2. Ir para `http://localhost:3100/sistema` e explicar que o ecossistema foi separado em 4 superfícies.
3. Entrar em `http://localhost:3000/login` e mostrar o cockpit interno em `/dashboard`.
4. Navegar no sistema por `/empreendimentos`, `/documentos` e `/condicionantes` para demonstrar a espinha operacional.
5. Abrir `http://localhost:3000/portal/login` e entrar no fluxo do cliente, começando por `/portal/inicio` e `/portal/documentos`.
6. Abrir `http://localhost:3000/equipe/login` e mostrar o fluxo de campo por `/equipe/inicio`, `/equipe/os` e `/equipe/checklists`.
7. Fechar reforçando que site, portal, campo e sistema agora compartilham a mesma linguagem visual e representam momentos diferentes da mesma operação.

### 11.4 Leitura rápida do fluxo já construído

- Site público → capta interesse, explica a proposta de valor e direciona para a interface correta.
- Sistema interno → coordena operação, conformidade, documentos, tarefas e leitura regulatória.
- Portal do cliente → centraliza troca documental, acompanhamento e comunicação externa.
- Área de campo → transforma a operação em execução diária com OS, checklist, evidências e pendências.
