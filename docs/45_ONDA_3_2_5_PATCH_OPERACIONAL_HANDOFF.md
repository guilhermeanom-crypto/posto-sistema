# Onda 3.2.5 - PATCH operacional do Handoff Comercial

## Arquivos criados/alterados

- `apps/api/src/modules/operacao/handoffs.routes.ts`
- `apps/api/src/modules/operacao/handoffs.schemas.ts`
- `apps/api/src/modules/operacao/handoffs.service.ts`
- `apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts`

## Endpoint criado

- `PATCH /api/v1/operacao/handoffs/:id`

## Campos permitidos

- `status`
- `responsavelOperacionalId`
- `pendenciasOperacionais`
- `observacoesOperacionais`

## Campos bloqueados

- `tenantId`
- `propostaComercialId`
- `leadWhatsAppId`
- `empreendimentoId`
- `responsavelComercialId`
- `criadoPorId`
- `numeroProposta`
- `servicosResumo`
- `origemSnapshotSaneado`
- snapshots e dados comerciais saneados já congelados no handoff

## Regras de autorização

- Autenticação obrigatória.
- Atualização geral permitida para:
  - `COORDENADOR`
  - `ANALISTA`
  - `ANALISTA_CAMPO`
  - `ADMIN_TENANT`
  - `SUPER_ADMIN`
- `REPRESENTANTE_POSTO` continua bloqueado por padrão.
- Ações sensíveis permitidas apenas para:
  - `COORDENADOR`
  - `ADMIN_TENANT`
  - `SUPER_ADMIN`
- Ações sensíveis tratadas:
  - alterar `responsavelOperacionalId`
  - alterar status para `CANCELADO`
  - alterar status para `CONCLUIDO`

## Máquina de status implementada

- `AGUARDANDO_HANDOFF -> EM_TRIAGEM_OPERACIONAL, CANCELADO`
- `EM_TRIAGEM_OPERACIONAL -> AGUARDANDO_DOCUMENTOS, EM_PLANEJAMENTO, CANCELADO`
- `AGUARDANDO_DOCUMENTOS -> EM_TRIAGEM_OPERACIONAL, EM_PLANEJAMENTO, CANCELADO`
- `EM_PLANEJAMENTO -> EM_EXECUCAO, PAUSADO, CANCELADO`
- `EM_EXECUCAO -> PAUSADO, CONCLUIDO, CANCELADO`
- `PAUSADO -> EM_TRIAGEM_OPERACIONAL, EM_PLANEJAMENTO, EM_EXECUCAO, CANCELADO`
- `CANCELADO` e `CONCLUIDO` ficaram como estados finais.

## Auditorias registradas

- `handoff_comercial.status_alterado`
- `handoff_comercial.responsavel_operacional_atribuido`
- `handoff_comercial.observacoes_operacionais_atualizadas`
- `handoff_comercial.atualizado`

## Regras de domínio implementadas

- Atualização sempre restrita ao `tenantId` autenticado.
- O service carrega o usuário executor no tenant antes de aplicar qualquer alteração.
- `assumidoEm` é preenchido ao atribuir `responsavelOperacionalId` pela primeira vez.
- `concluidoEm` é preenchido ao entrar em `CONCLUIDO`.
- `canceladoEm` é preenchido ao entrar em `CANCELADO`.
- `pendenciasOperacionais` é normalizado como lista de `string` saneada.
- `observacoesOperacionais` é normalizado como texto nullable.
- O endpoint não altera proposta comercial, não cria empreendimento, não cria tarefa, não cria processo, não cria documento e não dispara onboarding.

## Testes executados

- `node node_modules/typescript/bin/tsc -p apps/api/tsconfig.json --noEmit`
- `node ../../node_modules/.pnpm/vitest@2.1.9_@types+node@22.19.17/node_modules/vitest/vitest.mjs run src/modules/operacao/__tests__/handoffs.routes.test.ts`

## Resultado dos testes

- Typecheck do backend: OK
- Testes localizados do módulo de handoffs: `11/11` passando

Coberturas adicionadas nesta etapa:

- `401` sem JWT no `PATCH`
- `200` atualização operacional não sensível para `ANALISTA`
- `403` para tentativa de atribuir responsável operacional sem perfil sensível
- `200` atribuição inicial de responsável operacional com preenchimento de `assumidoEm`
- `409` para transição inválida de status
- `200` fluxo de conclusão com `concluidoEm`

## Pendências para próxima etapa

- Validar assertions explícitas de auditoria em teste, se o projeto decidir cobrir `audit_log` diretamente.
- Implementar rotas de transição e/ou ações operacionais mais específicas somente se a Onda 3.2 exigir granularidade maior que o `PATCH` controlado.
- Avaliar paginação/filtros complementares de operação conforme uso real do módulo.

## Recomendação

- Prosseguir para a próxima etapa da Onda 3.2 com o módulo de handoffs já capaz de:
  - criar handoff a partir de proposta aprovada
  - listar e detalhar handoffs saneados
  - aplicar atualização operacional controlada com máquina de status e perfis
