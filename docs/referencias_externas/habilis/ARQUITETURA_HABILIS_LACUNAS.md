# ANEXO — LACUNAS DA ARQUITETURA HÁBILIS

> **Documento complementar a** [ARQUITETURA_HABILIS.md](ARQUITETURA_HABILIS.md)
> **Propósito:** registrar tudo que um SaaS B2B real precisa ter e que **não foi coberto** no documento principal — para que nada seja descoberto na hora de executar.
> **Versão:** 1.0 — 2026-04-27
> **Audiência:** Guilherme de Paula (Diretor Técnico)

---

## Por que este anexo existe

O documento principal cobriu com profundidade o **domínio técnico-regulatório** (motor de decisão, módulos ambientais, IA, agentes, schema) — porque essa é a inteligência proprietária da Hábilis.

Mas todo SaaS B2B real precisa de **fundamentos genéricos** que vivem fora do domínio: gestão de conta, LGPD, billing, mobile, integrações governamentais, workflow comercial interno. Esses fundamentos **não existem nos sistemas atuais** (Posto/Intelligence) — então não apareceram no salvage. Como você é não-dev, é fácil eles passarem despercebidos.

Este anexo lista **78 lacunas** organizadas por criticidade. Cada lacuna tem:
- **O que é** (descrição leiga)
- **Por que crítico** (consequência se faltar)
- **Onde se conecta** (módulo do sistema afetado)
- **Esforço estimado** (Baixo / Médio / Alto)
- **Prioridade** (P0 / P1 / P2)

Ao final há uma proposta de **como integrar** essas lacunas ao documento principal e ao cronograma de fases.

---

## ÍNDICE

- [Sumário Executivo](#sumário-executivo)
- [P0 — Bloqueiam produção real](#-p0--bloqueiam-produção-real)
  - [1. Gestão de Conta e Identidade](#1-gestão-de-conta-e-identidade)
  - [2. LGPD e Compliance da Plataforma](#2-lgpd-e-compliance-da-plataforma)
  - [3. Billing e Comercial](#3-billing-e-comercial)
  - [4. Health Checks e Operação Real](#4-health-checks-e-operação-real)
- [P1 — Compromete UX e escala](#-p1--compromete-ux-e-escala)
  - [5. Workflow Comercial da Hábilis Interno](#5-workflow-comercial-da-hábilis-interno)
  - [6. Mobile e Trabalho de Campo](#6-mobile-e-trabalho-de-campo)
  - [7. Documentos Avançados](#7-documentos-avançados)
  - [8. UX Crítica](#8-ux-crítica)
  - [9. Integrações Governamentais](#9-integrações-governamentais)
- [P2 — Desejáveis, não bloqueiam](#-p2--desejáveis-não-bloqueiam)
  - [10. Observabilidade de Produto](#10-observabilidade-de-produto)
  - [11. Segurança Avançada](#11-segurança-avançada)
  - [12. Crescimento e Inteligência da Hábilis](#12-crescimento-e-inteligência-da-hábilis)
  - [13. Empty States e Onboarding UX](#13-empty-states-e-onboarding-ux)
- [Como integrar ao documento principal](#como-integrar-ao-documento-principal)
- [Glossário Adicional](#glossário-adicional)

---

## Sumário Executivo

| Categoria | Itens | Prioridade dominante | Bloqueia o quê |
|---|---|---|---|
| 1. Gestão de Conta e Identidade | 8 | P0 | Login real em produção |
| 2. LGPD e Compliance Plataforma | 8 | P0 | Operação legal no Brasil |
| 3. Billing e Comercial | 8 | P0 | Receita recorrente do produto |
| 4. Health Checks e Operação | 6 | P0 | Operação 24/7 com SLA |
| 5. Workflow Comercial Hábilis | 8 | P1 | Faturamento da consultoria |
| 6. Mobile e Trabalho de Campo | 5 | P1 | Operação fora do escritório |
| 7. Documentos Avançados | 6 | P1 | Validade jurídica plena |
| 8. UX Crítica | 8 | P1 | Adoção e produtividade |
| 9. Integrações Governamentais | 6 | P1 | Diferencial competitivo |
| 10. Observabilidade de Produto | 5 | P2 | Decisões de produto |
| 11. Segurança Avançada | 5 | P2 | Enterprise readiness |
| 12. Crescimento Hábilis | 4 | P2 | Gestão da consultoria |
| 13. Empty States / Onboarding UX | 4 | P2 | Conversão de novos usuários |
| **Total** | **78** | | |

---

# 🔴 P0 — Bloqueiam produção real

## 1. Gestão de Conta e Identidade

> **Por que crítico:** o documento principal cobre auth (login, sessão, refresh, RBAC, multi-tenant), mas **não cobre o ciclo de vida do usuário**. Sem isso, o primeiro problema (esqueci senha) trava o sistema.

| # | Item | O que é | Por que crítico | Onde se conecta | Esforço |
|---|---|---|---|---|---|
| 1.1 | **Esqueci minha senha** (fluxo completo) | Tela "esqueci" → e-mail com link → tela de redefinição → invalidação de sessões antigas | Usuário trava no primeiro problema; suporte recebe ligação | API `auth/`, e-mail, Web | Baixo |
| 1.2 | **Verificação de e-mail** no cadastro | E-mail enviado com token de confirmação; conta inativa até confirmar | Spam, e-mails inválidos, segurança básica | API `auth/`, e-mail | Baixo |
| 1.3 | **2FA / MFA** (autenticação de dois fatores) | Após senha, exigir código TOTP (Google Authenticator) ou SMS | Diretor Técnico tem acesso total — sem 2FA é vulnerável | API `auth/`, Web `(app)/seguranca/` | Médio |
| 1.4 | **Convite de usuário** (fluxo: admin convida → e-mail → aceite → senha) | Admin digita e-mail → sistema gera convite → e-mail → usuário cria senha → acesso liberado | Hoje só existe criação manual (admin define senha) — frágil | API `usuarios/` + `auth/`, e-mail, Web | Médio |
| 1.5 | **Mudança de e-mail / senha pelo próprio usuário** | Tela "Minha conta" com troca de e-mail (com confirmação) e senha (com senha atual) | Política de segurança básica | API `usuarios/`, Web `(app)/perfil/` | Baixo |
| 1.6 | **Gestão de sessões ativas** | Lista de dispositivos logados; botão "deslogar daqui" e "deslogar de todos" | Roubo de sessão; computador esquecido logado | API `auth/sessoes`, Web `(app)/seguranca/` | Baixo |
| 1.7 | **Política de senha + histórico** | Complexidade mínima, expiração configurável por tenant, não repetir últimas N | Compliance LGPD; padrão Enterprise | API `auth/` | Baixo |
| 1.8 | **Termos de Uso + Política de Privacidade (aceite registrado)** | Checkbox no signup com link; data e versão do aceite gravadas em `AceiteTermos` | LGPD obrigatório — multa direta sem isso | DB nova tabela, API, Web | Baixo |

**Modelos novos no banco:**
```
- TokenRecuperacaoSenha (id, usuarioId, token, expiresAt, usadoEm)
- TokenVerificacaoEmail (id, usuarioId, token, expiresAt, confirmadoEm)
- ConfiguracaoMFA (id, usuarioId, secret, ativadoEm, codigosBackup)
- ConviteUsuario (id, tenantId, emailDestinatario, perfilSugerido, conviteToken, criadoPorId, aceitoEm, expiresAt)
- AceiteTermos (id, usuarioId, versaoTermos, ip, userAgent, aceitoEm)
- VersaoTermos (id, conteudo, versao, vigenteDe, vigenteAte)
```

---

## 2. LGPD e Compliance da Plataforma

> **Por que crítico:** mencionado como Risco R13 no documento principal, mas sem solução. **A própria plataforma Hábilis precisa estar em conformidade com LGPD**, não só ajudar os clientes a estarem.

| # | Item | O que é | Por que crítico | Onde se conecta | Esforço |
|---|---|---|---|---|---|
| 2.1 | **Exportação de dados pessoais** (Art. 18 LGPD) | Usuário pede seus dados → sistema gera JSON/PDF com tudo que tem dele | Direito legal do titular; multa direta da ANPD se negar | API `lgpd/export`, Worker | Médio |
| 2.2 | **Exclusão sob demanda** (direito ao esquecimento) | Usuário pede exclusão → sistema anonimiza ou apaga (conforme regra) | Multa; CONTUDO precisa preservar audit log com pseudonimização | API `lgpd/excluir`, Worker, todos os modelos | Alto |
| 2.3 | **Registro de consentimento** | Cada uso de dado pessoal além do estritamente operacional precisa de consentimento registrado | Comprovação em fiscalização ANPD | DB nova tabela `Consentimento` | Médio |
| 2.4 | **DPO / Encarregado configurável por tenant** | Cada tenant cadastra seu DPO (nome, contato); aparece em política | Obrigatório por lei | DB campo no `Tenant`, Web | Baixo |
| 2.5 | **Política de retenção de dados** | Configurar: logs 5 anos, sessões 30 dias, dados de leads descartados 2 anos, etc. — worker apaga | Obrigatório por lei; armazenamento eterno é violação | Worker `lgpd-retention.scheduler.ts` | Médio |
| 2.6 | **Soft delete vs hard delete (padrão)** | Toda exclusão é soft (campo `deletadoEm`); hard delete só em workflow específico | Auditoria + LGPD; recuperação de erros | Schema Prisma global | Médio |
| 2.7 | **Data Processing Agreement (DPA)** com cliente | Modelo de contrato anexo aos Termos; aceite registrado | LGPD obrigatório quando há tratamento de dados de terceiros | Web, jurídico (não-código) | Baixo |
| 2.8 | **Anonimização em logs e analytics** | E-mails, CPFs, telefones nunca em logs nem analytics em texto puro | LGPD; vazamento de log = vazamento de dado | Pino + filtro, AuditLog | Médio |

**Modelos novos no banco:**
```
- SolicitacaoLGPD (id, tenantId, usuarioId, tipo: EXPORTAR|EXCLUIR|CORRIGIR, status, processadoEm, evidenciaS3)
- Consentimento (id, usuarioId, tipo, versaoTexto, ip, userAgent, dataConcessao, dataRevogacao)
- PoliticaRetencao (id, tenantId, entidade, diasRetencao, anonimizar)
- Tenant.dpoNome, Tenant.dpoEmail, Tenant.dpoTelefone (novos campos)
```

---

## 3. Billing e Comercial

> **Por que crítico:** o `PlanoTenant` (STARTER/PRO/ENTERPRISE) já existe no schema, mas **o sistema de cobrança não existe**. Sem isso, é impossível operar como SaaS — alguém precisaria emitir nota e cobrar manualmente cada mês.

| # | Item | O que é | Por que crítico | Onde se conecta | Esforço |
|---|---|---|---|---|---|
| 3.1 | **Integração de pagamento** (Stripe ou Asaas) | Gateway que recebe cartão/boleto/Pix e cobra recorrente | Sem isso, ninguém paga; trabalho manual insustentável | API novo módulo `billing/`, Worker | Alto |
| 3.2 | **Cobrança recorrente automática** | Cron mensal: gera fatura, cobra, marca como pago, envia recibo | Operação saudável de SaaS | Worker `billing.scheduler.ts` | Médio |
| 3.3 | **Limites de uso por plano** | STARTER: 10 empreendimentos, 5 usuários, 5GB; PRO: 50/20/50GB; ENTERPRISE: ilimitado | Sem isso, todos os planos podem tudo | Middleware `enforceLimit`, todas as APIs de criação | Médio |
| 3.4 | **Trial period (15 ou 30 dias grátis)** | Tenant criado com `trialEndsAt`; após, exige cartão | Aquisição comercial padrão SaaS | Schema, API, Worker | Baixo |
| 3.5 | **Suspensão por inadimplência** | Após N dias sem pagamento: suspende (`status: SUSPENSO`); após M dias: cancela | Sem isso, fica pegando carona de graça | Worker `billing.scheduler.ts`, middleware | Médio |
| 3.6 | **Histórico financeiro do tenant** (faturas, recibos, NF-e) | Tela com lista de cobranças, status, links para PDF de fatura/recibo | Cliente exige (corporativo); contabilidade interna | API `billing/`, Web `(app)/financeiro/` | Médio |
| 3.7 | **Cupom de desconto** | Códigos com desconto fixo ou percentual aplicáveis no checkout/renovação | Comercial básico (campanhas, partner deals) | DB, API, Web | Baixo |
| 3.8 | **Emissão de NF-e** (integração Brasil) | Após cobrança paga, emite NF-e via integração (NFe.io, Focus, ou equivalente) | Obrigação fiscal Brasil | Worker, integração externa | Alto |

**Modelos novos no banco:**
```
- Plano (id, nome, preco, limiteEmpreendimentos, limiteUsuarios, limiteStorageGB, recursos[])
- Assinatura (id, tenantId, planoId, status, gatewayCustomerId, dataInicio, proximoVencimento, trialEndsAt)
- Fatura (id, assinaturaId, valor, status, dataVencimento, dataPagamento, gatewayInvoiceId, pdfS3Key)
- MetodoPagamento (id, assinaturaId, tipo, ultimosDigitos, gatewayPaymentMethodId, ativo)
- Cupom (id, codigo, tipo, valor, validade, usosMaximo, usosAtuais)
- AplicacaoCupom (id, tenantId, cupomId, faturaId, aplicadoEm)
- NotaFiscal (id, faturaId, numero, serie, status, xmlS3Key, pdfS3Key)
```

---

## 4. Health Checks e Operação Real

> **Por que crítico:** sem isso, ninguém sabe se o sistema está no ar. Em produção, indisponibilidade silenciosa é o pior cenário.

| # | Item | O que é | Por que crítico | Onde se conecta | Esforço |
|---|---|---|---|---|---|
| 4.1 | **Health endpoints** (`/health`, `/ready`, `/live`) | Endpoints simples que respondem 200 se OK, 5xx se quebrado; checam DB, Redis, S3 | Sem isso, monitoring externo não funciona; load balancer não roteia | API `health/` | Baixo |
| 4.2 | **Métricas Prometheus** ou equivalente | `/metrics` endpoint com contadores e histogramas | Sem visibilidade não há SLA | API + middleware Pino | Médio |
| 4.3 | **Sentry (error tracking)** integrado | Toda exceção não tratada vai para Sentry com stack trace + contexto | Erros silenciosos em produção; suporte cego | API, Web, Worker | Baixo |
| 4.4 | **Status page pública** (status.habilis.com.br) | Página externa mostrando status dos serviços (DB, API, IA, e-mail, WhatsApp) | Cliente liga "está fora do ar?" — sem status page você não sabe responder | Infra externa (BetterStack, Statuspage, ou self-hosted) | Médio |
| 4.5 | **Manutenção programada** (banner UI + bloqueio API) | Configurar janela de manutenção; banner aparece no sistema; modo somente-leitura ou bloqueio | Comunicação de degradação; deploy seguro | API config, Web | Baixo |
| 4.6 | **Versionamento da aplicação + release notes** | Cada deploy tem versão; tela "O que tem de novo" com changelog | Usuário não sabe o que mudou; suporte não sabe qual versão está rodando | Schema, Web, infra | Baixo |

---

# 🟡 P1 — Compromete UX e escala

## 5. Workflow Comercial da Hábilis Interno

> **Por que crítico:** o sistema cobre o ciclo regulatório do **cliente** (posto), mas não o ciclo comercial **interno da Hábilis** (a consultoria que opera o sistema). Sem isso, a Hábilis usa o sistema para gerir clientes, mas continua faturando, contratando e medindo capacidade fora do sistema.

| # | Item | O que é | Por que crítico | Onde se conecta | Esforço |
|---|---|---|---|---|---|
| 5.1 | **Contratos com cliente** (módulo dedicado) | Modelo `Contrato` com escopo, valor, prazo, anexos, vigência, renovação | Hoje vira "documento" genérico; sem rastreabilidade | DB novo modelo, API, Web | Médio |
| 5.2 | **Faturamento técnico** (atuação → fatura) | Cada atuação registrada gera linha de faturamento (ou está coberta por contrato fixo) | Hábilis cobra por atuação ou por contrato; sistema não sabe | DB modelos, API, Worker, Web | Alto |
| 5.3 | **Renovação de contrato** (alertas) | Antes de vencer (90/60/30/7 dias), alerta automático ao gestor comercial | Perda de receita se renovação passar em branco | Worker `vencimentos.scheduler.ts` (estender) | Baixo |
| 5.4 | **Banco de horas / time tracking dos analistas** | Analista registra horas por atuação; permite ver capacidade real vs demanda | Capacidade da equipe vs demanda → dimensionamento | DB modelo `RegistroHora`, API, Web | Médio |
| 5.5 | **Comissionamento comercial** | Executivo comercial tem percentual sobre contrato fechado; sistema calcula | Pagamento de comissão exige cálculo automatizado | DB, API, relatórios | Médio |
| 5.6 | **NPS / pesquisa de satisfação pós-atuação** | E-mail automático após N dias da atuação concluída pedindo nota 0-10 | Qualidade do serviço; retenção de cliente | Worker, e-mail, DB | Baixo |
| 5.7 | **Procuração** (módulo dedicado, não só documento) | Procurações vigentes por empreendimento, com validade, alcance, alerta de renovação | Crítico legal — sem procuração vigente Hábilis não pode atuar | DB modelo `Procuracao`, API, Web | Médio |
| 5.8 | **Rede de fornecedores/parceiros** | Laboratórios, transportadoras, advogados, geofísicos cadastrados; pode ser indicado em atuações | Operação atual usa, sistema não sabe; expansão futura para marketplace | DB modelos, API, Web | Médio |

**Modelos novos no banco:**
```
- Contrato (id, tenantId, empresaId, numero, escopo, valor, dataInicio, dataFim, status, observacoes)
- ContratoEmpreendimento (contratoId, empreendimentoId)  // N:N
- LinhaFaturamento (id, contratoId, atuacaoId?, descricao, valor, mes, status: PREVISTO|FATURADO|PAGO)
- Procuracao (id, empreendimentoId, outorgadoNome, outorgadoCpf, escopo, validade, documentoVersaoId, status)
- RegistroHora (id, usuarioId, atuacaoId?, empreendimentoId, horas, descricao, data)
- Comissao (id, contratoId, usuarioId, percentual, valorCalculado, status)
- PesquisaNPS (id, atuacaoId, nota, comentario, respondidoEm)
- Parceiro (id, tenantId, tipo, nome, cnpj, contato, especialidade)
- ParceiroAvaliacao (id, parceiroId, usuarioId, nota, comentario, atuacaoId?)
```

---

## 6. Mobile e Trabalho de Campo

> **Por que crítico:** o sistema-alvo no documento principal é desktop-first (Next.js padrão). Mas analistas de campo trabalham fora do escritório — visita a posto, vistoria, coleta. Sem mobile, o sistema é "duplo trabalho" (campo no papel + escritório no sistema).

| # | Item | O que é | Por que crítico | Onde se conecta | Esforço |
|---|---|---|---|---|---|
| 6.1 | **PWA (Progressive Web App) responsivo** | Web roda no celular como app instalável; ícone, splash, modo standalone | Visita ao posto = celular, não desktop | Web (`apps/web` config PWA) | Médio |
| 6.2 | **Coleta offline** (sincroniza depois) | Analista entra em modo de trabalho, formulários ficam disponíveis offline; ao voltar online, sincroniza | Postos em áreas remotas com sinal ruim | Web (Service Worker), API conflict resolution | Alto |
| 6.3 | **Foto com geolocalização + timestamp** | Câmera nativa abre, foto sai com EXIF de coordenadas + horário verificável | Prova de visita técnica; auditoria; cliente questiona | Web, API upload | Médio |
| 6.4 | **Assinatura digital do representante na vistoria** | Tela de assinatura no celular; assinatura vira imagem PNG anexada à atuação | Validade legal de vistoria; documentação cliente | Web canvas, API | Médio |
| 6.5 | **Modo Campo simplificado** (sub-app) | Rota `/campo` com UI minimalista: lista de visitas do dia, atuação, evidência, pronto | Foco em produtividade no campo (não navegar 30 módulos) | Web `apps/web/src/app/campo/` | Médio |

---

## 7. Documentos Avançados

> **Por que crítico:** o módulo de Documentos atual cobre upload, versão e validade — mas não as funcionalidades **regulatórias-jurídicas** que tornam o documento juridicamente sólido.

| # | Item | O que é | Por que crítico | Onde se conecta | Esforço |
|---|---|---|---|---|---|
| 7.1 | **OCR** (PDF imagem → texto pesquisável) | Worker processa PDF escaneado e gera texto; permite busca dentro do documento | Buscar conteúdo em laudos antigos | Worker (Tesseract ou Google Vision API) | Médio |
| 7.2 | **Assinatura eletrônica integrada** (ClickSign, D4Sign, ICP-Brasil) | Sistema envia documento para assinatura; rastreia status; recebe assinado | Defesas técnicas, contratos, procurações precisam assinatura válida | Worker, integração externa, API | Alto |
| 7.3 | **Templates de documento** (gerar a partir de modelo + dados) | Modelos com placeholders (`{{empresa.nome}}`, `{{licenca.numero}}`); sistema gera documento final | Diretor não vai redigir do zero sempre; consistência visual | Worker, biblioteca (docx-templates), Web | Médio |
| 7.4 | **Carimbo de tempo / certificação ICP-Brasil** | Documentos críticos recebem carimbo de tempo de uma autoridade certificadora | Validade jurídica plena (defesas, atestados) | Worker, integração externa | Alto |
| 7.5 | **Watermark** (marca d'água nos documentos baixados) | Ao baixar, sistema sobrepõe marca d'água com nome do tenant + data | Rastreabilidade de vazamento; padrão Enterprise | Worker (PDF processing) | Baixo |
| 7.6 | **Versionamento com diff visual** | Comparar versão A com B do mesmo documento (lado a lado) | Identificar o que mudou em revisões | Web (lib de diff PDF) | Médio |

---

## 8. UX Crítica

> **Por que crítico:** sistema com 30 módulos sem essas peças vira labirinto. Isso afeta diretamente adoção e produtividade.

| # | Item | O que é | Por que crítico | Onde se conecta | Esforço |
|---|---|---|---|---|---|
| 8.1 | **Busca global** (Cmd+K em qualquer tela) | Modal único: busca empreendimentos, documentos, processos, tarefas, pessoas — tudo | 30 módulos sem busca = labirinto | Web (cmdk lib), API endpoint | Médio |
| 8.2 | **Notificações in-app** (sino com badge) | Sino no header; lista de notificações; marcar lida/não lida; navegar para origem | Alerta hoje só por e-mail/WhatsApp; usuário entra no sistema sem saber o que mudou | DB modelo, API, Web | Médio |
| 8.3 | **Preferências de notificação por usuário** | Cada usuário escolhe quais alertas recebe e por qual canal (e-mail/WhatsApp/in-app/nenhum) | Cada um quer um canal; hoje só RegraAutomatica por tenant | DB campo `Usuario.preferenciasNotificacao`, API, Web | Baixo |
| 8.4 | **Bulk actions** (selecionar múltiplos itens) | Checkbox na lista; barra de ações em massa: arquivar, atribuir, mover | Operacional crítico — atualizar 50 documentos um a um é inviável | Web em todas listas, API endpoints `batch` | Médio |
| 8.5 | **Importação CSV/Excel** (universal) | Upload de planilha → mapeamento de colunas → validação → import; em vários módulos (não só onboarding) | Migração de dados de cliente novo (tem que ser fácil) | API, Worker, Web wizard | Médio |
| 8.6 | **Exportação CSV/Excel** (universal) | Toda lista tem botão "Exportar"; gera arquivo no servidor | Cliente sempre pede para usar fora do sistema | API endpoints `export`, Worker | Baixo |
| 8.7 | **Auto-save em formulários longos** | Formulários grandes salvam rascunho automaticamente a cada N segundos | Fechar o navegador sem perder; navegação acidental | Web (zustand + debounce + API draft) | Médio |
| 8.8 | **Confirmação de ações destrutivas** | Modal "Tem certeza?" para excluir; digitar nome para confirmar exclusão crítica | Erro humano caro | Web (componente shadcn AlertDialog) | Baixo |

---

## 9. Integrações Governamentais

> **Por que crítico:** o documento principal menciona integrações governamentais como visão futura, mas não detalha. Para diferencial competitivo real, isso precisa ser planejado.

| # | Item | O que é | Por que crítico | Onde se conecta | Esforço |
|---|---|---|---|---|---|
| 9.1 | **API ANP** (consulta cadastro de bombas, postos) | Validação de dados de equipamentos contra cadastro oficial ANP | Diferencial: o sistema conhece o que ANP conhece | Worker, integração ANP | Alto |
| 9.2 | **API INMETRO** (calibrações) | Status de aferição metrológica oficial | Confiabilidade dos dados | Worker, integração INMETRO | Alto |
| 9.3 | **SEMADs estaduais** (cada UF tem o seu) | Submissão e consulta de processos em órgãos estaduais (ex: SEMAD-GO) | Automação real do licenciamento | Worker por UF (começar GO, SP) | Alto |
| 9.4 | **Diário Oficial** (ingestão automatizada) | Worker captura DOU + DO estaduais; agente IA classifica relevância por empreendimento | Mencionei em IA mas sem fonte definida | Worker, scrapers, agente IA | Alto |
| 9.5 | **Receita Federal** (validação de CNPJ + situação) | API pública para validar CNPJ ativo, razão social, atividades | Cadastro confiável; previne erros de digitação | Worker, integração externa | Baixo |
| 9.6 | **Consulta processual automatizada** (e-SAJ, PJe estadual, PJe federal) | Status de processos administrativos/judiciais relacionados | Acompanhamento sem checagem manual | Worker por sistema, integrações | Alto |

---

# 🟢 P2 — Desejáveis, não bloqueiam

## 10. Observabilidade de Produto

| # | Item | O que é | Por que crítico | Esforço |
|---|---|---|---|---|
| 10.1 | **Analytics de uso** (PostHog ou Mixpanel) | Eventos: clique, feature usada, fluxo abandonado | Decisões de produto baseadas em dados, não em achismo | Médio |
| 10.2 | **Heatmap / session recording** | Hotjar, FullStory ou PostHog Session Replay | Entender atrito real do usuário | Baixo |
| 10.3 | **A/B testing** | Testar 2 versões de UI/copy; medir conversão | Otimização de funil | Médio |
| 10.4 | **Feature flags por tenant** | Ativar/desativar features sem deploy | Rollout gradual; trial de feature paga | Médio |
| 10.5 | **Versionamento + release notes "What's New"** | Tela com novidades a cada deploy | Engajamento; usuário descobre features novas | Baixo |

---

## 11. Segurança Avançada

| # | Item | O que é | Por que crítico | Esforço |
|---|---|---|---|---|
| 11.1 | **CAPTCHA em login/signup** (após N falhas) | Bloqueia bots; hCaptcha ou Cloudflare Turnstile | Brute force; cadastros falsos | Baixo |
| 11.2 | **Detecção de login suspeito** | Geolocalização + dispositivo novo → e-mail de alerta | Detecção de invasão | Médio |
| 11.3 | **IP allowlist por tenant** (Enterprise) | Tenant pode restringir login a IPs corporativos | Cliente Enterprise exige | Baixo |
| 11.4 | **Auditoria de segurança / pentest** | Contratação anual de teste de invasão | Confiança Enterprise; bug bounty | (não-código) Alto |
| 11.5 | **Secrets rotation** (chaves API, JWT) | Rotação automatizada de secrets sensíveis | Mitigação de vazamento | Médio |

---

## 12. Crescimento e Inteligência da Hábilis

> Esta seção é sobre métricas **da Hábilis-mãe**, não dos clientes. Hoje o sistema é vazio nisso.

| # | Item | O que é | Por que crítico | Esforço |
|---|---|---|---|---|
| 12.1 | **Dashboard interno Hábilis** (super admin) | MRR, ARPU, churn, tickets abertos, NPS interno, leads no funil | Gestão da consultoria e do produto | Médio |
| 12.2 | **Forecast capacidade × demanda** | Vencimentos próximos × analistas disponíveis × horas alocadas | Dimensionamento de equipe | Médio |
| 12.3 | **Heatmap regional dos clientes** | Mapa do Brasil com clientes/empreendimentos por região | Estratégia comercial | Baixo |
| 12.4 | **Funil comercial agregado** | Leads → triagem → proposta → ganho × período | Decisões comerciais | Baixo |

---

## 13. Empty States e Onboarding UX

| # | Item | O que é | Por que crítico | Esforço |
|---|---|---|---|---|
| 13.1 | **Tour guiado primeira vez** | Overlay na primeira sessão explicando módulos principais | Adoção de novo usuário | Médio |
| 13.2 | **Empty states com call-to-action** | Tela "Você ainda não tem nenhum empreendimento. [+ Cadastrar primeiro]" | Direcionamento; reduz frustração | Baixo |
| 13.3 | **Sample data** (modo demo) | Trial entra com 1 empreendimento de exemplo + dados realistas | Demonstração comercial; teste sem precisar criar tudo | Médio |
| 13.4 | **Templates por tipo de cliente** (rede vs posto único) | Wizard pergunta tipo → cria configuração padrão (módulos, perfis, etc.) | Setup mais rápido | Baixo |

---

## Como integrar ao documento principal

### Impacto nas seções existentes do `ARQUITETURA_HABILIS.md`

| Seção atual | O que muda |
|---|---|
| **2. Glossário Canônico** | Adicionar 25 termos novos (ver [Glossário Adicional](#glossário-adicional)) |
| **3. Mapa Funcional** | Adicionar 4 módulos: Conta do Usuário, LGPD, Billing, Contratos & Faturamento Hábilis |
| **5. Banco de Dados** | Adicionar Grupo 17 (Conta), Grupo 18 (LGPD), Grupo 19 (Billing), Grupo 20 (Comercial Hábilis) — total **+30 modelos novos** |
| **7. Stack Tecnológica** | Adicionar: Stripe/Asaas, ClickSign/D4Sign, PostHog, Sentry, hCaptcha, Tesseract |
| **9. Checklist Mestre** | Adicionar **78 itens** distribuídos pelas categorias acima |
| **10. Fases de Construção** | Inserir 2 fases novas: **Fase 1.5 (Conta + Multi-tenant Avançado)** e **Fase 9 (Billing + LGPD)**; criar **Fase 10 (Mobile/Campo)** opcional |
| **11. Critérios de Pronto** | Adicionar critérios LGPD e Billing |
| **12. Riscos** | Mover R13 (LGPD) de "risco" para "fase planejada" |

### Cronograma revisado (proposta)

```
Fase 0 (Fundação)               ████  (2-3 sem)
Fase 1 (Vertical Diag→Cal)          ██████  (3-4 sem)
Fase 1.5 (Conta + LGPD core)            ██  (1-2 sem)  ← NOVO
Fase 2 (Comercial)                       ████  (2-3 sem)
Fase 3 (Operação Plena)                      ███  (2 sem)
Fase 4 (Módulos Especiais)                       ██████  (3-4 sem)
Fase 5 (IA e Automações)                              ████  (2-3 sem)
Fase 6 (Portal Externo)                                    ██  (1-2 sem)
Fase 7 (Relatórios)                                          ███  (2 sem)
Fase 8 (Comercial Hábilis Interno)                              ████  (3 sem)  ← NOVO
Fase 9 (Billing + LGPD completo)                                    ████  (3 sem)  ← NOVO
Fase 10 (Mobile/Campo)                                                  ███  (2-3 sem)  ← NOVO
Fase 11 (Migração Z+Z)                                                      ███  (2 sem)
                                  └────────────────────────────────────────────┘
                                            ~7-8 meses total (vs 5-6 antes)
```

**Justificativa do aumento:** o cronograma original previa ~5-6 meses para um produto **funcional**, mas não **produção-pronto**. Com as lacunas P0 resolvidas, sobe para 7-8 meses para algo realmente lançável como SaaS B2B comercial.

### Ordem de prioridade dentro de cada P0

Se for preciso priorizar dentro do P0 (recursos limitados):

1. **Primeiro:** Health Checks + Sentry (Fase 0 já — 2 dias)
2. **Segundo:** Esqueci-senha + Verificação de e-mail + Convite de usuário (Fase 1.5 — 1 semana)
3. **Terceiro:** Soft delete + Política de retenção (Fase 1.5 — 1 semana)
4. **Quarto:** Termos + Aceite registrado + DPA (Fase 1.5 — 3 dias)
5. **Quinto:** Trial period + Limites de uso (Fase 9 — 1 semana)
6. **Sexto:** Integração Stripe/Asaas + Cobrança recorrente (Fase 9 — 2 semanas)
7. **Sétimo:** NF-e (Fase 9 — 1 semana)
8. **Oitavo:** 2FA, gestão de sessões, exportação LGPD (Fase 9 — 1 semana)

---

## Glossário Adicional

| Termo | Definição | Onde aparece |
|---|---|---|
| **Assinatura** | Contrato vivo entre tenant e Hábilis (plano + cobrança recorrente) | Billing |
| **Plano** | Pacote de recursos (STARTER/PRO/ENTERPRISE) com limites e preço | Billing |
| **Fatura** | Documento de cobrança gerado mensalmente para uma assinatura | Billing |
| **Trial** | Período de teste gratuito antes da primeira cobrança | Billing |
| **Cupom** | Código com desconto aplicável a fatura | Billing |
| **Limite de Uso** | Restrição quantitativa por plano (empreendimentos, usuários, storage) | Billing |
| **Inadimplência** | Status do tenant após falha de cobrança | Billing |
| **DPO** | Encarregado pelo Tratamento de Dados Pessoais (LGPD) | LGPD |
| **Solicitação LGPD** | Pedido formal de titular de dados (exportar, excluir, corrigir) | LGPD |
| **Consentimento** | Registro de aceite explícito para uso de dado específico | LGPD |
| **Política de Retenção** | Regra de quanto tempo guardar cada tipo de dado | LGPD |
| **Anonimização** | Processo de remover identificadores diretos de dados pessoais | LGPD |
| **Soft Delete** | Marcar como excluído sem apagar fisicamente; preserva histórico | Padrão sistema |
| **Hard Delete** | Apagar fisicamente do banco; usado em workflows específicos | Padrão sistema |
| **MFA / 2FA** | Autenticação de dois fatores (senha + código) | Segurança |
| **Convite de Usuário** | Token enviado por e-mail para novo usuário criar senha e entrar | Conta |
| **Sessão Ativa** | Login atualmente válido em algum dispositivo | Conta |
| **Health Check** | Endpoint que reporta saúde do serviço | Operação |
| **Status Page** | Página externa com status público dos serviços | Operação |
| **Manutenção Programada** | Janela anunciada de degradação ou indisponibilidade | Operação |
| **Contrato** | Acordo formal Hábilis × Cliente, com escopo, valor, prazo, anexos | Comercial Hábilis |
| **Linha de Faturamento** | Item de cobrança (atuação avulsa ou parcela de contrato) | Comercial Hábilis |
| **Procuração** | Documento legal que autoriza a Hábilis a representar o cliente em órgãos | Comercial Hábilis |
| **Banco de Horas** | Registro temporal de trabalho do analista | Comercial Hábilis |
| **NPS** | Net Promoter Score — métrica de satisfação 0-10 | Comercial Hábilis |
| **Parceiro** | Fornecedor externo (laboratório, transportadora, advogado) | Comercial Hábilis |
| **PWA** | Progressive Web App — site instalável como app no celular | Mobile |
| **Modo Campo** | Sub-app simplificado para uso em vistorias | Mobile |
| **OCR** | Optical Character Recognition — extrai texto de imagens/PDFs | Documentos |
| **Watermark** | Marca d'água em documento baixado (rastreabilidade) | Documentos |
| **Carimbo de Tempo** | Certificação temporal por autoridade certificadora ICP | Documentos |
| **Feature Flag** | Chave que ativa/desativa feature sem deploy | Operação |

---

*Fim do anexo — Versão 1.0, 2026-04-27*

**Próximo passo recomendado:** ler o anexo, marcar quais P0/P1 entram e quais ficam para depois, e me devolver para eu **regerar o documento principal como Versão 1.1** com tudo integrado (sem perder nada do v1.0).
