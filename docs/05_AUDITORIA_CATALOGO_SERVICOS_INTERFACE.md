# 05_AUDITORIA_CATALOGO_SERVICOS_INTERFACE

## 1. Resumo executivo

A pasta `INTERFACE` abriga uma versão altamente madura de um **Catálogo de Serviços e Motor Regulatório Comercial**, desenvolvido originalmente para o frontend via Vite + Supabase. O catálogo não é apenas uma lista de serviços, mas sim um ecossistema interligado que utiliza o CNAE, tipo de empreendimento e matrizes de risco para sugerir automaticamente os escopos de serviço necessários, calculando orçamentos através de margens de lucro, custos internos e complexidade.

Esse motor preenche exatamente a principal lacuna identificada no projeto oficial `Posto/sistema`: a ausência de um fluxo de pré-vendas (Handoff), triagem estruturada e geração de propostas automatizada.

O catálogo possui alto potencial para virar domínio real (schema Prisma) no monorepo oficial, porém, toda a sua lógica de amarração, que hoje reside em arquivos `.ts` do cliente (React) ou em Edge Functions do Supabase, precisará ser fortemente **refatorada** para tornar-se services backend seguros no Fastify, evitando a exposição de regras de precificação no navegador.

---

## 2. Arquivos analisados

| Arquivo | Existe? | Finalidade | Qualidade | Observação |
|---|---|---|---|---|
| `habilis-services.ts` | Sim | Banco de dados mestre operacional (mockado em código) contendo 47 serviços detalhados. | Alta | A modelagem é rica (contém `basePrice`, `margin`, `internalCost`, `docsComercial`, `triggers`). Substitui ou expande enormemente o modelo atual. |
| `regulatory-commercial-framework.ts` | Sim | Define o framework de etapas da jornada do cliente (Diagnóstico -> Licenciamento -> Estudos) e a validação do orçamento. | Alta | Essencial para criar a lógica de "Trilhas de Licenciamento" no backend. |
| `regulatory-engine.ts` | Sim | Motor de inteligência que cruza CNAE com matriz de risco e mapeia quais serviços são recomendados para cada obrigação. | Alta | Utiliza cache. A lógica de "cnae_code" -> "servicos_recomendados" deve virar relacionamento no Prisma. |
| `proposal-generator.ts` | Sim | Define a estrutura e os cálculos de uma Proposta Comercial (`ProposalDraft`), lidando com parcelas, descontos e itens de serviço. | Média/Alta | Focado no estado de formulários UI (ex: metadados `edited`). Precisa ser enxugado para virar entidade de banco de dados (`Proposta`). |

---

## 3. Catálogo de serviços encontrado

Foram mapeados **47 serviços base**, modelados na interface `HabilisService`. Cada serviço possui dados detalhados como:

- **Identificação**: ID (ex: `LIC-001`), Nome, Categoria, Subcategoria.
- **Domínio Legal**: Esfera (Municipal, Estadual, Federal), Órgãos (`AMMA, SEMAD-GO, IBAMA, ANA`).
- **Operacional**: Complexidade (Baixa, Média, Alta), Prazo de Referência, Profissionais exigidos, Entregável (Produto cartográfico, Licença, etc.), Passos operacionais.
- **Comercial**: Gatilhos (`triggers`), Quando Aplicar, Origem (`regulatorio` ou `manual`), Requer Diagnóstico, Tipo de Demanda.
- **Precificação**: `basePrice`, `minPrice`, `maxPrice`, `internalCost`, `margin` (ex: 60%).
- **Modelos de Venda**: Fluxo (Pontual vs Contínuo), Recorrência (ex: "R$ 1.000/mês · 12 meses").
- **Documentação**: `docsComercial`, `docsAnalista`, `docsCliente`.

*Nota: Nenhum dado está marcado como "não identificado", pois a modelagem do arquivo `habilis-services.ts` é extremamente descritiva e padronizada para todos os itens.*

---

## 4. Classificação dos serviços

Os serviços estão agrupados em 8 domínios/categorias principais:

1. **Licenciamento Ambiental**: MCE, EAS, RAS, RCA, EIA/RIMA, RAP, PCA, PRAD, PGRS/PGRCC, Licenças (LP, LI, LO), Atendimentos de diligência.
2. **Recursos Hídricos e Outorga**: Captação Superficial/Subterrânea, Lançamento de Efluentes, Irrigação, Balanço Hídrico, Teste de Vazão, Monitoramento Piezométrico.
3. **Estudos Ambientais e Passivo**: Avaliação Preliminar, Investigação Confirmatória (ICA), Investigação Detalhada (IDA), Remediação, Encerramento de Passivo.
4. **Sanitário**: PGRSS pontual.
5. **Fauna, Flora e Biodiversidade**: Inventário de Mastofauna, Avifauna, Herpetofauna, Florestal, Supressão Vegetal (PSV), Resgate de Fauna.
6. **Monitoramento Ambiental**: Ruído, Emissões (Ar), Efluentes, Água Superficial/Subterrânea, Solo e Sedimentos.
7. **Geoprocessamento e Topografia**: Levantamento Planialtimétrico, Georreferenciamento (SIGEF/INCRA), CAR, Ortomosaico por Drone.
8. **Gestão e Consultoria Ambiental**: Parecer técnico, Assessoria para licitações, Emissão de ART, Relatórios ESG, **Pacote Recorrente (Gestão Ambiental Continuada)**.

---

## 5. Regras comerciais e regulatórias encontradas

O sistema possui inteligência enraizada para conectar dados técnicos ao funil de vendas, mapeado principalmente em `regulatory-engine.ts` e mapas de constantes:

- **Regras por CNAE / Tipo de Empreendimento**: Baseado em `RegMatrixRow`, o CNAE define o Nível de Risco, Órgão Competente e as Obrigações Principais do cliente.
- **Regras de Recomendação e Dependência**: O array `recommended_environmental_services` na matriz de risco cruza com os `HabilisService` correspondentes. O motor adiciona ou trava serviços caso sejam pré-requisitos lógicos.
- **Regras de Precificação**: Cada serviço tem `minPrice`, `basePrice`, e `internalCost`. Há uma entidade chamada `BudgetConsistencyValidation` que assegura que o conjunto de serviços orçados faça sentido (ex: não cobrar duas vezes um estudo redundante).
- **Regras de Geração de Proposta**: A construção orçamentária é dividida em estágios (`diagnostico_enquadramento`, `regularizacao_licenciamento`, `estudos_condicionais`, `operacao_monitoramento`).
- **Mapas de Risco**: `RISK_SERVICE_MAP`, `INDICATOR_SERVICE_MAP`, e `LICENSE_SERVICE_MAP` mapeiam serviços críticos, altos ou baixos e criam amarrações (se a licença está vencida -> sugere `LIC-015`, `LIC-010`).

---

## 6. Comparação com o projeto oficial

**O que o projeto oficial possui:**
- Entidade `ServicoConsultoriaBase` (com campos limitados como `horasTecnicasBase`, `fatorComplexidade`, `valorReferenciaHora`).
- Entidade `PoliticaPrecificacaoDiagnostico` para lidar com multiplicadores globais (porte, potencial poluidor).
- Entidade `ObrigacaoRegulatoriaBase` atrelada de forma simples.

**O que a `INTERFACE` tem melhor:**
- Abstração riquíssima do escopo do serviço (custo interno vs preço de venda, entregáveis, passos).
- Modelagem de "Pacotes Recorrentes".
- Separação clara entre o "Custo" e o "Valor do Serviço" em si.
- Geração de Proposta (`ProposalDraft`) e Orçamento detalhado em fases.

**Lacunas que a `INTERFACE` preenche:**
- Geração comercial de funil. No momento, o projeto oficial gerencia o *Processo* a partir do momento em que foi vendido. Ele não modela o "Lead", o "Orçamento", a "Negociação" e a "Proposta assinada".

**Conflitos e Arquitetura:**
- `ServicoConsultoriaBase` no oficial é muito simples e atrelado a "horas". `HabilisService` da INTERFACE é focado em "Preço fechado/Tabela" e Margem de Lucro.
- O motor regulatório da INTERFACE roda no **Frontend**. Isso deve mudar e ir estritamente para o Fastify, pois os cálculos de orçamento não podem ser manipulados via JS do cliente.

---

## 7. Proposta de modelo de domínio

Para absorver a inteligência da `INTERFACE` no Prisma, o schema deve ser modernizado. Sugestão:

1. **`ServicoCatalogo`** (Adaptação evolutiva do `ServicoConsultoriaBase`):
   - Adicionar os campos: `precoMinimo`, `precoBase`, `precoMaximo`, `custoInterno`, `margemPadrao`, `entregavel`, `complexidade`, `exigeART`.
   - Adicionar flag: `recorrente` e `recorrenciaMeses`.
2. **`MatrizRegulatoriaCnae`** (Nova Tabela Seedada):
   - Para espelhar o `RegMatrixRow` (cnae, nivelRisco, orgaoLicenciador, etc.).
3. **`PropostaComercial`** (Nova Entidade):
   - Campos: `leadId` (ou empreendimentoId), `numeroProposta`, `status` (RASCUNHO, ENVIADA, APROVADA, REJEITADA), `valorTotal`, `desconto`, `validadeDias`, `resumoExecutivo`.
   - Relação: 1:N com `ItemProposta`.
4. **`ItemProposta`** (Nova Entidade):
   - Campos: `propostaId`, `servicoCatalogoId`, `quantidade`, `precoUnitarioBase`, `precoAplicado`, `custoEstimado`, `fatorModificador`.

---

## 8. Plano de migração futura

*(Este plano é descritivo, não será executado nesta Onda).*

### Etapa A — Normalização
- Extrair o JSON limpo dos 47 serviços presentes no `habilis-services.ts`.

### Etapa B — Modelagem Prisma
- Criar a migration evoluindo `ServicoConsultoriaBase` para `ServicoCatalogo` com as novas colunas e inserir `PropostaComercial` e `ItemProposta`.

### Etapa C — Seed
- Transformar o JSON extraído na etapa A em um script executável em `prisma/seed.ts` para popular o banco de dados oficial sem mock.

### Etapa D — API Backend (Fastify)
- Criar rotas protegidas: `GET /api/catalogo/servicos`, `POST /api/comercial/proposta/gerar`.
- Transportar o `regulatory-engine.ts` para dentro do service do Fastify, validando o budget via backend.

### Etapa E — Frontend (Next.js)
- Recriar os componentes do motor comercial (que estavam em Vite) dentro da pasta `apps/web/src`, agora conectando nas novas rotas da API em vez do Supabase.

---

## 9. Riscos

1. **Risco:** Copiar a lógica Vite/Supabase indevidamente para o Frontend.
   **Trava Preventiva:** Toda regra de cálculo e recomendação (arquivos do Motor Regulatório) deve ser transformada em classes Service no módulo `/apps/api/src/services/` (Fastify). O frontend só chama o endpoint de cálculo.
2. **Risco:** Duplicar `ServicoConsultoriaBase` com uma nova entidade `ServicoCatalogo`.
   **Trava Preventiva:** Devemos alterar a tabela existente (via migration de `ALTER TABLE`), ou criar uma nova e dropar a antiga se for mais seguro.
3. **Risco:** Exposição de margem/custo na UI.
   **Trava Preventiva:** O frontend público não pode receber as propriedades de `internalCost` nas queries de catálogo, apenas o backoffice de coordenadores.

---

## 10. Recomendação final

O catálogo da `INTERFACE` é de alto valor e deve definitivamente ser **migrado**, substituindo as estruturas básicas que hoje existem no projeto oficial.

O catálogo deve virar **tabela de banco de dados populada via Seed**, e exigirá a evolução do `ServicoConsultoriaBase` atual para incorporar as métricas comerciais. Além disso, as novas entidades `PropostaComercial` e `ItemProposta` precisam nascer.

A **próxima etapa recomendada** é a Etapa B (Modelagem Prisma e Seed). Contudo, essa próxima fase exigirá geração de migration e modificações diretas em `schema.prisma`. 

Esta fase precisa da sua aprovação humana para seguir com a inserção no código.
