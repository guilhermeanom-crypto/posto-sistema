# Camada Transversal C7 — Audit Trail / Trilha de Auditoria

> Já existe `AuditLog` (imutável, sem FKs — boa decisão). Faltam: visualização, exportação, integridade verificável.

## Decisão transversal nº7
AuditLog continua como log imutável append-only. Adicionamos:
1. **Visualizador unificado** (timeline por entidade ou por usuário).
2. **Exportador certificado** (JSON + PDF com hash de integridade).
3. **Encadeamento de hash** (blockchain-like — cada registro tem hash do anterior — opcional v2).

## Padrões registrados (mínimo obrigatório)
- Toda mutação de entidade regulatória (CRUD).
- Toda transição de processo (Workflow Engine).
- Todo upload de documento.
- Todo acesso a dado sensível (LGPD — `documento confidencial visualizado por X`).
- Toda mudança de configuração (catálogos, regras, papéis).
- Todo login + logout + falhas de autenticação.
- Toda execução de checklist, ack de alerta, cumprimento de prazo.

## Modelo (evolução)

```prisma
// AuditLog existente — adicionar:
//   assinaturaPrev String?           // hash do registro anterior
//   assinaturaAtual String           // hash deste registro
//   canal String                      // WEB | API | WORKER | SISTEMA

model ExportacaoAuditoria {
  id String @id
  empreendimentoId String?
  solicitadaPorId String
  tipoExportacao String              // PERIODO | ENTIDADE | USUARIO | DOSSIE_POSTO
  filtros Json
  arquivoS3 String?
  hashIntegridade String
  geradaEm DateTime
  expiraEm DateTime
}
```

## Visualizações
1. **Timeline por entidade** (em qualquer detalhe — licença, ativo, processo, pessoa): aba "Auditoria" com cronologia.
2. **Timeline por usuário**: o que ele fez (RH/auditoria interna).
3. **Painel de auditoria** (`/auditoria` — só AUDITOR/ADMIN): busca avançada, exportação.
4. **Dossiê de empreendimento** (PDF): histórico completo de N meses formatado para fiscalização.

## Detecção de padrões anômalos (v2)
- Acessos massivos a dados confidenciais.
- Mudanças em horários fora do padrão.
- Cancelamentos repetidos por mesmo usuário.
- Transições "rápidas demais" em processos.

## Regras
- AuditLog **nunca** é editado nem deletado (somente após retenção legal — 5 anos).
- Hash encadeado garante detecção de manipulação.
- Exportação certificada inclui hash de cada registro + hash global.

## Casos de borda
1. Volume alto (rede com 50 postos × 12 meses × eventos): particionamento por mês.
2. Usuário deletado: mantém `usuarioNome` + `usuarioEmail` no log (já modelado corretamente).
3. Exportação grande (anos de dados): job em background com download por link expirável.

## Perguntas abertas
1. Hash encadeado v1 ou v2?
2. Detecção de anomalias por ML — v2?
3. Retenção legal — 5 anos é seguro? Algumas auditorias pedem 10.
