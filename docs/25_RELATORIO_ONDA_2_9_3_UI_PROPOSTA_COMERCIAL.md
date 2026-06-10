# 25. Relatório da Onda 2.9.3 — UI de Proposta Comercial

## 1. Resumo

A Onda 2.9.3 implementou a UI de Proposta Comercial a partir da Triagem, incluindo:

- botão "Gerar proposta" na tela de triagem;
- listagem `/comercial/propostas`;
- detalhe `/comercial/propostas/[id]`;
- consumo da API de proposta persistida;
- validação por `typecheck` e `build`.

Não houve:

- backend novo;
- Prisma;
- seed;
- migration;
- contrato;
- OS;
- financeiro;
- PDF;
- handoff.

## 2. Arquivos criados/alterados

| Arquivo | Ação | Finalidade |
|---|---|---|
| `apps/web/src/app/(app)/comercial/triagem/shared.ts` | Alterado | Adicionados tipos para proposta criada |
| `apps/web/src/app/(app)/comercial/triagem/actions.ts` | Alterado | Adicionada função para gerar proposta |
| `apps/web/src/app/(app)/comercial/triagem/triagem-form.tsx` | Alterado | Adicionado botão "Gerar proposta" |
| `apps/web/src/app/(app)/comercial/propostas/shared.ts` | Criado | Tipos para propostas comerciais |
| `apps/web/src/app/(app)/comercial/propostas/actions.ts` | Criado | Ações para listar e buscar propostas |
| `apps/web/src/app/(app)/comercial/propostas/page.tsx` | Criado | Página de listagem de propostas |
| `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx` | Criado | Página de detalhe de proposta |
| `apps/web/src/components/layout/app-sidebar.tsx` | Alterado | Adicionado item "Propostas" no menu |

## 3. Fluxo entregue

1. Usuário gera diagnóstico na triagem;
2. Botão "Gerar proposta" aparece;
3. Frontend chama `POST /api/v1/comercial/propostas`;
4. API persiste a proposta;
5. UI mostra sucesso e link para detalhe;
6. Listagem mostra propostas salvas;
7. Detalhe exibe cabeçalho, dados comerciais, diagnóstico, itens e totais.

## 4. Rotas frontend criadas/alteradas

- `/comercial/triagem`
- `/comercial/propostas`
- `/comercial/propostas/[id]`

## 5. Endpoints consumidos

- `POST /api/v1/comercial/propostas`
- `GET /api/v1/comercial/propostas`
- `GET /api/v1/comercial/propostas/:id`

## 6. Segurança

A UI não exibe nem armazena:

- `inputSnapshot` bruto;
- `resultadoSnapshot` bruto;
- `snapshotCatalogo` bruto;
- `observacoesInternas`;
- `custoInternoEstimado`;
- `margemLucroAlvo`;
- `valorReferenciaHora`;
- `metadata`.

## 7. Validações executadas

| Comando | Resultado |
|---|---|
| `npm run typecheck` em `apps/web` | Passou |
| `npm run build` em `apps/web` | Passou |

## 8. Limitações

- Ainda sem edição de itens;
- Ainda sem alteração de status pela UI;
- Ainda sem PDF;
- Ainda sem contrato;
- Ainda sem OS;
- Ainda sem financeiro;
- Ainda sem handoff;
- API ainda mantém raw SQL temporário por pendência do Prisma Client documentada na Onda 2.9.2.1.

## 9. Próxima etapa recomendada

`Onda 2.9.4 — Testes e refinamento da UI de proposta`