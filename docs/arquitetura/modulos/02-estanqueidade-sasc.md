# Módulo 2 — Estanqueidade / SASC / Tanques

> **Padrão arquitetural definido**: Equipamento com histórico técnico (consumido por M3 — bomba é AtivoPosto).

## Decisão arquitetural nº2
Três camadas canônicas:
1. **Ativo físico** (`AtivoPosto` supertipo): Tanque, Bomba, Linha, Câmara, SAO, SRV, Sensor, ATG. Histórico via `EquipamentoHistorico` existente.
2. **Sistema** (`SistemaArmazenamento`): agrega ativos em conjunto operacional (1 SASC = N tanques + linhas + câmaras + SAO).
3. **Ensaios** (`EnsaioTecnico`): polimórfico por tipo (estanqueidade, hidrostático, linhas, válvulas, SRV, ATG, intersticial).

**Motivo**: NBR 13784 exige avaliar o **sistema**, não o tanque isoladamente.

## Base normativa
- **NBR 13784** — método de detecção de vazamento (norma-mãe SASC).
- **NBR 13783** — instalação de sistemas.
- **NBR 13787** — desativação e remoção.
- **NBR 14973** — reutilização de tanques subterrâneos.
- **NBR 15005** — sistemas com tanques subterrâneos.
- **NBR 15461** — sistemas de recuperação de vapor.
- **NBR 5419** — SPDA.
- **CONAMA 273/2000** + **319/2002** — comunicação de vazamento 48h.
- **CETESB DD 256/2016**, **CETESB Portaria 75/2017**.

## Periodicidade (CETESB-SP, varia por UF)
- Tanque ≤10a: ensaio a cada 3 anos.
- 10–20a: 2 anos. >20a parede simples: anual + plano de substituição.
- Hidrostático: instalação + qualquer intervenção estrutural.
- Linhas: instalação + 3 anos.
- SRV: anual.

## Modelo (deltas)

```prisma
enum ClasseAtivo {
  TANQUE BOMBA LINHA CAMARA_CONTENCAO CAMARA_ACESSO SAO
  SRV_ESTAGIO_1 SRV_ESTAGIO_2 ATG SENSOR_INTERSTICIAL
  VALVULA_ANTI_TRANSBORDO VALVULA_RETENCAO FILTRO BOMBA_SUBMERSA POCO_MONITORAMENTO OUTROS
}
enum ParedeTanque { SIMPLES DUPLA_ACO DUPLA_FIBRA JAQUETADO }
enum LocalizacaoTanque { SUBTERRANEO AEREO SEMI_ENTERRADO }
enum TipoEnsaio {
  ESTANQUEIDADE_NBR13784 HIDROSTATICO LINHAS_PRESSAO
  SRV_ESTAGIO_1 SRV_ESTAGIO_2 CALIBRACAO_ATG VALVULAS
  INTERSTICIAL_CONTINUO INVESTIGACAO_CONFIRMATORIA_NBR13787 INSPECAO_VISUAL
}
enum ResultadoEnsaio { APROVADO REPROVADO INCONCLUSIVO EM_ANDAMENTO CANCELADO }
enum StatusAtivo {
  EM_CADASTRO INSTALADO OPERACIONAL INTERDITADO
  EM_MANUTENCAO DESATIVADO REMOVIDO DESCOMISSIONADO
}

model SistemaArmazenamento {
  id String @id @default(uuid())
  empreendimentoId String
  codigoInterno String
  status String
  dataInstalacao DateTime? @db.Date
  responsavelTecnicoId String?
  processoLicencaId String?
  @@unique([empreendimentoId, codigoInterno])
}

model AtivoPosto {
  id String @id @default(uuid())
  empreendimentoId String
  sistemaId String?
  classe ClasseAtivo
  codigoInterno String
  fabricante String?
  modelo String?
  numeroSerie String?
  dataFabricacao DateTime? @db.Date
  dataInstalacao DateTime? @db.Date
  status StatusAtivo
  dadosTecnicos Json       // polimórfico por classe (validado por Zod)
  @@unique([empreendimentoId, codigoInterno])
}

model RelacaoAtivo {
  ativoOrigemId String
  ativoDestinoId String
  tipoRelacao String       // SERVE | CONTEM | PROTEGE | ALIMENTA
  @@id([ativoOrigemId, ativoDestinoId, tipoRelacao])
}

model EnsaioTecnico {
  id String @id @default(uuid())
  empreendimentoId String
  sistemaId String?
  ativoId String?
  tipo TipoEnsaio
  resultado ResultadoEnsaio
  empresaExecutoraId String?
  empresaExecutoraNome String
  responsavelTecnicoId String?
  numeroARTResponsavel String?
  dataAgendada DateTime? @db.Date
  dataExecucao DateTime? @db.Date
  dataProximoPrevisto DateTime? @db.Date
  metodo String?
  dadosMetricos Json?
  achadosCriticos String[]
  documentoLaudoId String?
  comunicadoOrgaoId String?
  condicionanteOriginariaId String?
}

model PlanoAcaoEnsaio {
  id String @id @default(uuid())
  ensaioId String @unique
  acaoImediata String
  acaoCorretiva String
  responsavelId String
  prazoAcaoImediata DateTime @db.Date
  prazoAcaoCorretiva DateTime @db.Date
  comunicouOrgao Boolean
  dataComunicacao DateTime? @db.Date
  processoRemediacaoId String?
}

model EmpresaExecutoraEnsaio {
  id String @id @default(uuid())
  cnpj String
  razaoSocial String
  qualificacaoCETESB String?
  validadeQualificacao DateTime? @db.Date
  ufsAtendidas String[]
  ativo Boolean
}

model RegraPeriodicidadeEnsaio {
  id String @id @default(uuid())
  tipoEnsaio TipoEnsaio
  uf String? @db.Char(2)
  condicao Json            // { parede: "SIMPLES", idadeMin: 20 }
  periodicidadeMeses Int
  basedLegal String?
  prioridade Int
}
```

## `dadosTecnicos Json` — schemas por classe (Zod)

```ts
TANQUE: {
  capacidadeLitros, combustivel, parede: ParedeTanque, localizacao,
  temCamaraContencao, temValvulaAntiTransbordo, temSensorIntersticial,
  temATGConectado, volumeCompartimentos?: number[]
}
BOMBA: { numeroBicos, combustiveisPorBico, marcaModelo, temSRVEstagio2, stickerINMETROAtual? }
LINHA: { diametroPolegadas, materialLinha, comprimentoMetros, tanqueOrigemId, bombaDestinoId }
SAO: { capacidadeLitros, numeroCamaras, temSifaoHidraulico, vazaoNominalLph }
```

## Regras críticas

### Duras
- **RD1**: ativo OPERACIONAL exige ensaio APROVADO vigente (para tipos aplicáveis).
- **RD2**: tanque parede SIMPLES + idade > 30a ⇒ bloqueio (varia UF).
- **RD3**: ensaio REPROVADO cria PlanoAcao + ativo vai para INTERDITADO automaticamente.
- **RD4**: SistemaArmazenamento herda status agregado dos ativos.
- **RD5**: ensaio reprovado ⇒ comunicação ao órgão em ≤48h (CONAMA 319).
- **RD6**: empresa executora com qualificação vencida não pode lançar ensaio.

### Moles
- **RM1**: parede dupla sem ensaio intersticial contínuo ⇒ alerta.
- **RM2**: sistema com 2+ ativos INTERDITADOS ⇒ alerta.
- **RM3**: 2+ ensaios INCONCLUSIVOS consecutivos ⇒ revisar método/empresa.

## Calendário gerado
1. Próximo ensaio por ativo/sistema (T-90/T-60/T-30/T-15).
2. Limpeza de SAO (mensal/trimestral).
3. Substituição programada parede simples (alerta T-365 da idade crítica).
4. ART do RT vencendo.
5. Qualificação CETESB da empresa executora.
6. Comunicação 48h (prazo absoluto).
7. Plano de ação com prazos imediato e corretivo.

## Dependências cruzadas
- **M1**: ensaio aprovado satisfaz condicionante recorrente da LO.
- **M5**: auto por SASC inadequado vincula AtivoPosto.
- **M8**: tanque REPROVADO ou removido abre campanha emergencial.
- **M3**: bomba reusa AtivoPosto + ensaios distintos (calibração INMETRO).
- **M11**: inspeção visual diária registra histórico.

## Casos de borda
- Tanque compartimentado: 1 AtivoPosto, N volumes em `dadosTecnicos`.
- Troca de combustível no tanque: limpeza + ensaio + evento.
- Substituição "idêntica": novo AtivoPosto, código com sufixo `-v2`.
- Posto bandeira branca → bandeirada: mudança de combustível com ensaio.
- Parede dupla com falha no anular: ensaio INTERSTICIAL.
- Ensaio atrasado + renovação LO em curso: bloqueia emissão da LO.

## Perguntas abertas
1. Diagrama visual SASC: React Flow ou SVG simples?
2. Portal da empresa executora — v1 ou v2?
3. Bomba: ativo aqui + ensaios INMETRO no M3 (separação correta)?
4. Mídia dos ativos: entidade `AtivoMidia` separada.
5. Remediação de passivo: subfluxo aqui que abre Processo (REMEDIACAO_AMBIENTAL).
