# 16_RELATORIO_ONDA_2_7_DIAGNOSTICO_CNAE

## 1. Escopo da Retomada

Esta retomada da Onda 2.7 teve como objetivo fechar tecnicamente o que ja existia no repositorio, sem abrir escopo novo.

Foi feito:
- Auditoria dos arquivos ja criados da Onda 2.7.
- Validacao ponta a ponta do endpoint `POST /api/v1/comercial/diagnostico/cnae`.
- Confirmacao da protecao por JWT.
- Confirmacao da sanitizacao de campos sensiveis no catalogo comercial.
- Confirmacao dos servicos recomendados existentes no catalogo oficial.
- Ajustes pequenos de consistencia e reexecutabilidade.

Nao foi feito:
- Onda 2.8.
- Persistencia de proposta, contrato ou ordem de servico.
- Alteracao de Prisma, migration, seed, dashboard, processos, documentos, tarefas, condicionantes ou portal.

---

## 2. Estado Auditado da Implementacao

Arquivos auditados nesta onda:

| Arquivo | Papel |
|---|---|
| `apps/api/src/modules/comercial/diagnostico.types.ts` | Tipos de entrada e saida do diagnostico |
| `apps/api/src/modules/comercial/diagnostico.schemas.ts` | Schema Zod de entrada e schema de resposta |
| `apps/api/src/modules/comercial/diagnostico.service.ts` | Motor de diagnostico, risco, recomendacoes e orcamento |
| `apps/api/src/modules/comercial/comercial.routes.ts` | Exposicao da rota e protecao por autenticacao |
| `apps/api/scratch/test-diagnostico.ts` | Script reexecutavel de validacao |
| `docs/16_RELATORIO_ONDA_2_7_DIAGNOSTICO_CNAE.md` | Relatorio consolidado da onda |

O endpoint auditado permanece:

`POST /api/v1/comercial/diagnostico/cnae`

Ele depende de:
- CNAE(s)
- UF
- porte
- situacao
- historico de outorga
- catalogo oficial `servicos_consultoria_base` via `prisma.servicoCatalogo`

---

## 3. Ajustes Aplicados na Retomada

Foram aplicados apenas ajustes pequenos e tecnicos:

1. O diagnostico passou a declarar schema de resposta em `diagnostico.schemas.ts` e `comercial.routes.ts`.
2. O `DiagnosticoService` deixou de instanciar `new PrismaClient()` proprio e passou a usar o `prisma` compartilhado da aplicacao.
3. A resposta de recomendacoes passou a consultar apenas os campos publicos necessarios do catalogo.
4. A lista de codigos sugeridos passou a ser deduplicada e a resposta passou a manter ordem deterministica.
5. Foi corrigida a inconsistência de `necessitaOutorga` para nao marcar obrigatoriedade em atividades cujo CNAE nao exige outorga.
6. O script `scratch/test-diagnostico.ts` foi convertido para validacao reexecutavel com `app.inject`, sem depender de servidor HTTP externo em `localhost:3001`.
7. A documentacao curta da rota `/catalogo` foi alinhada com o comportamento real: visao autenticada e sanitizada, nao anonima.

---

## 4. Validacao Executada

Comando utilizado para a validacao:

```bash
node --import tsx scratch/test-diagnostico.ts
```

O script passou a validar automaticamente:
- acesso sem token ao diagnostico
- login com usuario demo
- acesso autenticado ao catalogo sanitizado
- execucao autenticada do endpoint de diagnostico

Resultado observado:
- `POST /api/v1/comercial/diagnostico/cnae` sem token retornou `401`
- login com `admin@postodemo.com.br` retornou `200`
- `GET /api/v1/comercial/catalogo?limit=1` autenticado retornou `200`
- nenhum dos campos sensiveis abaixo apareceu na resposta publica do catalogo:
  - `custoInternoEstimado`
  - `margemLucroAlvo`
  - `valorReferenciaHora`
  - `metadata`
  - `atualizadoEm`
- `POST /api/v1/comercial/diagnostico/cnae` autenticado retornou `200`

Status final do script:

`Validacao OK.`

---

## 5. Cenario Validado e Resultado Real

Payload validado:

```json
{
  "cnaes": ["4731-8/00"],
  "uf": "SP",
  "porte": "MEDIO",
  "situacao": "IRREGULAR",
  "temOutorgaAnterior": false
}
```

Resultado real retornado pelo endpoint:
- CNAE principal: `4731-8/00`
- risco geral: `score 90`
- nivel de risco: `CRITICO`
- quantidade de servicos retornados: `9`
- orcamento minimo: `26800`
- orcamento maximo: `135000`
- orcamento recomendado: `45500`

Alertas retornados:
- Operacao irregular detectada: risco de multas e interdicao imediata.
- Atividade de alto impacto ambiental: requer acompanhamento tecnico continuo.
- Necessidade de outorga: uso sem portaria passivel de lacracao de captacao/poco.

Correcao de inconsistencias do relatorio anterior:
- o risco nao ficou em `ALTO`; no cenario validado ficou em `CRITICO`
- a resposta nao retornou `7` servicos; retornou `9`

---

## 6. Servicos Confirmados no Catalogo Oficial

Os 9 codigos retornados no cenario validado existem e estao ativos no catalogo oficial (`servicos_consultoria_base`):

| Codigo | Nome | Decisao no diagnostico | Preco Base | Preco Minimo | Preco Maximo |
|---|---|---|---:|---:|---:|
| `LIC-004` | Relatorio de Controle Ambiental (RCA) | OBRIGATORIO | 8000.00 | 5000.00 | 14000.00 |
| `LIC-008` | Plano de Controle Ambiental (PCA) | OBRIGATORIO | 15000.00 | 8000.00 | 30000.00 |
| `LIC-011` | Plano de Gerenciamento de Residuos Solidos (PGRS/PGRCC) | OBRIGATORIO | 4000.00 | 2500.00 | 8000.00 |
| `OUT-015` | Outorga de Direito de Uso da Agua - Captacao Subterranea | OBRIGATORIO | 6000.00 | 3500.00 | 12000.00 |
| `MON-008` | Monitoramento de Agua Subterranea | OBRIGATORIO | 4500.00 | 2800.00 | 9000.00 |
| `EST-002` | Avaliacao Preliminar Ambiental (APA - NBR 15.515-1) | OBRIGATORIO | 8000.00 | 5000.00 | 15000.00 |
| `LIC-016` | Retificacao e Atualizacao de Licencas | CONDICIONAL | 2500.00 | 1500.00 | 5000.00 |
| `EST-001` | Diagnostico de Passivo Ambiental | CONDICIONAL | 15000.00 | 8000.00 | 30000.00 |
| `OUT-002` | Outorga - Captacao Superficial ou Subterranea | CONDICIONAL | 6000.00 | 3500.00 | 12000.00 |

Tambem foi confirmado que os codigos auxiliares usados por outras ramificacoes da matriz atual existem e estao ativos:
- `LIC-001`
- `LIC-010`
- `LIC-012`
- `LIC-014`
- `LIC-015`
- `OUT-004`
- `GES-001`

---

## 7. Conclusao

A Onda 2.7 ficou tecnicamente fechada no estado atual do repositorio.

Conclusoes objetivas:
- o endpoint existe, responde e esta protegido por JWT
- o motor consulta o catalogo oficial real
- o cenario auditado de posto irregular foi validado ponta a ponta
- os campos sensiveis do catalogo permaneceram protegidos na visao sanitizada
- os codigos recomendados no cenario validado existem e estao ativos no banco
- o script manual agora esta preparado para reexecucao com verificacoes minimas

Observacao final:
- esta retomada encerrou a Onda 2.7 sem iniciar a Onda 2.8
