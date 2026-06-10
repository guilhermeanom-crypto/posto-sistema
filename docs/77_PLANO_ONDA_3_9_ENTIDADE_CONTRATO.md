# 77. Plano da Onda 3.9 - Entidade Contrato

## 1. Objetivo desta onda

Criar a entidade `Contrato` como destino natural do fluxo `Proposta APROVADA -> HandoffComercial -> Contrato`, substituindo o mock atual da tela `/contratos` por dado real persistido.

Esta e a primeira onda apos o fechamento da Onda 3.8 ([76_RELATORIO_ONDA_3_8_LISTAGEM_HANDOFFS.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/76_RELATORIO_ONDA_3_8_LISTAGEM_HANDOFFS.md>)) e abre o caminho para Ordem de Servico (Onda 3.10) e demais entidades operacionais.

## 2. Diagnostico do estado atual

### 2.1 Mock na UI

A tela [apps/web/src/app/(app)/contratos/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/contratos/page.tsx>) hoje:

- Le `empreendimentos` reais via `api.get('/empreendimentos?limit=100')` apenas para listar postos.
- Importa `servicosCatalogo` e `moeda` do mock `apps/web/src/app/(app)/gestao-interna/data.ts`.
- Calcula `mrr = contratosAtivos.length * recorrente.precoBase` (chute baseado em quantidade de postos x preco fixo do servico "gestao-continuada").
- Mostra "ativos" como se cada posto ativo fosse um contrato.
- Tem aviso na propria tela: *"Proxima evolucao: criar entidade real de contrato com vigencia, reajuste, aditivos e servicos inclusos."*

### 2.2 Backend atual

- `apps/api/src/modules/comercial/` ja tem `propostas.*` e `catalogo.*` consolidados.
- `HandoffComercial` ja tem status final `CONCLUIDO` (em `STATUS_HANDOFF_COMERCIAL`), mas nao gera contrato.
- Nao existe entidade `Contrato` no Prisma.
- Nao existe `modules/comercial/contratos.*` no backend.

### 2.3 Fluxo logico esperado

```
PropostaComercial.status = APROVADA
        |
        v
HandoffComercial criado (Onda 3.x ja entregue)
        |
   coordenacao opera o handoff (triagem, planejamento, execucao)
        |
        v
Contrato emitido (NESTA ONDA)
   - vincula ao handoff
   - copia snapshot dos itens da proposta
   - estabelece vigencia
   - serve de origem para futuras Ordens de Servico (Onda 3.10)
```

## 3. Modelagem Prisma proposta

### 3.1 Enum novo

```prisma
enum StatusContrato {
  RASCUNHO
  ATIVO
  SUSPENSO
  ENCERRADO
  CANCELADO
}
```

### 3.2 Model `Contrato`

```prisma
model Contrato {
  id                     String          @id @default(uuid())
  tenantId               String          @map("tenant_id")
  numero                 String
  status                 StatusContrato  @default(RASCUNHO)
  handoffComercialId     String          @map("handoff_comercial_id")
  propostaComercialId    String          @map("proposta_comercial_id")
  empreendimentoId       String?         @map("empreendimento_id")
  criadoPorId            String          @map("criado_por_id")
  atualizadoPorId        String?         @map("atualizado_por_id")
  objeto                 String          @db.Text
  observacoesContratuais String?         @map("observacoes_contratuais") @db.Text
  observacoesInternas    String?         @map("observacoes_internas") @db.Text
  dataInicioVigencia     DateTime        @map("data_inicio_vigencia") @db.Date
  dataFimVigencia        DateTime?       @map("data_fim_vigencia") @db.Date
  diaVencimento          Int             @map("dia_vencimento")
  valorMensal            Decimal         @map("valor_mensal") @db.Decimal(12, 2)
  valorTotalEstimado     Decimal?        @map("valor_total_estimado") @db.Decimal(14, 2)
  moeda                  String          @default("BRL")
  itensSnapshot          Json            @map("itens_snapshot")
  ativadoEm              DateTime?       @map("ativado_em")
  suspensoEm             DateTime?       @map("suspenso_em")
  encerradoEm            DateTime?       @map("encerrado_em")
  canceladoEm            DateTime?       @map("cancelado_em")
  motivoEncerramento     String?         @map("motivo_encerramento") @db.Text
  criadoEm               DateTime        @default(now()) @map("criado_em")
  atualizadoEm           DateTime        @updatedAt @map("atualizado_em")

  tenant            Tenant            @relation(fields: [tenantId], references: [id])
  handoffComercial  HandoffComercial  @relation(fields: [handoffComercialId], references: [id])
  propostaComercial PropostaComercial @relation(fields: [propostaComercialId], references: [id])
  empreendimento    Empreendimento?   @relation(fields: [empreendimentoId], references: [id])
  criadoPor         Usuario           @relation("ContratoCriador", fields: [criadoPorId], references: [id])
  atualizadoPor     Usuario?          @relation("ContratoAtualizador", fields: [atualizadoPorId], references: [id])

  @@unique([tenantId, numero])
  @@index([tenantId, status, criadoEm(sort: Desc)])
  @@index([tenantId, handoffComercialId])
  @@index([tenantId, empreendimentoId, status])
  @@index([tenantId, dataInicioVigencia])
  @@map("contratos")
}
```

### 3.3 Relacoes adicionadas

Em `Tenant`: `contratos Contrato[]`
Em `HandoffComercial`: `contratos Contrato[]` (1:N - permite versionamento se houver renegociacao futura, mas o servico forca apenas 1 contrato ATIVO por handoff)
Em `PropostaComercial`: `contratos Contrato[]`
Em `Empreendimento`: `contratos Contrato[]`
Em `Usuario`: `contratosCriados Contrato[] @relation("ContratoCriador")` e `contratosAtualizados Contrato[] @relation("ContratoAtualizador")`

### 3.4 Decisoes de modelagem

- **Numero por tenant** (`@@unique [tenantId, numero]`): segue padrao de `PropostaComercial` e permite reset por tenant.
- **`itensSnapshot Json`**: copia "congelada" dos itens da proposta no momento da emissao do contrato, sem foreign key direta para `ItemProposta` (porque a proposta pode ser arquivada/editada depois). Mesmo padrao usado em `HandoffComercial.servicosResumo` e `origemSnapshotSaneado`.
- **`valorMensal Decimal(12,2)`**: recorrencia mensal (subscricao). Calculado pelo service a partir dos itens recorrentes da proposta.
- **`valorTotalEstimado Decimal(14,2)?`**: agregado de itens nao-recorrentes (one-shot). Opcional.
- **`diaVencimento Int`**: dia do mes do vencimento da fatura recorrente (1..28 idealmente, validado no Zod).
- **Vigencia em `Date` (sem hora)**: contrato e instrumento por dia, nao por instante.
- **`dataFimVigencia` opcional**: contratos sem prazo determinado (continuos).
- **Multi-tenant**: `tenantId` obrigatorio + todos os indices comecam com `tenantId`.

## 4. Servico

`apps/api/src/modules/comercial/contratos.service.ts` com classe `ContratosService`:

- `criar(input)`: valida que o handoff existe, pertence ao tenant, e que nao ha contrato ATIVO para ele. Copia snapshot dos itens da proposta. Gera numero (`CT-<ano>-<seq>` por tenant). Status inicial: `RASCUNHO`.
- `listar(input)`: filtros paginados (status, empreendimentoId, handoffComercialId, busca por numero).
- `buscarPorId(input)`: detalhe com relacoes (handoff, proposta, empreendimento, criadoPor).
- `atualizar(input)`: somente campos seguros (status, observacoes, motivoEncerramento, dataFimVigencia). Status segue STATUS_TRANSITIONS:

```
RASCUNHO  -> ATIVO, CANCELADO
ATIVO     -> SUSPENSO, ENCERRADO, CANCELADO
SUSPENSO  -> ATIVO, ENCERRADO, CANCELADO
ENCERRADO -> (terminal)
CANCELADO -> (terminal)
```

- `agregarKPIs(tenantId)`: agregacao para a tela `/contratos` (total ativos, MRR somando `valorMensal` dos ATIVOS, total contratos cadastrados).

## 5. Endpoints REST

Prefixo `/api/v1/comercial/contratos`:

| Metodo | Path | Perfil |
|---|---|---|
| POST   | `/`            | COORDENADOR, ADMIN_TENANT, SUPER_ADMIN |
| GET    | `/`            | EXECUTIVO, COORDENADOR, ANALISTA, ADMIN_TENANT, SUPER_ADMIN |
| GET    | `/kpis`        | mesmo da listagem |
| GET    | `/:id`         | mesmo da listagem |
| PATCH  | `/:id`         | COORDENADOR, ADMIN_TENANT, SUPER_ADMIN |

Auditoria: cada criacao/atualizacao registrada via `registrarAuditoria` (padrao ja usado em handoffs).

## 6. Schemas Zod

`apps/api/src/modules/comercial/contratos.schemas.ts`:

- `statusContratoSchema`
- `criarContratoSchema` (handoffComercialId obrigatorio, vigencia, diaVencimento 1..28, observacoes opcionais)
- `atualizarContratoSchema` (status, observacoes, motivoEncerramento, dataFimVigencia)
- `filtrosContratoSchema` (status, empreendimentoId, handoffComercialId, busca, page, limit)
- `contratoResumoSchema` (listagem)
- `contratoDetalheSchema` (detalhe)
- `contratoKpisSchema` (`{ totalAtivos, mrr, totalCadastrados }`)
- `contratoItemSnapshotSchema` (formato dos itens congelados)

## 7. Frontend

### 7.1 Proxy Next

Criar `apps/web/src/app/api/comercial/contratos/route.ts` com:

- `GET` autenticado, repassando querystring
- Sanitizacao de resposta antes de devolver ao cliente

Criar `apps/web/src/app/api/comercial/contratos/[id]/route.ts` (GET) e `apps/web/src/app/api/comercial/contratos/kpis/route.ts` (GET).

### 7.2 Tela `/contratos` desmockada

Reescrita de [apps/web/src/app/(app)/contratos/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(app)/contratos/page.tsx>):

- Remover imports de `gestao-interna/data` (servicosCatalogo, moeda).
- Reutilizar formatador `Intl.NumberFormat` local para BRL.
- Carregar contratos reais via `api.get('/comercial/contratos?limit=50')`.
- Carregar KPIs via `api.get('/comercial/contratos/kpis')`.
- Listar contratos com colunas: Numero | Cliente/Posto | Status | Vigencia | Valor mensal.
- KPIs reais: Ativos, MRR, Total cadastrados.
- Quando `contratosAtivos.length === 0`, manter estado vazio descritivo.
- Manter callout "proxima evolucao" como aviso temporario apontando para a Onda 3.10 (OS).

## 8. Testes

`apps/api/src/modules/comercial/__tests__/contratos.routes.test.ts`:

- Cria handoff valido, emite contrato, valida payload.
- Bloqueia criacao de segundo contrato ATIVO para mesmo handoff.
- Lista contratos do tenant.
- Atualiza status com transicao valida.
- Recusa transicao invalida.
- KPIs retornam contagem e MRR corretos.

Meta: 6 cenarios verdes, sem mock de banco (testes integration com Postgres do docker, padrao ja em uso).

## 9. Migration

`apps/api/prisma/migrations/<timestamp>_add_contratos/migration.sql`:

- `CREATE TYPE "StatusContrato"`
- `CREATE TABLE contratos`
- `CREATE UNIQUE INDEX` para `(tenant_id, numero)`
- 4 indices secundarios
- 6 FKs

Sem alterar nenhuma tabela existente.

## 10. Riscos e travas

| Risco | Mitigacao |
|---|---|
| Migration romper banco demo | Migration so adiciona (sem ALTER em tabelas existentes), risco minimo |
| Numero duplicado por tenant | Constraint unique + service gera dentro de transacao com lock |
| Snapshot de itens divergir | Snapshot copiado uma vez na emissao, congelado, nunca recalculado |
| Quebrar testes existentes | Nenhum teste atual depende de Contrato; isolado |
| Permitir 2 contratos ATIVOs para um handoff | Service valida antes do insert com `findFirst({ status: 'ATIVO', handoffComercialId })` |

## 11. Criterios de aceite

- [ ] Migration aplica em dev sem erros.
- [ ] `pnpm typecheck` passa em `apps/api`.
- [ ] `pnpm typecheck` passa em `apps/web`.
- [ ] Testes novos passam (`pnpm test contratos`).
- [ ] Testes pre-existentes continuam verdes (handoffs, propostas).
- [ ] Endpoint `GET /comercial/contratos` autentica e devolve lista.
- [ ] Endpoint `POST /comercial/contratos` cria a partir de handoff.
- [ ] Endpoint `GET /comercial/contratos/kpis` retorna agregacao.
- [ ] Tela `/contratos` carrega dados reais, sem importacoes de mock.
- [ ] Relatorio de fechamento gerado como doc 78.

## 12. Itens fora de escopo (Onda 3.9.1 ou posterior, se demanda real surgir)

- Aceite digital / assinatura.
- Geracao de PDF do contrato.
- Aditivos contratuais.
- Reajuste indexado (IPCA, IGPM).
- Workflow de envio para o cliente.
- Tela de edicao em formulario completo (so atualizacao via PATCH JSON nesta onda).
- Historico de versoes.
- Integracao com financeiro (Onda 3.12).

## 13. Aderencia ao Plano Mestre

- Item "Contratos" em [02_PLANO_MESTRE_DE_CONSOLIDACAO.md](</home/guilherme/Projetos VS CODE/Posto/sistema/docs/02_PLANO_MESTRE_DE_CONSOLIDACAO.md>) secao 4 (Mapa de lacunas): "Mockado/Inexistente -> Criar entidade e refatorar".
- Sprint 5 do mesmo doc: "Criar entidades Prisma (Lead, HandoffOperacional, Contrato, Proposta) -> Executar db:migrate".
- Multi-tenant respeitado.
- Tela so existe apos API existir (principio 8).
- Banco alterado apenas com plano governado (principio 7).
