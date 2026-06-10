# 70. Relatorio da Onda 3.7.1 - Estado Real Pos-Demo

## 1. Objetivo deste fechamento tecnico

Consolidar o estado real do repositorio apos a apresentacao, comparando:

- o que os documentos `68` e `69` diziam que seria feito na Onda 3.7.1;
- o que ja existe efetivamente no codigo;
- o que esta persistido, funcional em runtime, mockado ou com risco de navegacao;
- qual deve ser a proxima etapa tecnica segura da Onda 3.7.2.

Este documento nao autoriza:

- nova migration;
- alteracao de Prisma;
- redesign;
- refatoracao ampla;
- criacao de modulo novo.

## 2. O que a documentacao formal previa para a Onda 3.7.1

Os documentos [68_PLANO_ONDA_3_7_PERSISTENCIA_PREPARACAO_OPERACIONAL_HANDOFF.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/68_PLANO_ONDA_3_7_PERSISTENCIA_PREPARACAO_OPERACIONAL_HANDOFF.md>) e [69_CONTRATO_TECNICO_ONDA_3_7_1_MODELAGEM_PREPARACAO_OPERACIONAL_HANDOFF.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/69_CONTRATO_TECNICO_ONDA_3_7_1_MODELAGEM_PREPARACAO_OPERACIONAL_HANDOFF.md>) registravam a Onda 3.7.1 como etapa de:

- contrato tecnico e decisao de modelagem;
- avaliacao de impacto em Prisma, migration, schemas, `PATCH`, proxy e frontend;
- persistencia minima recomendada para:
  - `observacoesPlanejamento`
  - `prioridadeOperacional`
  - `necessidadeDocumentos`
  - `necessidadeVisita`
  - `necessidadeTerceiro`
- adiamento de:
  - `previsaoInicialInicio`
  - `riscoOperacional`
  - `checklistProntidao`

Pelo plano formal, a 3.7.1 ainda estava no campo documental e preparatorio.

## 3. O que o codigo realmente ja possui hoje

O estado real do codigo avancou alem do pacote documental `68/69`.

Hoje ja existem, de fato:

- colunas persistidas no modelo de handoff para a preparacao operacional minima;
- migration aplicada no repositorio para essa persistencia;
- retorno desses campos no backend;
- aceite desses campos no `PATCH`;
- proxy web repassando os campos;
- tela de detalhe de handoff lendo e editando esses campos;
- testes da API cobrindo os campos minimos da preparacao operacional.

Conclusao objetiva:

- a Onda 3.7.1 nao ficou apenas no plano;
- ela foi implementada parcialmente ou substancialmente no codigo;
- a documentacao formal ficou atras do estado real do repositorio.

## 4. Migrations ja existentes relacionadas a Onda 3.7

Migration diretamente relacionada a persistencia minima da preparacao operacional do handoff:

- [apps/api/prisma/migrations/20260514113000_add_handoff_preparacao_operacional_minima/migration.sql](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/prisma/migrations/20260514113000_add_handoff_preparacao_operacional_minima/migration.sql>)

Conteudo objetivo desta migration:

- `observacoes_planejamento`
- `prioridade_operacional`
- `necessidade_documentos`
- `necessidade_visita`
- `necessidade_terceiro`

Importante:

- esta migration mostra que a persistencia minima recomendada no doc `69` ja entrou no repositorio;
- nao foi identificado, nesta leitura, pacote posterior de migration para `previsaoInicialInicio`, `riscoOperacional` ou `checklistProntidao`.

## 5. Endpoints, schemas e testes ja existentes

### 5.1 Backend de handoff operacional

Arquivos principais:

- [apps/api/src/modules/operacao/handoffs.routes.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.routes.ts>)
- [apps/api/src/modules/operacao/handoffs.service.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.service.ts>)
- [apps/api/src/modules/operacao/handoffs.schemas.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.schemas.ts>)
- [apps/api/src/modules/operacao/handoffs.types.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.types.ts>)

Campos minimos da Onda 3.7 ja presentes em schema/tipos:

- `observacoesPlanejamento`
- `prioridadeOperacional`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`

Capacidades ja implementadas:

- `GET` de listagem de handoffs;
- `GET` de detalhe de handoff;
- `PATCH` parcial com os campos operacionais anteriores e os novos campos de preparacao minima;
- serializacao desses campos no detalhe e na atualizacao.

### 5.2 Proxy web de handoff

Arquivos principais:

- [apps/web/src/app/api/operacao/handoffs/route.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/api/operacao/handoffs/route.ts>)
- [apps/web/src/app/api/operacao/handoffs/[id]/route.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/api/operacao/handoffs/[id]/route.ts>)
- [apps/web/src/app/(app)/operacao/handoffs/shared.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/operacao/handoffs/shared.ts>)

Estado atual:

- o proxy do web ja repassa os campos da preparacao operacional minima;
- o frontend tipado tambem ja conhece esses campos.

### 5.3 Testes existentes

Arquivo principal:

- [apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts>)

Cobertura observada:

- leitura saneada de handoff;
- regras de acesso;
- `PATCH` operacional nao sensivel;
- persistencia dos novos campos minimos de preparacao operacional;
- releitura desses campos apos atualizacao.

## 6. Telas ja existentes

### 6.1 Site oficial

Superficie em `apps/site`:

- `/`
- `/sistema`
- `/area-restrita`
- `/servicos`
- `/clientes`
- `/contato`
- `/sobre`
- `/noticias`

### 6.2 Sistema interno

Superficie em `apps/web`:

- `/login`
- `/dashboard`
- `/comercial/propostas`
- `/comercial/propostas/[id]`
- `/motor-orcamento`
- `/empreendimentos/novo`
- `/operacao/handoffs`
- `/operacao/handoffs/[id]`

### 6.3 Portal do cliente

Superficie em `apps/web/src/app/portal`:

- `/portal/login`
- `/portal/inicio`
- `/portal/documentos`
- `/portal/alertas`
- `/portal/tarefas`
- `/portal/condicionantes`
- `/portal/checklists`
- `/portal/mensagens`

### 6.4 Area de equipe/campo

Superficie em `apps/web/src/app/equipe`:

- `/equipe/login`
- `/equipe/inicio`
- `/equipe/os`
- `/equipe/checklists`
- `/equipe/evidencias`
- `/equipe/pendencias`

## 7. Modulos que ja estao persistidos

### 7.1 Persistidos no escopo da Onda 3.7

No modulo de handoff operacional:

- `observacoesPlanejamento`
- `prioridadeOperacional`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`

Persistencia confirmada por:

- migration;
- schema Prisma;
- service;
- schemas;
- testes;
- proxy web;
- tela de detalhe.

### 7.2 Persistidos em outras frentes ja presentes no repositorio

Tambem ha persistencia real, fora do handoff, nas superficies lidas/validadas:

- handoffs comerciais;
- propostas comerciais;
- empreendimentos;
- portal de documentos com upload/versionamento;
- dados de dashboard, quando existe token real;
- dados operacionais consumidos pelo motor de orcamento.

## 8. Modulos que ainda usam mock, estado local ou dados fixos

### 8.1 Area de equipe/campo

Hoje a area de equipe ainda e majoritariamente demo/local:

- login de equipe grava cookie local e nao conversa com API:
  - [apps/web/src/app/equipe/login/actions.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/equipe/login/actions.ts>)
- painel inicial usa arrays fixos:
  - [apps/web/src/app/equipe/(equipe)/inicio/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/equipe/(equipe)/inicio/page.tsx>)
- OS usa linhas fixas:
  - [apps/web/src/app/equipe/(equipe)/os/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/equipe/(equipe)/os/page.tsx>)
- checklists, evidencias e pendencias tambem usam estado local ou listas fixas.

Conclusao:

- a area de equipe existe e navega;
- mas ainda nao representa um modulo operacional persistido end-to-end.

### 8.2 Dashboard interno

O dashboard usa dados reais quando ha token valido, mas possui fallback demo quando nao ha token:

- [apps/web/src/app/(app)/dashboard/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/dashboard/page.tsx>)

Conclusao:

- e um modulo funcional com dados reais no ambiente autenticado;
- mas mantem caminho de fallback demo.

### 8.3 Portal do cliente

No portal:

- `/portal/inicio` usa API quando ha token, com fallback demo;
- `/portal/documentos` usa API quando ha token, com fallback demo;
- outras telas do portal lidas nesta rodada tendem a usar API e vazio seguro, sem demo explicito.

Arquivos relevantes:

- [apps/web/src/app/portal/(portal)/inicio/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/portal/(portal)/inicio/page.tsx>)
- [apps/web/src/app/portal/(portal)/documentos/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/portal/(portal)/documentos/page.tsx>)

### 8.4 Motor de orcamento

O motor usa varios dados reais, mas a emissao da proposta ainda possui fallback demo se a criacao real falhar:

- [apps/web/src/app/(app)/motor-orcamento/actions.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/motor-orcamento/actions.ts>)

Conclusao:

- o modulo e predominantemente funcional;
- mas ainda carrega um mecanismo de contingencia herdado da fase de apresentacao.

### 8.5 Site oficial

O site institucional e intencionalmente estatico:

- mockups ilustrativos em React/Tailwind;
- conteudo fixo em `apps/site/src/lib/content.ts`;
- nao depende de persistencia de negocio.

Isso nao e erro; e parte do desenho atual da superficie publica.

## 9. Rotas funcionais validadas em runtime

Validacao realizada no ambiente local em execucao:

- site `3100` ativo
- web `3000` ativo
- api `3001` ativa
- Postgres, Redis e MinIO ativos

### 9.1 Site oficial

Responderam `200`:

- `http://127.0.0.1:3100/`
- `http://127.0.0.1:3100/sistema`
- `http://127.0.0.1:3100/area-restrita`

Observacao:

- os CTAs publicos estavam apontando corretamente para `http://localhost:3000` no ambiente atual;
- isso esta coerente porque existe `apps/site/.env.local` com `NEXT_PUBLIC_SISTEMA_BASE_URL=http://localhost:3000`.

### 9.2 Sistema interno

Responderam `200`:

- `/login`
- `/dashboard`
- `/comercial/propostas`
- `/motor-orcamento`
- `/empreendimentos/novo`
- `/operacao/handoffs`
- `/operacao/handoffs/22cc7d3e-7ed2-4636-8835-452e21efa402`

Validacoes complementares:

- `GET /api/v1/operacao/handoffs?limit=5` respondeu com dados reais;
- `GET /api/operacao/handoffs/22cc7d3e-7ed2-4636-8835-452e21efa402` respondeu com os campos da preparacao operacional minima.

### 9.3 Portal do cliente

Responderam `200` com sessao real:

- `/portal/inicio`
- `/portal/documentos`

Validacao complementar:

- `GET /api/v1/portal/documentos?limit=5` respondeu com dados reais e estrutura por `momento`.

### 9.4 Area de equipe/campo

Responderam `200`:

- `/equipe/login`
- `/equipe/inicio`

Observacao:

- a navegacao funciona via cookie local de demo;
- nao houve, nesta rodada, comprovacao de integracao real com API para essa superficie.

### 9.5 API

Responderam corretamente:

- `/health`
- `/api/v1/auth/login`
- `/api/v1/operacao/handoffs`
- `/api/v1/empreendimentos`
- `/api/v1/portal/documentos`

## 10. Rotas com risco ou link quebrado

Riscos confirmados em runtime e codigo:

- `/equipe/agenda`
  - link existe em [equipe-nav.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/equipe/(equipe)/equipe-nav.tsx>)
  - rota nao existe
  - validacao runtime: `404`

- `/superadmin/tenants`
  - link existe em [app-sidebar.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/components/layout/app-sidebar.tsx>)
  - rota nao existe nesse path
  - validacao runtime: `404`
  - a rota funcional encontrada foi `/tenants`, que respondeu `200`

Risco de governanca tecnica, mas nao erro ativo no ambiente atual:

- o site publico tem fallback para dominio de producao em [apps/site/src/lib/content.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/site/src/lib/content.ts>)
- no ambiente local atual isso nao quebrou porque `apps/site/.env.local` ja sobrescreve a base para `localhost:3000`
- se esse arquivo local nao existir em outro ambiente de desenvolvimento, os CTAs publicos podem sair para producao

## 11. Leitura consolidada do estado atual

O repositorio esta em um ponto misto:

- a preparacao operacional do handoff ja passou da fase documental e entrou em persistencia minima real;
- o portal do cliente ja tem fatia funcional real com documentos persistidos;
- dashboard e motor de orcamento ja combinam dados reais com alguns caminhos de fallback;
- a area de equipe/campo ainda e claramente uma superficie de demo local;
- existem pequenos pontos de navegacao quebrada que podem ser corrigidos sem reabrir arquitetura.

## 12. Proxima etapa tecnica recomendada para a Onda 3.7.2

A proxima etapa segura da Onda 3.7.2 deve ser tratada como **fechamento incremental da preparacao operacional persistida**, nao como nova expansao ampla.

### 12.1 Objetivo tecnico sugerido

Fechar o ciclo minimo da persistencia ja iniciada:

- revisar a UX funcional do detalhe de handoff sobre os campos ja persistidos;
- garantir releitura, atualizacao e apresentacao consistente desses campos;
- remover ambiguidade entre:
  - `observacoesOperacionais`
  - `observacoesPlanejamento`
- validar se a listagem e a tela de detalhe comunicam corretamente o estado de preparacao persistida.

### 12.2 Escopo seguro para a 3.7.2

Escopo recomendado:

- consolidacao funcional dos campos ja existentes;
- validacao complementar de runtime e testes;
- pequenos ajustes de navegacao e integridade de rota;
- eventual ampliacao documental da Onda 3.7 para refletir o estado real.

### 12.3 Escopo que deve continuar fora agora

Ainda nao abrir:

- `previsaoInicialInicio`
- `riscoOperacional`
- `checklistProntidao`
- nova migration
- nova entidade
- acoplamento com OS
- acoplamento com contrato
- acoplamento com execucao formal

### 12.4 Recomendacao final

Antes de qualquer nova persistencia da Onda 3.7:

1. fechar a documentacao do estado real;
2. corrigir os links quebrados pequenos;
3. validar novamente as rotas principais;
4. so depois abrir uma 3.7.2 estritamente funcional sobre o que ja foi persistido.

## 13. Conclusao

O estado real pos-demo mostra que:

- a Onda 3.7.1 ja existe no codigo em nivel superior ao documentado;
- a persistencia minima de preparacao operacional do handoff ja foi implantada;
- o passo correto agora nao e inventar mais escopo, e sim fechar tecnicamente o que ja entrou;
- a Onda 3.7.2 deve comecar pela consolidacao funcional e pela higiene de navegacao, nao por nova modelagem.
