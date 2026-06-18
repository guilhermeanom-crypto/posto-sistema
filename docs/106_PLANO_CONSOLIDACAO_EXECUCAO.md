# 106 — PLANO DE CONSOLIDAÇÃO E EXECUÇÃO (mapa único, neutro)

> Documento-âncora. Consolida tudo o que foi construído/decidido e desenha o caminho realista para as duas metas, com pouco tempo e dinheiro, **sem re-arquitetura e sem fantasia**. Onde houver afirmação técnica, ela foi verificada no código (✅) ou está marcada como inferência (🔎). Atualizado 2026-06-17.

---

## 1. O que o sistema É (verificado)

SaaS de gestão regulatória multi-tenant. 4 apps (API Fastify, web Next, site, worker BullMQ), ~45 módulos, 88 tabelas, ~90 telas. **No ar, 468 testes de API verdes.** ✅
Tem um **motor de diagnóstico genérico por CNAE** (enquadramento + 2 eixos de risco + obrigações condicionais com base legal) — hoje com **dados calibrados só para posto**. ✅

---

## 2. As duas metas (o norte, fixo)

- **Meta 1 — Análise justificada por fato** (sair da "planilha que gera alerta" → para "obrigação X, porque Y, base legal Z, consequência W").
- **Meta 2 — Multi-empreendimento** (qualquer setor por CNAE, não só posto).

**Princípio de custo (regra realista):** a **máquina é barata** (já é genérica); o **dado é caro** (curar regras de cada setor = tempo humano). Logo: setor novo entra **um por vez, só quando houver cliente real.**

---

## 3. Conhecimento consolidado (o que já sabemos — e o status de cada peça)

| Fonte | Contém | Status |
|---|---|---|
| `docs/101` Blueprint | desenho do motor (2 eixos, aplicabilidade) | **FUNDAÇÃO ATIVA** |
| `docs/102` Backlog | itens abertos (ondas 2/3/4 etc.) | REFERÊNCIA |
| `docs/103` Mapa dos 5 motores + convergência A-E | a duplicação e como convergir | **PLANO ATIVO** (é o Passo 1) |
| `docs/104` Prontuário/aggregate root | re-arquitetura do sistema | ⛔ **VISÃO PARKADA** (não executar agora) |
| `docs/105` Fábrica de conhecimento/agentes | subsistema de curadoria | ⛔ **VISÃO PARKADA** |
| pasta `Diretrizes de Licenciamento` | base normativa + **governança** (fonte/vigência/precedência/revisor) + material bruto | **REFERÊNCIA / fonte do Passo 3** |

**Estado dos 5 motores** (de `103`): fonte única `modules/diagnostico` (ALVO ✅) · cockpit eixos (LEGADO, alimenta dashboard) · comercial (DB-first + fallback) · onboarding gap-analysis (já discrimina por aplicabilidade ✅) · budget-preview (a unificar).

**Decisões fixas do estrategista:** cadastro mínimo com defaults "ESTIMADO" · pesos de risco assinados · migração incremental zero-downtime · orçamento diagnosis-driven · segurança por empreendimento (helper `empreendimento-access.ts` criado e aplicado em ~7 módulos).

---

## 4. O CAMINHO DE EXECUÇÃO (barato → caro)

### PASSO 1 — As telas leem o motor justificado *(entrega a Meta 1)*
O motor já produz análise justificada; faltam telas que ainda leem os motores "planilha".
| # | O que muda | Onde (verificado) | Esforço | Risco |
|---|---|---|---|---|
| 1a | Cabeçalho/eixos do empreendimento deriva do motor | `web .../empreendimentos/[id]/page.tsx` (hoje usa `safeDiag → /cockpit/diagnostico`) ✅ | médio | médio (tela no ar) |
| 1b | Painel de risco do dashboard lê o motor | `web .../dashboard/page.tsx` (idem) ✅ | médio | médio |
| 1c | Onboarding/Motor de Orçamento mostra base legal por obrigação | já discrimina (Fase A) ✅; falta exibir o "porquê" | baixo | baixo |
| 1d | Segurança por empreendimento nos módulos restantes + testes IDOR | `docs/103 §5` (helper já existe) | baixo-médio | baixo |

**Pronto quando:** abrir qualquer empreendimento e ver *"obrigação — porque se aplica — base legal — consequência"*, não uma lista de alertas. E usuário restrito não vê posto alheio.

### PASSO 2 — Catálogo por CNAE, não por "posto" *(habilita a Meta 2)*
| # | O que muda | Onde | Esforço |
|---|---|---|---|
| 2a | Consumidores filtram por `aplicabilidade` (CNAE), não por `tipoEmpreendimento` | gap-analysis já faz ✅; estender aos demais | baixo |
| 2b | Documentar o "contrato de obrigação" (aplicabilidade + base legal + consequência + custoRef) válido p/ qualquer setor | `seed/obrigacoes-regulatorias.ts` | baixo |

**Pronto quando:** cadastrar um empreendimento de outro CNAE e o motor **enquadrar sem código novo** (só faltando o dado do setor).

### PASSO 3 — Carregar 1 setor novo, com cliente real *(prova a Meta 2)*
| # | O que muda | Onde | Esforço |
|---|---|---|---|
| 3a | Escolher setor com cliente (ex.: **outorga hídrica — Urbaniza** já no sistema) | — | decisão |
| 3b | Curar matriz + obrigações do setor com fonte/assinatura | base `Diretrizes` + sua mão | **caro (seu tempo)** |
| 3c | Carregar como dado | `seed-fundacao` / `seed-prod-diagnostico` (mecanismo existe) ✅ | baixo |

**Pronto quando:** o diagnóstico de um empreendimento **não-posto** sai justificado, com fonte.

### ⛔ O que fica PARKADO (explícito, para não voltar a drenar tempo)
Prontuário/aggregate root (104), fábrica de agentes (105), tabela `FonteNormativa`, orçamento de 2 colunas, multi-serviço amplo. **Só depois que o vertical provar — e só se houver tempo/dinheiro.**

---

## 5. Ordem e porquê
1. **Passo 1** primeiro — barato e resolve a dor visível (a "planilha"). Segurança (1d) em paralelo.
2. **Passo 2** logo após — barato, destrava qualquer setor na máquina.
3. **Passo 3** só com cliente pagante — porque é onde está o custo (curadoria).

Tudo incremental, um PR por vez, sem quebrar os 468 testes, deploy por app.

---

## 6. Riscos realistas (e mitigação)
| Risco | Mitigação |
|---|---|
| Boiar curando dado sem nunca ligar ao sistema | só carregar setor **com cliente**; sempre terminar no "diagnóstico justificado sai na tela" |
| Mexer em telas no ar | incremental + 468 testes + deploy por app (já é o modo de trabalho) |
| Voltar a perseguir a visão grande | 104/105 marcados PARKADOS aqui |
| Achar que "multi-empreendimento" = tudo pronto | não: máquina pronta ≠ setores prontos; setor = dado curado, um por vez |

---

## 7. Critério de sucesso da consolidação (definição de "feito")
- **Uma fonte de verdade**: as telas mostram a análise justificada do motor (não os motores-planilha).
- **Máquina multi-setor**: aceita qualquer CNAE sem código novo.
- **Um setor não-posto provado** (ex.: outorga), com dado curado e assinado.
- **Segurança por empreendimento fechada** + testes.
- **Sem re-arquitetura.** O sistema continua o que é — só mais coerente, justificado e genérico.

---

## Resumo em uma frase
> Consolidar = (1) fazer as telas lerem o **motor justificado** em vez da planilha de alertas, (2) deixar o catálogo **decidir por CNAE** para a máquina aceitar qualquer empreendimento, e (3) **carregar um setor novo por vez, só com cliente real**. A máquina já é multi-setor e já justifica; o trabalho é coerência + dado curado — cabe no orçamento curto desde que não se re-arquitete nem se carregue tudo de uma vez.
