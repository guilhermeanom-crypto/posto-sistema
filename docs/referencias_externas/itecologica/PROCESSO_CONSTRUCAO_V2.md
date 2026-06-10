# Processo de Construcao V2

## Status documental

Documento operacional de engenharia da fase V2 da ITECOLOGICA. Define como construir, em que ordem, com quais padroes de codigo, seguranca, testes, deploy e fechamento.

Este documento e seguido ate a conclusao da V2. Em caso de conflito com documentos V1, este documento prevalece para tudo que se refira ao escopo V2; documentos V1 continuam autoritativos sobre o que ja existe em producao.

## Objetivo consolidado

Evoluir a ITECOLOGICA — hoje plataforma de captacao publica + qualificacao comercial + diagnostico ambiental automatizado — em **ferramenta completa de consultoria ambiental para postos de combustivel**, conduzindo o ciclo de trabalho do consultor da captacao ao faturamento dentro de um fluxo unico, sem planilha, e-mail manual ou pasta paralela.

A V2 entrega ao consultor capacidade de:

1. capturar lead (ja existe — `app/`)
2. qualificar comercialmente (ja existe — `crm/`)
3. diagnosticar via pipeline auditavel (ja existe — `analista/` + `backend/domain/diagnostic/`)
4. **materializar o Plano Oficial de Execucao em operacao real** (V2)
5. **gerir execucao com prazos, tarefas, documentos e workflow processual** (V2)
6. **dar visao executiva agregada do portfolio** (V2)
7. **atender verticais especificas de posto: SST e Logistica Reversa** (V2)
8. **fechar o loop financeiro caso a caso** (V2)
9. **absorver eventos regulatorios externos: autos, fiscalizacoes, notificacoes** (V2)

A V2 esta concluida quando, dado um lead capturado na home publica, o consultor conduz o caso ate o faturamento dentro do sistema, sem que nenhuma etapa exija ferramenta externa.

### Nao-objetivos da V2

- Migrar a Home, CRM ou Analista para outra stack. A V2 e construida em cima do mesmo padrao HTML/CSS/JS estatico + Supabase, salvo Sprint 8 que reabre `analista_v2/` como SPA React **apos** o nucleo V2 estar estavel.
- Adicionar funcionalidades fora das nove caixas listadas acima. Tudo que nao couber em uma delas nao entra.
- Substituir o sistema Habilis Intelligence existente. A V2 reaproveita schemas, vocabulario e regras do Habilis e do Posto Compliance, mas e produto independente.
- **Atender outro segmento que nao seja posto de combustivel.** V2 e nicho declarado. Outros segmentos (industria, transporte, etc.) viram V3 ou produto separado.
- **Construir aplicativo mobile nativo.** Web responsivo basta nesta fase. Mobile nativo, se necessario, vira pos-V2.
- **Automatizar comunicacao direta com orgao regulador.** IA gera minuta, humano revisa, humano envia. Sempre. Nao ha "robo que protocola defesa" ou "auto-resposta a notificacao".
- **Substituir o consultor em decisao tecnica.** IA prepara, organiza, sugere. Humano decide e assina. Responsabilidade tecnica continua sendo do profissional habilitado.
- **Abrir multi-tenant antes da decisao formal.** Ate o ADR `0002-tenancy.md` do Sprint 0 ser fechado, V2 assume mono-tenant em codigo. Multi-tenant, se vier, e migracao planejada, nao improviso.

## Filosofia de produto

A ITECOLOGICA V2 nao e plataforma generica de gestao. E **ferramenta pratica de consultoria ambiental para postos de combustivel**. Quem a usa todo dia e o consultor (analista, condutor tecnico, diretor tecnico), nao o cliente final.

Toda decisao de construcao passa pelo filtro:

> Esta funcionalidade reduz tempo, erro ou esforco do consultor em uma tarefa concreta de consultoria?

- "Sim, em X minutos por caso por mes" -> entra.
- "Talvez, depende do uso" -> nao entra ainda.
- "Ajuda em geral" -> e feature solta. **Nao entra.**

Consequencias praticas:

- Nao construimos abas porque ficam bonitas no menu.
- Nao replicamos features de SaaS de mercado por completude.
- Construimos onde o consultor hoje perde hora em tarefa que poderia ser instantanea, ou erra por falta de visibilidade.
- Cada sprint declara explicitamente a dor de consultoria que resolve. Se nao houver dor nominavel, o sprint volta para a prancheta.

### Concorrente real

A V2 **nao compete com SaaS de gestao ambiental** (SOC, Ambify, Verde Ghaia, etc.) — esses sao produtos para o posto, nao para o consultor.

A V2 compete com o estado atual da operacao consultiva:

> **planilha + e-mail + WhatsApp + pasta no servidor + memoria do consultor.**

Esse e o benchmark. Toda decisao de UX, prioridade e metrica de sucesso e tomada com esse concorrente em mente. "Melhor que planilha" e o teste minimo de qualquer feature antes de entrar.

Implicacoes:
- Comparativo de qualidade nao e contra Habilis, SOC ou Ambify; e contra o caos atual.
- Pricing/posicionamento da consultoria muda: a V2 e ferramenta interna que sustenta o servico, nao um SaaS vendido aparte.
- A migracao do consultor da planilha para a V2 e parte do sucesso. Sem adocao, ferramenta vira planilha cara.

## Modo solo / pre-operacao

Esta secao ajusta o documento para o estado real atual da consultoria, declarado em 2026-05-09:

- **Equipe:** 1 pessoa (Guilherme de Paula, Diretor Tecnico, CREA-GO).
- **Clientes ativos:** 0.
- **Empreendimentos sob gestao:** 0.
- **Status comercial:** propostas em curso, nenhum contrato fechado.

A consultoria esta em fase **pre-lancamento**. Sem este ajuste, o documento descreve processo dimensionado para equipe + operacao rodando — cerimonia que nao se sustenta hoje. Com este ajuste, a V2 e construida em modo enxuto, sem abrir mao da barra tecnica, e o processo "ideal" volta a vigorar conforme a operacao crescer.

### Principio do modo solo

> Modo solo nao baixa a barra tecnica. Engenharia (seguranca, RLS, idempotencia, padrao agentic, schema-first, fallback deterministico) vale identica. So processo de gente muda.

### Cerimonias suspensas enquanto solo

| Item do processo completo | Substituto em modo solo |
|---|---|
| Code review com revisor diferente do autor | Self-review com checklist + descanso de 24h, ou Claude como revisor critico em PR |
| Aprovacao de PR por outro humano | Self-merge apos checklist preenchido integralmente |
| Branch `develop` separada de `main` | Simplificado: `main` + `feature/*` direto |
| Janela de promocao ate 16h em dias uteis | Voce decide janela. Evitar deploy sexta a tarde por bom senso. |
| NPS interno com equipe (3 perguntas) | Auto-avaliacao escrita trimestral em `docs/AUTO_RETRO_TRIMESTRAL.md` |
| Campeao interno de adocao | Voce |
| Drill anual de queda controlada | Adiado — desproporcional ao porte atual |
| Retrospectiva de sprint com equipe | Reflexao escrita curta de 5 linhas no fim de cada sprint |

### Sprint 0 em modo solo (1-2 dias, nao 1-2 semanas)

| Tarefa do Sprint 0 completo | Versao em modo solo |
|---|---|
| Baseline de 1 semana de auto-observacao das 4 tarefas-alvo | **Estimativa fundamentada** (~1h). Escreva sua estimativa de tempo atual para cada tarefa em `docs/BASELINE_V2.md` com nota: "estimativa pre-operacao, validar com 1o cliente". |
| ADR de migracao de dados existentes | Trivial. ADR de 1 paragrafo: "Nao ha dado a migrar. Empreendimentos entram pelo onboarding inteligente do Sprint 1 a partir do 1o contrato." |
| ADR de mono vs multi-tenant | Mono-tenant declarado. ADR de 1 paragrafo: "V2 e uso interno da consultoria. RLS por papel + coluna `tenant_id` reservada para futura abertura, mas nao implementada agora. Reabrir quando 2o cliente comercial aparecer." |
| Plano de adocao interna | Curto: "Uso a V2 em todo caso novo a partir de hoje. Sem voltar para planilha." Compromisso publico em `docs/PLANO_ADOCAO_V2.md`. |
| `docs/CONTINUIDADE_V2.md` | Continua relevante e completo. Sistema fora = voce parado. |
| Etapas 3, 4, 6, 7 da consolidacao V1 | Continuam obrigatorias. Sem elas, fundacao quebrada — nao ha modo solo que resolva. |

### Criterio de fechamento em modo solo

KPIs do produto se ajustam:

- **Adocao real >= 80%** -> 100% por default (unico usuario; basta dogfooding consistente).
- **Ganho de consultoria mensurado** -> **adiado** para fase "V2 validada em campo". So e mensuravel apos o 1o cliente real. Modo solo entrega a V2 funcional; validacao numerica vem com o primeiro caso.
- **NPS interno >= 8** -> auto-avaliacao trimestral simples.
- **Uptime >= 99,5%** -> mantem.
- **Custo de IA por caso/mes dentro de target** -> mantem (monitorar desde dia 1).
- **Zero vazamento RLS em auditoria final** -> mantem (auditavel solo).

### Estrutura de papeis projetada desde ja

Mesmo solo, o sistema nasce com a estrutura de papeis pronta — implementar depois e caro, agora e quase de graca (um ENUM + politicas RLS adicionais).

Papeis a registrar no schema desde Sprint 1:

| Papel | Status hoje | Acesso quando ativo |
|---|---|---|
| `diretor_tecnico` | **Voce. Unico ativo.** | Tudo. Aprova plano, ve cockpit, assina laudo. |
| `analista` | Inativo. Entra com 2o-3o cliente. | Workflow, prazos, documentos, SST, logistica, eventos regulatorios. |
| `estagiario` | Inativo. Entra com 2o-3o cliente. | Restrito a tarefas atribuidas, upload e acompanhamento. Sem visao de portfolio. |
| `administrativo` | Inativo. Entra com 2o-3o cliente. | Financeiro, contrato, faturamento. Nao acessa parte tecnica. |
| `comercial` | Inativo. Entra quando voce parar de captar pessoalmente. | CRM, captacao, proposta. Nao acessa execucao. |
| `cliente_final` | Inativo. Entra com Sprint 1 (portal de onboarding). | Apenas o proprio caso: upload de documento + acompanhamento basico. |

Implementacao no Sprint 1: ENUM `user_role` + politicas RLS por papel. Apenas `diretor_tecnico` recebe usuarios na pratica, mas o esqueleto fica pronto. Quando 2a pessoa entrar, e atribuir papel — nao e refatoracao.

### Gatilhos de retorno do processo completo

A medida que a operacao cresce, partes do processo "ideal" reativam:

| Quando acontecer | O que reativa |
|---|---|
| Entra 2a pessoa na equipe (analista, estagiario ou admin) | Code review por outro humano; branch `develop` separada; retro de sprint com a equipe; plano de adocao real com treinamento e campeao |
| Entra o 1o cliente ativo | Baseline real substitui estimativa em `BASELINE_V2.md`; criterio de ganho mensurado vira criterio "V2 validada em campo" |
| Atinge 5+ empreendimentos sob gestao | NPS formal trimestral; drill anual de queda; dashboards detalhados de adocao |
| Entra 2o cliente comercial (outra consultoria interessada na ferramenta) | Reabrir `docs/adr/0002-tenancy.md`. Avaliar abertura para multi-tenant. |
| Volume de chamadas de IA cresce alem do target | Revisar target de custo do Sprint 0; eventual otimizacao de prompt/cache |

### O que NAO muda, mesmo solo

Para deixar explicito, o modo solo nao toca em:

- Os 12 principios de engenharia
- Padrao agentic (gerar -> auditar -> humano revisa -> aprova)
- RLS habilitado em toda tabela
- LGPD e mapa de dados pessoais
- Validacao Zod em toda entrada
- Idempotencia em toda funcao de mutacao
- Fallback deterministico em todo ponto de IA
- Auditoria de toda mutacao de dominio
- Smoke test antes de cada release
- Migration com `up` e `down`
- Filtro anti-feature-solta

Modo solo e sobre processo de gente. Engenharia continua na mesma barra.

## Hierarquia documental

Em caso de conflito de leitura, vale a ordem:

1. [docs/PROCESSO_CONSTRUCAO_V2.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/PROCESSO_CONSTRUCAO_V2.md) (este documento, escopo V2)
2. [docs/MAPA_SISTEMA_CENTRAL_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/MAPA_SISTEMA_CENTRAL_V1.md)
3. [docs/ORQUESTRACAO_HABILIS_ITECOLOGICA_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/ORQUESTRACAO_HABILIS_ITECOLOGICA_V1.md)
4. [docs/PUBLICACAO_VALIDACAO_SUPABASE_OFICIAL_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/PUBLICACAO_VALIDACAO_SUPABASE_OFICIAL_V1.md)
5. [docs/IMPLANTACAO_SEGURA.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/IMPLANTACAO_SEGURA.md)
6. [CHECKLIST_GO_LIVE.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/CHECKLIST_GO_LIVE.md)

## Pre-condicoes nao-negociaveis

A V2 so comeca quando:

- Etapa 3 do plano de consolidacao concluida — `vercel.json` com rewrites + remocao de `app/crm/` e `app/analista/`
- Etapa 4 concluida — `_shared/official-diagnostic.ts` unificado com `domain/canonical-diagnostic.ts`
- Etapa 6 concluida — `shared/tokens.css` e `shared/components.css` extraidos
- Etapa 7 concluida — JS modularizado (`auth.js`, `api.js`, `ui.js`)
- `CHECKLIST_GO_LIVE.md` integralmente verde
- Tag `v2-pre-construcao` criada no estado pos-consolidacao

Construir V2 sobre base inconsistente reproduz e amplifica todos os debitos atuais.

---

## Principios de engenharia

Estes principios sao filtros. Toda decisao de codigo da V2 e validada contra eles.

### 1. Schema antes de UI

Nenhuma tela e desenhada antes do schema Postgres correspondente estar definido, com migration aprovada e RLS habilitado. UI sem schema gera mock; mock vira divida tecnica.

### 2. Materializacao sobre duplicacao

Se um dado ja existe em outro lugar, nao se duplica. O Plano Oficial de Execucao gera obrigacoes, tarefas, documentos e prazos por **materializacao automatica** (edge function), nao por re-cadastro humano.

### 3. Edge function como unico caminho de escrita

Frontend nunca escreve direto no Supabase. Toda mutacao passa por edge function que valida, autoriza e registra. Esse principio ja vige na V1 e e mantido sem excecao na V2.

### 4. Idempotencia por padrao

Toda edge function que cria ou atualiza recurso tem chave de idempotencia. Reentrar a operacao com mesma chave produz o mesmo resultado, sem efeito colateral. Falhas de rede nao corrompem estado.

### 5. Imutabilidade de artefatos canonicos

Plano Oficial, Diagnostico Canonico e Resultado Oficial sao artefatos imutaveis apos aprovacao. Mudanca exige nova versao, nunca sobrescrita. Auditoria depende disso.

### 6. Reversibilidade

Toda migration tem `up` e `down`. Todo deploy tem caminho de rollback documentado. Toda tabela nova nasce com `created_at`, `updated_at` e, quando aplicavel, `deleted_at` (soft delete).

### 7. Observabilidade desde o inicio

Toda edge function nasce com logs estruturados. Toda materializacao nasce com evento de auditoria. Construir e instrumentar sao a mesma tarefa, nao tarefas separadas.

### 8. Seguranca como pre-condicao

Nenhum recurso entra em producao sem RLS configurado e validado. Politica de RLS faz parte da migration, nao e adicionada depois.

### 9. Pequenas releases

Cada sprint e fatiado em PRs pequenos (idealmente <400 linhas alteradas). PR grande e sintoma de escopo errado, nao de complexidade real.

### 10. Documentacao viva

Mudanca relevante de arquitetura atualiza documento canonico no mesmo PR. Documentacao desatualizada e bug.

### 11. Cada feature responde a uma dor concreta do consultor

Toda construcao declara, em uma frase, qual dor de consultoria resolve e qual ganho operacional entrega (tempo economizado, erro evitado, visibilidade ganha). Se a dor nao for nominavel, a construcao nao entra. Esse principio e a defesa anti-feature-solta.

### 12. IA augmenta, nao substitui

IA acelera a tarefa do consultor; nao decide sozinha em materia regulatoria. Toda saida de IA com efeito juridico, regulatorio ou financeiro passa por revisao humana. O padrao agentic ja em uso na V1 (`agent_01 -> agent_02 -> agent_04 -> agent_03 -> revisao humana`) e o template para qualquer uso de IA em outros sprints. IA entra onde houver ganho mensuravel; nao entra como decoracao.

---

## Estrutura do repositorio — regras invariantes

```
ITECOLOGICA/
├── app/                    # Home publica (origem canonica)
├── crm/                    # CRM (origem canonica)
├── analista/               # Area do Analista (origem canonica)
├── analista_v2/            # SPA React futura — Sprint 8 apenas
├── backend/
│   ├── domain/             # Logica de dominio compartilhada
│   │   └── diagnostic/     # Motor de diagnostico (V1)
│   └── supabase/
│       ├── schema.sql      # Schema base V1
│       ├── migrations/     # NOVO na V2 — todas as migrations V2 vivem aqui
│       └── functions/
│           ├── _shared/    # Tipos, utils, schemas Zod
│           └── <funcao>/   # Uma pasta por edge function
├── shared/                 # tokens.css, components.css
└── docs/                   # Documentacao canonica
```

### Regras

- **Nunca** editar `app/crm/` ou `app/analista/`. Sao copias de producao mantidas pelo deploy ate a Etapa 3 estar concluida.
- **Toda nova tabela V2** nasce em `backend/supabase/migrations/` com naming `NNNN_<area>_<descricao>.sql` (ex: `0010_empreendimentos_base.sql`). Nao mais editar `schema.sql` para coisas novas; ele permanece como referencia historica V1.
- **Schemas Zod copiados do Posto Compliance** vivem em `backend/supabase/functions/_shared/schemas/`.
- **Engines portados do Habilis** vivem em `backend/domain/<area>/` (ex: `backend/domain/budget/`, `backend/domain/regulatory/`).
- **Telas novas V2** vivem dentro de `analista/` enquanto a V2 nao migrar para SPA. Nao criar novo diretorio top-level sem decisao explicita.

---

## Modelo de branches e versionamento

### Branches

- `main` — producao. Protegida. So merge via PR aprovado.
- `develop` — integracao da V2. Recebe os PRs de feature.
- `feature/sprint-N-<descricao-curta>` — uma feature por sprint, granular. Ex: `feature/sprint-1-empreendimento-schema`.
- `hotfix/<descricao>` — correcoes diretas em `main`, sempre acompanhadas de merge-back para `develop`.

### Commits

Convencional commits, em portugues:

- `feat: cria tabela empreendimentos`
- `fix: corrige idempotencia em ingest-diagnosis-step-output`
- `refactor: extrai motor de orcamento para domain/budget`
- `docs: atualiza MAPA_SISTEMA_CENTRAL_V1`
- `chore: ajusta vercel.json`
- `test: adiciona smoke test materialize-plan`

Cada commit deve ser auto-suficiente — buildable e testavel sozinho.

### Tags

- `v2-pre-construcao` — antes de iniciar Sprint 1
- `v2-sprint-N-done` — ao final de cada sprint, em `main`
- `v2-final` — ao concluir os 8 sprints

### Pull Requests

- Titulo no formato `[Sprint N] descricao curta`
- Body inclui: objetivo, escopo, criterio de pronto atendido, riscos, plano de rollback
- Tamanho-alvo: <400 linhas alteradas. Acima disso, justificar ou fatiar.

---

## Padroes de codigo

### HTML/CSS/JS estatico (frontend V1 mantido na V2)

- HTML semantico, sem framework
- CSS em `shared/tokens.css` (variaveis) e `shared/components.css` (componentes reutilizaveis). Telas especificas tem seu proprio CSS, mas **so usam tokens**, nunca cores hardcoded
- JS em modulos ES (`import`/`export`), divididos em `auth.js`, `api.js`, `ui.js`, mais arquivos especificos por tela
- Sem dependencias npm no frontend ate Sprint 8
- Nenhum `fetch` direto em handler de UI. Tudo passa por `api.js` que centraliza erro, autenticacao e telemetria

### Edge functions (Deno + TypeScript)

- Estrutura padrao por funcao:
  ```
  functions/<nome>/
    index.ts          # handler
    schema.ts         # Zod do payload
    handler.test.ts   # testes unitarios (Deno test)
  ```
- Toda funcao publica recebe `corsHeaders`, valida `ALLOWED_ORIGINS`, valida payload com Zod, autentica, registra log estruturado de entrada e saida
- Toda funcao retorna no formato `{ ok: true, data }` ou `{ ok: false, error: { code, message } }`. Sem variacao
- Codigo de erro e enum em `_shared/errors.ts`
- Tempo maximo de execucao por funcao: 8 segundos. Acima disso, refatorar para fila ou worker

### Schemas Zod

- Um arquivo por agregado em `_shared/schemas/`
- Re-exportar tipos via `z.infer<typeof X>` para uso na funcao
- Schema do payload e separado do schema do recurso (entrada vs estado)

### Naming

- Tabelas Postgres: `snake_case`, plural (`empreendimentos`, `condicionantes`, `obrigacoes`)
- Colunas: `snake_case`, sem prefixo redundante (`id`, nao `empreendimento_id` dentro da propria tabela)
- Edge functions: `kebab-case`, verbo+substantivo (`materialize-plan`, `update-empreendimento`, `close-tarefa`)
- Variaveis JS/TS: `camelCase`. Componentes/Tipos: `PascalCase`

### Comentarios

Padrao do projeto: nao escrever comentario que descreva o que o codigo ja diz. Comentar apenas:

- decisoes nao-obvias (por que esta assim)
- restricoes externas (limite de API, regulacao)
- referencias a documentos (ex: `// ver docs/PROCESSO_CONSTRUCAO_V2.md secao Idempotencia`)

---

## Padrao de migrations e dados

### Estrutura

```
backend/supabase/migrations/
  0010_empreendimentos_base.sql
  0011_empreendimentos_rls.sql
  0012_condicionantes_base.sql
  ...
```

Numeracao comeca em `0010` para a V2 (deixa folga acima do que existe na V1).

### Regras

1. **Cada migration faz uma coisa.** Tabela em uma, RLS em outra, indices em outra. Migration que cria 4 tabelas e seu RLS junto e impossivel de revisar e reverter.
2. **Toda migration e idempotente** — usa `CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS` (ou `DROP IF EXISTS` antes), `ALTER ... ADD COLUMN IF NOT EXISTS`.
3. **Toda migration tem reversa** — arquivo `.down.sql` correspondente. Mesmo que nunca seja executado, ele documenta como reverter.
4. **Toda tabela tem:** `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` com trigger.
5. **Toda tabela com dado pessoal tem:** `deleted_at timestamptz` (soft delete) e politica de retencao documentada.
6. **Foreign keys sempre com `ON DELETE`** explicito (`CASCADE`, `RESTRICT` ou `SET NULL`). Nunca implicito.
7. **Indices criados na mesma migration** que cria a tabela, baseados nos campos que aparecem em filtros conhecidos. Adicionar depois exige justificativa.

### Seeds

Seeds vivem em `backend/supabase/seeds/`, numerados, executados em ordem. Seed e idempotente — usa `INSERT ... ON CONFLICT DO NOTHING`.

### Backfill

Backfill (popular dado em coluna nova baseado em dado existente) e migration separada, sempre executavel em chunks, sempre logada.

---

## Seguranca

### Autenticacao

- Frontend nao guarda credenciais. Sessao Supabase via cookie httpOnly.
- Edge function chamada autenticada usa `Authorization: Bearer <jwt>`. Funcao valida o JWT e extrai `user_id`.
- Edge function publica (formulario sem login) valida Turnstile **obrigatoriamente** em producao. Sem Turnstile valido, recusa.

### Row Level Security (RLS)

**Toda tabela V2 nasce com RLS habilitado.** Sem excecao.

Padrao minimo por tabela:

- Politica `select`: usuario ve apenas linhas que pertencem ao seu `tenant_id` ou que ele e responsavel
- Politica `insert`: somente service role (via edge function)
- Politica `update`: somente service role
- Politica `delete`: somente service role

Toda politica e testada com SQL de validacao na propria migration.

### Secrets

- Nunca em arquivo versionado. Apenas em variaveis de ambiente Supabase ou Vercel.
- `SUPABASE_SERVICE_ROLE_KEY` jamais no frontend, jamais em log.
- Chaves publicas (`SUPABASE_ANON_KEY`, `TURNSTILE_SITE_KEY`) podem viver em `config.js` por design (ja documentado).
- Rotacao de service role: a cada acesso de pessoa removida da equipe, ou a cada 90 dias, o que vier antes.

### CORS

- `ALLOWED_ORIGINS` revisado em cada deploy. Apenas dominios oficiais.
- Edge function rejeita origin nao listado com `403`, sem retornar headers CORS.

### Validacao de entrada

- Toda entrada externa validada com Zod antes de qualquer logica.
- Tamanho maximo por campo definido no schema.
- Sanitizacao de HTML para campos livres antes de armazenar.

### Logs

- Nunca logar PII (CPF, e-mail, telefone) em log estruturado. Hash quando precisar correlacionar.
- Nunca logar payload completo. Logar apenas chaves e tamanhos.

### LGPD

- Toda tabela com dado pessoal e listada em `docs/MAPA_DADOS_PESSOAIS_V2.md` (criar no Sprint 1).
- Direito de exclusao implementado por edge function `request-data-deletion` que dispara soft delete + agenda hard delete em 30 dias.
- Retencao maxima de log de auditoria com PII: 12 meses.

### OWASP — atencoes especificas para V2

- **A01 Broken Access Control:** RLS testado por tabela. Smoke test com usuario A tentando acessar dado de usuario B.
- **A03 Injection:** Sempre prepared statements via cliente Supabase. Nunca concatenacao de SQL.
- **A05 Security Misconfiguration:** `ALLOWED_ORIGINS`, `RLS habilitado` e `service role nunca exposto` checados antes de cada deploy.
- **A07 Identification and Authentication Failures:** Sessoes com expiracao curta. Refresh token rotacionado.
- **A09 Security Logging and Monitoring Failures:** Toda funcao com log estruturado e evento de auditoria em mutacao.

---

## Testing

### Piramide

1. **Unit** (Deno test, no edge function) — funcoes puras, motores (regulatory, budget, decision). Cobertura-alvo: 80% nas funcoes puras portadas do Habilis.
2. **Integration** (Deno test contra Supabase de dev) — edge functions chamadas com payload real, banco efemero ou transacao revertida.
3. **Contract** (Zod) — schema do payload e do retorno valida em runtime, em desenvolvimento. Em producao, schema do retorno e validado com sample.
4. **Smoke manual** — antes de cada release, roteiro documentado em `docs/SMOKE_V2.md`. Roda em ambiente de staging.
5. **Sem e2e automatizado nesta fase.** A V2 ainda e estatica. E2E entra com Sprint 8 (SPA React).

### RLS testing

Cada migration de RLS vem acompanhada de SQL de validacao em `backend/supabase/migrations/<numero>_rls.test.sql`:

```sql
-- usuario A nao pode ler dado de usuario B
set local role authenticated;
set local request.jwt.claims = '{"sub":"<user_a>"}';
select count(*) from <tabela> where tenant_id = '<tenant_b>';
-- esperado: 0
```

### Quando um teste falha em CI

Build vermelho bloqueia merge. Sem excecao. Sem `--no-verify`. Falha de teste e raiz a investigar, nao obstaculo a contornar.

---

## Observabilidade

### Logs estruturados

Toda edge function loga em JSON com chaves padrao:

```json
{
  "ts": "2026-05-08T12:00:00Z",
  "fn": "materialize-plan",
  "request_id": "uuid",
  "user_id": "uuid",
  "event": "start | success | error",
  "duration_ms": 123,
  "code": "OK | VALIDATION_ERROR | ...",
  "meta": { ... }
}
```

### Metricas minimas por funcao

- Latencia (p50, p95, p99)
- Taxa de erro
- Volume

Em V2 sem APM dedicado, isso vive nos logs do Supabase Functions e e amostrado em planilha semanal ate Sprint 4. A partir de Sprint 4, dashboard simples no proprio Cockpit Executivo.

### Auditoria

Toda mutacao de recurso de dominio (empreendimento, plano, condicionante, obrigacao) gera linha em `audit_events` com `actor_id`, `entity_type`, `entity_id`, `action`, `before`, `after`, `created_at`. Sem excecao.

### Alertas

- Erro 5xx em edge function critica (materialize-plan, ingest-diagnosis-step-output) gera notificacao por e-mail ao time tecnico em <5 minutos.
- Acumulo de >10 falhas em 1 hora em qualquer funcao gera alerta.

---

## CI/CD

### Frontend (Vercel)

- Push em `feature/*` cria preview deploy.
- Merge em `develop` faz deploy em ambiente de staging (subdominio `staging.itecologica.com.br`).
- Merge em `main` faz deploy em producao apos aprovacao manual no painel Vercel.

### Backend (Supabase)

- Migrations rodam via `supabase db push` em pipeline manual ate Sprint 2. Sprint 2 inclui automacao via GitHub Actions com aprovacao manual.
- Edge functions deployadas via `supabase functions deploy <nome>` em pipeline manual.
- Secrets gerenciados via `supabase secrets set` — nunca em commits.

### Promotion

- Toda mudanca passa por: feature branch -> develop -> staging -> main -> producao.
- Janela de promocao para producao: dias uteis, ate 16h. Sexta apos 14h, apenas hotfix.

---

## Definition of Ready (DoR) por sprint

Um sprint so inicia quando:

- objetivo unico declarado em uma frase
- criterio de pronto declarado e mensuravel
- schemas envolvidos identificados (origem: Posto Compliance ou definicao nova)
- telas envolvidas identificadas
- dependencias com sprints anteriores resolvidas
- riscos especificos do sprint listados
- estimativa em dias-pessoa registrada

## Definition of Done (DoD) por sprint

Um sprint so fecha quando:

- criterio de pronto verificado em staging
- todas as migrations aplicadas em producao
- todas as edge functions deployadas em producao
- testes unitarios e de integracao passando
- smoke test manual completo executado
- RLS testado para cada tabela nova
- documento canonico atualizado quando houver impacto
- tag `v2-sprint-N-done` criada
- PR de release com checklist preenchido e mergeado
- nenhum erro 5xx aberto nas funcoes do sprint nas ultimas 48h

---

## Workflow padrao de cada sprint

```
[1] Kickoff (1 dia)
    - Releitura do escopo do sprint neste documento
    - DoR validado
    - Criacao das issues granulares no rastreador
    - Branch develop atualizada

[2] Spike, se aplicavel (0-2 dias)
    - Apenas se houver duvida tecnica nao resolvida
    - Resultado vira ADR (Architecture Decision Record) curta em docs/adr/

[3] Schema first (1-3 dias)
    - Migrations escritas com up/down
    - RLS escrito e testado
    - Seeds minimos
    - PR isolado de migration revisado e mergeado em develop

[4] Edge functions (2-5 dias)
    - Schemas Zod
    - Handlers
    - Testes unitarios e de integracao
    - PRs pequenos por funcao

[5] Telas (2-5 dias)
    - HTML/CSS/JS conforme padrao
    - Integracao via api.js
    - Smoke manual local

[6] Code review
    - Revisor diferente do autor
    - Checklist de code review aplicado integralmente

[7] Deploy em staging
    - Migrations + funcoes + frontend
    - Smoke test em staging

[8] Deploy em producao
    - Janela definida
    - Plano de rollback impresso
    - Monitoramento ativo por 1h pos-deploy

[9] Fechamento
    - Tag v2-sprint-N-done
    - Documento canonico atualizado
    - Retro curta: o que foi previsto vs o que ocorreu
```

---

## Code review checklist

Aplicado em todo PR antes de merge:

**Funcionalidade**
- [ ] PR resolve exatamente uma coisa, declarada no titulo
- [ ] Criterio de pronto do sprint, na parte coberta por este PR, esta atendido
- [ ] Caminho feliz testado
- [ ] Pelo menos um caminho de erro testado

**Codigo**
- [ ] Padroes deste documento seguidos (naming, estrutura de funcao, formato de retorno)
- [ ] Sem dead code, sem console.log esquecido
- [ ] Sem comentario que repete o codigo
- [ ] Sem hardcoded de cor, URL ou ID

**Banco**
- [ ] Migration com up e down
- [ ] RLS habilitado e testado
- [ ] Indices nos campos usados em filtro
- [ ] FKs com ON DELETE explicito

**Seguranca**
- [ ] Sem secret no codigo
- [ ] Validacao de payload com Zod
- [ ] Sem `service_role` no frontend
- [ ] Sem PII em log

**Observabilidade**
- [ ] Log estruturado de entrada e saida
- [ ] Evento de auditoria em mutacao
- [ ] Erros com codigo do enum de erros

**Documentacao**
- [ ] Documento canonico atualizado se necessario
- [ ] PR body com objetivo, escopo, criterio de pronto, plano de rollback

---

## Rollback

### Estrategia geral

Cada deploy tem rollback de 3 niveis, do mais barato ao mais caro:

1. **Frontend** — Vercel "promote previous deployment" (segundos).
2. **Edge function** — `supabase functions deploy <nome>` apontando para o commit anterior (minutos).
3. **Banco** — `down.sql` da migration revertida + restore parcial se necessario (horas, requer aprovacao).

### Quando reverter

- Erro 5xx > 1% das requisicoes em qualquer funcao critica por > 15 minutos
- Dado corrompido detectado em producao
- Vulnerabilidade de seguranca descoberta

### Nao reverter

- Bug cosmetico
- Bug com workaround conhecido e baixo impacto

Nestes casos, abrir hotfix em paralelo, sem reverter.

### Comunicacao

Todo rollback gera entrada em `docs/INCIDENTES.md` (criar no primeiro incidente) com: o que aconteceu, quando, deteccao, mitigacao, causa raiz, acao preventiva.

---

## Continuidade operacional

A V2 pode tornar-se fonte unica de verdade da consultoria. Falha do sistema deixa de ser bug e vira **operacao parada**. Por isso a continuidade e tratada como camada propria, nao como complemento de rollback.

### Mecanismos minimos

- **Export semanal automatico** (cron Supabase) de dados criticos (`empreendimentos`, `obrigacoes`, `prazos`, `documentos`, `eventos_regulatorios`) para CSV/JSON em storage externo. Ultima copia recuperavel sempre disponivel.
- **Modo de leitura offline no frontend** — cache do ultimo estado conhecido permite consulta de prazos e fichas mesmo com Supabase indisponivel. Mutacao bloqueada nesse estado, com aviso explicito ao usuario.
- **Plano de contingencia documentado** em `docs/CONTINUIDADE_V2.md` (criar no Sprint 0 como parte das tarefas de produto): o que fazer se o sistema cair por > 4h, > 24h, > 1 semana. Quem aciona quem. Como continuar atendendo cliente em modo manual.
- **Drill anual** — simular queda controlada (desligar Supabase em ambiente de staging por 2h) e validar que a equipe consegue continuar operando com export + modo offline.

### O que nao tentamos resolver nesta fase

- Multi-region failover. Custo desproporcional ao porte.
- Replica ativa em outro provedor. V2 confia no SLA do Supabase + Vercel.
- Recuperacao de minuto-a-minuto. Granularidade semanal de export e suficiente para o porte da operacao.

---

## IA na V2 — onde entra e onde nao entra

IA e **camada transversal** do produto, nao privilegio dos sprints novos. A V2 ja tem IA no nucleo (`agent_01 -> agent_04` produz o Plano Oficial). A V2 estende esse uso para todas as superficies do sistema — existentes (Home, CRM) e novas (portal do cliente, Cockpit, etc.) — onde houver ganho concreto e mensuravel para o consultor.

O mesmo motor agentic serve a multiplos momentos. Construir um classificador de documento em SST (Sprint 5) significa que esse classificador tambem serve para onboarding do cliente e para upload continuo. Construir um extrator de PDF para auto (Sprint 7) tambem serve para extrair campos de licenca anexada no CRM. **Investimos uma vez, aplicamos em N superficies.**

### Padrao agentic (template oficial)

Todo uso de IA em V2 segue o padrao ja validado:

```
gerar (modelo) -> auditar (modelo segundo ou regra) -> humano revisa -> aprova
```

Nao existe IA que decide sozinha em materia regulatoria, juridica ou financeira. Ponto.

### Pontos de entrada validados — por superficie

| Superficie | Onde IA entra | Ganho operacional | Sprint |
|---|---|---|---|
| **Captacao (home publica)** | Enriquecimento leve do lead no submit (CNAE inferido pela atividade descrita, porte estimado, riscos basicos pre-diagnostico) | Funil pre-qualificado automaticamente; comercial entra ja com leitura | Extensao pos-Sprint 7 (reusa motor) — fora do nucleo V2 |
| **CRM (qualificacao do lead)** | Classificacao automatica do lead em "facil / medio / complexo" + extracao de campos de docs do cadastro inicial (contrato social, alvara) | Roteamento + estimativa preliminar imediatos | Extensao pos-Sprint 7 (reusa motor) — fora do nucleo V2 |
| **Portal do cliente / onboarding** | Cliente faz upload de pacote de documentos -> IA classifica (licenca, alvara, ART, doc SST, manifesto) e extrai campos -> ficha do empreendimento e populada automaticamente -> analista confirma | Onboarding de horas para minutos. **Esta e a superficie nova explicita citada na refinacao** | Dentro de Sprint 1 (materializacao expande para incluir docs do cliente) + reaproveita classificador de Sprint 5 |
| **Diagnostico (existente)** | `agent_01 -> agent_04` ja em producao | Ja existe na V1 | V1 |
| **Materializacao do plano** | Gerar obrigacoes estruturadas do Plano Oficial aprovado | 30 min -> <2 min por caso | Sprint 1 |
| **Cockpit executivo** | Sumario narrativo do estado do portfolio | 60 min -> <15 min de briefing | Sprint 4 |
| **Documentos SST e Logistica** | Classificacao automatica de upload (PGR, PCMSO, LTCAT, OLUC, etc.) + extracao de validade | Tagging manual eliminado | Sprint 5 |
| **Orcamento** | Primeira versao gerada a partir do plano + base historica | Horas -> <30 min por proposta | Sprint 6 |
| **Eventos regulatorios** | Extracao estruturada de auto/notificacao em PDF + pre-classificacao + sugestao de tarefas iniciais | Horas -> <30 min por auto | Sprint 7 |
| **Comunicacao com orgao/cliente** | Minuta de e-mail/oficio baseada em contexto do caso | Rascunho instantaneo, consultor revisa e envia | Sub-feature de Sprint 7 |

### Tres momentos, um motor

O extrator/classificador de documento e construido **uma vez** (Sprint 5) e atende tres momentos distintos:

1. **Onboarding** — cliente envia pacote inicial; IA popula ficha do empreendimento; analista confirma antes de virar oficial.
2. **Operacao continua** — cliente ou consultor anexa novo documento (renovacao de licenca, novo PCMSO, manifesto de pneu); IA classifica, extrai validade, vincula a obrigacao correspondente.
3. **Resposta a evento externo** — auto chega em PDF; mesmo extrator com prompt diferente devolve campos estruturados.

Mesma engenharia, prompts e validadores diferentes. Sem reconstruir.

As entradas marcadas como "Extensao pos-Sprint 7" na tabela acima (Captacao e CRM) **nao sao sprints autonomos** — sao aplicacoes do mesmo motor (classificador de Sprint 5 + extrator de Sprint 7) em superficies existentes. Entram quando ha bandwidth, sem bloquear V2. Se chegarem ao escopo, viram sub-features documentadas em ADR proprio.

### Pontos onde IA NAO entra na V2

**Em geral:**
- Decisao final de aprovacao de plano, condicionante, auto, orcamento, ou ficha do empreendimento. Sempre humana.
- Resposta automatica a cliente, lead ou orgao regulador. Sempre humana — IA gera minuta, humano envia.
- Reclassificacao de risco em tempo real sem auditoria. Sempre human-in-the-loop.
- Geracao de codigo dentro do produto.

**Especificamente em Captacao/CRM:**
- Resposta automatica ao lead no momento do submit. Lead recebe confirmacao padrao; comercial humano engaja.
- Decisao de aceitar ou recusar lead. Humana.
- Cobranca automatica ou disparo comercial sem revisao. Humano define cadencia.

**Especificamente em Onboarding/Portal do cliente:**
- Ficha do empreendimento populada por IA **nao vira oficial sem confirmacao do analista**. Mostra-se como `provisorio` ate revisao.
- Documento upado pelo cliente nao vira fonte regulatoria sem o analista marcar `verificado`.
- Cliente nao recebe interpretacao automatizada do que ele subiu (sem "seu posto esta ok" automatico). Diagnostico segue sendo gerado pelo pipeline existente, com revisao humana.

**Em todo lugar:**
- Chatbot conversacional para usuario final do consultor. V2 e ferramenta de produtividade do consultor, nao interface conversacional. Chat assistente para o proprio consultor pode entrar em V3 (Sprint 8).

### Regras operacionais para IA

- **Fallback determinístico obrigatorio.** Se a chamada de IA falhar, o fluxo continua sem ela (manual ou regra simples). Sistema nunca depende de modelo estar online.
- **Custo monitorado.** Toda chamada loga `tokens_in`, `tokens_out`, `model`, `cost_estimated`. Limite duro de chamadas por caso por dia.
- **Cache agressivo.** Mesmo input -> mesma saida cacheada por 24h. Evita re-cobrar e re-recomputar.
- **Auditavel.** Toda saida de IA usada em decisao guarda: prompt, modelo, versao, output bruto, output validado, quem revisou.
- **Versionado.** Prompt e modelo viram parte do schema. Mudar prompt e mudar versao do agente, com migration.
- **Sem PII no prompt.** Antes de mandar para o modelo, anonimizar campos sensiveis (CPF, telefone). Recomposicao acontece localmente.

### Contrato comum de agente V2

Todo agente novo (alem dos `agent_01-04` ja existentes) implementa:

```typescript
interface AgentContract {
  id: string;                    // ex: 'classify-sst-document'
  version: string;               // semver
  model: string;                 // ex: 'claude-sonnet-4-6'
  fallback: () => Result;        // o que fazer se IA indisponivel
  audit: (output) => Result;     // segundo modelo ou regra
  humanReview: boolean;          // sempre true em V2 para decisao regulatoria
}
```

---

## Roadmap V2 — sprints e particularidades

Sequencia detalhada. Cada sprint tem objetivo unico, escopo, dependencias, particularidades de seguranca e criterio de pronto.

### Nota de prioridade implicita

A ordem tecnica de execucao (1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8) e ditada por dependencia de schema e estabilidade. Mas o ROI por sprint nao e igual:

- **Sprint 3 (Centro de Prazos) tem o maior ROI absoluto.** Prazo perdido = auto = prejuizo direto + responsabilidade do consultor. E a dor de maior impacto financeiro entre todas. Havendo bandwidth, Sprint 3 entra em paralelo a Sprint 2 sem esperar — depende apenas do Sprint 1 estar concluido.
- **Sprints 1, 5 e 7 sao de alto impacto operacional** (materializacao, verticais SST/Logistica, eventos regulatorios). Sao a base recorrente da operacao consultiva.
- **Sprints 4, 6 e 8 sao de alto valor mas nao bloqueiam operacao** se atrasarem. Cockpit e luxo gerencial; orcamento tem fallback aceitavel; SPA e UX, nao funcionalidade.

Em caso de pressao de tempo, cortar do final, nao do meio.

### Sprint 0 — Fundacao consolidada e decisoes de produto

Sprint hibrido: nao introduz funcionalidade nova, mas tem trabalho real de fundacao tecnica e decisoes de produto que travam o resto da V2 se nao forem feitas antes.

> **Em modo solo:** ver secao [Modo solo / pre-operacao](#modo-solo--pre-operacao). As tarefas de produto abaixo descrevem a versao completa (1-2 semanas com equipe + operacao). Em modo solo, a tabela "Sprint 0 em modo solo" reduz para 1-2 dias (estimativa em vez de baseline, ADRs triviais, plano de adocao curto).

**Objetivo tecnico:** garantir que as Etapas 3, 4, 6 e 7 do plano de consolidacao estao concluidas.

**Objetivo de produto:** registrar baselines mensuraveis e fechar quatro decisoes estruturais que a V2 inteira assume.

**Tarefas tecnicas (pre-condicoes ja documentadas):**

- Etapa 3 — `vercel.json` com rewrites + remocao de `app/crm/` e `app/analista/`
- Etapa 4 — `_shared/official-diagnostic.ts` unificado com `domain/canonical-diagnostic.ts`
- Etapa 6 — `shared/tokens.css` e `shared/components.css` extraidos
- Etapa 7 — JS modularizado (`auth.js`, `api.js`, `ui.js`)
- `CHECKLIST_GO_LIVE.md` integralmente verde

**Tarefas de produto (nao-negociaveis antes do Sprint 1):**

1. **Baseline de tempo registrado.** 1 semana de auto-observacao do consultor (Guilherme + equipe), cronometrando as 4 tarefas-alvo do criterio de valor:
   - tempo medio para materializar plano em obrigacoes (hoje em planilha)
   - tempo medio de briefing executivo de portfolio
   - tempo medio para preparar primeira versao de orcamento
   - tempo medio para classificar auto recebido e gerar tarefas
   Sem baseline registrado em planilha versionada (`docs/BASELINE_V2.md`), o criterio de valor da V2 nao e auditavel — nao ha como provar entrega no fechamento.

2. **Decisao de migracao de dados existentes.** A consultoria ja gerencia N empreendimentos hoje em planilha. Decidir como entram na V2:
   - **(a) Re-cadastro pelo onboarding inteligente do Sprint 1** — cliente envia pacote de docs, IA popula ficha, analista confirma. Mais limpo, mais lento.
   - **(b) Import inicial em massa** — script de migracao a partir da planilha existente. Mais rapido, exige normalizacao previa.
   - **(c) Entrada gradual** — empreendimento entra quando o caso encosta na V2 (vencimento, auto, novo servico). Mais natural, mais demorado para portfolio completo.
   Documentar decisao em ADR (`docs/adr/0001-migracao-dados-existentes.md`).

3. **Decisao mono vs multi-tenant.** A V2 e:
   - **(a) Uso interno da ITECOLOGICA** (mono-tenant) — RLS por usuario interno + cliente final do posto.
   - **(b) Produto que outras consultorias podem usar** (multi-tenant) — RLS por consultoria + isolamento de schema/storage por organizacao.
   A diferenca muda RLS, modelagem de auth, pricing e roadmap. Mono-tenant agora nao impede multi-tenant depois, mas as duas premissas devem ser explicitas. Documentar em ADR (`docs/adr/0002-tenancy.md`).

4. **Plano de adocao interna.** Quem treina a equipe? Em que sprint? Quem e o "campeao" interno responsavel por destravar resistencia, cobrar uso e capturar feedback? Adocao planejada e parte da DoD da V2 — sem ela, ferramenta vira planilha cara. Documentar plano em `docs/PLANO_ADOCAO_V2.md`.

**Saida:**
- Tag `v2-pre-construcao` em `main`
- `CHECKLIST_GO_LIVE.md` integralmente verde
- `docs/BASELINE_V2.md` com 4 baselines de tempo registrados
- `docs/adr/0001-migracao-dados-existentes.md`
- `docs/adr/0002-tenancy.md`
- `docs/PLANO_ADOCAO_V2.md`
- `docs/CONTINUIDADE_V2.md` com plano de contingencia (queda > 4h / > 24h / > 1 semana)

**Sem isso, nenhum outro sprint comeca.** Subestimar o Sprint 0 e o erro mais comum em V2 — pular adoa antes de comecar.

---

### Sprint 1 — Materializacao do Plano Oficial -> Empreendimento

**Objetivo:** fechar o ciclo Diagnostico -> Operacao. O Plano Oficial aprovado pelo analista cria automaticamente o empreendimento e suas obrigacoes iniciais.

**Problema de consultoria que resolve:** hoje o Plano Oficial aprovado vira PDF e morre. O consultor refaz manualmente em planilha as obrigacoes para acompanhar — ~30 min por caso, propenso a erro, propenso a esquecimento. A operacao comeca defasada antes mesmo de comecar.

**IA neste sprint:** **alta aderencia**. Dois usos:
1. **Materializacao do plano** — `agent_03` (operacional) ja produz estrutura. Sprint 1 estende para materializar diretamente em registros Postgres, com auditoria via segundo modelo e revisao do analista no momento da aprovacao do plano.
2. **Onboarding do cliente** (mini-portal de upload pos-fechamento de contrato) — cliente envia pacote de documentos do posto (licencas, alvara, ART, contratos de coleta). IA classifica e extrai campos. Ficha do empreendimento nasce em estado `provisorio`; analista revisa, ajusta e marca como `oficial`. Reaproveita o classificador previsto para Sprint 5.

Fallback deterministico em ambos os casos: se modelo falhar, materializacao/onboarding em modo manual com formulario estruturado, sem bloquear operacao.

**Escopo:**
- Migration `0010_empreendimentos_base.sql` (schema copiado de `Posto/sistema/packages/schemas/src/empreendimentos.schema.ts`)
- Migration `0011_empreendimentos_rls.sql`
- Migration `0012_obrigacoes_base.sql` + `0013_obrigacoes_rls.sql`
- Migration `0014_audit_events.sql` (auditoria global)
- Edge function `materialize-plan`
- Tela: ficha do empreendimento V1, dentro de `analista/empreendimento.html`
- Documento `docs/MAPA_DADOS_PESSOAIS_V2.md`

**Particularidade de seguranca:** `materialize-plan` so e disparada por trigger interno (status do diagnostico = aprovado). Nao e exposta a chamada externa direta.

**Particularidade tecnica:** materializacao e idempotente por `(plano_oficial_id, versao)`. Reaprovar o mesmo plano nao duplica obrigacoes.

**Criterio de pronto:** analista aprova um diagnostico em staging e, sem acao manual, o empreendimento aparece com obrigacoes em <30 segundos.

**Risco principal:** schema Posto assume relacionamento com `usuario_id` que ainda nao existe no auth da ITECOLOGICA. Mitigacao: adaptar para `created_by uuid references auth.users`.

---

### Sprint 2 — Workflow do Caso

**Objetivo:** dar trajetoria processual visivel ao empreendimento.

**Problema de consultoria que resolve:** consultor nao consegue mostrar ao cliente onde o caso esta. Cliente liga perguntando "como esta o meu posto?" e a resposta hoje exige consulta a pasta + e-mail + planilha + memoria do consultor. Para o diretor tecnico, e ainda pior: ele nao consegue ver a etapa de cada caso da equipe sem ligar para cada analista.

**IA neste sprint:** **baixa aderencia**. Workflow processual e estado e transicao, nao geracao. IA nao entra aqui — seria decoracao. Excecao opcional: sugestao de "proxima etapa esperada" baseada em historico, mas so se houver dado suficiente apos Sprint 4.

**Escopo:**
- Migrations: `condicionantes`, `tarefas`, `documentos` (schemas copiados do Posto)
- Coluna `etapa_atual` em `empreendimentos` (ENUM: triagem, caracterizacao, diagnostico, obrigacoes, execucao, documentos, financeiro, encerrado)
- Tabela `case_events` para historico de transicoes
- Edge functions: `transition-case`, `create-tarefa`, `complete-tarefa`, `upload-documento`
- Tela: aba Workflow na ficha do empreendimento

**Particularidade de seguranca:** transicao de etapa e auditavel e nunca silenciosa. Cada transicao gera evento em `audit_events`.

**Criterio de pronto:** dado um empreendimento, o usuario ve a etapa atual, etapas anteriores com timestamp e a proxima etapa esperada.

---

### Sprint 3 — Centro de Prazos e Calendario

**Objetivo:** transformar obrigacoes em urgencia acionavel.

**Problema de consultoria que resolve:** prazos sao perdidos por falta de visibilidade unica. O consultor controla por planilha pessoal + calendario do celular + memoria. Vencimento perdido = auto = prejuizo direto ao cliente + responsabilidade do consultor. Esta e a dor de maior impacto financeiro da V2.

**IA neste sprint:** **media aderencia, opcional**. IA pode gerar contexto de cada vencimento ("este prazo se refere a X, depende de Y, exige Z") para acelerar a leitura do consultor na lista. Fallback: ordenacao pura por data + criticidade calculada por regra. Sem IA, o sprint funciona; com IA, o consultor olha menos para frente para entender cada item.

**Escopo:**
- View materializada `prazos_consolidados` com criticidade calculada
- Edge function `compute-criticidade` (job diario)
- Edge function `notify-deadlines` (cron diario, dispara e-mails para vencimentos D-30, D-15, D-7, D-1)
- Tela: Centro de Prazos (lista filtrada)
- Tela: Calendario (referencia visual de `INTERFACE/enviro-clarity-main/src/pages/CalendarioPage.tsx`, reescrito em vanilla)

**Particularidade de seguranca:** notificacoes por e-mail nao expoem dados sensiveis. Conteudo e generico, com link para login.

**Criterio de pronto:** ao logar como operador, vejo os 5 prazos mais criticos da proxima quinzena na primeira tela.

---

### Sprint 4 — Cockpit Executivo

**Objetivo:** visao agregada de portfolio para decisao executiva.

**Problema de consultoria que resolve:** o diretor tecnico nao tem visao de portfolio. Pergunta "como estamos?" exige reuniao de uma hora compilando dados manuais de varios analistas. Decisao de alocacao de recurso e feita por sensacao, nao por dado. Cliente em risco passa despercebido ate o auto chegar.

**IA neste sprint:** **alta aderencia**. Geracao de **sumario narrativo** automatico do estado do portfolio: "3 empreendimentos exigem atencao: Posto X por vencimento de licenca em 7 dias sem renovacao iniciada; Posto Y por auto recebido sem defesa; Posto Z por estanqueidade vencida ha 45 dias." Humano valida ao publicar. Fallback: lista crua dos KPIs sem narrativa. O ganho e o consultor entender o portfolio em 10 minutos, nao em 1 hora.

**Escopo:**
- Migration: `processos` (schema do Posto)
- Views agregadas: `kpi_obrigacoes_por_status`, `kpi_casos_por_etapa`, `kpi_distribuicao_risco`
- Edge function `compute-risk-score` (job diario por empreendimento)
- Tela: Cockpit Executivo
- Tela: Mapa de Risco (matriz probabilidade x impacto)
- Mecanismo de roteamento por papel: ao logar, perfil define landing.

**Particularidade de seguranca:** RLS garante que diretor de cliente A nao ve KPI agregado contendo dado de cliente B.

**Criterio de pronto:** sistema com >= 5 empreendimentos cadastrados em staging mostra KPIs corretos no cockpit em <2s de carregamento.

---

### Sprint 5 — Verticais SST e Logistica Reversa

**Objetivo:** profundidade de dominio para o nicho posto de combustivel.

**Pode rodar em paralelo com Sprints 2 ou 3.**

**Problema de consultoria que resolve:** SST e Logistica Reversa hoje vivem em pasta de servidor + planilha + Whatsapp. Documento vence sem aviso. Validade nao e visivel ao consultor. Em fiscalizacao, perde-se hora encontrando a versao certa do PGR. Esses dois dominios sao a base recorrente de receita do consultor — sem eles organizados, escala e impossivel.

**IA neste sprint:** **alta aderencia, escopo limitado**. **Classificacao automatica de documento no upload** — analista joga PDF na pasta do empreendimento e o sistema reconhece se e PGR, PCMSO, LTCAT, treinamento, exame, OLUC, manifesto de pneu, etc. Extrai validade quando presente. Padrao agentic com auditoria. Fallback: tagging manual via dropdown.

**Escopo:**
- Migrations: `sst_documentos` (PGR, PCMSO, LTCAT, treinamentos, EPIs, exames), `logistica_reversa_movimentacoes` (OLUC, pneus, embalagens)
- Edge functions de CRUD especificas
- Telas: aba SST e aba Logistica Reversa na ficha do empreendimento
- Vocabulario, ENUMs e taxonomias copiados de `INTERFACE/enviro-clarity-main/src/pages/SSTPage.tsx` e `LogisticaReversaPage.tsx`

**Particularidade de seguranca:** documentos SST contem dado pessoal de funcionario (PCMSO, exames). Tabela vai ao mapa LGPD com retencao definida. Soft delete obrigatorio.

**Criterio de pronto:** abrir empreendimento -> aba SST mostra status PGR/PCMSO/LTCAT vigentes; aba Logistica mostra ultima coleta de OLUC.

---

### Sprint 6 — Financeiro e Orcamento

**Objetivo:** fechar o loop comercial. CRM gerou proposta -> operacao executou -> financeiro fatura.

**Problema de consultoria que resolve:** orcamento e refeito caso a caso, do zero, em planilha. Inconsistencia de preco entre clientes similares. Tempo perdido em proposta ja feita antes. E a entrega operacional nao se converte em fatura sem digitacao manual no fim do mes. Receita escapa por falta de rastro entre obrigacao concluida e item faturavel.

**IA neste sprint:** **alta aderencia**. Geracao da **primeira versao do orcamento** a partir do plano + base historica de orcamentos similares (mesmo CNAE, mesma faixa de porte, mesmas condicionantes). Consultor revisa e ajusta — tempo de proposta cai de horas para minutos. Padrao agentic. Fallback: template com itens pre-cadastrados, preenchimento manual.

**Escopo:**
- Portar `INTERFACE/enviro-clarity-main/src/lib/budget-engine.ts` para `backend/domain/budget/budget-engine.ts` em Deno
- Migration: `orcamentos`, `orcamento_itens`, `faturas`
- Edge functions: `compute-budget`, `issue-invoice`
- Tela: aba Financeiro na ficha do empreendimento

**Particularidade de seguranca:** valores financeiros so visiveis a perfis com permissao explicita. RLS por papel, nao apenas por tenant.

**Criterio de pronto:** ao concluir uma obrigacao em staging, o item correspondente vira faturavel automaticamente.

---

### Sprint 7 — Eventos Regulatorios

**Objetivo:** atender o imprevisto: autos, fiscalizacoes, notificacoes externas.

**Problema de consultoria que resolve:** auto chega em PDF do orgao ambiental. Demora horas para o consultor ler, classificar, identificar prazo de defesa, gerar tarefas operacionais, definir estrategia. Ate la, o relogio de defesa anda. Esta e a tarefa mais sensivel a tempo da operacao — e a que hoje mais consome o consultor.

**IA neste sprint:** **alta aderencia**. **Extracao estruturada do PDF** do auto: numero, orgao emissor, fundamento legal, prazo de defesa, valor de multa, condicionantes adicionais. Pre-classificacao do tipo de auto (advertencia, multa, embargo, interdicao). Sugestao de tarefas iniciais com base em fundamento + historico. Consultor confirma e ajusta. Padrao agentic com auditoria obrigatoria — erro aqui e custoso. Fallback: leitura manual com formulario estruturado.

**Escopo:**
- Migration: `eventos_regulatorios`, `fiscalizacoes`
- Edge function `materialize-from-event` — inverso do Sprint 1: um auto cria tarefas e prazos automaticamente
- Tela: Eventos Regulatorios (lista + detalhe + integracao com Centro de Prazos)
- Vocabulario copiado de `INTERFACE/enviro-clarity-main/src/pages/EventosRegulatóriosPage.tsx`

**Particularidade de seguranca:** evento regulatorio e dado sensivel comercial. Acesso restrito por RLS de papel.

**Criterio de pronto:** registrar um auto em staging gera tarefas e prazos derivados visiveis no Centro de Prazos.

---

### Sprint 8 — analista_v2 (SPA React)

**Objetivo:** ativar a trilha React, destravando reuso direto de paginas .tsx do Habilis.

**Pre-requisito nao-negociavel:** Sprints 1-7 estaveis em producao por >= 30 dias.

**Problema de consultoria que resolve:** UX vanilla nao acompanha o uso intensivo do analista — filtros complexos, drag-and-drop em workflow, multi-aba viva, atalhos de teclado, edicao em massa. O analista tem o sistema aberto 6h/dia. Cada interacao mais lenta vira hora desperdicada na semana.

**IA neste sprint:** **media aderencia**. SPA destrava interface conversacional opcional (chat de assistencia ao analista: "quais empreendimentos meus tem condicionante vencendo este mes?") sobre o mesmo backend e dados ja existentes. Padrao agentic, sempre informativo, nunca executivo (nao executa acao por chat). Pode ser excluido do Sprint 8 se houver pressa — entra em V3.

**Escopo:**
- Reabrir `analista_v2/` como aplicacao React + Vite + Tailwind + shadcn/ui
- Backend Supabase intacto. UI nova, nucleo igual.
- Importar paginas do Habilis adaptadas para o backend ITECOLOGICA: SST, Logistica, Prazos, Calendario, Eventos, Atuacoes, Pessoas
- Estrategia de coexistencia: rota a rota. `analista_v2/sst` ativo, `analista/sst.html` desativado quando equivalente em producao
- Testes e2e Playwright introduzidos aqui

**Particularidade de seguranca:** SPA exige cuidado com bundle exposto. Garantir que nenhum secret entra em build do React. Variaveis publicas via `import.meta.env.VITE_*`, validadas em `_shared`.

**Criterio de pronto:** uma rota completa do analista_v2 substitui o equivalente em `analista/` em producao, com paridade funcional verificada.

---

## Riscos conhecidos e mitigacoes

| Risco | Impacto | Mitigacao |
|---|---|---|
| Schemas do Posto assumem modelo de auth diferente | Bloqueia Sprint 1 | Adaptar campos `usuario_id` no Sprint 1, antes de copiar |
| Pipeline de diagnostico ainda nao unificado (Etapa 4) | Trigger de materializacao tem fonte ambigua | Sprint 0 obrigatorio antes de Sprint 1 |
| Identidade visual do Habilis (Tailwind/shadcn) tenta vazar para frontend estatico | Fragmenta UI | Reaproveitar Habilis apenas como spec ate Sprint 8 |
| RLS configurado errado em alguma tabela nova | Vazamento de dado | Teste de RLS por tabela e parte da DoD; auditoria trimestral |
| Volume de dados cresce alem do esperado | Cockpit fica lento | Views materializadas e indices definidos no Sprint 4 |
| Sprint 8 iniciado antes da hora | Reescreve enquanto operacao instavel | DoR explicita 30 dias de estabilidade dos sprints anteriores |
| Documentacao desatualizada | Time perde referencia | Atualizacao de doc no PR e item de DoD |
| Feature solta entrando por estetica | Produto vira generico, perde foco em consultoria | Filtro da Filosofia de produto aplicado em DoR; sprint sem dor nominavel volta a prancheta |
| IA aplicada onde nao agrega | Custo desnecessario, falsa sensacao de inteligencia | Tabela "IA na V2" e autoritativa; fora dela, IA nao entra |
| Modelo IA off-line bloqueia operacao | Consultor parado | Fallback deterministico obrigatorio em todo ponto de IA |
| Custo de IA fora de controle | Margem do servico evaporando | Limite duro de chamadas/caso/dia + cache 24h + log de tokens |
| Saida de IA induz erro regulatorio | Auto, multa, responsabilidade do consultor | Padrao agentic com auditoria + revisao humana obrigatoria em decisao regulatoria |
| Sistema indisponivel por > 4h | Operacao consultiva parada (V2 vira fonte unica de verdade) | Export semanal automatico de dados criticos para storage externo + modo de leitura offline no frontend + plano de contingencia em `docs/CONTINUIDADE_V2.md` |
| Adocao baixa apos go-live | Ferramenta vira planilha cara; equipe volta para WhatsApp | Plano de adocao (Sprint 0) + campeao interno + medicao de adocao real como criterio de fechamento |

---

## Criterio de fechamento da V2

A V2 esta concluida quando, em producao:

1. Lead capturado na home publica avanca ate o faturamento sem planilha externa.
2. Os nove ciclos do objetivo consolidado funcionam fim-a-fim para >= 3 empreendimentos reais.
3. Todos os sprints com tag `v2-sprint-N-done`.
4. Tag `v2-final` criada.
5. Documentos canonicos V1 e V2 atualizados e consistentes.
6. Zero erro 5xx aberto em funcoes criticas nas ultimas 7 dias.
7. Mapa LGPD completo e revisado.
8. Runbook de incidentes existente e usado pelo menos uma vez (mesmo que em simulacao).

### Ganho de consultoria mensurado (criterio de valor)

A V2 nao fecha apenas por funcionar — fecha quando entrega ganho operacional ao consultor. Antes do Sprint 1, registrar **baseline manual** (planilha, 1 semana de auto-observacao) das tarefas alvo. Ao final, validar reducao em pelo menos:

- Tempo medio para materializar plano em obrigacoes: de ~30 min para <2 min (Sprint 1)
- Tempo medio de briefing executivo de portfolio: de ~60 min para <15 min (Sprint 4)
- Tempo medio para preparar primeira versao de orcamento: de horas para <30 min (Sprint 6)
- Tempo medio para classificar e gerar tarefas a partir de auto recebido: de horas para <30 min (Sprint 7)
- Zero prazo perdido por falta de visibilidade em janela de 30 dias pos-Sprint 3.

Sem essa reducao, mesmo com tudo funcionando tecnicamente, a V2 nao esta entregue. E plataforma, nao ferramenta.

### KPIs do produto (criterio tecnico-operacional)

Alem do ganho do consultor, a V2 fecha com indicadores proprios do produto, medidos nos 30 dias antes da tag `v2-final`:

- **Uptime >= 99,5%** das edge functions criticas (`materialize-plan`, `notify-deadlines`, `compute-risk-score`).
- **Custo de IA por caso por mes dentro de target** declarado no Sprint 0 com base em volume estimado. Acima do target, sprint de otimizacao antes de fechar V2.
- **Adocao real >= 80%** — % das tarefas reais do consultor (medidas no baseline) que passam pelo sistema, vs continuam fora dele. Adocao baixa = ferramenta nao foi entregue, foi instalada.
- **NPS interno >= 8** — pesquisa simples de 3 perguntas com a equipe da consultoria.
- **Zero vazamento RLS** detectado em auditoria final (smoke test usuario A x usuario B em todas as tabelas com dado sensivel).

Apos fechamento da V2, novos escopos viram V3 com novo `PROCESSO_CONSTRUCAO_V3.md`.

---

## Anexos

### Template de PR

```markdown
## Sprint
Sprint N — <nome>

## Objetivo deste PR
<uma frase>

## Escopo coberto
- item 1
- item 2

## Criterio de pronto atendido (parcial ou total)
<o que do criterio de pronto do sprint este PR avanca>

## Riscos
<riscos especificos deste PR>

## Plano de rollback
<como reverter, do mais barato ao mais caro>

## Checklist
- [ ] Code review checklist aplicado
- [ ] Testes passando
- [ ] Migration com down (se aplicavel)
- [ ] RLS testado (se aplicavel)
- [ ] Doc atualizado (se aplicavel)
```

### Template de ADR (Architecture Decision Record)

```markdown
# ADR NNNN — <titulo>

## Contexto
<problema, por que decidir agora>

## Decisao
<o que foi decidido>

## Alternativas consideradas
<outras opcoes e por que nao>

## Consequencias
<o que vira facil, o que vira dificil>

## Status
proposto | aceito | substituido por ADR XXXX
```

### Glossario

- **Plano Oficial de Execucao** — artefato canonico aprovado pelo analista, fonte de materializacao do empreendimento.
- **Materializacao** — processo automatico que transforma um plano em registros operacionais (obrigacoes, tarefas, documentos, prazos).
- **Empreendimento** — entidade central da V2; representa um cliente/posto sob gestao.
- **Etapa processual** — estagio do caso (triagem, caracterizacao, ..., encerrado).
- **Condicionante** — exigencia regulatoria com prazo associada a uma licenca.
- **Obrigacao** — tarefa de cumprimento gerada por materializacao do plano.
- **Tarefa** — unidade operacional executavel, atribuivel a uma pessoa.
- **Evento regulatorio** — auto, notificacao ou fiscalizacao oriunda de orgao externo.
- **Cockpit Executivo** — tela de visao agregada de portfolio para perfil diretor.
- **Padrao agentic** — `gerar -> auditar -> humano revisa -> aprova`. Template oficial para qualquer uso de IA na V2.
- **Fallback deterministico** — caminho alternativo, sem IA, que mantem o sistema funcionando se o modelo estiver indisponivel.
- **Dor de consultoria** — tarefa concreta do consultor (analista, condutor tecnico, diretor tecnico) que hoje consome tempo, gera erro ou falta visibilidade. Toda construcao da V2 endereca uma dor nominavel.

---

## Como atualizar este documento

Mudanca de escopo, principio ou processo da V2 e PR proprio com tipo `docs:`. Nunca alterado fora de PR. Em conflito de leitura, este documento prevalece sobre interpretacao verbal.
