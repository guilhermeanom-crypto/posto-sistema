# 79. Plano da Onda 3.10 - Entidade Ordem de Servico (OS)

## 1. Objetivo desta onda

Criar a entidade `OrdemServico` como destino natural do fluxo `Contrato ATIVO -> OS -> execucao em campo`, substituindo:

- O **mock hibrido** da tela `/ordens-servico` (sistema interno) que hoje agrega tarefas+processos+documentos chamando-os de OS.
- O **mock estatico** da tela `/equipe/os` (area de campo) que tem um array hardcoded com 5 OSs falsas.

Esta e a segunda onda que mexe no Prisma (apos a 3.9 que entregou Contrato) e da continuidade ao fluxo `proposta -> handoff -> contrato -> OS`.

## 2. Diagnostico do estado atual

### 2.1 Mock hibrido em `/ordens-servico`

[apps/web/src/app/(app)/ordens-servico/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/ordens-servico/page.tsx>):

- Busca via API: `/tarefas?limit=80`, `/processos?limit=80`, `/documentos?limit=80`.
- Concatena os 3 em uma lista chamada "OS" mas **nao ha entidade OS real**.
- Importa `servicosCatalogo` e `statusTone` do mock `gestao-interna/data`.
- KPIs derivados de heuristicas em texto de status (`['CRITICO', 'CRITICA', 'VENCIDO', 'BLOQUEADA']`).

### 2.2 Mock estatico em `/equipe/(equipe)/os`

[apps/web/src/app/equipe/(equipe)/os/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/equipe/(equipe)/os/page.tsx>):

- Array `ROWS` hardcoded com 5 OSs ficticias (OS-2026-0184 etc.).
- Zero chamadas a API.
- Botao "Abrir" leva pra `/equipe/checklists` (link generico, sem ID).

### 2.3 Backend atual

- Nao existe entidade `OrdemServico`.
- Nao existe `modules/operacao/ordens-servico.*`.
- Existe `Tarefa` (que e operacional intena, dispara workflow regulatorio). OS sera **diferente** de Tarefa: OS e instrumento contratual, Tarefa e atividade.

## 3. Modelagem Prisma proposta

### 3.1 Enums novos

```prisma
enum StatusOrdemServico {
  PLANEJADA
  EM_EXECUCAO
  AGUARDANDO_REVISAO
  CONCLUIDA
  CANCELADA
}

enum PrioridadeOrdemServico {
  BAIXA
  MEDIA
  ALTA
  CRITICA
}

enum TipoOrdemServico {
  VISTORIA_TECNICA
  COLETA_AMOSTRA
  RENOVACAO_LICENCA
  DILIGENCIA
  PROTOCOLO
  RELATORIO
  OUTRO
}
```

### 3.2 Model `OrdemServico`

```prisma
model OrdemServico {
  id                    String                 @id @default(uuid())
  tenantId              String                 @map("tenant_id")
  numero                String
  status                StatusOrdemServico     @default(PLANEJADA)
  tipo                  TipoOrdemServico
  prioridade            PrioridadeOrdemServico @default(MEDIA)
  contratoId            String                 @map("contrato_id")
  empreendimentoId      String                 @map("empreendimento_id")
  responsavelId         String?                @map("responsavel_id")
  criadoPorId           String                 @map("criado_por_id")
  atualizadoPorId       String?                @map("atualizado_por_id")
  titulo                String
  escopo                String                 @db.Text
  localExecucao         String?                @map("local_execucao")
  observacoesExecucao   String?                @map("observacoes_execucao") @db.Text
  observacoesInternas   String?                @map("observacoes_internas") @db.Text
  motivoCancelamento    String?                @map("motivo_cancelamento") @db.Text
  dataPlanejada         DateTime               @map("data_planejada")
  dataPrevistaConclusao DateTime?              @map("data_prevista_conclusao")
  dataInicioExecucao    DateTime?              @map("data_inicio_execucao")
  dataConclusao         DateTime?              @map("data_conclusao")
  dataCancelamento      DateTime?              @map("data_cancelamento")
  criadoEm              DateTime               @default(now()) @map("criado_em")
  atualizadoEm          DateTime               @updatedAt @map("atualizado_em")

  tenant         Tenant         @relation(fields: [tenantId], references: [id])
  contrato       Contrato       @relation(fields: [contratoId], references: [id])
  empreendimento Empreendimento @relation(fields: [empreendimentoId], references: [id])
  responsavel    Usuario?       @relation("OSResponsavel", fields: [responsavelId], references: [id])
  criadoPor      Usuario        @relation("OSCriador", fields: [criadoPorId], references: [id])
  atualizadoPor  Usuario?       @relation("OSAtualizador", fields: [atualizadoPorId], references: [id])

  @@unique([tenantId, numero])
  @@index([tenantId, status, dataPlanejada])
  @@index([tenantId, contratoId, status])
  @@index([tenantId, responsavelId, status])
  @@index([tenantId, empreendimentoId, status])
  @@index([tenantId, prioridade, status])
  @@map("ordens_servico")
}
```

### 3.3 Relacoes adicionadas

- Em `Tenant`: `ordensServico OrdemServico[]`
- Em `Contrato`: `ordensServico OrdemServico[]`
- Em `Empreendimento`: `ordensServico OrdemServico[]`
- Em `Usuario`: `osResponsavel OrdemServico[] @relation("OSResponsavel")`, `osCriadas OrdemServico[] @relation("OSCriador")`, `osAtualizadas OrdemServico[] @relation("OSAtualizador")`

### 3.4 Decisoes

- **OS != Tarefa**: OS e instrumento contratual (deriva de Contrato), Tarefa e atividade do workflow regulatorio (deriva de Processo/Condicionante). Coexistem.
- **Numero por tenant**: padrao `OS-{ano}-{8-hex}`.
- **`empreendimentoId` obrigatorio**: OS sempre acontece em um endereco fisico. Herdado do Contrato no momento da criacao.
- **`responsavelId` opcional**: criacao pode ser sem responsavel; atribuicao acontece em PATCH posterior.
- **`tipo` enum** (sem texto livre): garante categorizacao operacional consistente.

## 4. Service

`apps/api/src/modules/operacao/ordens-servico.service.ts` com `OrdensServicoService`:

- `criar(input)`: valida que o contrato existe e esta em status `ATIVO` ou `SUSPENSO`. Herda `empreendimentoId` do contrato. Gera numero `OS-{ano}-{8-hex}`. Status inicial: `PLANEJADA`.
- `listar(input)`: filtros (status, prioridade, contratoId, empreendimentoId, responsavelId, tipo, apenasMinhas). Pagina e ordena por `dataPlanejada ASC` + `criadoEm DESC`.
- `buscarPorId(input)`: detalhe com relacoes (contrato.numero, empreendimento.nome, responsavel.nome).
- `atualizar(input)`: STATUS_TRANSITIONS abaixo. Preenche timestamps.

```
PLANEJADA            -> EM_EXECUCAO, CANCELADA
EM_EXECUCAO          -> AGUARDANDO_REVISAO, CONCLUIDA, CANCELADA
AGUARDANDO_REVISAO   -> EM_EXECUCAO, CONCLUIDA, CANCELADA
CONCLUIDA            -> (terminal)
CANCELADA            -> (terminal)
```

- `atribuirResponsavel(input)`: atalho para PATCH `{ responsavelId }`. Valida usuario do mesmo tenant.
- `kpis(tenantId)`: agrega `{ totalAbertas, totalEmExecucao, totalCriticas, totalConcluidasMes }`.
- Auditoria em criar / atualizar.

## 5. Endpoints REST

Prefixo `/api/v1/operacao/ordens-servico`:

| Metodo | Path | Perfil |
|---|---|---|
| POST   | `/`               | COORDENADOR, ADMIN_TENANT, SUPER_ADMIN |
| GET    | `/`               | EXECUTIVO, COORDENADOR, ANALISTA, ANALISTA_CAMPO, ADMIN_TENANT, SUPER_ADMIN |
| GET    | `/kpis`           | mesmo da listagem |
| GET    | `/:id`            | mesmo da listagem |
| PATCH  | `/:id`            | COORDENADOR, ANALISTA, ANALISTA_CAMPO, ADMIN_TENANT, SUPER_ADMIN |

Detalhe: `ANALISTA_CAMPO` pode atualizar (executar checklist, marcar inicio/conclusao) mas nao criar.

## 6. Frontend

### 6.1 Tela `/ordens-servico` (sistema interno)

Reescrita completa de [apps/web/src/app/(app)/ordens-servico/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/ordens-servico/page.tsx>):

- Remover imports de `gestao-interna/data`.
- Buscar `/operacao/ordens-servico?limit=50` + `/operacao/ordens-servico/kpis`.
- Tabela com colunas: Numero, Cliente/posto, Tipo, Responsavel, Status, Prioridade, Data planejada.
- KPIs reais: Abertas, Em execucao, Criticas, Concluidas neste mes.
- Manter callout "proxima evolucao" apontando para Onda 3.11 (Entregaveis).

### 6.2 Tela `/equipe/os` (campo)

Reescrita completa de [apps/web/src/app/equipe/(equipe)/os/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/equipe/(equipe)/os/page.tsx>):

- Remover array `ROWS` hardcoded.
- Buscar `/operacao/ordens-servico?apenasMinhas=true&status=PLANEJADA,EM_EXECUCAO,AGUARDANDO_REVISAO&limit=50` (filtra por responsavel autenticado).
- Tabela com UF (sigla do empreendimento), cliente, numero, tipo, prazo, status.
- Estado vazio: "Nenhuma OS atribuida no momento".
- Botao "Abrir" leva para `/equipe/os/[id]` (rota detalhe nao criada nesta onda - vai para hint).

> **Nota**: detalhe individual da OS em `/equipe/os/[id]` fica fora desta onda. Botao temporario pode ir para o detalhe do contrato ou simplesmente para `/equipe/checklists` enquanto a tela nao existe.

## 7. Schemas Zod

`apps/api/src/modules/operacao/ordens-servico.schemas.ts`:

- `statusOrdemServicoSchema`, `prioridadeOrdemServicoSchema`, `tipoOrdemServicoSchema`
- `criarOrdemServicoSchema` (contratoId, tipo, titulo, escopo, dataPlanejada, prioridade default MEDIA)
- `atualizarOrdemServicoSchema` (status, responsavelId, prioridade, observacoes, motivoCancelamento, datas)
- `filtrosOrdemServicoSchema` (status, prioridade, tipo, contratoId, empreendimentoId, responsavelId, apenasMinhas)
- `ordemServicoResumoSchema`, `ordemServicoDetalheSchema`, `ordemServicoKpisSchema`

## 8. Testes

`apps/api/src/modules/operacao/__tests__/ordens-servico.routes.test.ts`:

1. Bloqueia listagem sem JWT (401).
2. Cria OS a partir de contrato ATIVO (201).
3. Bloqueia criacao com contrato em RASCUNHO (409).
4. Lista OSs do tenant.
5. Atualiza status com transicao valida PLANEJADA -> EM_EXECUCAO (200) + checa `dataInicioExecucao`.
6. Recusa transicao invalida (CONCLUIDA -> EM_EXECUCAO -> 403).
7. KPIs retornam contagens.
8. `apenasMinhas=true` filtra por responsavel autenticado.

## 9. Migration

`apps/api/prisma/migrations/<timestamp>_add_ordens_servico/migration.sql`:

- 3 `CREATE TYPE`
- `CREATE TABLE ordens_servico`
- 1 unique + 5 indices secundarios
- 6 FKs

Sem alterar tabelas existentes.

## 10. Riscos e travas

| Risco | Mitigacao |
|---|---|
| Confusao com `Tarefa` | Documentar diferenca no service header e no relatorio |
| Numero duplicado | Pattern `OS-{ano}-{8-hex}` + unique constraint |
| Tentar criar OS de contrato CANCELADO | Service rejeita com 409 antes do insert |
| Quebrar testes existentes | Nenhum teste atual depende de OS; isolado |
| Migration romper banco | Migration so adiciona, risco minimo |

## 11. Criterios de aceite

- [ ] Migration aplica em dev sem erros.
- [ ] `pnpm typecheck` passa em `apps/api` e `apps/web`.
- [ ] Testes novos passam (`pnpm test ordens-servico`).
- [ ] Testes pre-existentes continuam verdes (44+ atuais).
- [ ] `POST /operacao/ordens-servico` cria OS a partir de contrato.
- [ ] `GET /operacao/ordens-servico` autentica e lista.
- [ ] `GET /operacao/ordens-servico/kpis` retorna agregacoes.
- [ ] Tela `/ordens-servico` (sistema) carrega dados reais.
- [ ] Tela `/equipe/os` carrega OSs do responsavel autenticado.
- [ ] Mock `ROWS` removido de `/equipe/os`.
- [ ] Mock `servicosCatalogo` removido de `/ordens-servico`.
- [ ] Relatorio de fechamento gerado como doc 80.

## 12. Itens fora de escopo

- Detalhe individual da OS em `/operacao/ordens-servico/[id]` e `/equipe/os/[id]`.
- Geracao de PDF da OS.
- Anexar evidencias diretamente na OS (hoje vai pelo modulo de tarefas/evidencias).
- Geracao de tarefas automaticas a partir de OS.
- Geracao de entregaveis (Onda 3.11).
- Cobranca/faturamento (Onda 3.12).

## 13. Aderencia ao Plano Mestre

- Item "Ordens de servico" em [02_PLANO_MESTRE_DE_CONSOLIDACAO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/02_PLANO_MESTRE_DE_CONSOLIDACAO.md>) secao 4: "Hibrido -> Desenhar OrdemServico a partir do handoff".
- Sprint 6 do mesmo doc: "Criar entidades financeiras e OrdemServico / Entregavel no Prisma".
- Multi-tenant respeitado.
- Tela so existe apos API existir (principio 8).
- Banco alterado apenas com plano governado (principio 7).
