# 47. Onda 3.3 - Planejamento da UI mínima do Handoff Comercial

## 1. Objetivo

Abrir a Onda 3.3 com o planejamento da UI mínima do `HandoffComercial`, usando a API consolidada da Onda 3.2 sem alterar backend, sem criar automações paralelas e sem expor dados comerciais sensíveis.

## 2. Telas existentes afetadas

### 2.1 Tela de detalhe da proposta comercial

Arquivo atual identificado:

- `apps/web/src/app/(app)/comercial/propostas/[id]/page.tsx`

Impacto previsto:

- adicionar a ação de criação do handoff operacional
- adicionar o estado visual do handoff já criado
- adicionar atalho para abrir o detalhe operacional do handoff, quando existir

### 2.2 Navegação lateral da aplicação

Arquivo atual identificado:

- `apps/web/src/components/layout/app-sidebar.tsx`

Impacto previsto:

- incluir entrada para a nova área operacional de handoffs
- posicionar a entrada junto das rotas de gestão/operação, não em financeiro, contrato ou onboarding

### 2.3 Ações server-side da área comercial

Arquivo atual identificado:

- `apps/web/src/app/(app)/comercial/propostas/actions.ts`

Impacto previsto:

- criar ação para consumir `POST /api/v1/comercial/propostas/:id/handoff`
- possivelmente revalidar a página da proposta após criação do handoff

### 2.4 Nova área operacional de handoffs

Hoje ainda não existe diretório específico de UI para handoffs em `apps/web/src/app/(app)`.

Impacto previsto:

- criar área nova em operação para:
  - listagem
  - detalhe
  - atualização operacional controlada

## 3. Ação de criação do handoff na tela de detalhe da proposta

### 3.1 Ponto de entrada recomendado

Na tela `/comercial/propostas/[id]`, criar uma seção específica de transição comercial para operação, separada da edição comercial e do compartilhamento da proposta.

### 3.2 Ação principal

Botão proposto:

- `Iniciar handoff operacional`

Comportamento:

- aciona `POST /api/v1/comercial/propostas/:id/handoff`
- usa o `id` da proposta já carregada na tela
- após sucesso:
  - exibe feedback positivo
  - substitui o CTA primário por estado de handoff criado
  - mostra link para o detalhe operacional do handoff

### 3.3 Regra de exibição do botão

O botão deve aparecer somente quando:

- a proposta estiver em `APROVADA`
- o usuário tiver perfil autorizado para criação
- ainda não existir handoff ativo associado à proposta

O botão não deve aparecer quando:

- a proposta não estiver em `APROVADA`
- o usuário não tiver permissão
- já existir handoff ativo ou handoff já criado e ainda em ciclo operacional

### 3.4 Mensagens recomendadas

- proposta ainda não aprovada:
  - `O handoff operacional só pode ser iniciado após a aprovação da proposta.`
- handoff já existente:
  - `Esta proposta já possui handoff operacional em andamento.`
- sem permissão:
  - `Seu perfil não possui permissão para iniciar o handoff operacional.`

## 4. Nova área operacional de handoffs

### 4.1 Listagem

Tela nova recomendada:

- `/operacao/handoffs`

Objetivo:

- permitir visão operacional dos handoffs do tenant
- servir de porta de entrada para acompanhamento e triagem

### 4.2 Detalhe

Tela nova recomendada:

- `/operacao/handoffs/[id]`

Objetivo:

- mostrar o handoff saneado completo
- permitir atualização operacional controlada

### 4.3 Atualização operacional controlada

A atualização deve acontecer na tela de detalhe do handoff, não na listagem.

Objetivo:

- editar apenas os campos permitidos pela API
- manter a operação focada no acompanhamento do handoff, sem reabrir proposta ou fluxo paralelo

## 5. Endpoints que a UI deverá consumir

### 5.1 Criação

- `POST /api/v1/comercial/propostas/:id/handoff`

Uso:

- ação na tela de detalhe da proposta

### 5.2 Listagem

- `GET /api/v1/operacao/handoffs`

Uso:

- página de listagem operacional

Filtros mínimos previstos:

- `status`
- `propostaComercialId`
- `empreendimentoId`
- `responsavelComercialId`
- `responsavelOperacionalId`
- `page`
- `limit`

### 5.3 Detalhe

- `GET /api/v1/operacao/handoffs/:id`

Uso:

- página de detalhe operacional

### 5.4 Atualização

- `PATCH /api/v1/operacao/handoffs/:id`

Uso:

- formulário operacional do detalhe

## 6. Regras de exibição por perfil

### 6.1 Criação do handoff

Perfis que podem ver e usar o CTA de criação:

- `EXECUTIVO`
- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Perfis que não devem ver o CTA ativo:

- `ANALISTA`
- `ANALISTA_CAMPO`
- `REPRESENTANTE_POSTO`

### 6.2 Leitura operacional

Perfis que podem acessar listagem e detalhe:

- `EXECUTIVO`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Perfis bloqueados:

- `REPRESENTANTE_POSTO`

### 6.3 Atualização operacional

Perfis que podem editar no detalhe:

- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

### 6.4 Ações sensíveis no formulário

Somente:

- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Ações sensíveis:

- concluir handoff
- cancelar handoff
- alterar `responsavelOperacionalId`

Na UI, isso deve virar:

- campos desabilitados para perfis sem privilégio
- ou ocultação seletiva do controle, quando isso melhorar a clareza operacional

## 7. Estados visuais obrigatórios

### 7.1 Carregando

- skeleton ou bloco de carregamento simples
- necessário em:
  - detalhe da proposta durante verificação do estado do handoff
  - listagem de handoffs
  - detalhe do handoff

### 7.2 Erro

- mensagem contextual com ação de retry
- necessária em:
  - falha ao criar handoff
  - falha ao listar
  - falha ao carregar detalhe
  - falha ao salvar atualização operacional

### 7.3 Sem handoffs

Na listagem:

- mensagem do tipo:
  - `Nenhum handoff encontrado para os filtros aplicados.`

### 7.4 Handoff criado

Na proposta:

- estado positivo com:
  - status atual do handoff
  - link para `/operacao/handoffs/[id]`
  - indicação de que a proposta já foi entregue para a operação

### 7.5 Handoff já existente

Na proposta:

- alerta informativo, não erro fatal
- exibir:
  - status do handoff existente
  - link para abrir o handoff

### 7.6 Sem permissão

- não transformar a UI em fluxo quebrado
- preferir:
  - ocultar o CTA quando a regra for estável
  - ou exibir badge/aviso curto quando for importante mostrar que a ação existe, mas o perfil atual não pode executá-la

## 8. Campos visíveis na listagem

Campos recomendados:

- `numeroProposta`
- `status`
- `nomeLead`
- `empresaLead`
- `municipio`
- `uf`
- `cnaePrincipalCodigo`
- `cnaePrincipalDescricao`
- `riscoNivel`
- `potencialPoluidor`
- `responsavelComercialId`
- `responsavelOperacionalId`
- `criadoEm`
- `atualizadoEm`

Campos opcionais para primeira versão, se houver presenter no frontend:

- nome amigável do responsável comercial
- nome amigável do responsável operacional

Campos que não precisam entrar na listagem mínima:

- `origemSnapshotSaneado`
- `servicosResumo`
- `observacoesOperacionais` longas

## 9. Campos visíveis no detalhe

### 9.1 Cabeçalho

- número da proposta
- status do handoff
- origem da proposta
- datas principais:
  - `criadoEm`
  - `assumidoEm`
  - `concluidoEm`
  - `canceladoEm`

### 9.2 Contexto de contato

- `nomeLead`
- `empresaLead`
- `emailContato`
- `telefoneContato`
- `municipio`
- `uf`

### 9.3 Contexto técnico resumido

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

### 9.4 Serviços aprovados para operação

- `servicosResumo`
  - `nome`
  - `categoria`
  - `quantidade`
  - `unidade`, se vier futuramente
  - `escopoAprovado`
  - `observacaoOperacional`, se existir no payload

### 9.5 Bloco operacional

- `responsavelComercialId`
- `responsavelOperacionalId`
- `pendenciasOperacionais`
- `observacoesOperacionais`

## 10. Campos editáveis no formulário operacional

Campos editáveis na UI mínima:

- `status`
- `responsavelOperacionalId`
- `pendenciasOperacionais`
- `observacoesOperacionais`

Comportamentos recomendados:

- `status`:
  - select alimentado pela máquina de transição vigente
- `responsavelOperacionalId`:
  - select de usuários autorizados do tenant
  - somente habilitado para perfis com ação sensível
- `pendenciasOperacionais`:
  - lista simples de itens
  - pode começar como textarea com quebra por linha ou pequeno editor de chips
- `observacoesOperacionais`:
  - textarea livre e controlada

## 11. O que não pode aparecer na UI

Itens proibidos:

- margem
- custo interno
- valor hora
- metadata bruta
- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- dados financeiros
- contrato
- OS
- processo
- tarefa
- documento
- onboarding

Regra de UX:

- a UI do handoff deve parecer uma ponte entre comercial aprovado e operação
- não deve parecer tela de contrato
- não deve parecer tela de execução financeira
- não deve parecer tela de onboarding ou de abertura automática de posto

## 12. Ordem recomendada de implementação

### 12.1 Subetapa 1

Implementar integração na tela de detalhe da proposta:

- ação `POST` de criação
- estados:
  - carregando
  - sucesso
  - erro
  - handoff já existente
  - sem permissão

Motivo:

- esse é o ponto de entrada natural do fluxo
- entrega valor sem depender de toda a área operacional pronta

### 12.2 Subetapa 2

Implementar listagem operacional mínima:

- página `/operacao/handoffs`
- filtros básicos
- tabela simples
- navegação para detalhe

### 12.3 Subetapa 3

Implementar detalhe operacional do handoff:

- cabeçalho
- contexto saneado
- serviços aprovados
- bloco operacional

### 12.4 Subetapa 4

Implementar formulário de atualização operacional controlada:

- `PATCH`
- bloqueios por perfil
- feedback de sucesso e erro

### 12.5 Subetapa 5

Ajustar navegação lateral e atalhos internos:

- entrada própria para handoffs operacionais
- link de retorno entre proposta e handoff

## 13. Conclusão

A UI mínima do `HandoffComercial` está pronta para implementação porque:

- a API já cobre criação, listagem, detalhe e atualização controlada
- as permissões e transições já estão consolidadas
- o payload saneado já está definido
- o ponto de entrada principal no frontend já está claramente identificado na tela de detalhe da proposta

Primeira subetapa de código recomendada:

- **implementar a ação de criação do handoff na tela `comercial/propostas/[id]`**, com feedback visual e link para o detalhe operacional após sucesso.
