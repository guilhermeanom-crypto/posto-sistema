# 43_ONDA_3_2_3_TESTES_ENDPOINT_CRIACAO_HANDOFF

## 1. Objetivo

Estabilizar a execucao dos testes localizados do endpoint `POST /api/v1/comercial/propostas/:id/handoff`, reduzindo interferencias de infraestrutura no boot do backend e validando os cenarios principais da Onda 3.2.2.

## 2. Arquivos revisados ou alterados

- `apps/api/src/app.ts`
- `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts`
- `docs/43_ONDA_3_2_3_TESTES_ENDPOINT_CRIACAO_HANDOFF.md`

## 3. Causa do bloqueio por Redis

O primeiro bloqueio identificado na etapa anterior nao estava no endpoint em si, mas no bootstrap global da API durante os testes.

Pontos que causavam o problema:

- `buildApp()` registrava `@fastify/rate-limit` com o cliente Redis real mesmo em `NODE_ENV=test`;
- varios modulos carregados no boot instanciavam `Queue` do `bullmq` em nivel de modulo usando `redis` como conexao;
- no sandbox padrao, as conexoes para `localhost:6379` e `localhost:5432` eram bloqueadas, o que impedia o teste de chegar ao endpoint.

## 4. Ajuste aplicado

Foi aplicado o menor ajuste compativel com o padrao atual do projeto:

### 4.1 `app.ts`

No ambiente `test`, o `@fastify/rate-limit` passa a usar o store em memoria padrao, sem injetar o cliente Redis:

```ts
...(env.NODE_ENV === 'test' ? {} : { redis })
```

### 4.2 `propostas.routes.test.ts`

Foram adicionados mocks localizados com `vi.mock` para:

- `bullmq`
- `../../../infra/cache/redis.js`

Objetivo dos mocks:

- impedir conexoes reais de Redis durante o carregamento do app;
- neutralizar instancias de `Queue` criadas em nivel de modulo;
- manter a estabilizacao restrita ao teste localizado, sem alterar a regra do endpoint.

### 4.3 Helper de request autenticada

Foi corrigido o helper `authedRequest` para nao enviar `content-type: application/json` quando nao existe body.

Esse ajuste resolveu um erro real de teste:

- Fastify rejeitava requisicoes `POST` sem payload com `FST_ERR_CTP_EMPTY_JSON_BODY`;
- o endpoint de handoff nao exige body;
- portanto, o helper estava invalidando artificialmente os testes.

## 5. Comandos executados

### 5.1 Inspecao e diagnostico

```bash
docker ps --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"
```

```bash
grep -n "DATABASE_URL\|REDIS_URL" .env .env.local apps/api/.env apps/api/.env.local 2>/dev/null
```

### 5.2 Teste localizado do endpoint

Executado com acesso escalado ao host local, porque o sandbox padrao bloqueava conexoes para os containers publicados em `localhost`:

```bash
node ../../node_modules/.pnpm/vitest@2.1.9_@types+node@22.19.17/node_modules/vitest/vitest.mjs run src/modules/comercial/__tests__/propostas.routes.test.ts
```

### 5.3 Typecheck do backend

```bash
node node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --noEmit
```

## 6. Resultado dos testes

Resultado final do arquivo localizado:

- arquivo: `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts`
- status: **aprovado**
- total: **14 testes passando**

Cenarios de handoff validados:

- `401` sem JWT;
- `201` criacao feliz com proposta aprovada;
- `409` proposta nao aprovada;
- `409` handoff ativo duplicado;
- `403` perfil sem permissao.

Observacao importante:

- o primeiro rerun ainda falhou, mas isso ja nao era infraestrutura;
- a falha passou a ser do helper de teste, que mandava `content-type` sem body;
- apos o ajuste do helper, a suite passou integralmente.

## 7. Resultado do typecheck

- comando executado com sucesso;
- sem erros de typecheck no backend.

## 8. Pendencias remanescentes

- os testes localizados ainda dependem de acesso ao PostgreSQL local para autenticar e persistir dados;
- no ambiente desta sessao, isso exigiu execucao com permissao escalada por causa da restricao de rede do sandbox;
- ainda nao houve ampliacao para listagem, detalhe ou transicoes operacionais de `HandoffComercial`;
- ainda nao houve testes dedicados do service em isolamento.

## 9. Recomendacao para a proxima etapa

Recomendacao objetiva:

- seguir para a proxima subetapa da Onda 3.2 com seguranca;
- manter o foco em rotas controladas de leitura ou transicao do `HandoffComercial`;
- se a equipe quiser reduzir dependencia de ambiente nas proximas suites, considerar um setup de testes compartilhado para mocks de fila/cache ou uma estrategia oficial de boot em `NODE_ENV=test`.

## 10. Conclusao

O endpoint de criacao do `HandoffComercial` ficou estabilizado em testes localizados.

O bloqueio original por Redis foi neutralizado com ajuste minimo em ambiente de teste, o bloqueio seguinte de banco foi confirmado como restricao de sandbox e contornado com execucao autorizada, e o ultimo erro restante foi corrigido no helper de teste.
