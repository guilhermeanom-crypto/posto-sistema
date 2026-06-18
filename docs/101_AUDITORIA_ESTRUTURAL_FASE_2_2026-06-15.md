# 101. Auditoria Estrutural da Fase 2

Data: 2026-06-15

## 1. Objetivo

Aprofundar os furos estruturais que permanecem depois da estabilizacao da malha de testes da API.

Foco desta rodada:

1. conflito de modelagem entre `Processo` e `LicencaAmbiental`;
2. risco de integridade multi-tenant em criacoes com `empreendimentoId`;
3. entidades operacionais sem `empreendimentoId` proprio ou com vinculos indiretos frageis;
4. ordem recomendada de reparo.

## 2. Leitura executiva

O sistema esta mais saudavel do que a primeira impressao da auditoria sugeria, mas ainda carrega tres riscos que nao podem passar:

1. parte relevante da integridade multi-tenant ainda depende de disciplina de service, nao de contrato tecnico consistente;
2. `Processo` e `LicencaAmbiental` convivem como duas fontes de verdade parcialmente sobrepostas para a mesma trilha ambiental;
3. varias entidades filhas ou compostas aceitam combinacoes de FKs sem verificar coerencia entre pai, empreendimento e tenant.

Conclusao:

- a Fase 1 devolveu confianca operacional;
- a Fase 2 precisa agora devolver confianca de dominio e de integridade.

## 3. Achados principais

### Achado 1 — Critico

**A API ainda tem varios pontos de escrita em que o `empreendimentoId` entra sem validacao de ownership do tenant.**

Por que isso e grave:

- as relacoes Prisma apontam para `Empreendimento.id`, nao para uma chave composta com `tenantId`;
- se um service nao valida ownership no aplicativo, o banco aceita referencias cruzadas entre tenant atual e empreendimento de outro tenant, desde que o UUID exista.

Evidencias:

- `Processo` referencia `Empreendimento` apenas por `empreendimentoId`: [apps/api/prisma/schema.prisma](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/schema.prisma:766)
- `LicencaAmbiental` faz o mesmo, mas o service protege com `assertEmpreendimento`: [apps/api/prisma/schema.prisma](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/schema.prisma:1226), [apps/api/src/modules/licencas-ambientais/licencas-ambientais.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/licencas-ambientais/licencas-ambientais.service.ts:101)
- `ProcessosService.criar` grava `empreendimentoId` sem `assertEmpreendimento`: [apps/api/src/modules/processos/processos.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/processos/processos.service.ts:100)
- `TarefasService.criar` grava `empreendimentoId`, `processoId` e `condicionanteId` sem validar coerencia entre eles: [apps/api/src/modules/tarefas/tarefas.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/tarefas/tarefas.service.ts:96)
- `EstanqueidadeService.criarTanque` grava `empreendimentoId` sem validar ownership: [apps/api/src/modules/estanqueidade/estanqueidade.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/estanqueidade/estanqueidade.service.ts:69)
- `MonitoramentoService.criarPoco` e `criarCampanha` gravam `empreendimentoId` sem validacao previa: [apps/api/src/modules/monitoramento/monitoramento.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/monitoramento/monitoramento.service.ts:68), [apps/api/src/modules/monitoramento/monitoramento.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/monitoramento/monitoramento.service.ts:118)
- `PGRSService.criar` grava `empreendimentoId` sem validar ownership: [apps/api/src/modules/pgrs/pgrs.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/pgrs/pgrs.service.ts:91)
- `SSTService.criarFuncionario` grava `empreendimentoId` sem validacao previa: [apps/api/src/modules/sst/sst.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/sst/sst.service.ts:256)

Contraste importante:

- ha modulos que ja fazem o certo, como `LicencaAmbiental`, `Condicionante`, `AutoInfracao` e `PocoArtesiano`: [apps/api/src/modules/condicionantes/condicionantes.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/condicionantes/condicionantes.service.ts:78), [apps/api/src/modules/fiscalizacoes/fiscalizacoes.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/fiscalizacoes/fiscalizacoes.service.ts:81), [apps/api/src/modules/outorga-hidrica/outorga-hidrica.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/outorga-hidrica/outorga-hidrica.service.ts:67)

Diagnostico:

- o problema nao e generalizado no schema apenas;
- ele aparece principalmente como inconsistência de padrao entre services.

### Achado 2 — Alto

**`Processo` e `LicencaAmbiental` hoje representam trilhas que se sobrepoem, mas sem contrato de sincronizacao.**

Sinais de sobreposicao:

- `Processo` guarda `numeroLicenca`, `dataEmissao`, `dataVencimento` e fluxo regulatorio: [apps/api/prisma/schema.prisma](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/schema.prisma:766)
- `LicencaAmbiental` guarda `numero`, `dataEmissao`, `dataVencimento`, `status` e condicoes: [apps/api/prisma/schema.prisma](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/schema.prisma:1226)
- `ProcessosService` cria e atualiza estes campos no proprio processo: [apps/api/src/modules/processos/processos.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/processos/processos.service.ts:121), [apps/api/src/modules/processos/processos.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/processos/processos.service.ts:191)
- o onboarding usa `LicencaAmbiental` como fonte de verdade para validade operacional: [apps/api/src/modules/onboarding/gap-analysis.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/onboarding/gap-analysis.service.ts:90)
- o cockpit tambem usa `LicencaAmbiental` para vencimentos e score: [apps/api/src/modules/cockpit/cockpit.routes.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/cockpit/cockpit.routes.ts:170)
- os seeds alimentam `Processo` e `LicencaAmbiental` separadamente, sem sincronizacao explicita entre eles: [apps/api/prisma/seed.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/seed.ts:680), [apps/api/prisma/seed/operational-scenarios.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/seed/operational-scenarios.ts:239)

Risco real:

- um processo pode refletir uma licenca deferida ou vencida em estado diferente da licenca operacional usada pelo cockpit;
- a renovacao pode acontecer em uma entidade e nao na outra;
- condicoes ambientais vivem em `LicencaAmbiental`, enquanto requisitos e fase vivem em `Processo`, o que dificulta responder qual entidade e "a oficial" na jornada da licenca.

Leitura recomendada:

- `Processo` parece ser o trilho de workflow regulatorio;
- `LicencaAmbiental` parece ser o ativo operacional/compliance;
- hoje essa separacao existe de fato, mas nao esta formalizada, e o modelo permite duplicidade de informacao.

### Achado 3 — Alto

**Existem escritas com FKs combinadas sem checagem de coerencia entre pai e filho.**

Isso e diferente do achado 1.

Aqui o problema nao e apenas "o empreendimento pertence ao tenant?", mas tambem:

- "o `processoId` pertence ao mesmo `empreendimentoId` informado?"
- "o `pocoMonitoramentoId` pertence ao mesmo `empreendimentoId` da campanha?"
- "o `funcionarioId` pertence ao mesmo `empreendimentoId` do ASO?"

Exemplos:

- `CondicionantesService.criar` valida o empreendimento, mas aceita `processoId` sem verificar se o processo pertence ao mesmo empreendimento e tenant: [apps/api/src/modules/condicionantes/condicionantes.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/condicionantes/condicionantes.service.ts:78)
- `MonitoramentoService.criarCampanha` aceita ao mesmo tempo `empreendimentoId` e `pocoMonitoramentoId`, mas nao checa coerencia entre eles: [apps/api/src/modules/monitoramento/monitoramento.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/monitoramento/monitoramento.service.ts:68)
- `SSTService.criarASO` valida `funcionarioId` por tenant, mas o `empreendimentoId` do ASO continua entrando por fora e pode divergir do funcionario: [apps/api/src/modules/sst/sst.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/sst/sst.service.ts:341)
- `TarefasService.criar` aceita `empreendimentoId`, `processoId` e `condicionanteId` sem reconciliar se tudo aponta para o mesmo contexto: [apps/api/src/modules/tarefas/tarefas.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/tarefas/tarefas.service.ts:96)

Consequencia:

- o sistema pode ficar "valido por FK", mas semanticamente errado;
- isso tende a aparecer depois como bug de listagem, score, alertas e tenant isolation dificil de reproduzir.

### Achado 4 — Medio/Alto

**O schema mistura entidades filhas com e sem `empreendimentoId`, sem uma regra arquitetural formal.**

Exemplos de entidades filhas sem `empreendimentoId` proprio:

- `HistoricoFaseProcesso`: [apps/api/prisma/schema.prisma](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/schema.prisma:804)
- `RequisitoProcesso`: [apps/api/prisma/schema.prisma](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/schema.prisma:823)
- `CondicaoLicenca`
- `TesteEstanqueidade`: [apps/api/prisma/schema.prisma](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/prisma/schema.prisma:1584)
- `RecursoAdministrativo`
- `DefesaTecnica`
- `PGRSExigencia`
- `PGRSEvidencia`
- `LaudoAgua`
- `ParametroContaminante`
- `ChecklistResposta`
- `ItemProposta`

Leitura equilibrada:

- nem toda ausencia de `empreendimentoId` e erro;
- em varios casos a modelagem por pai e aceitavel e ate desejavel.

O problema aparece quando:

1. a entidade filha passa a ser consultada diretamente com frequencia;
2. ela entra em score, busca, timeline ou alerta;
3. o ownership precisa ser provado sem navegar pai por pai;
4. a aplicacao mistura leitura por pai em alguns lugares e leitura direta em outros.

Exemplo bom:

- `TesteEstanqueidade` nao tem `empreendimentoId`, mas a criacao valida ownership via `Tanque` e a listagem filtra via relacao `tanque.tenantId`: [apps/api/src/modules/estanqueidade/estanqueidade.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/estanqueidade/estanqueidade.service.ts:101), [apps/api/src/modules/estanqueidade/estanqueidade.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/estanqueidade/estanqueidade.service.ts:124)

Exemplo ruim:

- `EquipamentoHistorico` recebe `empreendimentoId` e `equipamentoId`, mas nao valida se o equipamento realmente pertence ao empreendimento informado: [apps/api/src/modules/equipamentos/equipamentos-historico.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/equipamentos/equipamentos-historico.service.ts:50)

## 4. Impacto por risco

### Integridade de dados

- possibilidade de gravar relacionamento cruzado entre tenant atual e empreendimento externo;
- possibilidade de gravar registros semanticamente incoerentes mesmo com FK valida;
- aumento de custo para reconciliar dados reais no piloto de implantacao.

### Tenant isolation

- risco principal esta nas rotas de escrita, nao tanto nas listagens ja filtradas por `tenantId`;
- uma vez persistido um vinculo errado, listagens futuras podem mascarar o problema ate ele aparecer em outro modulo.

### Dominio e produto

- a frente ambiental/compliance pode mostrar uma realidade no cockpit e outra na trilha de processos;
- o operador nao tem uma fonte de verdade unica para licenca operacional.

## 5. Decisoes recomendadas

### Decisao A — Immediate hardening

Padronizar toda escrita com uma camada explicita de ownership:

- `assertEmpreendimento`
- `assertProcesso`
- `assertCondicionante`
- `assertPocoMonitoramento`
- `assertFuncionario`
- `assertTanque`

Cada helper deve validar:

1. tenant;
2. relacao com empreendimento quando aplicavel;
3. coerencia entre ids compostos recebidos na mesma entrada.

### Decisao B — ADR para `Processo` x `LicencaAmbiental`

Escolher uma de duas linhas e registrar formalmente:

1. `Processo` = workflow regulatorio e `LicencaAmbiental` = ativo operacional emitido.
2. `LicencaAmbiental` passa a ser projeção derivada de `Processo`, sem edicao autonoma.

Minha leitura atual:

- a opcao 1 parece mais aderente ao estado real do codigo;
- mas ela exige regra de sincronizacao clara e campos sem sobreposicao ambigua.

### Decisao C — Regra para entidades filhas

Formalizar quando uma entidade filha precisa de `empreendimentoId` proprio.

Criterio sugerido:

- se a entidade e consultada diretamente por modulo, score, alerta ou dashboard, considerar `empreendimentoId` proprio;
- se ela so existe dentro do agregado pai e nunca e alvo de leitura operacional independente, manter somente FK do pai e validar ownership pelo pai.

## 6. Ordem de reparo

### Sprint 2A — Nao pode passar

1. corrigir todas as criacoes/updates sem `assertEmpreendimento` ou equivalente;
2. introduzir validadores de coerencia entre `empreendimentoId` e pais opcionais;
3. adicionar testes de regressao cross-tenant para esses writes.

Alvos mais urgentes:

- `processos.service.ts`
- `tarefas.service.ts`
- `sst.service.ts`
- `estanqueidade.service.ts`
- `monitoramento.service.ts`
- `pgrs.service.ts`
- `logistica-reversa.service.ts`
- `equipamentos-historico.service.ts`

### Sprint 2B — Dominio

1. escrever ADR de `Processo` x `LicencaAmbiental`;
2. mapear campos que devem permanecer em cada lado;
3. cortar ou derivar os campos duplicados.

### Sprint 2C — Banco

1. estudar chave composta para reforco tenant-aware;
2. avaliar migracoes para entidades filhas que precisem `empreendimentoId` proprio;
3. revisar indices apos a decisao final de dominio.

## 7. Criterios de aceite desta fase

Esta frente pode ser considerada fechada quando:

1. nenhuma rota de escrita relevante aceitar `empreendimentoId` sem ownership check;
2. as combinacoes `empreendimentoId + processoId`, `empreendimentoId + condicionanteId`, `empreendimentoId + pocoId`, `empreendimentoId + funcionarioId` tiverem coerencia validada;
3. existir decisao formal de `Processo` x `LicencaAmbiental`;
4. o backlog deixar de depender de "lembrar quais services validam e quais nao validam".

## 8. Proximo passo recomendado

Iniciar pela trilha de hardening multi-tenant, porque ela entrega:

- menor risco operacional imediato;
- menor custo de implementacao;
- base mais segura para mexer depois no dominio `Processo` x `LicencaAmbiental`.
