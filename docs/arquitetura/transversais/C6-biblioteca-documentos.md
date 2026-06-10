# Camada Transversal C6 — Biblioteca de Documentos

## Decisão transversal nº6
Toda evidência da plataforma vira `Documento` (entidade existente, evoluir). Cada módulo aponta via FK ao invés de armazenar `chaveS3` próprio. Migração gradual.

## Modelo (evolução do existente)

```prisma
// Documento (existente) — adicionar:
//   sha256 String?
//   tamanhoBytes BigInt?
//   mimeType String?
//   paginas Int?
//   textoExtraido String?              // OCR + parsing PDF
//   metadadosOCR Json?
//   assinaturaDigital Json?            // certificado, hash, timestamp
//   classificacaoPrivacidade String    // PUBLICO | INTERNO | RESTRITO | CONFIDENCIAL
//   retidoAte DateTime? @db.Date
//   tagRedeNeural String[]
//   indexadoEm DateTime?

model BuscaDocumento {
  documentoId String @id
  empreendimentoId String?
  textoTSVector String                // PostgreSQL tsvector para FTS
}
// Índice GIN para FTS em tsvector

model AcessoDocumento {
  documentoId String
  perfilOuPapel String                // ADMIN_TENANT | RT | ...
  permissao String                    // LEITURA | ESCRITA | NENHUMA
  @@id([documentoId, perfilOuPapel])
}
```

## Pipeline de indexação

```
on documento.uploaded:
  1. computar sha256
  2. extrair texto (pdf-parse / OCR via Tesseract para digitalizados)
  3. classificar tipo via LLM (LO? auto? laudo?)
  4. extrair metadados (números, datas, valores) via LLM
  5. gerar tags semânticas
  6. criar BuscaDocumento (tsvector)
  7. publicar evento "documento.indexado"
```

## Telas
1. **Biblioteca** (`/documentos`):
   - Busca full-text (Postgres FTS).
   - Filtros: empreendimento, módulo, tipo, validade, emissor, data.
   - Visualização em grid ou lista.
2. **Detalhe do documento**:
   - Preview inline (PDF.js).
   - Versões.
   - Vínculos (qual módulo/entidade usa).
   - Auditoria de acesso.
   - Hash + assinatura.
3. **Upload em massa** (drag-and-drop): processa em fila, reconhece tipo, sugere vínculos.

## Retenção legal
- Tabela `PoliticaRetencao` com regras (por tipo de documento).
- Worker mensal: documentos vencidos + sem retenção legal vigente → arquivo frio (Glacier?) ou exclusão (com aprovação manual).

## Casos de borda
1. Documento que origina vários módulos (laudo SASC vira evidência M2 + condicionante M1): vínculos múltiplos.
2. Versão errada subida: nova versão substitui, antiga preservada.
3. Documento confidencial (LGPD — atestado médico): classificação restringe acesso.

## Perguntas abertas
1. Busca semântica (embeddings) v1 ou v2?
2. Storage frio (Glacier/B2) automático após N anos?
3. Assinatura digital ICP-Brasil (gov.br) — escopo?
