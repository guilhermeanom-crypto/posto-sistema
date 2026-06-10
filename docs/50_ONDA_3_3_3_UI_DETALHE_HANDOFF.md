# 50. Onda 3.3.3 - UI de detalhe operacional do handoff

## 1. Objetivo

Implementar a tela de detalhe operacional do `HandoffComercial`, consumindo a API de detalhe já existente e exibindo o contexto saneado do handoff sem abrir ainda a etapa de atualização via `PATCH`.

## 2. Arquivos criados/alterados

- `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/actions.ts`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`

## 3. Endpoint consumido

Endpoint utilizado:

- `GET /api/v1/operacao/handoffs/:id`

Uso:

- carregar o detalhe operacional do handoff pelo `id`
- tratar estados de permissão, não encontrado e erro genérico

## 4. Blocos visuais implementados

Blocos criados na tela:

- cabeçalho do handoff
- contexto da proposta
- contexto de contato
- contexto técnico resumido
- serviços aprovados
- bloco operacional
- datas e marcos temporais

## 5. Campos exibidos

Campos principais exibidos:

- `numeroProposta`
- `status`
- `origemProposta`
- `criadoEm`
- `assumidoEm`
- `concluidoEm`
- `canceladoEm`
- `nomeLead`
- `empresaLead`
- `emailContato`
- `telefoneContato`
- `municipio`
- `uf`
- `cnaePrincipalCodigo`
- `cnaePrincipalDescricao`
- `riscoNivel`
- `riscoScore`
- `potencialPoluidor`
- `licenciamentoTipo`
- `orgaoCompetente`
- `esfera`
- `alertasResumo`
- `proximosPassosResumo`
- `servicosResumo`
- `responsavelComercialId`
- `responsavelOperacionalId`
- `pendenciasOperacionais`
- `observacoesOperacionais`

Campos auxiliares também exibidos por contexto:

- `propostaComercialId`
- `leadWhatsAppId`
- `empreendimentoId`
- `statusPropostaOrigem`
- `dataAprovacaoProposta`
- `dataValidadeProposta`
- `documentoLead`

## 6. Estados visuais

### 6.1 Carregando

- mensagem simples:
  - `Carregando handoff operacional...`

### 6.2 Erro

- alerta visual de erro
- cobre:
  - sessão expirada
  - sem permissão
  - erro genérico de carregamento

### 6.3 Não encontrado

- estado dedicado com mensagem:
  - `Handoff operacional não encontrado`

### 6.4 Detalhe carregado

- exibição completa do handoff em blocos separados
- sem qualquer controle de edição nesta subetapa

## 7. Links internos

Links implementados:

- retorno para:
  - `/operacao/handoffs`
- link para proposta original:
  - `/comercial/propostas/[propostaComercialId]`

Observação:

- o detalhe operacional já se conecta de volta à origem comercial sem misturar UI com contrato, OS ou financeiro

## 8. Complementos feitos em actions/shared

### 8.1 `shared.ts`

Foram adicionados:

- tipo `HandoffComercialDetalhe`
- tipo `ServicoResumoHandoff`

### 8.2 `actions.ts`

Foi adicionada:

- `buscarHandoffOperacionalPorId(id)`

Responsabilidades:

- consumir o endpoint de detalhe
- mapear:
  - `nao_autenticado`
  - `sem_permissao`
  - `nao_encontrado`
  - `erro_generico`

## 9. Restrições preservadas

Não houve:

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

- o app web continua com comportamento anterior de setup interativo do ESLint via Next.js
- como esta subetapa não incluía configuração de lint, a validação documental foi mantida apenas com typecheck

## 11. Pendências para a próxima etapa

- implementar a atualização operacional controlada com `PATCH /api/v1/operacao/handoffs/:id`
- criar formulário para:
  - `status`
  - `responsavelOperacionalId`
  - `pendenciasOperacionais`
  - `observacoesOperacionais`
- aplicar regras visuais de ação sensível por perfil
- avaliar melhoria futura para trocar IDs de responsáveis por nomes amigáveis

## 12. Conclusão

O detalhe operacional do handoff foi implementado com sucesso:

- a tela já consome o endpoint correto
- organiza o conteúdo em blocos operacionais claros
- expõe apenas dados saneados
- prepara a base para a próxima subetapa de atualização operacional controlada
