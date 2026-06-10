# Módulo 1 — Licenças Ambientais

> **Padrão arquitetural definido**: Workflow Engine genérico (consumido também por M5, M6, M7, M8 partes).
> **Ancoragem**: `empreendimentoId` + `tenantId` em tudo.

## Decisão arquitetural nº1
Licença Ambiental deixa de ser entidade autônoma e passa a ser **projeção materializada** de um `Processo` cujo `TipoProcesso.categoria = LICENCIAMENTO_AMBIENTAL`. Entidades `LicencaAmbiental` e `CondicaoLicenca` legadas viram views sobre o modelo novo até deprecação.

**Motivo**: o fluxo real (LP→LI→LO→RADA→Renovação, com exigências, recursos, ARTs) é inerentemente um processo de múltiplas fases.

## Base normativa (essencial)

### Federal
- **Lei 6.938/1981** (PNMA) — institui licenciamento.
- **Resolução CONAMA 237/1997** — tipologia LP/LI/LO, prazos.
- **Resolução CONAMA 273/2000** — posto de combustível como atividade potencialmente poluidora.
- **Resolução CONAMA 319/2002** — comunicação de vazamento.
- **Resolução CONAMA 420/2009** — valores orientadores solo/água.
- **Lei Complementar 140/2011** — cooperação federativa.

### Estaduais (catálogo por UF)
- **SP/CETESB**: DD 038/2017, DD 033/2018, Portaria 175/2021.
- **MG/SEMAD**: DN COPAM 217/2017.
- **RJ/INEA**: NOP-INEA 36.
- **GO/SEMAD**: Resolução CONSEMA-GO 009/2017.

## Ciclo de vida (fase de uma licença)

```
PLANEJAMENTO → DOSSIE_EM_MONTAGEM → PROTOCOLADO → EM_ANALISE
  → (EXIGENCIA_ABERTA → EXIGENCIA_RESPONDIDA → EM_ANALISE)*
  → DEFERIDA | INDEFERIDA → (EM_RECURSO)? → EMITIDA → VIGENTE
  → (VENCENDO → EM_RENOVACAO) | VENCIDA | SUSPENSA | CASSADA
```

## Modelo de domínio (deltas)

```prisma
enum SubtipoLicenca {
  LP LI LO LO_RENOVACAO LO_DESATIVACAO LI_AMPLIACAO LAS LAU LO_CORRETIVA TCA
}

model NormaTipoProcesso {
  id String @id @default(uuid())
  tipoProcessoId String
  referencia String       // "CONAMA 273/2000 art. 5º"
  ementa String
  ufAplicavel String?     @db.Char(2)
  urlOficial String?
}

model ExigenciaProcesso {
  id String @id @default(uuid())
  processoId String
  origem String           // PARECER | OFICIO | NOTIFICACAO | AUDIENCIA | VISTORIA
  numeroDocumento String?
  dataRecebimento DateTime @db.Date
  prazoResposta DateTime  @db.Date
  status String           // ABERTA | RESPONDIDA | VENCIDA | ACEITA | REJEITADA
  descricao String
  documentoOrigemId String?
  documentoRespostaId String?
  respondidaEm DateTime?
}

model RecursoProcesso {
  id String @id @default(uuid())
  processoId String
  instancia String        // ADM_1INST | ADM_2INST | JUDICIAL
  protocoladoEm DateTime  @db.Date
  numeroProcesso String?
  status String
  documentoPeticaoId String?
  documentoDecisaoId String?
}

model DependenciaProcesso {
  processoId String
  processoPaiId String
  tipoDependencia String   // BLOQUEANTE | REFERENCIAL
  @@id([processoId, processoPaiId])
}

model EventoDiarioOficialProcesso {
  id String @id @default(uuid())
  processoId String
  eventoDOUId String
  tipoEvento String
  processadoEm DateTime?
  acaoSugerida String?
}

// Acrescentar a Processo:
//   subtipoLicenca, prazoLegalAnaliseDias, dataProtocoloRenovacao,
//   baseLegalSnapshot Json, valoresTaxas Json
// Acrescentar a Condicionante:
//   naturezaCondicionante (MONITORAMENTO | OBRA_ADEQUACAO | ...),
//   artRequerida, orgaoDestinatarioId
```

## Regras críticas

### Duras (bloqueio)
- **RD1**: não protocolar LO sem LI EMITIDA/VIGENTE (exceto regularização).
- **RD2**: não emitir LI sem LP VIGENTE.
- **RD3**: não fechar exigência sem documento de resposta.
- **RD4**: emissão exige nº, dataEmissao, dataVencimento e PDF.
- **RD5**: licença não pode estar VIGENTE com ART do RT vencida.
- **RD6**: condicionante OBRA_ADEQUACAO vencida bloqueia abertura de renovação.

### Moles (alerta)
- **RM1**: renovação não protocolada T-120 ⇒ alerta crítico.
- **RM2**: condicionante recorrente atrasada 2 ciclos ⇒ escala.
- **RM3**: 3+ exigências em um único ciclo ⇒ "processo problemático".

## Calendário gerado
1. Vencimento da licença (alertas T-180/T-90/T-60/T-30/T-15/T-7).
2. T-180: abertura de renovação ⇒ Tarefa.
3. Prazo de cada exigência − 7d.
4. RADA anual.
5. Cada `CicloCondicionante.periodoFim − diasAlertaAntes`.
6. ART do RT vencendo.

## Dependências cruzadas
- **M2 (SASC)**: laudo de estanqueidade satisfaz condicionante automaticamente.
- **M8 (Monitoramento)**: campanha satisfaz condicionante.
- **M5 (Fiscalizações)**: auto por descumprimento de condicionante vincula causa-raiz.
- **M11 (Checklists)**: alguns checklists são evidências de condicionante operacional.

## Casos de borda
- Vigência automática (CONAMA 237 §4º): renovação T-120 mantém vigência → estado `VIGENCIA_ESTENDIDA`.
- Regularização (LO Corretiva): aceitar sem LP/LI prévias com flag.
- Troca de órgão competente (LC 140): nova licença em outro órgão, histórico preservado.
- Mudança de RT durante o processo: registrar com data, anexar nova ART.
- Suspensão cautelar: estado SUSPENSA bloqueia operação.
- Cessação/desativação: investigação de passivo (CONAMA 420) + TCA.

## Perguntas abertas
1. UFs prioritárias no catálogo inicial.
2. Vigência estendida automática implementada na v1?
3. Engine OCR/IA para extração de metadados.
4. Portal externo (token p/ stakeholder/órgão) — escopo.
5. ART/RT como entidade dedicada com versionamento.
6. RADA: TipoProcesso separado ou atributo de LO?
7. Retenção legal — fixa em 5 anos ou configurável por UF.
