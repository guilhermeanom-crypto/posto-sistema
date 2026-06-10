# Módulo 8 — Monitoramento Solo e Água Subterrânea

> Consome **M1** (condicionante recorrente) + **M3** (operação periódica). Quando NÃO_CONFORME acima do VI, abre Processo de Investigação/Remediação (subtipo `REMEDIACAO_AMBIENTAL`).

## Decisão arquitetural nº8
- **Plano de amostragem** aprovado pelo órgão.
- **Campanha** alimenta condicionante recorrente da LO automaticamente.
- **Área contaminada** com classificação CETESB (AP/AS/AC/ACR/AR/AME).
- **Intervenção** (investigação confirmatória, detalhada, avaliação de risco, remediação) é Processo no Workflow Engine.

## Base normativa
- **CONAMA 420/2009** — VRQ/VP/VI solo + VMP água subterrânea.
- **CETESB DD 256/2016** — gerenciamento áreas contaminadas (SP).
- **CONAMA 460/2013** — diretrizes gerenciamento.
- **NBR 15495** — poços de monitoramento.
- **NBR 15515** — passivo ambiental em postos.

## Modelo (deltas)

```prisma
enum ClassificacaoArea { AP AS AC ACR AR AME }
enum TipoIntervencao { INVESTIGACAO_CONFIRMATORIA INVESTIGACAO_DETALHADA AVALIACAO_RISCO REMEDIACAO MONITORAMENTO_AMBIENTAL }

model PlanoAmostragem {
  id String @id; empreendimentoId String
  versao Int
  responsavelTecnicoNome String; numeroART String?
  dataAprovacao DateTime? @db.Date
  validadeAnos Int
  parametrosAvaliados String[]      // catálogo
  periodicidadePM String            // SEMESTRAL | ANUAL
  documentoPlanoId String?
  status String                     // VIGENTE | EM_REVISAO | SUBSTITUIDO
}

model AreaContaminada {
  id String @id; empreendimentoId String
  classificacao ClassificacaoArea
  dataClassificacao DateTime @db.Date
  baseLegal String?                 // CETESB DD 256/2016
  pluma Json?                       // contorno geográfico (PostGIS opcional)
  contaminantesPrincipais String[]
  origemSuspeita String?
  documentoLaudoId String?
}

model IntervencaoAmbiental {
  id String @id; empreendimentoId String
  areaContaminadaId String?
  tipo TipoIntervencao
  processoId String?                // FK Processo (M1)
  descricao String
  dataInicio DateTime? @db.Date; dataConclusao DateTime? @db.Date
  responsavelTecnicoNome String
  numeroART String?
  documentoRelatorioId String?
  custoTotalBRL Decimal? @db.Decimal(14,2)
}

// PocoMonitoramento ganha:
//   papelHidraulico (MONTANTE | JUSANTE | CENTRAL),
//   cotaTopoMetros, nivelAguaUltimoM (monitora rebaixamento),
//   planoAmostragemId
```

## Regras críticas
- **RD1**: campanha com 1+ parâmetro acima do **VI (CONAMA 420)** ⇒ classifica área como AS/AC, abre Intervenção, comunica órgão.
- **RD2**: rede de PM sem cobertura (sem PM a jusante) ⇒ alerta plano inadequado.
- **RM1**: tendência crescente de parâmetro 3 ciclos ⇒ alerta preventivo.
- **RM2**: PM danificado por >90d ⇒ Tarefa para repor.

## Dependências cruzadas
- **M2**: tanque REPROVADO/removido → campanha extra obrigatória + investigação confirmatória.
- **M1**: monitoramento é tipicamente condicionante recorrente da LO; campanha satisfaz automaticamente.
- **M5**: vazamento confirmado → auto da CETESB; intervenção tem prazo fatal.

## Casos de borda
- Contaminação pré-existente (passivo herdado): origem HISTORICO, isenta posto da causa mas não da remediação.
- Pluma cruzando propriedade vizinha: notificação a 3os, processo civil possível.
- Posto desativado em remediação: PMs ativos por anos.
- Solo VRQ alto natural (background regional): VRQ regional substitui CONAMA 420.

## Perguntas abertas
1. Modelagem geográfica (pluma) PostGIS — v1 ou v2?
2. Catálogo de laboratórios INMETRO (igual M2)?
3. Auto-cruzamento campanha × condicionante LO na v1?
