# Módulo 7 — Regulatório Urbano (Alvará / AVCB / Sanitária / Habite-se)

> Consome **Workflow Engine** (M1). Subtipos: ALVARA_FUNCIONAMENTO, ALVARA_OBRA, HABITE_SE, AVCB, CLCB, LICENCA_SANITARIA, CCM, CERTIDAO_USO_SOLO, ALVARA_PUBLICIDADE.

## Decisão arquitetural nº7
Cada subtipo é Processo no Workflow Engine. **Dependências cruzadas** modeladas via `DependenciaProcesso` (do M1): alvará exige AVCB + sanitária; AVCB exige brigada (M4) + projeto técnico CBM.

## Base normativa
- **Lei municipal** — Códigos de Posturas e Edificações.
- **IT do CBM estadual** — em SP: IT 17 (brigada), IT 27 (postos de combustível), IT 25 (incêndio em postos).
- **Lei 13.425/2017** — prevenção/combate incêndio.
- **Lei 6.437/1977** — VISA federal.
- **NR-23** (cruza M4).

## Modelo (deltas)

```prisma
enum SubtipoAlvaraUrbano { ALVARA_FUNCIONAMENTO ALVARA_OBRA HABITE_SE AVCB CLCB LICENCA_SANITARIA CCM CERTIDAO_USO_SOLO ALVARA_PUBLICIDADE }

model AlvaraUrbanoV2 {
  id String @id; empreendimentoId String
  subtipo SubtipoAlvaraUrbano
  processoId String                 // FK Processo (M1)
  numeroAlvara String?
  orgaoEmissor String
  dataEmissao DateTime? @db.Date; dataVencimento DateTime? @db.Date
  status String                     // VIGENTE | VENCIDO | EM_RENOVACAO | SUSPENSO
  classificacaoCBM String?          // IT 27 — Memorial X
  documentoPrincipalId String?
  exigenciasAtivas Json?
}

model VistoriaUrbana {
  id String @id; alvaraId String
  tipoVistoria String               // INICIAL | RENOVACAO | DENUNCIA | EVENTUAL
  dataAgendada DateTime? @db.Date; dataExecucao DateTime? @db.Date
  resultado String?                 // APROVADA | REPROVADA | EXIGENCIA
  vistoriadorNome String?
  documentoLaudoId String?
  achados Json?
}

model ProjetoTecnicoCBM {
  id String @id; empreendimentoId String
  alvaraAVCBId String?
  numeroProtocolo String?
  responsavelTecnicoNome String; responsavelTecnicoCREA String
  numeroART String
  classificacaoIT String?           // IT-27 (combustível)
  ocupacao String?                  // grupo edificação
  areaConstruidaM2 Decimal? @db.Decimal(10,2)
  saidasEmergencia Int?; hidrantesQtd Int?; extintoresQtd Int?
  documentoProjetoId String?
  status String                     // EM_ELABORACAO | APROVADO | EXIGENCIA | REPROVADO
}
```

## Regras críticas
- **RD1**: AVCB vencido bloqueia renovação de Alvará Funcionamento.
- **RD2**: Brigada (M4) com nº < mínimo IT ⇒ AVCB em risco; alerta cruzado.
- **RD3**: Licença Sanitária vencida ⇒ alerta crítico (VISA pode interditar).
- **RM1**: IT-27 atualizada (revisão norma) ⇒ alerta para revisar projeto técnico.

## Dependências cruzadas
- **M4 (SST)**: brigada + treinamentos NR-23.
- **M2 (Estanqueidade)**: AVCB exige sistema de detecção/combate adequado.
- **M1 (Licenças)**: alguns municípios condicionam alvará à LO vigente.

## Migração legado
`AlvaraUrbanistico` → `AlvaraUrbanoV2`.

## Casos de borda
- Posto antigo sem CCM ou Habite-se: regularização posterior, processo retroativo.
- Município sem CBM próprio: vistoria pelo CBM regional.
- Letreiro publicitário: alvará separado.
- Posto duplo (combustível + GNV): pode exigir AVCB classe diferente.

## Perguntas abertas
1. Catálogo IT por estado (SP/MG/RJ/GO inicial)?
2. Integração com portais municipais — escopo?
3. Bombeiros: tabela de prazos configurável por região?
