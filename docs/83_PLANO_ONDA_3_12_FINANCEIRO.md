# 83. Plano da Onda 3.12 - Modulo Financeiro (Agregacao)

## 1. Objetivo
Criar modulo financeiro como **agregacao pura** sobre Contrato + OS + Entregavel, substituindo o mock da tela `/financeiro` por dados reais. Sem migration, sem tabela nova.

## 2. Decisao tecnica
O Plano Mestre preve `Receita`, `Custo`, `FinanceiroResumo` como entidades. Nesta onda, optamos por agregacao direta SQL porque:
- Nao ha faturamento real ainda (nao ha nota fiscal, nao ha cobranca).
- As projecoes de receita derivam diretamente de `Contrato.valorMensal WHERE status=ATIVO`.
- Detalhamento de Receita/Custo individual sera criado quando houver integracao com gateway/NF-e.

## 3. KPIs calculados
- `mrr`: SUM(contratos.valor_mensal WHERE status=ATIVO)
- `arr`: mrr * 12
- `totalContratosAtivos`: COUNT(contratos WHERE status=ATIVO)
- `totalOSsAbertas`: COUNT(ordens_servico WHERE status IN PLANEJADA/EM_EXECUCAO/AGUARDANDO_REVISAO)
- `totalOSsConcluidasMes`: COUNT(ordens_servico WHERE status=CONCLUIDA AND data_conclusao >= month start)
- `totalEntregaveisPendentes`: COUNT(entregaveis WHERE status IN PENDENTE/GERANDO)
- `totalEntregaveisDisponiveis`: COUNT(entregaveis WHERE status=DISPONIVEL)
- `receitaEstimadaMes`: mrr (por ora, sera refinado com receita avulsa futura)

## 4. Escopo
- Service: `apps/api/src/modules/comercial/financeiro.service.ts`
- Route: GET `/api/v1/comercial/financeiro/resumo`
- Frontend: desmockar `/financeiro` com KPIs reais
- Testes: cenario basico de KPIs
