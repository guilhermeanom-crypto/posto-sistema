# 00_LEVANTAMENTO_PROJETO_OFICIAL

Projeto auditado: `/home/guilherme/Projetos VS CODE/Posto/sistema`  
Data da auditoria: `2026-05-11`  
Escopo: leitura estática do código, manifests, schema Prisma, seeds, docs internas e estrutura do monorepo.  
Regra aplicada: nenhuma alteração de código-fonte; apenas documentação.

## 1. Resumo executivo

O sistema é uma plataforma multi-tenant de gestão regulatória e operacional para redes de postos de combustíveis. O núcleo já cobre autenticação, gestão de empreendimentos, processos, documentos, condicionantes, tarefas, alertas, compliance, portal externo, auditoria, relatórios assíncronos, CRM de leads, integrações, módulos regulatórios específicos e automações via worker.

O estágio atual é de produto funcional em expansão. O que existe de forma mais madura é o eixo operacional-regulatório: login, multi-tenant, empreendimentos, processos, documentos, condicionantes, tarefas, alertas, dashboards, portal do cliente, auditoria, métricas, relatórios, CRM e vários módulos setoriais. O que ainda está incompleto ou híbrido está concentrado nas telas de gestão interna comercial/financeira (`/servicos`, `/contratos`, `/ordens-servico`, `/entregaveis`, `/financeiro`) e em decisões arquiteturais ainda não consolidadas no schema.

A stack identificada é `Next.js 15 + React 18 + Tailwind + Radix UI` no frontend, `Fastify + Zod + Prisma + PostgreSQL + Redis + BullMQ` no backend/worker, `S3/MinIO` para arquivos, `Resend` para e-mail, `Anthropic Claude` para IA e `Z-API` para WhatsApp.

Antes de consolidar outras pastas, a recomendação geral é estabilizar três frentes: autorização fina por perfil/empreendimento, redução de telas híbridas/mockadas da gestão interna e revisão das decisões de modelagem ainda em aberto no banco. O projeto oficial já pode receber migrações, mas deve receber primeiro migrações convergentes ao modelo atual e não refatorações concorrentes de domínio.

## 2. Estrutura de pastas

| Pasta/arquivo | Conteúdo | Finalidade | Status aparente | Ação recomendada |
|---|---|---|---|---|
| `apps/api` | API Fastify, Prisma, serviços e rotas | Backend principal | Ativa | Manter |
| `apps/web` | App Next.js com App Router, layouts, páginas e ações | Frontend principal | Ativa | Manter |
| `apps/worker` | Workers BullMQ, schedulers, integrações e IA | Automação assíncrona | Ativa | Manter |
| `packages/schemas` | Schemas Zod compartilhados | Contratos de entrada/validação | Ativa, mas cobertura parcial | Manter e ampliar |
| `packages/types` | Enums e tipos de domínio compartilhados | Fonte comum de tipos frontend/backend | Ativa | Manter |
| `packages/utils` | Utilitários compartilhados | Helpers de datas, CNPJ e compliance | Ativa | Manter |
| `packages/ui` | Estrutura vazia (`src/` sem package útil) | Placeholder de design system | Temporária/ociosa | Revisar ou limpar |
| `docs/arquitetura` | Arquitetura alvo, plano e débitos técnicos | Memória arquitetural | Ativa, porém parcialmente defasada em relação ao código | Manter e atualizar |
| `infra/nginx` | `nginx.conf` de produção | Reverse proxy/SSL | Ativa | Manter |
| `scripts/lint-empreendimento-id.ts` | Script de validação arquitetural | Controle de modelagem | Ativo, mas não integrado ao `package.json` | Revisar e plugar em CI |
| `docker-compose.yml` | Stack dev de `postgres`, `redis`, `minio`, `mailhog` | Ambiente local | Ativa | Manter |
| `docker-compose.prod.yml` | Stack de produção com `api`, `web`, `worker`, `nginx` | Deploy/infra | Ativa | Manter |
| `.env` e `.env.example` | Configuração local e template de produção | Ambiente | Ativos | Manter |
| `PLANEJAMENTO.md` | Auditoria interna e roadmap | Referência histórica | Útil, mas defasado em alguns pontos | Revisar antes de usar como verdade |

### Observações sobre a estrutura

- O monorepo está organizado de forma clara em `apps/*` e `packages/*`.
- `packages/ui` parece preparado para um design system futuro, mas hoje não participa da aplicação.
- Há artefatos gerados locais em algumas subpastas (`dist`, `.turbo`, caches), mas eles não compõem a estrutura conceitual do projeto.
- A documentação arquitetural é valiosa, porém algumas afirmações já não batem com o código atual, então deve ser tratada como referência e não como fonte única da verdade.

## 3. Stack e dependências

### Stack identificada

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15, React 18, TypeScript |
| UI | Tailwind CSS, Radix UI, `lucide-react`, `cmdk`, `vaul` |
| Backend | Fastify 4, TypeScript, Zod |
| Worker | Node.js + BullMQ |
| ORM | Prisma |
| Banco | PostgreSQL |
| Cache/Fila | Redis |
| Arquivos | S3/MinIO |
| E-mail | Resend |
| IA | Anthropic Claude |
| WhatsApp | Z-API |
| Pacotes | `pnpm` |
| Orquestração | `turbo` |

### Dependências principais por papel

| Papel | Bibliotecas |
|---|---|
| UI base | `@radix-ui/*`, `tailwindcss`, `tailwind-merge`, `class-variance-authority`, `lucide-react` |
| Validação | `zod`, `fastify-type-provider-zod` |
| Formulários | `react-hook-form`, `@hookform/resolvers` |
| Autenticação | `@fastify/jwt`, cookies customizados no frontend |
| Gráficos | `recharts` |
| Upload/arquivos | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@fastify/multipart` |
| Filas/automação | `bullmq`, `ioredis` |
| IA | `@anthropic-ai/sdk`, `pdfkit`, `exceljs`, `cheerio` |
| Logging | `pino`, `pino-pretty` |

### Scripts disponíveis

#### Raiz

- `build`
- `dev`
- `lint`
- `test`
- `typecheck`
- `db:generate`
- `db:migrate`
- `db:seed`
- `format`
- `clean`

#### `apps/api`

- `dev`
- `build`
- `start`
- `typecheck`
- `lint`
- `test`
- `test:watch`
- `db:generate`
- `db:migrate`
- `db:migrate:prod`
- `db:seed`
- `db:studio`
- `reset-password`
- `clean`

#### `apps/web`

- `dev`
- `build`
- `start`
- `lint`
- `typecheck`

#### `apps/worker`

- `dev`
- `build`
- `start`
- `typecheck`

### Dependências úteis

- `@repo/schemas`, `@repo/types`, `@repo/utils` fazem sentido e reduzem divergência entre frontend e backend.
- `pdfkit` e `exceljs` sustentam a geração de relatórios.
- `cheerio` suporta o monitor do Diário Oficial.
- `cmdk` e `vaul` já sustentam componentes de UX reais (`CommandPalette`, `Sheet`).

### Dependências suspeitas ou sem uso aparente

- `next-auth` está declarado no frontend, mas não há uso encontrado no código auditado.
- `zustand` está declarado no frontend, mas não há uso encontrado.
- `react-hook-form` e `@hookform/resolvers` estão declarados, mas não apareceram importações no código auditado.
- `@casl/ability` está declarado no backend, mas não apareceu uso no código auditado.
- `@fastify/swagger` e `@fastify/swagger-ui` estão declarados, mas não há registro desses plugins em `apps/api/src/app.ts`.
- `@tanstack/react-query` está ativo apenas no provider global; não há uso de hooks de query/mutation encontrado nas telas auditadas.

### Dependências duplicadas ou observações

- `bullmq`, `ioredis`, `zod`, `@prisma/client` e `resend` aparecem em `api` e `worker` de forma coerente.
- `pino-pretty` está em `dependencies` da API, embora seja usado apenas em desenvolvimento.
- A cobertura dos packages compartilhados ainda é parcial: `packages/schemas` cobre bem os módulos fundacionais, mas vários módulos mais novos usam schemas inline nas próprias rotas.

## 4. Frontend

### Visão geral

O frontend usa `Next.js 15` com `App Router`, dividido em grupos de rota:

- `(auth)` para login interno.
- `(app)` para painel principal autenticado.
- `(superadmin)` para gestão global de tenants.
- `/portal` para acesso do representante do posto.
- `app/api/*` para rotas auxiliares do próprio Next, principalmente proxy/download/logout.

O frontend é predominantemente server-first:

- Server Components fazem `fetch` na API Fastify usando `apps/web/src/lib/api.ts`.
- `apps/web/src/lib/server-api.ts` intercepta `401` e redireciona para `/login`.
- Cookies `httpOnly` guardam `posto_access` e `posto_refresh`.
- O `middleware.ts` do Next protege rotas privadas por presença do cookie.
- Layout principal usa `AppSidebar`, `AppHeader`, seletor global de empreendimento e `CommandPalette`.

### Componentes e padrões relevantes

| Área | Arquivos centrais | Observação |
|---|---|---|
| Layout principal | `src/app/(app)/layout.tsx`, `src/components/layout/*` | Estrutura madura, navegação ampla |
| UI reutilizável | `src/components/ui/*` | Biblioteca local consistente |
| Auth | `src/app/(auth)/login/*`, `src/lib/auth.ts`, `src/middleware.ts` | Fluxo funcional |
| Consumo de API | `src/lib/api.ts`, `src/lib/server-api.ts` | Camada simples e clara |
| Portal externo | `src/app/portal/*` | Área separada, coerente |
| Integração com filtros | `src/components/layout/empreendimento-selector.tsx` | Já usado no layout |

### Telas principais e status

| Rota provável | Arquivo principal | Finalidade | Dados utilizados | Status |
|---|---|---|---|---|
| `/login` | `apps/web/src/app/(auth)/login/page.tsx` | Login interno | API `/auth/login` via action | Funcional |
| `/dashboard` | `apps/web/src/app/(app)/dashboard/page.tsx` | Cockpit inicial | `/cockpit/resumo`, `/cockpit/vencimentos`, `/documentos`, `/condicionantes`, `/tarefas`, `/cockpit/diagnostico/rede` | Funcional |
| `/executivo` | `apps/web/src/app/(app)/executivo/page.tsx` | Visão executiva consolidada | APIs reais de cockpit/compliance/risco | Funcional |
| `/empreendimentos` | `apps/web/src/app/(app)/empreendimentos/page.tsx` | Lista de postos | `/empreendimentos` | Funcional |
| `/empreendimentos/[id]` | `apps/web/src/app/(app)/empreendimentos/[id]/page.tsx` | Dossiê 360 e hub do posto | Múltiplas APIs reais agregadas | Funcional |
| `/empreendimentos/[id]/onboarding` | `apps/web/src/app/(app)/empreendimentos/[id]/onboarding/page.tsx` | Onboarding por empreendimento | `/onboarding/*`, gap analysis, preview | Parcial avançado |
| `/processos` | `apps/web/src/app/(app)/processos/page.tsx` | Gestão de processos regulatórios | `/processos` | Funcional |
| `/processos/[id]` | `apps/web/src/app/(app)/processos/[id]/page.tsx` | Detalhe do processo | `/processos/:id` | Funcional |
| `/documentos` | `apps/web/src/app/(app)/documentos/page.tsx` | Gestão documental | `/documentos` | Funcional |
| `/documentos/[id]` | `apps/web/src/app/(app)/documentos/[id]/page.tsx` | Detalhe + upload/aprovação | `/documentos/:id`, download/upload | Funcional |
| `/condicionantes` | `apps/web/src/app/(app)/condicionantes/page.tsx` | Lista de condicionantes | `/condicionantes` | Funcional |
| `/condicionantes/[id]` | `apps/web/src/app/(app)/condicionantes/[id]/page.tsx` | Detalhe/ciclos/ações | `/condicionantes/:id` | Funcional |
| `/tarefas` | `apps/web/src/app/(app)/tarefas/page.tsx` | Lista de tarefas | `/tarefas` | Funcional |
| `/tarefas/[id]` | `apps/web/src/app/(app)/tarefas/[id]/page.tsx` | Detalhe/ações | `/tarefas/:id` | Funcional |
| `/alertas` | `apps/web/src/app/(app)/alertas/page.tsx` | Caixa de alertas | `/alertas` | Funcional |
| `/usuarios` | `apps/web/src/app/(app)/usuarios/page.tsx` | Gestão de usuários | `/usuarios` | Funcional |
| `/config` | `apps/web/src/app/(app)/config/page.tsx` | Catálogos e parametrização | `/config/*` | Funcional |
| `/config/notificacoes` | `apps/web/src/app/(app)/config/notificacoes/page.tsx` | Regras automáticas de alertas | `/config/regras` | Funcional |
| `/licencas-ambientais` | `apps/web/src/app/(app)/licencas-ambientais/page.tsx` | Módulo ambiental | APIs reais + IA | Funcional |
| `/regulatorio-urbano` | `apps/web/src/app/(app)/regulatorio-urbano/page.tsx` | Alvarás e urbanístico | API real | Funcional |
| `/sst` | `apps/web/src/app/(app)/sst/page.tsx` | SST consolidado | API real | Funcional |
| `/funcionarios` | `apps/web/src/app/(app)/funcionarios/page.tsx` | Funcionários e ASOs | API real | Funcional |
| `/anp-inmetro` | `apps/web/src/app/(app)/anp-inmetro/page.tsx` | Bombas e calibração | API real | Funcional |
| `/estanqueidade` | `apps/web/src/app/(app)/estanqueidade/page.tsx` | Tanques e testes | API real | Funcional |
| `/outorga-hidrica` | `apps/web/src/app/(app)/outorga-hidrica/page.tsx` | Poços e laudos | API real | Funcional |
| `/logistica-reversa` | `apps/web/src/app/(app)/logistica-reversa/page.tsx` | MTR/CCR/metas | API real | Funcional |
| `/pgrs` | `apps/web/src/app/(app)/pgrs/page.tsx` | PGRS e exigências | API real | Funcional |
| `/monitoramento` | `apps/web/src/app/(app)/monitoramento/page.tsx` | Poços/campanhas/limites | API real | Funcional |
| `/fiscalizacoes` | `apps/web/src/app/(app)/fiscalizacoes/page.tsx` | Autos de infração | API real | Funcional |
| `/fiscalizacoes/[id]` | `apps/web/src/app/(app)/fiscalizacoes/[id]/page.tsx` | Detalhe, recurso e defesa | API real + IA | Parcial avançado |
| `/checklists` | `apps/web/src/app/(app)/checklists/page.tsx` | Templates e execuções | API real | Funcional |
| `/legislacao` | `apps/web/src/app/(app)/legislacao/page.tsx` | Publicações e tarefas | API real | Funcional |
| `/risco` | `apps/web/src/app/(app)/risco/page.tsx` | Score de risco | API real | Funcional |
| `/auditoria` | `apps/web/src/app/(app)/auditoria/page.tsx` | Audit trail | `/audit-log/*` | Funcional |
| `/whatsapp` | `apps/web/src/app/(app)/whatsapp/page.tsx` | Contatos, conversas e leads WhatsApp | API real | Funcional |
| `/crm` | `apps/web/src/app/(app)/crm/page.tsx` | Funil de leads | `/crm/leads`, `/crm/metricas` | Funcional |
| `/relatorios` | `apps/web/src/app/(app)/relatorios/page.tsx` | Solicitação e download de relatórios | `/relatorios` | Funcional |
| `/metricas` | `apps/web/src/app/(app)/metricas/page.tsx` | Métricas operacionais | `/metricas/operacional` | Funcional |
| `/motor-orcamento` | `apps/web/src/app/(app)/motor-orcamento/page.tsx` | Diagnóstico/orçamento | APIs reais + catálogos seedados | Funcional dependente de seed |
| `/onboarding` | `apps/web/src/app/(app)/onboarding/page.tsx` | Configuração inicial e preview | `/onboarding/*` + preview | Parcial avançado |
| `/superadmin/tenants` | `apps/web/src/app/(superadmin)/tenants/page.tsx` | Gestão global de tenants | `/tenants` | Funcional |
| `/portal/inicio` | `apps/web/src/app/portal/(portal)/inicio/page.tsx` | Dashboard do representante | `/portal/dashboard`, `/portal/compliance`, `/portal/alertas` | Funcional |
| `/portal/documentos` | `apps/web/src/app/portal/(portal)/documentos/page.tsx` | Documentos do posto | API real + upload | Funcional |
| `/portal/tarefas` | `apps/web/src/app/portal/(portal)/tarefas/page.tsx` | Tarefas do representante | API real | Funcional |
| `/portal/alertas` | `apps/web/src/app/portal/(portal)/alertas/page.tsx` | Alertas do representante | API real | Funcional |
| `/portal/checklists` | `apps/web/src/app/portal/(portal)/checklists/page.tsx` | Resposta de checklists | API real | Funcional |
| `/portal/condicionantes` | `apps/web/src/app/portal/(portal)/condicionantes/page.tsx` | Pendências regulatórias do posto | API real | Funcional |
| `/portal/mensagens` | `apps/web/src/app/portal/(portal)/mensagens/page.tsx` | Canal com analista | API real | Funcional |
| `/pessoas` | `apps/web/src/app/(app)/pessoas/page.tsx` | Pressão por responsável | Derivado de `/tarefas` e `/sst/funcionarios` | Funcional derivado |
| `/atuacoes` | `apps/web/src/app/(app)/atuacoes/page.tsx` | Timeline operacional | Agrega processos, documentos, tarefas e alertas | Funcional derivado |
| `/calendario` | `apps/web/src/app/(app)/calendario/page.tsx` | Agenda anual | `/cockpit/vencimentos` | Funcional derivado |
| `/fila` | `apps/web/src/app/(app)/fila/page.tsx` | Fila operacional | `/fila`, `/empreendimentos` | Funcional derivado |
| `/producao` | `apps/web/src/app/(app)/producao/page.tsx` | Carga de trabalho da equipe | `/tarefas` | Funcional derivado |
| `/servicos` | `apps/web/src/app/(app)/servicos/page.tsx` | Catálogo interno | `gestao-interna/data.ts` | Mockado |
| `/contratos` | `apps/web/src/app/(app)/contratos/page.tsx` | Visão contratual | API de empreendimentos + catálogo estático | Parcial/híbrido |
| `/ordens-servico` | `apps/web/src/app/(app)/ordens-servico/page.tsx` | Fila de OS | Agregado de tarefas/processos/documentos + catálogo estático | Parcial/híbrido |
| `/entregaveis` | `apps/web/src/app/(app)/entregaveis/page.tsx` | Entregáveis | Documentos + relatórios, sem entidade própria | Parcial/híbrido |
| `/financeiro` | `apps/web/src/app/(app)/financeiro/page.tsx` | Projeção financeira | Empreendimentos/tarefas + catálogo estático | Parcial/híbrido |

### Estados de loading/erro

- Há tratamento defensivo de falha em várias páginas com `try/catch` e fallback para arrays vazios.
- Existem componentes de `Skeleton`, `Toast`, `Alert` e estados de transição com `useTransition`.
- O padrão predominante é “não quebra a tela, mas pode ocultar falhas silenciosamente”.

### Dados mockados, fixos ou híbridos

- `apps/web/src/app/(app)/gestao-interna/data.ts` contém catálogo estático de serviços e helpers usados por telas internas.
- `servicos` é totalmente estático.
- `contratos`, `ordens-servico`, `entregaveis` e `financeiro` usam dados reais como base, mas constroem projeções e estruturas que ainda não têm entidade própria no backend.
- Algumas telas derivadas (`pessoas`, `producao`, `calendario`, `atuacoes`) são reais, mas dependem de agregação local no frontend e não de endpoints dedicados para tudo.

### Pontos visuais que parecem bons

- Tela de login é bem trabalhada e foge do visual genérico.
- Dashboard, CRM, portal e dossiê de empreendimento têm direção visual consistente.
- Biblioteca local de UI é coesa.
- Sidebar, header e cards mantêm identidade visual clara.

### Pontos visuais que precisam de revisão

- Há muitas páginas grandes demais, com muita lógica e markup no mesmo arquivo.
- Alguns módulos repetem padrões de card/tabela sem abstrações suficientes.
- Gestão interna comercial/financeira ainda transmite sensação de protótipo funcional.
- Parte das páginas depende de `any` e normalização manual de payloads, o que aumenta risco de regressão visual.

## 5. Backend/API

### Visão geral

O backend está em `apps/api`, organizado em:

- `src/app.ts` para bootstrap Fastify.
- `src/modules/*` para domínios e rotas.
- `src/infra/*` para Prisma, Redis, filas e storage.
- `src/shared/*` para autenticação, auditoria, eventos e erros.
- `prisma/*` para schema, migrations e seeds.

Há `36` módulos de rotas e `23` services dedicados. A maioria das rotas está conectada diretamente ao banco via Prisma, por service ou por query direta.

### Middlewares, validações, logs e tratamento de erro

- `authenticate` valida JWT e reconfirma usuário ativo no banco.
- O app usa `helmet`, `cors`, `rate-limit`, `multipart` e `fastify-jwt`.
- Validação é feita com `Zod`.
- Erros de domínio usam `AppError`; validações retornam `VALIDATION_ERROR`; falhas desconhecidas viram `500`.
- Logging usa `pino`, com `pino-pretty` em desenvolvimento.
- Há `health check` em `/health`.

### Rotas/APIs principais

| Módulo | Prefixo | Principais endpoints | Entidades | Banco | Status |
|---|---|---|---|---|---|
| Auth | `/api/v1/auth` | `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`, `POST /portal/magic-link`, `POST /portal/validar` | `Usuario`, `SessaoRefresh`, `TokenPortal` | Sim | Funcional |
| Tenants | `/api/v1/tenants` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | `Tenant`, `Usuario` | Sim | Funcional |
| Usuários | `/api/v1/usuarios` | CRUD, alteração de perfil, senha e desativação | `Usuario` | Sim | Funcional |
| Empreendimentos | `/api/v1/empreendimentos` | CRUD, equipe do empreendimento | `Empreendimento`, `Empresa`, `EmpreendimentoAcesso` | Sim | Funcional |
| Processos | `/api/v1/processos` | listagem, criação, detalhe, update, avanço de fase, dispensa de requisito | `Processo`, `HistoricoFaseProcesso`, `RequisitoProcesso` | Sim | Funcional |
| Documentos | `/api/v1/documentos` | listagem, criação, detalhe, upload em duas fases, aprovação, reprovação, download | `Documento`, `DocumentoVersao` | Sim | Funcional |
| Condicionantes | `/api/v1/condicionantes` | listagem, criação, detalhe, cumprir, dispensar, ciclos | `Condicionante`, `CicloCondicionante` | Sim | Funcional |
| Tarefas | `/api/v1/tarefas` | listagem, criação, detalhe, iniciar, concluir, reatribuir, cancelar, evidências | `Tarefa`, `EvidenciaTarefa` | Sim | Funcional |
| Alertas | `/api/v1/alertas` | listagem, marcar lido, marcar todos, criar tarefa | `Alerta`, `AlertaDestinatario` | Sim | Funcional |
| Compliance | `/api/v1/compliance` | score e histórico | `ComplianceSnapshot` | Sim | Funcional |
| Cockpit | `/api/v1/cockpit` | resumo, vencimentos, diagnóstico, executivo | projeções sobre várias entidades | Sim | Funcional |
| Config | `/api/v1/config` | órgãos, tipos de documento, tipos de processo, regras automáticas | catálogos e `RegraAutomatica` | Sim | Funcional |
| Auditoria | `/api/v1/audit-log` | listagem, resumo e filtros | `AuditLog` | Sim | Funcional |
| Portal | `/api/v1/portal` | dashboard, documentos, compliance, tarefas, alertas, checklists, condicionantes, mensagens | entidades do representante | Sim | Funcional |
| Licenças Ambientais | `/api/v1/licencas-ambientais` | CRUD, condições, IA | `LicencaAmbiental`, `CondicaoLicenca` | Sim | Funcional |
| Regulatório Urbano | `/api/v1/regulatorio-urbano` | CRUD de alvarás | `AlvaraUrbanistico` | Sim | Funcional |
| SST | `/api/v1/sst` | funcionários, ASOs, treinamentos, EPIs, documentos SST | `Funcionario`, `ASO`, `Treinamento*`, `EntregaEPI`, `DocumentoSST` | Sim | Funcional |
| ANP/INMETRO | `/api/v1/anp-inmetro` | bombas e calibração | `BombaAbastecimento` | Sim | Funcional |
| Estanqueidade | `/api/v1/estanqueidade` | tanques e testes | `Tanque`, `TesteEstanqueidade` | Sim | Funcional |
| Logística Reversa | `/api/v1/logistica-reversa` | transportadoras, MTRs, CCRs, metas e relatório | `Transportadora`, `MTR`, `CCR`, `MetaResiduoAnual` | Sim | Funcional |
| Outorga Hídrica | `/api/v1/outorga-hidrica` | poços e laudos | `PocoArtesiano`, `LaudoAgua` | Sim | Funcional |
| Monitoramento | `/api/v1/monitoramento` | poços, campanhas, parâmetros e limites | `PocoMonitoramento`, `CampanhaMonitoramento`, `LimiteParametro`, `ParametroContaminante` | Sim | Funcional |
| Fiscalizações | `/api/v1/fiscalizacoes` | autos, mudança de status, recursos | `AutoInfracao`, `RecursoAdministrativo` | Sim | Funcional/parcial |
| IA | `/api/v1/ia` | análise de licença, análise de auto, geração e revisão de defesa | `LicencaAmbiental`, `AutoInfracao`, `DefesaTecnica` | Sim | Funcional |
| Legislação | `/api/v1/legislacao` | publicações e criação de tarefas | `PublicacaoDO` | Sim | Funcional |
| Risco | `/api/v1/risco` | score agregado e por empreendimento, recalcular | `ScoreRisco` | Sim | Funcional |
| WhatsApp | `/api/v1/whatsapp` | webhook, contatos, mensagens, leads | `ContatoWhatsApp`, `MensagemWhatsApp`, `LeadWhatsApp`, `MensagemLead` | Sim | Funcional |
| CRM | `/api/v1/crm` | kanban, detalhe, métricas e follow-ups | `LeadWhatsApp`, `FollowUpLead` | Sim | Funcional |
| Checklists | `/api/v1/checklists` | templates, execuções e respostas | `ChecklistTemplate`, `ChecklistExecucao`, `ChecklistResposta` | Sim | Funcional |
| Onboarding | `/api/v1/onboarding` | progresso, wizard, gap analysis, preview de orçamento | `ObrigacaoRegulatoriaBase`, `ServicoConsultoriaBase`, `PoliticaPrecificacaoDiagnostico` | Sim | Funcional dependente de seed |
| PGRS | `/api/v1/pgrs` | planos, exigências e evidências | `PGRS`, `PGRSExigencia`, `PGRSEvidencia` | Sim | Funcional |
| Fila | `/api/v1/fila` | fila operacional e mudança de status | `Tarefa` e agregações | Sim | Funcional |
| Métricas | `/api/v1/metricas` | métricas operacionais | projeções sobre tarefas e snapshots | Sim | Funcional |
| Equipamentos histórico | `/api/v1/equipamentos-historico` | timeline de eventos | `EquipamentoHistorico` | Sim | Funcional |
| Integrações | `/api/v1/integracoes` | eventos da ITECOLOGICA, reprocessamento, handoff CRM-win | `IntegracaoEvento`, materialização operacional | Sim | Funcional |

### Endpoints ou áreas incompletas

- `fiscalizacoes` está forte na lista e no detalhe, mas o domínio processual ainda é simplificado quando comparado ao plano arquitetural.
- `relatorios` já existe e funciona, porém ainda cobre um subconjunto de formatos/casos de uso.
- `portal` está mais avançado do que a documentação histórica indicava, mas ainda é um recorte controlado do sistema interno.
- `swagger`/OpenAPI está previsto pelos campos de schema, mas não está efetivamente exposto.

### Endpoints sem uso aparente ou pouco expostos no frontend

- Parte de `integracoes` é administrativa e não aparece como módulo explícito no menu principal.
- `portal/validar` para magic link existe no backend, enquanto o frontend do portal também oferece login por credencial; isso cria dupla estratégia de acesso.
- Alguns endpoints mais técnicos de histórico e reprocessamento parecem preparados para operação/administração, não para uso frequente de produto.

## 6. Banco de dados

### Panorama

- ORM: `Prisma`
- Schema: `apps/api/prisma/schema.prisma`
- Migrations localizadas: `18`
- Models identificados no schema: `74`
- Enums identificados no schema: `34`

### Entidades principais por grupo

| Grupo | Entidades |
|---|---|
| Fundação multi-tenant | `Tenant`, `Usuario`, `SessaoRefresh`, `TokenPortal`, `Empresa`, `Empreendimento`, `EmpreendimentoAcesso` |
| Catálogos/configuração | `OrgaoRegulador`, `TipoProcesso`, `FaseTipoProcesso`, `TipoDocumento`, `RequisitoTipoProcesso`, `RegraAutomatica` |
| Núcleo operacional | `Processo`, `HistoricoFaseProcesso`, `RequisitoProcesso`, `Documento`, `DocumentoVersao`, `Condicionante`, `CicloCondicionante`, `Tarefa`, `TarefaDependencia`, `EvidenciaTarefa`, `Alerta`, `AlertaDestinatario`, `ComplianceSnapshot`, `AuditLog` |
| Ambiental/urbano | `LicencaAmbiental`, `CondicaoLicenca`, `AlvaraUrbanistico` |
| SST | `Funcionario`, `TreinamentoTipo`, `TreinamentoExecucao`, `TreinamentoParticipante`, `EntregaEPI`, `ASO`, `DocumentoSST` |
| ANP/SASC | `BombaAbastecimento`, `EquipamentoHistorico`, `Tanque`, `TesteEstanqueidade` |
| Resíduos/PGRS | `Transportadora`, `MTR`, `MetaResiduoAnual`, `CCR`, `PGRS`, `PGRSExigencia`, `PGRSEvidencia` |
| Água/monitoramento | `PocoArtesiano`, `LaudoAgua`, `PocoMonitoramento`, `LimiteParametro`, `CampanhaMonitoramento`, `ParametroContaminante` |
| Fiscalização | `AutoInfracao`, `RecursoAdministrativo`, `DefesaTecnica` |
| Inteligência/score | `ScoreRisco`, `PublicacaoDO` |
| WhatsApp/CRM | `ContatoWhatsApp`, `MensagemWhatsApp`, `LeadWhatsApp`, `FollowUpLead`, `MensagemLead` |
| Checklists | `ChecklistTemplate`, `ChecklistItem`, `ChecklistExecucao`, `ChecklistResposta` |
| Catálogos de diagnóstico | `ObrigacaoRegulatoriaBase`, `ServicoConsultoriaBase`, `PoliticaPrecificacaoDiagnostico` |
| Relatórios/mensagens | `RelatorioGerado`, `MensagemPortal`, `IntegracaoEvento` |

### Relações importantes

- Tudo gira em torno de `tenantId`.
- Quase todos os registros operacionais relevantes também apontam para `empreendimentoId`.
- `Processo` se liga a `TipoProcesso`, `RequisitoProcesso`, `HistoricoFaseProcesso` e `Condicionante`.
- `Documento` se liga a `DocumentoVersao` com fluxo explícito de upload/aprovação.
- `Tarefa` é o principal elemento operacional transversal.
- `ComplianceSnapshot`, `ScoreRisco` e `PublicacaoDO` alimentam dashboards e inteligência.
- `LeadWhatsApp` virou base do CRM.

### Seed e dados de demonstração

O seed principal (`apps/api/prisma/seed.ts`) cria:

- tenant `demo`
- empresa demo
- usuários demo
- órgãos reguladores base
- tipos de documento
- tipos de processo e fases
- checklists
- regras de PGRS
- obrigações regulatórias base
- catálogo de serviços de consultoria e política de precificação
- cenários operacionais complementares

### Usuários padrão e senha de desenvolvimento

Usuários de desenvolvimento encontrados no seed:

- `admin@postodemo.com.br`
- `coord@postodemo.com.br`
- `analista@postodemo.com.br`

Senha padrão local:

- `Demo@1234`

Observação: a senha pode ser sobrescrita por `SEED_ADMIN_PASSWORD` no momento do seed.

### Scripts úteis de banco

- `db:generate`
- `db:migrate`
- `db:migrate:prod`
- `db:seed`
- `db:studio`
- `reset-password`

### Dependência de seed

Módulos fortemente dependentes de seed:

- onboarding
- motor de orçamento
- preview de gaps regulatórios
- parte do catálogo de serviços
- demonstrações e dashboards da base demo

### Possíveis problemas de modelagem

- Há dívidas documentadas em `docs/arquitetura/DEBITOS_TECNICOS.md`, inclusive decisões críticas ainda abertas.
- Há convivência de modelos “atuais” e modelos “arquitetura alvo”, especialmente em licenças, ativos/equipamentos e fiscalizações.
- A documentação interna fala em números de models/enums diferentes do schema atual, sinal de defasagem.
- `RecursoAdministrativo`, `TesteEstanqueidade`, `CondicaoLicenca` e outros já aparecem em docs internas como alvos de futura absorção/refatoração.

### Tabelas/entidades muito parecidas ou que merecem revisão

- `LicencaAmbiental` e `Processo` coexistem como representações próximas do mesmo domínio.
- `Tanque`, `BombaAbastecimento`, `TesteEstanqueidade` e `EquipamentoHistorico` formam um núcleo de ativos ainda plano.
- `LeadWhatsApp` e `MensagemLead` já apontam para um CRM em construção, coexistindo com o módulo WhatsApp operacional.
- `Documento` e `DocumentoSST` são separados; isso simplifica o módulo SST, mas duplica conceitos.

### Entidades que parecem faltar para alguns fluxos

- entidade real de `Contrato`
- entidade real de `Ordem de Serviço`
- entidade real de `Entregável`
- entidade financeira/cobrança/margem
- maior formalização de workflow processual em fiscalizações e alguns módulos internos

## 7. Autenticação e permissões

### Como o login funciona

- Login interno: `POST /api/v1/auth/login` com e-mail e senha.
- Access token e refresh token são devolvidos pela API e persistidos em cookies `httpOnly`.
- O frontend protege rotas por middleware e revalida a sessão via `/auth/me`.
- Há lockout por tentativas inválidas.
- Há refresh token rotativo e logout.

### Portal externo

Existem duas estratégias implementadas:

- magic link com `POST /auth/portal/magic-link` e `POST /auth/portal/validar`
- tela `/portal/login` que usa `/auth/login` e rejeita qualquer perfil diferente de `REPRESENTANTE_POSTO`

Isso funciona, mas introduz dupla convenção de acesso ao portal.

### Perfis encontrados

- `SUPER_ADMIN`
- `ADMIN_TENANT`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `EXECUTIVO`
- `REPRESENTANTE_POSTO`

### Como as permissões são aplicadas

- A primeira camada é o JWT.
- A segunda camada é a confirmação do usuário no banco em `authenticate`.
- Há regras de perfil dentro de services/rotas para ações sensíveis.
- Quase todas as queries importantes filtram por `tenantId`.
- O portal faz checagem explícita para permitir apenas `REPRESENTANTE_POSTO`.

### Pontos fortes

- Lockout, auditoria de login e refresh token rotativo.
- Multi-tenant coerente.
- Portal segregado por perfil.
- Restrições explícitas para `SUPER_ADMIN`, administradores e coordenadores em várias rotas.

### Pontos frágeis

- O filtro fino por `empreendimentoIds` não parece aplicado de forma homogênea em todos os módulos internos; a proteção mais consistente está em `empreendimentos` e portal.
- O middleware do frontend verifica apenas presença do cookie; a validação real acontece depois.
- Há dependência de verificações manuais por perfil em muitos services, em vez de uma camada central de autorização.
- `next-auth` não é usado; toda auth é customizada, o que aumenta a responsabilidade de manutenção interna.

## 8. Módulos existentes

| Módulo | Finalidade | Arquivos envolvidos | Entidades/API | Status atual | O que falta |
|---|---|---|---|---|---|
| Dashboard | cockpit inicial | `web/(app)/dashboard/*`, `api/modules/cockpit/*` | `ComplianceSnapshot`, alertas, documentos, tarefas | Bom | Mais padronização de agregados |
| Painel Executivo | visão gerencial da rede | `web/(app)/executivo/*`, `api/modules/cockpit/*` | métricas de rede | Bom | Evoluir drill-down |
| Meus Postos | base operacional | `web/(app)/empreendimentos/*`, `api/modules/empreendimentos/*` | `Empreendimento` | Bom | Fortalecer autorização fina |
| Pessoas | pressão por responsável | `web/(app)/pessoas/*` | tarefas + funcionários | Regular | Endpoint dedicado opcional |
| Atuações | timeline de execução | `web/(app)/atuacoes/*` | processos, docs, tarefas, alertas | Regular | API agregada dedicada |
| Tarefas | gestão transversal | `web/(app)/tarefas/*`, `api/modules/tarefas/*` | `Tarefa` | Bom | Mais testes |
| Alertas | notificações | `web/(app)/alertas/*`, `api/modules/alertas/*` | `Alerta` | Bom | Escalonamento mais robusto |
| Calendário | agenda regulatória | `web/(app)/calendario/*`, `api/modules/cockpit/*` | vencimentos | Regular | Modelo calendário dedicado |
| Processos | workflow regulatório | `web/(app)/processos/*`, `api/modules/processos/*` | `Processo` | Bom | Resolver coexistência com `LicencaAmbiental` |
| Documentos | biblioteca de evidências | `web/(app)/documentos/*`, `api/modules/documentos/*` | `Documento` | Bom | OCR/FTS/retention |
| Condicionantes | prazos e execução | `web/(app)/condicionantes/*`, `api/modules/condicionantes/*` | `Condicionante` | Bom | Ciclos e dispensa podem evoluir |
| Serviços | catálogo interno | `web/(app)/servicos/*` | estático | Fraco/mockado | Entidade e gestão reais |
| Contratos | visão comercial/contratual | `web/(app)/contratos/*` | híbrido | Parcial | Entidade de contrato |
| Motor de Orçamento | preview comercial/técnico | `web/(app)/motor-orcamento/*`, `api/modules/onboarding/*` | seed de obrigações/serviços/política | Bom, dependente de seed | Formalizar persistência |
| Fiscalizações | autos, recursos e defesa | `web/(app)/fiscalizacoes/*`, `api/modules/fiscalizacoes/*`, `api/modules/ia/*` | `AutoInfracao`, `RecursoAdministrativo`, `DefesaTecnica` | Bom/parcial | Domínio processual mais sólido |
| Licenças | ambiental | `web/(app)/licencas-ambientais/*`, `api/modules/licencas-ambientais/*` | `LicencaAmbiental` | Bom | Unificação arquitetural |
| Relatórios | geração assíncrona | `web/(app)/relatorios/*`, `api/modules/relatorios/*`, `worker/processors/relatorio.processor.ts` | `RelatorioGerado` | Bom | Aumentar catálogo de relatórios |
| IA | análises e defesa | `api/modules/ia/*`, `worker/services/ai.service.ts` | IA + S3 | Bom | Observabilidade e governança |
| Administração | usuários, config, tenants | `web/(app)/usuarios`, `web/(superadmin)/tenants`, `api/modules/*` | `Usuario`, `Tenant`, catálogos | Bom | CI/typecheck mais rígido |
| WhatsApp | agente e leads | `web/(app)/whatsapp/*`, `api/modules/whatsapp/*`, worker | `ContatoWhatsApp`, `LeadWhatsApp` | Bom | Monitoria e UX operacional |
| CRM | funil de leads | `web/(app)/crm/*`, `api/modules/crm/*` | `LeadWhatsApp`, `FollowUpLead` | Bom | Integrar com contrato/OS reais |
| SST | RH regulatório | `web/(app)/sst/*`, `web/(app)/funcionarios/*`, `api/modules/sst/*` | `Funcionario`, `ASO`, treinamentos | Bom | Ajustes na modelagem legada |
| ANP/INMETRO | bombas e calibração | `web/(app)/anp-inmetro/*`, `api/modules/anp-inmetro/*` | `BombaAbastecimento` | Bom | Evoluir granularidade do ativo |
| Estanqueidade | tanques e laudos | `web/(app)/estanqueidade/*`, `api/modules/estanqueidade/*` | `Tanque`, `TesteEstanqueidade` | Bom | Refatoração futura do ativo técnico |
| Logística Reversa | MTR/CCR/metas | `web/(app)/logistica-reversa/*`, `api/modules/logistica-reversa/*` | `MTR`, `CCR`, metas | Bom | Revisar modelagem com `empreendimentoId` |
| Outorga Hídrica | poços e água | `web/(app)/outorga-hidrica/*`, `api/modules/outorga-hidrica/*` | `PocoArtesiano`, `LaudoAgua` | Bom | Refinar domínio hídrico |
| Monitoramento | campanhas e poços | `web/(app)/monitoramento/*`, `api/modules/monitoramento/*` | poços, campanhas, limites | Bom | Mais automações preditivas |
| Checklists | templates e execuções | `web/(app)/checklists/*`, `api/modules/checklists/*` | `Checklist*` | Bom | Melhorar analytics |
| Auditoria | trilha de ações | `web/(app)/auditoria/*`, `api/modules/audit/*` | `AuditLog` | Bom | Assinatura/hash encadeado |
| Portal | área do cliente | `web/portal/*`, `api/modules/portal/*` | portal do representante | Bom | Consolidar estratégia de login |
| Gestão interna | OS, entregáveis, financeiro, produção | `web/(app)/(servicos/contratos/ordens-servico/entregaveis/financeiro/producao)` | híbrido | Parcial | Criar domínio real |

## 9. Dados mockados versus dados reais

### Dados reais/conectados ao banco

- login interno e portal
- dashboards (`dashboard`, `executivo`, `metricas`, `risco`)
- empreendimentos e dossiê 360
- processos
- documentos e upload/download
- condicionantes
- tarefas
- alertas
- usuários
- configurações de regras automáticas
- módulos regulatórios setoriais
- fiscalizações
- checklists
- legislação
- auditoria
- WhatsApp
- CRM
- relatórios
- portal do representante
- onboarding/gap analysis/orçamento

### Dados mockados/fixos

| Arquivo | Dado mockado/fixo | Entidade real esperada | Prioridade |
|---|---|---|---|
| `apps/web/src/app/(app)/gestao-interna/data.ts` | catálogo estático de serviços, helpers de status e cards | `ServicoConsultoriaBase` ou módulo próprio de serviços internos | Alta |
| `apps/web/src/app/(app)/servicos/page.tsx` | usa apenas `servicosCatalogo` estático | serviço/catálogo persistido | Alta |
| `apps/web/src/app/(app)/contratos/page.tsx` | contrato inferido de empreendimento ativo + serviço estático | `Contrato` | Alta |
| `apps/web/src/app/(app)/ordens-servico/page.tsx` | OS inferida de tarefas/processos/documentos | `OrdemServico` | Alta |
| `apps/web/src/app/(app)/entregaveis/page.tsx` | entregável inferido de documentos/relatórios | `Entregavel` | Média |
| `apps/web/src/app/(app)/financeiro/page.tsx` | projeções financeiras por catálogo estático | `Contrato`, `Receita`, `Custo`, `Margem` | Alta |
| `apps/web/src/app/(app)/producao/page.tsx` | ranking derivado ad hoc de tarefas | endpoint agregado ou módulo próprio | Média |
| `apps/web/src/app/(app)/pessoas/page.tsx` | score de pressão calculado no frontend | endpoint agregado ou módulo próprio | Média |
| `apps/web/src/app/(app)/atuacoes/page.tsx` | timeline montada no frontend via `Promise.allSettled` | endpoint agregado de atuações | Média |
| `apps/web/src/app/(app)/calendario/page.tsx` | agenda derivada de `/cockpit/vencimentos` | modelo/calendário dedicado | Média |

## 10. Fluxos operacionais já implementados

| Fluxo | Situação | Onde começa | Onde termina | Telas/APIs | O que falta |
|---|---|---|---|---|---|
| Login interno | Completo | `/login` | dashboard autenticado | `web/(auth)`, `/auth/login`, `/auth/me` | Testes automatizados |
| Login portal | Parcial/duplo | `/portal/login` ou magic link | `/portal/*` | `portal/login`, `/auth/login`, `/auth/portal/*` | Consolidar estratégia |
| Seleção de empreendimento | Parcial boa | header global | páginas filtradas | seletor + cookie | Propagar filtro fino a todos os módulos |
| Visualização do dashboard | Completo | `/dashboard` | links para módulos | cockpit/documentos/condicionantes/tarefas | Mais testes |
| Gestão de processos | Completo | `/processos` | detalhe/avançar fase | `/processos/*` | Resolver dualidade com licenças |
| Gestão de documentos | Completo | `/documentos` | upload, análise, download | `/documentos/*`, S3/MinIO | OCR/FTS/finalização documental |
| Gestão de condicionantes | Completo | `/condicionantes` | cumprir/dispensar/ciclos | `/condicionantes/*` | Mais consistência de regras |
| Tarefas | Completo | `/tarefas` | iniciar/concluir/reatribuir | `/tarefas/*` | Mais validação automatizada |
| Alertas | Completo | worker/schedulers | lista, leitura, tarefa | `/alertas`, filas | Escalonamento mais rico |
| Upload de arquivos | Completo | documento/portal | S3 + confirmação | `/documentos/*`, `/portal/documentos/*` | Melhor observabilidade |
| Aprovação/reprovação documental | Completo | detalhe do documento | status final + notificação | `/documentos/*`, filas/email | Histórico mais rico |
| Relatórios | Completo inicial | `/relatorios` | download | `RelatorioGerado`, worker, S3 | Mais tipos de relatório |
| CRM | Completo inicial | `/crm` | kanban/follow-up/handoff | `/crm/*` | Integrar contrato/OS reais |
| WhatsApp | Completo inicial | webhook ou painel | lead/mensagem/ação | `/whatsapp/*`, worker, Z-API | Monitoria operacional |
| Onboarding diagnóstico | Parcial avançado | `/onboarding` | preview de orçamento | `/onboarding/*` | Persistência e wizard pleno |
| Portal do representante | Completo inicial | `/portal/inicio` | docs, tarefas, alertas, checklists, mensagens | `/portal/*` | Harden de auth e expansão eventual |
| Integração ITECOLOGICA | Completo técnico | `/integracoes/itecologica/crm-win` | evento materializado | backend + `IntegracaoEvento` | UI administrativa dedicada |

## 11. Qualidade técnica

| Item | Avaliação | Comentário |
|---|---|---|
| Organização do código | Bom | Monorepo claro, módulos bem separados |
| Separação de responsabilidades | Regular | Bom no backend; frontend concentra muita lógica em páginas grandes |
| Tipagem TypeScript | Regular | Boa base, mas ainda há `any` e normalização manual frequente |
| Reutilização de componentes | Bom | Biblioteca local de UI consistente |
| Duplicidade | Regular | Existe duplicação entre módulos e em páginas de gestão interna |
| Clareza dos nomes | Bom | Domínio é legível e semanticamente forte |
| Tamanho dos arquivos | Regular/Crítico | Algumas páginas e rotas são grandes demais |
| Tratamento de erro | Regular | Backend bom; frontend silencia falhas com frequência |
| Segurança | Regular | Boa base de auth e tenant, mas autorização fina ainda depende de disciplina |
| Acoplamento frontend/backend | Regular | Contratos são diretos, mas vários agregados vivem no frontend |
| Testes | Crítico | Não foram encontrados testes automatizados no repositório |
| Documentação | Regular | Rica, porém parcialmente desatualizada |
| Riscos técnicos | Alto | Há decisões de modelagem críticas ainda abertas |

## 12. Problemas encontrados

### Problemas críticos

| Descrição | Local | Impacto | Recomendação |
|---|---|---|---|
| Ausência de testes automatizados apesar de dependência de `vitest` | projeto inteiro | regressões passam sem barreira | criar suíte mínima de smoke/contrato |
| Dualidade de modelagem entre `LicencaAmbiental` e `Processo` | schema + módulos ambiental/processos | risco de duplicação e divergência funcional | decidir eixo dominante antes de migrar outros projetos |
| Gestão interna comercial/financeira sem entidades próprias | `web/(app)/servicos`, `contratos`, `ordens-servico`, `financeiro`, `entregaveis` | risco de migrar telas “bonitas” sem domínio sólido | consolidar modelo antes de importar outros projetos |
| Documentação arquitetural defasada em pontos centrais | `PLANEJAMENTO.md`, `docs/arquitetura/*` | decisões podem ser tomadas sobre diagnóstico antigo | atualizar docs após estabilização |

### Problemas médios

| Descrição | Local | Impacto | Recomendação |
|---|---|---|---|
| Dependências declaradas sem uso aparente | `apps/web/package.json`, `apps/api/package.json` | ruído e manutenção desnecessária | revisar e remover ou justificar |
| `swagger` declarado mas não publicado | backend | falsa expectativa de documentação automática | registrar plugins ou remover dependências |
| Muitas páginas silenciam erro e mostram vazio | frontend | falha operacional pode parecer “sem dados” | padronizar feedback de erro |
| Autorização fina por empreendimento não é claramente uniforme | vários modules/services | risco de exposição interna entre postos do mesmo tenant | centralizar policy enforcement |
| `packages/ui` placeholder vazio | `packages/ui` | confusão arquitetural | remover ou ativar |

### Problemas baixos

| Descrição | Local | Impacto | Recomendação |
|---|---|---|---|
| `pino-pretty` em dependência normal | API | impacto baixo | mover para devDependency se viável |
| Alguns arquivos de página são grandes e verbosos | várias telas | manutenção mais lenta | refatorar por subcomponentes quando estabilizar |

### Problemas de arquitetura

- decisões abertas sobre unificação de licença/processo
- decisões abertas sobre ativos técnicos e ensaios
- decisões abertas sobre fiscalizações/processo sancionador
- packages compartilhados ainda não cobrem todo o domínio

### Problemas de banco

- schema evoluiu além dos números da documentação
- há entidades já marcadas pela própria documentação como transitórias ou candidatas a refatoração
- algumas telas dependem de catálogos seedados para parecerem completas

### Problemas de frontend

- gestão interna comercial/financeira é híbrida ou mockada
- algumas agregações importantes vivem na camada de página e não em serviços dedicados
- normalização manual de payloads com `any`

### Problemas de backend

- ausência de camada central de autorização baseada em policy
- alguns módulos usam service, outros fazem query direta, o que gera estilos mistos
- OpenAPI/Swagger não está exposto

### Problemas de segurança

- autorização por `tenantId` está forte, mas a por `empreendimentoIds` precisa auditoria mais profunda antes de migração
- portal tem estratégia dupla de autenticação que merece consolidação

### Problemas de UX

- páginas internas de contratos/financeiro/OS ainda têm cara de protótipo evoluído
- fallback silencioso de erro reduz confiança operacional

### Problemas de documentação

- `PLANEJAMENTO.md` e parte de `docs/arquitetura` não refletem totalmente o estado atual
- inexistência de README operacional enxuto na raiz do projeto

## 13. Oportunidades de melhoria

- Padronizar autorização por policy central, usando perfil + escopo de empreendimento.
- Criar entidades reais para `Contrato`, `OrdemServico`, `Entregavel` e domínio financeiro.
- Atualizar a documentação arquitetural para o estado atual do código.
- Conectar mais módulos aos packages compartilhados (`schemas`, `types`, `utils`).
- Reduzir `any` e normalização manual no frontend.
- Extrair agregados hoje calculados no frontend para endpoints próprios quando fizer sentido.
- Revisar dependências ociosas.
- Integrar `scripts/lint-empreendimento-id.ts` ao CI.
- Criar suíte mínima de testes de autenticação, processos, documentos e portal.
- Decidir formalmente a estratégia de evolução do domínio de licenças, ativos técnicos e fiscalizações.

## 14. O que deve ser protegido antes de consolidar outros projetos

- autenticação JWT, refresh token e cookies
- modelo multi-tenant baseado em `tenantId`
- seeds demo e seeds de catálogos regulatórios
- schema Prisma atual e migrations já aplicadas
- fluxo de upload/download com S3/MinIO
- módulos centrais: empreendimentos, processos, documentos, condicionantes, tarefas e alertas
- dashboards e cockpit já conectados ao banco
- portal do representante
- worker, schedulers e filas BullMQ
- integrações com IA, Resend e Z-API
- rotas de onboarding, gap analysis e preview de orçamento

## 15. Recomendação para próxima etapa

### Pode receber migrações?

Sim, mas com cautela e por ondas. O projeto oficial já é suficientemente maduro para absorver código e dados de outras pastas, desde que a migração respeite o modelo atual e não tente redesenhar o núcleo durante a incorporação.

### Ajustes recomendados antes

1. Revisar e padronizar autorização por perfil/empreendimento.
2. Atualizar a documentação interna para o estado atual do código.
3. Decidir o destino dos domínios híbridos de gestão interna.
4. Criar testes mínimos para o núcleo operacional.
5. Revisar dependências ociosas e o placeholder `packages/ui`.

### Módulos que devem ser estabilizados primeiro

- autenticação e autorização
- empreendimentos
- processos
- documentos
- condicionantes
- tarefas/alertas
- onboarding/gap analysis/orçamento

### Informações que ainda precisam ser levantadas nas outras pastas

- quais modelos já existem para contratos, OS, financeiro e entregáveis
- se há implementações mais maduras para CRM/comercial
- se existe outra modelagem concorrente para licenças, fiscalizações ou equipamentos
- se há ativos reutilizáveis de UI ou relatórios melhores do que os atuais

### Próxima auditoria recomendada

Auditar especificamente a pasta externa que concentrar:

- domínio comercial/contratual
- financeiro
- ordens de serviço
- entregáveis

Se houver múltiplas pastas candidatas, a próxima auditoria deve comparar apenas esses domínios contra o projeto oficial, e não repetir a auditoria do núcleo já consolidado aqui.

