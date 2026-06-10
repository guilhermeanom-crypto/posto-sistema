# 48. Onda 3.3.1 - UI de criação do Handoff na proposta

## 1. Objetivo

Implementar a primeira subetapa de código da UI mínima do `HandoffComercial`, adicionando a ação de criação do handoff na tela de detalhe da proposta comercial, sem alterar backend e sem abrir ainda a área completa de operação.

## 2. Arquivos alterados

- `apps/web/src/app/(app)/comercial/propostas/actions.ts`
- `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx`

## 3. Action criada/alterada

### 3.1 Action criada

Foi criada a action:

- `iniciarHandoffOperacional(propostaId: string)`

Responsabilidades:

- consumir `POST /api/v1/comercial/propostas/:id/handoff`
- encapsular o retorno com resultado tipado
- mapear erros de negócio para estados utilizáveis pela UI
- revalidar a listagem e o detalhe da proposta após sucesso

### 3.2 Action auxiliar criada

Também foi criada:

- `podeIniciarHandoffOperacional()`

Responsabilidade:

- ler a sessão atual do frontend
- verificar se o perfil está entre os autorizados para iniciar o handoff

Perfis considerados:

- `EXECUTIVO`
- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

## 4. Onde o botão foi posicionado

Foi criada uma nova seção visual chamada:

- `Transição comercial → operação`

Posicionamento atual na tela:

- dentro do detalhe da proposta
- como bloco dedicado antes da área de dados comerciais
- separado da edição comercial e sem mistura com contrato, OS, financeiro ou onboarding

Botão exibido:

- `Iniciar handoff operacional`

## 5. Regras de exibição aplicadas

O botão aparece somente quando:

- a proposta está em `APROVADA`
- o frontend conseguiu identificar que o perfil atual pode iniciar handoff
- ainda não existe handoff ativo conhecido na sessão atual

O botão não aparece quando:

- a proposta ainda não está em `APROVADA`
- o perfil atual não tem permissão
- o handoff acabou de ser criado com sucesso
- a tentativa anterior retornou conflito de handoff já existente

Observação:

- nesta subetapa não foi criada busca prévia de handoff por proposta
- portanto, o estado de `handoff já existente` passa a ser conhecido quando o `POST` retorna conflito

## 6. Estados visuais implementados

### 6.1 Estado inicial

- seção visível com explicação do handoff
- resumo da elegibilidade atual
- botão disponível quando aplicável

### 6.2 Carregando

- botão troca para `Iniciando...`
- interação é bloqueada durante a chamada

### 6.3 Sucesso

Após criação:

- feedback positivo exibido
- status inicial do handoff exibido
- link exibido para `/operacao/handoffs/[id]`
- botão ocultado

### 6.4 Handoff já existente

- mensagem informativa exibida
- botão ocultado

### 6.5 Proposta não aprovada

- mensagem contextual exibida na própria seção
- botão não aparece

### 6.6 Sem permissão

- mensagem contextual exibida na própria seção
- botão não aparece

### 6.7 Erro genérico

- alerta de erro exibido sem quebrar a tela da proposta

## 7. Erros tratados

Mapeamentos implementados na action/UI:

- proposta não aprovada
- handoff ativo já existente
- sem permissão
- sessão expirada / não autenticado
- erro genérico da API

Mensagens principais:

- `O handoff operacional só pode ser iniciado após a aprovação da proposta.`
- `Esta proposta já possui handoff operacional em andamento.`
- `Seu perfil não possui permissão para iniciar o handoff operacional.`
- `Sua sessão expirou. Faça login novamente para iniciar o handoff operacional.`
- `Não foi possível iniciar o handoff operacional no momento.`

## 8. Validações executadas

### 8.1 Typecheck do frontend

Executado com binário local, já que `pnpm` não estava disponível no PATH do ambiente:

```bash
node node_modules/typescript/bin/tsc --noEmit
```

Resultado:

- typecheck executado com sucesso

### 8.2 Lint do frontend

Tentativa realizada:

```bash
node node_modules/next/dist/bin/next lint
```

Resultado:

- não foi possível concluir a validação
- o comando entrou em setup interativo de ESLint do Next.js
- como esta etapa não incluía configuração de lint do projeto, a execução foi interrompida

## 9. Restrições preservadas

Não houve:

- criação de listagem de handoffs
- criação de detalhe operacional de handoff
- criação de formulário `PATCH`
- alteração de backend
- criação de endpoint novo
- criação de tarefa
- criação de processo
- criação de documento
- disparo de onboarding
- mistura da UI com contrato, OS ou financeiro

Também não foram expostos:

- margem
- custo interno
- valor hora
- metadata bruta
- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`

## 10. Pendências para a próxima etapa

- implementar a listagem operacional mínima de handoffs
- criar a área `/operacao/handoffs`
- criar o detalhe operacional `/operacao/handoffs/[id]`
- decidir se o frontend passará a consultar handoff existente por proposta antes do clique, quando a listagem/detalhe estiverem disponíveis
- revisar lint do frontend quando o setup oficial de ESLint do app estiver fechado

## 11. Conclusão

A primeira subetapa da UI mínima foi implementada com sucesso:

- a tela de detalhe da proposta agora possui uma seção de transição comercial para operação
- a action de criação do handoff foi integrada
- a UI já trata sucesso, conflito, falta de permissão e erro genérico
- a navegação para o futuro detalhe operacional já ficou preparada por link
