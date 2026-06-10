# Módulo 12 — Funcionários (Visão Agregada de SST)

> **Não é módulo de domínio próprio.** É **camada de apresentação** sobre o M4 (SST). Sem schema novo.

## Decisão arquitetural nº12
A tela "Funcionários" passa a ser **projeção de `VinculoEmpregaticio` + `AptidaoComputada`** filtrada por empreendimento.

## Composição da tela (refeita)

```
Funcionários (do posto X)
├─ KPI: Total / Aptos / Inaptos T / Inaptos D / Em Admissão
├─ Filtros: setor (PISTA, DESCARGA…), cargo, estado de aptidão
├─ Lista (tabela):
│    Pessoa | Cargo | Setor | Vínculo | ASO | NR-20 | EPIs | Aptidão
├─ Ações por linha:
│    • Ver dossiê
│    • Renovar ASO (cria Tarefa)
│    • Inscrever em treinamento
│    • Entregar EPI
│    • Transferir / Desligar
└─ Ações em massa:
     • Convocar para treinamento NR-20
     • Exportar dossiês
     • Auditoria (CSV)
```

## Cálculo correto do KPI (corrigido na Fase 0 — B2)

```
total       = count(Vínculo ATIVO + EM_ADMISSAO no posto)
aptos       = count com AptidaoComputada.estado = APTO
inaptos_t   = count com estado = INAPTO_TEMPORARIO
inaptos_d   = count com estado = INAPTO_DEFINITIVO
em_admissao = count com estado = PENDENTE
afastados   = count com vínculo AFASTADO
```

Bug B2 (anterior): KPI calculado sobre página atual em vez do total filtrado, e semântica permissiva de AUSENTE = ATENCAO. Corrigido: agora API retorna `kpis` agregado e AUSENTE de ASO/Treinamento (legalmente obrigatório) = CRITICO.

## Endpoints novos (apenas leitura)

```
GET /empreendimentos/:id/funcionarios          # tabela
GET /empreendimentos/:id/funcionarios/kpis     # cards
GET /empreendimentos/:id/funcionarios/export   # CSV / PDF dossiê em massa
```

## Dependências
**100% derivado de M4 (SST)** — sem schema próprio.

## Casos de borda
- Pessoa em transferência (vínculo desligado em A, novo em B): mostrar correto em ambos.
- Terceirizado: badge distinto (responsabilidade legal externa).
- Visão consolidada da rede (gestor): tela `/funcionarios` global, filtra por posto.

## Perguntas abertas
1. Visão de rede (multi-posto) na mesma tela?
2. Calendário pessoal de cada funcionário (próximos exames/treinamentos) v2?
