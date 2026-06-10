# MAPA_TRANSPLANTE_ENVIRO_POSTO_V1

## Objetivo

Definir, de forma operacional, quais arquivos e blocos maduros de `INTERFACE/enviro-clarity-main` devem ser transplantados para o `Posto`, para qual camada devem ir e em qual ordem devem ser implementados.

Este documento responde a pergunta:

- onde esta o diagnostico mais desenvolvido
- o que exatamente deve ser reaproveitado
- onde isso entra no `Posto`

## Conclusao executiva

O conjunto mais desenvolvido esta em:

- [INTERFACE/enviro-clarity-main/src/lib/diagnostic-engine.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/diagnostic-engine.ts)
- [INTERFACE/enviro-clarity-main/src/lib/diagnostic-rules.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/diagnostic-rules.ts)
- [INTERFACE/enviro-clarity-main/src/lib/regulatory-db.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/regulatory-db.ts)
- [INTERFACE/enviro-clarity-main/src/lib/habilis-services.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/habilis-services.ts)
- [INTERFACE/enviro-clarity-main/src/lib/budget-engine.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/budget-engine.ts)

E a base de dados madura correspondente esta em:

- [INTERFACE/enviro-clarity-main/supabase/migrations/20260311143138_1c1aba08-0d64-407c-a721-288ca4165de2.sql](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/supabase/migrations/20260311143138_1c1aba08-0d64-407c-a721-288ca4165de2.sql)

O `Posto` ja possui os modulos operacionais destino:

- `integracoes`
- `onboarding`
- `tarefas`
- `condicionantes`
- `documentos`
- `processos`
- `metricas`
- `cockpit`

Portanto, o trabalho correto nao e copiar o `enviro` inteiro.

O trabalho correto e:

- transplantar o motor
- transplantar a base regulatoria e de servicos
- transplantar a logica de orcamento
- materializar a saida dentro dos modulos nativos do `Posto`

## Regras de decisao

### O que transplantar

- regra de negocio
- catalogo de obrigacoes
- catalogo de servicos
- calculo de risco
- calculo de orcamento
- estrutura canonica do fluxo

### O que nao transplantar literalmente

- roteamento React do `enviro`
- paginas legadas completas
- providers e contexts acoplados ao app antigo
- layout duplicado paralelo ao `Posto`

## Mapa por camada

### 1. Motor de diagnostico

#### Fonte

- [diagnostic-engine.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/diagnostic-engine.ts)
- [diagnostic-rules.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/diagnostic-rules.ts)
- [regulatory-db.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/regulatory-db.ts)

#### Destino no Posto

- `apps/api/src/modules/ia/`
- `apps/api/src/modules/integracoes/`
- `apps/api/src/modules/onboarding/`

#### Acao correta

- extrair regra pura para modulo backend do `Posto`
- evitar dependencia de frontend ou de cliente Supabase do `enviro`
- adaptar a saida para o contrato oficial ja trafegado pelo handoff

#### Ownership

- `Posto/apps/api`

---

### 2. Catalogo de servicos e precificacao

#### Fonte

- [habilis-services.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/habilis-services.ts)
- [services-database.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/data/services-database.ts)
- [budget-engine.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/budget-engine.ts)

#### Destino no Posto

- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/config/`
- `apps/api/src/modules/metricas/`
- `apps/api/src/modules/integracoes/`
- `packages/schemas/src/`

#### Acao correta

- criar tabela nativa de catalogo de servicos
- criar tabela nativa de precificacao
- mover `hour_rate`, `complexity_factor`, `estimated_hours` para banco
- usar o motor de orcamento como servico de dominio do `Posto`

#### Ownership

- `Posto/apps/api`
- `Posto/packages/schemas`

---

### 3. Banco regulatorio de obrigacoes

#### Fonte

- [20260311143138_1c1aba08-0d64-407c-a721-288ca4165de2.sql](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/supabase/migrations/20260311143138_1c1aba08-0d64-407c-a721-288ca4165de2.sql)

Blocos principais:

- `obrigacoes_ambientais`
- `servicos_consultoria`

#### Destino no Posto

- `apps/api/prisma/schema.prisma`
- migration nova em `apps/api/prisma/migrations/`
- `apps/api/src/modules/ia/`
- `apps/api/src/modules/processos/`
- `apps/api/src/modules/documentos/`

#### Acao correta

- criar modelos Prisma equivalentes
- adaptar para multi-tenant do `Posto`
- indexar por `tenant`, `categoria`, `obrigacao_vinculada`, `cnae`

#### Ownership

- `Posto/apps/api/prisma`

---

### 4. Fluxo operacional canonico

#### Fonte

- [FlowOperacionalPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/FlowOperacionalPage.tsx)
- [DiagnosticoPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/DiagnosticoPage.tsx)
- [use-process-flow.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/hooks/use-process-flow.ts)
- [flow-execution.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/flow-execution.ts)
- [standalone-flow.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/standalone-flow.ts)

#### Destino no Posto

- `apps/web/src/app/(app)/onboarding/`
- `apps/web/src/app/(app)/empreendimentos/[id]/`
- `apps/web/src/app/(app)/dashboard/`
- `apps/api/src/modules/onboarding/`
- `apps/api/src/modules/tarefas/`

#### Acao correta

- reaproveitar a semantica do fluxo
- nao copiar o page/router inteiro
- traduzir o estado do fluxo para entidades reais do `Posto`

#### Ownership

- `Posto/apps/web`
- `Posto/apps/api`

---

### 5. Diagnostico e orcamento na interface

#### Fonte

- [DiagnosticoPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/DiagnosticoPage.tsx)
- [DiagnosticoRegulatorio.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/DiagnosticoRegulatorio.tsx)
- [MotorOrcamentoPage.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/MotorOrcamentoPage.tsx)
- [Orcamentos.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/Orcamentos.tsx)
- [ServicosHabilis.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/ServicosHabilis.tsx)
- [ValoresPrecificacao.tsx](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/pages/ValoresPrecificacao.tsx)

#### Destino no Posto

- nova rota `apps/web/src/app/(app)/empreendimentos/[id]/diagnostico/`
- nova rota `apps/web/src/app/(app)/orcamentos/`
- eventual rota `apps/web/src/app/(app)/servicos/`

#### Acao correta

- portar os componentes e a leitura visual
- adaptar para `App Router` e APIs do `Posto`
- ligar a UI ao payload real salvo em `IntegracaoEvento` e futuramente a tabelas proprias

#### Ownership

- `Posto/apps/web`

## Mapa arquivo por arquivo

| Fonte `enviro` | Nivel | O que fazer | Destino no `Posto` |
| --- | --- | --- | --- |
| `src/lib/diagnostic-engine.ts` | muito alto | transplantar a logica base | `apps/api/src/modules/ia/diagnostic-engine.ts` |
| `src/lib/diagnostic-rules.ts` | muito alto | transplantar regras puras | `apps/api/src/modules/ia/diagnostic-rules.ts` |
| `src/lib/regulatory-db.ts` | muito alto | adaptar como repositorio/tabela | `apps/api/src/modules/ia/regulatory-db.ts` |
| `src/lib/habilis-services.ts` | alto | transformar em semente/catalogo | `apps/api/src/modules/config/services-catalog.ts` |
| `src/lib/budget-engine.ts` | muito alto | transplantar calculo de orcamento | `apps/api/src/modules/ia/budget-engine.ts` |
| `supabase/migrations/...sql` | muito alto | recriar modelos Prisma | `apps/api/prisma/schema.prisma` + migration |
| `src/pages/DiagnosticoPage.tsx` | alto | portar UX principal | `apps/web/src/app/(app)/empreendimentos/[id]/diagnostico/page.tsx` |
| `src/pages/MotorOrcamentoPage.tsx` | alto | portar UX de orcamento | `apps/web/src/app/(app)/orcamentos/page.tsx` |
| `src/pages/ServicosHabilis.tsx` | medio | usar como catalogo consultivo | `apps/web/src/app/(app)/servicos/page.tsx` |
| `src/pages/ValoresPrecificacao.tsx` | medio | usar como admin de precos | `apps/web/src/app/(app)/config/precos/page.tsx` |
| `src/pages/FlowOperacionalPage.tsx` | alto | reaproveitar semantica, nao rota inteira | `apps/web/src/app/(app)/onboarding/` e `empreendimentos/[id]/` |
| `src/hooks/use-process-flow.ts` | alto | extrair regras de orquestracao | `apps/api/src/modules/onboarding/` + `apps/web` hooks novos |
| `src/lib/flow-execution.ts` | alto | adaptar para materializacao real | `apps/api/src/modules/onboarding/flow-execution.ts` |
| `src/lib/standalone-flow.ts` | medio | usar como referencia | adaptacao parcial |

## Ordem exata de implementacao

### Fase 1. Base estrutural

1. criar tabelas Prisma no `Posto` para:
   - catalogo de obrigacoes
   - catalogo de servicos
   - regras de precificacao
2. criar seeds iniciais a partir do `enviro`
3. criar modulo backend `apps/api/src/modules/ia/`

### Fase 2. Motor

1. portar `diagnostic-engine.ts`
2. portar `diagnostic-rules.ts`
3. portar `budget-engine.ts`
4. adaptar leitura de banco do `enviro` para Prisma do `Posto`

### Fase 3. Integracao com o handoff atual

1. substituir metadados parciais por materializacao completa
2. gravar `services`, `budget` e `categorySummary`
3. ligar o resultado ao empreendimento criado no handoff

### Fase 4. Materializacao operacional

1. gerar tarefas
2. gerar prazos
3. gerar monitoramentos
4. gerar documentos requeridos
5. gerar condicionantes derivadas quando aplicavel

### Fase 5. UI nativa no Posto

1. tela de diagnostico oficial
2. tela de orcamento oficial
3. tela de catalogo de servicos
4. tela de configuracao de precos

## O que ja pode ser aproveitado hoje sem esperar

Ja existe no `Posto` um encaixe imediato para:

- [apps/api/src/modules/integracoes/](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/integracoes)
- [apps/api/src/modules/onboarding/](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/onboarding)
- [apps/api/src/modules/tarefas/](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/tarefas)
- [apps/api/src/modules/documentos/](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/documentos)
- [apps/api/src/modules/condicionantes/](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/condicionantes)
- [apps/web/src/app/(app)/empreendimentos/[id]/](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/app/(app)/empreendimentos/[id])

## Decisao final

O `enviro` nao deve ser tratado como prototipo descartavel.

Ele e a biblioteca madura a ser minerada.

O `Posto` e o sistema de destino.

A estrategia correta e:

- extrair
- adaptar
- persistir
- materializar
- expor na UI nativa do `Posto`

Nao:

- duplicar a aplicacao antiga
- manter um segundo centro operacional
- portar rotas inteiras sem reconectar ao dominio do `Posto`
