# 55. Onda 3.4.3 - Planejamento de UI do Aceite Operacional

## 1. Objetivo da Onda 3.4.3

Planejar a evolucao da UI da tela `/operacao/handoffs/[id]` para comunicar e suportar o aceite operacional do handoff, usando exclusivamente:

- a entidade `HandoffComercial` ja existente;
- os campos operacionais ja disponiveis;
- a maquina de status atual.

Esta etapa nao implementa codigo. O objetivo e transformar o contrato tecnico da Onda 3.4.2 em comportamento visual claro, consistente e orientado ao fluxo operacional.

## 2. Premissas de UI herdadas da Onda 3.3

Premissas ja consolidadas na UI:

- existe tela de listagem em `/operacao/handoffs`;
- existe tela de detalhe em `/operacao/handoffs/[id]`;
- existe formulario operacional de atualizacao;
- a UI ja edita:
  - `status`
  - `responsavelOperacionalId`
  - `pendenciasOperacionais`
  - `observacoesOperacionais`
- a UI ja respeita leitura saneada do handoff;
- a UI ja nao expõe snapshots brutos, `metadata`, `inputSnapshot`, `resultadoSnapshot` ou `snapshotCatalogo`;
- a UI ja reflete permissao visual coerente com o backend.

Premissa estrutural da 3.4.3:

- o aceite operacional deve ser resolvido dentro da tela ja existente de detalhe do handoff, sem criar rota nova, entidade nova ou status novo.

## 3. Comportamento visual esperado por status

### 3.1 `AGUARDANDO_HANDOFF`

Leitura visual:

- handoff recebido;
- triagem ainda nao iniciada;
- aceite operacional ainda inexistente.

Comunicacao recomendada:

- badge principal com status de recebimento;
- bloco de orientacao informando que o proximo passo esperado e iniciar triagem operacional.

Tom visual:

- neutro;
- sem mensagem de prontidao;
- sem linguagem de aceite.

### 3.2 `EM_TRIAGEM_OPERACIONAL`

Leitura visual:

- handoff em avaliacao;
- operacao revisando escopo, contexto e completude minima.

Comunicacao recomendada:

- destaque de que o item esta em analise;
- orientacao para revisar responsavel, pendencias e observacoes antes de aceitar.

Tom visual:

- ativo;
- de trabalho em andamento;
- sem indicar bloqueio definitivo.

### 3.3 `AGUARDANDO_DOCUMENTOS`

Leitura visual:

- handoff bloqueado por falta de documento, dado ou insumo.

Comunicacao recomendada:

- alerta claro de bloqueio;
- orientacao para resolver ou remover pendencias antes de aceitar.

Tom visual:

- atencao/bloqueio;
- sem transmitir que o handoff esta pronto.

### 3.4 `EM_PLANEJAMENTO`

Leitura visual:

- handoff aceito operacionalmente;
- preparacao para execucao em andamento.

Comunicacao recomendada:

- mensagem explicita de aceite operacional concluido;
- reforco de que a execucao ainda nao comecou.

Tom visual:

- positivo, mas nao final;
- pronto para preparacao, nao para encerramento.

### 3.5 `EM_EXECUCAO`

Leitura visual:

- aceite operacional ja ocorreu em etapa anterior;
- handoff saiu da preparacao e entrou em execucao.

Comunicacao recomendada:

- informar que a fase de aceite ja foi superada;
- remover qualquer linguagem que sugira aceite pendente.

### 3.6 `PAUSADO`

Leitura visual:

- handoff/execucao interrompido temporariamente;
- pode demandar retorno para planejamento ou triagem conforme caso.

Comunicacao recomendada:

- alertar que o fluxo foi interrompido;
- manter visiveis responsavel, pendencias e observacoes para contexto.

### 3.7 `CANCELADO`

Leitura visual:

- fluxo encerrado sem continuidade.

Comunicacao recomendada:

- destacar que o handoff nao seguira para preparacao ou execucao;
- desabilitar linguagem e acoes de aceite.

### 3.8 `CONCLUIDO`

Leitura visual:

- fluxo encerrado com conclusao final.

Comunicacao recomendada:

- destacar encerramento;
- remover qualquer orientacao de aceite ou preparacao.

## 4. Como a UI deve comunicar o aceite operacional

O aceite operacional deve ser comunicado como marco de fluxo, nao como entidade separada.

Forma recomendada:

- usar o proprio contexto do status e da secao operacional;
- quando o handoff estiver apto a seguir para `EM_PLANEJAMENTO`, a UI deve explicar que essa acao representa o aceite operacional;
- quando o handoff ja estiver em `EM_PLANEJAMENTO`, a UI deve exibir mensagem clara de que o aceite foi realizado com sucesso.

Texto funcional recomendado:

- antes do aceite:
  - `Avançar para preparação confirma o aceite operacional deste handoff.`

- depois do aceite:
  - `Este handoff já foi aceito pela operação e está em preparação para execução.`

## 5. Como a UI deve bloquear ou orientar a passagem para `EM_PLANEJAMENTO` quando faltar responsável operacional

Regra visual:

- se `responsavelOperacionalId` estiver vazio, a UI nao deve tratar `EM_PLANEJAMENTO` como acao pronta.

Comportamento recomendado:

- destacar o campo de responsavel operacional;
- exibir mensagem objetiva de precondicao nao atendida;
- manter a acao de aceite desabilitada ou claramente bloqueada.

Mensagem recomendada:

- `Defina um responsável operacional antes de aceitar este handoff.`

## 6. Como a UI deve bloquear ou orientar a passagem para `EM_PLANEJAMENTO` quando houver pendências operacionais

Regra visual:

- se `pendenciasOperacionais` nao estiver vazio, a UI nao deve permitir leitura de aceite pronto.

Comportamento recomendado:

- evidenciar a lista de pendencias como bloqueio;
- orientar o usuario a resolver ou limpar as pendencias antes de avancar;
- manter a acao de aceite desabilitada ou com bloqueio claro.

Mensagem recomendada:

- `Resolva ou remova as pendências operacionais antes de avançar para preparação.`

## 7. Como exibir pendências, observações e responsável operacional

### 7.1 Responsavel operacional

Exibicao recomendada:

- manter o campo em posicao destacada dentro da secao operacional;
- reforcar que ele representa ownership do handoff;
- quando vazio, mostrar estado explicito de nao definido.

### 7.2 Pendencias operacionais

Exibicao recomendada:

- apresentar como lista clara e separada;
- tratar pendencias visiveis como bloqueio por padrao na etapa pre-aceite;
- quando vazio, comunicar que nao ha pendencias operacionais registradas.

### 7.3 Observacoes operacionais

Exibicao recomendada:

- exibir como bloco de contexto;
- comunicar que o campo serve para premissas, combinados e racional operacional;
- nao misturar visualmente observacao com pendencia.

Separacao semantica obrigatoria:

- pendencia = impedimento;
- observacao = contexto.

## 8. Quais ações devem aparecer para cada perfil

### 8.1 `EXECUTIVO`

Acoes visiveis:

- leitura do detalhe;
- leitura do status;
- leitura do responsavel, pendencias e observacoes.

Acoes nao recomendadas:

- aceite operacional;
- atribuicao de responsavel;
- alteracoes de triagem.

### 8.2 `ANALISTA` e `ANALISTA_CAMPO`

Acoes visiveis:

- leitura completa;
- atualizacao operacional comum;
- registro e remocao de pendencias;
- atualizacao de observacoes;
- mudancas de status nao sensiveis permitidas pelo backend.

Observacao:

- a UI pode permitir preparacao do aceite, mas a governanca final da acao pode depender de perfil superior se a implementacao escolher esse caminho.

### 8.3 `COORDENADOR`

Acoes visiveis:

- todas as acoes operacionais comuns;
- atribuicao ou troca de responsavel operacional;
- acoes sensiveis;
- aceite operacional final;
- conclusao ou cancelamento, quando cabivel.

### 8.4 `ADMIN_TENANT` e `SUPER_ADMIN`

Acoes visiveis:

- mesmo conjunto do coordenador;
- com governanca plena do fluxo operacional.

### 8.5 `REPRESENTANTE_POSTO`

Acoes visiveis:

- nenhuma na area operacional do handoff.

## 9. Mensagens de validação e erro na tela

Mensagens recomendadas:

- sem responsavel operacional:
  - `Defina um responsável operacional antes de aceitar este handoff.`

- com pendencias em aberto:
  - `Resolva ou remova as pendências operacionais antes de avançar para preparação.`

- transicao invalida:
  - `A transição para preparação não é permitida a partir do status atual do handoff.`

- sem permissao:
  - `Seu perfil não possui permissão para aceitar este handoff operacional.`

- sucesso no aceite:
  - `Handoff aceito pela operação e movido para preparação de execução.`

- erro generico:
  - `Não foi possível atualizar o aceite operacional do handoff no momento.`

## 10. Fluxo visual recomendado dentro de `/operacao/handoffs/[id]`

Fluxo recomendado da tela:

1. cabecalho com status atual e contexto geral do handoff;
2. secao de atualizacao operacional;
3. bloco de orientacao do aceite operacional;
4. exibicao destacada de:
   - responsavel operacional;
   - pendencias operacionais;
   - observacoes operacionais;
5. mensagens de prontidao ou bloqueio para `EM_PLANEJAMENTO`;
6. acao principal coerente com o status e com o perfil;
7. continuidade dos blocos ja existentes de contexto, servicos e marcos temporais.

Recomendacao funcional:

- o aceite nao deve surgir como fluxo escondido;
- ele deve ser compreensivel na propria secao operacional, como parte natural da evolucao do handoff.

## 11. O que nao deve aparecer na UI

- snapshots brutos;
- `metadata` bruta;
- `inputSnapshot`;
- `resultadoSnapshot`;
- `snapshotCatalogo`;
- campos estruturais internos da proposta nao saneados;
- linguagem de contrato;
- linguagem de ordem de servico;
- linguagem de faturamento ou cobranca;
- acao automatica de onboarding;
- componentes paralelos de CRM.

## 12. O que nao deve ser implementado nesta onda

- tela nova de aceite separada;
- status novo;
- entidade nova;
- criacao automatica de contrato;
- criacao automatica de OS;
- criacao automatica de financeiro;
- abertura de fluxo de CRM;
- geracao automatica de processo, tarefa ou documento;
- automacao que extrapole o handoff operacional.

## 13. Critérios de aceite da UI

Para considerar a UI da Onda 3.4 bem planejada para implementacao, ela deve:

1. comunicar claramente a diferenca entre recebido, triagem, bloqueio documental, aceite e preparacao;
2. tratar `EM_PLANEJAMENTO` como estado posterior ao aceite operacional;
3. bloquear ou orientar a passagem para `EM_PLANEJAMENTO` quando faltar `responsavelOperacionalId`;
4. bloquear ou orientar a passagem para `EM_PLANEJAMENTO` quando existirem `pendenciasOperacionais`;
5. exibir responsavel, pendencias e observacoes com papeis semanticos distintos;
6. respeitar a matriz de permissao por perfil;
7. nao expor dados sensiveis nem snapshots brutos;
8. nao introduzir linguagem ou fluxo de contrato, OS, financeiro ou CRM;
9. manter coerencia com a tela ja existente de detalhe do handoff;
10. orientar o usuario sem exigir interpretacao implícita do backend.

## 14. Riscos de UX e pontos de atenção

### 14.1 Risco de aceite invisivel

- se a UI apenas trocar status sem explicar que isso representa aceite, o usuario nao entendera o marco de dominio.

### 14.2 Risco de confusao entre pendencia e observacao

- se os dois blocos forem visualmente parecidos demais, a equipe pode usar observacao como bloqueio informal ou pendencia como anotacao solta.

### 14.3 Risco de erro sem orientacao

- se a UI deixar o backend rejeitar `EM_PLANEJAMENTO` sem aviso previo, a experiencia operacional ficara reativa e pouco clara.

### 14.4 Risco de excesso de acoes para perfis nao gestores

- acoes sensiveis expostas de forma ampla podem gerar ruido, erro operacional e incoerencia de governanca.

### 14.5 Risco de semantica errada de planejamento

- a UI precisa deixar claro que `EM_PLANEJAMENTO` significa aceite e preparacao, nao execucao iniciada.
