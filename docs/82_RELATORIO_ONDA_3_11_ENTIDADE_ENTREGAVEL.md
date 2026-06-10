# 82. Relatorio da Onda 3.11 - Entidade Entregavel

## 1. Objetivo

Criar a entidade `Entregavel` vinculada a `OrdemServico`, com geracao assincrona de PDF via worker BullMQ, substituindo o mock da tela `/entregaveis`.

## 2. Entregas

### Banco de dados
- 2 novos enums: `StatusEntregavel`, `TipoEntregavel`.
- Novo `model Entregavel` com 20 campos, 1 unique, 4 indices, 6 FKs.
- Migration `20260527120000_add_entregaveis`.
- Relacoes reversas em Tenant, OrdemServico, Contrato, Empreendimento, Usuario.

### Backend (apps/api)
- `entregaveis.types.ts`, `entregaveis.schemas.ts`, `entregaveis.service.ts`, `entregaveis.routes.ts`.
- Service: `criar` (valida OS, herda contrato/empreendimento, gera numero ENT-{ano}-{8hex}, enfileira job), `listar` (filtros + JOINs), `buscarPorId`, `cancelar` (bloqueia se GERANDO/DISPONIVEL), `kpis`.
- 5 endpoints em `/api/v1/operacao/entregaveis` (POST, GET, GET/kpis, GET/:id, PATCH/:id/cancelar).
- Fila `ENTREGAVEIS` adicionada em `infra/queue/bullmq.ts` com tipo `EntregavelJobData`.

### Worker (apps/worker)
- Novo `processors/entregavel.processor.ts`:
  - Consome fila `entregaveis`.
  - Atualiza status PENDENTE -> GERANDO.
  - Gera PDF com PDFKit (titulo, empreendimento, OS, escopo, descricao).
  - Upload S3 em `entregaveis/{tenantId}/{id}/{nomeArquivo}`.
  - Atualiza status -> DISPONIVEL + s3Key + tamanhoBytes + geradoEm.
  - Em caso de erro: status -> ERRO + erroMsg.
- Worker registrado em `worker.ts` (import + instancia + graceful shutdown + error monitoring).

### Frontend
- Tela `/entregaveis` reescrita: Server Component com dados reais.
- KPIs: Pendentes, Disponiveis, Total.
- Tabela com colunas: Numero, Titulo/Cliente, Tipo, Status (badge animado pra GERANDO), Arquivo (nome + tamanho), Data.
- Mock `statusTone` de `gestao-interna/data` removido.
- Callout "proxima evolucao" aponta pra Onda 3.12 (Financeiro).

### Testes
- 6 cenarios em `entregaveis.routes.test.ts`: sem JWT, criar a partir de OS, cancelar PENDENTE, listar, KPIs, 404.
- Suite completa: **66/66 verdes**, zero regressao.

### Documentos
- `docs/81_PLANO_ONDA_3_11_ENTIDADE_ENTREGAVEL.md`
- `docs/82_RELATORIO_ONDA_3_11_ENTIDADE_ENTREGAVEL.md`

## 3. Fluxo completo operante no backend

```
Proposta APROVADA -> Handoff -> Contrato ATIVO -> OS -> Entregavel (PDF gerado pelo worker)
```

## 4. Proximo bloco: Onda 3.12 — Financeiro (Receita/Custo/Margem)
