# 28. Relatório da Onda 2.9.6 — Edição Controlada de Proposta Comercial e Status

## 1. Resumo

A Onda 2.9.6 implementou edição controlada de dados comerciais simples da proposta persistida, sem alterar itens, preços, motor financeiro ou qualquer artefato derivado.

Escopo entregue:

- auditoria da API e UI existentes;
- criação de endpoint `PATCH /api/v1/comercial/propostas/:id`;
- atualização controlada de:
  - `status`
  - `dataValidade`
  - `observacoesComerciais`
- validação de transições de status no backend;
- atualização da tela de detalhe para edição desses campos;
- manutenção da sanitização dos campos sensíveis;
- validação por `typecheck`, testes e `build`.

Escopo não executado:

- edição de itens;
- alteração de preços;
- recálculo da proposta;
- PDF;
- contrato;
- ordem de serviço;
- financeiro;
- handoff;
- Prisma;
- seed;
- migration;
- próxima onda.

## 2. Contexto Lido

Arquivos de contexto consultados:

- `docs/23_RELATORIO_ONDA_2_9_2_API_PROPOSTA_COMERCIAL.md`
- `docs/24_RELATORIO_ONDA_2_9_2_1_SANEAMENTO_PRISMA_CLIENT.md`
- `docs/25_RELATORIO_ONDA_2_9_3_UI_PROPOSTA_COMERCIAL.md`
- `docs/26_RELATORIO_ONDA_2_9_4_TESTES_REFINAMENTO_UI_PROPOSTA.md`
- `docs/27_RELATORIO_ONDA_2_9_5_E2E_AUTENTICACAO_PROPOSTA.md`

## 3. Auditoria Inicial

Arquivos auditados antes da implementação:

- `apps/api/src/modules/comercial/comercial.routes.ts`
- `apps/api/src/modules/comercial/propostas.service.ts`
- `apps/api/src/modules/comercial/propostas.schemas.ts`
- `apps/api/src/modules/comercial/propostas.types.ts`
- `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts`

Conclusão da auditoria:

- não existia `PATCH /api/v1/comercial/propostas/:id`;
- o service só suportava criar, listar e detalhar;
- a UI de detalhe era apenas leitura;
- os testes cobriam criação/listagem/detalhe, mas não edição.

## 4. Endpoint Entregue

Endpoint implementado:

```http
PATCH /api/v1/comercial/propostas/:id
```

Payload permitido:

```json
{
  "status": "PRONTA",
  "dataValidade": "2026-12-31",
  "observacoesComerciais": "Proposta revisada para envio comercial."
}
```

Campos aceitos:

- `status`
- `dataValidade`
- `observacoesComerciais`

Campos explicitamente não aceitos:

- itens da proposta;
- preços;
- snapshots;
- campos internos do catálogo;
- qualquer campo financeiro.

## 5. Regras de Status

Foi adotada uma máquina de estados conservadora no backend:

- `RASCUNHO` → `PRONTA`, `CANCELADA`
- `PRONTA` → `RASCUNHO`, `ENVIADA`, `CANCELADA`
- `ENVIADA` → `EM_NEGOCIACAO`, `APROVADA`, `REJEITADA`, `EXPIRADA`, `CANCELADA`
- `EM_NEGOCIACAO` → `APROVADA`, `REJEITADA`, `EXPIRADA`, `CANCELADA`
- `APROVADA` → terminal
- `REJEITADA` → terminal
- `EXPIRADA` → terminal
- `CANCELADA` → terminal

Comportamento:

- transição inválida retorna `400`;
- a API mantém atualização de `dataValidade` e `observacoesComerciais` sem tocar em itens;
- `atualizadoPor` e `atualizadoEm` passam a refletir a edição.

## 6. UI Atualizada

Tela alterada:

- `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx`

Entregas na UI:

- bloco `Edição Comercial` no detalhe da proposta;
- seletor de `status` com opções limitadas conforme o status atual;
- campo `data de validade`;
- campo `observações comerciais`;
- feedback visual de sucesso e erro;
- manutenção dos blocos de leitura já existentes:
  - cabeçalho
  - dados comerciais
  - diagnóstico resumido
  - itens da proposta

## 7. Segurança Mantida

Foi mantida a proteção contra exposição de:

- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- `observacoesInternas`
- `custoInternoEstimado`
- `margemLucroAlvo`
- `valorReferenciaHora`
- `metadata`

A resposta do `PATCH` continua usando o mesmo contrato público sanitizado do detalhe.

## 8. Arquivos Alterados

| Arquivo | Ação | Finalidade |
|---|---|---|
| `docs/27_RELATORIO_ONDA_2_9_5_E2E_AUTENTICACAO_PROPOSTA.md` | Criado | Registro faltante da onda anterior |
| `apps/api/src/modules/comercial/propostas.types.ts` | Alterado | Tipo de payload de atualização |
| `apps/api/src/modules/comercial/propostas.schemas.ts` | Alterado | Schema Zod do `PATCH` |
| `apps/api/src/modules/comercial/comercial.routes.ts` | Alterado | Exposição do endpoint `PATCH /propostas/:id` |
| `apps/api/src/modules/comercial/propostas.service.ts` | Alterado | Lógica de atualização controlada e transição de status |
| `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts` | Alterado | Cobertura de atualização e transição inválida |
| `apps/web/src/app/(app)/comercial/propostas/shared.ts` | Alterado | Tipos da edição |
| `apps/web/src/app/(app)/comercial/propostas/actions.ts` | Alterado | Action para atualizar proposta |
| `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx` | Reescrito | UI de detalhe com edição controlada |
| `docs/28_RELATORIO_ONDA_2_9_6_EDICAO_CONTROLADA_PROPOSTA_STATUS.md` | Criado | Registro técnico desta onda |

## 9. Validações Executadas

| Comando | Resultado |
|---|---|
| `npm run typecheck` em `apps/api` | Passou |
| `npm run typecheck` em `apps/web` | Passou |
| `npm test` em `apps/api` | Passou |
| `npm run build` em `apps/api` | Passou |
| `npm run build` em `apps/web` | Passou |

Resultado da suíte da API:

- `2` arquivos de teste passados
- `12` testes passados

## 10. Status Final

A proposta comercial agora suporta edição controlada de dados comerciais simples, com:

- API autenticada;
- transições de status validadas;
- UI funcional no detalhe;
- itens e preços preservados;
- campos sensíveis protegidos;
- validação completa por tipagem, testes e build.
