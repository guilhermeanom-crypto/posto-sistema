# 24_RELATORIO_ONDA_2_9_2_1_SANEAMENTO_PRISMA_CLIENT

## 1. Objetivo

A Onda 2.9.2.1 teve como objetivo investigar e, se possivel, corrigir a geracao do Prisma Client para as models comerciais introduzidas na Onda 2.9.1:

- `DiagnosticoComercial`
- `PropostaComercial`
- `ItemProposta`

Escopo pretendido:

- auditar schema, migration, service e configuracao do Prisma Client
- confirmar a existencia correta das models no `schema.prisma`
- rodar `npm run db:generate`
- rodar `npm run typecheck`
- trocar `raw SQL` por delegates oficiais apenas se os delegates passassem a existir de forma confiavel

Escopo que **nao** foi executado:

- Onda 2.9.3
- UI
- nova funcionalidade
- nova migration
- alteracao definitiva de `schema.prisma`
- alteracao de seed

---

## 2. Arquivos Auditados

Arquivos auditados nesta subonda:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260512110000_add_proposta_comercial_persistida/migration.sql`
- `apps/api/src/modules/comercial/propostas.service.ts`
- `apps/api/src/infra/database/prisma.ts`
- `apps/api/package.json`

Tambem foi auditado o caminho efetivo do client gerado utilizado pelo workspace:

- `apps/api/node_modules/@prisma/client`
- `node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client`

---

## 3. Confirmacao das Models no Schema

As models comerciais existem corretamente no `schema.prisma`:

- `generator client` encontrado no inicio do arquivo
- `model DiagnosticoComercial` na linha `2235`
- `model PropostaComercial` na linha `2284`
- `model ItemProposta` na linha `2339`

A migration `20260512110000_add_proposta_comercial_persistida` tambem esta correta e cria:

- enums comerciais
- `diagnosticos_comerciais`
- `propostas_comerciais`
- `itens_proposta`
- FKs e indices esperados

Conclusao:

- o problema **nao** esta no schema Prisma
- o problema **nao** esta na migration da Onda 2.9.1

---

## 4. Achado Tecnico Principal

Foi confirmado que o Prisma Client efetivamente utilizado pelo backend estava stale no caminho fisico do `pnpm`:

- `node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client`

Evidencias observadas:

- o `schema.prisma` embutido nesse client gerado tinha apenas `2228` linhas
- o `apps/api/prisma/schema.prisma` atual tem `2440` linhas
- o client gerado **nao** continha:
  - `diagnosticoComercial`
  - `propostaComercial`
  - `itemProposta`
- o timestamp dos artefatos do client permanecia em `2026-05-11 20:50:58 -0800`

Conclusao:

- a Onda 2.9.2 precisou usar `$queryRaw` e `$executeRaw` porque os delegates realmente nao existiam no client gerado deste ambiente

---

## 5. Tentativas de Saneamento Executadas

### 5.1. Geracao padrao

Comando:

```bash
npm run db:generate
```

Resultado:

- comando encerra sem erro
- carrega `.env`
- carrega `prisma/schema.prisma`
- **nao** atualiza o client gerado
- **nao** passa a expor delegates das models comerciais

### 5.2. Geracao direta com Prisma CLI

Comando:

```bash
npx prisma generate --schema prisma/schema.prisma
```

Resultado:

- mesmo comportamento da geracao padrao
- nenhuma atualizacao material do client em `.pnpm/.../.prisma/client`

### 5.3. Debug da geracao

Comando:

```bash
DEBUG='*' npx prisma generate --schema prisma/schema.prisma
```

Resultado:

- o CLI reconhece o schema
- o processo do generator finaliza com `code 0`
- mesmo assim nenhum artefato novo e gravado para as models comerciais

### 5.4. Rebuild local do pacote Prisma

Comando:

```bash
npm rebuild @prisma/client prisma
```

Resultado:

- rebuild concluido com sucesso
- client continuou stale
- delegates comerciais continuaram ausentes

### 5.5. Teste forcado com remocao segura do client gerado antigo

Procedimento:

- o diretorio antigo `.prisma/client` foi movido temporariamente para backup em `/tmp`
- em seguida foi executado novo `prisma generate`

Resultado:

- o `generate` novamente terminou sem erro
- nenhum novo client foi recriado
- o backup foi restaurado imediatamente para nao deixar o ambiente quebrado

Conclusao dessa tentativa:

- o problema **nao** era apenas cache do client antigo
- o gerador do Prisma neste ambiente esta concluindo sem materializar o client esperado

### 5.6. Teste com `output` explicito no generator

Foi testada temporariamente uma configuracao de diagnostico:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}
```

Resultado:

- o schema continuou valido
- o `generate` continuou sem escrever artefatos
- a alteracao foi **revertida no mesmo turno**

Conclusao:

- nenhuma alteracao definitiva foi mantida no `schema.prisma`

---

## 6. Impacto na API de Propostas

Nao foi possivel substituir `raw SQL` por delegates oficiais nesta subonda.

Motivo:

- o Prisma Client deste workspace continua sem expor em runtime e em tipos:
  - `diagnosticoComercial`
  - `propostaComercial`
  - `itemProposta`

Decisao adotada:

- manter `apps/api/src/modules/comercial/propostas.service.ts` como estava na Onda 2.9.2
- preservar a API funcional e os testes existentes
- nao inventar camada paralela nem alterar contrato da API sem client oficial confiavel

---

## 7. Validacoes Finais

Comandos executados ao final:

```bash
npm run db:generate
npx tsc --noEmit --pretty false
```

Resultados:

- `db:generate`: continua encerrando sem erro, porem sem regenerar delegates comerciais
- `typecheck`: sucesso

Conclusao:

- a investigacao nao introduziu regressao no backend atual

---

## 8. Arquivos Alterados

Arquivos alterados nesta subonda:

| Arquivo | Acao | Observacao |
|---|---|---|
| `docs/24_RELATORIO_ONDA_2_9_2_1_SANEAMENTO_PRISMA_CLIENT.md` | Criado | Registro tecnico da investigacao |

Observacao importante:

- qualquer alteracao temporaria feita no `schema.prisma` durante o diagnostico foi revertida antes do encerramento
- nenhum arquivo de API, migration ou seed ficou alterado por esta subonda

---

## 9. Conclusao

A Onda 2.9.2.1 foi concluida como **saneamento tecnico investigativo**, com causa raiz parcialmente isolada:

- schema e migration estao corretos
- as models comerciais existem no schema
- o problema esta na **geracao efetiva do Prisma Client** neste ambiente do monorepo
- o comando `prisma generate` termina com sucesso aparente, mas nao escreve delegates atualizados

Status final da API:

- mantida funcional
- mantida com `raw SQL` para as 3 novas tabelas comerciais
- sem regressao de typecheck

Recomendacao tecnica antes de insistir na troca para delegates:

1. saneamento do toolchain Prisma do workspace
2. regeneracao do client em ambiente limpo de dependencias
3. nova rodada especifica para trocar `raw SQL` por delegates oficiais somente depois que o client realmente expuser:
   - `diagnosticoComercial`
   - `propostaComercial`
   - `itemProposta`
