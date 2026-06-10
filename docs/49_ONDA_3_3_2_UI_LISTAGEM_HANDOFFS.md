# 49. Onda 3.3.2 - UI de listagem operacional de handoffs

## 1. Objetivo

Implementar a listagem operacional mínima de `HandoffComercial` no frontend, consumindo a API já consolidada da Onda 3.2, sem abrir ainda a tela de detalhe operacional e sem alterar backend.

## 2. Arquivos criados/alterados

- `apps/web/src/app/(app)/operacao/handoffs/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/actions.ts`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`

## 3. Endpoint consumido

Endpoint utilizado:

- `GET /api/v1/operacao/handoffs`

Uso:

- carregar a listagem operacional
- aplicar filtros básicos
- controlar paginação simples com base no retorno de `pagination`

## 4. Campos exibidos na listagem

Campos efetivamente exibidos:

- `numeroProposta`
- `status`
- `nomeLead`
- `empresaLead`
- `municipio`
- `uf`
- `cnaePrincipalCodigo`
- `riscoNivel`
- `potencialPoluidor`
- `responsavelComercialId`
- `responsavelOperacionalId`
- `criadoEm`
- `atualizadoEm`

Campos auxiliares também mostrados para navegação/contexto:

- `propostaComercialId`
- `id` do handoff via link para rota futura de detalhe

## 5. Filtros implementados

Filtros básicos implementados:

- `status`
- `propostaComercialId`
- `empreendimentoId`
- `responsavelComercialId`
- `responsavelOperacionalId`

Comportamentos:

- filtros são editados localmente na página
- aplicação dos filtros dispara nova consulta
- limpeza dos filtros retorna ao estado inicial

## 6. Paginação

Paginação simples implementada:

- leitura do objeto `pagination` retornado pelo endpoint
- navegação por botões:
  - `Anterior`
  - `Próxima`

Informações exibidas:

- página atual
- total de páginas
- total de handoffs encontrados

Observação:

- a primeira versão mantém `limit` fixo em `20`
- isso simplifica a UI mínima sem perder aderência ao backend

## 7. Estados visuais implementados

### 7.1 Carregando

- bloco simples com mensagem:
  - `Carregando handoffs operacionais...`

### 7.2 Erro

- alerta com mensagem de erro
- cobre:
  - erro genérico de carregamento
  - sessão expirada
  - falta de permissão

### 7.3 Vazio / sem handoffs

- estado vazio dedicado
- com mensagem diferente quando:
  - não há handoffs no tenant
  - há filtros aplicados e nenhum resultado foi encontrado

### 7.4 Lista carregada

- tabela operacional com colunas mínimas
- link por item para:
  - `/operacao/handoffs/[id]`

## 8. Regras de permissão no frontend

A listagem foi preparada para leitura apenas por perfis autorizados pela API:

- `EXECUTIVO`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Tratamento implementado:

- action auxiliar verifica a sessão
- perfis sem permissão recebem mensagem de bloqueio no frontend
- a página não tenta abrir funcionalidades de mutação

## 9. Restrições preservadas

Não houve:

- criação de detalhe operacional
- criação de formulário `PATCH`
- alteração de backend
- criação de endpoint novo
- criação de tarefa
- criação de processo
- criação de documento
- disparo de onboarding
- mistura com contrato, OS ou financeiro

Também não foram expostos:

- margem
- custo interno
- valor hora
- metadata bruta
- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`

## 10. Validações executadas

### 10.1 Typecheck do frontend

Executado com binário local:

```bash
node node_modules/typescript/bin/tsc --noEmit
```

Resultado:

- typecheck executado com sucesso

### 10.2 Lint do frontend

Não foi insistido nesta etapa.

Justificativa:

- na subetapa anterior o `next lint` entrou em setup interativo de ESLint
- como o projeto ainda não fechou esse setup no app web, a etapa ficou documentada sem repetir a tentativa interativa

## 11. Pendências para a próxima etapa

- implementar a página de detalhe operacional em `/operacao/handoffs/[id]`
- consumir `GET /api/v1/operacao/handoffs/:id`
- preparar a futura atualização operacional controlada com `PATCH`
- decidir se a navegação lateral deve ganhar atalho explícito para `/operacao/handoffs` na próxima subetapa de UI
- evoluir a apresentação de responsáveis de IDs para nomes amigáveis quando a camada de dados permitir isso sem aumentar escopo

## 12. Conclusão

A listagem operacional mínima de handoffs foi implementada com:

- consumo do endpoint correto
- filtros básicos
- paginação simples
- estados visuais essenciais
- links preparados para o detalhe operacional futuro
