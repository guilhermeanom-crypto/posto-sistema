# 54. Onda 3.4.2 - Contrato Tecnico de Aceite e Preparacao

## 1. Objetivo da Onda 3.4.2

Transformar as regras funcionais da Onda 3.4.1 em contrato tecnico de implementacao, definindo como o sistema deve representar aceite operacional e preparacao para execucao usando exclusivamente o `HandoffComercial` ja existente.

Esta etapa nao implementa codigo. Ela apenas fecha as decisoes tecnicas que devem guiar backend, frontend, validacoes e testes da implementacao futura.

## 2. Decisao tecnica sobre usar ou nao status novo

Decisao:

- **nao criar status novo nesta onda**.

Justificativa tecnica:

- a maquina de status atual ja possui `EM_PLANEJAMENTO`, que pode representar adequadamente o estado posterior ao aceite operacional;
- o aceite operacional pode ser modelado como regra de transicao e marco de dominio, sem exigir novo enum;
- evitar status novo reduz impacto em:
  - backend;
  - frontend;
  - contratos tipados;
  - testes;
  - migration;
- a introducao de novo status agora ampliaria superficie tecnica sem necessidade comprovada.

Conclusao:

- aceite operacional sera considerado pela passagem valida para `EM_PLANEJAMENTO`;
- `EM_PLANEJAMENTO` sera a representacao tecnica do handoff aceito e em preparacao para execucao.

## 3. Decisao tecnica sobre criar ou nao entidade nova de aceite

Decisao:

- **nao criar entidade nova de aceite**.

Justificativa tecnica:

- o conceito de aceite cabe dentro do ciclo do `HandoffComercial`;
- os campos ja existentes permitem representar os requisitos minimos de aceite;
- criar entidade nova agora duplicaria responsabilidade de dominio;
- a rastreabilidade pode continuar ancorada em:
  - `status`
  - `responsavelOperacionalId`
  - `pendenciasOperacionais`
  - `observacoesOperacionais`
  - auditoria existente

Conclusao:

- o aceite operacional permanece como regra de negocio aplicada sobre o `HandoffComercial`;
- nao deve existir tabela, modulo ou agregado novo apenas para aceite nesta fase.

## 4. Decisao tecnica sobre alterar ou nao Prisma/migration

Decisao:

- **nao alterar Prisma**;
- **nao criar migration**.

Justificativa tecnica:

- a implementacao planejada depende de regras e validacoes, nao de nova estrutura persistente;
- os campos ja existentes sao suficientes para a primeira versao do aceite;
- antecipar mudanca estrutural sem necessidade comprovada aumentaria risco e custo de manutencao.

Conclusao:

- a Onda 3.4.2 fecha um contrato tecnico que deve caber integralmente no modelo atual.

## 5. Contrato de dominio usando `HandoffComercial` existente

Contrato de dominio definido:

- o aceite operacional nao e entidade;
- o aceite operacional nao e status proprio;
- o aceite operacional e uma **regra de dominio** que permite transicao para `EM_PLANEJAMENTO`;
- um handoff em `EM_PLANEJAMENTO` deve ser interpretado, nesta onda, como:
  - triado;
  - sem pendencia bloqueante ativa;
  - com responsavel operacional definido;
  - aceito para preparacao de execucao.

Leitura tecnica por estado:

- `AGUARDANDO_HANDOFF`:
  - recebido, sem triagem formal iniciada
- `EM_TRIAGEM_OPERACIONAL`:
  - em avaliacao operacional
- `AGUARDANDO_DOCUMENTOS`:
  - bloqueado por insumo pendente
- `EM_PLANEJAMENTO`:
  - aceito operacionalmente e em preparacao

## 6. Campos ja existentes que serao reutilizados

Campos obrigatoriamente reutilizados:

- `status`
- `responsavelOperacionalId`
- `pendenciasOperacionais`
- `observacoesOperacionais`
- `assumidoEm`, quando aplicavel

Uso tecnico de cada campo:

- `status`
  - representa a etapa formal do handoff;
  - servira para consolidar o aceite via `EM_PLANEJAMENTO`.

- `responsavelOperacionalId`
  - identifica ownership operacional;
  - sera requisito tecnico para aceite.

- `pendenciasOperacionais`
  - representa impedimentos ativos;
  - lista nao vazia impede aceite por padrao.

- `observacoesOperacionais`
  - registra contexto interno e racional operacional;
  - nao substitui pendencia, mas complementa a leitura da triagem.

- `assumidoEm`
  - continua sendo marco temporal de primeira atribuicao do responsavel;
  - pode ser usado como evidencia auxiliar de assuncao operacional, sem virar criterio isolado de aceite.

## 7. Regra tecnica para considerar aceite operacional

Regra tecnica principal:

- um handoff sera considerado aceito operacionalmente quando a mutacao que o leva para `EM_PLANEJAMENTO` passar pelas validacoes de pre-aceite.

Definicao tecnica:

- aceite operacional = `status` final em `EM_PLANEJAMENTO` **mais** validacoes satisfeitas no momento da transicao.

Importante:

- nao basta estar em `EM_PLANEJAMENTO` por qualquer caminho sem regra;
- a implementacao deve garantir que essa transicao so ocorra quando o handoff estiver apto.

## 8. Validacoes necessarias antes de permitir `EM_PLANEJAMENTO`

Antes de permitir transicao para `EM_PLANEJAMENTO`, a implementacao deve validar:

1. o status atual permite transicao para `EM_PLANEJAMENTO` dentro da maquina existente;
2. o handoff nao esta em estado final (`CANCELADO` ou `CONCLUIDO`);
3. `responsavelOperacionalId` esta preenchido;
4. `pendenciasOperacionais` esta vazio;
5. o usuario autenticado possui permissao para a acao;
6. se a equipe optar por governanca reforcada, a passagem para `EM_PLANEJAMENTO` deve respeitar a regra de acao sensivel definida para perfil superior.

Validacoes deliberadamente nao obrigatorias nesta fase:

- `observacoesOperacionais` preenchida;
- novo campo booleano de aceite;
- nova data exclusiva de aceite.

## 9. Comportamento esperado da API `PATCH`

### 9.1 Contrato mantido

O `PATCH /api/v1/operacao/handoffs/:id` deve continuar aceitando apenas:

- `status`
- `responsavelOperacionalId`
- `pendenciasOperacionais`
- `observacoesOperacionais`

### 9.2 Contrato adicional da Onda 3.4.2

Ao receber tentativa de transicao para `EM_PLANEJAMENTO`, a API deve:

- validar precondicoes de aceite;
- rejeitar a transicao se houver pendencias em aberto;
- rejeitar a transicao se faltar `responsavelOperacionalId`;
- manter a restricao de tenant e perfil;
- continuar sem aceitar snapshots, payload bruto ou campos estruturais da proposta.

### 9.3 Resultado esperado em sucesso

Em caso de sucesso:

- retornar o handoff atualizado;
- refletir `status = EM_PLANEJAMENTO`;
- manter o contrato saneado ja existente.

### 9.4 Resultado esperado em erro

Em caso de falha:

- retornar erro de negocio claro;
- nao alterar parcialmente o handoff;
- nao mascarar falha de permissao como erro generico.

## 10. Comportamento esperado da UI

### 10.1 Leitura do fluxo

A UI deve deixar claro:

- quando o handoff foi apenas recebido;
- quando esta em triagem;
- quando esta aguardando documentos;
- quando foi aceito;
- quando esta em preparacao para execucao.

### 10.2 Tratamento do aceite

A UI nao precisa de entidade nova nem tela nova separada para aceite.

Recomendacao tecnica:

- concentrar o comportamento em `/operacao/handoffs/[id]`;
- usar os campos ja existentes;
- orientar a acao de avancar para `EM_PLANEJAMENTO` como aceite operacional.

### 10.3 Comportamento antes do aceite

Se faltar responsavel operacional ou houver pendencias em aberto:

- a UI deve bloquear ou desencorajar a passagem para `EM_PLANEJAMENTO`;
- a mensagem deve explicar o motivo de forma objetiva.

### 10.4 Comportamento depois do aceite

Quando o handoff estiver em `EM_PLANEJAMENTO`:

- a UI deve comunicar que o handoff foi aceito;
- a UI deve comunicar que a execucao ainda nao comecou;
- a UI nao deve abrir automaticamente fluxo de contrato, OS ou financeiro.

## 11. Permissoes tecnicas por perfil

### 11.1 Leitura

Perfis autorizados:

- `EXECUTIVO`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

### 11.2 Edicao operacional comum

Perfis autorizados:

- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Acoes abrangidas:

- alterar `status` em fluxos nao sensiveis;
- registrar/remover pendencias;
- registrar observacoes.

### 11.3 Acoes sensiveis

Perfis autorizados:

- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Acoes sensiveis relevantes:

- atribuir ou trocar `responsavelOperacionalId`;
- concluir handoff;
- cancelar handoff;
- opcionalmente confirmar a passagem final para `EM_PLANEJAMENTO`, caso a implementacao escolha governanca reforcada para o aceite.

### 11.4 Perfil bloqueado

- `REPRESENTANTE_POSTO` permanece sem acesso ao fluxo operacional do handoff.

## 12. Mensagens de erro esperadas

Mensagens tecnicas-funcionais esperadas para a implementacao:

- sem responsavel operacional:
  - `Defina um responsável operacional antes de aceitar este handoff.`

- com pendencias em aberto:
  - `Resolva ou remova as pendências operacionais antes de avançar para preparação.`

- transicao invalida:
  - `A transição para preparação não é permitida a partir do status atual do handoff.`

- sem permissao:
  - `Seu perfil não possui permissão para aceitar este handoff operacional.`

- tentativa de editar campo proibido:
  - `Informe apenas os campos operacionais permitidos para atualização do handoff.`

- erro generico:
  - `Não foi possível atualizar o aceite operacional do handoff no momento.`

## 13. Riscos tecnicos

### 13.1 Risco de semantica fraca

- se `EM_PLANEJAMENTO` nao for tratado explicitamente como estado pos-aceite, o sistema continuara ambíguo.

### 13.2 Risco de validacao insuficiente

- permitir `EM_PLANEJAMENTO` sem validar responsavel e pendencias comprometeria o conceito de aceite.

### 13.3 Risco de UI permissiva demais

- se a UI apenas liberar a troca de status sem orientar precondicoes, o usuario pode encontrar erro de backend sem contexto suficiente.

### 13.4 Risco de governanca inconsistente

- se a regra de quem pode efetivar o aceite nao ficar consistente entre backend e UI, surgirao divergencias de permissao.

### 13.5 Risco de antecipacao estrutural

- tentar resolver esta onda com novo status, nova entidade ou migration criaria custo tecnico desnecessario.

## 14. Escopo proibido

Fica explicitamente fora do escopo da implementacao derivada desta onda:

- criar status novo;
- criar entidade nova de aceite;
- alterar Prisma;
- criar migration;
- criar contrato;
- criar ordem de servico;
- criar financeiro;
- disparar onboarding automatico;
- gerar processo, tarefa ou documento automaticamente;
- alterar CRM;
- expor snapshots brutos, metadata ou campos internos do fluxo comercial.

## 15. Criterios de aceite tecnico para liberar implementacao

Para liberar a implementacao futura da Onda 3.4, este contrato tecnico deve ser seguido com os seguintes criterios:

1. o aceite operacional deve caber integralmente no `HandoffComercial` atual;
2. nao deve haver novo status nem nova entidade;
3. a transicao para `EM_PLANEJAMENTO` deve representar aceite operacional;
4. a transicao para `EM_PLANEJAMENTO` deve validar:
   - `responsavelOperacionalId` preenchido;
   - `pendenciasOperacionais` vazio;
   - permissao adequada;
   - transicao de status valida;
5. a API `PATCH` deve manter o contrato atual e apenas adicionar as regras de pre-aceite;
6. a UI deve orientar claramente o usuario sobre por que o handoff pode ou nao pode ser aceito;
7. nao deve haver alteracao de modelo de dados;
8. nao deve haver abertura de dominios finais ou automacoes paralelas;
9. mensagens de erro devem ser objetivas e coerentes entre backend e frontend;
10. a implementacao deve continuar compatível com o saneamento e as permissoes ja consolidadas na Onda 3.3.
