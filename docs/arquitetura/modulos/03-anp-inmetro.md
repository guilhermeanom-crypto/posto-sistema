# Módulo 3 — ANP / INMETRO / Bombas

> **Padrão arquitetural definido**: Obrigação recorrente externa (consumido por M6 medições, M9 conciliação).
> **Bomba é AtivoPosto** (Decisão nº2 do M2). Aqui: processos regulatórios sobre ela.

## Decisão arquitetural nº3
Separar dois domínios:
1. **Metrológico (INMETRO)**: cada bomba tem N **bicos**, cada bico tem **lacres**, **verificações periódicas**, **erro medido**, **encerrantes**. Empresa qualificada = RBMLQ-I.
2. **Comercial-regulatório (ANP)**: cadastro do empreendimento, distribuidora/bandeira, **SIMP-ANP** mensal, **PMQC** (qualidade), análises internas (proveta).

## Base normativa

### INMETRO
- **Portaria INMETRO 559/2016** — verificação periódica (anual) e eventual.
- **Portaria INMETRO 154/2008** — RTM bomba (EMA ±0,3%).

### ANP
- **Lei 9.478/1997** — competência ANP.
- **Resolução ANP 41/2013** — registro de revenda varejista.
- **Resolução ANP 32/2024** (e atualizações) — SIMP mensal.
- **Resolução ANP 65/2011** — PMQC.
- **Resolução ANP 40/2013** (gasolina), 50/2013 (diesel B), 19/2015 (etanol), 9/2007 (GNV).
- **Lei 9.847/1999** — sancionatória ANP.

## Periodicidade
- Verificação INMETRO: **anual**.
- SIMP: **mensal**, prazo até dia 15 do mês subsequente.
- Análise interna proveta: cada carga + amostragem mensal.
- PMQC: ANP coleta sem aviso (reativo).
- Atualização cadastral ANP: por evento.

## Modelo (deltas)

```prisma
enum StatusRegistroANP { EM_SOLICITACAO EM_ANALISE EXIGENCIA_ABERTA ATIVO EM_ALTERACAO SUSPENSO CASSADO ENCERRADO }
enum BandeiraDistribuidora { BR IPIRANGA RAIZEN ALESAT TICKET_LOG BRANCA OUTRA }
enum TipoCombustivelANP { GASOLINA_COMUM GASOLINA_ADITIVADA GASOLINA_PREMIUM ETANOL_HIDRATADO DIESEL_S10 DIESEL_S500 DIESEL_ADITIVADO GNV ARLA32 QAV OLEO_LUBRIFICANTE }
enum TipoVerificacaoINMETRO { INICIAL PERIODICA EVENTUAL SUBSEQUENTE EM_SERVICO }
enum ResultadoVerificacaoINMETRO { APROVADO APROVADO_COM_AJUSTE REPROVADO CONDICIONAL }
enum StatusBico { EM_OPERACAO INTERDITADO EM_MANUTENCAO LACRE_VIOLADO DESATIVADO }
enum StatusEnvioSIMP { PENDENTE EM_GERACAO GERADO ENVIADO ACEITO REJEITADO REENVIADO FORA_PRAZO }
enum ResultadoQualidade { CONFORME NAO_CONFORME INCONCLUSIVO }
enum OrigemAnaliseQualidade { RECEBIMENTO_CARGA ROTINA_INTERNA PMQC CONTRAPROVA DENUNCIA }

model RegistroANP {
  id String @id @default(uuid())
  empreendimentoId String @unique
  numeroRegistro String?
  status StatusRegistroANP
  combustiveisAutorizados TipoCombustivelANP[]
  capacidadeTotalLitros Int?
  rtNome String?; rtCREA String?
}

model AlteracaoCadastralANP {
  id String @id; registroId String
  tipoAlteracao String      // RT | BANDEIRA | COMBUSTIVEL | RAZAO_SOCIAL | CAPACIDADE | ENDERECO
  dadosAntes Json; dadosDepois Json
  protocoladoEm DateTime? @db.Date; numeroProtocolo String?
  deferidoEm DateTime? @db.Date; documentoDespachoId String?
  status String
}

model Distribuidora { id String @id; cnpj String; razaoSocial String; bandeira BandeiraDistribuidora; ativa Boolean }
model ContratoDistribuidora { id String @id; registroANPId String; distribuidoraId String; vigenciaInicio DateTime @db.Date; vigenciaFim DateTime? @db.Date; exclusivo Boolean; ativo Boolean }

model BicoBomba {
  id String @id; bombaId String              // FK AtivoPosto (BOMBA)
  numeroBico Int; ladoBomba String?
  combustivel TipoCombustivelANP
  status StatusBico
  encerranteAtual Decimal? @db.Decimal(14,2)
  ultimoEncerranteEm DateTime?
  vazaoNominalLpm Decimal? @db.Decimal(6,2)
  @@unique([bombaId, numeroBico])
}

model LacreINMETRO {
  id String @id; bicoId String
  numeroLacre String
  pontoAplicacao String          // CALIBRADOR | TOTALIZADOR | DISPLAY
  aplicadoEm DateTime @db.Date; aplicadoPor String
  numeroVerificacaoOrigemId String?
  violadoEm DateTime? @db.Date; motivoViolacao String?
  documentoFotoId String?; ativo Boolean
}

model VerificacaoINMETRO {
  id String @id; empreendimentoId String; bombaId String
  bicoId String?
  tipoVerificacao TipoVerificacaoINMETRO
  resultado ResultadoVerificacaoINMETRO?
  orgaoExecutor String              // IPEM-SP, IMEQ-RJ
  numeroCertificado String?
  dataAgendada DateTime? @db.Date; dataExecucao DateTime? @db.Date
  dataVencimento DateTime? @db.Date
  erroMedidoPercentual Decimal? @db.Decimal(5,3)
  emaReferencia Decimal? @db.Decimal(5,3)
  documentoCertificadoId String?; documentoStickerId String?
  motivoEventual String?
}

model LeituraEncerrante {
  id String @id; bicoId String
  dataReferencia DateTime @db.Date
  encerranteInicio Decimal @db.Decimal(14,2)
  encerranteFim Decimal @db.Decimal(14,2)
  volumeVendido Decimal @db.Decimal(14,2)   // = fim - inicio
  origem String                              // ATG | MANUAL | IMPORT
  @@unique([bicoId, dataReferencia])
}

model CompraCombustivel {
  id String @id; empreendimentoId String; distribuidoraId String
  numeroNF String; serie String?; chaveAcesso String?
  dataEmissao DateTime @db.Date; dataRecebimento DateTime
  combustivel TipoCombustivelANP
  volumeLitros Decimal @db.Decimal(14,2); valorTotal Decimal @db.Decimal(14,2)
  tanqueDestinoId String?
  documentoNFId String?
  analiseRecebimentoId String? @unique
  @@unique([empreendimentoId, chaveAcesso])
}

model AnaliseQualidade {
  id String @id; empreendimentoId String
  origem OrigemAnaliseQualidade
  combustivel TipoCombustivelANP
  dataAnalise DateTime @db.Date
  resultado ResultadoQualidade
  parametros Json                           // { densidade, teorEtanol, ... }
  realizadoPor String?; numeroBoletim String?
  documentoBoletimId String?
  acaoTomada String?
}

model EnvioSIMP {
  id String @id; empreendimentoId String; registroANPId String
  competenciaMes Int; competenciaAno Int
  status StatusEnvioSIMP
  prazoEnvio DateTime @db.Date; enviadoEm DateTime?
  numeroProtocolo String?
  documentoArquivoId String?; documentoReciboId String?
  totaisCompras Json?; totaisVendas Json?; totaisEstoque Json?
  perdasPercentual Json?
  alertasConciliacao String[]
  @@unique([empreendimentoId, competenciaAno, competenciaMes])
}

model MedicaoEstoque {
  id String @id; empreendimentoId String; tanqueId String
  dataMedicao DateTime @db.Date
  origem String                             // ATG | REGUA | MANUAL
  volumeLitros Decimal @db.Decimal(14,2)
  alturaCm Decimal? @db.Decimal(6,2); temperaturaCelsius Decimal? @db.Decimal(4,1)
  @@unique([tanqueId, dataMedicao])
}

model EmpresaAutorizadaINMETRO {
  id String @id; cnpj String; razaoSocial String
  numeroAutorizacao String?; validadeAutorizacao DateTime? @db.Date
  ufsAtendidas String[]; ativa Boolean
}
```

## Regras críticas

### Duras
- **RD1**: bico sem verificação INMETRO vigente ⇒ não pode operar.
- **RD2**: registro ANP SUSPENSO/CASSADO ⇒ todas as bombas interditadas.
- **RD3**: SIMP fora do prazo gera Tarefa crítica + status FORA_PRAZO.
- **RD4**: análise de carga NAO_CONFORME bloqueia descarga.
- **RD5**: lacre violado sem verificação eventual em 30d ⇒ interdição.
- **RD6**: alteração de combustível autorizado exige fluxo: pedido ANP + nova verificação INMETRO + atualização tanque/bico.
- **RD7**: empresa autorizada INMETRO com autorização vencida não pode registrar abertura de lacre.

### Moles
- **RM1**: perda mensal > 0,6% ⇒ alerta.
- **RM2**: encerrante diário acima da capacidade ⇒ erro de leitura provável.
- **RM3**: bomba com erro próximo do EMA ⇒ alerta preventivo.
- **RM4**: PMQC reprovado ⇒ alerta crítico.

## Conciliação SIMP
```
estoque_inicial + compras − vendas − estoque_final = perdas
perda% = perdas / (estoque_inicial + compras)
```
- Vendas mês = soma `LeituraEncerrante.volumeVendido` por combustível.
- Compras mês = soma `CompraCombustivel.volumeLitros`.
- Estoque mês = última `MedicaoEstoque` por tanque.

## Calendário gerado
1. Verificação INMETRO por bomba (T-90/60/30/15).
2. SIMP mensal (criada dia 1, prazo dia 15).
3. Atualização cadastral ANP por evento.
4. Análise rotina mensal de qualidade.
5. Vencimento contrato distribuidora.
6. Vencimento autorização empresa INMETRO.

## Dependências cruzadas
- **M2**: bomba É AtivoPosto.
- **M1**: registro ANP pré-requisito da LO em alguns estados.
- **M5**: auto INMETRO/ANP liga aqui.
- **M11**: leitura diária de encerrante e medição podem ser checklist.

## Casos de borda
- Bomba multi-produto (1 lado serve 2 combustíveis): cada combinação = 1 BicoBomba.
- Tanque que serve múltiplas bombas: já modelado por RelacaoAtivo.
- Reset de encerrante (manutenção): registrar evento + valor anterior.
- Posto fechou no mês: SIMP enviado mesmo zerado.
- Bandeira branca ↔ bandeirada: contrato + alteração ANP obrigatória.
- Mudança de combustível em tanque: limpeza, ensaio, verificação, alteração ANP, SIMP fragmentado.
- PMQC reprovado por culpa da distribuidora: contraprova exonera.
- ATG offline: fallback manual.

## Perguntas abertas
1. ATG: integrar v1 (qual marca dominante?) ou só manual?
2. NF-e: importação por XML upload na v1; SEFAZ direta v2?
3. PMQC scraping automático na v1?
4. Multi-bandeira por posto: permitir ou exceção?
5. OCR de stickers/certificados v1 ou só PDF?
6. Visão financeira (preço, margem) entra aqui ou módulo separado?
7. Portal RBMLQ-I (sobe certificado direto): v1 ou v2?
