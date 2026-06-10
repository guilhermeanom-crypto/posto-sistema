# 75. Plano da Onda 3.8 - Consolidacao da Listagem Operacional de Handoffs

## 1. Objetivo desta onda

Aumentar a visibilidade de carteira na listagem operacional de handoffs em `/operacao/handoffs`, sem alterar o modelo de dados, sem migration, sem novo campo de banco.

Esta onda atende a recomendacao da secao 9 do [74_MAPA_DE_ALINHAMENTO_PLANO_MESTRE_X_ESTADO_ATUAL.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/74_MAPA_DE_ALINHAMENTO_PLANO_MESTRE_X_ESTADO_ATUAL.md>) como proximo bloco funcional de menor risco apos o fechamento da Onda 3.7.

## 2. Diagnostico do estado atual

### 2.1 Backend - `apps/api/src/modules/operacao/`

- `handoffs.service.ts` -> classe `HandoffsService.listar` ja existe, com paginacao e filtros.
- A query SQL atual seleciona apenas 20 colunas para o resumo. Nao traz:
  - `prioridade_operacional`
  - `necessidade_documentos`
  - `necessidade_visita`
  - `necessidade_terceiro`
- `HandoffSummaryRow` (interface TS) reflete o mesmo recorte limitado.
- `buildHandoffFiltersSql` aceita: `status`, `propostaComercialId`, `empreendimentoId`, `responsavelComercialId`, `responsavelOperacionalId`.
- `filtrosHandoffComercialSchema` (Zod) aceita os mesmos filtros, mais paginacao.
- `handoffComercialResumoSchema` (Zod) reflete o recorte limitado da SummaryRow.

### 2.2 Frontend - `apps/web/src/app/(app)/operacao/handoffs/`

- `page.tsx` (client component) lista handoffs via `/api/operacao/handoffs` (proxy).
- Filtros disponiveis na UI:
  - Status (select com os 8 status)
  - Proposta, Empreendimento, Responsavel Comercial, Responsavel Operacional (inputs texto que esperam UUID)
- Colunas da tabela:
  - Proposta (numero + descricao do CNAE)
  - Status (badge)
  - Lead / Empresa
  - Localidade (municipio/UF)
  - CNAE / Risco
  - Potencial poluidor
  - Responsaveis (textos genericos "definido" / "atribuido")
  - Datas (criado / atualizado)
  - Acao (link para o detalhe)
- Paginacao por pagina + tamanho fixo de 20 itens.

### 2.3 Gaps identificados

| Gap | Impacto operacional |
|---|---|
| Prioridade operacional invisivel na lista | Coordenador nao consegue priorizar carteira sem abrir um a um |
| Flags de preparacao invisiveis na lista | Pendencias de documento/visita/terceiro nao aparecem na fila |
| Sem filtro por prioridade | Impossivel listar "todos os criticos" |
| Sem filtro por pendencia de preparacao | Impossivel listar "todos com pendencia de visita" |
| Sem filtro `apenas ativos` | Lista mistura encerrados (CANCELADO / CONCLUIDO) com fila viva |
| Filtros por UUID em campo texto | Inutilizaveis para operador final (mantidos como busca avancada) |

## 3. Escopo desta onda

### 3.1 Mexe

- `apps/api/src/modules/operacao/handoffs.service.ts`
  - Expandir `HandoffSummaryRow` com 4 colunas adicionais.
  - Expandir SELECT da query `listar` para incluir as 4 colunas.
  - Atualizar `mapHandoffSummaryRow`.
  - Expandir `buildHandoffFiltersSql` com novos filtros.
- `apps/api/src/modules/operacao/handoffs.schemas.ts`
  - Expandir `handoffComercialResumoSchema` com 4 campos.
  - Expandir `filtrosHandoffComercialSchema` com novos filtros opcionais.
- `apps/api/src/modules/operacao/handoffs.types.ts`
  - Expandir `ListarHandoffsComerciaisInput` com novos filtros.
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`
  - Expandir `HandoffComercialResumo` com 4 campos.
  - Expandir `ListarHandoffsOperacionaisParams` com novos filtros.
- `apps/web/src/app/(app)/operacao/handoffs/page.tsx`
  - Adicionar colunas "Prioridade" e "Preparacao" na tabela.
  - Adicionar filtros: prioridade (select), pendencias (checkboxes), apenas ativos (checkbox).
  - Ajustar `URLSearchParams` para enviar os novos filtros.
- `apps/web/src/app/api/operacao/handoffs/route.ts` (proxy Next)
  - Confirmar que o proxy repassa os novos query params sem perda.

### 3.2 Nao mexe

- Prisma schema.
- Migrations.
- Banco de dados.
- Detalhe do handoff (Onda 3.7 ja consolidou).
- Endpoint `PATCH /:id` (sem mudanca).
- Endpoint `GET /:id` (sem mudanca).
- Telas comerciais (proposta, motor de orcamento).
- Portal do cliente, area de campo.

## 4. Novos filtros propostos

| Filtro | Tipo | Comportamento backend |
|---|---|---|
| `prioridadeOperacional` | `BAIXA \| MEDIA \| ALTA \| CRITICA` | `WHERE prioridade_operacional = X` |
| `comNecessidadeDocumentos` | `boolean` | Se true: `necessidade_documentos = true` |
| `comNecessidadeVisita` | `boolean` | Se true: `necessidade_visita = true` |
| `comNecessidadeTerceiro` | `boolean` | Se true: `necessidade_terceiro = true` |
| `apenasAtivos` | `boolean` | Se true: `status IN (STATUS_HANDOFF_ATIVOS)` |

Os filtros sao opcionais e cumulativos (`AND`). Quando nao enviados, o comportamento atual e preservado.

## 5. Mudancas visuais propostas

### 5.1 Tabela

Inserir duas colunas novas entre "CNAE / Risco" e "Potencial":

- **Prioridade**: badge colorido (cinza para sem prioridade, azul para baixa, ambar para media, laranja para alta, vermelho para critica).
- **Preparacao**: tres mini-badges quando flag = true: `Doc`, `Visita`, `Terceiro`. Quando false ou null: vazio.

### 5.2 Filtros

Reorganizar bloco de filtros em duas linhas:

- Linha 1 (operacional): Status | Prioridade | Apenas ativos (checkbox)
- Linha 2 (preparacao): com pendencia de Documentos | com pendencia de Visita | com pendencia de Terceiro
- Linha 3 (avancada, recolhivel): Proposta | Empreendimento | Resp. Comercial | Resp. Operacional (mantida)

## 6. Riscos e travas

| Risco | Mitigacao |
|---|---|
| Quebrar contrato Zod do resumo (clientes externos) | Apenas adicionar campos opcionais/nullable, nao remover existentes |
| Quebrar `__tests__` existentes da listagem | Rodar suite ao final, ajustar se necessario |
| Performance da query nova | Adicionar 4 colunas escalares ja na mesma tabela nao muda plano de execucao |
| Filtros booleanos novos no proxy Next | Confirmar parsing como `"true"`/`"false"` string |

## 7. Criterios de aceite

- [ ] Backend retorna `prioridadeOperacional` e as 3 flags em cada item da listagem.
- [ ] Filtros novos funcionam isoladamente e combinados.
- [ ] UI exibe colunas Prioridade e Preparacao.
- [ ] UI envia filtros novos via querystring corretamente.
- [ ] Testes existentes em `apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts` continuam passando.
- [ ] `pnpm build` no `apps/api` passa.
- [ ] `pnpm build` no `apps/web` passa.
- [ ] Relatorio de fechamento gerado como doc 76.

## 8. Itens fora de escopo

- Filtros por intervalo de data.
- Ordenacao customizavel.
- Export CSV.
- Bulk actions.
- Atribuicao em massa.
- Tela de fila por responsavel.

Esses itens ficam para uma eventual Onda 3.8.1 futura, se a demanda real for confirmada.

## 9. Aderencia ao Plano Mestre

- Mantem `/Posto/sistema` como nucleo unico.
- Nao expande banco (principio 7).
- Nao adiciona telas sem API correspondente (principio 8).
- Mantem multi-tenant via `tenant_id` (ja presente em `buildHandoffFiltersSql`).
- Continua dentro do dominio do handoff antes de abrir Contrato/OS/Entregavel/Financeiro.
