# 106. Critérios de Vigencia, Autenticidade e Confianca

Data: 2026-06-11

## 1. Objetivo

Criar filtros operacionais para evitar:

- informacao falsa;
- norma revogada;
- norma substituida;
- documento nao oficial;
- interpretacao sem lastro.

## 2. Regra de ouro

Nada entra como base oficial se nao for:

1. **identificado**
2. **rastreavel**
3. **vigente**
4. **aplicavel**
5. **revisado**

## 3. Teste de vigencia normativa

Toda fonte normativa deve passar por estes campos obrigatorios:

1. `fonte_identificada`
2. `orgao_emissor`
3. `numero_ato`
4. `data_publicacao`
5. `status_vigencia`
6. `data_ultima_revisao`
7. `revisor_responsavel`

Status permitidos:

- `VIGENTE`
- `ALTERADA`
- `REVOGADA`
- `SUBSTITUIDA`
- `DUVIDOSA`

Somente `VIGENTE` pode entrar como base oficial ativa.

## 4. Teste de autenticidade documental

Todo documento usado como evidencia deve ser classificado como:

- `OFICIAL_PRIMARIO`
- `COPIA_CONFIRMADA`
- `NAO_CONFIRMADO`

### Considerar `OFICIAL_PRIMARIO`

Quando houver:

- emissao pelo orgao competente;
- portal oficial;
- diario oficial;
- documento administrativo identificavel;
- assinatura/elementos de autenticidade verificaveis.

### Considerar `COPIA_CONFIRMADA`

Quando:

- o cliente enviou copia
- e a equipe confirmou correspondencia com referencia oficial ou dado confiavel

### Considerar `NAO_CONFIRMADO`

Quando:

- e print solto
- e PDF sem lastro
- e texto sem origem oficial
- e documento sem dados minimos

`NAO_CONFIRMADO` nao deve alimentar base mestre oficial.

## 5. Teste de aplicabilidade

Mesmo fonte vigente pode ser inaplicavel.

Antes de usar, confirmar:

1. orgao correto
2. territorio correto
3. tipo de empreendimento correto
4. rito/processo correto
5. momento correto

Se qualquer item falhar:

- marcar `NAO_APLICAVEL`
- nao usar como regra ativa do caso

## 6. Score de confianca para agentes

Padrao recomendado:

- `>= 95%`: sugestao forte, ainda exige revisao humana simples
- `85% a 94%`: revisao humana obrigatoria
- `< 85%`: bloqueado para consolidacao automatica

## 7. Gatilhos automáticos de bloqueio

Bloquear automaticamente quando:

1. a fonte nao tiver orgao/numero/data
2. a vigencia nao estiver confirmada
3. o agente citar fundamento sem apontar origem
4. houver conflito entre duas fontes oficiais
5. o documento estiver ilegivel ou incompleto
6. a regra inferida depender de suposicao nao demonstrada

## 8. Gatilhos de escalonamento humano

Escalonar para `COORDENADOR` quando:

1. a norma estiver alterada ou substituida
2. houver conflito entre exigencia geral e condicionante concreta
3. o agente trouxer confianca abaixo de 95%
4. o cliente trouxer documento sem autenticidade clara
5. houver impacto em prazo, obrigatoriedade ou evidência exigida

## 9. Evidencias minimas por linha consolidada

Cada linha da base normativa deve apontar para:

1. `source_id`
2. `titulo_fonte`
3. `orgao`
4. `numero_ato`
5. `data_publicacao`
6. `status_vigencia`
7. `resumo_curado`
8. `revisor`
9. `data_revisao`

## 10. Regra final

Se a equipe nao conseguir provar:

- origem
- vigencia
- aplicabilidade

o dado nao entra como oficial.
