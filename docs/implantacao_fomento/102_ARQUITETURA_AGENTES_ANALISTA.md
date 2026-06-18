# 102. Arquitetura de Agentes para Apoio ao Analista

Data: 2026-06-11

## 1. Resposta curta

Sim, voce consegue criar agentes para executar boa parte dessa frente.

Mas o modelo certo nao e:

- `agente decidindo regra legal sozinho`

O modelo certo e:

- `agente preparando, organizando, cruzando, validando e sugerindo`
- `humano aprovando o que vira regra oficial`

Ou seja:

os agentes funcionam muito bem como **analistas assistentes**, e nao como **autoridade normativa final**.

## 2. O que um agente pode fazer bem

Um agente pode:

1. ler documentos oficiais e extrair campos estruturados;
2. sugerir obrigacoes, prazos, evidencias e classificacoes;
3. comparar licenca x condicionante x documento x sistema;
4. montar rascunho das planilhas controladas;
5. apontar lacunas, duplicidades e inconsistencias;
6. gerar relatorio de qualidade da base;
7. ajudar a montar lote de importacao;
8. revisar se a carga bate com o schema.

## 3. O que um agente nao deve decidir sozinho

Nao deve decidir sozinho:

1. interpretacao juridica final;
2. aplicabilidade normativa controversa;
3. prazo legal quando houver conflito entre fontes;
4. substituicao de responsavel tecnico;
5. aprovacao final da base oficial;
6. dispensa de obrigacao;
7. conclusao de conformidade sem revisao humana.

## 4. Modelo recomendado

O melhor desenho para o seu caso e uma **equipe de agentes especializados**.

Nao um agente unico fazendo tudo.

## 5. Agentes recomendados

## Agente 1 - Curador de Fonte Oficial

Funcao:

- ler lei, resolucao, portaria, licenca, condicionante, termo de referencia e checklist tecnico;
- extrair:
  - orgao
  - fundamento legal
  - obrigacao
  - periodicidade
  - documento comprobatório
  - prazo
  - observacoes

Saida:

- rascunho de `06_obrigacoes_regulatorias.csv`
- rascunho de `02_tipos_documento.csv`
- rascunho de `03_tipos_processo.csv`

Humano valida:

- `COORDENADOR`

## Agente 2 - Estruturador de Planilha Mestra

Funcao:

- pegar documentos, relatorios e PDFs;
- transformar em linhas padronizadas nas planilhas-mestras;
- normalizar datas, nomes, status, siglas e chaves de negocio.

Saida:

- preenchimento inicial dos CSVs de implantacao

Humano valida:

- `ANALISTA`

## Agente 3 - Validador de Coerencia

Funcao:

- cruzar planilhas e apontar:
  - campos faltantes
  - duplicidade
  - status incoerente
  - vencimento sem documento
  - documento sem tipo
  - processo sem orgao
  - empreendimento sem empresa

Saida:

- relatorio de erro por linha
- checklist de inconsistencias

Humano valida:

- `ANALISTA` ou `ADMIN_TENANT`

## Agente 4 - Analista de Dossie por Empreendimento

Funcao:

- olhar um posto por vez;
- comparar:
  - licencas
  - alvaras
  - condicionantes
  - processos
  - documentos
  - SST
  - SASC
  - residuos
  - agua/outorga

Saida:

- dossie estruturado do empreendimento
- sugestao de preenchimento dos lotes operacionais
- lista de lacunas

Humano valida:

- `ANALISTA`

## Agente 5 - Revisor de Importacao

Funcao:

- verificar se a planilha esta pronta para importacao;
- checar formato;
- checar ordem de carga;
- identificar dependencia quebrada.

Saida:

- status `pronto para importar` ou `bloqueado`

Humano valida:

- tecnologia ou operador de carga

## Agente 6 - Auditor de Base Carregada

Funcao:

- depois da carga, comparar:
  - planilha
  - banco
  - tela do sistema
  - regra esperada

Saida:

- relatorio de divergencia pos-carga
- amostra de conferência

Humano valida:

- `COORDENADOR`

## 6. Como isso funcionaria na pratica

Fluxo recomendado:

1. voce entrega os documentos-fonte para o `Agente Curador`
2. ele devolve a matriz estruturada
3. o `Agente Estruturador` converte para CSV
4. o `Agente Validador` revisa coerencia
5. voce ou o coordenador aprovam
6. o `Agente Revisor de Importacao` confere o lote
7. o sistema importa
8. o `Agente Auditor` revisa o resultado

## 7. O que isso substitui no trabalho manual

Substitui muito bem:

- copiar e colar de PDF para planilha
- leitura repetitiva
- classificacao inicial
- identificacao de lacunas
- saneamento basico
- pre-validacao de carga

Nao substitui:

- julgamento tecnico final
- criterio juridico final
- aprovacao de obrigacao oficial

## 8. Vale a pena no seu caso?

Sim, especialmente porque o seu problema tem estas caracteristicas:

1. muito documento
2. muita repeticao
3. muita estrutura semantica
4. muita necessidade de padronizacao
5. necessidade de transformar texto em dado

Esse e exatamente o tipo de trabalho em que agentes ajudam bastante.

## 9. O que e melhor agora: agentes ou pessoas?

Resposta honesta:

- nao e `agentes ou pessoas`
- e `agentes para multiplicar pessoas`

Se hoje um analista levaria horas para:

- ler uma licenca
- extrair condicionantes
- montar planilha
- comparar com base existente

um conjunto de agentes pode reduzir isso para:

- pre-processamento rapido
- triagem
- sugestao estruturada
- revisao humana focada

## 10. Desenho minimo viavel

Se voce quiser começar sem exagero, eu recomendaria `3 agentes`:

1. `Agente Curador de Fonte`
2. `Agente Estruturador de Planilha`
3. `Agente Validador de Coerencia`

Com esses tres, voce ja ganha muita velocidade.

## 11. Desenho ideal para segunda fase

Depois, expandir para `6 agentes`:

1. curador de fonte
2. estruturador de planilha
3. validador de coerencia
4. analista de dossie por posto
5. revisor de importacao
6. auditor pos-carga

## 12. Onde esses agentes podem rodar

Tres caminhos possiveis:

### Opcao A - Fora do sistema, como operacao assistida

Mais rapido para começar.

Agentes recebem:

- PDFs
- planilhas
- lotes CSV

E devolvem:

- planilhas preenchidas
- relatorios
- pendencias

Vantagem:

- mais simples
- menor risco
- mais rapido para validar metodo

### Opcao B - Semi-integrado ao sistema

Agentes leem dados exportados do sistema e devolvem artefatos de carga.

Vantagem:

- melhor integracao operacional
- ainda sem mexer profundamente no core

### Opcao C - Totalmente integrado ao sistema

Mais robusto, mas mais caro.

Agentes viram modulos do produto com:

- upload de fonte
- extração estruturada
- sugestao de cadastro
- aprovacao
- importacao
- auditoria

Essa e a melhor visao de futuro, mas nao precisa ser o primeiro passo.

## 13. Minha recomendacao direta

Para o nivel atual do sistema:

- comecar com `Opcao A` ou `Opcao B`
- nao comecar direto com `Opcao C`

Traduzindo:

- crie agentes para apoiar o analista agora;
- valide o metodo com casos reais;
- so depois embedar isso profundamente no sistema.

## 14. Estrutura de comando

Se voce quiser usar agentes de forma madura, cada agente deve receber:

1. objetivo claro
2. escopo limitado
3. modelo de saida padronizado
4. lista do que ele pode decidir
5. lista do que ele nao pode decidir
6. criterio de confianca

Exemplo:

- se confianca < 85%, marcar como `revisao humana obrigatoria`

## 15. Conclusao pratica

Sim, voce consegue criar agentes para fazer essa parte por voce como analista.

O uso correto e:

- agente como preparador
- agente como validador
- agente como auditor

E nao:

- agente como dono da regra legal

Se fizer assim, isso nao e moda. Isso e uma boa arquitetura operacional para acelerar a consolidacao da base sem perder controle.
