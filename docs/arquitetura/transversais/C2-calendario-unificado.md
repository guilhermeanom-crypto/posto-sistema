# Camada Transversal C2 — Calendário Unificado de Obrigações

> Agenda agregada de **todos os módulos** ("o que vence em 90d no Posto X").

## Decisão transversal nº2
Calendário **não armazena dados próprios** — é projeção materializada (read model). Cada módulo expõe um **provider** que lista suas obrigações futuras. Calendário consome todos via dispatcher e materializa em `ObrigacaoAgendada`, recalculada por evento + cron diário.

## Modelo

```prisma
enum OrigemObrigacao {
  LICENCA_VENCIMENTO LICENCA_RENOVACAO_T180 CONDICIONANTE_CICLO EXIGENCIA_PROCESSUAL
  ENSAIO_TECNICO CALIBRACAO_INMETRO SIMP_MENSAL ANALISE_QUALIDADE
  ASO_PERIODICO TREINAMENTO_RECICLAGEM EPI_VENCIMENTO PGR_RENOVACAO CIPA_ELEICAO CAT_ACIDENTE
  PRAZO_PROCESSUAL PARCELA_MULTA TAC_OBRIGACAO
  OUTORGA_RENOVACAO MEDICAO_VAZAO LAUDO_AGUA
  ALVARA_RENOVACAO AVCB_RENOVACAO
  CAMPANHA_MONITORAMENTO MTR_CONCILIACAO PGRS_RENOVACAO CHECKLIST_CICLO OUTRO
}

enum CriticidadeObrigacao { INFORMATIVA BAIXA MEDIA ALTA CRITICA FATAL }

model ObrigacaoAgendada {
  id String @id
  empreendimentoId String
  modulo String                          // canônico do módulo
  origem OrigemObrigacao
  entidadeOrigemTipo String              // ex.: "Processo", "EnsaioTecnico"
  entidadeOrigemId String
  
  titulo String
  descricaoCurta String
  
  dataObrigacao DateTime @db.Date        // data efetiva
  dataAlertaInicio DateTime @db.Date     // quando começa a aparecer
  
  criticidade CriticidadeObrigacao
  scoreImpacto Int                       // peso no score
  
  responsavelPapelSugerido String?
  responsavelUsuarioId String?
  
  status String                          // PENDENTE | EM_ANDAMENTO | CUMPRIDA | EXPIRADA | DISPENSADA
  cumpridaEm DateTime?
  cumpridaPorId String?
  evidenciaDocumentoId String?
  
  tarefaId String?
  alertasGerados String[]
  
  hashConteudo String
  recalculadaEm DateTime
  
  @@unique([entidadeOrigemTipo, entidadeOrigemId, dataObrigacao])
  @@index([empreendimentoId, dataObrigacao, status])
  @@index([criticidade, status])
}
```

## Provider Interface

```typescript
interface ObrigacaoProvider {
  modulo: string;
  listarObrigacoesFuturas(empreendimentoId: string, janelaDias: number): Promise<ObrigacaoCanonica[]>;
  listarObrigacoesPorEntidade(entidadeId: string): Promise<ObrigacaoCanonica[]>;
}
// Cada módulo implementa o seu (M1ProvLicencas, M2ProvEnsaios, ...)
// Dispatcher central registra todos
```

## Algoritmo de agregação

```
funcao recalcularObrigacoes(empreendimentoId):
  todas = []
  para cada modulo em [M1..M11]:
    provider = obterProvider(modulo)
    todas.adicionar(provider.listarObrigacoesFuturas(empreendimentoId, 730))
  
  para cada obrigacao em todas:
    existente = encontrar por (entidadeTipo, entidadeId, dataObrigacao)
    novoHash = sha256(obrigacao.dadosRelevantes)
    se existente && existente.hashConteudo != novoHash:
      atualizar(existente, obrigacao)
    senao se !existente:
      inserir(obrigacao)
  
  obsoletas = encontrar onde recalculadaEm < cutoff
  marcar dispensadas
```

## Visualizações
- **Lista** (default): tabela ordenada por data com filtros.
- **Calendário visual** (mês/semana/dia): blocos coloridos por criticidade.
- **Timeline** (Gantt) por empreendimento.
- **Heatmap rede**: matriz posto × módulo × densidade.

## Casos de borda
1. Obrigação cumprida mas dataObrigacao futura: marcar CUMPRIDA mas histórico visível.
2. Obrigação que muda de data: hash detecta, atualiza, alerta para responsável.
3. Múltiplos alertas para mesma obrigação (T-90, T-60...): alertas separados, obrigação única.

## Perguntas abertas
1. Visualização Gantt v1 ou v2?
2. Heatmap rede v1 ou v2?
3. Sincronização com calendário externo (Google/Outlook) v2?
