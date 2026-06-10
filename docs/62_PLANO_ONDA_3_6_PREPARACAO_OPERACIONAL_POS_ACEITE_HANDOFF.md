# 62. Plano da Onda 3.6 - Preparacao Operacional Pos-Aceite do Handoff

## 1. Objetivo

Planejar a etapa de preparacao operacional pos-aceite do handoff, definindo o que a operacao deve enxergar, organizar e preencher quando o handoff ja estiver em `EM_PLANEJAMENTO`, sem ainda:

- criar ordem de servico;
- criar contrato;
- acionar financeiro;
- acionar CRM;
- iniciar execucao formal.

O objetivo da Onda 3.6 e transformar `EM_PLANEJAMENTO` em uma etapa visual e operacionalmente clara de organizacao pre-execucao, preservando integralmente a regra de aceite homologada na Onda 3.4.

## 2. Contexto herdado das Ondas 3.3, 3.4 e 3.5

### 2.1 O que vem da Onda 3.3

A Onda 3.3 estruturou a base do modulo de handoffs, deixando:

- listagem operacional em `/operacao/handoffs`;
- detalhe operacional em `/operacao/handoffs/[id]`;
- atualizacao operacional controlada;
- persistencia validada dos campos operacionais principais.

### 2.2 O que vem da Onda 3.4

A Onda 3.4 consolidou o aceite operacional, validando que:

- `EM_PLANEJAMENTO` representa handoff aceito pela operacao;
- o aceite exige `responsavelOperacionalId`;
- o aceite bloqueia com `pendenciasOperacionais` em aberto;
- o aceite persiste apos reload;
- nao ha acionamento de contrato, OS, financeiro ou CRM.

### 2.3 O que vem da Onda 3.5

A Onda 3.5 refinou a UX do modulo, deixando:

- remocao visual de UUIDs e IDs internos da leitura padrao;
- enums tecnicos convertidos para labels mais amigaveis;
- leitura operacional mais clara na listagem e no detalhe;
- preservacao do payload atual dos proxies, sem limpeza estrutural do contrato.

## 3. Problema operacional atual

Hoje o sistema ja diferencia corretamente:

- handoff recebido;
- handoff em triagem;
- handoff aguardando documentos;
- handoff aceito e movido para `EM_PLANEJAMENTO`.

O problema atual e que, apos o aceite:

- o modulo ainda nao comunica claramente o que significa preparar a execucao;
- nao existe area dedicada para organizar o planejamento operacional pos-aceite;
- aceite operacional e preparacao operacional ainda podem parecer a mesma coisa na leitura da tela;
- faltam blocos visuais que orientem prioridades, proximos passos, previsoes e necessidades internas antes da futura OS ou execucao.

Em resumo:

- a operacao ja consegue aceitar;
- mas ainda nao tem, na UI, uma camada bem definida para organizar o que acontece depois do aceite e antes da execucao formal.

## 4. Diferenca entre aceite e preparacao

Separacao conceitual obrigatoria para a Onda 3.6:

- `aceite operacional`
  - confirma que a operacao assumiu o handoff;
  - exige responsavel definido;
  - exige ausencia de pendencias bloqueantes;
  - continua sendo representado pela transicao para `EM_PLANEJAMENTO`.

- `preparacao operacional`
  - acontece depois do aceite;
  - organiza como a execucao futura devera ser planejada;
  - registra prioridades, previsoes, necessidades e observacoes internas;
  - nao cria dominio novo nem dispara automacao.

- `futura geracao de OS`
  - permanece fora de escopo nesta onda;
  - deve ser tratada como desdobramento posterior, nao como parte da preparacao visual inicial.

- `futura execucao`
  - continua separada de `EM_PLANEJAMENTO`;
  - nao deve ser comunicada como iniciada enquanto o handoff estiver apenas em preparacao.

## 5. Escopo permitido

Fica permitido nesta onda:

- analisar o estado atual do detalhe do handoff quando estiver em `EM_PLANEJAMENTO`;
- propor uma area dedicada de `Preparação operacional`;
- definir o que a operacao deve enxergar e organizar nessa etapa;
- separar claramente aceite, preparacao, futura OS e futura execucao;
- propor blocos visuais, cards, secoes, indicadores e campos candidatos para orientar o planejamento;
- manter toda a onda no nivel de planejamento e documentacao, sem implementacao de codigo.

Tambem fica permitido:

- sugerir reutilizacao de campos operacionais ja existentes quando fizer sentido;
- propor campos candidatos futuros, desde que sem alterar modelo, Prisma ou entidade nesta etapa;
- registrar riscos de semantica, UX e dominio para a fase de implementacao futura.

## 6. Escopo proibido

Fica proibido nesta onda:

- alterar Prisma;
- criar migration;
- criar entidade;
- criar status novo;
- criar OS;
- criar contrato;
- acionar financeiro;
- acionar CRM;
- alterar a regra de aceite da Onda 3.4;
- reabrir o escopo da Onda 3.5;
- implementar codigo nesta etapa.

Tambem fica proibido:

- transformar a preparacao em execucao formal;
- tratar `EM_PLANEJAMENTO` como sinônimo de execucao iniciada;
- antecipar automacoes de processo, tarefa, contrato ou faturamento.

## 7. Telas afetadas

Telas impactadas em planejamento:

- `/operacao/handoffs/[id]`

Tela possivelmente afetada em leitura futura, mas nao como foco principal desta onda:

- `/operacao/handoffs`

Foco esperado por tela:

- detalhe:
  - principal area de trabalho da preparacao operacional;
  - concentracao dos blocos de planejamento pos-aceite;
  - diferenciacao visual clara entre aceite concluido e preparacao em andamento.

- listagem:
  - pode receber indicacoes futuras de que o item esta em preparacao;
  - nao e o foco central da definicao desta onda.

## 8. Proposta de blocos visuais

Blocos visuais candidatos para o detalhe do handoff em `EM_PLANEJAMENTO`:

### 8.1 Bloco de marco do aceite

Objetivo:

- deixar explicito que o aceite operacional ja ocorreu;
- evitar que a nova area de preparacao confunda o usuario sobre o estado atual.

Conteudo esperado:

- status atual;
- mensagem de aceite concluido;
- marco temporal de assuncao e preparacao.

### 8.2 Bloco de preparacao operacional

Objetivo:

- concentrar os itens que a operacao precisa organizar antes da futura execucao.

Conteudo esperado:

- prioridade operacional;
- previsao de inicio;
- observacoes de planejamento;
- resumo das necessidades internas.

### 8.3 Bloco de proximos passos

Objetivo:

- orientar a equipe sobre a sequencia de preparacao;
- diferenciar claramente planejamento de execucao.

Conteudo esperado:

- lista de proximos passos internos;
- itens de verificacao pre-execucao;
- dependencias ainda em acompanhamento.

### 8.4 Bloco de prontidao operacional

Objetivo:

- indicar se o handoff esta apenas aceito ou se ja esta minimamente preparado para virar etapa futura.

Conteudo esperado:

- necessidade de documentos;
- necessidade de visita;
- necessidade de terceiro;
- risco operacional;
- possiveis bloqueios internos nao equivalentes ao bloqueio de aceite.

### 8.5 Bloco de responsabilidade e coordenacao

Objetivo:

- reforcar ownership operacional apos o aceite;
- deixar claro quem esta conduzindo a preparacao.

Conteudo esperado:

- responsavel operacional;
- area de apoio ou dependencia externa, quando houver;
- observacoes de coordenacao.

## 9. Campos candidatos

Campos candidatos para planejamento futuro da UI e/ou contrato operacional, sem implementacao nesta etapa:

- `proximosPassosPlanejamento`
- `prioridadeOperacional`
- `responsavelOperacional`
- `pendenciasInternasPlanejamento`
- `observacoesPlanejamento`
- `previsaoInicio`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`
- `riscoOperacional`

Leitura recomendada desses campos:

- `proximosPassosPlanejamento`
  - orienta sequencia operacional imediata;

- `prioridadeOperacional`
  - ajuda ordenacao interna da preparacao;

- `responsavelOperacional`
  - continua como ownership principal, sem mudar a regra da 3.4;

- `pendenciasInternasPlanejamento`
  - nao devem ser confundidas com pendencias bloqueantes de aceite;

- `observacoesPlanejamento`
  - registram combinados, premissas e cuidados pre-execucao;

- `previsaoInicio`
  - comunica expectativa operacional, nao inicio formal de execucao;

- `necessidadeDocumentos`
  - sinaliza se ha coleta complementar para preparacao;

- `necessidadeVisita`
  - sinaliza deslocamento ou validacao presencial futura;

- `necessidadeTerceiro`
  - sinaliza dependencia de parceiro, fornecedor ou suporte externo;

- `riscoOperacional`
  - comunica criticidade de preparacao, nao risco comercial ou juridico bruto.

## 10. Riscos

Riscos principais desta onda de planejamento:

- confundir aceite operacional com preparacao operacional;
- sugerir inicio de execucao cedo demais na comunicacao visual;
- propor campos demais e transformar a tela em formulario excessivo;
- reintroduzir dependencias de dominio que ainda nao devem existir;
- misturar pendencia de aceite com pendencia de planejamento interno;
- criar expectativa de OS, contrato ou execucao automatica sem suporte funcional.

Mitigacoes esperadas:

- manter separacao semantica estrita entre aceite e preparacao;
- tratar a Onda 3.6 inicialmente como organizacao visual e documental;
- priorizar blocos claros e poucos campos de alto valor operacional;
- deixar tudo que seja automacao, objeto formal ou integracao para ondas futuras.

## 11. Criterios de aceite

A Onda 3.6 estara bem planejada quando:

1. houver separacao clara entre aceite operacional e preparacao operacional;
2. estiver claro que `EM_PLANEJAMENTO` continua sendo estado pos-aceite, nao execucao iniciada;
3. a proposta de blocos visuais orientar o que a operacao precisa preparar apos o aceite;
4. os campos candidatos estiverem descritos com finalidade operacional clara;
5. o plano nao abrir entidade, status, Prisma, OS, contrato, financeiro ou CRM;
6. a continuidade da regra da Onda 3.4 estiver explicitamente preservada;
7. ficar definido o que pertence a esta onda e o que deve ficar para onda futura.

## 12. Checklist de validacao

Checklist de planejamento para a futura implementacao:

- revisar o detalhe atual do handoff em `EM_PLANEJAMENTO`;
- verificar se a tela atual diferencia aceite de preparacao;
- validar se os blocos propostos cobrem organizacao pos-aceite;
- validar se os campos candidatos ajudam planejamento e nao execucao formal;
- garantir que a proposta nao comunica OS criada;
- garantir que a proposta nao comunica contrato criado;
- garantir que a proposta nao comunica financeiro iniciado;
- garantir que a proposta nao comunica CRM acionado;
- garantir que a proposta nao altera a regra de aceite da Onda 3.4;
- garantir que a proposta continua separando:
  - aceite operacional;
  - preparacao operacional;
  - futura OS;
  - futura execucao.

## 13. O que deve ficar para uma onda futura

Devem ficar para onda futura:

- qualquer implementacao real de campos novos no backend ou banco;
- qualquer alteracao de contrato dos proxies para persistir dados de preparacao;
- qualquer criacao de OS;
- qualquer criacao de contrato;
- qualquer integracao com financeiro;
- qualquer integracao com CRM;
- qualquer automacao de onboarding, processo ou tarefa vinculada a preparacao;
- qualquer decisao sobre inicio formal de execucao.

Tambem deve ficar para onda futura:

- a decisao de quais campos realmente viram dados persistidos;
- a decisao de como medir prontidao operacional para futura OS ou execucao.

## 14. Conclusao

A Onda 3.6 deve funcionar como a etapa de planejamento da preparacao operacional pos-aceite, sem reabrir o que ja foi validado nas Ondas 3.4 e 3.5.

Resultado esperado deste plano:

- consolidar que `EM_PLANEJAMENTO` e uma fase de organizacao operacional, nao de execucao;
- orientar uma futura implementacao de UI com blocos e campos de alto valor operacional;
- manter o modulo de handoffs evoluindo de forma segura, gradual e sem antecipar dominios que ainda estao fora de escopo.

Nesta etapa, a entrega correta e exclusivamente documental.
