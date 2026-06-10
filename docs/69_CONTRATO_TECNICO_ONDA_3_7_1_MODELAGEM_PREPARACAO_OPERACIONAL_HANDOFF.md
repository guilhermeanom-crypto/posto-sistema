# 69. Contrato Tecnico da Onda 3.7.1 - Modelagem da Preparacao Operacional do Handoff

## 1. Objetivo da Onda 3.7.1

Definir o contrato tecnico e a decisao de modelagem para persistir, de forma minima e controlada, os dados de preparacao operacional do handoff.

Objetivo especifico desta subetapa:

- decidir quais campos entram primeiro;
- decidir quais ficam para uma segunda fase;
- decidir quais nao devem ser persistidos agora;
- definir tipos sugeridos, obrigatoriedade e valores controlados;
- antecipar impacto em Prisma, migration, schemas, `PATCH`, proxy, frontend e testes.

Diretriz central:

- a primeira implementacao deve ser enxuta;
- a persistencia nova nao pode alterar a regra de aceite da Onda 3.4;
- a persistencia nova nao pode reabrir a sanitizacao visual da Onda 3.5;
- `EM_PLANEJAMENTO` deve continuar significando handoff aceito e em organizacao pre-execucao.

## 2. Contexto herdado das ondas anteriores

Da Onda 3.4, esta decisao tecnica herda:

- `EM_PLANEJAMENTO` como representacao do aceite operacional;
- bloqueio sem `responsavelOperacionalId`;
- bloqueio com `pendenciasOperacionais` em aberto;
- persistencia homologada de:
  - `status`
  - `responsavelOperacionalId`
  - `pendenciasOperacionais`
  - `observacoesOperacionais`
- ausencia de OS, contrato, financeiro e CRM.

Da Onda 3.5, herda:

- leitura padrao sem UUIDs e IDs internos expostos;
- labels mais amigaveis;
- contrato atual do proxy preservado, sem reabertura estrutural.

Da Onda 3.6, herda:

- camada visual de preparacao operacional ja validada;
- placeholders honestos para campos ainda nao persistidos;
- confirmacao runtime de que a tela real funciona bem sem criar inputs indevidos.

Conclusao de contexto:

- a semantica visual ja esta validada;
- agora a decisao critica e estruturar a persistencia sem inflar o handoff e sem quebrar o fluxo homologado.

## 3. Decisao recomendada de modelagem

Decisao recomendada:

- **na primeira implementacao, persistir apenas campos escalares simples diretamente na entidade de handoff**;
- **nao criar entidade nova nesta fase**;
- **nao criar JSON estruturado agora para checklist**;
- **nao criar automatismo de prontidao, OS ou execucao**;
- **nao usar os novos campos como requisito para aceitar o handoff**.

Modelagem recomendada para a primeira leva:

- `observacoesPlanejamento`
- `prioridadeOperacional`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`

Modelagem recomendada para fase posterior:

- `previsaoInicialInicio`
- `riscoOperacional`

Modelagem recomendada para nao entrar agora:

- `checklistProntidao`

Racional da decisao:

- a primeira fase deve capturar o minimo necessario para tornar a preparacao persistida util;
- campos simples e de baixa ambiguidade entram primeiro;
- campos com maior carga semantica ou estrutura composta ficam para depois.

## 4. Campos que entram na primeira implementacao

### 4.1 `observacoesPlanejamento`

Classificacao:

- `ENTRA NA PRIMEIRA IMPLEMENTAÇÃO`

Justificativa:

- separa planejamento de `observacoesOperacionais`;
- resolve uma lacuna de governanca imediatamente;
- e o campo com melhor aderencia ao uso real observado na Onda 3.6.

### 4.2 `prioridadeOperacional`

Classificacao:

- `ENTRA NA PRIMEIRA IMPLEMENTAÇÃO`

Justificativa:

- tem alto valor para organizacao interna;
- e simples de modelar com conjunto controlado de labels;
- melhora leitura e ordenacao do planejamento sem acoplar execucao.

### 4.3 `necessidadeDocumentos`

Classificacao:

- `ENTRA NA PRIMEIRA IMPLEMENTAÇÃO`

Justificativa:

- responde a uma necessidade clara da etapa de preparacao;
- tem semantica simples;
- pode ser modelado como flag controlada sem bloquear aceite.

### 4.4 `necessidadeVisita`

Classificacao:

- `ENTRA NA PRIMEIRA IMPLEMENTAÇÃO`

Justificativa:

- e uma necessidade operacional recorrente;
- cabe bem na semantica de pre-execucao;
- nao implica agenda, OS ou execucao.

### 4.5 `necessidadeTerceiro`

Classificacao:

- `ENTRA NA PRIMEIRA IMPLEMENTAÇÃO`

Justificativa:

- ajuda a coordenacao operacional;
- tem bom valor de planejamento;
- pode ser modelado de forma simples e opcional.

## 5. Campos que ficam para segunda fase

### 5.1 `previsaoInicialInicio`

Classificacao:

- `FICA PARA SEGUNDA FASE`

Justificativa:

- parece simples, mas carrega risco semantico alto;
- pode induzir leitura de cronograma de execucao;
- precisa de regra de exibicao muito bem definida para nao parecer agenda operacional formal.

### 5.2 `riscoOperacional`

Classificacao:

- `FICA PARA SEGUNDA FASE`

Justificativa:

- precisa ser claramente separado de:
  - `riscoNivel`
  - `riscoScore`
  - `potencialPoluidor`
- se entrar cedo demais, pode duplicar ou conflitar com o risco comercial/regulatorio herdado.

## 6. Campos que nao devem ser persistidos agora

### 6.1 `checklistProntidao`

Classificacao:

- `NÃO IMPLEMENTAR AGORA`

Justificativa:

- tende a puxar a modelagem para JSON estruturado ou entidade nova;
- aumenta rapidamente a complexidade do `PATCH`, do frontend e dos testes;
- pode criar expectativa de workflow persistido antes de validar a primeira fase simples.

### 6.2 `prontidao operacional`

Classificacao:

- `DERIVADO, NÃO PERSISTIR`

Justificativa:

- pode continuar derivada da combinacao entre:
  - responsavel definido;
  - pendencias zeradas;
  - campos de preparacao preenchidos;
- nao precisa de campo proprio nesta etapa.

## 7. Tipo sugerido para cada campo

### Primeira implementacao

- `observacoesPlanejamento`
  - tipo sugerido: `string | null`

- `prioridadeOperacional`
  - tipo sugerido: enum/string controlada

- `necessidadeDocumentos`
  - tipo sugerido: `boolean | null`

- `necessidadeVisita`
  - tipo sugerido: `boolean | null`

- `necessidadeTerceiro`
  - tipo sugerido: `boolean | null`

### Segunda fase

- `previsaoInicialInicio`
  - tipo sugerido: `DateTime | null`

- `riscoOperacional`
  - tipo sugerido: enum/string controlada

### Nao implementar agora

- `checklistProntidao`
  - tipo sugerido futuro:
    - JSON controlado
    - ou estrutura separada
  - decisao adiada

## 8. Valores permitidos quando houver enum/label controlado

### `prioridadeOperacional`

Valores recomendados:

- `BAIXA`
- `MEDIA`
- `ALTA`
- `CRITICA`

Labels de exibicao:

- `Baixa`
- `Média`
- `Alta`
- `Crítica`

### `riscoOperacional`

Valores recomendados para fase posterior:

- `BAIXO`
- `MEDIO`
- `ALTO`

Labels de exibicao:

- `Baixo`
- `Médio`
- `Alto`

### `necessidadeDocumentos`

Valor persistido:

- `true`
- `false`
- `null`

Exibicao recomendada:

- `Sim`
- `Não`
- `A confirmar`

### `necessidadeVisita`

Valor persistido:

- `true`
- `false`
- `null`

Exibicao recomendada:

- `Sim`
- `Não`
- `A confirmar`

### `necessidadeTerceiro`

Valor persistido:

- `true`
- `false`
- `null`

Exibicao recomendada:

- `Sim`
- `Não`
- `A confirmar`

## 9. Se cada campo sera obrigatorio ou opcional

Recomendacao de obrigatoriedade:

- `observacoesPlanejamento`
  - opcional
  - motivo:
    - nem todo handoff precisa ter texto detalhado no primeiro momento.

- `prioridadeOperacional`
  - opcional
  - motivo:
    - alto valor, mas nao deve bloquear aceite nem a primeira persistencia.

- `necessidadeDocumentos`
  - opcional

- `necessidadeVisita`
  - opcional

- `necessidadeTerceiro`
  - opcional

- `previsaoInicialInicio`
  - opcional
  - fase posterior

- `riscoOperacional`
  - opcional
  - fase posterior

- `checklistProntidao`
  - nao entra agora

Decisao importante:

- nenhum campo novo deve ser obrigatorio para aceitar o handoff;
- nenhum campo novo deve ser obrigatorio para manter o item em `EM_PLANEJAMENTO`.

## 10. Impacto esperado no Prisma

Impacto esperado na primeira implementacao:

- adicao de colunas simples na tabela/modelo existente de handoff;
- sem criacao de entidade nova;
- sem criacao de relacao nova;
- sem modelagem JSON complexa.

Colunas provaveis da primeira fase:

- `observacoes_planejamento`
- `prioridade_operacional`
- `necessidade_documentos`
- `necessidade_visita`
- `necessidade_terceiro`

Colunas provaveis da segunda fase:

- `previsao_inicial_inicio`
- `risco_operacional`

Diretriz:

- manter a modelagem coesa dentro do handoff enquanto o escopo ainda e preparacao minima.

## 11. Impacto esperado em migration

Impacto esperado:

- migration simples de adicao de colunas;
- sem transformacao de dados complexa;
- sem backfill obrigatorio em primeira fase;
- campos iniciais podendo nascer como nulos.

Decisao recomendada:

- nao fazer migration com defaults artificiais para parecer que existe dado;
- preferir `null` onde a operacao ainda nao informou nada.

## 12. Impacto esperado nos schemas da API

Impacto esperado nos schemas:

- ampliar schema de detalhe do handoff;
- ampliar schema de atualizacao (`PATCH`);
- atualizar tipagem dos contratos compartilhados.

Campos da primeira fase que devem entrar no detalhe:

- `observacoesPlanejamento`
- `prioridadeOperacional`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`

Campos da primeira fase que devem entrar no `PATCH`:

- `observacoesPlanejamento`
- `prioridadeOperacional`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`

Diretriz:

- tudo opcional no `PATCH`;
- sem refinements que acoplem esses campos ao aceite operacional.

## 13. Impacto esperado no PATCH

Impacto esperado:

- ampliar o `PATCH` atual de forma incremental;
- permitir atualizar campos de preparacao junto ou separado dos campos operacionais existentes.

Diretriz recomendada:

- os novos campos devem seguir o mesmo principio do `PATCH` atual:
  - atualizacao parcial;
  - sem obrigatoriedade de envio conjunto;
  - sem alterar o fluxo homologado de aceite.

Risco a evitar:

- usar o `PATCH` novo para introduzir validacao que bloqueie `EM_PLANEJAMENTO`.

## 14. Impacto esperado no proxy web

Impacto esperado:

- proxy do detalhe deve repassar os novos campos saneados;
- proxy do `PATCH` deve aceitar e encaminhar os novos campos;
- nenhuma reabertura de metadados internos deve ocorrer.

Diretriz de saneamento:

- os novos campos devem ser estritamente operacionais e legiveis;
- nenhum novo ID tecnico deve aparecer por causa da persistencia.

## 15. Impacto esperado no frontend

Impacto esperado:

- substituir placeholders por inputs reais apenas para os campos aprovados na primeira fase;
- manter `previsaoInicialInicio`, `riscoOperacional` e `checklistProntidao` fora da primeira entrega;
- atualizar os blocos:
  - `Preparação operacional inicial`
  - `Prontidão operacional`
  - `Responsabilidade e coordenação`

Diretriz de UX:

- inputs reais apenas quando houver persistencia real;
- `A definir` e `A confirmar` continuam onde o campo ainda nao entrou;
- a tela deve continuar comunicando preparacao, nao execucao.

## 16. Impacto esperado nos testes

Impacto esperado:

- ampliar testes de schema e rotas do handoff;
- adicionar cobertura para:
  - persistencia dos novos campos;
  - releitura apos `GET`;
  - manutencao do aceite da Onda 3.4;
  - manutencao da ausencia de regressao visual da Onda 3.5.

Casos minimos recomendados:

- `PATCH` com `observacoesPlanejamento`;
- `PATCH` com `prioridadeOperacional`;
- `PATCH` com flags de necessidade;
- `GET` retornando campos persistidos;
- aceite operacional continuando valido sem exigir esses campos;
- runtime do detalhe sem novos UUIDs ou labels tecnicos.

## 17. Riscos de modelagem

Riscos principais:

- persistir campo demais de uma vez;
- confundir risco operacional com risco comercial/regulatorio;
- tratar `previsaoInicialInicio` como agenda de execucao;
- usar `checklistProntidao` cedo demais e empurrar JSON complexo;
- duplicar a funcao de `observacoesOperacionais` e `observacoesPlanejamento` sem clareza de uso;
- acoplar novos campos ao aceite.

Mitigacao recomendada:

- primeira fase curta e escalar;
- segunda fase apenas apos validar uso real;
- checklist fica adiado.

## 18. Criterios de aceite da futura implementacao

Para a futura implementacao ser aceita, deve cumprir:

- persistir apenas os campos aprovados da primeira fase;
- nao alterar a regra de aceite da Onda 3.4;
- nao reabrir a sanitizacao visual da Onda 3.5;
- nao criar OS, contrato, financeiro ou CRM;
- manter `EM_PLANEJAMENTO` como organizacao pre-execucao;
- exibir os novos campos de forma amigavel na UI;
- passar build, TypeScript e testes de handoff;
- confirmar persistencia apos reload.

## 19. Checklist tecnico da proxima subonda

Checklist recomendado para a proxima subonda de implementacao:

- definir nomes finais de colunas e tipos no Prisma;
- gerar migration simples de adicao de colunas;
- atualizar schema de detalhe;
- atualizar schema de `PATCH`;
- atualizar service de handoff;
- atualizar proxy web de detalhe e `PATCH`;
- atualizar tipos compartilhados do frontend;
- substituir placeholders pelos campos reais da primeira fase;
- manter os campos de segunda fase como placeholder;
- validar `GET`, `PATCH`, reload e runtime;
- executar:
  - `./node_modules/.bin/next build`
  - `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
  - `./node_modules/.bin/vitest run src/modules/operacao/__tests__/handoffs.routes.test.ts`

## 20. Conclusao

A decisao tecnica recomendada para a Onda 3.7.1 e iniciar a persistencia da preparacao operacional com uma primeira fase curta, escalar e controlada.

Decisao final recomendada:

- entram agora:
  - `observacoesPlanejamento`
  - `prioridadeOperacional`
  - `necessidadeDocumentos`
  - `necessidadeVisita`
  - `necessidadeTerceiro`

- ficam para segunda fase:
  - `previsaoInicialInicio`
  - `riscoOperacional`

- nao entram agora:
  - `checklistProntidao`

- continuam derivados:
  - `prontidao operacional`

Conclusao semantica final:

- a persistencia deve fortalecer a preparacao operacional;
- nao deve alterar o aceite;
- nao deve reabrir a sanitizacao;
- `EM_PLANEJAMENTO` continua sendo handoff aceito e em organizacao pre-execucao, nao execucao.
