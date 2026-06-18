# 107. Contrato do Modulo de Importacoes

Data: 2026-06-11

## 1. Objetivo

Definir o comportamento minimo do futuro modulo `importacoes` para reduzir retrabalho no primeiro ambiente controlado.

## 2. Capacidades obrigatorias

O modulo deve suportar:

1. validacao sem escrita (`dry-run`)
2. importacao controlada
3. relatorio por linha
4. auditoria de lote
5. reexecucao idempotente
6. bloqueio por dependencia

## 3. Endpoints mínimos

### `POST /api/v1/importacoes/validar`

Entrada:

- identificacao do lote
- frente
- arquivo CSV

Saida:

- linhas validas
- linhas com erro
- erros por coluna
- status geral: `APTO`, `APTO_COM_RESSALVAS`, `BLOQUEADO`

### `POST /api/v1/importacoes/executar`

Entrada:

- identificacao do lote validado
- arquivo CSV
- modo de execucao

Modos:

- `DRY_RUN`
- `EXECUCAO_REAL`

Saida:

- total processado
- criados
- atualizados
- ignorados
- bloqueados
- erros
- `importacao_id`

### `GET /api/v1/importacoes/:importacaoId`

Saida:

- resumo do lote
- status
- timestamps
- operador
- frente

### `GET /api/v1/importacoes/:importacaoId/erros`

Saida:

- linha
- coluna
- codigo_erro
- mensagem
- sugestao

## 4. Regras de comportamento

### Regra 1 - Nao escrever sem validacao

Nenhum lote executa em modo real sem:

- validacao previa
- status diferente de `BLOQUEADO`

### Regra 2 - Dependencia quebrada bloqueia

Se a linha depender de chave nao carregada:

- a linha deve ser bloqueada
- o erro deve ser explicitado

### Regra 3 - Idempotencia obrigatoria

Rodar o mesmo lote duas vezes nao pode duplicar registros.

### Regra 4 - Sem atualizacao silenciosa de base critica

Para base normativa mestre:

- se houver alteracao de conteudo sensivel, registrar como `ATUALIZADO`
- exigir trilha de auditoria

### Regra 5 - Erro parcial controlado

No piloto controlado:

- permitir erro parcial por linha
- desde que o relatorio deixe claro o que ficou de fora

## 5. Permissoes recomendadas

Podem validar:

- `ADMIN_TENANT`
- `COORDENADOR`
- operador tecnico autorizado

Podem executar carga real:

- `ADMIN_TENANT`
- operador tecnico autorizado

Nao podem executar carga real:

- `ANALISTA`
- `REPRESENTANTE_POSTO`
- `ANALISTA_CAMPO`

## 6. Auditoria minima

Registrar:

- lote
- arquivo
- hash do arquivo
- usuario executor
- data/hora
- frente
- total de linhas
- total importado
- total com erro
- resumo de alteracoes

## 7. Estados da importacao

- `RECEBIDA`
- `VALIDANDO`
- `BLOQUEADA`
- `VALIDADA`
- `EXECUTANDO`
- `CONCLUIDA`
- `CONCLUIDA_COM_ERROS`
- `FALHOU`

## 8. Criterio de pronto para o piloto

O modulo esta suficiente para o primeiro ambiente controlado quando:

1. validar um CSV sem escrever
2. devolver erro por linha
3. executar carga idempotente
4. registrar auditoria
5. bloquear dependencia quebrada
