# 30. Relatório da Onda 2.10.1 — Refinamento visual e validação manual do PDF da Proposta Comercial

## 1. Resumo

A Onda 2.10.1 refinou a apresentação visual do PDF da proposta comercial e concluiu a validação manual do documento gerado.

Escopo entregue:

- auditoria da implementação atual do PDF;
- geração de PDF real a partir de proposta persistida;
- validação manual do download direto pela API;
- validação manual do download pelo proxy autenticado do Next;
- refinamento visual do layout do PDF;
- confirmação de proteção dos campos sensíveis;
- validação por `typecheck`, testes e `build`;
- documentação técnica da onda.

Escopo não executado:

- contrato;
- ordem de serviço;
- financeiro;
- handoff operacional;
- aceite eletrônico;
- assinatura;
- cobrança;
- parcelas;
- Prisma;
- seed;
- migration;
- próxima onda.

## 2. Contexto Lido

Arquivos de contexto consultados:

- `docs/29_RELATORIO_ONDA_2_10_PDF_PROPOSTA_COMERCIAL.md`
- `docs/28_RELATORIO_ONDA_2_9_6_EDICAO_CONTROLADA_PROPOSTA_STATUS.md`
- `docs/25_RELATORIO_ONDA_2_9_3_UI_PROPOSTA_COMERCIAL.md`
- `docs/23_RELATORIO_ONDA_2_9_2_API_PROPOSTA_COMERCIAL.md`

## 3. Auditoria da Implementação Atual

Arquivos auditados:

- `apps/api/src/modules/comercial/propostas.pdf.ts`
- `apps/api/src/modules/comercial/propostas.service.ts`
- `apps/api/src/modules/comercial/comercial.routes.ts`
- `apps/api/src/modules/comercial/__tests__/propostas.routes.test.ts`
- `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx`
- `apps/web/src/app/api/comercial/propostas/[id]/pdf/route.ts`

Conclusões da auditoria:

- o PDF continua sendo gerado exclusivamente a partir de `buscarPorId`, ou seja, do contrato público sanitizado;
- o gerador não acessa `inputSnapshot`, `resultadoSnapshot`, `snapshotCatalogo` nem qualquer campo interno de custo/margem;
- o filename continua seguro, derivado de `slugifyFilePart(proposta.numero)`;
- o botão da UI continua apontando para `/api/comercial/propostas/:id/pdf`;
- o proxy web continua reutilizando a sessão autenticada via cookie `posto_access`.

## 4. Proposta Validada Manualmente

Proposta usada na validação manual:

- `id`: `7762296d-4063-4f54-a2e4-51099f5afd75`
- `numero`: `PROP-2026-0CDA74A2`

Arquivo final validado em `/tmp`:

- `/tmp/proposta_pdf_final_ok.pdf`

Metadados observados:

- `2` páginas;
- tamanho final: `21711` bytes;
- `Content-Type: application/pdf`;
- `Content-Disposition: attachment; filename="prop-2026-0cda74a2.pdf"`.

## 5. Validação Manual Executada

### 5.1. Download direto da API

Fluxo validado:

- autenticação em `POST /api/v1/auth/login`;
- download em `GET /api/v1/comercial/propostas/:id/pdf`;
- resposta `200`;
- PDF gravado em `/tmp`;
- abertura e inspeção visual via conversão para imagem.

### 5.2. Download pelo proxy autenticado do Next

Fluxo validado:

- uso de cookie `posto_access` válido;
- download em `/api/comercial/propostas/:id/pdf`;
- resposta `200`;
- tamanho idêntico ao arquivo baixado direto da API.

Resultado observado:

- API: `21711` bytes
- proxy web: `21711` bytes

### 5.3. UI e botão `Baixar PDF`

Confirmações:

- o detalhe da proposta continua carregando em `/comercial/propostas/[id]`;
- o botão continua apontando para a rota correta do proxy;
- o proxy autenticado entrega o arquivo corretamente.

Limitação registrada:

- não houve navegador interativo/headed para confirmar clique visual e console do browser;
- a validação do botão foi concluída por inspeção do código da UI e por chamada real bem-sucedida da mesma rota usada pelo botão.

## 6. Refinamentos Visuais Aplicados

Arquivo alterado:

- `apps/api/src/modules/comercial/propostas.pdf.ts`

Melhorias implementadas:

- cabeçalho em painel com título, número, status, origem, data de emissão e validade;
- textos de apresentação mais aderentes ao uso comercial preliminar;
- melhor separação visual entre seções;
- cards de itens mais legíveis;
- correção da quebra de página dos itens;
- agrupamento consistente de totais e observações finais;
- rodapé comercial com ressalvas de proposta preliminar, não substituição de contrato e dependência de conferência técnica/documental.

## 7. Critérios Visuais Validados

### Cabeçalho

Validado:

- título `Proposta Comercial`;
- número da proposta;
- status;
- data de emissão;
- data de validade.

### Dados comerciais

Validado no documento final:

- nome do lead;
- empresa;
- e-mail;
- telefone;
- município/UF.

Observação:

- o campo de documento não estava disponível na proposta validada nem no contrato público atual do detalhe, então permaneceu ausente do PDF desta onda.

### Diagnóstico resumido

Validado:

- CNAE principal;
- risco;
- score;
- potencial poluidor;
- alertas;
- próximos passos.

### Itens

Validado:

- código;
- nome do serviço;
- categoria;
- decisão;
- quantidade;
- preço aplicado;
- valor da linha.

### Totais

Validado:

- total mínimo;
- total base;
- total máximo.

### Rodapé

Validado:

- aviso de proposta comercial preliminar;
- indicação de que não substitui contrato;
- condicionamento à conferência técnica, documental e locacional.

## 8. Segurança Confirmada

Foi confirmada a ausência de:

- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- `observacoesInternas`
- `custoInternoEstimado`
- `margemLucroAlvo`
- `valorReferenciaHora`
- `metadata`

Verificações realizadas:

- inspeção do gerador;
- busca textual direta no PDF final gerado;
- cobertura automatizada já existente da rota de PDF.

## 9. Arquivos Alterados

| Arquivo | Ação | Finalidade |
|---|---|---|
| `apps/api/src/modules/comercial/propostas.pdf.ts` | Alterado | Refinamento visual e correção de paginação do PDF |
| `docs/30_RELATORIO_ONDA_2_10_1_REFINAMENTO_VALIDACAO_PDF_PROPOSTA.md` | Criado | Registro técnico desta onda |

## 10. Validações Executadas

### API

| Comando | Resultado |
|---|---|
| `npm run typecheck` em `apps/api` | Passou |
| `npm test` em `apps/api` | Passou |
| `npm run build` em `apps/api` | Passou |

Resultado da suíte:

- `2` arquivos de teste passados
- `14` testes passados

### Web

| Comando | Resultado |
|---|---|
| `npm run build` em `apps/web` | Passou |
| `npm run typecheck` em `apps/web` | Passou |

Observação técnica:

- houve um falso negativo inicial de `typecheck` do web por referências transitórias em `.next/types` antes do `build`;
- após regeneração do `build`, o `typecheck` passou normalmente.

## 11. Status Final

O PDF da proposta comercial ficou validado para uso comercial preliminar nesta etapa, com:

- download autenticado funcionando na API e no proxy web;
- layout mais legível;
- duas páginas consistentes para o caso validado;
- rodapé comercial mais claro;
- proteção mantida contra campos sensíveis;
- typecheck, testes e builds concluídos com sucesso.
