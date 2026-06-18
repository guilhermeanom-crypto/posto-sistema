# 103. Orquestracao Operacional da Consolidacao

Data: 2026-06-11

## 1. Objetivo

Transformar a consolidacao da base normativa e operacional em uma operacao repetivel, com:

- dono do fluxo;
- papeis claros;
- agentes com escopo definido;
- lotes priorizados;
- ritos de aprovacao;
- criterio objetivo de avancar ou bloquear.

## 2. O que estamos orquestrando

Tres trilhas em paralelo:

1. `curadoria normativa`
2. `estruturacao da base em planilhas controladas`
3. `carga e homologacao no sistema`

## 3. Orquestrador central

Deve existir um papel unico de orquestracao. Pode ser uma pessoa ou um agente acompanhado por uma pessoa.

Responsavel ideal:

- `COORDENADOR`
- ou `ADMIN_TENANT` com apoio do coordenador

Esse orquestrador nao precisa preencher tudo. Ele precisa:

1. decidir o proximo lote;
2. distribuir trabalho;
3. cobrar dependencias;
4. validar se o lote pode subir;
5. bloquear o que esta incoerente;
6. dar visibilidade do status geral.

## 4. Estrutura operacional recomendada

### Papel 1 - Orquestrador

Responsavel por:

- priorizacao;
- fila de lotes;
- aprovacao de entrada e saida;
- reuniao semanal;
- decisao de bloqueio.

### Papel 2 - Curador Normativo

Responsavel por:

- fonte oficial;
- aplicabilidade;
- fundamento legal;
- evidencia esperada;
- criterio de revisao.

### Papel 3 - Analista de Estruturacao

Responsavel por:

- transformar fonte em dado;
- preencher planilhas;
- padronizar chaves;
- montar o lote.

### Papel 4 - Operador de Carga

Responsavel por:

- validar estrutura;
- executar importacao;
- registrar erros;
- devolver relatorio de carga.

### Papel 5 - Homologador Funcional

Responsavel por:

- conferir amostra no sistema;
- validar aderencia operacional;
- aprovar lote para uso.

## 5. Pipeline operacional

Cada lote deve passar por 7 estados:

1. `BACKLOG`
2. `EM_CURADORIA`
3. `EM_ESTRUTURACAO`
4. `EM_VALIDACAO`
5. `PRONTO_PARA_CARGA`
6. `EM_HOMOLOGACAO`
7. `CONCLUIDO`

Estados de excecao:

- `BLOQUEADO_FONTE`
- `BLOQUEADO_DADO`
- `BLOQUEADO_TECNICO`
- `REJEITADO`

## 6. Regra de passagem entre estados

### BACKLOG -> EM_CURADORIA

Quando:

- o lote foi priorizado;
- existe dono funcional;
- existe fonte minima disponivel.

### EM_CURADORIA -> EM_ESTRUTURACAO

Quando:

- a fonte foi lida;
- a regra foi resumida;
- existe entendimento suficiente da aplicabilidade.

### EM_ESTRUTURACAO -> EM_VALIDACAO

Quando:

- a planilha foi preenchida;
- as chaves de negocio estao consistentes;
- nao ha lacuna impeditiva conhecida.

### EM_VALIDACAO -> PRONTO_PARA_CARGA

Quando:

- passou na revisao funcional;
- passou na validacao estrutural;
- dependencias anteriores ja foram carregadas.

### PRONTO_PARA_CARGA -> EM_HOMOLOGACAO

Quando:

- a importacao rodou;
- existe relatorio de carga;
- nao houve erro bloqueante.

### EM_HOMOLOGACAO -> CONCLUIDO

Quando:

- amostra funcional esta correta;
- o coordenador aprovou;
- o lote esta auditavel.

## 7. Lotes recomendados

### Lote 1 - Base normativa mestre

Arquivos:

- `01_orgaos_reguladores.csv`
- `02_tipos_documento.csv`
- `03_tipos_processo.csv`
- `04_fases_tipo_processo.csv`
- `05_requisitos_tipo_processo.csv`
- `06_obrigacoes_regulatorias.csv`
- `07_limites_parametros.csv`

Objetivo:

- fazer o sistema saber o que existe e o que deve ser exigido

### Lote 2 - Cadastro operacional base

Arquivos:

- `08_usuarios.csv`
- `09_empreendimentos.csv`
- `10_acessos_empreendimento.csv`

Objetivo:

- criar a estrutura de clientes, postos e acessos

### Lote 3 - Regulatorio por unidade

Arquivos:

- `11_processos_documentos.csv`
- `12_licencas_alvaras_condicionantes.csv`

Objetivo:

- colocar a carteira real no sistema

### Lote 4 - Operacao tecnica

Arquivos:

- `13_sst.csv`
- `14_equipamentos_residuos.csv`
- `15_outorga_monitoramento.csv`

Objetivo:

- espelhar a operacao tecnica e os riscos reais

## 8. Agentes no fluxo

## Agente A - Orquestrador

Entrada:

- backlog
- status dos lotes
- bloqueios

Saida:

- proximo lote priorizado
- responsavel por etapa
- prazo alvo
- estado atualizado

## Agente B - Curador de Fonte

Entrada:

- PDF, lei, portaria, licenca, condicionante

Saida:

- regra resumida
- aplicabilidade
- evidencias
- observacoes de risco

## Agente C - Estruturador de Planilha

Entrada:

- regra resumida
- templates CSV

Saida:

- planilha preenchida
- chaves normalizadas

## Agente D - Validador

Entrada:

- planilhas do lote

Saida:

- erros por linha
- inconsistencias
- status `apto` ou `bloqueado`

## Agente E - Auditor Pos-Carga

Entrada:

- planilha final
- relatorio de importacao
- sistema carregado

Saida:

- divergencias
- evidencias de homologacao

## 9. Rito semanal

Ritual recomendado:

### Segunda

- priorizacao do lote da semana
- distribuicao de trabalho

### Terca e quarta

- curadoria e estruturacao

### Quinta

- validacao e ajuste

### Sexta

- carga, homologacao e fechamento

## 10. Indicadores de controle

O orquestrador deve acompanhar:

1. lotes em aberto
2. lotes bloqueados
3. linhas com erro
4. tempo medio por lote
5. percentual de carga concluida por frente
6. percentual de campos faltantes por lote
7. divergencias encontradas na homologacao

## 11. Gatilhos de bloqueio

Bloquear lote quando:

1. nao houver fonte oficial identificada
2. houver conflito material entre fontes
3. a planilha estiver sem dono
4. houver dependencias nao carregadas
5. a carga gerar erro em chave critica
6. a amostra no sistema nao refletir a planilha

## 12. Gatilhos de simplificacao

Simplificar processo quando:

1. o lote for pequeno
2. o dado for claramente operacional e nao normativo
3. nao houver ambiguidade de regra
4. o impacto for local e reversivel

## 13. Sequencia recomendada para comecar

Semana 1:

- fechar `Lote 1`

Semana 2:

- fechar `Lote 2`

Semana 3:

- iniciar `Lote 3` para 1 empreendimento piloto

Semana 4:

- executar `Lote 4` do mesmo piloto

Depois disso:

- replicar o metodo para a carteira inteira

## 14. Regra final de orquestracao

Se houver duvida entre:

- subir rapido
- ou subir confiavel

o criterio deve ser:

- `subir confiavel`

Porque o custo de cadastrar dado mestre errado em sistema regulatorio e maior do que o custo de atrasar um lote alguns dias.
