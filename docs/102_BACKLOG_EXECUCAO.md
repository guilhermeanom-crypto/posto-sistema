# 102 — BACKLOG DE EXECUÇÃO (interno — NÃO é entregável de cliente)

> Lista mestre de tudo que abrimos e precisa ser executado. Foco atual: **o motor de diagnóstico** (seção D). O resto fica registrado aqui para não se perder. Atualizado em 2026-06-16.

---

## A. ONDA 2 RESTANTE — fechar bordas (fixes de qualidade/segurança)
- [ ] **Upload de documento interno (C4/A11)** — frontend `upload-documento.tsx` calcular SHA-256 + mandar `documentoId`; fase 3 (`confirmarUploadAction`) mandar `documentoId`. Hoje retorna 400 e a equipe não consegue anexar documento pela tela interna.
- [ ] **Expor storage MinIO via HTTPS público (A8)** — sem isso o PUT do navegador falha (host interno). Pré-requisito pro upload funcionar de verdade.
- [ ] **Monitoramento calcular anomalia (A3)** — `emAlerta` server-side comparando `valorMedido` × `limiteVMP` (hoje é flag manual; módulo é decorativo). + form web enviar `parametros`.
- [ ] **nginx re-resolve upstream** — o 502 que aparece a cada rebuild (nginx cacheia IP do container). Usar resolver + variável no `proxy_pass`.

## B. ONDA 3 — SITE HONESTO
- [ ] **Formulário de Contato (C5)** — não envia nada (sem backend). Implementar envio (Resend/rota) ou trocar por WhatsApp/e-mail reais.
- [ ] **Canal de Denúncias (C6)** — descarta relatos mas promete protocolo (risco jurídico). Implementar backend ou remover a promessa.
- [ ] **CTAs do site dão 404 (A1)** — apontam para `sistema.habilisconsultoria.com.br/portal/login` e `/equipe/login` (404). Corrigir host → `posto.itecologica.com.br`.
- [ ] **"Leia mais" das notícias** não abre artigo (sem rota /noticias/[slug]).
- [ ] **Números/clientes/projetos hardcoded** sem fonte (+208 projetos etc.) (A12) — calibrar/honestar.
- [ ] **WhatsApp/e-mail do site placeholder** (A13) — `5562999990001` / `contato@habilis.com.br` (domínio que não bate). Trocar pelos reais.
- [ ] **Copy inflada** (buzzwords) — cortar 30-40% e ancorar em fatos.

## C. ONDA 4 — RELIGAR (precisa de chaves do usuário)
- [ ] **ANTHROPIC_API_KEY** — liga a IA (análise de documento, geração de defesa, agente). Hoje placeholder.
- [ ] **RESEND_API_KEY** — liga o envio de e-mail (boas-vindas, convites, magic-link). Hoje placeholder.
- [ ] **ZAPI_INSTANCE_ID/TOKEN/CLIENT_TOKEN** — liga o WhatsApp (bug de auth do webhook já corrigido; falta credencial). Hoje vazio → 503.
- [ ] **Status/erro do job de IA (A5)** — expor PENDENTE/ERRO no front (hoje falha silenciosa, "processando" pra sempre).

## D. ⭐ MOTOR DE DIAGNÓSTICO (Blueprint 101) — FOCO ATUAL
- [x] Passo 0 — schema aditivo (5 tabelas, 18 campos, 10 enums)
- [x] Passo 1 — seed (1.335 CNAEs + 27 órgãos + 7 CNAEs de posto na matriz)
- [x] Passo 2 — domain puro (perfil + `evaluateAplicabilidade`, 15 testes verdes)
- [ ] **Passo 3** — migrar as 37 obrigações de `seed/obrigacoes-regulatorias.ts` para `aplicabilidade Json` + consequência/multa/base legal. Regressão: posto revendedor-SP retorna MESMO set.
- [ ] **Passo 4** — `engine/` PURO: portar de `enviro-clarity-main/src/lib/` (matching CNAE exato→prefixo→grupo, enquadramento CNAE→órgão→rito, risco-conformidade com fatores nomeados, orçamento). Trocar `supabase.from` por repo injetado. Teste de OURO + idempotência.
- [ ] **Passo 5** — eixo **risco intrínseco ecológico** (AMEAÇA×VULNER×RECEPTOR + gatilho VMP/estanqueidade). **Pesos revisados e ASSINADOS por Guilherme** antes de produção (até lá, "beta").
- [ ] **Passos 6-12** — `data/` (snapshot-builder + cache) + `service.recalcularDiagnostico` (idempotente) + gatilho no create/update + **shims de leitura** (onboarding/comercial/cockpit/risco/compliance leem o `Diagnostico`) + **migração para PROD** + aposentar motores antigos. Critério-chave: **teste de DISCRIMINAÇÃO** (2 postos mesmo endereço, perfis físicos diferentes → obrigações diferentes); os 403 testes não podem quebrar.

## E. VIRADA ESTRATÉGICA — MULTI-SERVIÇO (decidir depois; construir o motor já genérico)
- [ ] Dimensão **"Tipo de Serviço/Processo"** (posto, outorga hídrica, urbanístico, PGRS...).
- [ ] **Modelos de Cronograma por serviço** — auto-criar as tarefas ao abrir um processo (como fiz à mão na Urbaniza). O "Plano de Condução" PDF é um template de rito.
- [ ] Catálogos de obrigações **por serviço** (outorga: memorial, ART, DUAM, anuência, Veredas...).
- [ ] **Decisão de marca/nome** (posto.itecologica.com.br ficou estreito).
- [ ] **Decisão: quais serviços priorizar** (Posto + Outorga Hídrica já têm caso real).

## F. O ASSISTENTE COMO CÉREBRO (visão do fluxo report — docs/100)
- [ ] Consolidar os **4 agentes do HABILIS_AI** (Diagnóstico, Comercial, Operacional, Compliance) no Assistente Hábilis.
- [ ] Assistente que conversa com todas as seções (responder, diagnosticar, gerar peças, cobrar prazos). Pré-requisito: a fonte única (o motor) existir.

## G. AMARRAR O FLUXO (ciclos incompletos — docs/100)
- [ ] Esteira guiada **comercial → operação → entrega** (handoff→OS→tarefas→entregável, com FKs).
- [ ] **Ciclo de vida de licenças/condicionantes** (prazos → tarefas/alertas automáticos via worker — parte já existe).
- [ ] **Worker de entregáveis** (entregável preso em GERANDO — fila sem worker).
- [ ] `scoreCriticidade` real na **Fila** (hoje hardcoded).
- [ ] **CRM**: `POST /crm/leads` (criação manual de lead — hoje só por WhatsApp).
- [ ] **Magic-link do portal** — unificar URL e validar token (hoje aponta p/ página 404).
- [ ] **Login como admin do tenant** — endpoint de set/reset de senha (hoje senha só por e-mail).

## H. PENDÊNCIAS MENORES
- [ ] Limpeza física de test data (AUDITORIA-QA / REFINO-QA soft-deletados em prod).
- [ ] **CNPJ real da Urbaniza** (placeholder `00000000000000`).
- [ ] Outorga: campo **finalidade/uso** (umectação) + **tipo de captação superficial** (hoje só modelo de poço artesiano).
