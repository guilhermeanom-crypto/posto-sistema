# 78. Relatorio da Onda 3.9 - Entidade Contrato

## 1. Objetivo executado nesta onda

Criar a entidade `Contrato` como destino natural do fluxo `Proposta APROVADA -> HandoffComercial -> Contrato`, conforme [77_PLANO_ONDA_3_9_ENTIDADE_CONTRATO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/77_PLANO_ONDA_3_9_ENTIDADE_CONTRATO.md>), substituindo o mock da tela `/contratos` por dado real persistido.

Esta onda **mexeu no Prisma** (primeira da serie 3.9+) e gerou migration governada. Nenhuma estrutura pre-existente foi alterada.

## 2. Arquivos criados/alterados

### Banco de dados
- [apps/api/prisma/schema.prisma](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/prisma/schema.prisma>)
  - Novo enum `StatusContrato` (RASCUNHO, ATIVO, SUSPENSO, ENCERRADO, CANCELADO).
  - Novo `model Contrato` com 27 campos, 1 unique e 4 indices.
  - Relacoes reversas adicionadas em `Tenant`, `Usuario`, `HandoffComercial`, `PropostaComercial`, `Empreendimento`.
- [apps/api/prisma/migrations/20260527110000_add_contratos/migration.sql](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/prisma/migrations/20260527110000_add_contratos/migration.sql>)
  - Cria enum + tabela `contratos` + indices + 6 FKs.
  - Aplicada em dev via `npx prisma migrate deploy`.

### Backend (`apps/api/src/modules/comercial/`)
- [contratos.types.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/comercial/contratos.types.ts>) - tipos e enums (STATUS_CONTRATO, ContratoResumo, ContratoDetalhe, ContratoItemSnapshot, ContratoKpis, inputs e results).
- [contratos.schemas.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/comercial/contratos.schemas.ts>) - schemas Zod (`criarContratoSchema`, `atualizarContratoSchema`, `filtrosContratoSchema`, `contratoResumoSchema`, `contratoDetalheSchema`, `contratoKpisSchema`).
- [contratos.service.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/comercial/contratos.service.ts>) - `ContratosService` com:
  - `criar`: valida handoff, bloqueia duplicidade vigente, copia itens da proposta como snapshot, soma `valorMensal`, gera numero `CT-{ano}-{8-hex}`.
  - `listar`: filtros (status, empreendimento, handoff, busca por numero/cliente) com JOIN para nome/cidade do empreendimento e lead.
  - `buscarPorId`: detalhe com snapshot dos itens.
  - `atualizar`: status segue STATUS_TRANSITIONS (RASCUNHO -> ATIVO/CANCELADO; ATIVO -> SUSPENSO/ENCERRADO/CANCELADO; etc.). Preenche `ativadoEm`/`suspensoEm`/`encerradoEm`/`canceladoEm` automaticamente.
  - `kpis`: agrega `totalAtivos`, `totalCadastrados`, `mrr` (SUM(valor_mensal) WHERE status='ATIVO').
  - Auditoria via `registrarAuditoria` em criacao e atualizacao.
- [comercial.routes.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/comercial/comercial.routes.ts>) - 5 endpoints novos:
  - `POST /api/v1/comercial/contratos` (COORDENADOR+)
  - `GET /api/v1/comercial/contratos` (ANALISTA+)
  - `GET /api/v1/comercial/contratos/kpis`
  - `GET /api/v1/comercial/contratos/:id`
  - `PATCH /api/v1/comercial/contratos/:id` (COORDENADOR+)
  - Helpers `assertPodeLerContratos` / `assertPodeGerenciarContratos`.

### Frontend
- [apps/web/src/app/(app)/contratos/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/contratos/page.tsx>) - reescrita completa, **mock removido**:
  - Server Component que busca em paralelo `/comercial/contratos?limit=50` + `/comercial/contratos/kpis`.
  - KPIs reais: Ativos, MRR (formatado em BRL via `Intl.NumberFormat`), Cadastrados.
  - Tabela com colunas: Numero, Cliente/posto, Status (badge colorido por estado), Vigencia (`inicio -> fim` ou `sem prazo`), Valor mensal.
  - Estado vazio descritivo aponta para `/operacao/handoffs` como origem.
  - Imports antigos de `gestao-interna/data` (`servicosCatalogo`, `moeda`) **removidos**.
  - Callout "proxima evolucao" agora aponta para "Geração automatica de Ordens de Servico" (Onda 3.10).

### Tests
- [apps/api/src/modules/comercial/__tests__/contratos.routes.test.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/comercial/__tests__/contratos.routes.test.ts>) - 7 cenarios:
  1. Bloqueia listagem sem JWT (401)
  2. Cria contrato a partir de handoff valido (201) + valida numero + valorMensal + itensSnapshot
  3. Bloqueia segundo contrato vigente para o mesmo handoff (409)
  4. Atualiza status com transicao valida RASCUNHO -> ATIVO (200) + checa `ativadoEm`
  5. Recusa transicao invalida RASCUNHO -> ENCERRADO (403)
  6. Lista contratos do tenant + KPIs com `moeda='BRL'`
  7. Retorna 404 para contrato inexistente

### Documentos
- [docs/77_PLANO_ONDA_3_9_ENTIDADE_CONTRATO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/77_PLANO_ONDA_3_9_ENTIDADE_CONTRATO.md>) - plano.
- [docs/78_RELATORIO_ONDA_3_9_ENTIDADE_CONTRATO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/78_RELATORIO_ONDA_3_9_ENTIDADE_CONTRATO.md>) - este arquivo.

## 3. Modelo de dominio resultante

```
PropostaComercial (APROVADA)
        |
        v
HandoffComercial (1:N - permite renegociacao futura)
        |
        v
Contrato
    - numero (unico por tenant)
    - status (RASCUNHO -> ATIVO -> SUSPENSO/ENCERRADO/CANCELADO)
    - vigencia (dataInicio obrigatorio, dataFim opcional)
    - diaVencimento (1..28)
    - valorMensal (calculado: SUM(itens.valorAplicadoLinha) da proposta)
    - itensSnapshot (Json - congelado no momento da emissao)
    - empreendimento (opcional, herdado do handoff)
```

Regras impostas pelo service:
- So pode existir 1 contrato `RASCUNHO/ATIVO/SUSPENSO` por handoff. Tentativa de duplicar retorna 409.
- `dataFimVigencia` deve ser estritamente posterior a `dataInicioVigencia`.
- `diaVencimento` validado em 1..28 pelo Zod (evita problemas de fevereiro).
- Toda mudanca de status preenche o timestamp correspondente.
- Toda criacao/atualizacao registra auditoria via `AuditLog`.

## 4. Validacao realizada

### 4.1 Migration
```
npx prisma migrate deploy
> All migrations have been successfully applied.
```

### 4.2 Testes automatizados
```
pnpm test contratos
 ✓ src/modules/comercial/__tests__/contratos.routes.test.ts (7 tests) 1138ms

pnpm test (suite inteira)
 Test Files  4 passed (4)
      Tests  43 passed (43)
```
Zero regressao em handoffs, propostas, diagnosticos.

### 4.3 Typecheck
```
apps/api: pnpm typecheck -> sem erros
apps/web: pnpm typecheck -> sem erros
```

### 4.4 Runtime contra API live

Servidor subiu sem erros (health 200, DB ok, Redis ok). Testes com curl autenticado como `admin@postodemo.com.br`:

| Cenario | Resultado |
|---|---|
| `GET /comercial/contratos/kpis` (sem contratos) | `{ totalAtivos: 0, totalCadastrados: 0, mrr: 0, moeda: "BRL" }` |
| `POST /comercial/contratos` com handoff valido | 201 + `numero: CT-2026-5AEA41D6`, `status: RASCUNHO`, `valorMensal: 27000`, `itensSnapshot: 3 itens` |
| `GET /comercial/contratos/kpis` (apos POST) | `{ totalAtivos: 0, totalCadastrados: 1, mrr: 0, moeda: "BRL" }` - MRR continua zero porque ainda esta RASCUNHO |
| `PATCH /comercial/contratos/:id { status: ATIVO }` | 200 + `ativadoEm` preenchido |
| `GET /comercial/contratos/kpis` (apos ativacao) | `{ totalAtivos: 1, totalCadastrados: 1, mrr: 27000, moeda: "BRL" }` - MRR refletiu corretamente |
| `PATCH { status: RASCUNHO }` (invalido) | HTTP 403 (`Transição de status inválida`) |
| Cleanup do contrato de teste | Removido via Prisma db execute |

### 4.5 Validacao headless de UI

Nao executada nesta onda (mesma ressalva das ondas 3.7 e 3.8). UI validada por compilacao limpa do Next + alinhamento de tipos com o payload retornado pela API.

## 5. Aderencia ao Plano Mestre

- `/Posto/sistema` continuou como base unica.
- Banco alterado com plano governado (principio 7 do [02_PLANO_MESTRE_DE_CONSOLIDACAO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/02_PLANO_MESTRE_DE_CONSOLIDACAO.md>)).
- Telas existem com API correspondente (principio 8).
- Multi-tenant respeitado em todas as queries e indices.
- Migration adicionou apenas (sem ALTER em tabelas existentes), risco minimo.
- Atendeu item "Contratos" da secao 4 do Plano Mestre: "Mockado/Inexistente -> Criar entidade e refatorar".
- Atendeu Sprint 5: "Criar entidades Prisma (..., Contrato)".

## 6. O que esta consolidado apos esta onda

- Entidade `Contrato` persistida no banco com auditoria, multi-tenant e relacionamentos completos.
- Fluxo `Proposta APROVADA -> Handoff -> Contrato` operacional ponta-a-ponta no backend.
- Snapshot de itens da proposta congelado no contrato (imune a edicoes futuras na proposta).
- Transicoes de estado governadas (sem possibilidade de "reverter" um contrato encerrado).
- 5 endpoints REST com perfis autorizados, auditoria, validacao Zod.
- 7 testes integration passando contra Postgres real.
- Tela `/contratos` 100% des-mockada: KPIs reais (Ativos, MRR, Cadastrados) e listagem real.

## 7. O que continua fora do escopo (Onda 3.9.1 ou posterior, se demanda real surgir)

- Aceite digital / assinatura eletronica.
- Geracao de PDF do contrato (similar ao PDF de proposta ja existente).
- Aditivos contratuais (entidade `AditivoContrato`).
- Reajuste indexado (IPCA, IGPM) automatico.
- Workflow de envio para o cliente.
- Tela de criacao via formulario (hoje a criacao e via API direto).
- Tela de edicao em formulario completo.
- Historico versionado.
- Integracao com financeiro (sera Onda 3.12).

## 8. Proximo bloco funcional recomendado

Com Contrato consolidado, o proximo passo natural e a entidade **Ordem de Servico** (Onda 3.10):

- Modelar `OrdemServico` no Prisma vinculada a `Contrato` (1:N) e opcionalmente a `Tarefa` (para campo).
- Migration governada.
- Service + routes em `apps/api/src/modules/operacao/ordens-servico.*`.
- Substituir mocks em [apps/web/src/app/(app)/ordens-servico](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/ordens-servico>) e na area de campo `/equipe/os`.
- Testes integration.
- Relatorio doc 80 (apos plano em doc 79).

Sequencia preservada: `proposta -> handoff -> contrato -> **OS** -> entregavel -> financeiro`.
