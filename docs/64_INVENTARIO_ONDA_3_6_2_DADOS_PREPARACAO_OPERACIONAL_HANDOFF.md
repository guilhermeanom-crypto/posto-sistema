# 64. Inventario da Onda 3.6.2 - Dados Existentes para Preparacao Operacional do Handoff

## 1. Objetivo do inventario

Mapear, com base no detalhe atual do handoff, quais dados necessarios para a futura UI de preparacao operacional:

- ja existem no payload atual consumido pelo frontend;
- ja existem apenas como campo operacional reaproveitavel;
- podem ser derivados no frontend sem alterar backend;
- nao existem e devem permanecer como placeholder ou futuro;
- nao devem ser implementados agora.

O foco deste inventario e apoiar uma implementacao visual controlada da Onda 3.6, sem reabrir a regra de aceite da Onda 3.4, sem reabrir a sanitizacao visual da Onda 3.5 e sem criar persistencia ficticia.

## 2. Arquivos auditados

Arquivos auditados nesta etapa:

- `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`
- `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`
- `apps/api/src/modules/operacao/handoffs.routes.ts`
- `apps/api/src/modules/operacao/handoffs.service.ts`
- `apps/api/src/modules/operacao/handoffs.schemas.ts`

Leitura consolidada da auditoria:

- o frontend consome um payload saneado via proxy web;
- o proxy do web remove campos internos como `tenantId`, `criadoPorId` e `origemSnapshotSaneado` da resposta entregue ao detalhe;
- o backend ainda possui esses campos no detalhe interno e no schema da API;
- o `PATCH` atual permite persistir apenas:
  - `status`
  - `responsavelOperacionalId`
  - `pendenciasOperacionais`
  - `observacoesOperacionais`

## 3. Dados ja disponiveis no payload atual

Dados efetivamente disponiveis hoje no payload saneado do detalhe consumido pelo frontend:

- `id`
- `propostaComercialId`
- `leadWhatsAppId`
- `empreendimentoId`
- `responsavelComercialId`
- `responsavelOperacionalId`
- `status`
- `statusPropostaOrigem`
- `origemProposta`
- `numeroProposta`
- `nomeLead`
- `empresaLead`
- `documentoLead`
- `emailContato`
- `telefoneContato`
- `municipio`
- `uf`
- `dataAprovacaoProposta`
- `dataValidadeProposta`
- `cnaePrincipalCodigo`
- `cnaePrincipalDescricao`
- `riscoNivel`
- `riscoScore`
- `potencialPoluidor`
- `licenciamentoTipo`
- `orgaoCompetente`
- `esfera`
- `alertasResumo`
- `proximosPassosResumo`
- `observacoesLiberadas`
- `servicosResumo`
- `pendenciasOperacionais`
- `observacoesOperacionais`
- `assumidoEm`
- `concluidoEm`
- `canceladoEm`
- `criadoEm`
- `atualizadoEm`

Leitura pratica para a Onda 3.6:

- existe base suficiente para comunicar contexto do handoff;
- existe base suficiente para reforcar aceite concluido;
- existe base parcial para um bloco inicial de preparacao;
- nao existe base completa para uma preparacao operacional persistida como dominio proprio.

## 4. Dados disponiveis apenas como campo operacional existente

Campos que ja existem hoje e podem sustentar parte da preparacao operacional, mas sem representarem um modelo novo de planejamento:

- `status`
  - pode sustentar o marco visual de aceite concluido em `EM_PLANEJAMENTO`
  - classificacao: `EXISTE NO PAYLOAD ATUAL`

- `responsavelOperacionalId`
  - existe como referencia e a tela atual resolve nome via `/api/usuarios`
  - classificacao: `EXISTE MAS PRECISA DE LABEL/FALLBACK`

- `pendenciasOperacionais`
  - pode funcionar como lista de impeditivos internos e pendencias abertas
  - classificacao: `EXISTE NO PAYLOAD ATUAL`

- `observacoesOperacionais`
  - pode funcionar como observacoes de planejamento de forma provisoria
  - classificacao: `EXISTE NO PAYLOAD ATUAL`

- `assumidoEm`
  - pode funcionar como marco temporal do aceite e da assuncao
  - classificacao: `EXISTE NO PAYLOAD ATUAL`

- `alertasResumo`
  - pode apoiar leitura de risco e atencao, mas vem do diagnostico/origem, nao da preparacao operacional
  - classificacao: `EXISTE NO PAYLOAD ATUAL`

- `proximosPassosResumo`
  - pode apoiar um bloco de orientacao, mas hoje representa resumo vindo da origem comercial/diagnostica
  - classificacao: `EXISTE NO PAYLOAD ATUAL`

- `servicosResumo`
  - pode contextualizar o que foi aprovado e o escopo base do planejamento
  - classificacao: `EXISTE NO PAYLOAD ATUAL`

## 5. Dados que podem ser derivados sem alterar backend

Itens da proposta de UI que podem nascer por derivacao de frontend, sem alterar payload nem backend:

- `Aceite operacional concluido`
  - derivado de `status === EM_PLANEJAMENTO`
  - classificacao: `PODE SER DERIVADO NO FRONTEND`

- `pendencias bloqueantes resolvidas`
  - derivado de `pendenciasOperacionais.length === 0`
  - classificacao: `PODE SER DERIVADO NO FRONTEND`

- `responsavel operacional definido`
  - derivado da presenca de `responsavelOperacionalId`
  - nome continua dependendo do lookup de usuarios
  - classificacao: `PODE SER DERIVADO NO FRONTEND`

- `marco de assuncao`
  - derivado de `assumidoEm`
  - classificacao: `PODE SER DERIVADO NO FRONTEND`

- `risco-base para planejamento`
  - pode ser comunicado a partir de `riscoNivel`, `riscoScore`, `potencialPoluidor`, `alertasResumo`
  - nao equivale a risco operacional formal
  - classificacao: `PODE SER DERIVADO NO FRONTEND`

- `proximos passos iniciais`
  - pode reaproveitar `proximosPassosResumo`
  - exige texto explicito de que se trata de referencia herdada, nao checklist operacional persistido
  - classificacao: `PODE SER DERIVADO NO FRONTEND`

- `prontidao parcial`
  - pode ser exibida apenas como leitura de contexto, por exemplo:
  - responsavel definido
  - pendencias zeradas
  - observacoes existentes
  - proximos passos disponiveis
  - nao pode parecer workflow persistido
  - classificacao: `PODE SER DERIVADO NO FRONTEND`

## 6. Dados que nao existem e devem ficar como placeholder/futuro

Itens da proposta de UI que hoje nao possuem campo dedicado no payload atual:

- prioridade operacional
  - classificacao: `NAO EXISTE / FUTURO`

- previsao inicial de inicio
  - classificacao: `NAO EXISTE / FUTURO`

- necessidade de documentos
  - classificacao: `NAO EXISTE / FUTURO`

- necessidade de visita
  - classificacao: `NAO EXISTE / FUTURO`

- necessidade de terceiro
  - classificacao: `NAO EXISTE / FUTURO`

- risco operacional propriamente dito
  - distinto do risco comercial/regulatorio hoje existente
  - classificacao: `NAO EXISTE / FUTURO`

- coordenacao de apoio
  - classificacao: `NAO EXISTE / FUTURO`

- checklist operacional de prontidao persistido
  - classificacao: `NAO EXISTE / FUTURO`

- observacoes de planejamento separadas de `observacoesOperacionais`
  - classificacao: `NAO EXISTE / FUTURO`

- trilha especifica de preparacao operacional
  - classificacao: `NAO EXISTE / FUTURO`

Tambem nao existe hoje qualquer persistencia para:

- separar `observacao de aceite` de `observacao de planejamento`;
- armazenar prontidao operacional item a item;
- registrar dependencias internas estruturadas;
- marcar que existe visita, terceiro ou documentacao complementar como flags formais.

## 7. Quais blocos da UI podem ser implementados agora

Blocos que ja podem ser implementados visualmente com o payload atual, desde que em escopo minimo:

- `Aceite operacional concluido`
  - classificacao predominante: `PODE SER DERIVADO NO FRONTEND`
  - base atual:
    - `status`
    - `assumidoEm`
    - `responsavelOperacionalId`
    - `pendenciasOperacionais`
    - `observacoesOperacionais`

- `Responsabilidade e coordenacao`
  - classificacao predominante: `EXISTE MAS PRECISA DE LABEL/FALLBACK`
  - base atual:
    - `responsavelOperacionalId`
    - lookup de usuarios
    - `observacoesOperacionais`
    - `pendenciasOperacionais`

- `Proximos passos`
  - classificacao predominante: `PODE SER DERIVADO NO FRONTEND`
  - base atual:
    - `proximosPassosResumo`
    - eventualmente `pendenciasOperacionais`
  - limitacao:
    - nao representa passos definidos pela operacao apos o aceite

- `Preparacao operacional` em versao minima
  - classificacao predominante: `EXISTE NO PAYLOAD ATUAL`
  - base atual:
    - `observacoesOperacionais`
    - `pendenciasOperacionais`
    - `servicosResumo`
    - `alertasResumo`
    - `riscoNivel`
    - `potencialPoluidor`
  - observacao:
    - deve ser apresentada como organizacao inicial, nao como formulario completo de planejamento

## 8. Quais blocos devem ser apenas informativos

Blocos que, nesta fase, devem ser apenas informativos ou conceituais:

- `Prontidao operacional`
  - classificacao predominante: `PODE SER DERIVADO NO FRONTEND`
  - motivo:
    - nao ha checklist persistido
    - nao ha flags formais de visita, terceiro, documentos ou previsao

- `Preparacao operacional` completa
  - classificacao predominante: `NAO EXISTE / FUTURO`
  - motivo:
    - nao ha campos dedicados para prioridade, previsao, necessidade de visita, terceiro ou documentos

- `Futura OS`
  - classificacao: `NAO IMPLEMENTAR AGORA`
  - motivo:
    - a onda atual nao cria OS nem deve sugerir acao operacional formal

- `Futura execucao`
  - classificacao: `NAO IMPLEMENTAR AGORA`
  - motivo:
    - deve permanecer separada de `EM_PLANEJAMENTO`

## 9. Quais campos nao devem ser editaveis ainda

Campos que nao devem ganhar edicao nesta fase, porque nao existe persistencia formal para isso:

- prioridade operacional
  - classificacao: `NAO IMPLEMENTAR AGORA`

- previsao inicial de inicio
  - classificacao: `NAO IMPLEMENTAR AGORA`

- necessidade de documentos
  - classificacao: `NAO IMPLEMENTAR AGORA`

- necessidade de visita
  - classificacao: `NAO IMPLEMENTAR AGORA`

- necessidade de terceiro
  - classificacao: `NAO IMPLEMENTAR AGORA`

- risco operacional
  - classificacao: `NAO IMPLEMENTAR AGORA`

- coordenacao de apoio
  - classificacao: `NAO IMPLEMENTAR AGORA`

- checklist de prontidao
  - classificacao: `NAO IMPLEMENTAR AGORA`

Mesmo dentro do bloco operacional atual, a persistencia homologada continua restrita a:

- `status`
- `responsavelOperacionalId`
- `pendenciasOperacionais`
- `observacoesOperacionais`

## 10. Riscos de usar campo inexistente

Riscos principais se a UI usar como se existisse um dado que ainda nao existe:

- parecer que a operacao pode registrar prioridade quando nao ha persistencia;
- parecer que existe previsao de inicio controlada pelo sistema;
- parecer que necessidade de visita ou terceiro ja e um dado formal do handoff;
- parecer que risco operacional ja foi modelado, quando hoje so existe contexto comercial/regulatorio;
- induzir usuario a confiar em informacao que sera perdida em reload;
- abrir expectativa de filtro, auditoria ou integracao futura sobre campos que ainda nao existem.

Risco semantico adicional:

- transformar `EM_PLANEJAMENTO` em uma pseudo-execucao por excesso de informacao que o sistema ainda nao suporta.

## 11. Riscos de parecer que existe persistencia onde nao existe

Este e o risco mais critico da futura implementacao visual.

Se a tela exibir controles como se fossem salvos, mas sem backend correspondente, pode acontecer:

- falsa sensacao de conclusao da preparacao;
- perda silenciosa de dados digitados;
- divergencia entre o que o usuario viu e o que realmente ficou salvo;
- erro de governanca operacional;
- confusao entre dados herdados do payload e dados criados pela operacao.

Risco tecnico objetivo identificado na auditoria:

- o `PATCH` atual nao aceita campos de preparacao operacional alem dos quatro ja homologados;
- qualquer UI que sugira edicao adicional sem nova definicao contratual criara comportamento enganoso.

## 12. Recomendacao para implementacao visual minima

Recomendacao de implementacao minima para uma proxima etapa visual:

- criar o bloco `Aceite operacional concluido` com base em `status`, `assumidoEm` e ausencia de pendencias bloqueantes;
- reorganizar o bloco operacional atual para funcionar como `Preparacao operacional inicial`;
- reaproveitar `observacoesOperacionais` como area de contexto de planejamento, sem renomear semanticamente para um campo novo persistido;
- exibir `proximosPassosResumo` como referencia herdada do handoff, deixando claro que sao passos orientativos, nao checklist operacional salvo;
- exibir um bloco simples de `Prontidao operacional` apenas como leitura derivada e nao editavel;
- manter qualquer informacao inexistente como `A definir` ou `Nao informado`, sem input editavel.

Resumo de governanca:

- a UI pode evoluir em organizacao e narrativa;
- a persistencia deve continuar exatamente no limite atual.

## 13. Recomendacao para implementacao futura com persistencia

Se houver uma onda futura focada em persistencia de preparacao operacional, a recomendacao e separar isso em etapa propria e controlada, com:

- definicao de contrato de API especifico para preparacao operacional;
- decisao clara sobre quais campos passam a existir formalmente;
- definicao de fallback e labels de exibicao;
- estrategia de auditoria;
- validacao de semantica para nao confundir preparacao com execucao;
- revisao de impactos sobre filtro, detalhe, historico e governanca operacional.

Campos com maior potencial para uma futura persistencia dedicada:

- prioridade operacional;
- previsao inicial de inicio;
- necessidade de documentos;
- necessidade de visita;
- necessidade de terceiro;
- risco operacional;
- observacoes de planejamento separadas de observacoes operacionais gerais;
- checklist de prontidao.

## 14. Conclusao

O inventario mostra que o sistema ja possui base suficiente para uma melhoria visual controlada da etapa pos-aceite, mas ainda nao possui um modelo persistido de preparacao operacional.

Conclusoes objetivas:

- `Aceite operacional concluido` pode ser implementado agora com seguranca;
- `Preparacao operacional` pode existir em versao minima, reaproveitando os campos operacionais homologados;
- `Prontidao operacional` pode existir apenas como leitura derivada e informativa;
- prioridade, previsao, visita, terceiro, documentos e risco operacional ainda sao `NAO EXISTE / FUTURO`;
- qualquer tentativa de tornalos editaveis agora cairia no risco de simular persistencia inexistente.

Diretriz final recomendada:

- implementar primeiro uma camada visual minima, clara e honesta sobre o que o sistema ja sabe;
- deixar persistencia nova para uma onda posterior, sem misturar planejamento documental com ampliacao de contrato.
