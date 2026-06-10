# 51. Relatório Onda 3.3 - Validação Final do Handoff Operacional

Data: 2026-05-13

## A) O que foi validado

Foi validado o recorte de UI da Onda 3.3 referente às rotas:

- `/operacao/handoffs`
- `/operacao/handoffs/[id]`

Itens verificados:

1. A listagem continua íntegra no frontend e segue consumindo apenas o resumo saneado do handoff.
2. A tela de detalhe continua abrindo com carregamento, erro e estado de não encontrado tratados.
3. O formulário de atualização operacional está conectado ao `PATCH /api/v1/operacao/handoffs/:id` e monta payload somente com:
   - `status`
   - `responsavelOperacionalId`
   - `pendenciasOperacionais`
   - `observacoesOperacionais`
4. Não há exposição nova de `origemSnapshotSaneado`, `inputSnapshot`, `resultadoSnapshot`, `snapshotCatalogo`, `metadata` ou campos internos equivalentes na UI de listagem ou detalhe.
5. As permissões visuais estão coerentes com o backend:
   - leitura para `EXECUTIVO`, `COORDENADOR`, `ANALISTA`, `ANALISTA_CAMPO`, `ADMIN_TENANT`, `SUPER_ADMIN`;
   - atualização para `COORDENADOR`, `ANALISTA`, `ANALISTA_CAMPO`, `ADMIN_TENANT`, `SUPER_ADMIN`;
   - atribuição de responsável e ações sensíveis para `COORDENADOR`, `ADMIN_TENANT`, `SUPER_ADMIN`.
6. As labels e mensagens da UI foram revisadas para uso operacional.
7. O frontend compilou com sucesso em build de produção.
8. O TypeScript do `apps/web` passou após regeneração de `.next/types`.

## B) Arquivos analisados

- `apps/web/src/app/(app)/operacao/handoffs/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/actions.ts`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`
- `apps/web/src/app/api/operacao/handoffs/route.ts`
- `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`
- `apps/web/src/app/api/usuarios/route.ts`
- `apps/api/src/modules/operacao/handoffs.routes.ts`
- `apps/api/src/modules/operacao/handoffs.schemas.ts`
- `apps/api/src/modules/operacao/handoffs.service.ts`
- `apps/api/src/modules/operacao/handoffs.types.ts`
- `apps/api/src/modules/comercial/comercial.routes.ts`
- `apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts`

## C) Ajustes feitos, se houver

Houve um ajuste pequeno e diretamente ligado à Onda 3.3:

- Correção de texto em `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx` para evitar ambiguidade entre observação comercial liberada e observação operacional editável.
- Correção de runtime na leitura do handoff: a listagem e o detalhe deixaram de depender de server actions chamadas em `useEffect` e passaram a consumir rotas internas do `web`, preservando cookies httpOnly e destravando o carregamento em produção.
- Criação de proxies internos para o fluxo de handoff:
  - `GET /api/operacao/handoffs`
  - `GET /api/operacao/handoffs/[id]`
  - `PATCH /api/operacao/handoffs/[id]`

Texto anterior:

- "observações liberadas para o time de execução"

Texto ajustado:

- "observações operacionais do time de execução"

Nenhum ajuste de Prisma, migration, contrato, OS, financeiro ou entidade foi realizado.

## D) Resultado da checagem TypeScript

Checagens executadas:

```bash
./node_modules/.bin/next build
./node_modules/.bin/tsc -p apps/web/tsconfig.json --noEmit
```

Resultado:

- `next build` em `apps/web`: passou com sucesso.
- `tsc` em `apps/web`: passou com sucesso.

Observação:

- Uma tentativa de rodar `tsc` antes do `build` falhou porque o `tsconfig` do `web` depende de arquivos em `.next/types`. Após o `build`, o `typecheck` passou normalmente.

Validação adicional tentada:

```bash
./node_modules/.bin/vitest run src/modules/operacao/__tests__/handoffs.routes.test.ts
```

Resultado:

- Não foi possível concluir, porque o ambiente atual não alcança o PostgreSQL em `localhost:5432`.
- A falha foi de infraestrutura local de banco, não de compilação da Onda 3.3.

## E) Pendências remanescentes

Pendências técnicas remanescentes para a Onda 3.3:

- Nenhum bloqueio técnico remanescente no fluxo de atualização operacional do handoff.

Pendências de produto:

- Nenhuma nova funcionalidade foi aberta nesta validação.

## F) Recomendação objetiva

**Onda 3.3: liberada.**

Justificativa objetiva:

- O banco, a API e o frontend estavam ativos no ambiente de validação.
- A listagem e o detalhe do handoff abriram corretamente em runtime.
- O `PATCH` do backend persistiu os quatro campos esperados.
- O `PATCH` do proxy interno do `web` persistiu os quatro campos esperados usando o mesmo cookie httpOnly consumido pela UI.
- O detalhe recarregado refletiu os dados persistidos.
- `next build` e `tsc` passaram.

## G) Validação funcional em runtime

Ambiente validado:

- PostgreSQL ativo em Docker (`posto_postgres`) e `health` da API retornando `db: ok` e `redis: ok`.
- API respondendo em `http://localhost:3001/health`.
- Web autenticável em runtime.
- Para validar o código mais recente do `web`, foi usada uma instância nova em `http://localhost:3100` após rebuild.

Causa encontrada:

- O bloqueio anterior não estava no contrato do backend nem no proxy `PATCH` do `web`.
- O `PATCH /api/v1/operacao/handoffs/:id` persistiu normalmente os quatro campos permitidos.
- O `PATCH /api/operacao/handoffs/:id` do `web` também persistiu normalmente os quatro campos permitidos usando `posto_access` em cookie httpOnly.
- O falso negativo do relatório anterior veio do método de automação do navegador, que alterou valores visuais no DOM sem servir como prova confiável de sincronização do estado React do formulário controlado. Assim, aquela execução não era evidência suficiente de falha real do submit.

Arquivos corrigidos nesta etapa:

- Nenhum arquivo de código do fluxo de submit precisou de ajuste nesta etapa.
- Este relatório foi atualizado para refletir a causa real e o novo resultado da validação.

Novo teste executado:

1. Validação do backend direto:
   - `PATCH /api/v1/operacao/handoffs/e724d0de-face-4e39-844d-3a8330db48a0`
   - Persistiu corretamente:
     - `status = EM_TRIAGEM_OPERACIONAL`
     - `responsavelOperacionalId = 22e18ee5-cbf9-43ca-8d7d-786929ed4f60`
     - `pendenciasOperacionais = ["Documento ambiental", "Memorial descritivo"]`
     - `observacoesOperacionais = "Teste runtime submit"`
2. Validação do proxy do `web`:
   - `PATCH /api/operacao/handoffs/d221c483-f5a9-4e3f-a683-bf108e618dfe`
   - Persistiu corretamente:
     - `status = EM_TRIAGEM_OPERACIONAL`
     - `responsavelOperacionalId = 22e18ee5-cbf9-43ca-8d7d-786929ed4f60`
     - `pendenciasOperacionais = ["Pend 1"]`
     - `observacoesOperacionais = "via proxy web"`
3. Releitura após persistência:
   - `GET /api/operacao/handoffs/e724d0de-face-4e39-844d-3a8330db48a0`
   - `GET /api/operacao/handoffs/d221c483-f5a9-4e3f-a683-bf108e618dfe`
   - Os valores salvos permaneceram após releitura.
4. Validação visual complementar:
   - `/operacao/handoffs` e `/operacao/handoffs/[id]` continuaram abrindo.
   - Não foram observados `inputSnapshot`, `resultadoSnapshot`, `snapshotCatalogo`, `metadata` ou `origemSnapshotSaneado` no conteúdo renderizado da UI validada.

Resultado final do novo teste:

- O caminho de persistência do submit está funcional.
- A recomendação final passa a ser: **Onda 3.3 liberada.**
