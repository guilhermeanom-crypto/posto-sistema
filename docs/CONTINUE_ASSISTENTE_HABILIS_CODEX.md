# Prompt para Codex — Continuar Assistente Hábilis + Refresh Site

> **Contexto:** uma sessão anterior do Claude começou esta entrega e foi pausada antes de terminar para preservar tokens. Este documento descreve **com precisão** o que já foi feito e o que **ainda falta**. Execute o que está listado em "PENDENTE", sem refazer o que está em "JÁ ESTÁ PRONTO".

---

## ✅ JÁ ESTÁ PRONTO (não refazer)

### 1. Imagens oficiais Hábilis
Já copiadas (10 PNGs, ~20 MB total) em `apps/site/public/images/habilis/`:

```
hero-inteligencia-regulatoria-multissetorial.png
servico-mineracao-licenciamento-campo.png
servico-urbano-regularizacao-territorial.png
servico-rural-car-leitura-territorial.png
servico-industrial-licenciamento-condicionantes.png
servico-espeleologia-cavidades.png
servico-arqueologia-patrimonio-cultural.png
servico-postos-combustiveis-operacoes-reguladas.png
servico-gestao-condicionantes-conformidade.png
sistema-habilis-dashboard-regulatorio.png
```

### 2. Base de conhecimento (KB)
`apps/api/src/modules/conhecimento/habilis-postos-kb.json` — 8 módulos completos (uso-do-solo, licenciamento-ambiental, operacao-sasc, sao-efluentes, residuos-oluc-mtr-cdf, agua-outorga-esgoto, avcb-anp-obrigacoes, car). Cada módulo tem: `id, modulo, categoria, perguntas_chave, resposta_objetiva, checklist, estudos_documentos, responsabilidades, terceiros_relacionados, riscos, fontes_internas`.

### 3. API do Assistente
Já criada, registrada e **TESTADA** (retornando 200):
- `apps/api/src/modules/conhecimento/conhecimento.routes.ts` (~140 linhas)
- Registrada em `apps/api/src/app.ts:200` com prefix `/api/v1/conhecimento`
- 3 rotas funcionando:
  - `GET /api/v1/conhecimento/modulos` → lista índice
  - `GET /api/v1/conhecimento/modulos/:id` → módulo completo
  - `POST /api/v1/conhecimento/perguntar` → busca por keywords; body `{ pergunta: string, limite?: number }`; retorna até 3 módulos com campo `relevancia` (0–100%)
- Auth: `authenticate` middleware (qualquer perfil interno; **NÃO restringe a REPRESENTANTE_POSTO**)
- Busca sem IA externa — implementação igual ao mockup HTML (scoreItem por tokens + bonus para `perguntas_chave`)

**Teste rápido (já validado):**
```bash
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@postodemo.com.br","senha":"Demo@1234"}' \
  http://localhost:3001/api/v1/auth/login | jq -r '.data.accessToken')
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pergunta":"Quais estudos pede uma licença para posto?"}' \
  http://localhost:3001/api/v1/conhecimento/perguntar | jq '.data[] | {modulo, relevancia}'
# → retorna 02 — Licenciamento Ambiental (100%), 01 — Uso do Solo (54%), 05 — Resíduos (54%)
```

---

## ⚠️ PENDENTE — executar agora

### Tarefa A — Página interna `/assistente-habilis` (apps/web)

**Localização:** `apps/web/src/app/(app)/assistente-habilis/page.tsx` (criar)

**Design de referência:** o usuário enviou um HTML mockup completo numa mensagem anterior. Layout: sidebar clara + topbar + fundo pontilhado + cards brancos + KPIs + alerta vermelho + painel de consulta (input + chips de exemplos + botão laranja) + cards de resultado com checklist/estudos/terceiros/riscos/responsabilidades/fontes.

**Comportamento:**
1. Carregar lista de módulos via `GET /api/v1/conhecimento/modulos` (server component, com token via `getAccessToken()` do `@/lib/auth`)
2. Mostrar:
   - Hero: eyebrow "Base técnica de conformidade" + h1 "Assistente Técnico Hábilis"
   - Alerta vermelho informativo: "Base demonstrativa em validação interna. As respostas devem ser confirmadas conforme órgão, município, escopo contratado e documentação do cliente."
   - 5 KPI tiles: Módulos internos (= `total` da listagem), Modelos de vínculo (3), Blocos críticos (7), Responsáveis (6), Demo local (100%)
   - 5 flowSteps horizontais: 1. Pergunta · 2. Varredura · 3. Resposta · 4. Responsabilidade · 5. Fonte interna
3. Bloco "Consulta técnica" (client component separado, ex: `assistente-form.tsx`):
   - Input grande para digitar a pergunta
   - Botão "Consultar base" (laranja)
   - 7 chips de exemplos clicáveis:
     - "Quais estudos pede uma licença para posto?"
     - "O que pedir para uso do solo?"
     - "Quem executa laudo de estanqueidade?"
     - "O que verificar na caixa SAO?"
     - "Quais documentos de resíduos MTR e CDF?"
     - "Como funciona outorga para poço?"
     - "Quais terceiros entram no CAR?"
   - Ao clicar/enter, fetch `POST /api/v1/conhecimento/perguntar` com `{pergunta}` e o token
   - Renderizar resultados como cards (até 3), cada um com:
     - Top: nome do módulo + categoria + badge verde "relevância X%"
     - `resposta_objetiva`
     - Grid 2 col: Checklist principal + Estudos/documentos possíveis + Terceiros relacionados + Riscos e observações
     - Bloco "Matriz de responsabilidades" com 6 quadradinhos (habilis_assume, habilis_executa, habilis_gere, cliente, terceiros, orgao)
     - Footer: "Fontes internas: …" + botão "Abrir módulo"
4. Estado vazio: "Digite uma pergunta para visualizar a resposta estruturada."

**Estilo:** usar o padrão visual do interno (`apps/web/src/components/ui/*` shadcn — button, card, input, etc.). Cor primária do tenant é laranja (`bg-primary` etc.). Adicionar fundo pontilhado: `bg-[radial-gradient(#d9dee7_1px,transparent_1px)] bg-[size:24px_24px]` no conteúdo principal.

**Padrão de página interna:** copiar a estrutura de outra página existente como `apps/web/src/app/(app)/motor-orcamento/page.tsx` para imports, sessão, layout.

### Tarefa B — Sidebar nav

**Arquivo:** `apps/web/src/components/layout/app-sidebar.tsx` (ou `app-sidebar*` — confirmar com `find apps/web/src -name "app-sidebar*"`)

Já existe um grupo "Condução Técnica" com o link `/motor-orcamento`. **Adicionar** um novo item nesse mesmo grupo: `Assistente Hábilis` → `/assistente-habilis`. Ícone Lucide sugerido: `Brain` ou `Sparkles` ou `BookOpen`.

### Tarefa C — Refresh do site público (apps/site)

> **Estado atual:** uma sessão anterior já refatorou parcialmente `/servicos` e a home. Há **5 serviços essenciais** + **6 serviços de foco** em `apps/site/src/lib/content.ts`. As 18 imagens antigas Unsplash estão em `public/site/*.jpg`. AGORA é hora de incorporar as 10 imagens **OFICIAIS** da Hábilis (em `public/images/habilis/`) e expandir para **11 serviços** institucionais.

#### C.1 — Atualizar `apps/site/src/lib/content.ts`

Substituir `SERVICOS_PRESTADOS_ESSENCIAIS` (atualmente 5) por **11 serviços** (mapeamento exato abaixo). Manter o tipo `ServicoPrestado` e a função `iconFor()` já existentes.

```ts
// Mapeamento — atualize SERVICOS_PRESTADOS_ESSENCIAIS para esta lista de 11:
[
  {
    slug: 'licenciamento-regularizacao',
    titulo: 'Licenciamento e regularização ambiental',
    resumo: 'Estruturação de processos, licenças, relatórios, condicionantes, diligências e acompanhamento junto aos órgãos ambientais.',
    itens: ['LP, LI, LO e renovações', 'Regularização de empreendimentos em operação', 'Relatórios, memoriais e dossiês', 'Condicionantes e exigências', 'Apoio a protocolos e acompanhamento'],
    icone: 'FileText',
    imagem: '/images/habilis/servico-industrial-licenciamento-condicionantes.png',
    valor: 'Reduz prazo de licença e retrabalho com o órgão licenciador.',
  },
  {
    slug: 'outorgas-recursos-hidricos',
    titulo: 'Outorgas e recursos hídricos',
    resumo: 'Atuação sobre captações, poços, usos da água, cadastros e estudos técnicos que suportam regularização hídrica.',
    itens: ['Solicitação e renovação de outorga', 'Poços, captações e usos insignificantes', 'Estudos de demanda e suporte técnico', 'Organização documental e protocolo', 'Integração com licenciamento ambiental'],
    icone: 'Droplets',
    imagem: '/images/habilis/servico-rural-car-leitura-territorial.png', // ou imagem de água existente
    valor: 'Captação regularizada, auditável e sem risco de embargo hídrico.',
  },
  {
    slug: 'passivos-areas-contaminadas',
    titulo: 'Passivos e áreas contaminadas',
    resumo: 'Diagnóstico, investigação, planos de intervenção e encerramento técnico de áreas com passivo ambiental.',
    itens: ['Diagnóstico preliminar', 'Matriz de risco', 'Organização de laudos e investigações', 'Interface com laboratórios e terceiros', 'Plano de ação e acompanhamento'],
    icone: 'FlaskConical',
    imagem: '/images/habilis/servico-industrial-licenciamento-condicionantes.png',
    valor: 'Encerra passivo com lastro técnico e jurídico defensável.',
  },
  {
    slug: 'fauna-flora-supressao',
    titulo: 'Fauna, flora e supressão vegetal',
    resumo: 'Inventários, monitoramentos, resgate, caracterização florística e suporte técnico para intervenções vegetais.',
    itens: ['Inventário florestal', 'Autorização de supressão', 'Levantamento de fauna e flora', 'Compensações e condicionantes', 'Acompanhamento técnico'],
    icone: 'Leaf',
    imagem: '/images/habilis/servico-rural-car-leitura-territorial.png',
    valor: 'Mantém o cronograma vivo mesmo em área ambientalmente sensível.',
  },
  {
    slug: 'car-regularizacao-rural',
    titulo: 'CAR, regularização rural e leitura territorial',
    resumo: 'Cadastro Ambiental Rural, retificações, análise de APP/Reserva Legal e diagnóstico rural para empreendimentos territoriais.',
    itens: ['CAR e retificações', 'APP e Reserva Legal', 'Diagnóstico rural', 'Análise geoespacial', 'Apoio a DAI/PRA quando aplicável'],
    icone: 'MapPin',
    imagem: '/images/habilis/servico-rural-car-leitura-territorial.png',
    valor: 'Base territorial organizada para decisão ambiental e fundiária.',
  },
  {
    slug: 'patrimonio-cultural-arqueologia',
    titulo: 'Patrimônio cultural e arqueologia',
    resumo: 'Base histórica da Hábilis: FCA, AIPI, PAIPA, PAPIPA, PGPA, PAIPE, diagnóstico, prospecção, resgate e educação patrimonial.',
    itens: ['FCA', 'AIPI', 'PAIPA, PAPIPA e PGPA', 'PAIPE', 'Diagnóstico, prospecção e resgate', 'Educação patrimonial'],
    icone: 'Landmark',
    imagem: '/images/habilis/servico-arqueologia-patrimonio-cultural.png',
    valor: 'Experiência histórica da Hábilis aplicada ao licenciamento.',
  },
  {
    slug: 'espeleologia-cavidades',
    titulo: 'Espeleologia e cavidades',
    resumo: 'Leitura técnica do terreno para áreas com potencial espeleológico — cavidades naturais subterrâneas, análise geológica e suporte ao licenciamento.',
    itens: ['Potencial espeleológico', 'Cavidades naturais subterrâneas', 'Análise geológica e geomorfológica', 'Mapas e evidências de campo', 'Suporte ao licenciamento'],
    icone: 'Mountain',
    imagem: '/images/habilis/servico-espeleologia-cavidades.png',
    valor: 'Leitura técnica do terreno para reduzir risco em áreas sensíveis.',
  },
  {
    slug: 'mineracao-grandes-empreendimentos',
    titulo: 'Mineração e grandes empreendimentos',
    resumo: 'Licenciamento, condicionantes, patrimônio cultural, áreas sensíveis, inventários, relatórios e acompanhamento técnico para operações de alto risco regulatório.',
    itens: ['Licenciamento e condicionantes', 'Patrimônio cultural integrado', 'Áreas sensíveis', 'Inventários e relatórios', 'Acompanhamento técnico e dossiês'],
    icone: 'HardHat',
    imagem: '/images/habilis/servico-mineracao-licenciamento-campo.png',
    valor: 'Suporte técnico para operações com alto risco regulatório.',
  },
  {
    slug: 'urbano-obras-expansao',
    titulo: 'Urbano, obras e expansão territorial',
    resumo: 'Leitura territorial integrada à obra e à documentação para loteamentos, construção civil e projetos em expansão.',
    itens: ['Leitura territorial', 'Uso do solo', 'Licenças e autorizações', 'Loteamentos e construção civil', 'Suporte a projetos em expansão'],
    icone: 'Building2',
    imagem: '/images/habilis/servico-urbano-regularizacao-territorial.png',
    valor: 'Integra território, obra e regularidade documental.',
  },
  {
    slug: 'postos-combustiveis',
    titulo: 'Postos de combustíveis e operações reguladas',
    resumo: 'Regularidade ambiental e operacional contínua para postos: uso do solo, SASC, SAO, resíduos, outorga, AVCB e gestão de terceiros.',
    itens: ['Uso do solo e licenciamento', 'SASC e estanqueidade', 'SAO e efluentes', 'Resíduos, OLUC, MTR e CDF', 'Outorga, AVCB e terceiros', 'Gestão contínua de regularidade'],
    icone: 'Fuel',
    imagem: '/images/habilis/servico-postos-combustiveis-operacoes-reguladas.png',
    valor: 'Regularidade ambiental e operacional para postos em funcionamento.',
  },
  {
    slug: 'gestao-condicionantes',
    titulo: 'Gestão de condicionantes e conformidade',
    resumo: 'Matriz de condicionantes, controle de prazos, status report, evidências de atendimento, dossiê auditável e interface com o Sistema Hábilis.',
    itens: ['Matriz de condicionantes', 'Controle de prazos', 'Status report', 'Evidências de atendimento', 'Dossiê de conformidade', 'Interface com Sistema Hábilis'],
    icone: 'CalendarClock',
    imagem: '/images/habilis/servico-gestao-condicionantes-conformidade.png',
    valor: 'Menos vencimentos perdidos, mais evidência pronta para auditoria.',
  },
]
```

#### C.2 — Atualizar `apps/site/src/app/servicos/page.tsx`

A página já renderiza `SERVICOS_PRESTADOS_ESSENCIAIS` num grid 2-col. Apenas:
- Atualizar título: **"Serviços estruturados para reduzir risco regulatório e dar previsibilidade à operação."**
- Subtítulo: **"A Hábilis atua na organização técnica, documental e estratégica de empreendimentos que dependem de licenças, autorizações, condicionantes, estudos, cadastros e comprovações de regularidade. Cada frente pode ser contratada de forma pontual ou integrada a uma rotina de gestão."**
- CTA dos cards: **"Levar essa frente para uma conversa"** (já está correto na versão atual)
- A seção "Frentes em destaque" (que usa `SERVICOS_FOCO` da `AREAS_ATUACAO[0]`) pode permanecer — adiciona profundidade.

#### C.3 — Atualizar `apps/site/src/app/page.tsx` (home)

Mudanças mínimas para fortalecer:
- **Hero h1:** "Inteligência regulatória para empreendimentos em operação, implantação ou expansão." (substitui o atual)
- **Subtítulo:** "A Hábilis centraliza licenças, condicionantes, documentos, passivos, leituras territoriais e evidências de campo para ativos de perfis distintos, de operações recorrentes a projetos especiais."
- **Imagem hero:** adicionar `/images/habilis/hero-inteligencia-regulatoria-multissetorial.png` em algum bloco do hero (pode ser fundo discreto com gradient overlay, ou bloco lateral)
- **Sistema Hábilis section:** substituir o `SystemMockup` decorativo por `/images/habilis/sistema-habilis-dashboard-regulatorio.png` (mais real)
- **Numeros (KPIs):** atualizar para refletir base institucional — `+15 anos`, `+208 projetos` (oficial do site original), `+200 clientes`, `multissetorial`
- **Nova seção "Como a Hábilis atua":** 6 passos visuais (diagnosticar → estruturar → protocolar → acompanhar → evidenciar → manter conformidade) — pode ser uma fileira de cards minimalistas
- **Nova seção "Método Hábilis":** 6 bullets (diagnóstico técnico, matriz de pendências, plano de ação, gestão de prazos, integração de terceiros, dossiê auditável)
- **Manter** as seções de Setores, Estados, Projetos, Clientes, Valores, Notícias e CTA final que já existem.

> Não criar componentes novos — usar `VisualPanel`, `PageHero`, `BrandSignature` que já existem.

### Tarefa D — Validação

```bash
cd /home/guilherme/Projetos\ VS\ CODE/Posto/sistema

# Typecheck nos 3 apps
pnpm --filter @repo/api typecheck
pnpm --filter @posto/web typecheck
pnpm --filter @posto/site typecheck

# Smoke test API (já funciona)
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@postodemo.com.br","senha":"Demo@1234"}' \
  http://localhost:3001/api/v1/auth/login | jq -r '.data.accessToken')
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/conhecimento/modulos | jq '.total'

# Web: visitar manualmente (após login com admin@postodemo.com.br / Demo@1234)
# http://localhost:3000/assistente-habilis

# Site público: visitar
# http://localhost:3100/servicos
# http://localhost:3100/
```

### Tarefa E — Relatório final

Criar `docs/RELATORIO_ASSISTENTE_HABILIS.md` listando:
- O que foi implementado (com paths)
- Como testar
- Imagens usadas e em quais páginas
- Pendências (ex: chamada da API ainda usa palavras-chave puras, não IA semântica; falta linkar `/assistente-habilis` no portal externo, etc.)
- Sugestões de melhoria (busca semântica, expansão da base, integração com `motor-orcamento`, etc.)

---

## ⚠️ Restrições importantes

- **NÃO refatorar** outros módulos (CRM, portal do cliente já entregue, sistema interno, login). Apenas o que está listado acima.
- **NÃO inventar certificações** ou números fora do material oficial da Hábilis.
- **NÃO prometer aprovação de licença** em nenhum texto.
- **Manter a identidade histórica** da Hábilis em patrimônio cultural/arqueologia.
- **Reutilizar** componentes existentes (`VisualPanel`, `PageHero`, `iconFor`, shadcn UI) — não criar paralelo.
- Os 3 dev servers (API :3001, Web :3000, Site :3100) já estão rodando — só **tocar `apps/api/src/server.ts`** para reload da API após edits.

---

## Material de referência no projeto

- KB JSON com 8 módulos: `apps/api/src/modules/conhecimento/habilis-postos-kb.json`
- Imagens oficiais Hábilis: `apps/site/public/images/habilis/*.png` (10 arquivos)
- Manifesto das imagens (uso recomendado): `/home/guilherme/Projetos VS CODE/Posto/Pacote_Imagens_Prompt_Site_Habilis/habilis_site_prompt_imagens/manifesto_imagens.json`
- Prompt original do usuário: `/home/guilherme/Projetos VS CODE/Posto/Pacote_Imagens_Prompt_Site_Habilis/habilis_site_prompt_imagens/PROMPT_SITE_HABILIS_IMAGENS_ASSISTENTE.md`
- HTML mockup do Assistente: enviado pelo usuário em mensagem anterior (não está no disco; estilo descrito acima na Tarefa A).

---

## Credenciais demo

- Sistema interno: `admin@postodemo.com.br` / `Demo@1234` (ADMIN_TENANT)
- Portal cliente: `representante@postodemo.com.br` / `Demo@1234` (REPRESENTANTE_POSTO)
