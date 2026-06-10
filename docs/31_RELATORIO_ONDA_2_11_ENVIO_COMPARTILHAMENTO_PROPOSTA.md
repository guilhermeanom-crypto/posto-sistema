# 31. Relatório da Onda 2.11 — Envio e Compartilhamento da Proposta Comercial

## 1. Resumo

A Onda 2.11 implementou recursos assistidos de compartilhamento da proposta comercial já persistida, sem criar envio real, aceite formal, assinatura ou qualquer artefato contratual.

Escopo entregue:

- auditoria da UI, proxy web e API já existentes;
- confirmação dos campos seguros disponíveis para compartilhamento;
- criação do bloco `Compartilhamento da proposta` no detalhe;
- ação para copiar mensagem comercial sugerida;
- ação para copiar link interno da proposta;
- ação para abrir WhatsApp Web com mensagem pré-preenchida, quando houver telefone;
- ação para abrir cliente de e-mail com assunto e corpo pré-preenchidos, quando houver e-mail;
- ação para marcar a proposta como `ENVIADA` quando a transição já for permitida pelo backend;
- validação por `typecheck`, testes e `build`;
- documentação técnica da onda.

Escopo não executado:

- contrato;
- ordem de serviço;
- financeiro;
- handoff operacional;
- aceite eletrônico;
- assinatura digital;
- cobrança;
- parcelas;
- migration;
- Prisma;
- seed;
- próxima onda.

## 2. Contexto Lido

Arquivos de contexto consultados:

- `docs/29_RELATORIO_ONDA_2_10_PDF_PROPOSTA_COMERCIAL.md`
- `docs/30_RELATORIO_ONDA_2_10_1_REFINAMENTO_VALIDACAO_PDF_PROPOSTA.md`
- `docs/28_RELATORIO_ONDA_2_9_6_EDICAO_CONTROLADA_PROPOSTA_STATUS.md`
- `docs/25_RELATORIO_ONDA_2_9_3_UI_PROPOSTA_COMERCIAL.md`
- `docs/23_RELATORIO_ONDA_2_9_2_API_PROPOSTA_COMERCIAL.md`

## 3. Auditoria Inicial

Arquivos auditados:

- `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx`
- `apps/web/src/app/(app)/comercial/propostas/actions.ts`
- `apps/web/src/app/(app)/comercial/propostas/shared.ts`
- `apps/web/src/app/api/comercial/propostas/[id]/pdf/route.ts`
- `apps/api/src/modules/comercial/propostas.service.ts`
- `apps/api/src/modules/comercial/comercial.routes.ts`

Conclusões:

- o detalhe da proposta já expunha `emailContato`, `telefoneContato`, `numero`, `status`, `totalBase` e `dataValidade`;
- o proxy autenticado do PDF já estava pronto para ser citado na mensagem comercial;
- o backend já permitia a transição `PRONTA -> ENVIADA` no endpoint `PATCH /api/v1/comercial/propostas/:id`;
- não houve necessidade de alterar API, Prisma, seed ou migration para esta onda.

## 4. Implementação Entregue

Arquivo alterado:

- `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx`

Entregas realizadas na UI:

- novo card `Compartilhamento da proposta`;
- mensagem comercial segura gerada a partir de número da proposta, valor base e data de validade;
- botão `Copiar mensagem`;
- botão `Copiar link interno`;
- botão `Enviar por WhatsApp`, habilitado somente quando há telefone utilizável;
- botão `Enviar por e-mail`, habilitado somente quando há e-mail;
- botão `Marcar como enviada`, exibido somente quando a transição é permitida;
- resumo lateral com status, valor base, validade e canais de contato;
- feedback visual de sucesso e erro para as ações de compartilhamento.

## 5. Regras e Segurança Mantidas

Mensagem e ações usam apenas dados já expostos no contrato público do detalhe.

Não foram usados nem expostos:

- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- `observacoesInternas`
- `custoInternoEstimado`
- `margemLucroAlvo`
- `valorReferenciaHora`
- `metadata`

Também não foi criado:

- envio real por servidor SMTP;
- integração com API do WhatsApp;
- link público externo;
- portal de aceite;
- assinatura ou contrato.

## 6. Comportamento da UI

### 6.1. Mensagem sugerida

Texto implementado:

```txt
Olá, tudo bem?

Segue a proposta comercial {numero} referente à análise/regularização ambiental do empreendimento.

Valor base estimado: {totalBase}
Validade da proposta: {dataValidade}

Você pode acessar a proposta pelo sistema ou baixar o PDF pelo botão disponível no detalhe.

Fico à disposição.
```

### 6.2. Link interno

O link interno copiado aponta para:

```txt
/comercial/propostas/:id
```

No clique de cópia, a UI converte para URL absoluta quando executada no navegador.

### 6.3. WhatsApp

Comportamento:

- sanitiza o telefone removendo caracteres não numéricos;
- prefixa `55` quando o número estiver em formato nacional de 10 ou 11 dígitos;
- abre `wa.me` em nova aba com a mensagem pré-preenchida.

### 6.4. E-mail

Comportamento:

- abre `mailto:`;
- assunto: `Proposta Comercial {numero}`;
- corpo: mesma mensagem comercial sugerida.

### 6.5. Status `ENVIADA`

Comportamento:

- a UI só oferece `Marcar como enviada` quando `STATUS_TRANSITIONS` permite;
- a persistência continua sendo feita pelo endpoint `PATCH` já existente;
- nenhuma nova regra de negócio foi criada nesta onda.

## 7. Arquivos Alterados

| Arquivo | Ação | Finalidade |
|---|---|---|
| `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx` | Alterado | Inclusão do bloco de compartilhamento e ações assistidas |
| `docs/31_RELATORIO_ONDA_2_11_ENVIO_COMPARTILHAMENTO_PROPOSTA.md` | Criado | Registro técnico desta onda |

## 8. Validações Executadas

### API

| Comando | Resultado |
|---|---|
| `npm run typecheck` em `apps/api` | Passou |
| `npm test` em `apps/api` | Passou |
| `npm run build` em `apps/api` | Passou |

Resultado da suíte:

- `2` arquivos de teste passados
- `14` testes passados

Observação:

- a primeira execução de `npm test` dentro do sandbox falhou por restrição de conexão ao Redis local (`EPERM` em `127.0.0.1:6379`);
- a rerodagem com permissão expandida confirmou que a suíte real passou sem necessidade de ajustes de código.

### Web

| Comando | Resultado |
|---|---|
| `npm run typecheck` em `apps/web` | Passou |
| `npm run build` em `apps/web` | Passou |

## 9. Status Final

A proposta comercial agora pode ser compartilhada de forma assistida pela equipe comercial, com:

- mensagem pronta;
- link interno copiável;
- abertura de WhatsApp Web;
- abertura de e-mail;
- possibilidade de marcar como `ENVIADA` quando a transição já for válida;
- manutenção integral do modelo de segurança e do escopo comercial preliminar.
