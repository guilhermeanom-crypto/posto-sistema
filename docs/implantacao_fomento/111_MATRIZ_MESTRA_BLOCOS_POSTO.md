# 111. Matriz Mestra por Blocos - Posto Revendedor

Data: 2026-06-11

## 1. Objetivo

Mapear a operacao real de um `posto revendedor` em blocos corretos, separando:

- o que e `nucleo obrigatorio`;
- o que e `condicional por perfil do posto`;
- o que e `bloco sistemico de execucao`;
- o que ja esta minimamente validado;
- o que ainda depende de curadoria oficial detalhada.

## 2. Regra de leitura

### Natureza

- `NUCLEO`: bloco que tende a existir na maioria dos postos
- `CONDICIONAL`: bloco que depende de caracteristica concreta da unidade
- `SISTEMICO`: bloco que organiza a operacao e o sistema, mas deriva dos outros

### Status de mapeamento

- `VALIDADO_MINIMO`: ja existe trilha oficial minima para iniciar consolidacao
- `PARCIAL`: bloco identificado e coerente, mas ainda precisa fechar normas ou servicos especificos
- `PENDENTE_DETALHAMENTO`: bloco correto, mas a curadoria oficial ainda nao foi fechada em nivel executavel

## 3. Matriz Mestra

| Bloco | Nome | Natureza | O que cobre | Aplica quando | Orgao principal | Fontes oficiais base | Modelado no sistema | CSVs principais | Status |
|---|---|---|---|---|---|---|---|---|---|
| `B00` | Governanca da base oficial | `NUCLEO` | fontes, vigencia, autenticidade, precedencia normativa, revisao | sempre | coordenacao regulatoria + orgao emissor da norma | Planalto, CONAMA, legisla.casacivil.go.gov.br, portais oficiais dos orgaos | `SIM` | `17`, `00`, `16` | `VALIDADO_MINIMO` |
| `B01` | Licenciamento ambiental estadual | `NUCLEO` | competencia, rito, licenca, renovacao, regularizacao | sempre | `SEMAD/GO` | `LC 140/2011`, `CONAMA 237/1997`, `CONAMA 273/2000`, `Lei 20.694/2019` | `SIM` | `01` a `06`, `11`, `12`, `17` | `VALIDADO_MINIMO` |
| `B02` | Dossie ambiental por unidade | `NUCLEO` | processo real, licenca emitida, anexos, condicionantes, evidencias | sempre | `SEMAD/GO` + ato concreto do posto | licenca emitida, processo administrativo, condicionantes, documentos anexos | `SIM` | `09`, `11`, `12` | `VALIDADO_MINIMO` |
| `B03` | Regulatorio urbano e funcionamento | `NUCLEO` | alvara, uso do solo, habite-se, certidoes municipais, publicidade, funcionamento | quase sempre | `Prefeitura de Goiania` | portal oficial `goiania.go.gov.br` e legislacao/servicos municipais especificos | `SIM` | `12`, `17` | `PENDENTE_DETALHAMENTO` |
| `B04` | Bombeiros e seguranca contra incendio | `NUCLEO` | `AVCB`, PPCI, exigencias de brigada e prevencao | quase sempre | `CBMGO` | portal oficial `bombeiros.go.gov.br` + normas e instrucoes tecnicas do Corpo de Bombeiros | `SIM` | `12`, `13`, `17` | `PARCIAL` |
| `B05` | ANP cadastral e autorizacao de revenda | `NUCLEO` | autorizacao da atividade, bandeira, alteracoes cadastrais, rotina setorial ANP | sempre | `ANP` | portal oficial `gov.br/anp` + atos oficiais ANP aplicaveis a revenda varejista | `SIM` | `02`, `06`, `11`, `17` | `PARCIAL` |
| `B06` | INMETRO e metrologia legal | `NUCLEO` | verificacoes de bombas, medicao, lacres, conformidade metrologica | sempre | `INMETRO` + rede estadual delegada | portal oficial `gov.br/inmetro` + orgao executor estadual | `SIM` | `14`, `17` | `PARCIAL` |
| `B07` | SASC, tanques e estanqueidade | `NUCLEO` | tanques, linhas, testes, historico tecnico, risco de vazamento | sempre | orgao ambiental + empresas/labs habilitados | licenca ambiental, normas tecnicas de referencia e laudos oficiais do sistema instalado | `SIM` | `14`, `12`, `17` | `PARCIAL` |
| `B08` | Residuos, PGRS, MTR e destinacao | `NUCLEO` | PGRS, transportadoras, MTR, comprovantes de destinacao, OLUC e residuos correlatos | sempre | MMA/SINIR + orgao ambiental competente | `Lei 12.305/2010`, `Decreto 10.936/2022`, `mtr.sinir.gov.br`, atos ambientais aplicaveis | `SIM` | `14`, `17`, `06` | `PARCIAL` |
| `B09` | SST e saude ocupacional | `NUCLEO` | PGR, PCMSO, ASO, treinamentos, EPI, NR-20 e correlatas | sempre com empregados | `MTE` + medico/engenheiro responsavel | portal oficial do Trabalho e Emprego + normas regulamentadoras aplicaveis | `SIM` | `13`, `17`, `06` | `PARCIAL` |
| `B10` | Fiscalizacoes, autos e defesa | `NUCLEO` | autos, notificacoes, defesa, recursos, resultados e causa-raiz | quando houver fiscalizacao | orgao autuante concreto | processo administrativo do orgao fiscalizador, portal oficial e ato lavrado | `SIM` | `11`, `12`, `17` | `PARCIAL` |
| `B11` | Agua, poco e outorga | `CONDICIONAL` | captacao propria, outorga, laudos de agua, dispensa, vigencia | quando o posto tem poco ou captacao propria | `SEMAD/GO` ou autoridade hidrica competente | portal oficial estadual e atos concretos de outorga/dispensa | `SIM` | `15`, `17`, `07` | `PARCIAL` |
| `B12` | Monitoramento ambiental e passivo | `CONDICIONAL` | pocos de monitoramento, campanhas, parametros, investigacao e remediacao | quando houver passivo, exigencia de licenca ou condicionante | orgao ambiental competente + laboratorio | licenca concreta, condicionantes, laudos e parametros oficiais | `SIM` | `15`, `07`, `12`, `17` | `PARCIAL` |
| `B13` | Vigilancia sanitaria e conveniencia | `CONDICIONAL` | licenca sanitaria, exigencias para loja, alimentos, manipulacao e consumo | quando houver loja/conveniencia/servico sujeito a sanitaria | municipio e/ou vigilancia competente | portal municipal e servicos especificos de vigilancia sanitaria | `SIM` | `12`, `17` | `PENDENTE_DETALHAMENTO` |
| `B14` | Operacao de campo e POPs | `SISTEMICO` | checklists, rotinas diarias, evidencias, inspecoes internas, aderencia operacional | sempre | operacao interna com base na norma oficial | POP interno + obrigacoes oficiais por bloco | `SIM` | `11`, `13`, `14`, `15` | `PARCIAL` |
| `B15` | Regras automaticas, score e portal | `SISTEMICO` | alertas, vencimentos, gap analysis, score, portal e intake documental | sempre, depois da base consolidada | sistema interno alimentado pelos blocos anteriores | deriva dos blocos `B01` a `B14` | `SIM` | `06`, `07`, `11` a `17` | `PENDENTE_DETALHAMENTO` |

## 4. Leitura executiva

Para `posto revendedor`, o mapeamento correto nao e uma lista solta de documentos.

Ele precisa ser lido em `4 camadas`:

1. `base mestre normativa`
2. `blocos regulatorios nucleo`
3. `blocos condicionais por perfil da unidade`
4. `blocos sistemicos de operacao e automacao`

## 5. Ordem recomendada de consolidacao

### Fase 1 - Base mestre

1. `B00`
2. `B01`
3. `B02`

### Fase 2 - Go-live regulatorio do posto

1. `B03`
2. `B04`
3. `B05`
4. `B06`
5. `B07`
6. `B08`
7. `B09`

### Fase 3 - Blocos condicionais

1. `B11`
2. `B12`
3. `B13`

### Fase 4 - Sustentacao e escala

1. `B10`
2. `B14`
3. `B15`

## 6. O que entra primeiro em Goias e Goiania

Se a meta for sair do abstrato e montar a primeira matriz executavel para `posto em Goias/Goiania`, o pacote inicial deve ser:

1. `B00`
2. `B01`
3. `B02`
4. `B03`
5. `B04`
6. `B05`
7. `B06`
8. `B07`
9. `B08`
10. `B09`

Os blocos `B11`, `B12` e `B13` so entram como obrigatorios se o posto concreto realmente tiver:

- captacao propria de agua;
- passivo/monitoramento exigido;
- atividade sujeita a sanitaria especifica.

## 7. Conclusao pratica

O mapeamento completo do `posto` nao e um unico processo.

Ele e um `programa de consolidacao por blocos`.

O jeito correto de operar e:

- consolidar cada bloco;
- marcar o nivel de confianca da fonte;
- vincular cada bloco ao CSV certo;
- e so depois transformar isso em carga real no sistema.

## 8. Fontes oficiais-base validadas nesta rodada

- `Planalto` - `LC 140/2011`
- `CONAMA` - `237/1997` e `273/2000`
- `Casa Civil GO` - `Lei 20.694/2019`
- `gov.br/anp` - portal oficial institucional da ANP
- `gov.br/inmetro` - portal oficial institucional do Inmetro
- `bombeiros.go.gov.br` - portal oficial do Corpo de Bombeiros Militar do Estado de Goias
- `mtr.sinir.gov.br` - portal oficial do MTR
- `goiania.go.gov.br` - portal oficial municipal, ainda pendente de curadoria por servico especifico
