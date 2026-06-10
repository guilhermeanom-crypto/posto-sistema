# 72. Plano da Onda 3.7.3 - Consolidacao do Handoff Operacional

## 1. Objetivo desta etapa

Consolidar funcionalmente o handoff operacional ja persistido no sistema, sem ampliar modelagem e sem abrir novo escopo estrutural.

Esta etapa deve focar apenas em:

- clareza funcional dos campos ja persistidos;
- consistencia entre API, `PATCH`, releitura e exibicao em tela;
- melhor separacao de sentido entre `observacoesOperacionais` e `observacoesPlanejamento`;
- melhoria de microcopy dos campos ja existentes;
- consolidacao da experiencia de uso do handoff em detalhe operacional.

Esta etapa nao autoriza:

- novo campo;
- migration;
- alteracao de Prisma;
- redesign;
- acoplamento com OS;
- acoplamento com contrato;
- inicio de area de equipe/campo persistida.

## 2. Base de leitura desta consolidacao

Este plano se apoia em:

- [70_RELATORIO_ONDA_3_7_1_ESTADO_REAL_POS_DEMO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/70_RELATORIO_ONDA_3_7_1_ESTADO_REAL_POS_DEMO.md>)
- [71_RELATORIO_ONDA_3_7_2_CORRECOES_NAVEGACAO_E_RUNTIME.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/71_RELATORIO_ONDA_3_7_2_CORRECOES_NAVEGACAO_E_RUNTIME.md>)
- [apps/api/src/modules/operacao/handoffs.schemas.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.schemas.ts>)
- [apps/api/src/modules/operacao/handoffs.service.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.service.ts>)
- [apps/api/src/modules/operacao/handoffs.routes.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.routes.ts>)
- [apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx>)
- [apps/web/src/app/(app)/operacao/handoffs/shared.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/operacao/handoffs/shared.ts>)

## 3. Como os campos persistidos aparecem hoje na API

Os campos ja persistidos da preparacao operacional minima sao:

- `observacoesPlanejamento`
- `prioridadeOperacional`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`

Estado atual na API:

- aparecem no contrato de detalhe em [handoffs.schemas.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.schemas.ts>);
- aparecem na resposta de `GET /api/v1/operacao/handoffs/:id`;
- aparecem na resposta de `PATCH /api/v1/operacao/handoffs/:id`;
- nao aparecem na listagem resumida, ficando concentrados no detalhe do handoff;
- em [handoffs.service.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.service.ts>), o mapeamento `mapHandoffRow` ja serializa diretamente esses campos para o payload final.

Conclusao:

- a API ja expoe corretamente os cinco campos persistidos;
- a necessidade agora nao e de modelagem, e sim de consolidacao funcional da leitura e do uso.

## 4. Como os campos aparecem hoje na tela de detalhe

Na tela de detalhe do handoff em [page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx>):

- `observacoesPlanejamento` aparece em `textarea`;
- `prioridadeOperacional` aparece em `select`;
- `necessidadeDocumentos`, `necessidadeVisita` e `necessidadeTerceiro` aparecem como `select` tri-state:
  - `A confirmar`
  - `Sim`
  - `Nao`

Comportamento atual da exibicao:

- o bloco de preparacao operacional aparece quando o handoff ja esta em `EM_PLANEJAMENTO`;
- esse mesmo bloco tambem aparece quando o usuario seleciona `EM_PLANEJAMENTO` antes de salvar;
- apos o aceite, os valores reaparecem em blocos de leitura informativa da pre-execucao.

Conclusao:

- os campos ja estao visiveis e editaveis;
- a consolidacao precisa melhorar a clareza do significado e da leitura desses dados, nao a estrutura deles.

## 5. Validacao atual de PATCH, persistencia e releitura

O `PATCH` atual ja aceita os cinco campos persistidos:

- `observacoesPlanejamento`
- `prioridadeOperacional`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`

Estado atual do backend:

- o schema de atualizacao em [handoffs.schemas.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.schemas.ts>) permite explicitamente esses campos;
- o service em [handoffs.service.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.service.ts>) gera `setClauses` dedicadas para cada um deles;
- o `UPDATE` retorna `RETURNING *`, e a resposta ja volta saneada no proprio payload do `PATCH`;
- o `GET` de detalhe reapresenta os mesmos valores apos persistencia.

Cobertura de teste ja existente:

- [apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts>) ja cobre o fluxo de:
  - aceite do handoff;
  - `PATCH` dos campos minimos de preparacao operacional;
  - validacao da resposta do `PATCH`;
  - releitura via `GET` do mesmo handoff com confirmacao dos mesmos valores.

Conclusao:

- o circuito tecnico de salvar e reler esta funcional;
- a proxima etapa deve consolidar a experiencia de uso e a semantica dos campos.

## 6. Ambiguidade atual entre `observacoesOperacionais` e `observacoesPlanejamento`

### 6.1 Diagnostico

Existe ambiguidade parcial entre os dois campos.

Hoje:

- `observacoesOperacionais` aparece no bloco principal de atualizacao operacional;
- `observacoesPlanejamento` aparece no bloco de preparacao operacional persistida;
- a tela ja separa tecnicamente os campos, mas a semantica ainda pode confundir o usuario.

Ponto de ambiguidade:

- `observacoesOperacionais` pode ser lido como observacao geral de conducaop
- `observacoesPlanejamento` pode ser lido como mais uma observacao operacional, sem diferenca clara de uso

### 6.2 Diretriz de consolidacao

Sem criar novo campo e sem refatorar o fluxo, a consolidacao deve deixar explicito:

- `observacoesOperacionais` = contexto geral da triagem e da condução operacional do handoff;
- `observacoesPlanejamento` = observacoes da organizacao inicial apos o aceite, voltadas a pre-execucao.

Objetivo:

- reduzir duplicidade de preenchimento;
- evitar que o usuario registre o mesmo conteudo nos dois lugares;
- deixar a tela autoexplicativa sem reabrir modelagem.

## 7. Clareza atual de `prioridadeOperacional`

### 7.1 Diagnostico

`prioridadeOperacional` ja existe, persiste corretamente e possui labels em [shared.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/operacao/handoffs/shared.ts>):

- `Baixa`
- `Media`
- `Alta`
- `Critica`

Problema atual:

- a UX ainda nao deixa totalmente claro se essa prioridade representa:
  - urgencia da triagem;
  - ordem de preparacao;
  - urgencia da futura execucao.

### 7.2 Diretriz de consolidacao

Sem mudar o modelo, a interface deve deixar explicito que:

- a prioridade e da preparacao operacional deste handoff;
- ela nao cria fila de OS;
- ela nao equivale a inicio de execucao.

## 8. Clareza atual de `necessidadeDocumentos`, `necessidadeVisita` e `necessidadeTerceiro`

### 8.1 Diagnostico

Os tres campos funcionam tecnicamente bem como sinalizadores tri-state, mas ainda sao genericos no texto da tela.

Hoje o usuario ve apenas:

- `Necessidade de documentos`
- `Necessidade de visita`
- `Necessidade de terceiro`

Com valores:

- `A confirmar`
- `Sim`
- `Nao`

### 8.2 Diretriz de consolidacao

Sem alterar estrutura, a tela deve deixar mais claro o criterio de leitura:

- `necessidadeDocumentos` = depende de documentacao complementar para organizar a etapa seguinte;
- `necessidadeVisita` = depende de visita tecnica previa para viabilizar a preparacao;
- `necessidadeTerceiro` = depende de terceiro antes de a operacao conseguir estruturar o proximo passo.

Objetivo:

- tornar o preenchimento mais consistente;
- reduzir interpretacoes diferentes para a mesma flag;
- manter o campo simples, sem abrir workflow novo.

## 9. Ajustes pequenos propostos para consolidar a experiencia funcional

Os ajustes pequenos desta onda devem focar em consolidacao de uso, nao em expansao de escopo.

### 9.1 Ajustes de texto e semantica

- reforcar visualmente a diferenca entre:
  - observacoes gerais da conducao operacional;
  - observacoes da organizacao pre-execucao;
- revisar microcopy de `prioridadeOperacional`;
- revisar microcopy de `necessidadeDocumentos`, `necessidadeVisita` e `necessidadeTerceiro`.

### 9.2 Ajustes de exibicao funcional

- garantir que os dados persistidos de preparacao fiquem claramente identificados como parte do handoff aceito;
- evitar que a tela esconda informacao ja salva de preparacao em cenarios onde o handoff possua valores relevantes;
- manter a exibicao coerente entre:
  - formulario de atualizacao;
  - leitura informativa pos-aceite;
  - retorno imediato apos `PATCH`;
  - recarga da pagina via `GET`.

### 9.3 Ajustes de consolidacao de fluxo

- manter o fluxo atual de aceite em `EM_PLANEJAMENTO`;
- nao criar workflow paralelo;
- nao transformar esses campos em etapa separada com regra nova;
- apenas consolidar o que ja esta persistido e funcional.

## 10. Arquivos candidatos para implementacao

Arquivos mais provaveis para a implementacao desta consolidacao:

- [apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx>)
- [apps/web/src/app/(app)/operacao/handoffs/shared.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/operacao/handoffs/shared.ts>)
- [apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts>)

Arquivos que, em principio, nao deveriam exigir alteracao nesta onda minima:

- [apps/api/src/modules/operacao/handoffs.schemas.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.schemas.ts>)
- [apps/api/src/modules/operacao/handoffs.service.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.service.ts>)
- [apps/api/src/modules/operacao/handoffs.routes.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/handoffs.routes.ts>)

## 11. Testes e validacoes esperadas na implementacao

### 11.1 Testes automatizados

Devem ser rodados, no minimo:

- os testes de API do modulo de handoff em [apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts>)

### 11.2 Validacoes manuais de runtime

Na tela `/operacao/handoffs/[id]`, validar:

- carregamento do detalhe;
- exibicao dos campos de preparacao operacional;
- alteracao de `observacoesPlanejamento`;
- alteracao de `prioridadeOperacional`;
- alteracao de `necessidadeDocumentos`;
- alteracao de `necessidadeVisita`;
- alteracao de `necessidadeTerceiro`;
- salvamento via `PATCH`;
- retorno imediato dos dados atualizados na propria resposta;
- recarga da pagina e releitura via `GET`;
- clareza entre `observacoesOperacionais` e `observacoesPlanejamento`.

### 11.3 Validacao do aceite operacional

Tambem deve ser revalidado:

- aceite para `EM_PLANEJAMENTO`;
- bloqueio quando houver pendencias;
- exigencia de responsavel operacional para aceite;
- consistencia dos campos persistidos apos o aceite.

## 12. Fora de escopo

Fica expressamente fora do escopo desta onda:

- criar novos campos;
- criar migration;
- alterar Prisma;
- alterar arquitetura;
- redesign;
- criar checklist persistido de prontidao;
- criar `previsaoInicialInicio` persistida;
- criar `riscoOperacional` persistido;
- acoplar OS;
- acoplar contrato;
- iniciar fluxo financeiro;
- iniciar area de equipe/campo persistida;
- alterar proposta;
- alterar dashboard;
- alterar portal;
- alterar motor de orcamento;
- abrir Onda estrutural paralela.

## 13. Proximo passo recomendado apos este plano

Executar uma implementacao pequena e controlada, restrita ao detalhe do handoff operacional, com foco em:

- microcopy;
- clareza de significado;
- consistencia entre formulario, `PATCH`, releitura e exibicao;
- consolidacao do uso dos campos ja existentes.

Sem ampliar dominio, sem criar novo dado e sem deslocar o handoff para modulos adjacentes.
