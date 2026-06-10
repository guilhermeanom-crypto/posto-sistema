# 81. Plano da Onda 3.11 - Entidade Entregavel

## 1. Objetivo

Criar a entidade `Entregavel` vinculada a `OrdemServico`, com geracao assincrona de PDF via worker BullMQ, substituindo o mock da tela `/entregaveis` por dado real.

## 2. Estado atual

### Mock em `/entregaveis`
Mistura documentos + relatorios gerados chamando ambos de "entregaveis". Importa `statusTone` de `gestao-interna/data`.

### Worker existente
`apps/worker/src/processors/relatorio.processor.ts` ja gera PDF/Excel com PDFKit e faz upload S3 via `PutObjectCommand`. Padrao reutilizavel.

### Fila existente
`apps/api/src/infra/queue/bullmq.ts` centraliza filas tipadas (email, alertas, compliance, scheduler). Adicionarei fila `ENTREGAVEIS`.

## 3. Modelagem Prisma

### Enum
```
enum StatusEntregavel { PENDENTE, GERANDO, DISPONIVEL, ERRO, CANCELADO }
enum TipoEntregavel { LAUDO, RELATORIO, PROTOCOLO, CERTIFICADO, ATA, EVIDENCIA, OUTRO }
```

### Model Entregavel
- id, tenantId, numero (`ENT-{ano}-{8hex}`)
- status (StatusEntregavel, default PENDENTE)
- tipo (TipoEntregavel)
- ordemServicoId (FK obrigatorio)
- contratoId (FK opcional, copy da OS)
- empreendimentoId (FK obrigatorio, copy da OS)
- criadoPorId, atualizadoPorId
- titulo, descricao
- s3Key (string? — preenchido quando PDF gerado)
- nomeArquivo (string? — nome legivel do arquivo)
- tamanhoBytes (Int?)
- erroMsg (string? — se geracao falhar)
- geradoEm (DateTime?)
- canceladoEm (DateTime?)
- criadoEm, atualizadoEm

Relacoes: Tenant, OrdemServico, Contrato?, Empreendimento, Usuario (criador + atualizador).

## 4. Service
`apps/api/src/modules/operacao/entregaveis.service.ts`:
- `criar`: valida OS existente, herda contrato/empreendimento, gera numero, status PENDENTE, enfileira job `gerar-entregavel`.
- `listar`: filtros (status, tipo, ordemServicoId, contratoId, empreendimentoId, busca).
- `buscarPorId`: detalhe.
- `urlDownload`: gera presigned URL do S3 se status = DISPONIVEL.
- `cancelar`: muda status pra CANCELADO (se nao estiver GERANDO).
- `kpis`: totalPendentes, totalDisponiveis, totalCadastrados.

## 5. Worker
Novo processor `apps/worker/src/processors/entregavel.processor.ts`:
- Consome fila `entregaveis`.
- Atualiza status pra GERANDO.
- Gera PDF basico com PDFKit (titulo, escopo da OS, dados do empreendimento).
- Upload S3 com key `entregaveis/{tenantId}/{id}/{nomeArquivo}`.
- Atualiza status pra DISPONIVEL + preenche s3Key, nomeArquivo, tamanhoBytes, geradoEm.
- Em caso de erro: status ERRO + erroMsg.

## 6. Endpoints
Prefixo `/api/v1/operacao/entregaveis`:
- POST `/` (COORDENADOR+)
- GET `/` (ANALISTA+)
- GET `/kpis` (ANALISTA+)
- GET `/:id` (ANALISTA+)
- GET `/:id/download` (ANALISTA+, retorna presigned URL)
- PATCH `/:id` (COORDENADOR+, apenas cancelar)

## 7. Frontend
Reescrever `/entregaveis` removendo mock. Server Component com dados reais + KPIs + badge de status com indicacao visual "Gerando..." / "Disponivel" / "Erro".

## 8. Testes
6 cenarios: sem JWT (401), criar entregavel a partir de OS (201), listar (200), cancelar (200), bloquear download de PENDENTE (409), KPIs (200).

## 9. Fora de escopo
- Visualizador inline de PDF.
- Aceite formal do cliente sobre o entregavel.
- Multiplos formatos (Excel) — PDF primeiro.
- Template customizavel por tipo.
