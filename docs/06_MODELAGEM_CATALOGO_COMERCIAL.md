# 06_MODELAGEM_CATALOGO_COMERCIAL

Este documento estabelece o modelo arquitetural definitivo para a integração do Catálogo de Serviços e Motor Regulatório da `INTERFACE` no monorepo oficial (`Posto/sistema`), convertendo inteligência front-end em domínio de banco de dados (Prisma).

---

## 1. Modelo atual do projeto oficial

O schema Prisma atual do `/Posto/sistema` possui um rascunho de modelagem comercial focado principalmente em consultorias baseadas em horas e compliance regulatório:

- **`ServicoConsultoriaBase`**: Estrutura simples. Possui `horasTecnicasBase`, `fatorComplexidade`, `valorReferenciaHora`. Não comporta preços fechados, custos operacionais fixos, recorrência ou margem de lucro.
- **`PoliticaPrecificacaoDiagnostico`**: Excelente entidade multi-tenant com multiplicadores (ex: `portePequenoMultiplier`, `situacaoIrregularMultiplier`, `potencialAltoMultiplier`) usada para compor propostas customizadas.
- **`ObrigacaoRegulatoriaBase`**: Mapeia as obrigações estáticas por UF e Tipo de Empreendimento.
- **Relações**: `ServicoConsultoriaBase` pode pertencer a uma `ObrigacaoRegulatoriaBase`. A política de precificação pertence a um `Tenant`. Nenhuma delas possui vínculos com cotações ou funil de vendas (CRM).

---

## 2. Modelo vindo da INTERFACE

O ecossistema legado em React/Vite apresenta uma maturidade de precificação em lote e pacotes muito superior:

- **`HabilisService`**: Um mapa mestre estático de 47 serviços (ex: MCE, PGRS, Outorgas). Engloba custo de execução (`internalCost`), margem esperada (`margin`), faixa de preço (`minPrice`, `maxPrice`, `basePrice`) e gatilhos documentais. Modelou o conceito de recorrência.
- **`ProposalDraft`**: O output do carrinho de compras. Possui parcelamentos (`milestones`), descontos globais, itens faturáveis amarrados aos serviços e fluxos de estado.
- **`RegMatrixRow`**: O "Cérebro" do diagnóstico. Relaciona CNAEs com pontuação de risco, órgãos fiscalizadores e sugere automaticamente serviços.
- **`BudgetConsistencyValidation`**: Lógica de integridade orçamentária (evita cobrar EIA/RIMA e RAS ao mesmo tempo).
- **Mapas (Risk/Indicator/License)**: Arrays de relação M:N inferidos via TypeScript para guiar a UI de recomendação comercial.

---

## 3. Decisão arquitetural

A decisão estratégica é **EVOLUIR a entidade atual**. 
A abordagem de "criar uma nova e preservar a antiga" geraria confusão técnica imediata ("devo usar `ServicoCatalogo` ou `ServicoConsultoriaBase`?"). 

Como `ServicoConsultoriaBase` não está amplamente acoplada a fluxos em produção críticos (sendo essencialmente uma tabela de catálogo), iremos modificá-la:
- Renomear logicamente de `ServicoConsultoriaBase` para `ServicoCatalogo` (no Prisma Model), mapeando para a mesma tabela via `@@map("servicos_consultoria_base")` se desejarmos manter a retrocompatibilidade do banco, ou idealmente recriar a tabela se o seed for descartável.
- Inserir as métricas transacionais e comerciais derivadas do `HabilisService`.
- Acoplar os multiplicadores de `PoliticaPrecificacaoDiagnostico` na camada Service do Fastify, gerando a `PropostaComercial`.

---

## 4. Proposta de entidades

Para comportar a Onda 2, o `schema.prisma` deverá receber/modificar as seguintes models:

1. `ServicoCatalogo` (Evolução do ServicoConsultoriaBase)
2. `MatrizRegulatoriaCnae` (Nova Tabela Master/Global)
3. `PropostaComercial` (Nova Entidade Transacional / Tenant)
4. `ItemProposta` (Nova Entidade Transacional / Tenant)
5. `DiagnosticoComercial` (Nova Entidade / Tenant)

---

## 5. Estrutura das entidades (Detalhes)

### A. ServicoCatalogo (Tabela Global / Seedada)
*Substitui `ServicoConsultoriaBase`. Tabela não-tenant (global) pois a Habilis atua como franqueadora de conhecimento.*
- **Campos e Tipos**: 
  - `id` (UUID), `codigo` (String Unique), `nome` (String), `descricao` (Text).
  - `categoria`, `subcategoria`, `esfera` (Enums ou String).
  - `complexidade` (Enum: BAIXA, MEDIA, ALTA).
  - `precoBase`, `precoMinimo`, `precoMaximo` (Decimal).
  - `custoInternoEstimado`, `margemLucroAlvo` (Decimal). **[SENSÍVEL: Apenas Backend]**.
  - `recorrente` (Boolean), `mesesRecorrencia` (Int).
  - `documentosComerciais`, `passosOperacionais` (String/JSON).
  - `obrigacaoBaseId` (FK ObrigacaoRegulatoriaBase).
- **Frontend Público**: Nomes, preços sugeridos, entregáveis.
- **SENSÍVEL**: Margem de lucro e custo interno NUNCA viajam para o JSON da Proposta no front.

### B. MatrizRegulatoriaCnae (Tabela Global / Seedada)
*Mapeia o Risco do IBGE.*
- **Campos e Tipos**:
  - `id` (UUID), `cnaeCodigo` (String Unique), `descricao` (String).
  - `classeRisco` (Enum), `potencialPoluidor` (Enum).
  - `scoreRiscoBase` (Int).
  - `servicosSugeridosIds` (String[]).
- **Relações**: Pode ser consultada pelo Backend em memória (Cache) ao avaliar um Lead.

### C. PropostaComercial (Tabela por Tenant)
*O orçador "ProposalDraft" persistido.*
- **Campos e Tipos**:
  - `id` (UUID), `tenantId` (FK Tenant).
  - `empreendimentoId` (FK Empreendimento - opcional se for Lead).
  - `leadId` (String Opcional - para CRM futuro).
  - `numeroDaProposta` (String Gerada).
  - `status` (Enum: RASCUNHO, ENVIADA, EM_NEGOCIACAO, APROVADA, REJEITADA, VENCIDA).
  - `subtotal`, `descontoTotal`, `acrescimos`, `valorTotalFinal` (Decimal).
  - `metodoPagamento`, `condicoesParcelamento` (JSON / String).
  - `dataEmissao`, `dataValidade` (DateTime).
  - `resumoExecutivo` (Text).
- **Relações**: 1:N com `ItemProposta`. N:1 com `Tenant`, `Empreendimento`.
- **Índices**: `[tenantId, status]`.

### D. ItemProposta (Tabela por Tenant)
*As linhas do orçamento.*
- **Campos e Tipos**:
  - `id` (UUID), `propostaId` (FK).
  - `servicoCatalogoId` (FK ServicoCatalogo - null se for avulso/custom).
  - `tituloPersonalizado` (String).
  - `quantidade` (Int).
  - `valorUnitarioAplicado` (Decimal).
  - `fatorMultiplicadorAplicado` (Decimal).
  - `valorTotalLinha` (Decimal).
  - `removivel`, `editavel` (Boolean - para travamentos do comercial).

---

## 6. Plano de migration futuro

- **Tabelas a Alterar**: `ServicoConsultoriaBase` receberá novos campos via comando `ALTER TABLE`. Alternativamente, a tabela pode ser limpa (`TRUNCATE`) e receber a nova estrutura, já que ainda não tem acoplamento transacional forte no banco de produção.
- **Tabelas a Criar**: `PropostaComercial`, `ItemProposta`, `MatrizRegulatoriaCnae`.
- **Riscos**: Interromper o uso atual de `ServicoConsultoriaBase`. 
- **Rollback**: Manter a tabela original intacta antes do deploy. Executar `prisma migrate dev` garantindo que nenhuma view no front atual dependa diretamente dela.

---

## 7. Plano de seed futuro

- O arquivo `habilis-services.ts` possui 47 itens engessados em código. Eles serão exportados para um JSON limpo e lidos por um arquivo `/prisma/seeds/catalogo.seed.ts`.
- **Versionamento do Catálogo**: A entidade `ServicoCatalogo` será alimentada por um "Upsert" pelo campo `codigo` (`LIC-001`). 
- **Evitando duplicidade**: O Upsert previne serviços duplicados.
- **Valores**: Os valores em R$ e margens devem ser lidos do Seed Oficial, e poderão ser sobrepostos por modificadores da `PoliticaPrecificacaoDiagnostico` por Tenant.

---

## 8. Plano de API futuro

A lógica não vai mais morar no React. O Fastify assumirá:

- **Endpoints de Catálogo**: 
  - `GET /api/comercial/catalogo` (Traz os serviços sem expor margem de lucro e custo interno).
- **Endpoints de Diagnóstico Comercial**:
  - `POST /api/comercial/diagnostico/cnae` (Recebe um CNAE, consulta a `MatrizRegulatoriaCnae`, passa pelos modificadores da política de diagnóstico, e devolve o risco e a lista sugerida de `ServicoCatalogo`).
- **Endpoints de Proposta**:
  - `POST /api/comercial/proposta` (Cria draft).
  - `PATCH /api/comercial/proposta/:id/item` (Adiciona/remove serviço e recalcula totais via backend, proibindo que o front altere valores abaixo do limite de margem).

---

## 9. Plano de frontend futuro

No projeto `/apps/web/src`, deveremos recriar as telas da `INTERFACE`:

- **Tela de Catálogo**: Apenas listagem de busca global para consulta de "balcão".
- **Tela de Triagem Comercial (Handoff)**: Formulário inteligente que dispara chamadas ao endpoint de diagnóstico ao inserir o CNAE.
- **Tela de Orçamento (Builder)**: A UI do carrinho de compras. Ao adicionar serviços, não recalcula preços no client-side; aciona `PATCH /proposta` e reflete o `valorTotalFinal` devolvido pela API, garantindo segurança na precificação.

---

## 10. Recomendação final

A **Onda 2.2 concluiu a análise e o desenho arquitetural**. A decisão técnica suporta escalar o SaaS com precificação inteligente centralizada no Backend.

- **Posso avançar para a migration?** A documentação está madura o suficiente para transformar os tópicos em código.
- **Validação humana necessária**: É preciso que o usuário verifique e aprove se a entidade `ServicoConsultoriaBase` pode ter seus dados (se existirem) expurgados ou alterados drasticamente no banco atual.
- **Primeira migration segura**: A primeira etapa real será alterar a tabela de catálogo em `schema.prisma`, rodar o prisma format, o prisma generate e confirmar a sanidade do banco.
