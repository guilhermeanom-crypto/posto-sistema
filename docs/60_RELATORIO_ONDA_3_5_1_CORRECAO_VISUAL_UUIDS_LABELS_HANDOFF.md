# 60. Relatorio da Onda 3.5.1 - Correcao Visual de UUIDs e Labels Operacionais do Handoff

## 1. Objetivo da subetapa

Executar a Onda 3.5.1 com foco exclusivo na camada de apresentacao do modulo de handoffs, removendo exposicoes visuais de UUIDs, IDs internos e enums crus, sem alterar:

- Prisma;
- migration;
- status;
- entidade;
- contrato dos proxies;
- regra de aceite operacional validada na Onda 3.4.

## 2. Arquivos alterados

Arquivos alterados nesta subetapa:

- `apps/web/src/app/(app)/operacao/handoffs/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`

Arquivos preservados nesta subetapa:

- `apps/web/src/app/api/operacao/handoffs/route.ts`
- `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`

## 3. UUIDs removidos visualmente

### Listagem `/operacao/handoffs`

Foram removidos da leitura padrao da tela:

- exibicao de `propostaComercialId` abaixo do numero da proposta;
- exibicao de `responsavelComercialId`;
- exibicao de `responsavelOperacionalId`.

Ajustes complementares de legibilidade:

- filtros deixaram de explicitar `ID` e `UUID` no texto visivel;
- placeholders passaram para linguagem de busca avancada por referencia, em vez de expor o termo UUID diretamente;
- coluna de responsaveis passou a usar estados amigaveis:
  - `Responsável comercial definido`
  - `Responsável operacional atribuído`
  - `Responsável operacional não atribuído`

### Detalhe `/operacao/handoffs/[id]`

Foram removidos da leitura padrao da tela:

- `propostaComercialId`;
- `empreendimentoId`;
- `responsavelComercialId`;
- `responsavelOperacionalId`;
- `leadWhatsAppId`.

Tambem foi removido:

- fallback visual com recorte de UUID em `Responsável atual (...)`.

Substituicoes aplicadas:

- `Responsável atual (...)` foi substituido por `Responsável atual já atribuído`;
- bloco operacional passou a usar leitura amigavel:
  - `Responsável comercial definido no repasse`
  - nome real do responsavel operacional quando disponivel;
  - fallback neutro `Responsável operacional atribuído` ou `Não atribuído` quando necessario.

## 4. Enums mapeados para labels amigaveis

Mapeamentos introduzidos em `shared.ts`:

- `origemProposta`
  - `TRIAGEM_CNAE` -> `Triagem de CNAE`
  - `CRM` -> `CRM comercial`
  - `ONBOARDING` -> `Onboarding comercial`
  - `MANUAL` -> `Cadastro manual`

- `statusPropostaOrigem`
  - `APROVADA` -> `Aprovada`

- `permissions.perfil` e `usuario.perfil`
  - `EXECUTIVO` -> `Executivo`
  - `COORDENADOR` -> `Coordenador`
  - `ANALISTA` -> `Analista`
  - `ANALISTA_CAMPO` -> `Analista de campo`
  - `ADMIN_TENANT` -> `Administrador do tenant`
  - `SUPER_ADMIN` -> `Super administrador`
  - `REPRESENTANTE_POSTO` -> `Representante do posto`
  - `ATRIBUÍDO` -> `Atribuição preservada`

- `riscoNivel`
  - `BAIXO` -> `Baixo`
  - `MEDIO` -> `Médio`
  - `ALTO` -> `Alto`
  - `CRITICO` -> `Crítico`

- `potencialPoluidor`
  - `BAIXO` -> `Baixo`
  - `MEDIO` -> `Médio`
  - `ALTO` -> `Alto`

- `esfera`
  - `FEDERAL` -> `Federal`
  - `ESTADUAL` -> `Estadual`
  - `MUNICIPAL` -> `Municipal`

## 5. Pontos que permaneceram dependentes de payload futuro

Permanecem dependentes de enriquecimento futuro do payload:

- exibir nome real do `responsavelComercial` na listagem e no detalhe;
- exibir nome real do `responsavelOperacional` na listagem sem depender de fallback neutro;
- substituir referencia interna de `empreendimentoId` por nome ou codigo operacional do empreendimento;
- remodelar os filtros tecnicos para busca verdadeiramente amigavel, sem depender de referencias internas no endpoint atual.

Observacao importante:

- nesta subetapa nao houve limpeza nem reducao do payload dos proxies;
- a correcao foi deliberadamente limitada a apresentacao, conforme o escopo aprovado.

## 6. Validacoes executadas

### Validacao de abertura das rotas do web

Ambiente usado:

- API local em `http://127.0.0.1:3001`
- web local em `http://127.0.0.1:3200`
- autenticacao com usuario demo do tenant

Resultados:

- `/operacao/handoffs` abriu com `200`;
- `/operacao/handoffs/[id]` abriu com `200`.

### Validacao visual em DOM hidratado

Foi executada inspecao do DOM hidratado em Chrome headless autenticado via DevTools.

Resultados observados:

- listagem:
  - nenhum UUID encontrado por regex no texto renderizado;
  - labels antigos como `Proposta Comercial ID`, `Responsável comercial ID` e `Responsável operacional ID` nao apareceram;
  - linhas relevantes capturadas no DOM:
    - `Handoffs Comerciais`
    - `Responsável comercial definido`
    - `Responsável operacional atribuído`
    - `Responsável operacional não atribuído`

- detalhe:
  - nenhum UUID encontrado por regex no texto renderizado;
  - labels antigos como `Proposta ID`, `Empreendimento ID` e `Lead WhatsApp ID` nao apareceram;
  - linhas relevantes capturadas no DOM:
    - `Proposta de Triagem de CNAE aprovada e entregue para condução operacional.`
    - `Número da proposta: ...`
    - `Status comercial: Aprovada`
    - `Origem do handoff: Triagem de CNAE`
    - `Responsável comercial: Responsável comercial definido no repasse`
    - `Responsável operacional: Analista Demo`

### Validacao funcional do fluxo via proxy do web

Foi executada validacao controlada via:

- backend real para criacao de fixtures;
- proxy autenticado do web para leitura e `PATCH` do handoff.

Resultados:

- bloqueio sem responsavel:
  - mensagem confirmada:
    - `Defina um responsável operacional antes de aceitar este handoff.`

- bloqueio com pendencias:
  - mensagem confirmada:
    - `Resolva ou remova as pendências operacionais antes de avançar para preparação.`

- aceite com persistencia:
  - `status` persistido como `EM_PLANEJAMENTO`;
  - `responsavelOperacionalId` persistido;
  - `pendenciasOperacionais` persistido como lista vazia;
  - `observacoesOperacionais` persistido apos releitura do detalhe pelo proxy.

## 7. Resultado dos testes e checks

### Build do web

Comando executado:

- `./node_modules/.bin/next build`

Diretorio utilizado:

- `apps/web`

Resultado:

- passou.

### TypeScript do web

Comando executado:

- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`

Diretorio utilizado:

- `apps/web`

Resultado:

- passou.

Observacao tecnica:

- o `tsc` do web depende dos tipos gerados em `.next`;
- por isso, a checagem valida foi considerada apos o build bem-sucedido do Next.

### Teste da API de handoffs

Comando executado:

- `./node_modules/.bin/vitest run src/modules/operacao/__tests__/handoffs.routes.test.ts`

Diretorio utilizado:

- `apps/api`

Resultado final:

- `16` testes passando.

Observacao de ambiente:

- a primeira tentativa em sandbox falhou por acesso bloqueado ao PostgreSQL em `localhost:5432`;
- a execucao valida foi refeita fora do sandbox, como ja havia ocorrido na Onda 3.4.

## 8. Confirmacao sobre a regra da Onda 3.4

Confirmacoes objetivas:

- nenhuma regra de transicao para `EM_PLANEJAMENTO` foi alterada;
- nenhum bloqueio sem `responsavelOperacionalId` foi alterado;
- nenhum bloqueio com `pendenciasOperacionais` foi alterado;
- nenhuma persistencia do aceite operacional foi alterada;
- nenhum contrato dos proxies foi alterado nesta subetapa;
- nenhum acionamento de contrato, OS, financeiro ou CRM foi introduzido;
- Prisma, migration, status e entidade permaneceram intactos.

## 9. Conclusao

**Onda 3.5.1 concluida com sucesso.**

Resultado pratico:

- a UI de handoffs deixou de expor visualmente UUIDs e IDs internos na leitura padrao das duas telas auditadas;
- enums tecnicos passaram a ser exibidos com labels operacionais amigaveis;
- o fluxo validado na Onda 3.4 permaneceu funcional, inclusive nos bloqueios e no aceite com persistencia;
- pontos ainda dependentes de payload futuro ficaram explicitamente limitados a enriquecimento de exibicao, nao a regra de negocio.
