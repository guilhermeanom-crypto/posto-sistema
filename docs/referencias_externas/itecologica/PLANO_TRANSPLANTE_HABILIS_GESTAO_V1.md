# Plano de Transplante Habilis -> Gestao Pos-Venda V1

## Status documental

Documento operacional. Define como o prototipo `INTERFACE/enviro-clarity-main/` (Habilis Intelligence) sera transplantado para uma SPA nova `gestao/` dentro de ITECOLOGICA, sem tocar home, CRM ou Analista V1.

Substitui na pratica a Etapa 10 do plano de consolidacao ("reabrir analista_v2") com escopo redirecionado: o destino nao e mais o cockpit do Analista, e sim o cockpit de gestao pos-venda (operacao tecnica continuada para empreendimentos ja fechados).

Ver tambem:
- [docs/MAPA_SISTEMA_CENTRAL_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/MAPA_SISTEMA_CENTRAL_V1.md) - mapa canonico vivo
- [docs/PLANO_TRANSPLANTACAO_AREA_ANALISTA_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/PLANO_TRANSPLANTACAO_AREA_ANALISTA_V1.md) - plano de transplante voltado ao motor de diagnostico (trilha futura, nao se confunde com este)

## Objetivo

Trazer para ITECOLOGICA o prototipo mais avancado da pasta (Habilis Intelligence) na forma de uma SPA `gestao/` que cobre **gestao pos-venda**: empreendimentos, condicionantes, prazos, atuacoes, calendario, eventos regulatorios, SST e logistica reversa.

Principio central:

- copiar codigo, nao mover diretorios
- preservar `INTERFACE/enviro-clarity-main/` intacto como referencia
- transplantar apenas o que agrega valor estrutural; reescrever o resto
- substituir todo `localStorage`/mock por Supabase real
- preservar V1 estatico (home, CRM, Analista) intacto em producao
- estender o Supabase atual (project ref `cixgnglubgczawnfyspw`); nao criar instancia nova

## Escopo

### Dentro do escopo

- Cadastro e dossie de Empreendimentos
- Condicionantes ambientais e Prazos
- Atuacoes (registro de conducao tecnica)
- Calendario consolidado (prazos + atuacoes + eventos)
- Eventos regulatorios
- SST (PGR, PCMSO, LTCAT, treinamentos, EPIs, exames)
- Logistica reversa (OLUC, pneus, embalagens)
- Dashboard executivo da gestao pos-venda

### Fora do escopo

- Substituir o cockpit do Analista (`analista/`) - segue V1 estatico
- Substituir o CRM (`crm/`) - segue V1 estatico
- Reescrever o motor de diagnostico - vive em `backend/domain/diagnostic/`
- Reescrever a home publica (`app/`)
- SPA do Analista (trilha em [analista_v2/](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/analista_v2/) fica adormecida)

## Fontes principais

### Prototipo de UI (origem)

- [INTERFACE/enviro-clarity-main/src/pages/EmpreendimentosList.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/EmpreendimentosList.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/EmpreendimentoDossier.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/EmpreendimentoDossier.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/PrazosPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/PrazosPage.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/AtuacoesPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/AtuacoesPage.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/CalendarioPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/CalendarioPage.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/EventosRegulatóriosPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/EventosRegulat%C3%B3riosPage.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/SSTPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/SSTPage.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/LogisticaReversaPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/LogisticaReversaPage.tsx)
- [INTERFACE/enviro-clarity-main/src/pages/Dashboard.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/Dashboard.tsx)
- [INTERFACE/enviro-clarity-main/src/components/AppSidebar.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/components/AppSidebar.tsx)
- [INTERFACE/enviro-clarity-main/src/components/Header.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/components/Header.tsx)
- [INTERFACE/enviro-clarity-main/src/lib/posto-mock-data.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/posto-mock-data.ts) (apenas como contrato de dominio)

### Backend e identidade existentes (destino)

- [backend/supabase/schema.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/schema.sql)
- [backend/supabase/crm_panel_v1.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/crm_panel_v1.sql)
- [backend/supabase/diagnosis_v1.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/diagnosis_v1.sql)
- [backend/supabase/functions/_shared/](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/functions/_shared/) - reaproveitar `requireInternalUser` e Turnstile
- [shared/](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/shared/) - tokens visuais (verde-teal + bege)
- [vercel.json](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/vercel.json) - rewrites de superficie

## Decisao de transplantacao

### Copiar quase integralmente

Blocos de UI estrutural com baixo acoplamento ao mock:

- componentes shadcn/ui em `src/components/ui/`
- `AppSidebar.tsx`, `Header.tsx` (com troca de identidade)
- layouts e providers (theme, toast, query)
- `vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`
- infra de teste (`vitest.config.ts`, helpers)

### Copiar parcialmente (reescrever camada de dados)

Paginas com logica boa de UI, mas plugadas em `localStorage`/mock:

- `EmpreendimentosList.tsx`, `EmpreendimentoDossier.tsx`
- `PrazosPage.tsx`, `AtuacoesPage.tsx`, `CalendarioPage.tsx`
- `EventosRegulatóriosPage.tsx`, `SSTPage.tsx`, `LogisticaReversaPage.tsx`
- `Dashboard.tsx`

A camada de dados e reescrita do zero contra Supabase. O componente visual e adaptado (cores, tipografia) e re-tipado contra `backend/domain/gestao/types.ts`.

### Nao copiar

- `posto-mock-data.ts` (so vira referencia de schema, nao codigo)
- qualquer `*-service.ts` que opere via `localStorage`
- paginas fora do escopo (DiagnosticoPage, TriagemComercialPage, MotorOrcamento, etc.)
- roteamento completo de `App.tsx` (montar do zero, so com rotas de gestao)
- `BASE_SERVICOS_HABILIS_.xlsx`, `Habilis_Posto_Consolidado_FINAL.html` (artefatos)

## Estrutura alvo

```text
ITECOLOGICA/
  gestao/                            # SPA nova (Vite + React + TS + Tailwind + shadcn)
    src/
      app/                           # rotas, layout, providers
      modules/
        empreendimentos/
        prazos/
        atuacoes/
        calendario/
        eventos-regulatorios/
        sst/
        logistica-reversa/
        dashboard/
      components/                    # shadcn + componentes compartilhados
      lib/
        supabase.ts                  # cliente unico
        auth.ts                      # integra com requireInternalUser
        api/                         # um arquivo por edge function
      hooks/
      styles/
        tokens.css                   # importa shared/tokens.css
    public/
    package.json
    vite.config.ts
  backend/
    domain/
      gestao/
        types.ts                     # tipos de dominio compartilhados
        empreendimento.ts
        prazo.ts
        atuacao.ts
        sst.ts
        log-reversa.ts
    supabase/
      gestao_v1.sql                  # schema novo (tabelas + RLS)
      functions/
        list-empreendimentos/
        get-empreendimento/
        upsert-empreendimento/
        list-prazos/
        upsert-prazo/
        list-atuacoes/
        upsert-atuacao/
        # ... uma por entidade
  shared/
    tokens.css                       # ja existe; consumido pela SPA
    components.css                   # quando extraido (Etapa 6)
  vercel.json                        # rewrite /gestao/ -> gestao/dist/
```

## Schema novo (esboco)

Convencoes seguidas: pgcrypto, `id uuid primary key default gen_random_uuid()`, RLS sempre ligado, politicas via `is_crm_internal_user()` (reaproveita o helper de [crm_panel_v1.sql](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/crm_panel_v1.sql)), trigger `set_*_updated_at`.

```sql
-- gestao_v1.sql (esboco; SQL final entra na Fatia 1)

create table public.empreendimentos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads_public(id) on delete set null,
  razao_social text not null,
  nome_fantasia text,
  cnpj text,
  bandeira text,
  tipo text not null default 'posto-combustivel',
  endereco text,
  cidade text,
  uf text,
  status text not null default 'ativo',
  responsavel_tecnico_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.condicionantes (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  origem text not null,           -- LO, LP, LI, TAC, ...
  numero_processo text,
  descricao text not null,
  status text not null default 'pendente',
  vencimento date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prazos (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  condicionante_id uuid references public.condicionantes(id) on delete set null,
  titulo text not null,
  descricao text,
  due_date date not null,
  prioridade text not null default 'media',  -- baixa | media | alta | critica
  status text not null default 'aberto',
  responsavel_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.atuacoes (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  data date not null,
  tipo text not null,             -- visita, relatorio, oficio, ...
  descricao text not null,
  responsavel_email text,
  artefatos jsonb,
  created_at timestamptz not null default now()
);

create table public.eventos_regulatorios (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid references public.empreendimentos(id) on delete set null,
  data date not null,
  tipo text not null,             -- autuacao, vistoria, mudanca-norma, ...
  fonte text,
  descricao text not null,
  impacto text,                   -- baixo | medio | alto
  created_at timestamptz not null default now()
);

create table public.sst_itens (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  categoria text not null,        -- pgr, pcmso, ltcat, treinamento, epi, exame
  titulo text not null,
  vencimento date,
  status text not null default 'em-dia',
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.log_reversa_itens (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  categoria text not null,        -- oluc, pneus, embalagens, ...
  fornecedor text,
  ultima_coleta date,
  proxima_coleta date,
  comprovante_url text,
  status text not null default 'em-dia',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Indices criticos: `(empreendimento_id, due_date)` em `prazos`, `(empreendimento_id, vencimento)` em `condicionantes` e `sst_itens`, `(data desc)` em `atuacoes` e `eventos_regulatorios`.

RLS: leitura/escrita autenticadas via `is_crm_internal_user()` (mesmo helper do CRM).

## Principios de execucao

1. **Prototipo e referencia, nao fonte.** `INTERFACE/enviro-clarity-main/` nao entra em ITECOLOGICA por copia recursiva. Cada bloco e portado manualmente.
2. **Identidade ITECOLOGICA, nao Habilis.** Trocar azul-marinho/ambar pelo verde-teal `#1f8c7f` + bege `#f4efe6` + acento terra `#b08a52`. Tipografia serifa Iowan/Palatino + sans Avenir/Inter.
3. **Fatia vertical ponta-a-ponta.** DB + RLS -> edge function -> UI -> smoke em producao. Fatia incompleta nao fecha.
4. **Tipos compartilhados.** `backend/domain/gestao/types.ts` e a fonte. Frontend importa via path alias.
5. **Auth unica.** SPA usa `requireInternalUser` igual ao CRM. Se a edge function novo precisar do helper, importa de `_shared/`.
6. **Snapshot por fatia.** Tag git `gestao-fatia-N-done` ao final de cada fatia (paralelo a `v1-pre-consolidacao`).
7. **Sem amend, sem destrutivo.** Commits incrementais. Producao V1 nunca quebra.

## Etapas

### Fatia 0 - Bootstrap (1-2 dias)

- Criar `gestao/` com Vite + React + TS + Tailwind + shadcn (sem mocks, sem paginas)
- Trazer `AppSidebar`, `Header`, layout, providers
- Aplicar tokens da identidade ITECOLOGICA (consumir `shared/tokens.css`)
- Configurar Supabase client em `gestao/src/lib/supabase.ts` lendo `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- Auth: tela de login + integracao com `crm_internal_users`
- Pagina inicial vazia ("Gestao Pos-Venda - em construcao") so para validar deploy
- Adicionar rewrite `/gestao/` em `vercel.json`
- CI: `tsc --noEmit` + `vitest run` + build no PR

**Saida:** SPA shell publicada em `https://www.itecologica.com.br/gestao/` exigindo login interno; sem features.

### Fatia 1 - Empreendimentos (eixo)

- SQL: bloco `empreendimentos` em `backend/supabase/gestao_v1.sql`
- Domain: `backend/domain/gestao/empreendimento.ts` + `types.ts`
- Edge functions: `list-empreendimentos`, `get-empreendimento`, `upsert-empreendimento`
- UI: portar `EmpreendimentosList.tsx` e `EmpreendimentoDossier.tsx` adaptadas
- Seed: script idempotente que cria empreendimento a partir de leads CRM com `status='ganho'`

**Criterio de pronto:** lista carrega do Supabase, dossie abre, criar/editar persiste, RLS bloqueia anonimo.

### Fatia 2 - Prazos e Condicionantes

- SQL: `condicionantes`, `prazos`
- Edge functions: CRUD basico
- UI: `PrazosPage` + aba "Condicionantes" no dossie

### Fatia 3 - Atuacoes

- SQL: `atuacoes`
- UI: `AtuacoesPage` + aba "Atuacoes" no dossie

### Fatia 4 - Calendario

- View SQL consolidando prazos + atuacoes + eventos
- UI: `CalendarioPage` (sem dados mockados)

### Fatia 5 - Eventos Regulatorios

- SQL: `eventos_regulatorios`
- UI: `EventosRegulatoriosPage`

### Fatia 6 - SST

- SQL: `sst_itens`
- UI: `SSTPage`

### Fatia 7 - Logistica Reversa

- SQL: `log_reversa_itens`
- UI: `LogisticaReversaPage`

### Fatia 8 - Dashboard executivo

- Views consolidadas (alertas criticos: prazos vencendo, condicionantes em risco, SST atrasado, log reversa pendente)
- UI: `Dashboard.tsx` portado, agora alimentado por dados reais

## Riscos e mitigacoes

| Risco | Mitigacao |
|---|---|
| Etapa 10 vinha "depois do V1 estavel" e ainda ha Etapas 1, 2, 7, 8, 9 abertas | `gestao/` e isolado; nao toca codigo de V1. Paralelizacao OK enquanto SPA usa apenas tabelas novas. |
| `vercel.json` precisa receber rota `/gestao/` | Etapa 3 ja entregou `vercel.json` (commit 2a4ff26). Apenas adicionar rewrite, sem refatorar. |
| Auth duplicada (SPA versus CRM/Analista) | SPA reusa `requireInternalUser` via edge function compartilhada em `_shared/`. Nao reimplementar. |
| Lead -> Empreendimento sem regra clara | Fatia 1 define o gatilho explicitamente (manual via botao no CRM, depois pode virar trigger). |
| Bun no `gestao/` versus resto sem package manager | Aceito. Documentar em `gestao/README.md` que o diretorio usa bun; CI roda `bun install` so na pasta. |
| Drift visual entre V1 estatico e SPA | `shared/tokens.css` e fonte unica. Etapa 6 consolida; SPA importa direto, nao fork. |
| 459M / 28k arquivos do prototipo entrarem por engano | Regra forte: `INTERFACE/` nunca e copiado recursivamente. Cada arquivo e portado por commit nominal. |

## Criterios de "fatia pronta"

Para cada fatia (1..8), nao fecha sem:

- SQL aplicado em producao com RLS verificada (anonimo bloqueado)
- Edge functions com `requireInternalUser` ativo
- UI sem nenhum import de `posto-mock-data` ou `localStorage`
- Tipos importados de `backend/domain/gestao/types.ts`
- `tsc --noEmit` + `vitest run` verdes
- Smoke manual em producao logado como `crm_internal_user`
- Tag git `gestao-fatia-N-done`
- Linha correspondente atualizada em [docs/MAPA_SISTEMA_CENTRAL_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/MAPA_SISTEMA_CENTRAL_V1.md)

## Proximos passos imediatos

1. Aprovar este plano (ajustes de escopo se houver).
2. Atualizar [docs/MAPA_SISTEMA_CENTRAL_V1.md](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/docs/MAPA_SISTEMA_CENTRAL_V1.md) referenciando este documento.
3. Atualizar README de [analista_v2/](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/analista_v2/) marcando que a SPA de gestao **nao** o substitui (segue trilha futura adormecida).
4. Iniciar **Fatia 0 - Bootstrap** com commit isolado.
