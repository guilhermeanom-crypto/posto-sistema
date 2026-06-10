# Módulo 5 — Fiscalizações / Autos de Infração

> **Padrão arquitetural definido**: Prazo fatal + Penalidade composta (perder prazo = perda de direito).
> **Característica única**: motor `PrazoCalculator` com calendário UF, alarmes redundantes.

## Decisão arquitetural nº5
**3 camadas**:
1. **Auto** (`AutoInfracaoV2`): fato denunciado pelo agente — tipologia + descrição + base legal + penalidade proposta.
2. **Processo** (`ProcessoSancionador`): instância administrativa (defesa→julgamento→recurso→execução). Pode ter N autos.
3. **Penalidades** (`Penalidade`): N por auto (multa + advertência + embargo simultâneos), cada uma com ciclo próprio.

E **prazos como entidade de 1ª classe** (`PrazoProcessual`): natureza, contagem (corridos vs úteis), suspensão, alarmes escalonados.

## Base normativa

### Federal (procedimento)
- **Lei 9.784/1999** — Processo Administrativo Federal.

### Por órgão (autos típicos em posto)
| Órgão | Norma material | Prazo defesa |
|---|---|---|
| **IBAMA** | Lei 9.605/1998 + Decreto 6.514/2008 | 20 dias |
| **CETESB (SP)** | Lei 997/76 + Decreto 8.468/76 | 20 dias |
| **FEAM (MG)** | DN COPAM 217/2017 | 30 dias |
| **INEA (RJ)** | Lei 3.467/2000 | 20 dias |
| **ANP** | Resolução ANP 765/2018 + Lei 9.847/1999 | 15 dias |
| **INMETRO/RBMLQ-I** | Decreto 5.456/2005 | 10 dias |
| **VISA municipal** | Lei 6.437/1977 | 15 dias |
| **PROCON** | Decreto 2.181/1997 | 10 dias |
| **MTE / Auditor-Fiscal** | Decreto 4.552/2002 | 10 dias |
| **Receita Federal** | Decreto 70.235/1972 | 30 dias |
| **Bombeiros** | Lei estadual + IT | 15–30 dias |

**Sistema precisa de catálogo de regras de prazo por órgão** (não basta cobrar 20 dias para tudo).

### Tipologia de penalidades (Lei 9.605/1998)
Advertência | Multa simples | Multa diária | Apreensão | Destruição | Suspensão venda/fab. | Embargo obra/atividade | Demolição | Suspensão atividades | Restritiva direitos.

## Modelo (deltas)

```prisma
enum NaturezaPenalidade { ADVERTENCIA MULTA_SIMPLES MULTA_DIARIA APREENSAO EMBARGO_OBRA EMBARGO_ATIVIDADE INTERDICAO_PARCIAL INTERDICAO_TOTAL SUSPENSAO_VENDA DEMOLICAO RESTRITIVA_DIREITOS CONVERSAO_SERVICOS DESTRUICAO_INUTILIZACAO }
enum StatusPenalidade { PROPOSTA CONFIRMADA SUSPENSA EM_CUMPRIMENTO CUMPRIDA CONVERTIDA CANCELADA PARCELADA PAGA PRESCRITA }
enum FaseProcessoSancionador { PRE_AUTO AUTO_LAVRADO INTIMACAO_PENDENTE INTIMADO PRAZO_DEFESA_ABERTO DEFESA_APRESENTADA EM_DILIGENCIA AGUARDANDO_JULGAMENTO_1INST JULGADO_1INST PRAZO_RECURSO_ABERTO RECURSO_APRESENTADO AGUARDANDO_JULGAMENTO_2INST JULGADO_2INST AGUARDANDO_JULGAMENTO_3INST JULGADO_3INST TRANSITADO_EM_JULGADO_ADM EM_TAC EM_EXECUCAO JUDICIALIZADO ENCERRADO PRESCRITO }
enum ResultadoJulgamento { PROCEDENTE IMPROCEDENTE PARCIALMENTE_PROCEDENTE NULO_POR_VICIO ARQUIVADO_SEM_MERITO }
enum TipoIntimacao { PESSOAL POSTAL_AR EDITAL DOU_DOE ELETRONICA }
enum NaturezaPrazo { DEFESA RECURSO_1 RECURSO_2 RECURSO_3 PRODUCAO_PROVA CUMPRIMENTO_PENALIDADE PAGAMENTO PARCELA_TAC RESPOSTA_DILIGENCIA PRESCRICAO_QUINQUENAL OUTRO }
enum ContagemPrazo { CORRIDOS UTEIS }
enum ResultadoRecurso { PROVIDO IMPROVIDO PROVIDO_PARCIAL NAO_CONHECIDO PENDENTE }
enum FormaCumprimentoMulta { PAGAMENTO_INTEGRAL PAGAMENTO_COM_DESCONTO PARCELAMENTO CONVERSAO_SERVICOS INSCRICAO_DIVIDA_ATIVA REMISSAO }
enum ClassificacaoGravidade { LEVE MEDIA GRAVE GRAVISSIMA }

model TipoInfracao {
  id String @id; orgaoId String
  codigo String                    // "DEC-6514-Art-66" | "ANP-9847-Art-3-IX"
  descricao String; baseLegal String
  classificacao ClassificacaoGravidade
  penalidadesPossiveis NaturezaPenalidade[]
  valorMinimoBase Decimal? @db.Decimal(14,2); valorMaximoBase Decimal? @db.Decimal(14,2)
  multaDiariaPossivel Boolean
  ativo Boolean
  @@unique([orgaoId, codigo])
}

model RegraPrazoOrgao {
  id String @id; orgaoId String
  natureza NaturezaPrazo
  diasPrazo Int
  contagem ContagemPrazo
  baseLegal String?
  vigenteDesde DateTime @db.Date; vigenteAte DateTime? @db.Date
  ativo Boolean
}

model ProcessoSancionador {
  id String @id; empreendimentoId String; orgaoId String
  numeroProcesso String?; numeroProcessoInterno String
  fase FaseProcessoSancionador
  responsavelInternoId String?; advogadoExternoId String?
  dataAbertura DateTime; dataEncerramento DateTime?
  resultadoFinal ResultadoJulgamento?
  reincidenteAnaliseId String?
  causaRaizModulo String?         // LICENCAS | SASC | INMETRO | ...
  causaRaizEntidadeId String?     // ID da entidade na origem
  metadados Json?
  @@unique([tenantId, numeroProcessoInterno])
}

model AutoInfracaoV2 {
  id String @id
  empreendimentoId String; processoId String
  numeroAuto String; tipoInfracaoId String
  agenteFiscalNome String?; agenteFiscalMatricula String?
  dataLavratura DateTime @db.Date; dataConstatacaoFato DateTime? @db.Date
  descricaoFatos String
  baseLegalAplicada String
  classificacao ClassificacaoGravidade
  agravantes String[]; atenuantes String[]
  reincidente Boolean
  documentoAutoOriginalId String?
  documentoTermoApreensaoId String?; documentoTermoEmbargoId String?
  analiseIA Json?
  @@unique([processoId, numeroAuto])
}

model Penalidade {
  id String @id; autoId String
  natureza NaturezaPenalidade
  status StatusPenalidade
  valorPropostoBRL Decimal? @db.Decimal(14,2)
  valorConfirmadoBRL Decimal? @db.Decimal(14,2)
  multaDiariaBRL Decimal? @db.Decimal(14,2); diasMultaDiaria Int?
  descricaoMedida String?           // "Embargo de operação da pista 3"
  prazoCumprimento DateTime? @db.Date; cumpridaEm DateTime? @db.Date
  formaCumprimento FormaCumprimentoMulta?
  documentoComprovanteId String?
}

model ParcelaPenalidade {
  id String @id; penalidadeId String
  numero Int
  valorBRL Decimal @db.Decimal(14,2)
  dataVencimento DateTime @db.Date; pagaEm DateTime? @db.Date
  documentoBoletoId String?; documentoComprovanteId String?
  @@unique([penalidadeId, numero])
}

model ConversaoServicos {
  id String @id; penalidadeId String @unique
  projetoDescricao String; valorEstimado Decimal @db.Decimal(14,2)
  prazoConclusao DateTime @db.Date
  homologadoEm DateTime? @db.Date; concluidoEm DateTime? @db.Date
  documentoTermoId String?
}

model PrazoProcessual {
  id String @id; processoId String
  natureza NaturezaPrazo
  diasOriginais Int; contagem ContagemPrazo
  dataInicio DateTime @db.Date
  dataLimite DateTime @db.Date    // calculada
  dataLimiteOriginal DateTime @db.Date
  diasSuspensos Int
  status String                    // ABERTO | CUMPRIDO | EXPIRADO | SUSPENSO
  cumpridoEm DateTime?
  documentoCumprimentoId String?
  alarmesEnviados Json[]           // [{tipo, dataEnvio, canal}]
  baseLegal String?
}

model SuspensaoPrazo {
  id String @id; prazoId String
  motivo String
  dataInicio DateTime @db.Date; dataFim DateTime? @db.Date
  documentoBaseId String?
}

model Intimacao {
  id String @id; processoId String
  tipo TipoIntimacao
  dataIntimacao DateTime @db.Date
  dataCienciaEfetiva DateTime? @db.Date  // gatilho de prazos
  numeroAR String?
  publicacaoDOId String?
  recebidoPorNome String?; recebidoPorCPF String?
  documentoComprovanteId String?
}

model DiligenciaProcessual {
  id String @id; processoId String
  tipo String                     // VISTORIA | PERICIA | OITIVA | DOCUMENTAL | OUTRO
  solicitadaPorId String?
  dataSolicitacao DateTime @db.Date; dataExecucao DateTime? @db.Date
  resultado String?
  documentoLaudoId String?
  suspendePrazo Boolean
}

model DecisaoProcessual {
  id String @id; processoId String
  instancia String                // 1INST | 2INST | 3INST | JUDICIAL
  resultado ResultadoJulgamento
  dataDecisao DateTime @db.Date; dataPublicacao DateTime? @db.Date
  autoridadeNome String?; ementa String?; fundamentacao String?
  documentoDecisaoId String?
  publicacaoDOId String?
}

model RecursoProcessoSancionador {
  id String @id; processoId String
  instancia String                // 1INST | 2INST | 3INST | JUDICIAL
  dataProtocolo DateTime @db.Date; numeroProtocolo String?
  argumentosSintese String?
  efeitoSuspensivo Boolean
  documentoPeticaoId String?
  resultadoRecurso ResultadoRecurso
  decisaoId String?
  julgadoEm DateTime? @db.Date
}

model TermoAjustamentoConduta {
  id String @id; processoId String @unique
  dataAssinatura DateTime @db.Date
  prazoTotalMeses Int
  dataConclusaoPrevista DateTime @db.Date
  obrigacoes Json                 // [{descricao, prazo, evidenciaExigida, status}]
  multaDescumprimentoBRL Decimal? @db.Decimal(14,2)
  documentoTermoId String?
  status String                   // VIGENTE | CUMPRIDO | DESCUMPRIDO | RESCINDIDO
  cumpridoEm DateTime? @db.Date
}

model AdvogadoExterno {
  id String @id
  nome String; oab String; oabUF String @db.Char(2)
  email String?; telefone String?; escritorio String?
  ativo Boolean
  @@unique([tenantId, oab, oabUF])
}
```

## Regras críticas

### Duras (não admitem exceção)
- **RD1**: nenhum prazo passa despercebido. Cancelar alarme manual exige motivo registrado.
- **RD2**: PrazoProcessual aberto sem responsável ⇒ alarme à liderança em D-7 obrigatório.
- **RD3**: cumprimento de prazo só com upload de documento de prova.
- **RD4**: penalidade EMBARGO_* em EM_CUMPRIMENTO ⇒ banner crítico no 360° + bloqueio operacional.
- **RD5**: INTERDICAO_* ⇒ bloqueio total do posto no sistema.
- **RD6**: TAC descumprido ⇒ multa do TAC + reabertura do processo.
- **RD7**: prescrição quinquenal monitorada; T-180 da prescrição vira alerta.
- **RD8**: pagamento com desconto extemporâneo bloqueado se sem previsão na norma.

### Moles
- **RM1**: 3+ autos do mesmo órgão em 12m ⇒ "padrão de não-conformidade".
- **RM2**: prazo D-7/D-3/D-1 ⇒ alarme escalado (D-7: responsável; D-3: + supervisor; D-1: + diretoria + advogado).
- **RM3**: prazo expirando + responsável de férias ⇒ alarme imediato substituto.
- **RM4**: defesa IA gerada não revisada em D-3 ⇒ crítico.
- **RM5**: causa-raiz identificada em outro módulo ⇒ sugestão de ação preventiva.

## Algoritmo `PrazoCalculator`
```
base = dataInicio + diasOriginais (em úteis ou corridos)
ajustado = base + diasSuspensos
se contagem = UTEIS: pular finais e feriados (calendário UF)
se cair em fim/feriado e regra protege: prorroga próximo dia útil
```

## Calendário gerado
1. Prazos processuais ABERTOS — semáforo (verde >7d, amarelo 3-7d, laranja 1-3d, vermelho <1d).
2. Audiências/diligências agendadas.
3. Vencimentos de parcelas.
4. Vencimentos de obrigações TAC.
5. Prescrição (D-180 antes dos 5 anos).
6. Cumprimento de penalidades.

## Dependências cruzadas
- **Causa-raiz** vincula a M1 (condicionante), M2 (ativo), M3 (bomba/SIMP), M4 (acidente sem CAT), etc.
- **Embargo vigente** propaga via evento `processo.embargo.aplicado` consumido por outros módulos.
- **DOU monitor** (já existe) cruza nº de processo para detectar publicações.

## Casos de borda
- Auto entregue por DOU sem posto presente: prazo após 15d (intimação ficta).
- Auto entregue a portaria não autorizada: validade contestável.
- Auto cumulativo (mesma vistoria, vários autos): 1 processo, N autos.
- Penalidade convertida durante recurso: parar contagem da execução.
- Multa diária correndo: campo calculado em tempo real.
- Recurso intempestivo: registrar como NAO_CONHECIDO.
- Mudança de advogado: histórico preservado.
- Posto vendido: passivo pode acompanhar adquirente.
- Empresa em recuperação judicial: execução suspensa.
- Auto anulado: arquivamento mantém histórico.
- Greve dos Correios (intimação postal): suspensão de prazos exige decisão.
- Pandemia/calamidade: ferramenta de "suspender em massa" auditada.

## Perguntas abertas
1. Calendário de feriados: UF + municipal?
2. Defesa IA: refatorar `DefesaTecnica` para `DefesaProcessual` versionada?
3. Portal advogado externo v1 ou v2?
4. Scraping de portais (e-CETESB) v1 ou v2?
5. Migração `AutoInfracao` legado: view de compatibilidade?
6. Operação suspensa: como propagar (evento BullMQ + flag derivada)?
7. Multa diária: congela na decisão final ou continua até cumprimento?
8. Catálogo TipoInfracao: começar com CETESB+IBAMA+ANP+INMETRO?
9. Prazos contestáveis: flag "sob análise jurídica" suspende?
10. ScoreRisco existente: refatorar com base nas novas entidades?
11. Dossiê do processo (PDF cronológico) v1 ou v2?
