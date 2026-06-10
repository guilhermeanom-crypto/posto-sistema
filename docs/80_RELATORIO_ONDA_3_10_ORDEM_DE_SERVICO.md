# 80. Relatorio da Onda 3.10 - Entidade Ordem de Servico

## 1. Objetivo executado nesta onda

Criar a entidade `OrdemServico` (OS) como destino natural do fluxo `Contrato ATIVO -> OS -> execucao em campo`, conforme [79_PLANO_ONDA_3_10_ORDEM_DE_SERVICO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/79_PLANO_ONDA_3_10_ORDEM_DE_SERVICO.md>), substituindo:

- O **mock hibrido** da tela `/ordens-servico` (sistema interno).
- O **mock estatico** da tela `/equipe/os` (area de campo).

Esta onda mexeu no Prisma (3 enums + 1 model novo) e gerou migration governada. Nenhuma estrutura pre-existente foi alterada.

## 2. Arquivos criados/alterados

### Banco de dados
- [apps/api/prisma/schema.prisma](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/prisma/schema.prisma>)
  - 3 novos enums: `StatusOrdemServico`, `PrioridadeOrdemServico`, `TipoOrdemServico`.
  - Novo `model OrdemServico` com 24 campos, 1 unique e 5 indices.
  - Relacoes reversas em `Tenant`, `Contrato`, `Empreendimento`, `Usuario` (3 relations).
- [apps/api/prisma/migrations/20260527113000_add_ordens_servico/migration.sql](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/prisma/migrations/20260527113000_add_ordens_servico/migration.sql>)
  - Cria 3 enums + tabela `ordens_servico` + indices + 6 FKs. Aplicada via `prisma migrate deploy`.

### Backend (`apps/api/src/modules/operacao/`)
- [ordens-servico.types.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/ordens-servico.types.ts>) - tipos e enums.
- [ordens-servico.schemas.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/ordens-servico.schemas.ts>) - schemas Zod, com helper `booleanQueryParam`.
- [ordens-servico.service.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/ordens-servico.service.ts>) - `OrdensServicoService` com:
  - `criar`: valida contrato em `ATIVO`/`SUSPENSO`, herda `empreendimentoId`, valida responsavel se informado, gera numero `OS-{ano}-{8-hex}`.
  - `listar`: filtros (status, prioridade, tipo, contratoId, empreendimentoId, responsavelId, `apenasMinhas`, `apenasAbertas`) com JOIN para contrato.numero, empreendimento.nome/cidade/estado, responsavel.nome.
  - `buscarPorId`: detalhe com mesmos JOINs.
  - `atualizar`: STATUS_TRANSITIONS (`PLANEJADA -> EM_EXECUCAO/CANCELADA`; `EM_EXECUCAO -> AGUARDANDO_REVISAO/CONCLUIDA/CANCELADA`; etc.). Preenche `dataInicioExecucao`/`dataConclusao`/`dataCancelamento` automaticamente. **Regra extra**: exige responsavel atribuido antes de transicionar para `EM_EXECUCAO`.
  - `kpis`: agrega `totalAbertas`, `totalEmExecucao`, `totalCriticas`, `totalConcluidasMes` (este ultimo filtrado por `date_trunc('month', NOW())`).
  - Auditoria via `registrarAuditoria` em criar e atualizar.
- [ordens-servico.routes.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/ordens-servico.routes.ts>) - 5 endpoints com 3 niveis de perfil:
  - `POST /api/v1/operacao/ordens-servico` (COORDENADOR+)
  - `GET /api/v1/operacao/ordens-servico` (ANALISTA_CAMPO+ ja le)
  - `GET /api/v1/operacao/ordens-servico/kpis`
  - `GET /api/v1/operacao/ordens-servico/:id`
  - `PATCH /api/v1/operacao/ordens-servico/:id` (ANALISTA_CAMPO pode atualizar status/observacoes/responsavel)
- [app.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/app.ts>) - 1 import + 1 `app.register` com prefixo `/api/v1/operacao/ordens-servico`.

### Frontend
- [apps/web/src/app/(app)/ordens-servico/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/ordens-servico/page.tsx>) - **reescrita completa, mock removido**:
  - Removeu imports de `gestao-interna/data` (`servicosCatalogo`, `statusTone`).
  - Server Component busca em paralelo `/operacao/ordens-servico?limit=50` + `/operacao/ordens-servico/kpis`.
  - KPIs reais: Abertas, Em execucao, Criticas, Concluidas no mes.
  - Tabela com colunas: Numero, Titulo/Cliente, Tipo, Responsavel, Status (badge), Prazo. Tambem badge separado de prioridade.
- [apps/web/src/app/equipe/(equipe)/os/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/equipe/(equipe)/os/page.tsx>) - **reescrita completa, mock removido**:
  - Removeu array `ROWS` hardcoded.
  - Server Component busca `/operacao/ordens-servico?apenasMinhas=true&apenasAbertas=true&limit=50`.
  - Mantem visual de tabela mobile-first, mas com dados reais do responsavel autenticado.
  - Estado vazio descritivo.

### Tests
- [apps/api/src/modules/operacao/__tests__/ordens-servico.routes.test.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/src/modules/operacao/__tests__/ordens-servico.routes.test.ts>) - 7 cenarios:
  1. Bloqueia listagem sem JWT (401).
  2. Bloqueia criacao com contrato em RASCUNHO (409).
  3. Cria OS a partir de contrato ATIVO (201) + valida numero, tipo, prioridade, empreendimento herdado.
  4. Exige responsavel antes de transicionar para EM_EXECUCAO (409 sem, 200 com).
  5. Recusa transicao invalida PLANEJADA -> CONCLUIDA (403).
  6. Lista + KPIs (200).
  7. Filtro `apenasMinhas=true` retorna apenas OSs do usuario autenticado.

### Documentos
- [docs/79_PLANO_ONDA_3_10_ORDEM_DE_SERVICO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/79_PLANO_ONDA_3_10_ORDEM_DE_SERVICO.md>) - plano.
- [docs/80_RELATORIO_ONDA_3_10_ORDEM_DE_SERVICO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/80_RELATORIO_ONDA_3_10_ORDEM_DE_SERVICO.md>) - este arquivo.

## 3. Modelo de dominio resultante

```
PropostaComercial (APROVADA)
   |
   v
HandoffComercial
   |
   v
Contrato (ATIVO ou SUSPENSO)
   |
   v
OrdemServico  <- nova entidade desta onda
   - numero (OS-{ano}-{hash})
   - tipo (VISTORIA_TECNICA | COLETA_AMOSTRA | RENOVACAO_LICENCA | DILIGENCIA | PROTOCOLO | RELATORIO | OUTRO)
   - prioridade (BAIXA | MEDIA | ALTA | CRITICA)
   - status (PLANEJADA -> EM_EXECUCAO -> AGUARDANDO_REVISAO -> CONCLUIDA, ou CANCELADA)
   - responsavel (Usuario? - obrigatorio para iniciar execucao)
   - empreendimento (Empreendimento - herdado do Contrato)
   - dataPlanejada / dataInicioExecucao / dataConclusao
```

### Regras impostas pelo service
- Contrato precisa estar `ATIVO` ou `SUSPENSO` para emitir OS (caso contrario, 409).
- Empreendimento herdado do contrato (nao pode criar OS sem empreendimento).
- Para transicionar `PLANEJADA -> EM_EXECUCAO`, OS precisa ter responsavel (atribuido na propria chamada PATCH ou previamente).
- `CONCLUIDA` e `CANCELADA` sao terminais.
- Toda mudanca de status preenche o timestamp correspondente.

### Diferenca conceitual entre OS e Tarefa
- **OS**: instrumento contratual derivado de `Contrato`. Tem `tipo`, escopo formal, e e o que a equipe de campo executa.
- **Tarefa**: atividade do workflow regulatorio derivada de `Processo`/`Condicionante`. Existem em paralelo. Nesta onda nao ha amarracao entre OS e Tarefa - sera reavaliado se demanda real surgir.

## 4. Validacao realizada

### 4.1 Migration
```
npx prisma migrate deploy
> All migrations have been successfully applied.
```

### 4.2 Testes automatizados
```
pnpm test ordens-servico
 ✓ src/modules/operacao/__tests__/ordens-servico.routes.test.ts (7 tests) 1106ms

pnpm test (suite inteira)
 Test Files  5 passed (5)
      Tests  50 passed (50)
```
Sem regressao nos 43 testes pre-existentes.

### 4.3 Typecheck
```
apps/api: pnpm typecheck -> sem erros
apps/web: pnpm typecheck -> sem erros
```

### 4.4 Runtime contra API live

API subiu sem erros (health 200). Validacao com curl autenticado:

| Caso | Resultado |
|---|---|
| `GET /operacao/ordens-servico/kpis` (sem OSs) | `{ totalAbertas: 0, totalEmExecucao: 0, totalCriticas: 0, totalConcluidasMes: 0 }` |
| `GET /operacao/ordens-servico?limit=10` | `total: 0` |
| `?tipo=XPTO` (invalido) | HTTP 400 (Zod rejeitou) |
| `?apenasMinhas=true` | `total minhas: 0` (correto, sem OSs no seed) |

OBS: testes integration ja exercitaram POST e PATCH com banco real. Para evitar poluicao do seed demo, nao replicamos POST manualmente fora dos testes.

### 4.5 Validacao headless de UI

Nao executada nesta onda. UI validada por compilacao limpa do Next + alinhamento de tipos com o payload da API.

## 5. Aderencia ao Plano Mestre

- `/Posto/sistema` continuou como base unica.
- Migration governada (principio 7).
- Tela so existe apos API existir (principio 8).
- Multi-tenant respeitado em todas as queries (`tenant_id` sempre no WHERE).
- Atendeu item "Ordens de servico" da secao 4 do Plano Mestre.
- Atendeu inicio da Sprint 6: "Criar entidades financeiras e OrdemServico / Entregavel no Prisma".

## 6. O que esta consolidado apos esta onda

- Entidade `OrdemServico` persistida com auditoria, multi-tenant e relacionamentos completos.
- Fluxo `Proposta APROVADA -> Handoff -> Contrato ATIVO -> OS` operacional no backend.
- Transicoes de estado governadas com regra de exigencia de responsavel antes de execucao.
- KPIs operacionais agregados (Abertas, Em execucao, Criticas, Concluidas no mes).
- 5 endpoints REST com 3 niveis de perfil (leitura, criacao, atualizacao).
- 7 testes integration verdes contra Postgres real.
- Tela `/ordens-servico` (sistema) 100% des-mockada.
- Tela `/equipe/os` (campo) 100% des-mockada e personalizada por responsavel autenticado.
- Mocks `servicosCatalogo`, `statusTone`, array `ROWS` removidos das telas correspondentes.

## 7. Fora de escopo (Onda 3.10.1 futura, se demanda real surgir)

- Detalhe individual em `/operacao/ordens-servico/[id]` e `/equipe/os/[id]`.
- Geracao de PDF da OS.
- Anexar evidencias diretamente na OS.
- Geracao automatica de tarefas operacionais a partir da OS.
- Reabertura de OS concluida (workflow de devolucao para revisao).
- Cobranca/faturamento por OS (sera Onda 3.12).

## 8. Proximo bloco funcional recomendado

Com OS consolidada, o proximo passo natural e a entidade **Entregavel** (Onda 3.11):

- Modelar `Entregavel` no Prisma vinculado a `OrdemServico` (1:N).
- Migration governada.
- Service + routes em `apps/api/src/modules/operacao/entregaveis.*`.
- **Job no worker** (`apps/worker/`) para geracao assincrona de PDFs com `pdfkit` (similar ao PDF de proposta ja existente).
- Substituir mock em [apps/web/src/app/(app)/entregaveis](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/entregaveis>).
- Testes integration.
- Relatorio doc 82 (apos plano em doc 81).

Sequencia preservada: `proposta -> handoff -> contrato -> OS -> **entregavel** -> financeiro`.
