# 11_RELATORIO_ONDA_2_5_API_CATALOGO_COMERCIAL

## 1. Resumo

A Onda 2.5 implementou uma **API segura e sanitizada de consulta ao Catálogo Comercial** (`ServicoCatalogo`) no backend Fastify do monorepo.

O objetivo era expor os 31 serviços consultivos já persistidos no banco (após a Onda 2.4.1) através de endpoints REST protegidos por autenticação, com separação estrita entre a visão pública (sanitizada) e a visão administrativa (completa, com campos financeiros sensíveis).

**O que foi implementado:**
- Módulo `comercial` com arquitetura padrão do projeto (types, schemas, service, routes).
- Três endpoints de consulta ao catálogo com autenticação obrigatória.
- Camada de sanitização explícita para impedir que campos de custo interno, margem e metadata sensível viajem para usuários comuns.

**Premissas respeitadas:**
- Nenhuma migration foi criada ou executada.
- Nenhuma alteração no `schema.prisma`.
- Nenhuma alteração no seed.
- Nenhuma UI foi criada ou alterada.
- Nenhuma lógica de diagnóstico por CNAE, proposta ou orçamento foi implementada.
- O foco exclusivo foi a **camada de API de consulta segura do catálogo**.

---

## 2. Arquivos criados/alterados

| Arquivo | Tipo | Finalidade |
|---|---|---|
| `apps/api/src/modules/comercial/catalogo.types.ts` | **Novo** | Define os types TypeScript: `ServicoCatalogoPublico` (omite campos sensíveis), `ServicoCatalogoAdmin` (completo) e `FiltrosCatalogo` (parâmetros de busca). |
| `apps/api/src/modules/comercial/catalogo.schemas.ts` | **Novo** | Zod schemas de validação de request (`filtrosCatalogoSchema`) e serialização de response (`servicoCatalogoPublicoSchema`, `servicoCatalogoAdminSchema`). |
| `apps/api/src/modules/comercial/catalogo.service.ts` | **Novo** | Lógica de acesso ao banco via Prisma Client: `listarPublico()`, `listarAdministrativo()` e `buscarPorId()`. A sanitização é aplicada por `select` explícito no Prisma e por destructuring manual no `buscarPorId`. |
| `apps/api/src/modules/comercial/comercial.routes.ts` | **Novo** | Plugin Fastify com os 3 endpoints: autenticação global via `preHandler`, guard de perfil `ADMIN` no endpoint `/admin`, serialização via Zod. |
| `apps/api/src/app.ts` | **Alterado** | Adicionado import de `comercialRoutes` e registro com prefixo `/api/v1/comercial`. |

---

## 3. Endpoints criados

| Método | Rota | Acesso | Campos sensíveis |
|---|---|---|---|
| `GET` | `/api/v1/comercial/catalogo` | Qualquer usuário autenticado | ❌ Ocultos (`custoInternoEstimado`, `margemLucroAlvo`, `metadata`, `valorReferenciaHora`, `atualizadoEm`) |
| `GET` | `/api/v1/comercial/catalogo/admin` | Apenas perfil `ADMIN` | ✅ Todos os campos expostos |
| `GET` | `/api/v1/comercial/catalogo/:id` | Autenticado — comportamento condicional por perfil | Ocultos para usuário comum; expostos para `ADMIN` |

### Campos protegidos no endpoint público

O endpoint `GET /api/v1/comercial/catalogo` e o `GET /api/v1/comercial/catalogo/:id` (quando acessado por usuário comum) **nunca expõem**:

- `custoInternoEstimado` — custo real de execução do serviço (dado financeiro crítico);
- `margemLucroAlvo` — percentual de margem de lucro alvo definido pela empresa;
- `valorReferenciaHora` — valor interno da hora técnica usada na precificação baseada em horas;
- `metadata` — campo JSON livre que pode conter informações comerciais brutas e histórico de enriquecimento do seed.

A proteção é dupla:
1. **No `listarPublico()`**: o Prisma faz `select` explícito, listando apenas as colunas permitidas — os campos sensíveis **nunca saem do banco**.
2. **No `buscarPorId()`**: aplica destructuring com `Omit` manual antes de retornar, como camada adicional de segurança caso o objeto já tenha sido carregado completo.

---

## 4. Segurança e autorização

### Autenticação
Todos os endpoints aplicam o hook `preHandler: authenticate`, que é o middleware padrão do projeto. Ele valida o JWT no header `Authorization`, decodifica o payload e disponibiliza `request.user` com `{ id, tenantId, perfil, nome, email }`.

### Perfis autorizados
- **Endpoint público** (`/catalogo` e `/catalogo/:id` para usuário comum): qualquer perfil autenticado (`ADMIN`, `COORDENADOR`, `ANALISTA`).
- **Endpoint admin** (`/catalogo/admin` e `/catalogo/:id` para visão completa): apenas `perfil === 'ADMIN'`.

> [!WARNING]
> **Ponto de atenção — revisão de perfis necessária:**  
> O código atual restringe o acesso ao endpoint administrativo exclusivamente ao perfil `ADMIN`. O desenho arquitetural anterior (documentado em `06_MODELAGEM_CATALOGO_COMERCIAL.md`) previa que o acesso a dados sensíveis poderia ser concedido também a perfis como `SUPER_ADMIN`, `ADMIN_TENANT` e potencialmente `COORDENADOR` (para fins de backoffice comercial).  
> Essa revisão deve ser realizada na **Onda 2.5.1** antes de ir a produção.

### Proteção por camadas
| Camada | Mecanismo | Onde |
|---|---|---|
| Autenticação | JWT + `authenticate` middleware | `preHandler` em todas as rotas |
| Autorização de perfil | Verificação `request.user.perfil !== 'ADMIN'` | Guard na rota `/catalogo/admin` |
| Sanitização de select | `prisma.servicoCatalogo.findMany({ select: { ... } })` | `listarPublico()` no service |
| Sanitização por destructuring | Omit manual no retorno | `buscarPorId()` quando `isAdmin = false` |

---

## 5. Filtros e paginação

### Filtros implementados

| Filtro | Parâmetro de query | Implementado | Observação |
|---|---|---|---|
| Busca textual | `busca` | ✅ | Pesquisa em `nome`, `codigo` e `descricao` (case-insensitive) |
| Categoria | `categoria` | ✅ | Match exato |
| Recorrente | `recorrente` | ✅ | Aceita `"true"` ou `"false"` como string |
| Paginação | `page`, `limit` | ✅ | Padrão: page=1, limit=20 |

### Filtros não implementados (pendências)

| Filtro | Parâmetro esperado | Status | Observação |
|---|---|---|---|
| Complexidade | `complexidade` | ⚠️ Pendente | Campo não está no schema atual do `ServicoCatalogo` |
| Ativo | `ativo` | ⚠️ Pendente | O `listarPublico()` filtra apenas `ativo: true` (hardcoded). Admin não pode listar inativos via query. |
| Esfera | `esfera` | ⚠️ Pendente | Campo não existe no modelo atual `ServicoCatalogo` |

---

## 6. Correção de bug

Durante a implementação, o `typecheck` identificou um erro de tipagem no `comercial.routes.ts`:

**Erro:** `AppError` estava sendo chamado com os argumentos `statusCode` e `code` na ordem invertida.

```ts
// ❌ Errado (ordem invertida — statusCode é number, não string)
throw new AppError('Acesso negado.', 403, 'FORBIDDEN')

// ✅ Correto (assinatura: message, code: string, statusCode: number)
throw new AppError('Acesso negado.', 'FORBIDDEN', 403)
```

**Assinatura correta do `AppError`:**
```ts
constructor(message: string, code: string, statusCode: number, details?: Record<string, unknown>)
```

O bug foi corrigido nos dois pontos de `throw` do arquivo de rotas, e o `typecheck` passou sem erros após a correção.

---

## 7. Validações executadas

| Comando | Resultado | Observação |
|---|---|---|
| `pnpm --filter api typecheck` | ✅ `Exit code 0` | Zero erros de TypeScript após correção do `AppError` |
| `pnpm --filter web typecheck` | ⚠️ Não executado | Nenhuma alteração foi feita no `apps/web`. Deve ser executado na Onda 2.5.1 como validação de regressão. |

---

## 8. Pendência: 31 vs 47 serviços

A validação final da Onda 2.4.1 (`docs/10_VALIDACAO_FINAL_ONDA_2_4_1.md`) confirmou **31 registros** na tabela `servicos_consultoria_base`.

A auditoria original da pasta `INTERFACE` (`docs/05_AUDITORIA_CATALOGO_SERVICOS_INTERFACE.md`) mapeou **47 serviços** no arquivo `habilis-services.ts`.

**Essa diferença de 16 serviços ainda não foi explicada nem resolvida.**

Hipóteses possíveis:
- O seed atual (`servicos-consultoria.ts`) pode não cobrir todos os 47 serviços do `habilis-services.ts`.
- Alguns serviços podem ter sido excluídos intencionalmente do seed por critérios de relevância.
- Pode haver serviços duplicados ou obsoletos no arquivo legado que não foram portados.

> [!IMPORTANT]
> A Onda 2.5 **não corrigiu nem investigou** essa diferença. A API retorna os 31 serviços existentes no banco sem assumir que o número deveria ser 47.  
> **Recomendação:** Auditar o `seed/servicos-consultoria.ts` linha a linha contra o `habilis-services.ts` em etapa própria antes da Onda 2.6.

---

## 9. Riscos remanescentes

| Risco | Gravidade | Status |
|---|---|---|
| Perfil `ADMIN` exclusivo no endpoint `/catalogo/admin` | Médio | ⚠️ Pendente revisão na Onda 2.5.1 — possivelmente `COORDENADOR` também deveria ter acesso |
| Diferença 31 vs 47 serviços não investigada | Médio | ⚠️ Pendente auditoria do seed |
| Filtros `complexidade`, `esfera` e `ativo` (admin) não implementados | Baixo | ⚠️ Pendente — faltam campos no modelo ou lógica adicional |
| `pnpm --filter web typecheck` não executado | Baixo | ⚠️ Validação de regressão pendente |
| Ainda não há UI para consumir o catálogo | Informativo | Fora do escopo da Onda 2.5 |
| Ainda não há diagnóstico por CNAE | Informativo | Fora do escopo — Onda 2.6 ou posterior |
| Ainda não há motor de orçamento ou proposta comercial | Informativo | Fora do escopo — Ondas futuras |

---

## 10. Próxima etapa recomendada

**`Onda 2.5.1 — Validação manual da API e revisão de perfis de autorização`**

Antes de avançar para a Onda 2.6, é necessário:

1. **Testar os endpoints manualmente** via `curl` ou cliente HTTP (ex: Bruno, Insomnia), validando:
   - Resposta 401 para requisições sem token;
   - Resposta 403 para usuário `ANALISTA` ou `COORDENADOR` acessando `/catalogo/admin`;
   - Confirmação de que `custoInternoEstimado` e `margemLucroAlvo` estão ausentes na resposta pública;
   - Confirmação de que a resposta admin contém todos os campos.

2. **Revisar o guard de perfil** no endpoint `/catalogo/admin`:
   - Decidir se `COORDENADOR` e/ou `ADMIN_TENANT` também devem ter acesso aos dados sensíveis.
   - Atualizar o guard de `perfil !== 'ADMIN'` para refletir a política correta de autorização.

3. **Executar `pnpm --filter web typecheck`** como verificação de regressão.

4. **Auditar a diferença 31 vs 47 serviços** antes de qualquer onda de consumo de catálogo.

Somente após a Onda 2.5.1 concluída e validada, o projeto estará pronto para avançar à **Onda 2.6** (diagnóstico por CNAE ou motor de proposta, conforme prioridade definida).
