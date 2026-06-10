# 58. Plano da Onda 3.5 - Refinamento de UX e Sanitizacao Operacional do Handoff

## 1. Objetivo da Onda 3.5

Planejar a etapa de refinamento visual e sanitizacao operacional do modulo de handoffs, com foco em:

- remover ou substituir referencias tecnicas pouco legiveis expostas ao usuario final;
- padronizar a leitura operacional da listagem e do detalhe de handoff;
- melhorar a clareza de filtros, cards, badges e blocos operacionais;
- preservar integralmente a regra de negocio do aceite operacional validada na Onda 3.4.

Esta onda nao reabre a discussao de fluxo, dominio ou transicao de status. O objetivo e melhorar a experiencia de uso sobre a base funcional ja validada.

## 2. Problema residual herdado da Onda 3.3

A Onda 3.3 liberou a estrutura funcional inicial do modulo de handoffs, com listagem, detalhe e atualizacao operacional controlada. A Onda 3.4 consolidou o aceite operacional e validou o fluxo de transicao para `EM_PLANEJAMENTO`.

Mesmo com essa base aprovada, permaneceu um problema residual de UX:

- partes da listagem e do detalhe ainda exibem UUIDs ou referencias tecnicas internas;
- alguns blocos comunicam informacao correta, mas com linguagem ainda excessivamente tecnica;
- existem pontos em que a interface mostra identificadores validos para sistema, mas ruins para leitura operacional;
- ha oportunidade de tornar filtros, cards, badges e estados mais claros sem alterar a logica ja homologada.

Em resumo:

- o modulo esta funcionalmente correto;
- o problema atual e de apresentacao, inteligibilidade e sanitizacao de dados exibidos.

## 3. Limites da Onda 3.5

Fica permitido nesta onda:

- auditar a tela `/operacao/handoffs`;
- auditar a tela `/operacao/handoffs/[id]`;
- mapear ocorrencias de UUIDs e identificadores tecnicos visiveis na interface;
- substituir UUIDs por labels, nomes, titulos, codigos curtos ou mensagens amigaveis quando a informacao ja existir no payload;
- revisar textos de exibicao para linguagem operacional mais clara;
- refinar filtros, cards, badges e blocos operacionais;
- reforcar a ocultacao de dados tecnicos internos para usuario final.

Fica fora de escopo nesta onda:

- alteracao de regra de negocio do aceite operacional;
- alteracao de transicao para `EM_PLANEJAMENTO`;
- alteracao de dominio, entidade, status, permissao estrutural ou fluxo global do app;
- expansao funcional para contrato, OS, financeiro ou CRM.

## 4. Telas afetadas

Telas sob auditoria e possivel refinamento:

- `/operacao/handoffs`
- `/operacao/handoffs/[id]`

Foco esperado por tela:

- listagem:
  - colunas, cards, filtros, badges e rotulos;
  - identificacao de referencias tecnicas expostas desnecessariamente;
  - melhoria da leitura operacional da fila.

- detalhe:
  - cabecalho, resumo, secoes operacionais e campos auxiliares;
  - identificacao de UUIDs em blocos, mensagens, selects ou listas;
  - melhoria da comunicacao visual do contexto operacional.

## 5. Abordagem proposta

Sequencia recomendada para a implementacao futura:

1. auditar o payload consumido pela listagem e pelo detalhe;
2. localizar onde a UI renderiza UUIDs, IDs internos ou textos tecnicos brutos;
3. classificar cada ocorrencia em:
   - substituivel por dado amigavel ja disponivel;
   - ocultavel por nao agregar valor operacional;
   - dependente de fallback seguro quando nao houver label disponivel;
4. ajustar os pontos de exibicao mantendo o contrato funcional atual;
5. revisar coerencia visual de filtros, cards, badges e blocos principais;
6. validar que o fluxo de aceite operacional continua intacto.

## 6. Riscos

Riscos principais desta onda:

- ocultar dado tecnico que ainda esteja sendo usado como unico identificador visual em algum ponto da operacao;
- trocar um UUID por um campo amigavel inconsistente ou ambiguo;
- criar regressao visual em listagem ou detalhe ao alterar componentes compartilhados;
- vazar novamente algum dado interno ao tentar reorganizar o payload ou o mapeamento visual;
- tocar indevidamente na logica de aceite ao editar trechos proximos do detalhe operacional.

Mitigacoes esperadas:

- priorizar substituicao apenas quando houver informacao legivel ja disponivel;
- usar fallback controlado e neutro quando nao houver label segura;
- limitar a mudanca a camada de apresentacao e sanitizacao;
- revalidar o fluxo funcional da Onda 3.4 ao final.

## 7. Criterios de aceite

A Onda 3.5 podera ser considerada aceita quando:

1. a listagem `/operacao/handoffs` nao expuser UUIDs ou IDs internos sem necessidade operacional;
2. o detalhe `/operacao/handoffs/[id]` nao expuser UUIDs ou IDs internos sem necessidade operacional;
3. referencias tecnicas visiveis tiverem sido substituidas por nomes, labels, titulos, codigos curtos ou textos amigaveis quando disponiveis;
4. filtros, cards, badges e blocos operacionais estiverem mais claros e coerentes com linguagem operacional;
5. nao houver regressao da regra de aceite operacional validada na Onda 3.4;
6. dados tecnicos internos nao forem exibidos ao usuario final;
7. build, TypeScript e testes continuarem passando.

## 8. Checklist de validacao

Checklist funcional e visual para a etapa de implementacao:

- abrir `/operacao/handoffs`;
- abrir `/operacao/handoffs/[id]`;
- verificar se ha UUID visivel na listagem;
- verificar se ha UUID visivel no detalhe;
- verificar se responsavel operacional e demais referencias humanas aparecem com nome legivel quando disponivel;
- verificar se badges e status mantem leitura operacional clara;
- verificar se filtros usam rotulos compreensiveis;
- verificar se blocos operacionais nao exibem dados tecnicos internos;
- validar que o aceite para `EM_PLANEJAMENTO` continua obedecendo:
  - bloqueio sem `responsavelOperacionalId`;
  - bloqueio com `pendenciasOperacionais` em aberto;
  - persistencia apos reload;
- validar ausencia de acionamento de:
  - contrato;
  - OS;
  - financeiro;
  - CRM;
- executar:
  - `./node_modules/.bin/next build`
  - `./node_modules/.bin/tsc -p apps/web/tsconfig.json --noEmit`
- executar os testes relacionados ao modulo de handoffs que protegem a regra ja homologada.

## 9. Arquivos candidatos

Arquivos mais provaveis para auditoria e ajuste:

- `apps/web/src/app/(app)/operacao/handoffs/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`
- `apps/web/src/app/api/operacao/handoffs/route.ts`
- `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`

Arquivos auxiliares podem ser tocados apenas se forem estritamente necessarios para:

- formatacao e sanitizacao de exibicao;
- mapeamento de labels no frontend;
- ajuste de tipagem sem alterar regra de negocio.

## 10. O que nao pode ser alterado

Fica explicitamente proibido nesta onda:

- alterar Prisma;
- criar migration;
- criar status novo;
- criar entidade nova;
- alterar a regra de transicao para `EM_PLANEJAMENTO`;
- alterar o significado operacional validado na Onda 3.4;
- acionar contrato;
- acionar OS;
- acionar financeiro;
- acionar CRM;
- reabrir o escopo funcional da Onda 3.4;
- mexer em autenticacao, tenant ou estrutura global do app.

## 11. Premissas de preservacao

Premissas que devem permanecer intactas durante a implementacao futura:

- `EM_PLANEJAMENTO` continua representando aceite operacional concluido e preparacao para execucao;
- o bloqueio sem `responsavelOperacionalId` continua obrigatorio;
- o bloqueio com `pendenciasOperacionais` em aberto continua obrigatorio;
- a persistencia apos reload continua obrigatoria;
- a UI continua sem expor snapshots brutos ou metadados internos;
- o refinamento desta onda deve atuar sobre apresentacao, inteligibilidade e sanitizacao, nao sobre a regra de negocio.

## 12. Resultado esperado da Onda 3.5

Ao final desta onda, espera-se que o modulo de handoffs:

- preserve exatamente o comportamento operacional aprovado na Onda 3.4;
- apresente linguagem mais clara para o usuario operacional;
- reduza ou elimine exibicao de UUIDs e referencias tecnicas desnecessarias;
- entregue uma experiencia mais limpa, legivel e segura para uso diario.
