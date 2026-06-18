# 110. Tema do Primeiro Piloto Controlado - Goias e Goiania

Data: 2026-06-11

## 1. Tema escolhido

Primeiro piloto:

- `licenciamento ambiental estadual de posto revendedor em Goias`

Contexto operacional:

- `1 empreendimento piloto em Goiania`

## 2. O que isso significa na pratica

Neste primeiro momento:

- `Goias` entra como camada normativa principal
- `Goiania` entra como contexto do posto piloto e da homologacao operacional

Neste primeiro momento nao entra:

- regulacao municipal detalhada de Goiania como base mestre ativa

Motivo:

- a camada estadual ja permite validar metodo, lotes, importacao e homologacao
- incluir a camada municipal antes de fechar a trilha oficial aumentaria retrabalho

## 3. Fontes oficiais minimas do piloto

Base primaria ja validada para a primeira tentativa:

1. `LC 140/2011`
2. `Resolucao CONAMA 237/1997`
3. `Resolucao CONAMA 273/2000`
4. `Lei 20.694/2019` do Estado de Goias

Base oficial de apoio:

1. detalhe oficial da `Lei 20.694/2019` no portal de legislacao de Goias
2. publicacao institucional oficial sobre o decreto regulamentador da lei

## 4. O que o piloto consegue provar

Se este piloto funcionar, ele prova que o sistema consegue:

1. carregar base normativa federal + estadual sem depender de banco separado
2. vincular orgao, processo, fase, requisito e obrigacao ao recorte real da operacao
3. receber um dossie real de um posto em Goiania
4. refletir licenca, validade e condicionantes no sistema com rastreabilidade

## 5. O que ainda nao estamos tentando provar

Ainda nao estamos tentando provar:

1. cobertura completa de todas as obrigacoes do posto
2. consolidacao municipal de Goiania
3. automacao plena de agentes sem revisao humana
4. escala para a carteira inteira

## 6. Arquivos que entram primeiro

Prioridade imediata:

1. `17_fontes_oficiais.csv`
2. `01_orgaos_reguladores.csv`
3. `02_tipos_documento.csv`
4. `03_tipos_processo.csv`
5. `04_fases_tipo_processo.csv`
6. `05_requisitos_tipo_processo.csv`
7. `06_obrigacoes_regulatorias.csv`

Depois:

1. `09_empreendimentos.csv`
2. `11_processos_documentos.csv`
3. `12_licencas_alvaras_condicionantes.csv`

## 7. Regra operacional do piloto

Para o primeiro lote:

- so entra o que tiver `fonte oficial rastreavel`
- se a validade depender do ato concreto, o campo deve ficar dependente do `ato emitido`
- se houver duvida entre regra generica e licenca real, prevalece a `licenca real`

## 8. Proxima expansao recomendada

Depois de homologar este piloto:

1. fechar a camada municipal de Goiania
2. adicionar `ANP`
3. adicionar `bombeiros`
4. adicionar `SST`
5. replicar o metodo para outros municipios e outros postos
