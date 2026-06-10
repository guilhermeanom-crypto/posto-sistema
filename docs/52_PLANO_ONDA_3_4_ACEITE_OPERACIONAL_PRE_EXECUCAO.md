# 52. Plano da Onda 3.4 - Aceite Operacional e Preparacao para Execucao

## 1. Objetivo da Onda 3.4

Planejar a etapa imediatamente posterior ao handoff operacional validado, estruturando o momento de:

- recebimento formal pela operacao;
- triagem operacional inicial;
- tratamento de pendencias;
- aceite operacional controlado;
- preparacao do handoff para futura execucao.

O foco da Onda 3.4 nao e criar contrato, ordem de servico, financeiro ou onboarding automatico como dominios reais. O foco e criar a disciplina operacional anterior a esses desdobramentos.

## 2. O que ja vem pronto da Onda 3.3

A Onda 3.3 deixou liberados e validados:

- criacao de handoff a partir de proposta aprovada;
- listagem operacional de handoffs;
- detalhe operacional do handoff;
- atualizacao operacional controlada via UI;
- persistencia validada em runtime de:
  - `status`
  - `responsavelOperacionalId`
  - `pendenciasOperacionais`
  - `observacoesOperacionais`
- saneamento de dados exibidos, sem exposicao de snapshots brutos ou campos internos;
- coerencia de permissao visual com o backend.

Em termos de maquina de fluxo, a base atual ja suporta:

- `AGUARDANDO_HANDOFF`
- `EM_TRIAGEM_OPERACIONAL`
- `AGUARDANDO_DOCUMENTOS`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `PAUSADO`
- `CANCELADO`
- `CONCLUIDO`

## 3. Problema que a Onda 3.4 resolve

Hoje o sistema ja recebe e atualiza handoffs, mas ainda nao formaliza com clareza o momento em que a operacao:

- reconhece o recebimento do pacote comercial;
- valida se o escopo esta operacionalmente pronto;
- distingue pendencia bloqueante de observacao interna;
- declara que o handoff foi aceito para execucao futura;
- organiza os preparativos minimos antes de abrir objetos operacionais finais.

Sem essa etapa, existe risco de:

- tratar handoff apenas como fila passiva;
- iniciar execucao sem aceite minimo;
- antecipar contrato, OS ou financeiro com base em informacao ainda incompleta;
- perder rastreabilidade sobre por que um handoff estava ou nao pronto para seguir.

## 4. Fluxo proposto

### 4.1 Handoff recebido

Entrada no fluxo:

- proposta comercial aprovada gera um `HandoffComercial`;
- handoff entra inicialmente em `AGUARDANDO_HANDOFF`;
- a operacao passa a enxergar o item na fila operacional.

Objetivo da etapa:

- sinalizar que existe demanda recebida, mas ainda nao assumida tecnicamente.

### 4.2 Triagem operacional

Ao iniciar a avaliacao operacional:

- handoff evolui para `EM_TRIAGEM_OPERACIONAL`;
- a operacao revisa:
  - servicos aprovados;
  - contexto tecnico saneado;
  - observacoes comerciais liberadas;
  - necessidade de responsavel operacional;
  - suficiencia minima de dados para seguir.

Objetivo da etapa:

- verificar se o handoff esta tecnicamente inteligivel e operacionalmente tratavel.

### 4.3 Pendencias operacionais

Se existirem gaps para seguir:

- registrar `pendenciasOperacionais`;
- manter o handoff em triagem ou movê-lo para `AGUARDANDO_DOCUMENTOS`, quando a natureza do bloqueio for documental/informacional;
- diferenciar pendencia real de simples observacao interna.

Objetivo da etapa:

- impedir aceite prematuro e deixar claro o motivo do bloqueio.

### 4.4 Aceite operacional

Quando o handoff estiver minimamente apto para seguir:

- registrar aceite operacional como decisao explicita de dominio;
- considerar o handoff aceito quando:
  - houver responsavel operacional definido;
  - nao houver pendencia bloqueante aberta;
  - o status puder evoluir validamente para fase de preparacao.

Resultado esperado:

- o handoff deixa de ser apenas recebido e passa a ser oficialmente assumido pela operacao.

### 4.5 Preparacao para execucao

Apos o aceite:

- handoff entra em `EM_PLANEJAMENTO`;
- a operacao prepara o que sera necessario para futura execucao, sem ainda abrir dominios finais.

Preparativos esperados:

- consolidacao do responsavel;
- refinamento das observacoes operacionais;
- checklist interno de prontidao;
- definicao do que precisara virar processo, tarefa, onboarding, contrato ou OS em etapa posterior.

Objetivo da etapa:

- separar claramente o aceite operacional do inicio da execucao real.

## 5. Regras de negocio

### 5.1 Recebimento nao equivale a aceite

- criar o handoff nao significa que a operacao aceitou o escopo.
- `AGUARDANDO_HANDOFF` e apenas estado de entrada.

### 5.2 Triagem deve anteceder planejamento

- o handoff nao deve ir direto de `AGUARDANDO_HANDOFF` para uma etapa equivalente a execucao sem passar por validacao operacional minima.

### 5.3 Pendencia bloqueante impede aceite

- se houver pendencia operacional bloqueante aberta, o handoff nao deve ser considerado aceito para preparacao de execucao.

### 5.4 Responsavel operacional e requisito de aceite

- o aceite operacional deve pressupor responsavel operacional atribuido.
- a primeira atribuicao continua sendo um marco temporal relevante da assuncao.

### 5.5 Observacao nao substitui pendencia

- `observacoesOperacionais` registram contexto, premissas e combinados.
- `pendenciasOperacionais` registram impedimentos ou itens de cobranca operacional.

### 5.6 Aceite nao cria dominio final automaticamente

- aceite operacional nao cria contrato;
- aceite operacional nao cria ordem de servico;
- aceite operacional nao cria financeiro;
- aceite operacional nao dispara onboarding/processo/tarefa automaticamente nesta onda.

### 5.7 Preparacao para execucao e etapa intermediaria

- `EM_PLANEJAMENTO` deve representar prontidao operacional em organizacao.
- essa etapa ainda nao deve ser tratada como execucao iniciada.

## 6. Estados possiveis

Estados que permanecem como base do fluxo:

- `AGUARDANDO_HANDOFF`
- `EM_TRIAGEM_OPERACIONAL`
- `AGUARDANDO_DOCUMENTOS`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `PAUSADO`
- `CANCELADO`
- `CONCLUIDO`

Leitura recomendada para a Onda 3.4:

- `AGUARDANDO_HANDOFF`:
  - recebido pela fila, sem triagem iniciada
- `EM_TRIAGEM_OPERACIONAL`:
  - em avaliacao pela operacao
- `AGUARDANDO_DOCUMENTOS`:
  - bloqueado por insumo ou documento pendente
- `EM_PLANEJAMENTO`:
  - aceito operacionalmente e em preparacao para futura execucao

Observacao importante:

- a Onda 3.4 pode ser implementada sem criar status novo, desde que o conceito de aceite operacional seja modelado como marco de fluxo e regra de transicao dentro dos status ja existentes.

## 7. Permissoes por perfil

### 7.1 Leitura

Perfis com leitura:

- `EXECUTIVO`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Perfil bloqueado:

- `REPRESENTANTE_POSTO`

### 7.2 Triagem e atualizacao operacional

Perfis com capacidade de triagem e atualizacao:

- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

### 7.3 Acoes sensiveis

Perfis com capacidade de acoes sensiveis:

- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Acoes sensiveis na leitura da Onda 3.4:

- atribuir ou trocar `responsavelOperacionalId`;
- declarar aceite operacional final, se isso implicar marco forte de dominio;
- concluir ou cancelar handoff;
- autorizar passagem definitiva para preparacao de execucao.

### 7.4 Papel do executivo

- `EXECUTIVO` pode acompanhar leitura do handoff;
- nao deve conduzir aceite operacional nem preparar execucao como regra padrao.

## 8. O que NAO deve ser feito ainda

- nao criar entidade real de contrato;
- nao criar entidade real de ordem de servico;
- nao criar entidade real de financeiro;
- nao criar vinculacao obrigatoria com CRM;
- nao disparar onboarding automatico;
- nao gerar processos automaticamente;
- nao criar tarefas automaticas de execucao como comportamento padrao;
- nao abrir upload documental novo fora do recorte do handoff;
- nao alterar Prisma por antecipacao especulativa;
- nao introduzir migration apenas para prever contrato, OS ou cobranca futura.

## 9. Riscos de antecipar contrato, OS ou financeiro

### 9.1 Risco de semantica errada

- proposta aprovada e handoff aceito nao significam necessariamente obrigacao juridica formal ou cobranca pronta.

### 9.2 Risco de acoplamento precoce

- antecipar esses dominios forca a operacao a preencher estruturas finais antes da triagem estar madura.

### 9.3 Risco de retrabalho

- se o escopo mudar na triagem, contrato, OS ou financeiro criados cedo demais podem ficar inconsistentes e exigir correcoes manuais.

### 9.4 Risco de auditoria difusa

- misturar aceite operacional com objetos transacionais finais reduz clareza sobre onde terminou o comercial e onde comecou a execucao.

### 9.5 Risco de regra de negocio instavel

- sem fechar antes os criterios de aceite e prontidao, qualquer modelagem de contrato, OS ou financeiro tende a nascer sobre premissas ainda instaveis.

## 10. Proposta de implementacao em subondas

### 10.1 Onda 3.4.1 - Planejamento funcional do aceite

Escopo:

- definir conceito de aceite operacional;
- fechar regras de transicao;
- definir diferenca entre pendencia bloqueante, observacao e preparacao;
- alinhar comportamento esperado em UI e API.

### 10.2 Onda 3.4.2 - Ajustes minimos de dominio do handoff

Escopo:

- avaliar se o conceito de aceite cabe apenas com status e regras atuais;
- somente se necessario, planejar pequenos campos ou marcos adicionais diretamente no handoff;
- sem abrir dominios externos.

### 10.3 Onda 3.4.3 - UI de aceite e preparacao

Escopo:

- explicitar na tela o momento de:
  - triagem
  - bloqueio por pendencia
  - aceite operacional
  - preparacao para execucao
- manter toda a interacao dentro de `/operacao/handoffs/[id]`

### 10.4 Onda 3.4.4 - Validacao operacional

Escopo:

- validar em runtime o novo fluxo de aceite;
- confirmar persistencia, labels, permissao e ausencia de exposicao indevida;
- confirmar que nada de contrato, OS ou financeiro foi introduzido por atalho.

## 11. Criterios de aceite

Para considerar a Onda 3.4 concluida no futuro, o sistema deve permitir:

1. identificar claramente quando um handoff esta apenas recebido;
2. identificar quando a triagem operacional foi iniciada;
3. registrar e visualizar pendencias operacionais bloqueantes com clareza;
4. distinguir observacao operacional de pendencia;
5. declarar aceite operacional somente quando os requisitos minimos estiverem atendidos;
6. refletir o handoff aceito em estado coerente de preparacao para execucao;
7. manter coerencia de permissao por perfil;
8. manter auditoria rastreavel do fluxo;
9. nao expor snapshots brutos, metadata ou dados sensiveis;
10. nao criar contrato, OS, financeiro ou automacoes paralelas nesta onda.

## 12. Proximos documentos tecnicos necessarios

Documentos recomendados para abrir a Onda 3.4:

- `53_ONDA_3_4_1_REGRAS_ACEITE_OPERACIONAL_HANDOFF.md`
- `54_ONDA_3_4_2_CONTRATO_TECNICO_ACEITE_E_PREPARACAO.md`
- `55_ONDA_3_4_3_PLANEJAMENTO_UI_ACEITE_OPERACIONAL.md`
- `56_ONDA_3_4_4_GATE_DE_LIBERACAO_IMPLEMENTACAO.md`

Objetivo desses proximos documentos:

- transformar o plano funcional em contrato tecnico;
- decidir se a Onda 3.4 cabe so com regras e UI ou se exige pequeno ajuste de dominio;
- preservar o isolamento do handoff antes de abrir contrato, OS ou financeiro em ondas posteriores.
