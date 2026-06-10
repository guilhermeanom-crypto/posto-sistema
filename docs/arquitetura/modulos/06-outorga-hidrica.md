# Módulo 6 — Outorga Hídrica

> Consome o **Workflow Engine** (M1). Captação como ativo, outorga como Processo (subtipo `OUTORGA`), medição de vazão como obrigação recorrente (padrão M3).

## Decisão arquitetural nº6
- **Captação** (`CaptacaoHidrica`): poço/superficial/nascente/reuso — ativo do empreendimento.
- **Outorga** (`OutorgaUso`): vinculada à captação, com vazão autorizada e finalidade.
- **Medição** (`MedicaoVazao`): mensal, igual a `LeituraEncerrante` no M3.
- **Laudo** (`LaudoAguaV2`): qualidade da água (potabilidade ou industrial).

## Base normativa
- **Lei 9.433/1997** — PNRH.
- **Resolução CNRH 16/2001** — outorga.
- **Resolução ANA 1.480/2021** — regularização.
- **Por UF**: SP — Decreto 41.258/1996 (DAEE); MG — Portaria IGAM 49/2010; RJ — Portaria INEA 567/2017; GO — Lei 13.583/2000.
- **Portaria MS 5/2017** — qualidade água consumo humano.
- **CONAMA 396/2008** — águas subterrâneas; **CONAMA 357/2005** — superficiais.

## Modelo (deltas)

```prisma
enum TipoCaptacao { POCO_TUBULAR_PROFUNDO POCO_RASO SUPERFICIAL NASCENTE REUSO CAPTACAO_PLUVIAL CONCESSIONARIA }
enum TipoUsoAgua { CONSUMO_HUMANO PROCESSO_INDUSTRIAL IRRIGACAO_PAISAGISTICA COMBATE_INCENDIO OUTROS }

model CaptacaoHidrica {
  id String @id; empreendimentoId String
  tipoCaptacao TipoCaptacao
  codigoInterno String              // PA-01, CS-01
  coordenadas Json?
  profundidadeM Decimal? @db.Decimal(8,2)
  vazaoTestadaM3h Decimal? @db.Decimal(10,2)
  dataPerfuracao DateTime? @db.Date
  empresaPerfuradora String?; numeroART String?
  status String                     // ATIVA | INATIVA | INTERDITADA | SELADA
  processoOutorgaId String?
}

model OutorgaUso {
  id String @id; captacaoId String
  numeroOutorga String
  orgaoEmissor String               // ANA | DAEE | IGAM | INEA | SEMAD-GO
  vazaoOutorgadaM3h Decimal @db.Decimal(10,2)
  volumeMensalMaxM3 Decimal @db.Decimal(12,2)
  finalidade TipoUsoAgua[]
  dataEmissao DateTime @db.Date; dataVencimento DateTime @db.Date
  documentoOutorgaId String?
  isencao Boolean                   // pequeno uso dispensado
  baseLegalIsencao String?
  status String
}

model UsoAguaCaptacao { captacaoId String; finalidade TipoUsoAgua; percentualUso Decimal? @db.Decimal(5,2); @@id([captacaoId, finalidade]) }

model MedicaoVazao {
  id String @id; captacaoId String
  competenciaMes Int; competenciaAno Int
  hidrometroLeituraInicio Decimal @db.Decimal(14,3)
  hidrometroLeituraFim Decimal @db.Decimal(14,3)
  volumeM3 Decimal @db.Decimal(14,3)
  diasOperacao Int
  origem String                     // HIDROMETRO | ESTIMADA | DECLARADA
  documentoId String?
  @@unique([captacaoId, competenciaAno, competenciaMes])
}

model LaudoAguaV2 {
  id String @id; captacaoId String
  tipoAnalise String                // POTABILIDADE_MS_2914 | CONAMA_396 | CONSUMO_INDUSTRIAL
  dataColeta DateTime @db.Date; dataLaudo DateTime @db.Date
  laboratorio String; cnpjLaboratorio String?
  acreditadoINMETRO Boolean
  parametros Json                   // [{nome, resultado, unidade, vmp, conforme}]
  resultadoGeral String             // CONFORME | ATENCAO | NAO_CONFORME
  documentoId String?
  proximaColeta DateTime? @db.Date
}

model PagamentoTFRH {
  id String @id; outorgaId String
  competenciaAno Int; valorBRL Decimal @db.Decimal(12,2)
  dataVencimento DateTime @db.Date; pagaEm DateTime? @db.Date
  documentoBoletoId String?; documentoComprovanteId String?
}
```

## Regras críticas
- **RD1**: captação ATIVA sem outorga vigente (e sem isenção) ⇒ interdição operacional.
- **RD2**: medição mensal volumeM3 > volumeMensalMaxM3 ⇒ alerta crítico (excedente = multa).
- **RD3**: laudo NAO_CONFORME para CONSUMO_HUMANO ⇒ bloqueio operacional + comunicar VISA.
- **RM1**: vencimento outorga T-180 ⇒ Tarefa renovação.
- **RM2**: medição não lançada até dia 10 do mês seguinte ⇒ Tarefa.

## Dependências cruzadas
- **M1 (Workflow)**: subtipo OUTORGA.
- **M5 (Fiscalizações)**: auto por uso sem outorga vincula causa-raiz.
- **M1 (Licenças)**: outorga pode ser pré-requisito da LO.
- **M8 (Monitoramento)**: poços de monitoramento são distintos de captação.

## Migração legado
`PocoArtesiano` → `CaptacaoHidrica`; `LaudoAgua` → `LaudoAguaV2`.

## Casos de borda
- Captação dispensada (pequeno uso): isenção + base legal.
- Concessionária pública (SAAE): sem outorga, mas com fatura como evidência.
- Poço selado: status SELADA, mantém histórico.
- Reuso de água da lavagem: tipo distinto.
- Captação compartilhada: duplicar com flag `compartilhadaCom`.

## Perguntas abertas
1. TFRH (cobrança) v1 ou v2?
2. Integração DAEE-SP — API disponível?
3. Hidrômetro IoT v2?
