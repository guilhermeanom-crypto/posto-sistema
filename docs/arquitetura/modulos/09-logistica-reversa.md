# Módulo 9 — Logística Reversa (MTR / CDF / SINIR / SIGOR)

> **Padrão**: conciliação de pares (MTR↔CDF) — herda do M3.

## Decisão arquitetural nº9
- **MTR** (saída/descarte) e **CDF** (chegada/destinação) são **par obrigatório**.
- MTR órfão (sem CDF em 60d) é não-conformidade.
- **Destinador** entidade dedicada com licenças vigentes (bloqueio se vencida).

## Base normativa
- **Lei 12.305/2010** + **Decreto 10.936/2022** — PNRS.
- **CONAMA 362/2005** — OLUC (óleo lubrificante usado).
- **Resolução ANP 19/2009** — coleta OLUC.
- **CONAMA 416/2009** — pneus inservíveis.
- **Portaria MMA 280/2020** — MTR Federal obrigatório.
- **SIGOR-SP** (CETESB), **MTR-MG** (FEAM), **SisRJ** (INEA).
- **NBR 13221** — transporte de resíduos.

## Modelo (deltas)

```prisma
enum TipoResiduoPosto {
  OLUC EMBALAGEM_OLEO_USADO FILTRO_OLEO FILTRO_AR FILTRO_COMBUSTIVEL
  ESTOPA_CONTAMINADA AGUA_OLEOSA_SAO LODO_SAO PNEU_INSERVIVEL
  BATERIA_AUTOMOTIVA EPI_DESCARTAVEL LAMPADA_FLUORESCENTE
  RESIDUO_VARRICAO_PISTA EFLUENTE_SANITARIO OUTROS
}

enum TecnologiaDestinacao {
  RERREFINO COPROCESSAMENTO RECICLAGEM REUSO
  TRATAMENTO_QUIMICO TRATAMENTO_BIOLOGICO INCINERACAO
  ATERRO_INDUSTRIAL_CLASSE_I ATERRO_INDUSTRIAL_CLASSE_II
}

model Destinador {
  id String @id; cnpj String; razaoSocial String
  uf String @db.Char(2)
  tecnologias TecnologiaDestinacao[]
  residuosAceitos TipoResiduoPosto[]
  licencaAmbientalNumero String?; licencaValidade DateTime? @db.Date
  documentoLicencaId String?
  cadastroSINIR String?
  ativo Boolean
}

// Transportadora (já existe) ganha: cadastroSINIR, tiposResiduoAutorizados

model MTRV2 {
  id String @id; empreendimentoId String
  numeroMTR String                   // gerado pelo SINIR/SIGOR
  numeroSistemaOrgao String?
  sistemaOrigem String               // SINIR | SIGOR | MTR-MG | MANUAL
  transportadoraId String; destinadorPrevistoId String?
  dataEmissao DateTime @db.Date; dataColeta DateTime? @db.Date
  status String                      // EMITIDO | EM_TRANSITO | RECEBIDO | CDF_PENDENTE | CONCILIADO | VENCIDO_SEM_CDF
  documentoMTRId String?
  pgrsVinculoId String?              // qual PGRS vigente
}

model MTRItem {
  id String @id; mtrId String
  tipoResiduo TipoResiduoPosto
  classeABNT String?                 // I | IIA | IIB
  quantidade Decimal @db.Decimal(12,3); unidade String
  acondicionamento String?           // BOMBONA | TAMBOR | BIG_BAG | A_GRANEL
  origemModulo String?               // SAO | MANUTENCAO | LOJA
}

model CDF {
  id String @id; mtrId String; destinadorId String
  numeroCDF String
  dataRecebimento DateTime @db.Date
  dataDestinacaoFinal DateTime? @db.Date
  tecnologiaUsada TecnologiaDestinacao
  quantidadeRecebida Decimal @db.Decimal(12,3)
  documentoCDFId String?
}

model EstoqueTemporarioResiduo {
  id String @id; empreendimentoId String
  tipoResiduo TipoResiduoPosto
  quantidadeAtual Decimal @db.Decimal(12,3); unidade String
  capacidadeMaximaArmazenamento Decimal? @db.Decimal(12,3)
  diasArmazenadosLimite Int?         // CONAMA tem prazos por classe
  ultimaAtualizacaoEm DateTime
}
```

## Regras críticas
- **RD1**: MTR sem CDF em **60 dias** ⇒ status `VENCIDO_SEM_CDF` + Tarefa crítica.
- **RD2**: emitir MTR para destinador com licença vencida ⇒ **bloqueio**.
- **RD3**: emitir MTR para resíduo que destinador não aceita ⇒ bloqueio.
- **RD4**: estoque OLUC > capacidade máxima ⇒ alerta crítico (risco de auto + crime ambiental).
- **RM1**: tendência mensal vs `MetaResiduoAnual` ⇒ alerta meta em risco.
- **RM2**: destinador "novo" (não usado >12m) ⇒ revalidação licença.

## Dependências cruzadas
- **M10 (PGRS)**: MTR vincula automaticamente ao PGRS vigente; PGRS define metas e destinadores homologados.
- **M2**: água oleosa do SAO é resíduo gerador.
- **M4**: descarte EPI contaminado.
- **M5**: descarte irregular = crime ambiental + auto.

## Migração legado
`MTR` → `MTRV2`; `CCR` → `CDF`.

## Casos de borda
- Coleta agendada não ocorrida: MTR fica EMITIDO sem dataColeta; reciclar?
- CDF parcial (recebe menos que MTR): registrar diferença.
- Resíduo de alta perigosidade com prazo curto (CONAMA 264): cronômetro.
- Destinador perde licença depois da emissão: CDF posterior problemático.
- Posto vende sucata aproveitável: NF substitui MTR? Depende UF.

## Perguntas abertas
1. Integração SINIR/SIGOR — API ou scraping?
2. Estoque temporário com cronômetro CONAMA — v1?
3. Catálogo de destinadores nacionais como seed?
