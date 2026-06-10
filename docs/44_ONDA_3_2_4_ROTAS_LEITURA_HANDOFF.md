# 44_ONDA_3_2_4_ROTAS_LEITURA_HANDOFF

## 1. Objetivo

Implementar rotas controladas de leitura do `HandoffComercial`, permitindo listagem e detalhe saneados por tenant, sem introduzir transicoes operacionais, automacoes ou exposicao de dados comerciais sensiveis.

## 2. Arquivos criados ou alterados

- `apps/api/src/modules/operacao/handoffs.routes.ts`
- `apps/api/src/modules/operacao/handoffs.schemas.ts`
- `apps/api/src/modules/operacao/handoffs.service.ts`
- `apps/api/src/modules/operacao/handoffs.types.ts`
- `apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts`
- `apps/api/src/app.ts`
- `apps/api/src/modules/comercial/comercial.routes.ts`
- `docs/44_ONDA_3_2_4_ROTAS_LEITURA_HANDOFF.md`

## 3. Endpoints criados

### 3.1 Listagem

- Metodo: `GET`
- Rota: `/api/v1/operacao/handoffs`

### 3.2 Detalhe

- Metodo: `GET`
- Rota: `/api/v1/operacao/handoffs/:id`

## 4. Regras de autenticacao e autorizacao

- ambas as rotas usam `authenticate`;
- o `tenantId` e obtido do contexto autenticado;
- o detalhe sempre filtra por `tenant_id` e `id`;
- a leitura foi liberada para:
  - `EXECUTIVO`
  - `COORDENADOR`
  - `ANALISTA`
  - `ANALISTA_CAMPO`
  - `ADMIN_TENANT`
  - `SUPER_ADMIN`
- `REPRESENTANTE_POSTO` fica bloqueado por padrao com `403`;
- perfis nao listados tambem recebem `403`.

## 5. Filtros implementados

Na listagem foram implementados os filtros basicos previstos:

- `status`
- `propostaComercialId`
- `empreendimentoId`
- `responsavelComercialId`
- `responsavelOperacionalId`

Tambem foi incluida paginacao simples:

- `page`
- `limit`

## 6. Formato resumido das respostas

### 6.1 Listagem

Resposta:

```ts
{
  data: Array<{
    id: string;
    propostaComercialId: string;
    leadWhatsAppId: string | null;
    empreendimentoId: string | null;
    criadoPorId: string;
    responsavelComercialId: string;
    responsavelOperacionalId: string | null;
    status: StatusHandoffComercial;
    statusPropostaOrigem: 'APROVADA';
    origemProposta: 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL';
    numeroProposta: string;
    nomeLead: string | null;
    empresaLead: string | null;
    municipio: string | null;
    uf: string | null;
    cnaePrincipalCodigo: string | null;
    cnaePrincipalDescricao: string | null;
    riscoNivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' | null;
    potencialPoluidor: 'BAIXO' | 'MEDIO' | 'ALTO' | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

Observacao:

- a listagem nao retorna `origemSnapshotSaneado` nem `servicosResumo`, mantendo payload mais enxuto.

### 6.2 Detalhe

Resposta:

```ts
{
  data: {
    id: string;
    tenantId: string;
    propostaComercialId: string;
    status: StatusHandoffComercial;
    servicosResumo: ServicosResumoHandoff;
    origemSnapshotSaneado: OrigemSnapshotSaneadoHandoff;
    pendenciasOperacionais: string[];
    observacoesOperacionais: string | null;
    criadoEm: Date;
    atualizadoEm: Date;
    // demais campos saneados do handoff
  }
}
```

## 7. Saneamento e dados bloqueados

As rotas retornam apenas dados ja saneados do handoff persistido.

Nao sao expostos:

- margem;
- custo interno;
- valor hora;
- metadata bruta;
- `inputSnapshot`;
- `resultadoSnapshot`;
- `snapshotCatalogo`.

Observacao:

- o detalhe devolve `origemSnapshotSaneado`, que ja nasce filtrado pela Onda 3.2.1;
- nao houve reabertura do payload bruto da proposta.

## 8. Erros tratados

- `401` sem autenticacao;
- `403` para perfil sem permissao de leitura;
- `404` para handoff inexistente no tenant;
- `400` para filtros invalidos no schema zod.

## 9. Validacoes executadas

### 9.1 Typecheck

Executado com sucesso:

```bash
node node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --noEmit
```

### 9.2 Teste localizado de leitura

Executado com acesso ao host local por depender de PostgreSQL publicado em `localhost`:

```bash
node ../../node_modules/.pnpm/vitest@2.1.9_@types+node@22.19.17/node_modules/vitest/vitest.mjs run src/modules/operacao/__tests__/handoffs.routes.test.ts
```

Resultado:

- `5/5` testes passando.

Cenarios cobertos:

- `401` sem JWT na listagem;
- `200` listagem com filtros basicos;
- `200` detalhe saneado por `id`;
- `404` para handoff inexistente;
- `403` para `REPRESENTANTE_POSTO`.

## 10. Ajustes tecnicos relevantes

- foi criado `handoffs.schemas.ts` para consolidar querystring e contratos de resposta;
- `handoffs.service.ts` ganhou `listar` e `buscarPorId`;
- a query de listagem foi implementada com SQL parametrizado e filtros simples por tenant;
- `app.ts` passou a registrar `handoffsRoutes` em `/api/v1/operacao/handoffs`;
- `comercial.routes.ts` precisou ajustar o schema do POST de criacao para aceitar o enum completo de status compartilhado, evitando conflito de typecheck.

## 11. Pendencias para testes

- ainda nao ha suite cobrindo combinacoes mais amplas de filtros;
- ainda nao ha teste de isolamento do service sem passar pela rota;
- ainda nao ha cenario de segregacao entre tenants distintos com fixture propria;
- os testes continuam dependendo do banco local disponivel.

## 12. Recomendacao para a proxima etapa

Recomendacao objetiva:

- seguir para a proxima subetapa da Onda 3.2 com foco em leitura operacional complementar ou primeiras transicoes controladas de status;
- manter o padrao de payload saneado;
- se a proxima etapa incluir atualizacao, separar claramente leitura de mutacao para nao misturar regras operacionais com onboarding, processo, tarefa ou financeiro.

## 13. Conclusao

As rotas de leitura do `HandoffComercial` foram implementadas com autenticacao, autorizacao por perfil, restricao por tenant, listagem filtravel e detalhe saneado.

Nao houve acoplamento com contrato, OS, financeiro, processo, tarefa, documento, onboarding ou criacao automatica de empreendimento.
