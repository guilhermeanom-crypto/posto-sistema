# 61. Relatorio Final da Onda 3.5 - Refinamento de UX e Sanitizacao Operacional do Handoff

## 1. Objetivo da Onda 3.5

Consolidar a Onda 3.5 como etapa de refinamento visual e sanitizacao operacional da UI de handoffs, com foco em:

- reduzir ou eliminar a exposicao visual de UUIDs, IDs internos e referencias tecnicas pouco legiveis;
- melhorar a clareza operacional da listagem e do detalhe de handoff;
- padronizar labels, textos, badges e blocos diretamente ligados a leitura operacional;
- preservar integralmente a regra de aceite operacional validada na Onda 3.4.

Importante:

- a Onda 3.5 atuou sobre apresentacao e UX;
- a Onda 3.5 nao limpou, nao reduziu e nao redesenhou o payload dos proxies web.

## 2. Problema residual herdado da Onda 3.3

A Onda 3.3 deixou o modulo de handoffs funcionalmente estruturado, com:

- listagem operacional;
- detalhe operacional;
- atualizacao controlada;
- persistencia validada;
- saneamento de snapshots brutos e metadados mais sensiveis.

Mesmo assim, permaneceu um problema residual de UX:

- a UI ainda expunha UUIDs e IDs internos em pontos da leitura padrao;
- alguns enums tecnicos continuavam aparecendo crus para o usuario operacional;
- havia blocos corretos do ponto de vista funcional, mas com baixa legibilidade operacional.

Em resumo:

- a base funcional estava correta;
- o problema remanescente era de leitura, apresentacao e sanitizacao visual.

## 3. Relacao com a Onda 3.4

A Onda 3.4 foi a base obrigatoria preservada durante toda a Onda 3.5.

Relacao objetiva:

- a Onda 3.4 validou o aceite operacional para `EM_PLANEJAMENTO`;
- a Onda 3.4 validou os bloqueios sem `responsavelOperacionalId`;
- a Onda 3.4 validou os bloqueios com `pendenciasOperacionais` em aberto;
- a Onda 3.4 validou persistencia apos reload;
- a Onda 3.4 validou ausencia de acionamento de contrato, OS, financeiro e CRM.

Papel da Onda 3.5 sobre essa base:

- nao reabrir regra de negocio;
- nao alterar transicoes;
- nao alterar permissao estrutural;
- apenas refinar a forma como a UI apresenta os dados ja homologados.

## 4. Escopo executado na Onda 3.5.1

A execucao efetiva da Onda 3.5 ocorreu na subetapa:

- `ONDA 3.5.1 — CORRECAO VISUAL DE UUIDS E LABELS OPERACIONAIS DO HANDOFF`

Escopo efetivamente executado:

- ajuste exclusivo da camada de apresentacao;
- remocao visual de `propostaComercialId`, `responsavelComercialId` e `responsavelOperacionalId` da listagem;
- remocao visual de `propostaComercialId`, `empreendimentoId`, `responsavelComercialId`, `responsavelOperacionalId` e `leadWhatsAppId` do detalhe;
- remocao do fallback que mostrava recorte de UUID em responsavel operacional;
- mapeamento de enums tecnicos para labels amigaveis;
- refinamento pontual de textos e blocos diretamente ligados a legibilidade operacional;
- validacao de que o aceite operacional da Onda 3.4 permaneceu intacto.

## 5. Arquivos alterados

Arquivos alterados na Onda 3.5.1:

- `apps/web/src/app/(app)/operacao/handoffs/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`

## 6. Arquivos preservados

Arquivos preservados na Onda 3.5:

- `apps/web/src/app/api/operacao/handoffs/route.ts`
- `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`

Tambem permaneceram preservados:

- Prisma;
- migrations;
- status;
- entidades;
- autenticacao;
- tenant;
- estrutura global do app.

## 7. UUIDs e IDs internos removidos da leitura visual

### Listagem `/operacao/handoffs`

Foram removidos da leitura visual padrao:

- `propostaComercialId`
- `responsavelComercialId`
- `responsavelOperacionalId`

### Detalhe `/operacao/handoffs/[id]`

Foram removidos da leitura visual padrao:

- `propostaComercialId`
- `empreendimentoId`
- `responsavelComercialId`
- `responsavelOperacionalId`
- `leadWhatsAppId`

### Ajuste adicional relevante

Tambem foi removido:

- fallback visual com UUID cortado em `Responsável atual (...)`

Resultado pratico:

- a leitura padrao das duas telas deixou de expor UUIDs como elemento de interface;
- os estados de responsavel passaram a usar leitura amigavel e neutra.

## 8. Enums convertidos para labels amigaveis

Enums convertidos:

- `origemProposta`
- `statusPropostaOrigem`
- `permissions.perfil`
- `usuario.perfil`
- `riscoNivel`
- `potencialPoluidor`
- `esfera`

Exemplos relevantes:

- `TRIAGEM_CNAE` -> `Triagem de CNAE`
- `APROVADA` -> `Aprovada`
- `CRITICO` -> `Crítico`
- `ADMIN_TENANT` -> `Administrador do tenant`
- `MUNICIPAL` -> `Municipal`

## 9. Validacoes executadas

Validacoes executadas na Onda 3.5.1:

- abertura de `/operacao/handoffs`;
- abertura de `/operacao/handoffs/[id]`;
- verificacao de ausencia de UUIDs no DOM renderizado da listagem;
- verificacao de ausencia de UUIDs no DOM renderizado do detalhe;
- verificacao de ausencia de labels antigos como:
  - `Proposta Comercial ID`
  - `Responsável comercial ID`
  - `Responsável operacional ID`
  - `Proposta ID`
  - `Empreendimento ID`
  - `Lead WhatsApp ID`
- verificacao de presenca de labels amigaveis na UI;
- teste de bloqueio sem responsavel operacional;
- teste de bloqueio com pendencias operacionais;
- teste de aceite para `EM_PLANEJAMENTO`;
- confirmacao de persistencia apos releitura do detalhe via proxy do web.

## 10. Resultado dos testes

Checks e testes executados:

- `./node_modules/.bin/next build`
  - resultado: passou

- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
  - resultado: passou
  - observacao: a checagem valida foi considerada apos o build do Next, porque o `tsc` do web depende dos tipos gerados em `.next`

- `./node_modules/.bin/vitest run src/modules/operacao/__tests__/handoffs.routes.test.ts`
  - resultado final: `16` testes passando
  - observacao: a execucao valida precisou ocorrer fora do sandbox por dependencia do PostgreSQL em `localhost:5432`

## 11. Confirmacao de preservacao da regra de aceite operacional

Confirmacoes objetivas:

- nenhuma regra de transicao para `EM_PLANEJAMENTO` foi alterada;
- nenhum bloqueio sem `responsavelOperacionalId` foi alterado;
- nenhum bloqueio com `pendenciasOperacionais` em aberto foi alterado;
- nenhuma persistencia do aceite operacional foi alterada;
- nenhum contrato dos proxies foi alterado nesta onda;
- nenhum acionamento de contrato, OS, financeiro ou CRM foi introduzido.

Conclusao funcional:

- a regra de aceite operacional validada na Onda 3.4 permaneceu exatamente preservada.

## 12. Pontos que permanecem dependentes de payload futuro

Pontos ainda dependentes de payload futuro:

- exibir nome real do `responsavelComercial` em vez de fallback amigavel;
- exibir nome real do `responsavelOperacional` na listagem sem depender de estado neutro;
- substituir `empreendimentoId` por nome, codigo curto ou referencia operacional legivel;
- remodelar filtros tecnicos para busca realmente amigavel, sem depender de referencias internas do endpoint atual;
- decidir se campos tecnicos hoje enviados ao client ainda devem existir no payload saneado.

Ponto de governanca importante:

- a Onda 3.5 corrigiu a exposicao visual;
- a Onda 3.5 nao limpou nem reduziu o payload dos proxies.

## 13. Recomendacao sobre abrir ou nao uma Onda 3.5.2

Recomendacao:

- **sim, faz sentido abrir uma Onda 3.5.2**, desde que ela tenha escopo estritamente controlado e separado da 3.5.1.

Justificativa:

- a 3.5.1 resolveu a camada visual imediata;
- ainda existem ganhos reais possiveis na camada de contrato/payload saneado;
- parte do refinamento completo depende de enriquecer ou reduzir o shape exposto ao frontend.

Escopo recomendado para uma eventual 3.5.2:

- revisar e reduzir campos tecnicos expostos desnecessariamente pelos proxies;
- avaliar enriquecimento de labels humanas para responsaveis e empreendimento;
- manter a mesma restricao de nao tocar em regra de aceite, Prisma, status e entidades.

Escopo que nao deve ser reaberto em uma 3.5.2:

- regra de transicao para `EM_PLANEJAMENTO`;
- bloqueios da Onda 3.4;
- acionamentos de contrato, OS, financeiro e CRM.

## 14. Conclusao final

**Onda 3.5 concluida com sucesso no escopo executado.**

Resultado consolidado:

- o problema residual de exposicao visual herdado da Onda 3.3 foi tratado na UI de handoffs;
- a Onda 3.4 foi integralmente preservada como base funcional;
- a Onda 3.5.1 removeu UUIDs e IDs internos da leitura padrao das telas auditadas;
- enums tecnicos passaram a ser exibidos com labels operacionais amigaveis;
- build, TypeScript, testes de API e validacoes de runtime sustentaram o fechamento da etapa.

Fechamento correto da onda:

- a Onda 3.5 deve ser considerada concluida como onda de refinamento visual e sanitizacao operacional da interface;
- o tema de contrato e payload saneado fica explicitamente registrado como assunto potencial de uma Onda 3.5.2, e nao como pendencia da 3.5 ja executada.
