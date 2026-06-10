# 81. Plano de Auditoria Final e Estabilizacao do Sistema

## 1. Objetivo

Transformar o levantamento tecnico de 2026-05-27 em um plano operacional de correcao, com ordem de execucao, prioridades, riscos, criterios de pronto e registro de acompanhamento.

Este documento e o registro-mestre para a reta final de estabilizacao do sistema.

## 2. Estado atual resumido

A rodada estrutural desta auditoria foi concluida.

As inconsistencias centrais entre `apps/api`, `apps/web`, `apps/site` e `apps/worker` foram tratadas e registradas neste plano.

O sistema agora se encontra em estado de consolidacao avancada, com os maiores riscos estruturais ja enderecados:

- contrato de ambiente e URLs padronizado;
- auth, refresh token e semantica de `401`/`403` estabilizados;
- contrato cross-service entre API e worker alinhado;
- trilha minima confiavel de testes aberta;
- componentes criticos do frontend deixando de assumir sucesso silencioso;
- `typecheck` limpo no escopo auditado.

O que resta daqui em diante deixa de ser correcao estrutural urgente e passa a ser:

- expansao de cobertura de testes;
- validacao integrada com infraestrutura real;
- refinamentos funcionais e de UX sem reabrir inconsistencias de base.

## 3. Classificacao de prioridade

| Nivel | Significado | Escopo atual |
| --- | --- | --- |
| Critico | Pode quebrar ambiente, deploy ou fluxo principal | Contrato de URLs e variaveis de ambiente |
| Alto | Pode causar erro real de sessao, integracao ou operacao | Auth/refresh token, worker/S3, testes nao hermeticos |
| Medio | Pode causar UX ruim, falso sucesso ou depuracao confusa | `401` x `403`, tratamento de erro no frontend |
| Baixo | Nao quebra negocio, mas impede acabamento tecnico limpo | `typecheck` do `apps/site`, higiene final |

## 4. Macroestrategia

Executar em 6 fases, nesta ordem:

1. Baseline e contrato tecnico unico
2. URLs, proxies e ambiente
3. Auth, sessao e codigos de erro
4. Worker e contratos entre servicos
5. Confiabilidade de testes e validacoes
6. Higiene final e gate de liberacao

Regra de ouro:

- nao abrir novas frentes de feature enquanto as fases 1 a 4 nao estiverem estabilizadas;
- cada fase deve fechar com validacao objetiva;
- toda correcao precisa deixar contrato explicito em codigo e documentacao.

## 4.1. Status atual das fases

| Fase | Nome | Status atual | Leitura |
| --- | --- | --- | --- |
| 0 | Baseline e congelamento curto | Concluida | Plano mestre consolidado |
| 1 | URLs, ambiente e proxies | Concluida | Base URL unificada e contrato de ambiente ajustado |
| 2 | Auth, sessao e codigos HTTP | Concluida | Refresh token e semantica de acesso estabilizados |
| 3 | Worker e contratos entre servicos | Concluida | Worker alinhado ao contrato da API |
| 4 | Testes e confiabilidade | Concluida | Suites integradas segregadas e trilha unitária minima criada |
| 5 | Frontend resiliente | Concluida | Pontos criticos auditados sem falso sucesso silencioso |
| 6 | Higiene final e liberacao | Concluida | `apps/site` limpo e relatorio de fechamento emitido |

## 5. Frentes de correcao

### Frente A. Contrato de ambiente e URLs

#### Problema

Hoje existe uso inconsistente entre:

- `API_URL`
- `NEXT_PUBLIC_API_URL`
- `WEB_URL`

Partes do sistema assumem que `API_URL` inclui `/api/v1`; outras assumem que nao inclui.

#### Impacto

- rotas proxy do Next podem chamar endpoint errado;
- PDF e download autenticado podem falhar em producao;
- ambiente local e ambiente produtivo podem se comportar de forma diferente.

#### Arquivos-base

- `apps/web/src/lib/api.ts`
- `apps/web/src/app/api/comercial/propostas/[id]/pdf/route.ts`
- `apps/web/src/app/api/documentos/[id]/versoes/[versaoId]/download/route.ts`
- `apps/web/src/app/api/operacao/handoffs/route.ts`
- `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`
- `apps/api/src/config/env.ts`
- `apps/worker/src/config/env.ts`
- `.env.example`
- `apps/api/.env`
- `apps/web/.env.local`

#### Decisao recomendada

Padronizar o contrato assim:

- `API_URL`: base versionada da API, por exemplo `https://api.domino.com/api/v1`
- `NEXT_PUBLIC_API_URL`: mesma base versionada usada pelo frontend
- `WEB_URL`: base do app web, por exemplo `https://app.domino.com`

Alternativa valida:

- `API_URL` sem `/api/v1`
- `NEXT_PUBLIC_API_URL` com `/api/v1`

Mas, se essa alternativa for mantida, toda montagem manual de path deve ser centralizada e revisada.

#### Criterio de pronto

- nenhuma rota do `apps/web` concatena `/api/v1` de forma conflitante;
- download, PDF e proxies usam o mesmo resolvedor de base URL;
- `.env.example` reflete exatamente o contrato real.

### Frente B. Auth, sessao e refresh token

#### Problema

Existe divergencia entre:

- variavel exposta no schema;
- nome usado em `.env`;
- valor efetivamente usado no codigo.

Hoje parte do comportamento esta fixada em hardcode.

#### Impacto

- a equipe pode alterar `.env` e nada mudar;
- sessao pode expirar diferente do esperado;
- manutencao futura fica enganosa e fragil.

#### Arquivos-base

- `apps/api/src/config/env.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/.env`
- qualquer tela/rota que trate expiracao de sessao

#### Decisao recomendada

- escolher um unico nome de variavel para refresh token;
- remover hardcode de prazo;
- tornar o comportamento observavel e previsivel;
- revisar diferenca entre expiracao do access token e do refresh token.

#### Criterio de pronto

- o backend le o prazo real do ambiente;
- o `.env.example` e os `.env` locais usam o mesmo nome;
- o fluxo de login, refresh e logout respeita o contrato documentado.

### Frente C. Codigos HTTP e semantica de erro

#### Problema

Ha cenarios em que `401` e `403` estao misturados para problemas diferentes.

#### Impacto

- frontend reage errado;
- UX fica confusa;
- time perde tempo depurando sessao expirada como se fosse permissao negada.

#### Arquivos-base

- `apps/web/src/app/api/operacao/handoffs/route.ts`
- `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`
- demais route handlers equivalentes
- camadas de auth no backend e frontend

#### Regra desejada

- `401`: usuario sem sessao valida ou sessao expirada
- `403`: usuario autenticado, mas sem permissao

#### Criterio de pronto

- os proxies do Next respondem com semantica consistente;
- mensagens de erro acompanham o status correto;
- frontend consegue distinguir re-login de restricao de perfil.

### Frente D. Worker, S3 e contratos cross-service

#### Problema

API e worker nao validam `S3_ENDPOINT` da mesma forma.

#### Impacto

- uma configuracao suportada pela API pode derrubar o worker;
- deploy parcial fica possivel sem consistencia real do sistema.

#### Arquivos-base

- `apps/worker/src/config/env.ts`
- `apps/api/src/config/env.ts`
- `apps/worker/src/services/ai.service.ts`
- `.env.example`

#### Decisao recomendada

- alinhar o schema do worker ao mesmo contrato da API;
- tratar explicitamente AWS S3 e MinIO;
- revisar se `forcePathStyle` deve ser sempre `true` ou ser condicionado ao provider.

#### Criterio de pronto

- API e worker aceitam o mesmo contrato de ambiente;
- o modo AWS e o modo MinIO ficam documentados e validos;
- o worker sobe com a mesma base de configuracao publicada no `.env.example`.

### Frente E. Confiabilidade de testes

#### Problema

Parte relevante dos testes depende de Postgres e Redis reais para chegar nos asserts de negocio.

#### Impacto

- pipeline instavel;
- regressao passa despercebida;
- a equipe deixa de confiar nos testes.

#### Arquivos-base

- `apps/api/src/modules/comercial/__tests__/*.test.ts`
- `apps/api/src/modules/operacao/__tests__/*.test.ts`
- `apps/api/src/app.ts`
- `apps/api/src/infra/cache/redis.ts`
- `apps/api/src/infra/database/prisma.ts`

#### Estrategia recomendada

- separar testes hermeticos de testes integrados com infra;
- mockar Redis quando o objetivo nao for validar Redis;
- usar banco de teste controlado ou fixtures dedicadas quando a regra exigir persistencia real;
- evitar que `loginDemo` dependa do mesmo runtime pesado em todos os casos.

#### Criterio de pronto

- existe uma camada minima de testes que roda sem depender de infra externa;
- os testes integrados ficam claramente marcados;
- falha de negocio nao fica mascarada por falha de ambiente.

### Frente F. Tratamento de erro no frontend

#### Problema

Alguns componentes cliente fazem `fetch` e atualizam a UI sem validar `res.ok`.

#### Impacto

- falso sucesso;
- estado visual divergente do backend;
- experiencia ruim para usuario e operador.

#### Arquivos-base

- `apps/web/src/app/(app)/empreendimentos/[id]/equipe-card.tsx`
- outros componentes com `fetch` direto em client component

#### Estrategia recomendada

- revisar componentes com mutacao client-side;
- centralizar padrao de erro;
- impedir update otimista sem validacao minima;
- expor feedback claro quando a API falhar.

#### Criterio de pronto

- mutacoes criticas tratam falha;
- UI nao assume sucesso silencioso;
- usuario recebe mensagem acionavel.

### Frente G. Higiene tecnica final

#### Problema

O `apps/site` nao fecha `typecheck` limpo por codigo nao usado.

#### Impacto

- pipeline parcial;
- sinal de qualidade enfraquecido;
- ruido desnecessario na reta final.

#### Arquivos-base

- `apps/site/src/components/hero-platform.tsx`
- `apps/site/src/components/page-hero.tsx`

#### Criterio de pronto

- `typecheck` limpo em todos os apps e pacotes auditados;
- sem imports, props ou blocos mortos triviais;
- baseline pronta para gate final.

## 6. Fases operacionais

### Fase 0. Baseline e congelamento curto

#### Objetivo

Preparar o terreno antes das correcoes.

#### Tarefas

- consolidar este plano como documento-mestre;
- confirmar contrato oficial de `API_URL`, `NEXT_PUBLIC_API_URL` e `WEB_URL`;
- listar os comandos oficiais de validacao por app;
- registrar limitacoes atuais do ambiente local.

#### Saida esperada

- uma decisao unica de contrato de ambiente;
- checklist de validacao antes e depois de cada fase.

### Fase 1. URLs, ambiente e proxies

#### Objetivo

Eliminar o maior risco de quebra cross-environment.

#### Tarefas

- criar um resolvedor central de base URL no `apps/web`;
- padronizar consumo em `lib/api.ts` e route handlers;
- ajustar redirecionamento de login nos downloads;
- revisar `.env.example` e arquivos locais para refletir o contrato real.

#### Dependencias

- conclusao da Fase 0

#### Gate de saida

- PDF, download e handoffs usam base unificada;
- nenhuma duplicacao de `/api/v1`.

### Fase 2. Auth, sessao e codigos HTTP

#### Objetivo

Fechar previsibilidade de acesso.

#### Tarefas

- remover hardcode de refresh token;
- alinhar nome de variavel e leitura;
- revisar `401` x `403` nas rotas proxy;
- validar login, refresh e logout.

#### Gate de saida

- sessao responde conforme contrato;
- sem ambiguidades entre expiracao e falta de permissao.

### Fase 3. Worker e contratos entre servicos

#### Objetivo

Garantir que API e worker falem a mesma lingua.

#### Tarefas

- alinhar schema de ambiente do worker com a API;
- revisar configuracao de S3/AWS/MinIO;
- validar subida de worker com configuracoes suportadas pela documentacao.

#### Gate de saida

- contrato cross-service documentado e executavel.

### Fase 4. Testes e confiabilidade

#### Objetivo

Ganhar seguranca de regressao.

#### Tarefas

- separar testes hermeticos de testes integrados;
- reduzir dependencia acidental de Redis/Postgres onde nao for essencial;
- documentar como rodar validacao local completa;
- revisar casos que hoje quebram antes de testar a regra de negocio.

#### Gate de saida

- existe uma trilha minima confiavel de validacao automatizada.

### Fase 5. Frontend resiliente

#### Objetivo

Remover falso sucesso visual nas operacoes criticas.

#### Tarefas

- revisar componentes client-side com `fetch` direto;
- adicionar tratamento de falha e feedback;
- alinhar recarga de estado apos mutacao.

#### Gate de saida

- mutacoes auditadas nao mentem para o usuario.

### Fase 6. Higiene final e liberacao

#### Objetivo

Fechar acabamento tecnico.

#### Tarefas

- corrigir `typecheck` do `apps/site`;
- revisar artefatos locais e residuos de build;
- rerodar validacoes finais;
- registrar relatorio de fechamento desta auditoria.

#### Gate de saida

- monorepo sem pendencias triviais conhecidas;
- criterio de liberacao claro.

## 7. Ordem recomendada de execucao

| Ordem | Frente | Prioridade | Motivo |
| --- | --- | --- | --- |
| 1 | Ambiente e URLs | Critico | Pode quebrar deploy e fluxos centrais |
| 2 | Auth e sessao | Alto | Fecha previsibilidade de acesso |
| 3 | Worker e S3 | Alto | Fecha consistencia entre servicos |
| 4 | Codigos HTTP e proxies | Alto | Ajusta comportamento real da aplicacao |
| 5 | Testes | Alto | Da seguranca para seguir corrigindo |
| 6 | Frontend resiliente | Medio | Evita falso sucesso para usuario |
| 7 | Higiene final | Baixo | Fecha acabamento tecnico |

## 8. Registro de acompanhamento

Atualizar esta tabela ao longo da execucao.

| ID | Frente | Status | Responsavel | Evidencia | Observacoes |
| --- | --- | --- | --- | --- | --- |
| A1 | Contrato de ambiente definido | Concluido | Codex | `apps/web/src/lib/api-base.ts`, `.env.example` | Padronizado para base versionada da API (`/api/v1`) |
| A2 | Proxies e rotas com base URL unificada | Concluido | Codex | `apps/web/src/lib/api.ts`, rotas de PDF, download e handoff | Redirecionamento de login corrigido e proxies sem duplicacao de `/api/v1` |
| B1 | Refresh token sem hardcode | Concluido | Codex | `apps/api/src/config/env.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/.env` | Expiração passou a respeitar `REFRESH_TOKEN_EXPIRES_IN` e `expiresIn` responde ao contrato do access token |
| B2 | `401` e `403` padronizados | Concluido | Codex | `apps/web/src/app/api/operacao/handoffs/*.ts`, `apps/web/src/app/(app)/operacao/handoffs/actions.ts` | Sessão inválida responde `401`; falta de permissão permanece `403` |
| C1 | Worker alinhado ao contrato S3/API | Concluido | Codex | `apps/worker/src/config/env.ts`, `apps/worker/src/infra/s3.ts`, `apps/worker/src/services/ai.service.ts`, `apps/worker/src/processors/relatorio.processor.ts`, `apps/worker/.env` | Worker passou a aceitar `S3_ENDPOINT` opcional e centralizou cliente S3 compatível com AWS e MinIO |
| D1 | Testes hermeticos minimos definidos | Concluido | Codex | `apps/api/src/modules/auth/auth-duration.ts`, `apps/api/src/modules/auth/auth-duration.unit.test.ts`, `apps/api/src/modules/operacao/handoffs-rules.ts`, `apps/api/src/modules/operacao/handoffs-rules.unit.test.ts`, `apps/api/package.json` | Trilha unitária mínima criada para regras puras de auth e handoff, executável sem banco nem Redis via `test:unit` |
| D2 | Testes integrados documentados | Concluido | Codex | `apps/api/src/test/integration.ts`, `apps/api/package.json`, `docs/82_GUIA_TESTES_INTEGRADOS_API.md` | Gate `RUN_API_INTEGRATION_TESTS=1` documentado e suites atuais passam a ficar explicitamente separadas quando `vitest` roda direto |
| E1 | Componentes criticos com tratamento de erro | Concluido | Codex | `apps/web/src/app/(app)/empreendimentos/[id]/equipe-card.tsx`, `apps/web/src/app/(app)/fila/fila-actions.tsx` | Fluxos de equipe e fila passaram a validar `res.ok`, exibir erro real e evitar refresh/update enganoso quando a API falha |
| F1 | `apps/site` com `typecheck` limpo | Concluido | Codex | `apps/site/src/components/hero-platform.tsx`, `apps/site/src/components/page-hero.tsx` | Removidos imports mortos e mantido o contrato `scene` sem quebrar as páginas que já consumiam o componente |
| F2 | Relatorio final de estabilizacao emitido | Concluido | Codex | `docs/83_RELATORIO_FECHAMENTO_ESTABILIZACAO_2026-05-27.md` | Fechamento desta rodada registrado com evidencias, validacoes executadas e pendencia residual explicitada |

## 9. Comandos de validacao esperados

Os comandos oficiais devem ser revalidados no ambiente final, mas a trilha desejada e:

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`

Quando o `turbo` ou o ambiente local nao permitirem rodar o monorepo inteiro:

- rodar `tsc --noEmit` por app/pacote;
- rodar testes do backend por suite;
- registrar claramente qualquer dependencia externa necessaria.

## 10. Definicao de pronto desta auditoria

Esta auditoria sera considerada fechada quando:

- o contrato de ambiente estiver unico e coerente;
- os proxies do `apps/web` estiverem padronizados;
- auth e refresh token estiverem previsiveis e sem hardcode indevido;
- API e worker aceitarem o mesmo contrato de storage;
- existir uma trilha minima confiavel de testes;
- os componentes criticos do frontend tratarem erro corretamente;
- `typecheck` estiver limpo no escopo auditado;
- um relatorio final consolidar o que foi corrigido e o que sobra como debito tecnico residual.

## 11. Proxima acao recomendada

Como a trilha estrutural foi concluida, a continuidade recomendada deixa de ser "reiniciar fases" e passa a ser uma nova onda de consolidacao guiada por qualidade.

Ordem sugerida para seguir:

1. Expandir a trilha unitária da API.
   Priorizar regras puras de servicos como `gap-analysis`, `sst` e validacoes de dominio que hoje ainda dependem apenas de suites integradas.
2. Rodar a trilha integrada com infraestrutura preparada.
   Subir PostgreSQL, aplicar migrate/seed e executar `test` ou `test:integration` para validar a malha completa com ambiente real.
3. Abrir uma rodada controlada de refinamento funcional.
   Revisar outros client components com `fetch` direto, fluxos de upload/download e UX de erro fora dos pontos criticos ja tratados.
4. Preparar gate operacional de release.
   Consolidar checklist final com `typecheck`, testes unitarios, testes integrados e verificacao manual dos fluxos principais.

## 12. Definicao pratica para seguir daqui

Leitura operacional para o time:

- este plano pode ser tratado como `fase estrutural concluida`;
- novas correcoes devem se apoiar no contrato ja consolidado, sem reabrir divergencias de ambiente, auth ou storage;
- as proximas entregas devem usar `docs/83_RELATORIO_FECHAMENTO_ESTABILIZACAO_2026-05-27.md` como baseline de saida e este documento como trilha de continuidade.
