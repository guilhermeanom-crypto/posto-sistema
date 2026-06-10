# 63. Desenho de UI da Onda 3.6.1 - Preparacao Operacional Pos-Aceite do Handoff

## 1. Objetivo da UI

Desenhar a proposta de interface para o detalhe do handoff quando o status estiver em `EM_PLANEJAMENTO`, deixando explicito que esse estado significa:

- handoff aceito pela operacao;
- organizacao pre-execucao em andamento;
- nenhuma OS criada;
- nenhum contrato criado;
- nenhuma execucao iniciada.

O objetivo central desta UI e separar com clareza quatro camadas visuais:

- aceite operacional concluido;
- preparacao operacional;
- futura geracao de OS;
- futura execucao.

Esta subetapa e apenas documental e nao autoriza implementacao de codigo, alteracao de backend ou mudanca de modelo de dados.

## 2. Estado atual da tela de detalhe

Com base nas Ondas 3.4 e 3.5, a tela de detalhe do handoff ja possui:

- leitura operacional mais limpa e sem exposicao visual de UUIDs na leitura padrao;
- comunicacao de status homologada;
- fluxo de aceite operacional validado para `EM_PLANEJAMENTO`;
- bloqueios obrigatorios sem responsavel operacional ou com pendencias abertas;
- persistencia apos reload.

Mesmo assim, o detalhe atual ainda esta mais forte em:

- comunicar o aceite;
- exibir dados do handoff;
- sustentar a regra operacional ja homologada.

Ele ainda nao esta organizado para comunicar, de forma autonoma e guiada, o que a operacao deve fazer depois do aceite e antes de qualquer execucao formal.

## 3. Problema de UX pos-aceite

Depois que o handoff entra em `EM_PLANEJAMENTO`, existe um vazio de leitura operacional:

- o usuario entende que o aceite ocorreu;
- mas nao enxerga com clareza a proxima camada de trabalho;
- nao existe uma area explicitamente dedicada a preparacao operacional;
- planejamento pode ser confundido com execucao;
- o estado futuro de OS e execucao ainda nao esta semanticamente separado dentro da tela.

O risco de UX e o seguinte:

- `EM_PLANEJAMENTO` pode parecer apenas um status final do aceite;
- ou pode parecer, incorretamente, que a execucao ja comecou.

A proposta da Onda 3.6.1 precisa eliminar essas duas ambiguidades.

## 4. Proposta de organizacao visual

A tela deve ser reorganizada em blocos sequenciais, com leitura de cima para baixo, refletindo a jornada operacional real:

1. confirmar que o aceite ja aconteceu;
2. mostrar a area de preparacao operacional como etapa atual;
3. indicar o nivel de prontidao para uma etapa futura;
4. orientar proximos passos internos;
5. explicitar quem coordena a preparacao.

Diretriz visual principal:

- o topo da tela deve encerrar a duvida sobre o estado atual;
- o meio da tela deve orientar planejamento;
- a parte inferior deve apoiar coordenacao e acompanhamento;
- itens de futura OS e futura execucao devem aparecer apenas como referencia conceitual, nunca como acao ja iniciada.

## 5. Hierarquia sugerida dos blocos

Hierarquia sugerida para o detalhe do handoff em `EM_PLANEJAMENTO`:

1. resumo superior do handoff
2. bloco `Aceite operacional concluido`
3. bloco `Preparacao operacional`
4. bloco `Prontidao operacional`
5. bloco `Proximos passos`
6. bloco `Responsabilidade e coordenacao`
7. secoes informativas ja existentes do handoff

Comportamento esperado da hierarquia:

- os dois primeiros blocos explicam contexto;
- os tres blocos centrais organizam a operacao;
- os blocos informativos existentes continuam dando suporte, sem competir com a narrativa principal da tela.

## 6. Bloco "Aceite operacional concluido"

Finalidade do bloco:

- registrar visualmente que a operacao ja assumiu o handoff;
- impedir regressao semantica para triagem;
- reforcar que o aceite nao equivale a OS ou execucao.

Conteudo sugerido:

- badge de status atual: `Em planejamento`;
- mensagem principal: `Aceite operacional concluido`;
- texto auxiliar: `Este handoff foi aceito pela operacao e esta em organizacao pre-execucao.`;
- evidencias do aceite:
  - responsavel operacional definido;
  - pendencias bloqueantes resolvidas;
  - observacoes de aceite, se existirem.

Mensagem que deve ficar explicita no bloco:

- `Aceite concluido nao significa OS criada nem execucao iniciada.`

## 7. Bloco "Preparacao operacional"

Este deve ser o bloco principal da tela em `EM_PLANEJAMENTO`.

Objetivo:

- concentrar o que a equipe precisa organizar antes de qualquer desdobramento operacional formal;
- transformar o status em uma etapa de trabalho clara.

Informacoes candidatas para o bloco:

- prioridade operacional;
- observacoes de planejamento;
- previsao inicial de inicio;
- necessidade de documentos complementares;
- necessidade de visita;
- necessidade de terceiro;
- risco operacional percebido.

Comportamento de UX esperado:

- linguagem de organizacao;
- tom de preparacao interna;
- ausencia de verbos que indiquem execucao em curso.

## 8. Bloco "Prontidao operacional"

Objetivo:

- resumir se o handoff esta apenas aceito ou se ja possui base minima para avancar em uma onda futura;
- criar leitura de prontidao sem introduzir novo status.

Formato sugerido:

- card-resumo com criterio visual simples;
- leitura por itens atendidos, pendentes ou a confirmar;
- sem qualquer automacao de transicao nesta etapa.

Indicadores candidatos:

- documentacao minima organizada;
- visita definida ou dispensada;
- apoio de terceiro definido ou dispensado;
- riscos operacionais identificados;
- previsao inicial registrada;
- coordenacao operacional atribuida.

Regra semantica:

- `pronto para organizar` e diferente de `pronto para executar`;
- o bloco nao pode comunicar inicio de execucao.

## 9. Bloco "Proximos passos"

Objetivo:

- orientar a equipe sobre o que precisa acontecer depois do aceite;
- reduzir dependencia de memoria individual;
- explicitar ordem de preparacao antes de qualquer OS futura.

Estrutura sugerida:

- lista curta e objetiva;
- foco em passos internos;
- texto orientado a acao de planejamento.

Exemplos de passos esperados:

- confirmar prioridade operacional;
- revisar documentos necessarios;
- definir necessidade de visita tecnica;
- registrar observacoes de planejamento;
- alinhar dependencias internas ou externas;
- consolidar previsao inicial de inicio.

Restricao importante:

- nao incluir passos como `gerar OS agora`, `iniciar execucao`, `emitir contrato` ou equivalentes.

## 10. Bloco "Responsabilidade e coordenacao"

Objetivo:

- deixar ownership claro apos o aceite;
- mostrar quem conduz a organizacao pre-execucao;
- evitar leitura difusa de responsabilidade.

Conteudo sugerido:

- responsavel operacional atual;
- area ou frente de apoio, quando houver conceito existente para exibir;
- observacoes de coordenacao;
- indicacao de dependencia de terceiro ou visita, quando aplicavel.

Resultado esperado:

- a tela deve responder rapidamente `quem esta conduzindo esta preparacao?`;
- a resposta nao deve depender de leitura tecnica ou de interpretacao indireta.

## 11. Quais campos devem ser apenas exibidos

Na implementacao futura, estes campos devem permanecer como exibicao nesta etapa, sem acao estrutural nova:

- status atual do handoff;
- marco de aceite operacional;
- responsavel operacional atual;
- pendencias operacionais ja existentes;
- observacoes operacionais ja existentes;
- origem da proposta;
- status da proposta de origem;
- dados contextuais do empreendimento e da proposta ja expostos de forma amigavel;
- indicadores derivados de risco e contexto que ja existirem no payload atual.

Motivo:

- esses campos ajudam a orientar a operacao;
- mas nao exigem criacao de dominio novo na Onda 3.6.1.

## 12. Quais campos poderiam ser editaveis no futuro

Campos que fazem sentido como candidatos a edicao futura, sem criar agora novo modelo:

- prioridade operacional;
- observacoes de planejamento;
- previsao inicial de inicio;
- necessidade de documentos;
- necessidade de visita;
- necessidade de terceiro;
- risco operacional;
- notas de coordenacao interna;
- checklist simples de proximos passos.

Diretriz:

- na Onda 3.6.1 esses campos entram apenas como proposta de UX;
- sua viabilizacao depende de desenho posterior de contrato, persistencia e regras.

## 13. Quais campos nao devem ser criados ainda

Nao devem ser criados nesta fase, nem como dado definitivo nem como conceito fechado:

- numero de OS;
- identificador de contrato;
- centro de custo operacional;
- aprovacao financeira;
- cronograma de execucao detalhado;
- alocacao formal de equipe de campo;
- agenda de execucao;
- controle de faturamento;
- status de execucao;
- status de visita executada;
- entidade nova de preparacao operacional.

Tambem nao deve ser criado:

- qualquer status intermediario novo entre aceite e execucao;
- qualquer entidade que simule OS futura dentro do handoff.

## 14. Regras de linguagem para nao confundir planejamento com execucao

Regras obrigatorias de linguagem:

- usar `preparacao`, `organizacao`, `planejamento` e `coordenacao` como verbos principais;
- evitar `executar`, `iniciar servico`, `ordem emitida`, `implantado`, `em campo` ou termos equivalentes;
- usar `previsao inicial` em vez de `data de inicio da execucao`;
- usar `necessidade de visita` em vez de `visita agendada/executada`;
- usar `necessidade de terceiro` em vez de `terceiro acionado`;
- usar `prontidao operacional` em vez de `liberado para execucao`, salvo se isso vier a existir formalmente em onda futura.

Frase-guia obrigatoria para a futura implementacao:

- `EM_PLANEJAMENTO indica handoff aceito e em organizacao pre-execucao. Nao indica OS criada, contrato criado ou execucao iniciada.`

## 15. Wireframe textual simples da tela

```text
[Header do handoff]
Nome / referencia operacional
Status: Em planejamento

[Bloco 1 - Aceite operacional concluido]
Aceite operacional concluido
Este handoff foi aceito pela operacao e esta em organizacao pre-execucao.
Responsavel operacional: <nome>
Pendencias bloqueantes: resolvidas
Observacoes de aceite: <texto existente, se houver>

[Bloco 2 - Preparacao operacional]
Prioridade operacional: <a definir / exibicao futura>
Previsao inicial de inicio: <a definir / exibicao futura>
Necessidade de documentos: <sim/nao/a confirmar>
Necessidade de visita: <sim/nao/a confirmar>
Necessidade de terceiro: <sim/nao/a confirmar>
Risco operacional: <baixo/medio/alto/a confirmar>
Observacoes de planejamento: <texto>

[Bloco 3 - Prontidao operacional]
Resumo de prontidao
- Documentos: ok / pendente
- Visita: dispensada / avaliar
- Terceiro: dispensado / avaliar
- Previsao inicial: registrada / pendente
- Coordenacao: definida / pendente

[Bloco 4 - Proximos passos]
1. Revisar itens de preparacao
2. Confirmar dependencias internas
3. Registrar previsao inicial
4. Consolidar orientacoes para etapa futura

[Bloco 5 - Responsabilidade e coordenacao]
Responsavel operacional: <nome>
Coordenacao / apoio: <se houver>
Observacoes internas: <texto>

[Blocos informativos existentes]
Dados do handoff
Dados da proposta
Contexto do empreendimento
Historico e observacoes
```

## 16. Criterios de aceite da futura implementacao

A futura implementacao desta proposta deve ser considerada aceita quando:

- o detalhe em `EM_PLANEJAMENTO` diferenciar visualmente aceite concluido de preparacao operacional;
- a tela comunicar, sem ambiguidade, que nao existe OS criada nem execucao iniciada;
- os blocos propostos tiverem hierarquia clara e leitura operacional objetiva;
- os textos usarem linguagem de planejamento, nao de execucao;
- a regra homologada da Onda 3.4 permanecer intacta;
- a sanitizacao visual da Onda 3.5 permanecer preservada;
- nenhuma integracao com contrato, OS, financeiro ou CRM for introduzida por engano;
- a nova area puder ser lida mesmo quando parte dos dados futuros ainda nao existir.

## 17. Riscos de implementacao

Riscos principais para a fase futura:

- misturar semanticamente aceite e preparacao no mesmo bloco;
- introduzir linguagem que sugira execucao iniciada;
- criar campos visuais que parecam persistidos sem definicao de contrato;
- induzir o usuario a esperar OS ou contrato na mesma etapa;
- inflar a tela com excesso de blocos sem prioridade clara;
- depender de payload inexistente antes de definir fallback ou exibicao neutra;
- reabrir indiretamente a regra da Onda 3.4 ao tentar acoplar preparacao com validacoes de aceite.

Mitigacao sugerida:

- implementar em etapas controladas;
- preservar os blocos homologados de aceite;
- tratar a preparacao como camada adicional, nao substitutiva.

## 18. Conclusao

O desenho da Onda 3.6.1 posiciona `EM_PLANEJAMENTO` como uma etapa claramente entendida pela operacao:

- o handoff ja foi aceito;
- a equipe esta organizando a pre-execucao;
- nenhuma OS foi criada;
- nenhum contrato foi criado;
- nenhuma execucao foi iniciada.

A proposta prioriza clareza semantica, separacao de etapas e governanca de escopo. Ela prepara o terreno para uma futura implementacao controlada no detalhe do handoff, sem reabrir as regras da Onda 3.4 nem o saneamento visual da Onda 3.5.
