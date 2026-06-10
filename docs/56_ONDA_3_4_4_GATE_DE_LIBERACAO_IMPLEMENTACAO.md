# 56. Onda 3.4.4 - Gate de Liberacao da Implementacao

## 1. Objetivo do gate

Definir o ponto formal de liberacao para implementacao da Onda 3.4, garantindo que:

- o escopo esteja fechado;
- as decisoes funcionais e tecnicas estejam consistentes;
- backend e frontend tenham regras obrigatorias claras;
- nao haja abertura indevida de dominio, modelo de dados ou automacao paralela.

Este documento funciona como criterio de entrada para a etapa de codigo da Onda 3.4.

## 2. Resumo das decisoes ja fechadas

Decisoes ja consolidadas:

- o aceite operacional sera implementado dentro do `HandoffComercial` existente;
- nao sera criada entidade nova de aceite;
- nao sera criado status novo;
- `EM_PLANEJAMENTO` sera a representacao tecnica do handoff aceito e em preparacao para execucao;
- o aceite operacional sera tratado como regra de dominio aplicada na transicao para `EM_PLANEJAMENTO`;
- os campos reutilizados serao:
  - `status`
  - `responsavelOperacionalId`
  - `pendenciasOperacionais`
  - `observacoesOperacionais`
  - `assumidoEm`, como marco auxiliar quando aplicavel;
- nao havera alteracao de Prisma;
- nao havera migration;
- nao havera abertura de contrato, OS, financeiro ou CRM.

## 3. Escopo liberado para implementacao

Fica liberado implementar apenas:

- validacoes de aceite operacional no fluxo do handoff;
- regras de backend para transicao segura para `EM_PLANEJAMENTO`;
- ajustes de UI na tela `/operacao/handoffs/[id]` para:
  - comunicar aceite operacional;
  - orientar precondicoes;
  - bloquear ou orientar transicao quando faltar responsavel;
  - bloquear ou orientar transicao quando houver pendencias;
  - refletir claramente o significado operacional dos status.

Tambem fica liberado:

- atualizar mensagens da tela para refletir o novo significado de `EM_PLANEJAMENTO`;
- ajustar feedback visual, desde que dentro do fluxo ja existente do handoff.

## 4. Arquivos que provavelmente poderao ser alterados

Arquivos mais provaveis na implementacao:

- `apps/api/src/modules/operacao/handoffs.routes.ts`
- `apps/api/src/modules/operacao/handoffs.schemas.ts`
- `apps/api/src/modules/operacao/handoffs.service.ts`
- `apps/api/src/modules/operacao/handoffs.types.ts`
- `apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts`
- `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/actions.ts`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`
- `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`

Arquivos auxiliares podem ser tocados apenas se estritamente necessarios para:

- tipagem;
- mensagens;
- revalidacao do detalhe do handoff.

## 5. Arquivos e dominios proibidos

Ficam proibidos nesta onda:

- `apps/api/prisma/schema.prisma`
- qualquer arquivo em `apps/api/prisma/migrations`
- modulos de contrato
- modulos de ordem de servico
- modulos de financeiro
- modulos de CRM
- qualquer modulo novo de aceite
- qualquer tabela, enum ou entidade nova
- qualquer fluxo automatico de onboarding, processo, tarefa ou documento disparado por aceite

## 6. Regras obrigatorias de backend

O backend deve obrigatoriamente:

1. manter o contrato atual do `PATCH` do handoff;
2. nao aceitar campos novos fora do contrato ja existente;
3. tratar aceite operacional como validacao de transicao para `EM_PLANEJAMENTO`;
4. impedir `EM_PLANEJAMENTO` quando:
   - faltar `responsavelOperacionalId`;
   - `pendenciasOperacionais` nao estiver vazio;
   - a transicao de status for invalida;
   - o perfil nao tiver permissao;
5. continuar respeitando tenant isolado;
6. continuar sem expor snapshots ou payload bruto;
7. continuar sem alterar dados estruturais da proposta comercial.

## 7. Regras obrigatorias de frontend

O frontend deve obrigatoriamente:

1. concentrar o fluxo de aceite em `/operacao/handoffs/[id]`;
2. nao criar rota nova para aceite;
3. comunicar que avancar para `EM_PLANEJAMENTO` representa aceite operacional;
4. orientar claramente quando o handoff nao puder ser aceito;
5. diferenciar visualmente:
   - responsavel operacional;
   - pendencias operacionais;
   - observacoes operacionais;
6. tratar `EM_PLANEJAMENTO` como aceite concluido e preparacao iniciada;
7. nao sugerir execucao iniciada quando o handoff ainda estiver em planejamento;
8. manter coerencia visual com permissoes do backend.

## 8. Validacoes obrigatorias para transicao para `EM_PLANEJAMENTO`

Antes de permitir a transicao para `EM_PLANEJAMENTO`, a implementacao deve validar obrigatoriamente:

1. o status atual permite transicao para `EM_PLANEJAMENTO`;
2. o handoff nao esta em estado final;
3. `responsavelOperacionalId` esta preenchido;
4. `pendenciasOperacionais` esta vazio;
5. o perfil do usuario esta autorizado para a acao;
6. a mudanca nao inclui campos proibidos.

Observacao:

- `observacoesOperacionais` pode ser recomendada, mas nao e requisito tecnico obrigatorio nesta fase.

## 9. Mensagens de erro obrigatorias

Mensagens obrigatorias a preservar ou introduzir:

- sem responsavel operacional:
  - `Defina um responsável operacional antes de aceitar este handoff.`

- com pendencias em aberto:
  - `Resolva ou remova as pendências operacionais antes de avançar para preparação.`

- transicao invalida:
  - `A transição para preparação não é permitida a partir do status atual do handoff.`

- sem permissao:
  - `Seu perfil não possui permissão para aceitar este handoff operacional.`

- erro generico:
  - `Não foi possível atualizar o aceite operacional do handoff no momento.`

## 10. Permissoes obrigatorias

Permissoes obrigatorias de leitura:

- `EXECUTIVO`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Permissoes obrigatorias de atualizacao operacional:

- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Permissoes obrigatorias para acoes sensiveis:

- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Perfil obrigatoriamente bloqueado:

- `REPRESENTANTE_POSTO`

Observacao de governanca:

- se a equipe decidir restringir a confirmacao final do aceite a perfil superior, isso deve ser consistente entre backend e UI.

## 11. Testes e verificacoes obrigatorias

Backend:

- ampliar testes de `handoffs.routes.test.ts` para cobrir:
  - sucesso ao avancar para `EM_PLANEJAMENTO` com responsavel e sem pendencias;
  - bloqueio sem `responsavelOperacionalId`;
  - bloqueio com `pendenciasOperacionais` em aberto;
  - bloqueio por permissao;
  - bloqueio por transicao invalida.

Frontend:

- validar comportamento visual em `/operacao/handoffs/[id]` para:
  - status sem aceite;
  - bloqueio por falta de responsavel;
  - bloqueio por pendencias;
  - comunicacao de aceite em `EM_PLANEJAMENTO`.

Verificacoes tecnicas obrigatorias:

- `./node_modules/.bin/next build`
- `./node_modules/.bin/tsc -p apps/web/tsconfig.json --noEmit`

Verificacao funcional recomendada apos implementacao:

- smoke test real do fluxo de aceite operacional com ambiente ativo.

## 12. Criterios para considerar a implementacao liberada

A implementacao da Onda 3.4 estara liberada para iniciar quando:

1. o time concordar em usar apenas o `HandoffComercial` atual;
2. estiver aceito que nao havera status novo;
3. estiver aceito que nao havera entidade nova;
4. estiver aceito que nao havera Prisma nem migration;
5. backend e frontend concordarem com o mesmo significado de `EM_PLANEJAMENTO`;
6. as mensagens obrigatorias estiverem fechadas;
7. os dominios proibidos permanecerem fora do escopo;
8. o recorte de arquivos editaveis estiver claro.

## 13. Criterios para bloquear a implementacao

A implementacao deve ser bloqueada se surgir qualquer necessidade de:

- criar status novo para aceite;
- criar entidade nova de aceite;
- alterar Prisma;
- criar migration;
- abrir contrato, OS, financeiro ou CRM;
- gerar automacao paralela fora do handoff;
- quebrar o contrato atual do `PATCH`;
- expor snapshots ou campos internos;
- permitir `EM_PLANEJAMENTO` sem responsavel operacional;
- permitir `EM_PLANEJAMENTO` com pendencias em aberto.

## 14. Checklist final antes de executar codigo

Checklist obrigatorio:

- [ ] Confirmar que o aceite sera representado por `EM_PLANEJAMENTO`
- [ ] Confirmar que nao sera criado status novo
- [ ] Confirmar que nao sera criada entidade nova
- [ ] Confirmar que nao havera alteracao de Prisma
- [ ] Confirmar que nao havera migration
- [ ] Confirmar que contrato, OS, financeiro e CRM permanecem fora do escopo
- [ ] Confirmar validacoes obrigatorias para `EM_PLANEJAMENTO`
- [ ] Confirmar mensagens de erro obrigatorias
- [ ] Confirmar regras de permissao obrigatorias
- [ ] Confirmar arquivos provaveis de alteracao
- [ ] Confirmar cobertura de testes e verificacoes minimas

## 15. Prompt recomendado para a proxima etapa de implementacao

Prompt recomendado:

`Implemente a Onda 3.4 do aceite operacional do handoff usando apenas o HandoffComercial existente. Objetivo: tratar a transição para EM_PLANEJAMENTO como aceite operacional, validando obrigatoriamente responsavelOperacionalId preenchido, pendenciasOperacionais vazio, transição de status válida e permissões compatíveis. Escopo liberado: apps/api/src/modules/operacao/handoffs.routes.ts, handoffs.schemas.ts, handoffs.service.ts, handoffs.types.ts, apps/api/src/modules/operacao/__tests__/handoffs.routes.test.ts, apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx, apps/web/src/app/(app)/operacao/handoffs/actions.ts, apps/web/src/app/(app)/operacao/handoffs/shared.ts e apps/web/src/app/api/operacao/handoffs/[id]/route.ts. Regras: não alterar Prisma, não criar migration, não criar status novo, não criar entidade nova, não mexer em contrato, OS, financeiro ou CRM. Antes de editar, liste exatamente os arquivos que pretende alterar. Depois de implementar, rode next build, tsc do apps/web e as verificações/testes seguras relacionadas ao handoff.` 
