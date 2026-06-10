# Camada Transversal C5 — Score de Compliance Consolidado

## Decisão transversal nº5
Score é **agregação ponderada** com **transparência total** (cada ponto descontado tem causa rastreável). Recálculo por evento + diário. Histórico mantido (evolução).

## Modelo

```prisma
model ScoreCompliance {
  id String @id; empreendimentoId String
  scoreGlobal Int                   // 0-100
  nivel String                      // BAIXO_RISCO (≥85) | ATENCAO (70-84) | RISCO (50-69) | CRITICO (<50)
  // Composição por módulo
  scoreM1Licencas Int; scoreM2Sasc Int; scoreM3AnpInmetro Int
  scoreM4Sst Int; scoreM5Fiscal Int; scoreM6Outorga Int
  scoreM7Urbano Int; scoreM8Monitoramento Int
  scoreM9LogisticaReversa Int; scoreM10Pgrs Int; scoreM11Checklists Int
  // Detalhe granular
  pontosDescontos Json              // [{causa, modulo, entidade, pontos, severidade}]
  fatoresPositivos Json             // [{descricao, modulo, pontos}]
  recomendacoes Json                // [{prioridade, descricao, acao, tarefaSugerida}]
  hashConteudo String
  calculadoEm DateTime
}

model ScoreComplianceHistorico {
  empreendimentoId String
  competenciaAno Int; competenciaMes Int
  scoreMedio Int; scoreMinimo Int; scoreMaximo Int
  @@id([empreendimentoId, competenciaAno, competenciaMes])
}
```

## Algoritmo (pseudocódigo)

```
funcao calcularScore(empreendimentoId):
  pontuacaoBase = 100; descontos = []; fatoresPositivos = []
  
  // M1 — Licenças
  para cada lic em fetchLicencas(empreendimentoId):
    se lic.status == VENCIDA: descontos.add({causa:"LO vencida", pontos:-15, severidade:CRITICO})
    senao se lic.diasParaVencer < 30: descontos.add({pontos:-5, severidade:ATENCAO})
    para cada cond em lic.condicionantesVencidas: descontos.add({pontos:-3})
  
  // M2 — SASC
  para cada ativo em ativos(empreendimentoId):
    se ativo.status == INTERDITADO: descontos.add({pontos:-10})
    se ativo.ensaiosVencidos > 0: descontos.add({pontos:-5 por ensaio})
  
  // M3 — ANP
  se SIMP_atrasado: descontos.add({pontos:-10})
  se verificacao_INMETRO_vencida: descontos.add({pontos:-5 por bomba})
  se PMQC_reprovado: descontos.add({pontos:-15})
  
  // M4 — SST
  pessoasInaptas = countInaptos(empreendimentoId)
  se pessoasInaptas > 0: descontos.add({pontos:-(2 * pessoasInaptas)})
  se PGR_vencido: descontos.add({pontos:-15})
  se acidentes_30d > 0: descontos.add({pontos:-(5 * acidentes)})
  
  // M5 — Fiscalizações (peso pesado)
  se embargo_vigente: descontos.add({pontos:-25, severidade:CRITICO})
  para cada processo em processos_abertos:
    se processo.gravidade == GRAVISSIMA: pontos:-10
    se processo.prazoFatalProximo: pontos:-5
  
  // M6, M7, M8, M9, M10, M11 — pesos menores
  
  // Fatores positivos (bônus)
  se score_M5 == 100 (sem fiscalização há 12m): fatoresPositivos.add({pontos:+5})
  se 100% checklists em dia: fatoresPositivos.add({pontos:+3})
  se zero acidentes 12m + cobertura SST 100%: fatoresPositivos.add({pontos:+5})
  
  scoreFinal = max(0, min(100, pontuacaoBase + sum(descontos) + sum(fatoresPositivos)))
  scoreM1 = calcularSubscore(M1, descontos.filter(modulo=M1))  // ...
  recomendacoes = priorizarAcoes(descontos)  // top 5 ações
  
  persistir(ScoreCompliance)
  publicar("score.recalculado")
```

## Pesos por módulo (proposta)

| Módulo | Peso máx | Justificativa |
|---|---:|---|
| M1 Licenças | 18 | Sem licença = sem operação |
| M5 Fiscalização | 18 | Embargo derruba tudo |
| M2 SASC | 12 | Risco ambiental imediato |
| M3 ANP | 12 | Suspensão de venda |
| M4 SST | 10 | Risco humano |
| M8 Monitoramento | 8 | Passivo ambiental |
| M6 Outorga | 6 | |
| M7 Urbano | 6 | |
| M9 Resíduos | 5 | |
| M10 PGRS | 3 | |
| M11 Checklists | 2 | (operacional) |
| **Total** | **100** | |

## Visualizações
- **Badge no 360°**: cor + número.
- **Página de detalhe**: gráfico radar (subscores), lista de descontos com link para resolver, histórico (gráfico linha 12m), recomendações priorizadas.
- **Benchmarking de rede**: ranking dos postos.

## Casos de borda
1. Posto recém-criado (sem dados): score "não calculado" (não 100, não 0).
2. Mudança de pesos: recálculo histórico exige nova versão de algoritmo (versionar).
3. Embargo + score: score ainda calculável; banner separado.

## Perguntas abertas
1. Pesos configuráveis por tenant ou globais?
2. Versionamento do algoritmo de cálculo?
3. Score público (compartilhar com cliente final)? Sensível.
