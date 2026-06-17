# 103 — MAPA DOS MOTORES (a bagunça) + PLANO DE CONVERGÊNCIA (caracterização → diagnóstico)

> Investigação de 2026-06-17. Responde: (a) o "Motor de Orçamento" está duplicado? (b) como portar o fluxo **caracterização → diagnóstico** do sistema original (`enviro-clarity`) pro atual. Relacionado: [[101]] (blueprint do motor), [[102]] (backlog).

---

## PARTE 1 — A DUPLICAÇÃO (o que sustenta cada tela)

Existem **5 computações de diagnóstico/orçamento sobrepostas** no Posto Sistema, com fontes e graus de calibragem diferentes:

| # | Motor | Onde | Fonte da regra | Discrimina pelo perfil físico? | Quem consome |
|---|---|---|---|---|---|
| 1 | **Fonte única (NOVO)** | `modules/diagnostico/` | tabela `RegulatoryMatrix` + `obrigacao.aplicabilidade` (condicional) | **SIM** (CNAE+tanque+captação+aquífero) | aba "Diagnóstico" do posto (Passo 10) |
| 2 | **Cockpit eixos** | `/cockpit/diagnostico` | conta CRUDs por módulo | não | dashboard + cabeçalho do posto |
| 3 | **Comercial** | `comercial/diagnostico.service.ts` | **`REGULATORY_MATRIX` HARDCODED no código** (9 CNAEs) | parcial (só CNAE) | triagem comercial / propostas (lead pré-cadastro) |
| 4 | **Onboarding gap-analysis** | `onboarding/gap-analysis` + rota `/obrigacoes` | `obrigacaoRegulatoriaBase` filtrado por `tipoEmpreendimento`/`uf` — **IGNORA `aplicabilidade`** | **NÃO** (lista as 34 genéricas) | tela de onboarding (passo 2) **e o Motor de Orçamento** |
| 5 | **Onboarding budget-preview** | `onboarding/budget-preview.service.ts` | `servicoCatalogo` + `politicaPrecificacaoDiagnostico` + `complianceSnapshot` | não | orçamento do Motor (R$ 72.399,60) |

### O "Motor de Orçamento — Painel da Condução" (`/motor-orcamento`)
- É alimentado por **#4 (gap-analysis) + #5 (budget-preview)** — os genéricos. Por isso lista as **34 obrigações iguais** e não usa o `aplicabilidade` que semeamos.
- Tem **7 etapas-fachada** (as "opções escondidas" que você notou): `Triagem · Caracterização · Diagnóstico · Obrigações · Execução · Documentos · Financeiro`. A página **default direto pra `financeiro`**; as etapas são abas de navegação, a maioria mostrando a mesma gap-analysis. A aba "Caracterização" tem descrição "Gerar diagnóstico regulatório" — é uma **casca fina**, não a caracterização rica do original.

### Veredito
Duplicação real e cara: 5 motores, 3 "matrizes regulatórias" diferentes (tabela nova, hardcoded no comercial, e a lista por tipoEmpreendimento). A tela bonita ("Painel da Condução") é o **esqueleto de UX certo**, mas plugado nos motores **errados** (genéricos) e com fases inertes.

---

## PARTE 2 — O ORIGINAL (`INTERFACE/enviro-clarity-main`) — íntegro

Protótipo Vite+React (53 páginas, 42 libs, base de conhecimento, builda). Tem o fluxo que falta no atual:

### Fluxo `caracterização → diagnóstico` (o que portar)
1. **`CaracterizacaoPage.tsx`** — questionário estruturado em **blocos** (os discriminadores):
   - Situação operacional (opera/implanta/amplia/altera)
   - **Água** (captação? superficial/subterrânea? efluentes? outorga?)
   - **Resíduos** (gera? Classe I? PGRS? logística reversa?)
   - Emissões (atmosféricas? fontes fixas? odores? monitoramento?)
   - **Combustíveis/tanque** (combustíveis? químicos? **tanque enterrado**? armazenamento sensível?)
   - Localização (urbana/rural? APP? curso d'água? área sensível?)
   - Regulatório (licença vigente? condicionantes? fiscalizado? pendência? **passivo**?)
   - Ao concluir: salva as respostas e `navigate("/diagnostico")` — **caracteriza, depois diagnostica.**
2. **Base de conhecimento** `src/knowledge/` — blocos por módulo (`posto-ambiental`, `posto-sst`, `posto-logistica-reversa`), `alert-rules`, `knowledge-resolver`. É o "porquê" de cada obrigação.
3. Engines: `diagnostic-engine`, `regulatory-engine` (matchCnae exato→prefixo→grupo), `budget-engine` — **a lógica já foi portada** pro nosso motor calibrado (Passos 4-7).

**O que a cópia perdeu:** a `CaracterizacaoPage` (o input discriminante) e o `knowledge` (o conhecimento). Sobrou catálogo + engine parcial → diagnóstico genérico.

---

## PARTE 3 — PLANO DE CONVERGÊNCIA (incremental, baixo risco)

Princípio: a **fonte única (#1)** é o alvo. Os outros 4 convergem nela, **um por vez**, sem big-bang, sem quebrar o que está no ar.

### Fase A — Ganho rápido: gap-analysis passa a discriminar *(1 arquivo)*
A rota `/onboarding/obrigacoes` e o gap-analysis listam por `tipoEmpreendimento`. Trocar por: rodar a **fonte única** (ou ao menos filtrar por `aplicabilidade`) → a tela de onboarding e o Motor de Orçamento deixam de ser genéricos **imediatamente**. Sem mexer em UX. **Maior valor / menor esforço.**

### Fase B — Trazer a CARACTERIZAÇÃO (o input que falta)
1. Estender o cadastro/onboarding pra capturar os discriminadores (CNAE, parede/idade do tanque, captação, aquífero/solo, distâncias) — os campos já existem no schema (Passo 0); falta o formulário. Defaults "ESTIMADO" quando não sabe (Decisão 1).
2. Portar os **blocos de perguntas** da `CaracterizacaoPage` original como o questionário de caracterização → grava no `Empreendimento` → dispara o recálculo (gatilho do Passo 8 já existe).
3. A aba "Caracterização" do Painel da Condução deixa de ser casca e vira o questionário real.

### Fase C — Painel da Condução powered by fonte única
- Etapas `Diagnóstico` e `Obrigações` passam a ler a **fonte única** (a aba do Passo 10 já faz isso — reusar o componente).
- Aposentar o **comercial `REGULATORY_MATRIX` hardcoded (#3)**: a triagem comercial passa a usar a tabela `RegulatoryMatrix` real (precisa cobrir o caso lead-só-CNAE, pré-empreendimento).

### Fase D — Orçamento único
- Reconciliar `budget-preview (#5)` com o `orcamentoEstimado` da fonte única (hoje calculam diferente). Decidir 1 fórmula. O motor já soma `custoServicoRef` dos gaps.

### Fase E — Aposentar o cockpit eixos (#2)
- Dashboard/cabeçalho passam a derivar da fonte única. Por último (mais consumidores).

### Ordem recomendada: **A → B → C → D → E**
A entrega valor visível já (mata o genérico); B traz o que você apontou (caracterizar antes); C-E limpam a duplicação. Os 403 testes não podem quebrar; cada fase é um PR isolado.

---

## RISCOS / NOTAS
- Tudo está **no ar com clientes reais** — cada fase é incremental e reversível.
- O comercial roda **pré-empreendimento** (lead só com CNAE) — a fonte única hoje precisa de um empreendimento; cobrir esse caso é parte da Fase C.
- Multi-serviço (virada estratégica, [[102]] seção E) encaixa aqui: a caracterização + matriz por CNAE já são genéricas; o que é posto-only (checkers físicos) é que precisa generalizar depois.
