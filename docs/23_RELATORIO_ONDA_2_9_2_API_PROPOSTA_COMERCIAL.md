# 23_RELATORIO_ONDA_2_9_2_API_PROPOSTA_COMERCIAL

## 1. Objetivo

A Onda 2.9.2 teve como objetivo criar a primeira API backend de proposta comercial persistida.

Escopo executado:

- auditoria do modulo comercial atual
- criacao de `propostas.types.ts`
- criacao de `propostas.schemas.ts`
- criacao de `propostas.service.ts`
- exposicao de endpoints no modulo `comercial`
- persistencia de `DiagnosticoComercial`, `PropostaComercial` e `ItemProposta`
- listagem e detalhe de propostas por tenant
- sanitizacao de resposta
- testes automatizados minimos da nova API

Escopo explicitamente nao executado:

- Onda 2.9.3
- UI
- alteracao da tela de triagem
- contrato
- ordem de servico
- financeiro
- PDF
- handoff
- nova migration
- alteracao de Prisma schema
- alteracao de seed
- alteracao de dashboard, documentos, processos, tarefas, condicionantes ou portal

---

## 2. Auditoria do Modulo Comercial

Arquivos auditados:

- `apps/api/src/modules/comercial/comercial.routes.ts`
- `apps/api/src/modules/comercial/diagnostico.service.ts`
- `apps/api/src/modules/comercial/catalogo.service.ts`
- `apps/api/src/modules/comercial/catalogo.schemas.ts`
- `apps/api/src/modules/comercial/catalogo.types.ts`
- `apps/api/src/modules/comercial/diagnostico.schemas.ts`
- `apps/api/src/modules/comercial/diagnostico.types.ts`

Padrao confirmado do backend:

- rotas finas
- regra de negocio centralizada em service
- autenticacao por hook `authenticate`
- contexto de usuario montado na route
- auditoria disparada na camada service
- validacao de payload com Zod
- respostas no formato `{ data, pagination? }`

Padroes de referencia tambem consultados:

- `tarefas.routes.ts`
- `tarefas.service.ts`
- `documentos.routes.ts`
- `crm.routes.ts`

---

## 3. Endpoints Entregues

Foram criados os seguintes endpoints autenticados em `POST /api/v1/comercial`:

### `POST /api/v1/comercial/propostas`

Finalidade:

- criar proposta comercial persistida a partir do input de diagnostico

Comportamento:

- valida perfil comercial
- valida lead e empreendimento opcionais no tenant
- chama o `DiagnosticoService` no backend
- valida itens contra as recomendacoes retornadas
- persiste:
  - `diagnosticos_comerciais`
  - `propostas_comerciais`
  - `itens_proposta`
- registra auditoria
- devolve detalhe sanitizado da proposta criada

### `GET /api/v1/comercial/propostas`

Finalidade:

- listar propostas do tenant com filtros e paginacao

Filtros implementados:

- `page`
- `limit`
- `status`
- `leadWhatsAppId`
- `empreendimentoId`
- `busca`

### `GET /api/v1/comercial/propostas/:id`

Finalidade:

- consultar o detalhe de uma proposta do tenant

Retorna:

- cabecalho da proposta
- resumo do diagnostico persistido
- itens persistidos
- lead e empreendimento associados, quando houver
- usuario criador e ultimo atualizador

---

## 4. Arquivos Criados e Alterados

| Arquivo | Acao | Finalidade |
|---|---|---|
| `apps/api/src/modules/comercial/propostas.types.ts` | Criado | Tipos da API de proposta |
| `apps/api/src/modules/comercial/propostas.schemas.ts` | Criado | Schemas Zod de payload, filtros e respostas |
| `apps/api/src/modules/comercial/propostas.service.ts` | Criado | Regra de negocio da proposta persistida |
| `apps/api/src/modules/comercial/comercial.routes.ts` | Alterado | Inclusao dos endpoints `/propostas` |
| `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts` | Criado | Suite automatizada da nova API |
| `docs/23_RELATORIO_ONDA_2_9_2_API_PROPOSTA_COMERCIAL.md` | Criado | Registro tecnico da entrega |

---

## 5. Modelagem Funcional Implementada

### 5.1. Criacao da proposta

Na criacao:

1. a API recebe o input de diagnostico
2. o backend recalcula o diagnostico via `DiagnosticoService`
3. os itens enviados sao validados contra as recomendacoes retornadas
4. se nenhum item for enviado, a API usa todas as recomendacoes do diagnostico
5. a API persiste snapshot do input e do resultado do diagnostico
6. a API persiste snapshot de preco por item

### 5.2. Snapshot de precos

Cada `ItemProposta` salva:

- preco minimo
- preco base
- preco maximo
- preco aplicado
- valor de linha
- `snapshotCatalogo`

Isso impede que alteracoes futuras no catalogo mudem propostas antigas.

### 5.3. Numeracao

Foi adotado um numero unico por proposta no formato:

`PROP-ANO-XXXXXXXX`

Exemplo observado em teste:

`PROP-2026-0270AF89`

Essa abordagem evita depender de contador sequencial nesta primeira API.

---

## 6. Seguranca Aplicada

Perfis autorizados:

- `EXECUTIVO`
- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Protecoes implementadas:

- tenant obrigatório em toda query
- lead e empreendimento validados dentro do tenant
- item fora das recomendacoes do diagnostico retorna `400`
- preco aplicado fora da faixa do catalogo retorna `400`

Campos protegidos nas respostas:

- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- `observacoesInternas`
- `custoInternoEstimado`
- `margemLucroAlvo`
- `valorReferenciaHora`
- `metadata`

---

## 7. Observacao Tecnica Importante

Durante a implementacao, foi identificado um comportamento inconsistente do Prisma Client gerado neste workspace:

- a migration da Onda 2.9.1 foi aplicada com sucesso
- o schema validou corretamente
- mas o client gerado nao passou a expor delegates tipados para:
  - `diagnosticoComercial`
  - `propostaComercial`
  - `itemProposta`

Decisao adotada nesta onda:

- manter o schema e a migration intactos
- implementar o acesso as novas tabelas via **SQL seguro do proprio Prisma** (`$queryRaw` / `$executeRaw`)
- continuar usando delegates normais do Prisma para entidades ja existentes (`leadWhatsApp`, `empreendimento`, `politicaPrecificacaoDiagnostico`, `servicoCatalogo`)

Impacto:

- a API funciona e esta coberta por teste
- nenhum ajuste adicional em Prisma foi feito sem autorizacao

Observacao:

- isso deve ser reavaliado numa manutencao tecnica futura do ambiente Prisma/pnpm do monorepo, mas nao bloqueou a entrega funcional da 2.9.2

---

## 8. Testes Automatizados

Suite criada:

`apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts`

Cobertura entregue:

1. bloqueio sem JWT
2. criacao de proposta com persistencia real
3. sanitizacao da resposta de proposta
4. listagem por tenant
5. detalhe por id
6. rejeicao de item fora das recomendacoes do diagnostico

---

## 9. Validacao Executada

Comandos executados:

```bash
npm run typecheck
npx vitest run src/modules/comercial/__tests__/propostas.routes.test.ts
npm test
```

Resultados:

- `typecheck`: sucesso
- suite focada de propostas: `4 tests` passando
- fluxo padrao `npm test`: `9 tests` passando no total

Resumo atual das suites:

- `diagnostico.routes.test.ts`: 5 testes
- `propostas.routes.test.ts`: 4 testes

---

## 10. Conclusao

A Onda 2.9.2 foi concluida com sucesso.

Entrega efetiva:

- API de proposta comercial persistida criada
- diagnostico persistido junto da proposta
- itens persistidos com snapshot de preco
- listagem e detalhe por tenant
- respostas sanitizadas
- auditoria de criacao registrada
- testes automatizados adicionados e passando

Proxima etapa natural:

- **Onda 2.9.3 — UI de proposta a partir da triagem**

