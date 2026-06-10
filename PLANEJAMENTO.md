# PLANEJAMENTO — Sistema Posto (Compliance & Gestão Regulatória)

> Documento de registro e orquestração.
> Criado: 2026-04-09 | Última auditoria: 2026-04-09
> **Este documento reflete o estado REAL auditado do código — não estimativas.**

---

## 1. FLUXO MAPEADO — Estado Real do Sistema

### 1.1 Visão Geral da Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENTE EXTERNO                          │
│          (Representante do Posto via /portal)                │
└──────────────────────────┬───────────────────────────────────┘
                           │ Magic Link / TokenPortal
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    WEB — Next.js 15 (porta 3000)             │
│  /(app)    → Usuários internos (Admin, Analistas, Exec.)     │
│  /portal   → Representantes externos (4 páginas)            │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST API — JWT Bearer
                           ▼
┌──────────────────────────────────────────────────────────────┐
│               API — Fastify + Prisma (porta 3001)            │
│  28 módulos de rotas · Multi-tenant · RBAC (7 perfis)       │
│  Swagger · Rate Limit · Upload S3 · Audit Trail             │
└──────────┬────────────────────────────────┬──────────────────┘
           │                                │
           ▼                                ▼
┌──────────────────┐              ┌──────────────────────────┐
│   PostgreSQL     │              │  WORKER — BullMQ         │
│   (Prisma ORM)   │              │  6 processadores         │
│   64 modelos     │              │  2 schedulers            │
│   11 enums       │              │  email/compliance/ai/    │
└──────────────────┘              │  alerta/scheduler/whats  │
                                  └───────────┬──────────────┘
                       ┌───────────────────────┤
                       ▼                       ▼
             ┌─────────────────┐   ┌──────────────────────┐
             │     Redis       │   │  Serviços Externos   │
             │  Queue + Cache  │   │  Anthropic Claude    │
             └─────────────────┘   │  Z-API (WhatsApp)    │
                                   │  Resend (Email)      │
                                   │  AWS S3 (Arquivos)   │
                                   └──────────────────────┘
```

### 1.2 Domínios Regulatórios — Status Real

| Domínio | Rota Web | API | Schema | Status |
|---------|----------|-----|--------|--------|
| Licenças Ambientais | `/licencas-ambientais` | ✅ | ✅ | **Completo** |
| Regulatório Urbano | `/regulatorio-urbano` | ✅ | ✅ | **Completo** |
| SST (ASOs, EPIs, Treino) | `/sst` + `/funcionarios` | ✅ | ✅ | **Completo** |
| ANP/INMETRO | `/anp-inmetro` | ✅ | ✅ | **Completo** |
| Estanqueidade | `/estanqueidade` | ✅ | ✅ | **Completo** |
| Logística Reversa | `/logistica-reversa` | ✅ | ✅ | **Completo** |
| Outorga Hídrica | `/outorga-hidrica` | ✅ | ✅ | **Completo** |
| Monitoramento Ambiental | `/monitoramento` | ✅ | ✅ | **Completo** |
| Auto Infração (lista) | `/fiscalizacoes` | ✅ | ✅ | **Parcial** — sem detalhe/[id] |
| Recurso Adm. + Defesa Técnica | (sub-recurso de fiscalizações) | ✅ | ✅ | **Parcial** — sem UI |
| Checklists Operacionais | `/checklists` | ✅ | ✅ | **Completo** |
| Legislação / DO | `/legislacao` | ✅ | ✅ | **Completo** |
| Painel Executivo | `/executivo` | ✅ | ✅ | **Completo** |
| Audit Trail | `/auditoria` | ✅ | ✅ | **Completo** |
| Score de Risco | `/risco` | ✅ | ✅ | **Completo** |
| WhatsApp (leads comerciais) | `/whatsapp` | ✅ | ✅ | **Completo** |
| Portal Externo | `/portal` | ✅ | ✅ | **Parcial** — 4 páginas básicas |
| **Relatórios/Exportações** | **Inexistente** | ❌ | ❌ | **Ausente** |
| **CRM (funil de leads)** | **Inexistente** | ❌ | ⚠️ | **Ausente** |

### 1.3 Fluxo de Compliance e Alertas

```
RegraAutomatica (por tenant, via /config/notificacoes)
        │
        ▼ (Worker cron: diário 7h)
vencimentos.scheduler.ts
        │
        ├── Processos vencendo → Alerta
        ├── Documentos (dataValidade) vencendo → Alerta
        ├── Condicionantes vencendo → Alerta
        └── Tarefas atrasadas (cron: hora/hora) → Alerta
        │
        │ ⚠️ GAP: não cobre ASO, TesteEstanqueidade,
        │         calibração de bombas, outorga hídrica
        │
        ▼
AlertaDestinatario (perfis + canais por RegraAutomatica)
        │
   ┌────┴────────────┐
   ▼                 ▼
Email (Resend)   WhatsApp (Z-API)
        │
        ▼
/alertas + ComplianceSnapshot + ScoreRisco
```

### 1.4 Fluxo WhatsApp — Dual Mode (Operacional)

```
Mensagem recebida (Z-API webhook → POST /whatsapp/webhook)
        │
        ▼
ContatoWhatsApp.lookup(número)
   │ Conhecido?
   ├── SIM → Compliance flow (Claude responde sobre tarefas/alertas)
   └── NÃO → Lead flow: coleta nome, empresa, postos, desafios
                  │
                  ▼
            LeadWhatsApp.status = QUALIFICADO (após extração IA)
                  │
                  ▼
           /whatsapp → LeadsPanel (notas, status, reply manual)
```

---

## 2. LEVANTAMENTO DE REQUISITOS — Gaps Reais + Fases Futuras

> Baseado em auditoria do código em 2026-04-09.

---

### Fase 7 — Auto Infração: Detalhe e Defesa Técnica

#### Estado atual (auditado)
- Schema: `AutoInfracao`, `RecursoAdministrativo`, `DefesaTecnica` — **64 campos, relações e índices completos**
- API `/fiscalizacoes`: lista, cria auto, atualiza status, cria recurso, atualiza resultado de recurso — **implementado**
- Web `/fiscalizacoes/page.tsx`: lista de autos com filtros — **146 linhas, funcional**
- **FALTANDO**: página de detalhe `/fiscalizacoes/[id]` com sub-fluxos de recurso e defesa técnica

#### Requisitos Funcionais
- RF01: Tela de detalhe do auto de infração com todos os campos + timeline de status
- RF02: Seção "Recurso Administrativo" na tela de detalhe: criar, visualizar, atualizar resultado
- RF03: Seção "Defesa Técnica" na tela de detalhe: gerar rascunho via IA (Claude), revisar, salvar PDF final
- RF04: Upload de documentos do auto (notificação, petição, laudo) direto na tela
- RF05: KPI na lista: valor total em risco (soma valorMulta dos autos em aberto)
- RF06: Alerta automático: prazo de recurso vencendo em N dias (via RegraAutomatica + vencimentos.scheduler)

#### Requisitos Não-Funcionais
- RNF01: Integrar ao Audit Trail (mutações registradas)
- RNF02: Upload via fluxo existente de S3 presigned URL
- RNF03: Filtros: empreendimento, órgão, status, período

---

### Fase 8 — Relatórios e Exportações

#### Estado atual (auditado)
- **NADA EXISTE**: zero endpoints, zero páginas, zero processador no worker
- **Nenhuma biblioteca PDF/Excel instalada** em nenhum dos packages

#### Requisitos Funcionais
- RF01: Solicitar geração de relatório (async — job enfileirado no worker)
- RF02: Relatório Compliance Geral — tabela de índice por empreendimento — **PDF**
- RF03: Relatório de Vencimentos (30/60/90 dias) — lista filtrada — **PDF + Excel**
- RF04: Relatório SST — ASOs vencendo, treinamentos realizados — **PDF**
- RF05: Relatório Monitoramento Ambiental — leituras x VMP, tendências — **PDF**
- RF06: Relatório Logística Reversa — metas x realizado — **Excel**
- RF07: Relatório Autuações — autos em aberto, valor total — **Excel**
- RF08: Download com link temporário (URL S3 presigned)
- RF09: Notificação por email quando geração concluir

#### Requisitos Não-Funcionais
- RNF01: Geração assíncrona no worker (não bloquear a API)
- RNF02: Armazenar resultado no S3
- RNF03: Template com logomarca do tenant
- RNF04: Limite de 1 relatório simultâneo por tenant (evitar sobrecarga)

---

### Fase 8-B — Vencimentos Scheduler: Cobertura Completa

#### Estado atual (auditado)
- `vencimentos.scheduler.ts` monitora: `Processo`, `Documento` (genérico), `Condicionante`, `Tarefa`
- **GAPS confirmados**: não verifica ASO (SST), `TesteEstanqueidade.proximoTeste`, `BombaAbastecimento.proximaCalibracao`, `PocoArtesiano.proximaRenovacao`

#### Requisitos Funcionais
- RF01: Checar `ASO.dataVencimento` por funcionário ativo — alertar responsável SST
- RF02: Checar `TesteEstanqueidade.proximoTeste` — alertar responsável ANP
- RF03: Checar `BombaAbastecimento.proximaCalibracao` — alertar responsável ANP
- RF04: Checar `PocoArtesiano` (outorga hídrica) data de vencimento da outorga
- RF05: Checar `LicencaAmbiental.dataVencimento` para renovações

---

### Fase 9 — Portal Externo: Versão Completa

#### Estado atual (auditado)
- 4 páginas implementadas: `inicio`, `documentos`, `tarefas`, `alertas`
- Dashboard do início tem score de compliance e alertas prioritários
- Upload de documentos funciona via S3 presigned
- **FALTANDO**: condicionantes, resposta a checklists, mensageria com analista

#### Requisitos Funcionais
- RF01: `/portal/condicionantes` — listar condicionantes do empreendimento com prazos e status
- RF02: `/portal/checklists` — listar checklists atribuídos ao representante; responder itens
- RF03: `/portal/mensagens` — canal de comunicação bidirecional com o analista interno
- RF04: Notificação por email ao representante quando analista enviar mensagem

#### Requisitos Não-Funcionais
- RNF01: Reutilizar autenticação TokenPortal existente (magic link)
- RNF02: Novos endpoints em `/portal/...` no módulo portal já existente

---

### Fase 10 — CRM Comercial: Gestão de Leads

#### Estado atual (auditado)
- `LeadWhatsApp` existe com status: NOVO, EM_CONVERSA, QUALIFICADO, DESCARTADO
- UI básica no `/whatsapp` (LeadsPanel)
- **FALTANDO**: funil Kanban, follow-up, etapas comerciais, métricas de conversão

#### Requisitos Funcionais
- RF01: Migração: adicionar `estagio` (enum EstagioCRM), `responsavelId`, `valorEstimado`, `dataProximoContato` ao `LeadWhatsApp`
- RF02: Novo modelo `FollowUpLead` (tipo, notas, data, usuário)
- RF03: `/crm` — funil Kanban: NOVO → CONTATADO → PROPOSTA_ENVIADA → NEGOCIACAO → GANHO/PERDIDO
- RF04: Detalhe do lead com histórico de follow-ups e mensagens WhatsApp unificadas
- RF05: Alerta de follow-up vencido (via worker)
- RF06: Dashboard de métricas: taxa de conversão, tempo médio no funil

---

### Fase 11 — Onboarding Automatizado

#### Estado atual (auditado)
- Rota API `/onboarding` existe (231 linhas) com workflow de empreendimento
- Página `/empreendimentos/[id]/onboarding` existe
- **FALTANDO**: wizard autoservido para novos tenants, importação CSV, template por tipo de posto

#### Requisitos Funcionais
- RF01: Wizard de 5 passos: Empresa → Empreendimentos → Usuários → Módulos → Finalizar
- RF02: Importação de empreendimentos em lote via CSV/planilha
- RF03: Template de configuração por tipo (bandeirado x independente)
- RF04: Checklist de onboarding com progresso persistido
- RF05: Email de boas-vindas automático com credenciais iniciais

---

### Fase 12 — Scheduler Inteligente (IA)

#### Requisitos Funcionais
- RF01: Análise automática de publicações DO com extração de impacto por empreendimento (Claude)
- RF02: Resumo semanal executivo por email (digest automático)
- RF03: Detecção de anomalias em parâmetros VMP (desvio de tendência)
- RF04: Score de risco preditivo baseado em histórico de conformidade

---

## 3. DESIGN — Telas a Construir

### 3.1 Fase 7 — Detalhe do Auto de Infração (`/fiscalizacoes/[id]`)

```
┌────────────────────────────────────────────────────────────────┐
│  ← Fiscalizações  |  Auto Nº AI-2025/001 — IBAMA   [Editar]  │
│────────────────────────────────────────────────────────────────│
│  Status: EM_ANALISE                                            │
│  ──────────────────────────────────────────────────────────── │
│  DADOS DO AUTO                      PRAZOS                    │
│  Nº: AI-2025/001                    Lavratura:  01/03/2025    │
│  Órgão: IBAMA                       Prazo Defesa: 30/03/2025  │
│  Valor: R$ 25.000,00                Vencimento:  ⚠️  15 dias  │
│  Empreendimento: Posto Centro                                  │
│  Irregularidade: Armazenamento...                              │
│  ──────────────────────────────────────────────────────────── │
│  DOCUMENTOS DO AUTO                          [+ Upload]       │
│  📄 notificacao_ibama.pdf   01/03/2025  [Download]           │
│  ──────────────────────────────────────────────────────────── │
│  RECURSO ADMINISTRATIVO                   [+ Interpor Recurso]│
│  Instância: PRIMEIRA_INSTANCIA                                 │
│  Protocolo: 0001/2025   Data: 10/03/2025                      │
│  Prazo resposta: 60 dias   Resultado: aguardando              │
│  ──────────────────────────────────────────────────────────── │
│  DEFESA TÉCNICA                       [Gerar com IA] [Upload] │
│  Status: RASCUNHO_IA                                          │
│  [Visualizar rascunho gerado pela IA] [Marcar como revisado]  │
└────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Fase 8 — Central de Relatórios (`/relatorios`)

```
┌────────────────────────────────────────────────────────────────┐
│  Relatórios e Exportações                                      │
│────────────────────────────────────────────────────────────────│
│  Filtros globais: [Empreendimento ▼] [Período ▼]              │
│────────────────────────────────────────────────────────────────│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 📊 Compliance│  │ 📅 Vencimentos│  │ 🏭 SST       │        │
│  │ Índice por   │  │ 30/60/90 dias│  │ ASOs +       │        │
│  │ empreend.    │  │ por módulo   │  │ Treinamentos │        │
│  │ [Gerar PDF]  │  │[PDF][Excel]  │  │ [Gerar PDF]  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 💧 Monit.   │  │ ♻️ Log. Rev. │  │ ⚖️ Autuações  │        │
│  │ Ambiental   │  │ Metas x Real │  │ Autos abertos│        │
│  │ VMP/tendência│  │ [Excel]      │  │ [Excel]      │        │
│  │ [Gerar PDF] │  │              │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│────────────────────────────────────────────────────────────────│
│  RELATÓRIOS GERADOS                                           │
│  📄 Compliance_Rede_Abr2025.pdf   ✅ 09/04  [Download]  [🗑] │
│  📊 Vencimentos_30d.xlsx          ⏳ Gerando...               │
│  📄 SST_Abril2025.pdf             ❌ Erro   [Tentar novamente] │
└────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Fase 9 — Portal: Condicionantes + Mensagens

#### `/portal/condicionantes`
```
┌────────────────────────────────────────────────────────────────┐
│  Minhas Condicionantes — Posto Ipiranga Centro                 │
│────────────────────────────────────────────────────────────────│
│  🔴 VENCIDAS (1)                                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Monitoramento trimestral de poços   Venceu 01/03/2025   │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ⚠️ VENCENDO EM 30 DIAS (2)                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Relatório anual de resíduos         Vence 15/04/2025    │  │
│  │ Renovação ART responsável técnico   Vence 20/04/2025    │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ✅ EM DIA (8)  [Ver todas]                                   │
└────────────────────────────────────────────────────────────────┘
```

#### `/portal/mensagens`
```
┌────────────────────────────────────────────────────────────────┐
│  Mensagens — Analista Responsável: Ana Costa                   │
│────────────────────────────────────────────────────────────────│
│  [Ana Costa] 08/04 14:22                                       │
│  O laudo de água do Q1 já foi recebido. Obrigada!             │
│                                                                │
│                    [Você] 08/04 09:10                          │
│                    Enviei o laudo por aqui agora.              │
│  ─────────────────────────────────────────────────────────── │
│  [Escreva uma mensagem...]                          [Enviar]  │
└────────────────────────────────────────────────────────────────┘
```

---

### 3.4 Fase 10 — CRM: Funil de Leads (`/crm`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  CRM — Funil Comercial                  [+ Novo Lead]  Métricas ↗  │
│─────────────────────────────────────────────────────────────────────│
│  NOVO (3)      CONTATADO (2)  PROPOSTA (1)  NEGOC. (1)  GANHO (5) │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  ┌───────┐  │
│  │ João S.  │  │ Maria L. │  │ Rede ABC │  │Posto X│  │ ...   │  │
│  │ 5 postos │  │ 3 postos │  │12 postos │  │1 posto│  │       │  │
│  │ WhatsApp │  │ Ligação  │  │ Proposta │  │Reunião│  │       │  │
│  │ há 1h    │  │ há 2d    │  │ há 5d    │  │amanhã │  │       │  │
│  ├──────────┤  └──────────┘  └──────────┘  └───────┘  └───────┘  │
│  │ Pedro A. │                                                       │
│  │ 2 postos │                                                       │
│  └──────────┘                                                       │
│─────────────────────────────────────────────────────────────────────│
│  Conversão: 38% | Tempo médio: 12d | Pipeline: R$ 48.000/mês       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. BANCO DE DADOS — Mudanças Necessárias

> Os modelos `AutoInfracao`, `RecursoAdministrativo` e `DefesaTecnica` já existem
> no schema com todos os campos necessários. Fase 7 não requer migration.

### 4.1 Fase 8 — Migration: `RelatorioGerado`

```prisma
model RelatorioGerado {
  id            String          @id @default(cuid())
  tenantId      String
  tipo          TipoRelatorio
  parametros    Json            // filtros usados
  status        StatusRelatorio @default(AGUARDANDO)
  s3Key         String?
  downloadUrl   String?
  urlExpiraEm   DateTime?
  solicitadoPor String          // usuarioId
  erroMsg       String?
  geradoEm      DateTime?
  criadoEm      DateTime        @default(now())

  @@index([tenantId, status])
  @@index([tenantId, criadoEm])
}

enum TipoRelatorio {
  COMPLIANCE_GERAL
  VENCIMENTOS
  SST
  MONITORAMENTO_AMBIENTAL
  LOGISTICA_REVERSA
  AUTOS_INFRACAO
  AUDIT_LOG
}

enum StatusRelatorio {
  AGUARDANDO
  PROCESSANDO
  CONCLUIDO
  ERRO
}
```

### 4.2 Fase 10 — Migrations: CRM sobre `LeadWhatsApp`

```prisma
// Adicionar ao modelo LeadWhatsApp existente:
// estagio     EstagioCRM  @default(NOVO)
// responsavelId String?
// valorEstimado Decimal?  @db.Decimal(10, 2)
// dataProximoContato DateTime?

model FollowUpLead {
  id        String       @id @default(cuid())
  leadId    String
  usuarioId String
  notas     String
  tipo      TipoFollowUp
  data      DateTime
  criadoEm  DateTime     @default(now())

  lead      LeadWhatsApp @relation(fields: [leadId], references: [id], onDelete: Cascade)
  @@index([leadId, data])
}

enum EstagioCRM {
  NOVO
  CONTATADO
  PROPOSTA_ENVIADA
  NEGOCIACAO
  GANHO
  PERDIDO
}

enum TipoFollowUp {
  LIGACAO
  EMAIL
  WHATSAPP
  REUNIAO
  NOTA
}
```

### 4.3 Fase 9 — Migration: `MensagemPortal`

```prisma
model MensagemPortal {
  id               String        @id @default(cuid())
  tenantId         String
  empreendimentoId String
  autorId          String        // usuarioId ou tokenPortalId
  tipoAutor        TipoAutorMsg
  conteudo         String
  lida             Boolean       @default(false)
  criadoEm         DateTime      @default(now())

  @@index([tenantId, empreendimentoId, criadoEm])
}

enum TipoAutorMsg {
  INTERNO
  PORTAL
}
```

---

## 5. PROGRAMAÇÃO — Condução Consolidada

### Prioridade e Sequência

```
AGORA ──► FASE 7 ──► FASE 8 ──► FASE 8-B ──► FASE 9 ──► FASE 10 ──► FASE 11 ──► FASE 12
          (1-2d)      (3-4d)      (1d)        (2d)        (2d)         (3d)         (3d)
```

| # | Fase | Entregável | Pré-requisito |
|---|------|-----------|---------------|
| **1** | **7** | `/fiscalizacoes/[id]` — detalhe completo + recurso + defesa IA | Nenhum (schema+API prontos) |
| **2** | **8** | Relatórios: install libs + migration + API + worker processor + web `/relatorios` | — |
| **3** | **8-B** | vencimentos.scheduler.ts: cobertura ASO, estanqueidade, outorga | — |
| **4** | **9** | Portal: `/portal/condicionantes`, `/portal/checklists`, `/portal/mensagens` | Migration MensagemPortal |
| **5** | **10** | CRM: migration LeadWhatsApp + FollowUpLead + `/crm` funil kanban | — |
| **6** | **11** | Onboarding wizard + import CSV + templates | — |
| **7** | **12** | Scheduler IA: digest semanal, anomalias VMP, risco preditivo | Fase 8 (libs instaladas) |

---

### 5.1 Fase 7 — Detalhe Auto de Infração

#### Checklist de Implementação

**Web — `apps/web`**
- [ ] Criar `app/(app)/fiscalizacoes/[id]/page.tsx`
  - Server Component: busca auto por id (com recursos + defesas)
  - Seções: dados do auto, documentos, recurso administrativo, defesa técnica
- [ ] Criar `app/(app)/fiscalizacoes/[id]/_components/RecursoForm.tsx`
  - Form: instância, dataProtocolo, numeroProtocolo, prazoResposta
  - POST `/fiscalizacoes/:id/recursos`
- [ ] Criar `app/(app)/fiscalizacoes/[id]/_components/DefesaTecnicaCard.tsx`
  - Botão "Gerar com IA" → POST `/ia/gerar-defesa-tecnica` (novo endpoint)
  - Visualizar rascunho, marcar como revisado, upload do PDF final
- [ ] Criar `app/(app)/fiscalizacoes/[id]/_components/DocumentosAuto.tsx`
  - Upload de documentos usando fluxo S3 presigned já existente
- [ ] Adicionar KPI de "valor em risco" à lista `/fiscalizacoes/page.tsx`

**API — `apps/api`**
- [ ] Adicionar endpoint `POST /fiscalizacoes/:id/defesa-tecnica` no `fiscalizacoes.routes.ts`
  - Gera rascunho via IA (enfileira job no worker)
- [ ] Adicionar endpoint `GET /fiscalizacoes/resumo` — total em risco por status
- [ ] Adicionar endpoint para upload S3 dos documentos do auto
- [ ] Registrar alertas de `prazoDefesa` no `vencimentos.scheduler.ts`

**Worker — `apps/worker`**
- [ ] Adicionar job `gerar-defesa-tecnica` no `ai.processor.ts`
  - Contexto: auto (órgão, artigo, descrição) + histórico do empreendimento
  - Salvar rascunho em `DefesaTecnica.rascunhoIA`

**Checklist de qualidade**
- [ ] Zero TS errors (`pnpm typecheck`)
- [ ] Audit trail em todas mutações (recurso/defesa)
- [ ] Filtro por `tenantId` em todos os queries

---

### 5.2 Fase 8 — Relatórios e Exportações

#### Checklist de Implementação

**Instalação de dependências**
- [ ] `pnpm --filter @posto/worker add pdfkit @types/pdfkit exceljs`
- [ ] (alternativa PDF) `pnpm --filter @posto/worker add puppeteer` (HTML→PDF)

**Banco de dados**
- [ ] Criar migration: model `RelatorioGerado` + enums `TipoRelatorio` + `StatusRelatorio`
- [ ] Rodar `pnpm --filter @posto/api db:migrate`

**API — `apps/api/src/modules/relatorios/`**
- [ ] `relatorios.routes.ts`
  - `POST /relatorios` — solicita geração (enfileira job, retorna `{ id, status: AGUARDANDO }`)
  - `GET /relatorios` — lista relatórios do tenant (com status)
  - `GET /relatorios/:id/download` — gera presigned URL temporária do S3
  - `DELETE /relatorios/:id` — remove registro + arquivo S3
- [ ] `relatorios.service.ts` — enfileirar job + consultar status

**Worker — `apps/worker/src/processors/`**
- [ ] `relatorio.processor.ts`
  - Roteador por `TipoRelatorio`
  - `renderComplianceGeral(params)` → PDF com tabela de índice por empreendimento
  - `renderVencimentos(params)` → PDF/Excel por módulo + prazo
  - `renderSST(params)` → PDF com ASOs e treinamentos
  - `renderMonitoramento(params)` → PDF com VMP e tendências
  - `renderLogisticaReversa(params)` → Excel com metas x realizado
  - `renderAutuacoes(params)` → Excel com autos em aberto
  - Upload para S3 após geração
  - Notificar usuário por email ao concluir

**Web — `apps/web`**
- [ ] Criar `app/(app)/relatorios/page.tsx`
  - Cards por tipo de relatório com botão "Gerar"
  - Modal de configuração de filtros antes de gerar
  - Lista de relatórios gerados com status (polling simples) e links de download
- [ ] Adicionar "Relatórios" ao sidebar (`app-sidebar.tsx`)

---

### 5.3 Fase 8-B — Scheduler: Cobertura Completa de Vencimentos

#### Checklist de Implementação

**Worker — `apps/worker/src/schedulers/vencimentos.scheduler.ts`**
- [ ] Adicionar função `verificarVencimentosSST(tenantId, diasAntes)`
  - Query: `ASO` onde `dataVencimento <= hoje + N dias` e funcionário ativo
  - Gerar alerta por funcionário/empreendimento
- [ ] Adicionar função `verificarVencimentosEstanqueidade(tenantId, diasAntes)`
  - Query: `TesteEstanqueidade` onde `proximoTeste <= hoje + N dias`
  - Gerar alerta por tanque/empreendimento
- [ ] Adicionar função `verificarCalibracaoBombas(tenantId, diasAntes)`
  - Query: `BombaAbastecimento` onde `proximaCalibracao <= hoje + N dias`
- [ ] Adicionar função `verificarOutorgaHidrica(tenantId, diasAntes)`
  - Query: `PocoArtesiano` onde `dataVencimentoOutorga <= hoje + N dias`
- [ ] Adicionar função `verificarLicencasAmbientais(tenantId, diasAntes)`
  - Query: `LicencaAmbiental` onde `dataVencimento <= hoje + N dias`
- [ ] Integrar todas as novas funções ao scheduler principal respeitando `RegraAutomatica` por tenant

---

### 5.4 Fase 9 — Portal Externo Completo

#### Checklist de Implementação

**Banco de dados**
- [ ] Criar migration: model `MensagemPortal` + enum `TipoAutorMsg`

**API — `apps/api/src/modules/portal/portal.routes.ts`**
- [ ] Adicionar `GET /portal/condicionantes` — condicionantes do empreendimento do token
- [ ] Adicionar `GET /portal/checklists` — checklists atribuídos ao representante
- [ ] Adicionar `PATCH /portal/checklists/:execId/respostas/:itemId` — responder item
- [ ] Adicionar `GET /portal/mensagens` — histórico de mensagens
- [ ] Adicionar `POST /portal/mensagens` — enviar mensagem
- [ ] Worker: notificar analista interno por email quando representante enviar mensagem

**Web — `apps/web/src/app/portal/(portal)/`**
- [ ] Criar `condicionantes/page.tsx`
- [ ] Criar `checklists/page.tsx` + `checklists/[id]/page.tsx`
- [ ] Criar `mensagens/page.tsx`
- [ ] Adicionar links na navegação do portal

---

### 5.5 Fase 10 — CRM Comercial

#### Checklist de Implementação

**Banco de dados**
- [ ] Migration: adicionar campos CRM ao `LeadWhatsApp` (`estagio`, `responsavelId`, `valorEstimado`, `dataProximoContato`)
- [ ] Migration: criar model `FollowUpLead` + enum `EstagioCRM` + `TipoFollowUp`

**API — `apps/api/src/modules/crm/`**
- [ ] `crm.routes.ts`
  - `GET /crm/leads` — listar por estágio (para kanban)
  - `PATCH /crm/leads/:id/estagio` — mover de coluna
  - `GET /crm/leads/:id` — detalhe com mensagens + follow-ups
  - `POST /crm/leads/:id/followups` — registrar follow-up
  - `GET /crm/metricas` — conversão, tempo médio, pipeline

**Web — `apps/web`**
- [ ] Criar `app/(app)/crm/page.tsx` — Kanban board por estágio
- [ ] Criar `app/(app)/crm/[id]/page.tsx` — Detalhe do lead com histórico unificado
- [ ] Adicionar "CRM" ao sidebar no grupo Inteligência

---

### 5.6 Fase 11 — Onboarding Automatizado

#### Checklist de Implementação

**API** (expandir `/onboarding`)
- [ ] `POST /onboarding/importar-csv` — bulk create empreendimentos
- [ ] `GET /onboarding/templates` — listar templates por tipo de posto
- [ ] `POST /onboarding/from-template` — criar empreendimento a partir de template

**Web**
- [ ] Criar wizard multi-step em `/empreendimentos/novo` (já existe, expandir)
  - Step 1: Dados da empresa
  - Step 2: Empreendimentos (manual ou import CSV)
  - Step 3: Usuários e perfis
  - Step 4: Módulos habilitados
  - Step 5: Revisão + finalizar

---

### 5.7 Fase 12 — Scheduler Inteligente

#### Checklist de Implementação

**Worker** (expandir schedulers)
- [ ] `diario-oficial.scheduler.ts` — analisar publicações DO com Claude; criar tarefas automáticas por impacto
- [ ] `digest-semanal.scheduler.ts` — cron toda segunda 8h; resumo executivo por tenant via email
- [ ] Anomalia VMP: detectar leitura acima de limite em `ParametroContaminante`; gerar alerta urgente
- [ ] Score preditivo: usar histórico `ComplianceSnapshot` para projetar tendência

---

## 6. PADRÕES DE DESENVOLVIMENTO

### Estrutura de arquivos (manter consistência)
```
apps/api/src/modules/{modulo}/
├── {modulo}.routes.ts      # Fastify routes + schemas Zod
└── {modulo}.service.ts     # Lógica de negócio

apps/web/src/app/(app)/{modulo}/
├── page.tsx                # Server Component
├── [id]/page.tsx
└── _components/            # Client components específicos
```

### Checklist de qualidade (cada fase)
- [ ] Zero TypeScript errors (`pnpm typecheck`)
- [ ] `tenantId` em todos os queries (nenhum vazamento cross-tenant)
- [ ] Audit trail em todas as mutações
- [ ] Schemas Zod para input/output da API
- [ ] Link no sidebar quando aplicável
- [ ] Migration rodada e commitada

---

## 7. PROGRESSO

| Fase | Status | Início | Conclusão |
|------|--------|--------|-----------|
| 1-6c (baseline) | ✅ Concluído | — | 2026-04-06 |
| 7 — Auto Infração (detalhe) | ✅ Concluído | 2026-04-09 | 2026-04-09 |
| 8 — Relatórios | ✅ Concluído | 2026-04-09 | 2026-04-09 |
| 8-B — Scheduler Gaps | ✅ Concluído | 2026-04-09 | 2026-04-09 |
| 9 — Portal Completo | ✅ Concluído | 2026-04-09 | 2026-04-09 |
| 10 — CRM | ✅ Concluído | 2026-04-09 | 2026-04-09 |
| 11 — Onboarding | ✅ Concluído | 2026-04-09 | 2026-04-09 |
| 12 — Scheduler IA | ✅ Concluído | 2026-04-09 | 2026-04-09 |

---

*Última atualização: 2026-04-09. Todas as fases concluídas.*
