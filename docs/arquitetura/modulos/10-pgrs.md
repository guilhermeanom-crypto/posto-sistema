# Módulo 10 — PGRS (Plano de Gerenciamento de Resíduos Sólidos)

> Plano-mestre versionado que **agrega** catálogo de resíduos, destinadores homologados, metas anuais, exigências e evidências (MTRs+CDFs do M9 servem como evidência automática).

## Decisão arquitetural nº10
PGRS é plano anual com ART. Auto-vínculo: todo MTR emitido aponta para PGRS vigente. Renovação anual obrigatória.

## Base normativa
- **Lei 12.305/2010** + **Decreto 10.936/2022** — PNRS exige PGRS para grandes geradores e revendedores de combustíveis.
- **Resolução ANP 9/2007** + **CONAMA 362/2005** — OLUC.
- **NBR 10.004** — classificação resíduos.
- **NBR 12.235** — armazenamento classe I.
- **NBR 11174** — armazenamento IIA/IIB.

## Modelo (deltas)

```prisma
// PGRS (existente) ganha:
//   diagnosticoInicial Json   (resíduos gerados, classificação, geração mensal estimada),
//   areaArmazenamentoDescricao Json,
//   planoEmergenciaResiduos String?,
//   procedimentos Json,
//   responsavelOperacionalId  (FK Pessoa do M4),
//   destinadoresHomologadosIds String[]   (FK Destinador do M9),
//   metasAnuaisIds String[]   (FK MetaResiduoAnual)

model ResiduoCatalogadoPGRS {
  id String @id; pgrsId String
  tipoResiduo TipoResiduoPosto      // do M9
  classeABNT String                  // I | IIA | IIB
  geracaoEstimadaKgMes Decimal? @db.Decimal(12,3)
  origemNoPosto String               // SAO | MANUTENCAO | LOJA
  destinacaoPlanejadaId String?      // FK Destinador
  acondicionamentoPlanejado String
}
```

Reaproveita `PGRSExigencia` + `PGRSEvidencia` já existentes. Adiciona vínculo automático MTR conciliado → PGRSExigencia COMPROVADO.

## Regras críticas
- **RD1**: posto operando sem PGRS vigente >30d ⇒ alerta crítico + bloqueio score.
- **RD2**: emitir MTR sem PGRS vigente é permitido (operacional), mas marca como pendência crítica.
- **RM1**: meta anual ultrapassada ⇒ alerta para revisar PGRS.
- **RM2**: destinador novo usado em MTR sem estar em homologadosIds ⇒ alerta inconformidade.

## Dependências cruzadas
- **M9 (MTR)**: MTRs servem como evidências.
- **M1 (Licenças)**: PGRS frequentemente é condicionante da LO.

## Bug B4 (corrigido na Fase 0)
Seed antigo criava PGRS apenas para 2 empreendimentos (`take: 2`). Agora seed cria 1 PGRS vigente por empreendimento ativo.

## Casos de borda
- PGRS coletivo (rede com PGRS-mãe + adendos por posto): permitir versão "rede" + ajustes locais.
- Mudança de classificação ABNT do resíduo: nova versão de PGRS.

## Perguntas abertas
1. PGRS coletivo de rede vs individual por posto?
2. Editor visual de PGRS (formulário guiado) — escopo?
