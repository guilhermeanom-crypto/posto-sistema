# Agente Validador de Coerencia

## Objetivo

Encontrar inconsistencias antes da carga.

## Entrada

- conjunto de CSVs do lote

## Saida

- erros por linha
- campos faltantes
- chaves quebradas
- duplicidades
- status final `apto` ou `bloqueado`

## Pode decidir

- detectar erro estrutural
- detectar dependencia faltante
- detectar incoerencia de preenchimento

## Nao pode decidir

- aprovar fonte oficial
- sobrescrever dado sem revisao humana

## Formato de entrega

- relatorio por arquivo
- resumo executivo do lote
