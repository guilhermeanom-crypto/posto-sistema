# Módulo 4 — SST (Saúde e Segurança do Trabalho)

> **Padrão arquitetural definido**: Pessoa + Aptidão computada + Matriz de exigências (consumido por M12).

## Decisão arquitetural nº4
**3 eixos cruzados**:
1. **Pessoa** — `Pessoa` (CPF=identidade na rede) → `VinculoEmpregaticio` (lotação por empreendimento) → `Atribuicao` (CIPA, brigada, RT).
2. **Risco** — `RiscoOcupacional` (catálogo) → `MapaRiscoFuncao` → `MedidaControle` (EPI/EPC/treinamento/exame).
3. **Aptidão** — derivado: `AptidaoComputada` para Pessoa P em Função F no Empreendimento E (APTO | INAPTO_TEMPORARIO | INAPTO_DEFINITIVO | PENDENTE).

Aptidão **não é campo** — é **cálculo** com auditoria, recalculado por evento.

## Base normativa

### NRs (MTE)
- **NR-1** — Disposições gerais + GRO + **PGR** (substitui PPRA desde 2022).
- **NR-4** — SESMT (posto = Grau 3, CNAE 4731-8/00).
- **NR-5** — CIPA.
- **NR-6** — EPI (CA do MTE).
- **NR-7** — PCMSO → ASOs.
- **NR-9** — Avaliação de exposições.
- **NR-15/NR-16** — Insalubridade/Periculosidade (posto = perigoso).
- **NR-17** — Ergonomia.
- **NR-23** — Proteção contra incêndios.
- **NR-20** — **Inflamáveis e combustíveis** (Básico/Intermediário/Avançado I/II).
- **NR-10** — Eletricidade.
- **NR-33** — Espaços confinados (limpeza tanque/SAO).
- **NR-35** — Trabalho em altura.

### eSocial SST
- **Portaria SEPRT 1.999/2020** — layouts S-2210/S-2220/S-2240.

### Periodicidade
| Item | Periodicidade |
|---|---|
| ASO Periódico | 1 ano (posto trabalha c/ inflamáveis) |
| PGR | 2 anos ou por evento |
| PCMSO | 1 ano |
| LTCAT | 1 ano ou por evento |
| NR-20 Básico | 3 anos |
| NR-20 Intermediário/Avançado | 2 anos |
| NR-10 / NR-35 | 2 anos |
| NR-33 | 1 ano |
| CIPA mandato | 1 ano |
| Brigada (IT do CBM) | Anual |
| Reunião CIPA | Mensal (ata) |

## Modelo (deltas)

```prisma
enum TipoVinculo { CLT PJ TERCEIRIZADO ESTAGIO TEMPORARIO APRENDIZ AUTONOMO }
enum SetorPosto { PISTA DESCARGA AREA_TECNICA CONVENIENCIA TROCA_OLEO LAVAGEM ADMINISTRATIVO GERENCIA }
enum NivelNR20 { BASICO INTERMEDIARIO AVANCADO_1 AVANCADO_2 ESPECIFICO }
enum AptidaoASO { APTO APTO_COM_RESTRICOES INAPTO INAPTO_TEMPORARIO }
enum TipoASO { ADMISSIONAL PERIODICO RETORNO_AO_TRABALHO MUDANCA_FUNCAO DEMISSIONAL MONITORACAO_PONTUAL }
enum CategoriaRisco { FISICO QUIMICO BIOLOGICO ERGONOMICO ACIDENTE PSICOSSOCIAL }
enum TipoMedidaControle { EPI EPC TREINAMENTO EXAME_MEDICO PROCEDIMENTO LIMITE_EXPOSICAO ENGENHARIA ADMINISTRATIVA }
enum SeveridadeRisco { BAIXO MEDIO ALTO CRITICO }
enum StatusVinculo { EM_ADMISSAO ATIVO AFASTADO TRANSFERIDO DESLIGADO }
enum TipoAfastamento { ATESTADO_CURTO AUXILIO_DOENCA_B31 AUXILIO_ACIDENTE_B91 LICENCA_MATERNIDADE LICENCA_PATERNIDADE FERIAS SUSPENSAO_DISCIPLINAR OUTRO }
enum GravidadeAcidente { SEM_LESAO LEVE COM_AFASTAMENTO GRAVE FATAL }
enum StatusEventoESocial { PENDENTE GERADO ENVIADO ACEITO REJEITADO RETIFICADO }
enum CargoBaseSST { GERENTE_GERAL GERENTE_OPERACIONAL SUPERVISOR_PISTA FRENTISTA OPERADOR_DESCARGA TROCADOR_OLEO LAVADOR ATENDENTE_LOJA CAIXA AUX_LIMPEZA ELETRICISTA MANUTENCAO SEGURANCA ADMINISTRATIVO CONTABIL OUTRO }

model Pessoa {
  id String @id
  cpf String                  // único por tenant
  nomeCompleto String
  dataNascimento DateTime @db.Date
  rg String?; pisPasep String?; ctps String?
  email String?; telefone String?
  endereco Json?
  contatoEmergencia Json?
  ativo Boolean
  @@unique([tenantId, cpf])
}

model Cargo {
  id String @id; tenantId String
  nome String; cargoBase CargoBaseSST
  cbo String?; setorPadrao SetorPosto?
  insalubre Boolean; periculoso Boolean
  graudeRisco Int             // NR-4
  ativo Boolean
}

model VinculoEmpregaticio {
  id String @id
  empreendimentoId String; pessoaId String; cargoId String
  setor SetorPosto; vinculoTipo TipoVinculo
  matricula String?; cnpjEmpregador String?
  remuneracaoBruta Decimal? @db.Decimal(10,2)
  jornadaSemanalHoras Int?
  status StatusVinculo
  dataAdmissao DateTime @db.Date; dataDesligamento DateTime? @db.Date
  motivoDesligamento String?
  vinculoOriginalId String?    // se transferência interna
}

model Atribuicao {
  id String @id; vinculoId String
  tipo String                  // CIPA_TITULAR | BRIGADISTA | RT_PISTA | INSTRUTOR_INTERNO | DESIGNADO_NR20
  vigenciaInicio DateTime @db.Date; vigenciaFim DateTime? @db.Date
  documentoNomeacaoId String?; ativo Boolean
}

model RiscoOcupacional {
  id String @id; codigo String; nome String
  categoria CategoriaRisco; descricao String?
  unidadeMedida String?; limiteExposicao Decimal? @db.Decimal(10,4)
  basedLegal String?
  @@unique([tenantId, codigo])
}

model MapaRiscoFuncao {
  cargoId String; riscoId String
  severidade SeveridadeRisco
  exposicao String              // CONTINUA | INTERMITENTE | EVENTUAL
  @@unique([cargoId, riscoId])
}

model MedidaControle {
  id String @id; riscoId String
  tipo TipoMedidaControle
  descricao String
  treinamentoTipoId String?
  epiCatalogoId String?
  exameTipo String?
  obrigatoria Boolean
}

model ExigenciaTreinamentoCargo {
  cargoId String; treinamentoTipoId String
  obrigatorio Boolean
  prazoAdmissaoDias Int?        // ex.: NR-20 admissional ≤30d
  @@id([cargoId, treinamentoTipoId])
}

model ExigenciaEPICargo {
  cargoId String; epiCatalogoId String
  quantidade Int; obrigatorio Boolean
  @@id([cargoId, epiCatalogoId])
}

model EPICatalogo {
  id String @id; nome String
  ca String                     // CA do MTE
  validadeCA DateTime @db.Date
  fabricante String?; validadeEpiMeses Int?
  categoria String              // CALCADO | LUVA | OCULOS | RESPIRATORIO | AUDITIVO | OUTROS
  riscosCobertos String[]
  ativo Boolean
  @@unique([tenantId, ca])
}

model EstoqueEPI {
  empreendimentoId String; epiCatalogoId String
  quantidade Int; estoqueMinimo Int
  @@id([empreendimentoId, epiCatalogoId])
}

model InscricaoTreinamento {
  id String @id
  execucaoId String; pessoaId String; vinculoId String?
  presente Boolean
  aproveitamento String         // APROVADO | REPROVADO | AUSENTE
  notaFinal Decimal? @db.Decimal(4,2)
  certificadoDocumentoId String?
  dataValidade DateTime? @db.Date  // desnormalizado p/ query
  @@unique([execucaoId, pessoaId])
}

model Afastamento {
  id String @id
  vinculoId String; pessoaId String
  tipo TipoAfastamento
  dataInicio DateTime @db.Date; dataFimPrevista DateTime? @db.Date; dataFimReal DateTime? @db.Date
  cidPrincipal String?          // criptografado (LGPD)
  motivoLivre String?
  documentoAtestadoId String?
  beneficioINSS String?         // B91, B31
  acidenteOrigemId String?
  asoRetornoId String?
}

model AcidenteTrabalho {
  id String @id
  empreendimentoId String; pessoaPrincipalId String; vinculoId String
  dataHoraOcorrencia DateTime
  localOcorrencia String
  gravidade GravidadeAcidente
  descricao String
  parteCorpoAfetada String[]
  agenteCausador String?
  cidLesao String?
  testemunhas Json?
  catEmitida Boolean; numeroCAT String?
  documentoCATId String?; documentoInvestigacaoId String?
  causaRaiz String?; acaoCorretiva String?
  responsavelInvestigacaoId String?
  pgrAtualizado Boolean
  eventoESocialId String?
}

model ProgramaSST {
  id String @id
  empreendimentoId String
  tipo String                   // PGR | PCMSO | LTCAT | PAE | LAUDO_ERGONOMICO | MAPA_RISCO
  versao Int
  responsavelTecnicoNome String
  responsavelTecnicoCREA String?
  dataElaboracao DateTime @db.Date; dataAprovacao DateTime? @db.Date
  dataVencimento DateTime @db.Date
  status String                 // EM_ELABORACAO | VIGENTE | EM_REVISAO | VENCIDO | SUBSTITUIDO
  documentoPrincipalId String?
  riscosAvaliados String[]
  acoesPlano Json?              // [{descricao, prazo, responsavel, status}]
  versaoAnteriorId String?
  @@unique([empreendimentoId, tipo, versao])
}

model MandatoCIPA {
  id String @id; empreendimentoId String
  vigenciaInicio DateTime @db.Date; vigenciaFim DateTime @db.Date
  documentoEditalId String?; documentoAtaEleicaoId String?
  status String                 // EM_ELEICAO | VIGENTE | ENCERRADO
}

model ReuniaoCIPA {
  id String @id; mandatoId String
  dataReuniao DateTime @db.Date
  pauta String?; documentoAtaId String?
  achadosAcoes Json?
}

model BrigadaIncendio {
  id String @id; empreendimentoId String
  vigenciaInicio DateTime @db.Date; vigenciaFim DateTime? @db.Date
  capacidadeMaxima Int?         // mínimo IT do CBM
  documentoComposicaoId String?
}

model EventoESocialSST {
  id String @id
  empreendimentoId String; vinculoId String?
  tipoEvento String             // S-2210 | S-2220 | S-2240 | S-2200 | S-2299
  status StatusEventoESocial
  dataReferencia DateTime @db.Date
  prazoEnvio DateTime
  enviadoEm DateTime?
  numeroRecibo String?
  payloadXMLId String?; reciboDocumentoId String?
  origemRegistroId String?; origemTipo String?
  errosRetorno Json?
}

model AptidaoComputada {
  id String @id; vinculoId String @unique
  estado String                 // APTO | INAPTO_TEMPORARIO | INAPTO_DEFINITIVO | PENDENTE
  computadoEm DateTime
  pendencias Json               // [{tipo, descricao, prazo}]
  fatoresPositivos Json?
  proximaAvaliacaoEm DateTime?
  hashConfiguracao String       // detecta mudança
}
```

## Algoritmo de Aptidão

```
estadoAptidao(pessoa, função, empreendimento) =
  APTO se TODOS:
    • ASO vigente APTO (ou APTO_RESTRICOES compatível)
    • Treinamentos exigidos pela matriz da função vigentes
    • EPIs obrigatórios entregues e vigentes
    • Sem afastamento aberto
  INAPTO_TEMPORARIO se 1+ pendência reversível
  INAPTO_DEFINITIVO se ASO INAPTO ou contraindicação permanente
  PENDENTE se admissão em curso
```

Recompute por evento: ASO emitido/vencido, treinamento concluído/vencido, EPI entregue/vencido, afastamento aberto/encerrado, mudança de cargo, mudança em ExigenciaTreinamentoCargo/ExigenciaEPICargo.

## Regras críticas

### Duras
- **RD1**: pessoa sem ASO admissional APTO ⇒ não pode ser ATIVO.
- **RD2**: pessoa em PISTA sem NR-20 vigente ⇒ INAPTO ⇒ não opera.
- **RD3**: ASO INAPTO bloqueia vínculo.
- **RD4**: PGR e PCMSO devem estar VIGENTES; vencidos por >30d bloqueiam abertura de novos vínculos.
- **RD5**: CIPA exigida quando empregados ≥ limite NR-5.
- **RD6**: brigada com nº < mínimo IT ⇒ AVCB em risco (alerta cruzado M7).
- **RD7**: acidente fatal sem CAT 24h ⇒ alerta crítico para diretoria.
- **RD8**: EPI com CA vencido ou não entregue ⇒ INAPTO_TEMPORARIO.
- **RD9**: afastamento >15d exige CAT (acidente) e troca pagador (INSS).

### Moles
- **RM1**: NR-20 vencendo 60d.
- **RM2**: ASO periódico vencendo 30d.
- **RM3**: estoque EPI abaixo do mínimo.
- **RM4**: pessoa transferida sem ASO mudança de função.
- **RM5**: >1 acidente leve em 30d ⇒ tendência.

## Calendário gerado
1. ASO periódico por pessoa (1 ano).
2. Treinamentos vencendo (NR-20, NR-10, NR-33, NR-35, brigada).
3. PGR/PCMSO/LTCAT vencendo.
4. CIPA: edital T-60 antes do fim do mandato; reuniões mensais.
5. EPI por validade + CA vencendo.
6. eSocial S-2240 por evento.
7. CAT prazo absoluto 24h.

## Dependências cruzadas
- **M7 Urbano**: brigada conecta AVCB.
- **M1**: PGR/PCMSO podem ser condicionantes da LO.
- **M2**: NR-33 obrigatória para limpeza tanque/SAO.
- **M3**: alteração cadastral RT depende de habilitação.
- **M5**: auto MTE conecta aqui.
- **M12**: visão agregada.

## Casos de borda
- Mesmo CPF em postos diferentes: 1 Pessoa, N VinculoEmpregaticio.
- Terceirizado: vínculo TERCEIRIZADO, cnpjEmpregador distinto, alertar mas permitir importação.
- Estagiário/aprendiz: regras especiais.
- ASO APTO_COM_RESTRICOES: registrar restrição livre, sistema interpreta para função.
- Mudança função interna (frentista→descarga): ASO mudança + NR-20 nível mais alto.
- Pessoa demitida e recontratada: novo vínculo, herda histórico.
- CIPA com vacância: convocação suplente.
- PGR substituído antes do fim: histórico via versaoAnteriorId.
- eSocial rejeitado (CPF inválido): retificação + aptidão PENDENTE.
- Acidente com terceirizado: CAT da terceirizada, posto registra.

## Perguntas abertas
1. eSocial SST v1 ou v2?
2. Médico do trabalho como papel novo?
3. Portal do colaborador (auto-serviço) — v1 ou v2?
4. LGPD: criptografia CID/atestado via pgcrypto.
5. Terceirizados: endpoint para empresa terceirizada subir comprovantes?
6. `Funcionario` legado: deprecar via view?
7. NR-1 — template PGR pré-pronto na seed?
8. Reunião CIPA: gerar ata-template ou só upload?
