# 42_ONDA_3_2_2_ENDPOINT_CRIACAO_HANDOFF

## 1. Objetivo

Implementar a rota controlada de criacao do `HandoffComercial` a partir de uma `PropostaComercial` aprovada, reutilizando o service entregue na Onda 3.2.1 e preservando todas as restricoes da Onda 3.

## 2. Arquivos criados ou alterados

- `apps/api/src/modules/comercial/comercial.routes.ts`
- `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts`
- `docs/42_ONDA_3_2_2_ENDPOINT_CRIACAO_HANDOFF.md`

## 3. Endpoint criado

- Metodo HTTP: `POST`
- Rota: `/api/v1/comercial/propostas/:id/handoff`

## 4. Regra de autenticacao e autorizacao

- A rota permanece protegida pelo `authenticate` ja aplicado no modulo comercial.
- O `tenantId` e o `usuarioId` sao obtidos diretamente de `request.user`.
- A criacao do handoff ficou restrita aos perfis:
  - `EXECUTIVO`
  - `COORDENADOR`
  - `ADMIN_TENANT`
  - `SUPER_ADMIN`
- Perfis fora dessa lista recebem `403` com `ForbiddenError`.

## 5. Como o endpoint chama o service

O endpoint delega toda a regra de negocio para `handoffsService.criar`, enviando apenas o contexto autenticado e o `id` da proposta recebido no path:

```ts
const handoff = await handoffsService.criar({
  tenantId: request.user.tenantId,
  propostaComercialId: request.params.id,
  usuarioId: request.user.id,
})
```

Resposta HTTP:

```ts
return reply.status(201).send({ data: handoff })
```

## 6. Formato resumido da resposta

A rota responde com `201 Created` e payload no formato:

```ts
{
  data: {
    id: string;
    tenantId: string;
    propostaComercialId: string;
    status: 'AGUARDANDO_HANDOFF';
    statusPropostaOrigem: 'APROVADA';
    responsavelComercialId: string;
    responsavelOperacionalId: string | null;
    servicosResumo: Array<{
      itemId?: string;
      nome: string;
      categoria?: string;
      quantidade?: number | null;
      unidade?: string;
      escopoAprovado?: string;
      observacaoOperacional?: string;
    }>;
    origemSnapshotSaneado: {
      schemaVersion: 1;
      proposta: { ... };
      contato: { ... };
      referencias: { ... };
      diagnostico: { ... };
      comercial: { ... };
    };
    criadoEm: Date;
    atualizadoEm: Date;
  }
}
```

## 7. Erros tratados

Erros mapeados pelo endpoint/service:

- `404` para proposta nao encontrada no tenant.
- `409` para proposta ainda nao aprovada.
- `409` para handoff ativo ja existente para a mesma proposta no mesmo tenant.
- `403` para usuario autenticado sem perfil autorizado.
- `401` quando a rota eh chamada sem JWT.

Observacao:

- O endpoint nao reimplementa regra de negocio.
- O mapeamento principal continua concentrado no `HandoffsService` e na hierarquia `AppError`.

## 8. Regras preservadas

O endpoint apenas expõe a criacao controlada. Nao houve:

- criacao automatica de empreendimento;
- criacao de tarefa;
- criacao de processo;
- criacao de documento;
- disparo de onboarding;
- alteracao da proposta original;
- copia de margem, custo, valor hora, metadata bruta, `inputSnapshot`, `resultadoSnapshot` ou `snapshotCatalogo`.

## 9. Validacoes executadas

Validacoes implementadas na rota:

- validacao do `id` via `z.string().uuid()`;
- validacao de autenticacao pelo hook do modulo;
- validacao de autorizacao por perfil antes da chamada do service;
- validacao do contrato de resposta com schema zod dedicado para `HandoffComercial`.

Validacoes executadas no ambiente:

- `node node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --noEmit`
  - resultado: executado com sucesso, sem erros de typecheck.
- teste localizado da rota com Vitest:
  - tentativa executada;
  - bloqueada por dependencia externa de Redis no ambiente atual (`EPERM` ao conectar em `127.0.0.1:6379` / `::1:6379`);
  - por isso, nao foi possivel concluir a bateria de integracao nesta sessao.

## 10. Testes atualizados

Foram adicionados cenarios localizados em `propostas.routes.test.ts` para:

- `401` sem JWT no POST de handoff;
- `201` na criacao feliz com proposta aprovada;
- `409` para proposta nao aprovada;
- `409` para handoff ativo duplicado;
- `403` para perfil sem permissao.

## 11. Pendencias para a proxima etapa

- executar os testes de integracao com Redis acessivel no ambiente;
- avaliar se o modulo de operacao/handoffs deve ganhar route propria nas proximas subetapas;
- implementar proximas rotas controladas sem acoplamento indevido, como listagem e detalhe, apenas quando aprovadas;
- decidir se a resposta do endpoint deve permanecer completa ou ganhar presenter/serializer especifico de operacao.

## 12. Conclusao

O endpoint `POST /api/v1/comercial/propostas/:id/handoff` foi implementado com autenticacao, autorizacao por perfil e reaproveitamento integral do `HandoffsService.criar`.

O fluxo permanece desacoplado de contrato, OS, financeiro, processo, tarefa, documento, empreendimento automatico e onboarding.
