# Portal do Cliente — Entrega Demo (Documentos Solicitados)

**Data:** 2026-05-14
**Branch:** HEAD
**Escopo:** Fatia vertical mínima do Portal do Cliente, focada em documentos solicitados agrupados por momento do processo. Implementação **aditiva** sobre o portal oficial já existente — sem refatorar S3/versionamento.

---

## 1. O que foi implementado

### Resumo executivo
- Adapta o `/portal/documentos` existente (oficial) para suportar o conceito de **momento do processo**: antes / durante / após emissão.
- O cliente entra com email/senha, vê todos os documentos solicitados agrupados pelos 3 momentos, anexa arquivo, escreve uma justificativa/observação e clica em enviar. O status muda de **PENDENTE** → **EM_ANÁLISE** e o arquivo enviado aparece imediatamente na tela.
- Toda a infra de upload (S3/MinIO presigned URLs + hash SHA-256 + versionamento) é reaproveitada — não há paralelo nem rota nova de upload.

### Mudanças concretas
- **Schema Prisma**: 3 colunas novas (nullable, aditivas) em `tipos_documento` — `codigo`, `momento` (enum), `descricao_cliente` — + enum `MomentoDocumento`. Migration: [20260514180000_add_momento_codigo_descricaocliente_tipodocumento](apps/api/prisma/migrations/20260514180000_add_momento_codigo_descricaocliente_tipodocumento/migration.sql)
- **Seed JSON** em [apps/api/src/modules/portal/documentos.portal.seed.json](apps/api/src/modules/portal/documentos.portal.seed.json) — 14 documentos da lista demo organizados pelos 3 momentos.
- **Seed script idempotente** [apps/api/prisma/seed-portal-demo.ts](apps/api/prisma/seed-portal-demo.ts) — cria/atualiza tipos de documento, usuário representante demo e os 14 Documentos pendentes ligados ao primeiro empreendimento do tenant `demo`.
- **Auth fix** em [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts) — login regular agora popula `empreendimentoIds` no JWT para `REPRESENTANTE_POSTO` (antes só para ANALISTA/ANALISTA_CAMPO). Sem isso, todas as chamadas `/portal/*` recebiam 401.
- **API portal** em [apps/api/src/modules/portal/portal.routes.ts](apps/api/src/modules/portal/portal.routes.ts):
  - `GET /portal/documentos`: retorna `momento`, `codigo` e `descricaoCliente` no `tipoDocumento`; adiciona campo derivado `ultimaVersao` (último envio, mesmo se ainda não aprovado pelo analista — antes só `versaoAtual` que é null até aprovação).
  - `POST /portal/documentos/:id/upload/confirmar`: corrigida serialização do `BigInt` (`arquivoBytes`) que estava quebrando a resposta com `INTERNAL_SERVER_ERROR`.
- **Frontend portal** [apps/web/src/app/portal/(portal)/documentos/page.tsx](apps/web/src/app/portal/(portal)/documentos/page.tsx) — reescrito:
  - Hero card "Portal do Cliente" com subtítulo, nome do empreendimento e saudação.
  - Resumo com 4 tiles: Documentos solicitados / Pendentes / Enviados / Em análise.
  - Aviso "Ação necessária" quando há pendência.
  - 3 seções por momento (Antes do processo / Durante o processo / Após emissão / acompanhamento), cada uma com a descrição de contexto.
  - Seção extra "Outros documentos" para legado sem `momento` setado.
- **UploadCard** em [apps/web/src/app/portal/(portal)/documentos/upload-card.tsx](apps/web/src/app/portal/(portal)/documentos/upload-card.tsx):
  - Mostra `descricaoCliente` quando presente (texto seguro pro cliente).
  - Bloco "Último envio" mostra nome do arquivo e justificativa imediatamente após o upload.
  - Campo "Justificativa ou observação" rotulado explicitamente (era só placeholder antes).
  - Botão mais claro: "Anexar documento e enviar".
  - Sem mudança no protocolo S3 (continua presigned URL + PUT direto + confirm).

---

## 2. Rotas envolvidas

| Verbo | Rota | Estado | Observação |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | Reaproveitada | Agora popula `empreendimentoIds` para REPRESENTANTE_POSTO |
| GET  | `/api/v1/portal/documentos` | Estendida | Inclui `momento`, `codigo`, `descricaoCliente`, `ultimaVersao` |
| POST | `/api/v1/portal/documentos/:id/upload/solicitar` | Sem mudança | Solicita URL presignada (S3/MinIO) |
| PUT  | `<presigned-url>` | Sem mudança | Cliente envia direto ao storage |
| POST | `/api/v1/portal/documentos/:id/upload/confirmar` | Fix BigInt | Marca versão como ENVIADA + Documento → EM_ANALISE; recebe `observacoesEnvio` = justificativa |
| GET  | `/portal/documentos` (Next) | Reescrita | UI nova com hero + resumo + agrupamento por momento |
| POST | `/portal/login` (Server Action) | Sem mudança | Continua `email + senha` |

Sem rotas novas — a entrega só **estende** o que existe.

---

## 3. Arquivos alterados

```
apps/api/
├─ prisma/
│  ├─ schema.prisma                                            (+ enum MomentoDocumento, + 3 fields TipoDocumento)
│  ├─ migrations/20260514180000_add_momento_.../migration.sql  (NEW)
│  └─ seed-portal-demo.ts                                      (NEW)
├─ src/
│  ├─ modules/
│  │  ├─ auth/auth.service.ts                                  (REPRESENTANTE_POSTO → empreendimentoIds)
│  │  └─ portal/
│  │     ├─ portal.routes.ts                                   (GET response + fix BigInt)
│  │     └─ documentos.portal.seed.json                        (NEW — 14 docs)
apps/web/
└─ src/app/portal/(portal)/documentos/
   ├─ page.tsx                                                  (reescrita: hero + resumo + por momento)
   └─ upload-card.tsx                                           (descricaoCliente, último envio, labels)
docs/
└─ RELATORIO_PORTAL_CLIENTE_DEMO.md                              (este documento)
```

---

## 4. Como testar

### Pré-requisitos
- Containers Docker rodando: `posto_postgres`, `posto_redis`, `posto_minio`, `posto_mailhog`
- API (`pnpm --filter @repo/api dev` na porta 3001) e Web (`pnpm --filter @posto/web dev` na porta 3000)

### Subindo do zero
```bash
# 1. Migration (uma vez)
cd apps/api && pnpm prisma migrate deploy

# 2. Seed principal (se o banco estiver virgem) — opcional, só se ainda não rodou
pnpm prisma db seed

# 3. Seed do portal demo (idempotente, pode rodar sempre)
pnpm exec tsx prisma/seed-portal-demo.ts
```

### Fluxo de aceite (passo-a-passo)
1. Abrir http://localhost:3000/portal/login
2. E-mail: `representante@postodemo.com.br` · Senha: `Demo@1234`
3. Clicar em **Entrar no Portal** → vai para `/portal/documentos`
4. Conferir o hero "Portal do Cliente" + nome do empreendimento + 4 tiles (Documentos solicitados=14, Pendentes=14 no primeiro acesso, Enviados=0, Em análise=0).
5. Conferir 3 seções: "Antes do processo" (6 cards), "Durante o processo" (4 cards), "Após emissão / acompanhamento" (4 cards).
6. Em qualquer card pendente:
   - Escrever no campo "Justificativa ou observação": `Documento enviado para análise.`
   - Clicar em **Anexar documento e enviar** e selecionar qualquer arquivo PDF/JPG/PNG/DOCX (máx. 50 MB).
   - Esperar a barra de progresso terminar.
7. Recarregar a página → o card agora aparece com status **Em análise**, mostra o nome do arquivo enviado e a justificativa, e os contadores "Pendentes" e "Em análise" são atualizados.

### Validar no backend
- Banco (rápido):
  ```bash
  docker exec posto_postgres psql -U posto -d posto_dev \
    -c "SELECT d.nome, d.status, dv.arquivo_nome, dv.observacoes_envio \
        FROM documentos d \
        LEFT JOIN documento_versoes dv ON dv.documento_id = d.id \
        WHERE d.status = 'EM_ANALISE' ORDER BY dv.enviado_em DESC LIMIT 5;"
  ```
- API (curl):
  ```bash
  TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"representante@postodemo.com.br","senha":"Demo@1234"}' \
    http://localhost:3001/api/v1/auth/login | jq -r '.data.accessToken')
  curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:3001/api/v1/portal/documentos?limit=20" | jq '.data[] | select(.status=="EM_ANALISE") | {nome, arquivo: .ultimaVersao.arquivoNome, obs: .ultimaVersao.observacoesEnvio}'
  ```
- MinIO console: http://localhost:9001 (login: `posto_minio` / `posto_minio_secret`) → bucket `posto-documentos` → pasta `temporario/`.

---

## 5. Limitações conhecidas desta versão demo

1. **Aprovação técnica não foi alterada.** `Documento.versaoAtualId` continua sendo setado só quando o analista aprova (mantido o contrato oficial). Para o portal, o cliente vê o último envio via `ultimaVersao` (versão mais recente independente de aprovação).
2. **Upload continua S3/MinIO**, não pasta local. A spec original sugeria `uploads/portal-documentos/`, mas o portal oficial já tem fluxo S3 estável + presigned URL — manter o fluxo oficial era mais seguro do que paralelizar. (Trade-off discutido com o usuário antes da implementação.)
3. **Sem fluxo de aprovação no portal** — não existe UI no portal pro cliente ver "Aprovado por X em Y". O status oficial é mostrado, mas o analista hoje aprova pelo painel interno.
4. **Sem múltiplas versões visíveis** — o portal mostra só o último envio. Re-upload sobrescreve visualmente (versão antiga continua no banco como histórico).
5. **`camposPreenchimento` do JSON ainda não é interpretado.** A estrutura está pronta para evoluir (auto-preencher CNPJ, razão social, endereço a partir de `empresa`/`empreendimento`), mas a versão demo só usa `descricaoCliente`.
6. **Apenas 1 empreendimento demo é configurado** pelo seed (`Posto Demo Centro`, o primeiro do tenant). Se o representante tivesse acesso a múltiplos, a UI hoje mostraria os documentos de TODOS — falta o seletor.
7. **Sem auditoria visível no portal** — o cliente não vê histórico de mensagens trocadas com o analista a partir desta tela (existe a página `/portal/mensagens` separada, mas não está linkada ao documento).
8. **Schema** — `codigo` é opcional. Para garantir consistência futura, o ideal seria tornar `NOT NULL` em uma migration posterior, depois que todos os tipos legados forem catalogados.

---

## 6. Próximos passos para evoluir para versão completa

### P0 — destravar uso real
- Adicionar **suporte a múltiplos empreendimentos** quando o representante tem acesso a vários (drop-down no header).
- **Página de detalhe** ao clicar no card: timeline com todas as versões, motivo de rejeição em destaque, link para mensagens.
- **Aprovação/rejeição assistida** via portal: quando o analista rejeita, surge banner com motivo na home do portal.

### P1 — robustez
- **Validação anti-fraude** no upload: usar `camposPreenchimento` para extrair texto via OCR e verificar se o documento bate com `empresa.cnpj`/`empreendimento.endereco`.
- **Assinatura digital** para documentos que exigem (`exigeAssinatura` no `TipoDocumento`).
- **Notificação por e-mail/WhatsApp** quando há novo documento solicitado ou quando o analista rejeita o envio.

### P2 — automação
- **Evoluir `documentos.portal.seed.json`** para virar uma tabela `RequisitoDocumentoPortal` configurável por administrador (sem precisar de seed).
- **Workflow de checklist por momento** — usar `Condicionante` + `Tarefa` já existentes para gerar lembretes automáticos.
- **Dashboard analytics** — tempo médio entre solicitação → envio → aprovação, distribuição por tipo de documento, taxa de rejeição.

---

## 7. Riscos / pontos de atenção

- **Migration** já está aplicada localmente. Antes de rodar em produção, garantir backup do `tipos_documento` (mesmo sendo aditiva, é boa prática).
- **`empreendimentoIds` para REPRESENTANTE_POSTO** — mudança em `auth.service.ts` afeta TODA conta com esse perfil. Em produção, valide que todos os representantes existentes estão linkados via `empreendimentos_acesso` antes de deploy. Sem o vínculo, o token vem com `empreendimentoIds: []` e as rotas do portal retornam 401.
- **Não testado** com cliente que tem acesso a múltiplos empreendimentos (o JWT carrega array, mas a página atual só usa o primeiro).
- **JSON seed é um snapshot** — se alguém editar o JSON mas não rodar `seed-portal-demo.ts`, os tipos no banco ficam dessincronizados. Para evolução futura, considerar mover essa lista para o admin painel.
