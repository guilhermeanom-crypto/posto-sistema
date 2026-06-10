# 46. Onda 3.2 - Consolidação da API do Handoff Comercial

## 1. Objetivo

Consolidar tecnicamente a Onda 3.2 da API do `HandoffComercial` antes do início do frontend, reunindo endpoints, regras de acesso, máquina de status, saneamento de payload, testes executados e pendências remanescentes.

## 2. Endpoints consolidados

### 2.1 Criação a partir de proposta aprovada

- Método: `POST`
- Rota: `/api/v1/comercial/propostas/:id/handoff`
- Finalidade:
  - criar um `HandoffComercial` a partir de uma `PropostaComercial` em `APROVADA`
  - aplicar a regra de handoff ativo único por proposta
  - congelar `servicosResumo` e `origemSnapshotSaneado`

### 2.2 Listagem operacional

- Método: `GET`
- Rota: `/api/v1/operacao/handoffs`
- Finalidade:
  - listar handoffs do tenant
  - permitir filtros operacionais básicos
  - devolver payload resumido e saneado

### 2.3 Detalhe operacional

- Método: `GET`
- Rota: `/api/v1/operacao/handoffs/:id`
- Finalidade:
  - retornar o handoff saneado por `id`
  - sempre restringindo a busca ao tenant autenticado

### 2.4 Atualização operacional controlada

- Método: `PATCH`
- Rota: `/api/v1/operacao/handoffs/:id`
- Finalidade:
  - permitir evolução operacional do handoff sem reabrir proposta comercial
  - controlar status, responsável operacional e observações operacionais

## 3. Autenticação e autorização consolidadas

- Todos os endpoints exigem autenticação via `authenticate`.
- `tenantId` e `usuarioId` são sempre obtidos do contexto autenticado.
- Toda leitura e mutação é restrita ao tenant autenticado.

### 3.1 Perfis autorizados na criação

- `EXECUTIVO`
- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

### 3.2 Perfis autorizados na leitura

- `EXECUTIVO`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

### 3.3 Perfis autorizados na atualização operacional

- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

### 3.4 Ações sensíveis na atualização

Permitidas apenas para:

- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Ações sensíveis:

- alterar `responsavelOperacionalId`
- alterar status para `CANCELADO`
- alterar status para `CONCLUIDO`

### 3.5 Perfis bloqueados

- `REPRESENTANTE_POSTO` permanece bloqueado por padrão nas rotas operacionais do handoff.

## 4. Regras de status e transição

### 4.1 Status utilizados pela API

- `AGUARDANDO_HANDOFF`
- `EM_TRIAGEM_OPERACIONAL`
- `AGUARDANDO_DOCUMENTOS`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `PAUSADO`
- `CANCELADO`
- `CONCLUIDO`

### 4.2 Status ativos para regra de unicidade

- `AGUARDANDO_HANDOFF`
- `EM_TRIAGEM_OPERACIONAL`
- `AGUARDANDO_DOCUMENTOS`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `PAUSADO`

Regra aplicada:

- não pode existir mais de um handoff ativo para a mesma proposta no mesmo tenant
- a proteção está implementada na camada de service

### 4.3 Máquina de transição implementada

- `AGUARDANDO_HANDOFF -> EM_TRIAGEM_OPERACIONAL, CANCELADO`
- `EM_TRIAGEM_OPERACIONAL -> AGUARDANDO_DOCUMENTOS, EM_PLANEJAMENTO, CANCELADO`
- `AGUARDANDO_DOCUMENTOS -> EM_TRIAGEM_OPERACIONAL, EM_PLANEJAMENTO, CANCELADO`
- `EM_PLANEJAMENTO -> EM_EXECUCAO, PAUSADO, CANCELADO`
- `EM_EXECUCAO -> PAUSADO, CONCLUIDO, CANCELADO`
- `PAUSADO -> EM_TRIAGEM_OPERACIONAL, EM_PLANEJAMENTO, EM_EXECUCAO, CANCELADO`
- `CANCELADO` é final
- `CONCLUIDO` é final

### 4.4 Marcos temporais automáticos

- `assumidoEm`:
  - preenchido ao atribuir `responsavelOperacionalId` pela primeira vez
- `concluidoEm`:
  - preenchido ao mudar para `CONCLUIDO`
- `canceladoEm`:
  - preenchido ao mudar para `CANCELADO`

## 5. Campos editáveis e campos bloqueados

### 5.1 Campos editáveis no `PATCH`

- `status`
- `responsavelOperacionalId`
- `pendenciasOperacionais`
- `observacoesOperacionais`

### 5.2 Campos bloqueados no `PATCH`

- `tenantId`
- `propostaComercialId`
- `leadWhatsAppId`
- `empreendimentoId`
- `responsavelComercialId`
- `criadoPorId`
- `numeroProposta`
- `servicosResumo`
- `origemSnapshotSaneado`
- snapshots saneados já persistidos
- qualquer payload comercial bruto ou campo estrutural da proposta

## 6. Regras de payload saneado

### 6.1 Regras do `servicosResumo`

- contém apenas itens aprovados e saneados da proposta
- não transporta precificação interna
- não transporta margem
- não transporta custo interno
- não transporta valor hora
- não transporta catálogo bruto

### 6.2 Regras do `origemSnapshotSaneado`

- contém apenas dados públicos ou resumidos da proposta, contato, referências e diagnóstico
- preserva rastreabilidade mínima
- não reabre payload bruto da proposta

### 6.3 Dados explicitamente bloqueados

- `metadata` bruta
- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- margem
- custo interno
- valor hora

### 6.4 Forma de exposição por endpoint

- `POST` retorna o handoff criado com dados saneados
- `GET /operacao/handoffs` retorna payload resumido
- `GET /operacao/handoffs/:id` retorna payload detalhado saneado
- `PATCH` retorna o handoff atualizado sem liberar edição de snapshots

## 7. Auditoria consolidada

Eventos já registrados no backend:

- `handoff_comercial.criado`
- `handoff_comercial.atualizado`
- `handoff_comercial.status_alterado`
- `handoff_comercial.responsavel_operacional_atribuido`
- `handoff_comercial.observacoes_operacionais_atualizadas`

Observação:

- a API já registra auditoria mínima de domínio
- ainda não existe teste direto validando conteúdo de `audit_log`

## 8. Testes executados e resultados

### 8.1 Criação do handoff

Arquivo:

- `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts`

Resultados consolidados:

- `14/14` testes passando na estabilização da criação

Cenários relevantes:

- `401` sem JWT
- `201` criação feliz com proposta aprovada
- `409` proposta não aprovada
- `409` handoff ativo duplicado
- `403` perfil sem permissão

### 8.2 Leitura e atualização operacional

Arquivo:

- `apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts`

Resultados consolidados:

- `5/5` testes passando na etapa de leitura
- `11/11` testes passando após consolidação com o `PATCH`

Cenários relevantes:

- `401` sem JWT
- `200` listagem com filtros básicos
- `200` detalhe saneado
- `404` handoff inexistente
- `403` `REPRESENTANTE_POSTO`
- `200` atualização operacional não sensível
- `403` ação sensível sem perfil superior
- `409` transição inválida
- `200` atribuição inicial de responsável com `assumidoEm`
- `200` conclusão com `concluidoEm`

### 8.3 Typecheck

Resultado consolidado:

- backend com `typecheck` passando nas etapas de criação, leitura e `PATCH`

## 9. Pendências técnicas consolidadas

### 9.1 SQL pontual por limitação prática do Prisma Client

- o módulo de handoffs ainda usa SQL pontual com `prisma.$queryRaw`
- motivo:
  - na prática, o Prisma Client disponível no ambiente não expôs `HandoffComercial` de forma utilizável quando a implementação começou
- impacto:
  - o backend funciona
  - mas o módulo ainda carrega uma dependência operacional de SQL manual controlado

### 9.2 Dependência de banco local nos testes

- os testes localizados dependem de PostgreSQL local
- no ambiente desta sessão, o sandbox bloqueava acesso a `localhost`
- a execução precisou de permissão escalada para validar as suítes

### 9.3 Redis e bootstrap de testes

- a estabilização já aplicou o bypass mínimo para `rate-limit` em `NODE_ENV=test`
- mocks localizados de Redis e `bullmq` continuam fazendo parte da estratégia atual

### 9.4 Ausência de testes diretos em `audit_log`

- a auditoria está implementada
- falta cobertura específica conferindo persistência e conteúdo do `audit_log`

### 9.5 Índice parcial manual futuro

- a unicidade de handoff ativo por proposta está no service
- um índice parcial manual pode ser considerado futuramente para endurecimento em banco
- nesta Onda 3.2 ele permanece como decisão futura, não bloqueadora

## 10. Prontidão para UI mínima

Critérios observados:

- endpoint de criação existe e está testado
- leitura com listagem e detalhe existe e está testada
- atualização operacional mínima existe e está testada
- autenticação, autorização e tenant isolation estão fechados
- payload saneado está consolidado
- não há acoplamento com contrato, OS, financeiro, processo, tarefa, documento ou onboarding

Limites ainda existentes:

- o módulo usa SQL pontual controlado
- os testes dependem de banco local
- não há teste direto da auditoria

Conclusão técnica:

- essas pendências não impedem a construção da UI mínima
- elas devem ser tratadas como dívida técnica controlada, não como bloqueio funcional do frontend inicial

## 11. Próxima etapa recomendada

Próxima etapa recomendada:

- iniciar a UI mínima do Handoff Comercial

Escopo sugerido da UI mínima:

- ação de criação do handoff a partir da proposta aprovada
- listagem operacional básica
- tela de detalhe do handoff
- formulário controlado para atualizar:
  - `status`
  - `responsavelOperacionalId`
  - `pendenciasOperacionais`
  - `observacoesOperacionais`

Cuidados para a próxima etapa:

- manter o frontend consumindo apenas payloads saneados
- não expor campos comerciais sensíveis
- não introduzir automações de processo, tarefa, documento ou onboarding junto da primeira UI

## 12. Decisão objetiva

**A) BACKEND PRONTO PARA UI MÍNIMA**
