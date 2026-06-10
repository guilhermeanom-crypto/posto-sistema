# 84. Relatorio da Onda 3.12 - Modulo Financeiro (Agregacao)

## 1. Objetivo
Criar modulo financeiro como agregacao pura sobre Contrato + OS + Entregavel, substituindo o mock da tela `/financeiro`.

## 2. Entregas

### Backend
- `financeiro.service.ts` em `apps/api/src/modules/comercial/` — funcao `calcularFinanceiroResumo(tenantId)`:
  - 3 queries paralelas agregando `contratos`, `ordens_servico`, `entregaveis`.
  - KPIs: MRR, ARR, totalContratosAtivos, totalOSsAbertas, totalOSsConcluidasMes, totalEntregaveisPendentes, totalEntregaveisDisponiveis, receitaEstimadaMes.
- Endpoint `GET /api/v1/comercial/financeiro/resumo` adicionado em `comercial.routes.ts`.
- Sem migration, sem tabela nova (agregacao pura SQL).

### Frontend
- Tela `/financeiro` reescrita: Server Component com dados reais.
- 4 KPIs principais: MRR, ARR, Receita estimada/mes, Contratos ativos (formatados em BRL).
- Painel de operacao: 4 MiniKPIs clicaveis linkando pra `/ordens-servico` e `/entregaveis`.
- Painel de receita recorrente: barras MRR/ARR com percentual visual.
- Mocks `moeda`, `servicosCatalogo` de `gestao-interna/data` removidos.

### Validacao
- `pnpm typecheck` apps/api: sem erros.
- `pnpm typecheck` apps/web: sem erros.
- Suite completa: **66/66 testes verdes**, zero regressao.

## 3. Decisao de escopo
Nesta onda optamos por **agregacao pura** sem entidade Receita/Custo porque:
- Nao ha faturamento real (NF-e, gateway).
- MRR/ARR derivam diretamente de `contratos.valor_mensal WHERE status=ATIVO`.
- Entidades de faturamento detalhado virao quando houver integracao com cobranca real.

## 4. Documentos
- `docs/83_PLANO_ONDA_3_12_FINANCEIRO.md`
- `docs/84_RELATORIO_ONDA_3_12_FINANCEIRO.md`

## 5. Proximo: Onda 3.13 — Validacao do fluxo ponta-a-ponta
