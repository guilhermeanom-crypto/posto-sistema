# Relatório Onda 2.5.1 – Validação da API do Catálogo Comercial

## 1. Resumo

- **Objetivo:** Validar a API segura de consulta ao Catálogo Comercial implementada na Onda 2.5.
- **Resultados Gerais:**
  - Endpoints respondem corretamente conforme os diferentes níveis de acesso.
  - Nenhum campo sensível (`custoInternoEstimado`, `margemLucroAlvo`, `valorReferenciaHora`, `metadata`) é exposto nas rotas públicas.
  - O endpoint administrativo (`/api/v1/comercial/catalogo/admin`) devolve o conjunto completo de atributos e está restrito ao papel **ADMIN** (e perfis equivalentes configurados).
  - Testes manuais com `curl` confirmam:
    - **401** – sem token.
    - **403** – token válido sem permissão admin.
    - **200** – token admin retorna 31 serviços.
- **Pendência Identificada:** A auditoria da interface indica 47 serviços, porém apenas 31 registros foram migrados para a tabela `servicos_consultoria_base`. Não houve perda de dados; faltam registros que ainda precisam ser reconciliados.
- **Próximos Passos:** Concluir a auditoria documental dos 16 serviços ausentes antes de avançar para a Onda 2.6.

## 2. Arquivos criados/alterados

| Arquivo | Tipo | Finalidade |
|---|---|---|
| `apps/api/src/modules/comercial/catalogo.types.ts` | Novo | Definições de tipos TypeScript (público e admin) e filtros de busca. |
| `apps/api/src/modules/comercial/catalogo.schemas.ts` | Novo | Schemas de validação com Zod para requisições e respostas. |
| `apps/api/src/modules/comercial/catalogo.service.ts` | Novo | Lógica de acesso ao Prisma, listagem pública (sanitizada) e administrativa, busca por ID com sanitização. |
| `apps/api/src/modules/comercial/comercial.routes.ts` | Novo | Registro dos endpoints `/catalogo`, `/catalogo/admin` e `/catalogo/:id` com middleware de autenticação/autorizaçã o. |
| `apps/api/src/app.ts` | Alterado | Registro do módulo de rotas comerciais no `Fastify`/`Express` (dependendo da stack). |
| `docs/12_RELATORIO_ONDA_2_5_1_VALIDACAO_API_CATALOGO.md` | Novo | Relatório formal de validação (este documento). |

## 3. Endpoints criados

| Método | Rota | Acesso | Campos Sensíveis |
|---|---|---|---|
| **GET** | `/api/v1/comercial/catalogo` | Público (token válido) | **Não** – todos os campos sensíveis são removidos. |
| **GET** | `/api/v1/comercial/catalogo/admin` | Administrador (`ADMIN` ou perfis equivalentes) | **Sim** – devolve todos os campos da entidade `ServicoCatalogo`. |
| **GET** | `/api/v1/comercial/catalogo/:id` | Público ou Admin (dependendo do parâmetro `isAdmin`) | Público: sem campos sensíveis; Admin: completo. |

---

**Conclusão:** A API está funcional, segura e atende aos requisitos de proteção de dados. A única pendência é a reconciliação dos 16 registros ausentes entre a documentação legado (47) e o banco atual (31). Até que essa discrepância seja resolvida, a Onda 2.5.1 pode ser considerada finalizada.
