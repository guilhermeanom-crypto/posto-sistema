# 53. Onda 3.4.1 - Regras de Aceite Operacional do Handoff

## 1. Objetivo da Onda 3.4.1

Definir as regras objetivas de dominio para o aceite operacional do `HandoffComercial`, transformando o plano macro da Onda 3.4 em criterios claros de:

- leitura do fluxo;
- significado operacional de cada etapa;
- regras de mudanca de status;
- requisitos minimos para aceite;
- comportamento esperado antes e depois do aceite operacional.

Esta etapa nao implementa codigo, nao altera modelo de dados e nao cria dominios finais de contrato, ordem de servico ou financeiro.

## 2. Premissas herdadas da Onda 3.3 e do plano 3.4

Premissas ja consolidadas:

- o handoff nasce a partir de proposta comercial aprovada;
- o handoff ja possui listagem, detalhe e atualizacao operacional controlada;
- a persistencia de `status`, `responsavelOperacionalId`, `pendenciasOperacionais` e `observacoesOperacionais` ja foi validada em runtime;
- o payload operacional exposto e saneado;
- snapshots brutos, `metadata`, `inputSnapshot`, `resultadoSnapshot` e `snapshotCatalogo` nao devem aparecer na UI operacional;
- o handoff ja possui maquina de status implementada na API;
- a Onda 3.4 deve trabalhar dentro da entidade existente `HandoffComercial`, sem abrir dominios finais paralelos.

Premissas de escopo da Onda 3.4:

- aceite operacional e um conceito de dominio dentro do fluxo do handoff;
- esse aceite pode ser representado com regras de negocio e leitura de estados ja existentes;
- `EM_PLANEJAMENTO` passa a ser interpretado como estado posterior ao aceite operacional;
- nao deve haver criacao automatica de contrato, OS, financeiro, processo, tarefa ou onboarding como consequencia direta desta onda.

## 3. Definicao formal de aceite operacional

Aceite operacional e a decisao explicita da operacao de que o handoff recebido:

- foi triado;
- possui entendimento operacional minimo suficiente;
- possui responsavel operacional definido;
- nao possui pendencia bloqueante aberta que impeça continuidade;
- esta apto a entrar em preparacao para execucao.

Definicao resumida:

- o aceite operacional nao e o recebimento do handoff;
- o aceite operacional nao e a execucao iniciada;
- o aceite operacional e o marco entre a triagem validada e a preparacao para execucao.

Representacao recomendada nesta onda:

- o aceite operacional deve ser inferido pela passagem valida para `EM_PLANEJAMENTO`, respeitando regras de negocio;
- nao e necessario criar status novo para representar o aceite nesta etapa.

## 4. Diferenca entre as etapas do fluxo

### 4.1 Handoff recebido

Estado de referencia:

- `AGUARDANDO_HANDOFF`

Significado:

- a demanda foi entregue pelo comercial;
- a operacao ainda nao iniciou analise formal;
- nao existe aceite implicito.

### 4.2 Triagem operacional

Estado de referencia:

- `EM_TRIAGEM_OPERACIONAL`

Significado:

- a operacao iniciou avaliacao do pacote recebido;
- o foco esta em entendimento, enquadramento e validacao minima do que chegou;
- ainda pode haver necessidade de complemento de informacao ou decisao de bloqueio.

### 4.3 Aguardando documentos

Estado de referencia:

- `AGUARDANDO_DOCUMENTOS`

Significado:

- a operacao ja identificou impedimento objetivo;
- o handoff nao pode avancar enquanto documentos, informacoes ou insumos nao forem disponibilizados;
- trata-se de bloqueio operacional, nao de aceite.

### 4.4 Aceite operacional

Marco de dominio:

- nao e um status novo;
- e a decisao que autoriza a passagem para `EM_PLANEJAMENTO`.

Significado:

- a operacao assume formalmente que o handoff esta apto para organizacao de execucao futura;
- o handoff deixa de ser apenas recebido ou triado.

### 4.5 Preparacao para execucao

Estado de referencia:

- `EM_PLANEJAMENTO`

Significado:

- o aceite operacional ja aconteceu;
- a operacao esta preparando estrutura, contexto e encaminhamentos para futura execucao;
- a execucao em si ainda nao comecou.

## 5. Regras para mudanca de status

### 5.1 Regras gerais

- toda mudanca de status deve continuar obedecendo a maquina de transicao ja consolidada na API;
- a Onda 3.4.1 apenas adiciona leitura de dominio sobre essas transicoes;
- nenhuma transicao deve ignorar validacoes de permissao e saneamento ja existentes.

### 5.2 Regras por etapa

- `AGUARDANDO_HANDOFF -> EM_TRIAGEM_OPERACIONAL`
  - representa inicio legitimo da triagem;
  - e a entrada recomendada para analise operacional.

- `EM_TRIAGEM_OPERACIONAL -> AGUARDANDO_DOCUMENTOS`
  - representa bloqueio por falta documental ou informacional;
  - deve existir justificativa operacional nas pendencias ou observacoes.

- `AGUARDANDO_DOCUMENTOS -> EM_TRIAGEM_OPERACIONAL`
  - representa retorno da triagem apos saneamento do bloqueio;
  - nao implica aceite ainda.

- `EM_TRIAGEM_OPERACIONAL -> EM_PLANEJAMENTO`
  - representa aceite operacional;
  - so deve ocorrer quando as regras de validacao pre-aceite estiverem satisfeitas.

- `AGUARDANDO_DOCUMENTOS -> EM_PLANEJAMENTO`
  - pode ocorrer apenas se os documentos pendentes tiverem sido regularizados e o handoff cumprir os requisitos de aceite;
  - funcionalmente equivale a triagem concluida com sucesso.

- `EM_PLANEJAMENTO -> EM_EXECUCAO`
  - nao faz parte do aceite em si;
  - pertence ao fluxo posterior de inicio de execucao.

### 5.3 Regras de proibicao funcional

- o handoff nao deve ser tratado como aceito enquanto estiver em `AGUARDANDO_HANDOFF`;
- o handoff nao deve ser tratado como aceito enquanto estiver em `EM_TRIAGEM_OPERACIONAL`;
- o handoff nao deve ser tratado como aceito enquanto estiver em `AGUARDANDO_DOCUMENTOS`;
- o handoff so deve ser tratado como aceito nesta onda ao chegar validamente em `EM_PLANEJAMENTO`.

## 6. Regras para pendencias bloqueantes

### 6.1 Definicao de pendencia bloqueante

Pendencia bloqueante e qualquer item operacional sem o qual:

- a operacao nao consegue compreender adequadamente o escopo;
- a operacao nao consegue assumir responsabilidade com seguranca;
- a preparacao para execucao ficaria baseada em premissa incompleta.

### 6.2 Uso esperado de `pendenciasOperacionais`

- registrar itens objetivos e acionaveis;
- evidenciar o que impede continuidade;
- servir como base para manter triagem aberta ou mover para `AGUARDANDO_DOCUMENTOS`.

### 6.3 Regra de aceite

- se existir pendencia bloqueante em aberto, o handoff nao deve seguir para aceite operacional;
- como o sistema atual nao distingue tecnicamente tipos de pendencia, a regra de negocio deve assumir que pendencias ativas registradas no momento do aceite sao impeditivas por padrao.

### 6.4 Fechamento logico de pendencia

Para fins desta onda:

- considera-se pendencia resolvida quando ela deixa de constar em `pendenciasOperacionais`;
- nao ha historico individual de resolucao de pendencia nesta etapa.

## 7. Regras para responsavel operacional

### 7.1 Obrigatoriedade para aceite

- o handoff nao pode ser aceito operacionalmente sem `responsavelOperacionalId` definido.

### 7.2 Significado do responsavel

- o responsavel operacional e o ponto principal de ownership do handoff na operacao;
- sua atribuicao nao substitui a triagem, mas e requisito para aceite.

### 7.3 Atribuicao inicial

- a primeira atribuicao continua sendo marco relevante de assuncao;
- o comportamento de preencher `assumidoEm` na primeira atribuicao permanece valido.

### 7.4 Troca de responsavel

- troca de `responsavelOperacionalId` continua sendo acao sensivel;
- deve permanecer restrita aos perfis superiores ja definidos.

## 8. Regras para observacoes operacionais

### 8.1 Finalidade

- registrar contexto interno;
- consolidar premissas;
- documentar combinados de triagem;
- explicar racional operacional sem alterar dados de origem comercial.

### 8.2 Limites

- observacao operacional nao substitui pendencia bloqueante;
- observacao operacional nao autoriza aceite por si so;
- observacao operacional nao deve carregar snapshots brutos nem dados sensiveis nao saneados.

### 8.3 Uso recomendado antes do aceite

- registrar leitura tecnica da operacao;
- indicar ressalvas nao bloqueantes;
- explicar por que o handoff esta apto ou inapto para seguir.

## 9. Regras de permissao por perfil

### 9.1 Leitura

Perfis com leitura:

- `EXECUTIVO`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Perfil bloqueado:

- `REPRESENTANTE_POSTO`

### 9.2 Atualizacao operacional comum

Perfis autorizados:

- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Acoes abrangidas:

- alterar `status` em transicoes nao sensiveis;
- registrar ou limpar `pendenciasOperacionais`;
- registrar `observacoesOperacionais`.

### 9.3 Acoes sensiveis

Perfis autorizados:

- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Acoes sensiveis relevantes para a 3.4.1:

- definir ou trocar `responsavelOperacionalId`;
- concluir ou cancelar handoff;
- autorizar passagem final para estado que represente aceite operacional quando a equipe decidir restringir essa decisao a perfil superior.

### 9.4 Papel do analista

- `ANALISTA` e `ANALISTA_CAMPO` podem conduzir triagem e registrar pendencias/observacoes;
- a governanca do aceite final pode continuar subordinada a perfil superior se esse for o desenho operacional adotado pela fase de implementacao.

## 10. Regras de validacao antes do aceite

Antes de um handoff ser considerado aceito operacionalmente, os seguintes criterios devem estar satisfeitos:

1. o handoff nao pode estar em `AGUARDANDO_HANDOFF`;
2. o handoff deve ter passado por leitura operacional efetiva;
3. `responsavelOperacionalId` deve estar preenchido;
4. `pendenciasOperacionais` deve estar vazio;
5. o status deve poder evoluir validamente para `EM_PLANEJAMENTO`;
6. o usuario que realiza a acao deve ter permissao compativel com a transicao e eventuais acoes sensiveis associadas.

Validacoes recomendadas de clareza operacional:

- existir ao menos uma observacao operacional nao e obrigatorio;
- mas a equipe pode exigir orientacao visual para estimular registro minimo de contexto antes do aceite.

## 11. O que acontece depois do aceite

Apos o aceite operacional:

- o handoff passa a ser tratado como item em preparacao para execucao;
- o status esperado torna-se `EM_PLANEJAMENTO`;
- a operacao pode refinar contexto e organizar proximos encaminhamentos;
- continua vedada a criacao automatica de dominios finais.

Efeitos funcionais esperados:

- o handoff sai da zona de incerteza inicial;
- passa a haver leitura clara de ownership operacional;
- a execucao futura fica condicionada a etapa posterior, nao ao aceite em si.

## 12. O que nao pode acontecer nesta onda

- nao criar contrato;
- nao criar ordem de servico;
- nao criar financeiro;
- nao criar entidade nova de aceite;
- nao criar status novo se o fluxo puder ser representado com os estados atuais;
- nao disparar onboarding automatico;
- nao gerar tarefas, processos ou documentos automaticamente por efeito colateral do aceite;
- nao reabrir ou alterar dados estruturais da proposta comercial;
- nao expor snapshots brutos ou dados internos do motor comercial.

## 13. Matriz de transicao de status

### 13.1 Matriz base herdada da API

- `AGUARDANDO_HANDOFF -> EM_TRIAGEM_OPERACIONAL, CANCELADO`
- `EM_TRIAGEM_OPERACIONAL -> AGUARDANDO_DOCUMENTOS, EM_PLANEJAMENTO, CANCELADO`
- `AGUARDANDO_DOCUMENTOS -> EM_TRIAGEM_OPERACIONAL, EM_PLANEJAMENTO, CANCELADO`
- `EM_PLANEJAMENTO -> EM_EXECUCAO, PAUSADO, CANCELADO`
- `EM_EXECUCAO -> PAUSADO, CONCLUIDO, CANCELADO`
- `PAUSADO -> EM_TRIAGEM_OPERACIONAL, EM_PLANEJAMENTO, EM_EXECUCAO, CANCELADO`
- `CANCELADO` e final
- `CONCLUIDO` e final

### 13.2 Leitura funcional da 3.4.1

- `AGUARDANDO_HANDOFF -> EM_TRIAGEM_OPERACIONAL`
  - inicio de triagem

- `EM_TRIAGEM_OPERACIONAL -> AGUARDANDO_DOCUMENTOS`
  - bloqueio por falta de insumo

- `AGUARDANDO_DOCUMENTOS -> EM_TRIAGEM_OPERACIONAL`
  - retorno para nova analise

- `EM_TRIAGEM_OPERACIONAL -> EM_PLANEJAMENTO`
  - aceite operacional

- `AGUARDANDO_DOCUMENTOS -> EM_PLANEJAMENTO`
  - aceite operacional apos regularizacao de bloqueio

### 13.3 Restricao funcional adicional

- transicao para `EM_PLANEJAMENTO` so deve ser considerada valida como aceite quando as regras do item 10 forem atendidas.

## 14. Criterios de aceite da Onda 3.4.1

Para considerar a Onda 3.4.1 bem definida documentalmente, o documento deve deixar claro:

1. o que e aceite operacional e o que nao e;
2. como cada etapa do fluxo deve ser lida;
3. quando um handoff ainda esta apenas recebido ou triado;
4. quando uma pendencia impede continuidade;
5. por que o responsavel operacional e requisito de aceite;
6. como `observacoesOperacionais` devem ser usadas;
7. quais perfis podem ler, triar, atribuir e aceitar;
8. que o aceite operacional nao cria dominio final automaticamente;
9. que `EM_PLANEJAMENTO` e o estado posterior ao aceite nesta onda;
10. que nao ha necessidade de entidade nova para representar o aceite neste momento.

## 15. Riscos e pontos de atencao

### 15.1 Risco de aceite implicito

- se a implementacao futura nao explicitar a passagem para `EM_PLANEJAMENTO`, a equipe pode continuar tratando triagem como aceite tacito.

### 15.2 Risco de ambiguidade nas pendencias

- como `pendenciasOperacionais` ainda e apenas lista textual, e preciso disciplina funcional para nao misturar itens bloqueantes com lembretes secundarios.

### 15.3 Risco de permissao difusa

- a equipe precisa decidir se qualquer perfil operacional de edicao pode efetivar aceite ou se isso ficara restrito a perfil superior na implementacao.

### 15.4 Risco de antecipacao de dominio

- sem preservar o escopo desta onda, a etapa de aceite pode virar atalho indevido para contrato, OS ou financeiro.

### 15.5 Risco de semantica fraca do planejamento

- `EM_PLANEJAMENTO` precisa ser tratado como preparacao para execucao, nao como execucao em andamento.
