# 17_RELATORIO_ONDA_2_7_1_ENDURECIMENTO_DIAGNOSTICO_TESTES

## 1. Objetivo

A Onda 2.7.1 teve como objetivo endurecer a entrega da Onda 2.7, transformando a validacao manual do diagnostico comercial por CNAE em uma base minima de testes automatizados de regressao.

Escopo executado:
- testes automatizados para o endpoint `POST /api/v1/comercial/diagnostico/cnae`
- cobertura de autenticacao
- cobertura de sanitizacao de campos sensiveis
- cobertura de 3 cenarios reais de diagnostico
- confirmacao de existencia dos servicos sugeridos no catalogo oficial
- validacao de orcamento sem exposicao de custo/margem

Escopo explicitamente nao executado:
- Onda 2.8
- UI
- proposta persistida
- contrato
- ordem de servico
- alteracao de Prisma, migration ou seed
- alteracao de dashboard, documentos, processos, tarefas, condicionantes ou portal

---

## 2. Auditoria do Padrao de Testes

Achados do repositorio `apps/api`:
- o runner ja configurado no projeto e `vitest`
- o script oficial permanece `npm test` com `vitest run`
- nao havia suite propria de testes da API antes desta onda
- nao havia helper pronto de autenticacao para login demo
- a aplicacao de teste e instanciada corretamente via `buildApp()`
- o fluxo manual existente da Onda 2.7 em `scratch/test-diagnostico.ts` ja usava `app.inject`, entao ele serviu como base natural para a automacao

Decisao adotada:
- manter o runner e o bootstrap existentes
- criar o primeiro teste de integracao diretamente no modulo comercial
- manter `scratch/test-diagnostico.ts` apenas como apoio manual, fora do fluxo automatizado

---

## 3. Arquivos Criados/Alterados

| Arquivo | Acao | Finalidade |
|---|---|---|
| `apps/api/src/modules/comercial/__tests__/diagnostico.routes.test.ts` | Criado | Suite automatizada de regressao do diagnostico comercial |

Nenhum arquivo de Prisma, seed ou migration foi alterado.

---

## 4. Cobertura Implementada

Suite criada:

`apps/api/src/modules/comercial/__tests__/diagnostico.routes.test.ts`

Cobertura entregue:

1. **Autenticacao**
- garante que `POST /api/v1/comercial/diagnostico/cnae` retorna `401` sem JWT
- realiza login demo real com `admin@postodemo.com.br`

2. **Sanitizacao**
- garante que `GET /api/v1/comercial/catalogo` autenticado nao expoe:
  - `custoInternoEstimado`
  - `margemLucroAlvo`
  - `valorReferenciaHora`
  - `metadata`
  - `atualizadoEm`
- garante que as recomendacoes do diagnostico tambem nao expõem custo interno ou margem

3. **Cenarios de Diagnostico**
- **Posto irregular**
  - valida risco `CRITICO`
  - valida `score 90`
  - valida 9 servicos retornados
  - valida orcamento `26800 / 45500 / 135000`
- **Posto em renovacao**
  - valida risco `ALTO`
  - valida inclusao de `LIC-015` e `LIC-010`
  - valida ausencia de `OUT-002` quando `temOutorgaAnterior = true`
  - valida orcamento `26800 / 45500 / 101000`
- **Fallback para CNAE nao mapeado**
  - valida uso do fallback generico
  - valida risco `BAIXO`
  - valida servicos `LIC-001`, `LIC-012` e `GES-001`
  - valida orcamento `8500 / 15000 / 29000`

4. **Integridade com o Catalogo**
- cada teste relevante confirma via Prisma que os codigos recomendados existem e estao ativos em `prisma.servicoCatalogo`

---

## 5. Validacao Executada

Comandos executados:

```bash
npm run typecheck
npx vitest run src/modules/comercial/__tests__/diagnostico.routes.test.ts
npm test
```

Resultados:
- `typecheck` passou
- a suite focada do diagnostico passou com `5 tests`
- o fluxo padrao `npm test` passou

Resumo do runner:
- `1` arquivo de teste
- `5` testes passando

---

## 6. Conclusao

A Onda 2.7.1 foi concluida com sucesso.

Ganhos objetivos:
- o diagnostico comercial agora possui regressao automatizada minima
- a autenticacao da rota ficou coberta por teste
- a protecao de campos sensiveis ficou coberta por teste
- os principais cenarios do motor ficaram travados contra quebra acidental
- a integracao com o catalogo oficial ficou validada automaticamente
- o script `scratch/test-diagnostico.ts` permanece util para apoio manual, mas nao e mais a unica forma de validacao

Observacao final:
- esta etapa endureceu a Onda 2.7 sem iniciar a Onda 2.8
