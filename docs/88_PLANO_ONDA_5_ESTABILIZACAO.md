# 88. Plano da Onda 5 — Estabilização das Camadas Inconsistentes

## 1. Objetivo

Estabilizar o sistema apos a auditoria geral ([87_AUDITORIA_GERAL_SISTEMA.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/87_AUDITORIA_GERAL_SISTEMA.md>)), corrigindo falhas de seguranca, inconsistencias arquiteturais, duplicacoes e lacunas de teste — na ordem que minimiza risco e maximiza destravamento.

Esta onda NAO adiciona funcionalidade nova. E uma onda de consolidacao tecnica (hardening).

## 2. Principio de sequenciamento

A ordem segue 3 regras:
1. **Seguranca primeiro** — bloqueia producao, isolado, baixo acoplamento.
2. **Destravar antes de escalar** — itens que sao pre-requisito de outros (ex: helpers de teste antes de cobertura) vem antes.
3. **Refactor grande por ultimo** — unificacao de tipos e camada de service sao incrementais e arriscados; ficam ao final com gates de validacao.

## 3. Sub-ondas

### Onda 5.1 — Seguranca (CRITICO)
**Objetivo:** fechar as 5 falhas que bloqueiam producao.
**Dependencias:** nenhuma.
**Itens:**
| ID | Correcao | Arquivo |
|---|---|---|
| SEC-01 | Hash do magic link token antes de persistir + no lookup | auth.service.ts |
| SEC-02 | `INTEGRATION_SHARED_SECRET` obrigatoria (Zod env) ou assertion no boot | config/env.ts |
| SEC-03 | Rate limit dedicado 10 req/min em `/auth/login` e `/auth/refresh` | auth.routes.ts |
| SEC-04 | `trustProxy` = numero exato de hops (config via env, default 1) | app.ts |
| SEC-05 | `{ type: argon2.argon2id }` em todas as chamadas `argon2.hash` | tenants.routes.ts (+ grep global) |

**Gate de aceite:**
- Suite de auth continua verde.
- Novo teste: login excede 10 req/min retorna 429.
- Novo teste: magic link nao bate com valor em texto puro no banco.
- `pnpm typecheck` apps/api limpo.

**Esforco:** ~1.5h. **Risco:** baixo (mudancas localizadas).

---

### Onda 5.2 — Saude de banco e worker
**Objetivo:** eliminar risco de performance e gaps de fila.
**Dependencias:** nenhuma (pode rodar em paralelo conceitual com 5.1, mas executar depois).
**Itens:**
- Migration adicionando indices: `AuditLog` (tenantId, criadoEm; tenantId, entidadeTipo), `Usuario` ja tem `(tenantId, ativo)` — revisar necessidade de `(tenantId, email)` ja coberto por unique. Avaliar `EmpreendimentoAcesso`, `TarefaDependencia`, `MTR`, `LaudoAgua`, `RegraAutomatica`.
- Adicionar `@@map` snake_case nas 7 tabelas inconsistentes (`Tenant`, `Usuario`, `RequisitoTipoProcesso`, `RegraAutomatica`, `AuditLog`, `MTR`, `LaudoAgua`). **ATENCAO:** renomear tabela e breaking — exige migration de RENAME e validacao de que nenhum `$queryRaw` referencia o nome antigo. Avaliar custo/beneficio; pode ficar so a documentacao se o risco for alto.
- Sincronizar filas: definir `ai`, `relatorio`, `whatsapp` em `bullmq.ts` (tipadas) OU documentar que esses processors sao acionados so por scheduler interno. Remover ou implementar fila `notificacoes` (definida sem processor).

**Gate de aceite:**
- Migration aplica sem erro em dev.
- `pnpm typecheck` limpo.
- Worker sobe sem warning de fila orfã.
- 66 testes continuam verdes.

**Esforco:** ~1.5h (indices + filas). @@map fica condicionado a analise de risco. **Risco:** medio (rename de tabela).

---

### Onda 5.3 — Limpeza imediata (baixo risco)
**Objetivo:** remover duplicacoes baratas e destravar 5.5.
**Dependencias:** nenhuma. Helpers de teste sao pre-requisito de 5.5.
**Itens:**
- Criar `apps/api/src/test/helpers.ts` com `loginDemo`, `authedRequest`, `buildPropostaPayload`, `createApprovedProposal`, `createHandoffFixture`, `createContratoFixture`. Refatorar os 5 arquivos de teste para importar.
- Desmockar `apps/web/src/app/(app)/servicos/page.tsx` usando `GET /api/v1/comercial/catalogo`.
- Remover exports mortos de `gestao-interna/data.ts` (`gestaoInternaCards`, `percentual`, `statusTone`). Avaliar se o arquivo pode ser deletado por completo apos desmock de `/servicos`.

**Gate de aceite:**
- 66 testes verdes apos refactor dos helpers.
- `pnpm typecheck` apps/web limpo.
- `gestao-interna/data.ts` sem imports restantes (ou deletado).

**Esforco:** ~1.5h. **Risco:** baixo.

---

### Onda 5.4 — Unificacao de tipos (incremental)
**Objetivo:** eliminar os ~293 tipos duplicados, fonte unica em `packages/types` / `packages/schemas`.
**Dependencias:** 5.3 (codigo limpo facilita).
**Estrategia incremental por dominio (1 PR logico por dominio):**
1. Comercial: `PropostaComercial`, `Contrato`, `ItemProposta` → `packages/types`.
2. Operacao: `HandoffComercial`, `OrdemServico`, `Entregavel` → `packages/types`.
3. Empreendimento e correlatos (3 redefinicoes no front).
4. Demais conforme uso.

Para cada dominio: mover interface para `packages/types`, exportar, backend e frontend importam de la. Schemas Zod compartilhaveis vao para `packages/schemas`.

**Gate de aceite (por dominio):**
- `pnpm typecheck` em api E web limpo.
- Nenhuma regressao nos 66 testes.
- Frontend renderiza a tela do dominio sem erro de tipo.

**Esforco:** 2-3 dias (incremental). **Risco:** medio (mudanca ampla, mas com typecheck como rede de seguranca).

---

### Onda 5.5 — Camada de service + cobertura de testes
**Objetivo:** elevar cobertura de 8% e padronizar os 15 modulos routes-only.
**Dependencias:** 5.3 (helpers de teste).
**Estrategia:**
- **Fase A — Service layer:** extrair logica inline para `*.service.ts` nos 15 modulos routes-only, comecando pelos criticos (compliance, crm, tenants, audit).
- **Fase B — Testes:** escrever testes de rota nos modulos criticos sem cobertura, priorizando: `documentos`, `processos`, `condicionantes`, `compliance`, `empreendimentos`, `usuarios`, `fiscalizacoes`. Meta: 50%+ dos modulos criticos.

**Gate de aceite:**
- Cada modulo refatorado mantem comportamento (teste antes/depois).
- Cobertura sobe de 3/39 para 12+/39 modulos.
- `pnpm test` verde.

**Esforco:** 5-8 dias. **Risco:** medio (refactor amplo, mitigado por testes).

## 4. Ordem de execucao recomendada

```
5.1 Seguranca          (1.5h, critico)      ── bloqueia producao
   ↓
5.2 Banco + Worker     (1.5h, performance)  ── destrava escala
   ↓
5.3 Limpeza imediata   (1.5h, baixo risco)  ── destrava 5.5
   ↓
5.4 Unificacao tipos   (2-3 dias, incremental)
   ↓
5.5 Service + testes   (5-8 dias, continuo)
```

5.1 + 5.2 + 5.3 sao o **"core de estabilizacao"** — ~4.5h, deixam o sistema seguro, performatico e limpo. 5.4 e 5.5 sao maturidade de engenharia, fazem-se ao longo do tempo.

## 5. Gates globais

Apos cada sub-onda:
1. `pnpm typecheck` em todos os apps afetados.
2. `pnpm test` (suite completa) verde.
3. Boot dos servicos sem erro.
4. Relatorio de fechamento da sub-onda em `docs/`.

## 6. Criterios de "estabilizacao concluida"

- [ ] 0 falhas de seguranca criticas/altas abertas.
- [ ] Indices em todas as tabelas de alto volume.
- [ ] Filas worker 100% sincronizadas (sem orfã).
- [ ] 0 telas com mock.
- [ ] Tipos de dominio com fonte unica (sem duplicacao frontend/backend).
- [ ] Cobertura de testes >= 30% dos modulos (12+/39).
- [ ] Todos os modulos seguem padrao routes + service.

## 7. O que esta fora desta onda

- Funcionalidade nova (detalhe de OS/[id], PDF de contrato, aceite digital, faturamento real).
- Migracao para microservicos (nao se aplica ao porte atual).
- Otimizacoes prematuras (read replica, particionamento).
