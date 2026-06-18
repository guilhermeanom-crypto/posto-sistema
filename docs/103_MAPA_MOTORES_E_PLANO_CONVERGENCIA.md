# 103 — MAPA DOS MOTORES E CONSOLIDAÇÃO DO SISTEMA POSTO

> Atualizado em 2026-06-17. Este documento deixou de ser apenas um plano e passou a ser o mapa vivo da consolidação: o que existe, o que foi amarrado, o que ainda está duplicado e o que falta para o sistema ficar confiável de ponta a ponta.

---

## 1. Resumo prático para decisão

O sistema Posto já tem backend, web interna, portal do cliente, app/equipe de campo, site institucional, worker, banco, seeds, Docker, Nginx e documentação extensa.

O problema principal não era falta de tela. Era consolidação: regras parecidas espalhadas, motores de orçamento/diagnóstico em paralelo, documentação atrasada e escopo por empreendimento incompleto.

Nesta rodada foi consolidado o núcleo de segurança e coerência operacional:

- Criada regra central de acesso por empreendimento.
- Usuários agora gravam vínculos reais com empreendimentos.
- Magic link do portal agora respeita empreendimento permitido.
- Listagem/detalhe/criação de empreendimentos, processos, documentos e tarefas respeitam escopo por empreendimento.
- Equipe do empreendimento exige perfil de gestão e valida tenant.
- Pendências/evidências de campo exigem perfil de campo e escopo por empreendimento.
- Catálogo comercial admin passou a usar perfis reais do enum.
- Teste do diagnóstico comercial foi alinhado à matriz atual do banco.
- API validada com typecheck e suíte completa: 468 testes passando.

---

## 2. Status das fases do plano original

| Fase | Status real | O que já aconteceu | O que ainda falta |
|---|---|---|---|
| Fase A — gap-analysis discrimina aplicabilidade | FEITA | Gap analysis já deixou de ser apenas lista genérica. | Expandir a regra para todos os consumidores que ainda montam visão própria. |
| Fase B — caracterização | PARCIALMENTE FEITA | API, cadastro, edição e campos físicos do posto avançaram. | Transformar a aba Caracterização em questionário completo, não só resumo/form parcial. |
| Fase C — painel e comercial na fonte única | PARCIAL | Comercial consulta `RegulatoryMatrix` do banco antes do fallback. | Remover fallback hardcoded quando a matriz estiver completa para leads. |
| Fase D — orçamento único | PARCIAL | Hub já mostra orçamento vindo do fluxo diagnosis-driven. | Ainda existem fórmulas diferentes entre `diagnose.ts` e `budget-preview.service.ts`. |
| Fase E — aposentar cockpit eixos | PENDENTE | Nada definitivo. | Dashboard/cabeçalho ainda precisam derivar da fonte única. |

---

## 3. Motores ainda existentes

| Motor | Situação | Onde está | Observação prática |
|---|---|---|---|
| Diagnóstico fonte única | ATIVO / ALVO | `apps/api/src/modules/diagnostico` | Deve ser a fonte oficial de diagnóstico regulatório. |
| Comercial | ATIVO / PARCIALMENTE CONVERGIDO | `apps/api/src/modules/comercial/diagnostico.service.ts` | Usa banco primeiro e fallback hardcoded depois. Serve lead pré-cadastro. |
| Onboarding gap-analysis | ATIVO | `apps/api/src/modules/onboarding/gap-analysis.service.ts` | Já evoluiu, mas ainda precisa convergir com orçamento único. |
| Budget preview | ATIVO / DUPLICADO | `apps/api/src/modules/onboarding/budget-preview.service.ts` | Ainda calcula orçamento separado. |
| Cockpit eixos | LEGADO | `apps/api/src/modules/cockpit` | Ainda alimenta dashboard/cabeçalho e deve ser aposentado por último. |

Decisão recomendada: a fonte oficial deve ser `modules/diagnostico`. Comercial, onboarding, budget-preview e cockpit devem consumir ou derivar dela, não recalcular por conta própria.

---

## 4. Consolidação aplicada nesta rodada

### Segurança por empreendimento

Foi criado o helper central:

- `apps/api/src/shared/security/empreendimento-access.ts`

Ele define:

- Perfis com acesso total: `SUPER_ADMIN`, `ADMIN_TENANT`, `COORDENADOR`, `EXECUTIVO`.
- Perfis restritos: dependem de `empreendimentoIds`.
- Funções para montar filtros por empreendimento e bloquear acesso indevido.

Módulos já conectados a essa regra:

- `empreendimentos`
- `processos`
- `documentos`
- `tarefas`
- `pendencias`
- `evidencias`
- `auth/portal/magic-link`
- `usuarios` para gravação de vínculos

### Usuários e vínculos

Antes: o front/schema aceitava `empreendimentoIds`, mas o backend não gravava os vínculos.

Agora: criação e alteração de perfil conseguem criar/atualizar registros em `empreendimento_acessos`.

Impacto: representante, analista e analista de campo passam a ter base real para acesso restrito por posto.

### Portal

Antes: magic link podia ser gerado para um empreendimento informado no payload sem validar o escopo do solicitante.

Agora: magic link exige empreendimento permitido para o solicitante autenticado.

### App/equipe de campo

Antes: pendências/evidências eram basicamente `tenant-scoped`.

Agora: exigem perfil operacional e respeitam empreendimento permitido.

### Comercial

Antes: rota admin do catálogo conferia perfil `ADMIN`, que não existe no enum.

Agora: aceita `ADMIN_TENANT` e `SUPER_ADMIN`.

Antes: testes esperavam `OUT-015` para posto de combustível mesmo com a matriz atual dizendo `necessitaOutorga = false`.

Agora: teste segue a matriz atual do banco.

---

## 5. O que ainda precisa ser consolidado

### Prioridade 1 — aplicar escopo por empreendimento nos módulos restantes

Ainda precisam ser auditados e conectados ao helper central todos os módulos que usam `empreendimentoId`, especialmente:

- `condicionantes`
- `alertas`
- `compliance`
- `audit`
- `licencas-ambientais`
- `regulatorio-urbano`
- `sst`
- `anp-inmetro`
- `estanqueidade`
- `logistica-reversa`
- `outorga-hidrica`
- `monitoramento`
- `fiscalizacoes`
- `cockpit`
- `risco`
- `whatsapp`
- `checklists`
- `onboarding`
- `pgrs`
- `equipamentos`
- `relatorios`

Regra: qualquer rota com `empreendimentoId` precisa checar tenant e escopo do usuário.

### Prioridade 2 — orçamento único

Hoje ainda existem dois cálculos relevantes:

- `apps/api/src/modules/diagnostico/engine/diagnose.ts`
- `apps/api/src/modules/onboarding/budget-preview.service.ts`

Decisão pendente: escolher uma fórmula oficial, transformar a outra em adaptador ou removê-la.

### Prioridade 3 — cockpit legado

O dashboard/cabeçalho ainda consome eixos antigos do cockpit.

Decisão pendente: migrar para diagnóstico fonte única e aposentar o cockpit eixos como motor de decisão.

### Prioridade 4 — caracterização completa

A base já tem campos importantes, mas o fluxo ainda não é o questionário rico do sistema original.

Decisão pendente: portar o questionário em blocos para água, resíduos, emissões, tanques, localização, licenças, passivo e operação.

### Prioridade 5 — base fomento/normativa

Os CSVs em `docs/implantacao_fomento/templates_csv` ainda são majoritariamente templates e materiais de implantação.

Decisão pendente: transformar em base operacional com fonte, órgão, UF, vigência, obrigação, aplicabilidade, serviço e evidência exigida.

### Prioridade 6 — documentação

Ainda existem docs duplicados, numeração sobreposta e materiais antigos misturados com materiais vivos.

Decisão pendente: criar índice oficial e arquivar o que é histórico.

---

## 6. Validação técnica atual

Executado em 2026-06-17:

- `corepack pnpm --filter @repo/api typecheck`: passou.
- `corepack pnpm --filter @repo/api test`: passou.
- Resultado da API: 30 arquivos de teste, 468 testes passando.

Ainda recomendado:

- Rodar typecheck de `web`, `site` e `worker` após qualquer mudança compartilhada.
- Criar testes específicos de IDOR por empreendimento para os módulos restantes.
- Criar testes de papel/perfil para app de campo e portal.

---

## 7. Critério de pronto para consolidação total

O sistema só deve ser considerado consolidado quando:

- Todas as rotas com `empreendimentoId` usarem o helper central de acesso.
- Usuários restritos forem vinculados por `empreendimento_acessos`.
- Portal, campo e interno respeitarem os mesmos limites.
- Diagnóstico e orçamento tiverem uma fonte oficial.
- Cockpit legado não tomar decisão paralela.
- Base normativa/fomento estiver estruturada como dado, não como template solto.
- Documentação tiver índice vivo e docs antigas arquivadas.
- Testes cobrirem tenant, empreendimento, perfil e fluxo comercial.

---

## 8. Próxima execução recomendada

Rodada seguinte deve ser objetiva:

1. Aplicar o helper central nos módulos restantes com `empreendimentoId`.
2. Criar testes de acesso por empreendimento para pelo menos 5 módulos regulatórios.
3. Escolher a fórmula oficial de orçamento.
4. Migrar dashboard/cockpit para consumir diagnóstico fonte única.
5. Criar o índice oficial dos docs e arquivar duplicados.

Resumo: o sistema já tem corpo. A consolidação agora é fazer tudo obedecer à mesma regra, ao mesmo escopo e ao mesmo motor.
