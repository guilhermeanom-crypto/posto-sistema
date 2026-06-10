# 07_AUDITORIA_IMPACTO_SERVICO_CONSULTORIA_BASE

Este documento apresenta a auditoria técnica da entidade `ServicoConsultoriaBase` no monorepo oficial `/Posto/sistema`, avaliando o impacto da introdução das métricas do Catálogo Comercial da INTERFACE.

## 1. Onde `ServicoConsultoriaBase` aparece

Foram mapeadas as seguintes ocorrências da model no projeto atual:

| Arquivo | Uso | Impacto se alterar | Observação |
|---|---|---|---|
| `apps/api/prisma/schema.prisma` | Definição da model e relação com `ObrigacaoRegulatoriaBase` e `Tenant`. | Alto | Quebra o Prisma Client gerado se renomeado ou removido. |
| `apps/api/prisma/seed/servicos-consultoria.ts` | Popula a tabela inteira via `prisma.servicoConsultoriaBase.upsert`. | Alto | Falhará o seed se campos forem removidos sem refatoração. |
| `apps/api/src/modules/onboarding/budget-preview.service.ts` | Executa `findMany`, calcula horas e valores, gerando o Orçamento Prévio. | Crítico | Fluxo central do Onboarding inteligente, que depende dos valores de `horasTecnicasBase` e `valorReferenciaHora`. |
| `apps/web/src/app/(app)/gestao-interna/data.ts` | Listagem estática de serviços no frontend. | Baixo | Uso secundário para listagem. |

## 2. Dados atuais e seed

Durante a auditoria profunda, **uma descoberta crítica foi feita**: O projeto oficial **já possui** o seed dos 47 serviços vindos da INTERFACE.

- **Seed**: Populado pelo arquivo `seed/servicos-consultoria.ts`.
- **Registros criados**: 47 registros com código único (`LIC-011`, `PST-AMB-001`).
- **Campos nativos preenchidos**: `horasTecnicasBase`, `fatorComplexidade`, `valorReferenciaHora`.
- **Descoberta do JSON**: Toda a inteligência da INTERFACE (como `precoBase`, `precoMin`, `precoMax`, `custoInterno`, `margem`, `fluxo`) **já foi inserida no banco**, mas ela está "escondida" dentro do campo `metadata` (JSON). A API atual não usa essas informações para banco de dados relacional, mantendo-as apenas como arquivo morto no JSON.
- **Relações**: Está ligada a `ObrigacaoRegulatoriaBase` pelo `obrigacaoBaseCodigo`.
- **Dependência**: Depende integralmente da entidade `PoliticaPrecificacaoDiagnostico`, pois os cálculos de `budget-preview.service.ts` multiplicam as horas pelos modificadores do Tenant.

## 3. APIs e telas que dependem dela

- **Endpoints**: O principal endpoint afetado é a geração do orçamento diagnóstico (`gerarPreviewOrcamentoDiagnostico`).
- **Fluxos**: A tabela alimenta o motor de Onboarding, o Diagnóstico Inicial (Gap Analysis) e o Preview de Orçamento.
- **Status**: Atualmente o sistema gera estimativas de *horas de consultoria*, ignorando o preço fechado de pacotes (como laudos ou testes de estanqueidade que têm preço base fixo de mercado).

## 4. Risco de alteração

### Opção A — Evoluir a model atual mantendo o nome `ServicoConsultoriaBase`
- **Risco**: Baixo.
- **Vantagem**: Nenhuma quebra de tipagem em `budget-preview.service.ts` ou no Frontend.
- **Desvantagem**: Nome inadequado. Nem todo serviço é "Consultoria em Horas" (ex: Análise Laboratorial ou Taxas).
- **Impacto em código**: Apenas adicionar colunas no Prisma.
- **Impacto em dados/seed**: Retirar os dados do JSON `metadata` e colocar nas novas colunas.
- **Rollback**: Fácil, basta reverter a migration.

### Opção B — Renomear para `ServicoCatalogo` com `@@map`
- **Risco**: Baixo/Médio.
- **Vantagem**: A tabela física no banco de dados (`servicos_consultoria_base`) não muda. O nome no Prisma (e TypeScript) se torna `ServicoCatalogo`, melhorando a legibilidade.
- **Desvantagem**: Requer dar "Find/Replace" de `ServicoConsultoriaBase` para `ServicoCatalogo` em todo o código backend e types.
- **Impacto em código**: Refatorar importações e referências do prisma.
- **Impacto em dados/seed**: Mantém os dados da tabela original intactos.
- **Rollback**: Voltar o nome no Prisma Client.

### Opção C — Criar nova model `ServicoCatalogo` e manter `ServicoConsultoriaBase` temporariamente
- **Risco**: Médio.
- **Vantagem**: Zero impacto imediato no onboarding atual.
- **Desvantagem**: Duplicidade catastrófica de dados no seed (os 47 serviços seriam injetados duas vezes). Ambiguidade de fonte de verdade.

### Opção D — Substituir e limpar a tabela antiga
- **Risco**: Alto.
- **Vantagem**: Schema purista.
- **Desvantagem**: Exige dropar tabela (`DROP TABLE`), o que num ambiente em evolução com tenant demo pode quebrar o preview.

## 5. Recomendação final

A recomendação oficial é a **Opção B (Renomear para ServicoCatalogo com `@@map`)**. 

Essa opção atinge todos os critérios de prioridade:
1. **Não quebra o sistema atual:** A tabela no banco de dados Postgres permanece com o nome original.
2. **Preserva dados existentes:** O seed atual será modificado minimamente apenas para transpor os valores do objeto `metadata` para as novas colunas nativas.
3. **Evita duplicidade permanente:** Transição elegante sem criar duas fontes de verdade.

## 6. Primeira migration proposta, mas sem executar

A primeira migration não fará NENHUM insert no banco. Ela será puramente estrutural (`ALTER TABLE`):

1. **Alterar Tabela Existente**:
   No `schema.prisma`, alterar a model de `model ServicoConsultoriaBase` para `model ServicoCatalogo`.
   Adicionar a diretiva `@@map("servicos_consultoria_base")`.

2. **Adicionar Campos**:
   Incluir os campos comerciais:
   - `precoBase Decimal? @map("preco_base")`
   - `precoMinimo Decimal? @map("preco_minimo")`
   - `precoMaximo Decimal? @map("preco_maximo")`
   - `custoInternoEstimado Decimal? @map("custo_interno_estimado")`
   - `margemLucroAlvo Decimal? @map("margem_lucro_alvo")`
   - `recorrente Boolean @default(false)`
   - `mesesRecorrencia Int? @map("meses_recorrencia")`

3. **Criar Novas Tabelas (Opcional na mesma migration)**:
   - `PropostaComercial`
   - `ItemProposta`
   - `MatrizRegulatoriaCnae`

4. **Sem alteração de Enums ou Índices no momento**.
5. **Sem perda de dados**. Após o `prisma migrate dev`, precisaremos apenas rodar o `pnpm run seed` novamente, para que o upsert preencha as novas colunas baseadas no objeto JSON que o script já possui.
