# Arquitetura — Posto Compliance

Documentação arquitetural completa do sistema, organizada em **módulos de domínio** + **camadas transversais** + **plano de execução**.

## Como ler

1. Comece pelo [Plano de Execução](./PLANO_EXECUCAO.md) — visão sequenciada com fases, dependências e gates.
2. Os 5 **módulos fundadores** (1–5) definem padrões reutilizáveis que os demais consomem.
3. Os módulos 6–12 reaproveitam padrões e são mais concisos.
4. As 7 **camadas transversais** amarram tudo e devem ser implementadas em pontos específicos do plano.

---

## Módulos de domínio

| # | Módulo | Padrão arquitetural definido |
|---|---|---|
| 1 | [Licenças Ambientais](./modulos/01-licencas-ambientais.md) | Workflow Engine genérico (define) |
| 2 | [Estanqueidade / SASC](./modulos/02-estanqueidade-sasc.md) | Sistema de ativos + Ensaio (define) |
| 3 | [ANP / INMETRO / Bombas](./modulos/03-anp-inmetro.md) | Obrigação recorrente externa (define) |
| 4 | [SST](./modulos/04-sst.md) | Pessoa + Aptidão computada (define) |
| 5 | [Fiscalizações / Autos](./modulos/05-fiscalizacoes.md) | Prazo fatal + Penalidade composta (define) |
| 6 | [Outorga Hídrica](./modulos/06-outorga-hidrica.md) | Captação + Outorga (consome M1) |
| 7 | [Regulatório Urbano](./modulos/07-regulatorio-urbano.md) | Alvará + Vistoria (consome M1) |
| 8 | [Monitoramento Solo/Água](./modulos/08-monitoramento.md) | Campanha recorrente + Intervenção (consome M1, M3) |
| 9 | [Logística Reversa (MTR/CDF)](./modulos/09-logistica-reversa.md) | Conciliação MTR↔CDF (consome M3) |
| 10 | [PGRS](./modulos/10-pgrs.md) | Plano-mestre versionado (consome M1, M9) |
| 11 | [Checklists Operacionais](./modulos/11-checklists.md) | Protocolo padronizado (transversal a M1, M2, M3, M4) |
| 12 | [Funcionários (projeção SST)](./modulos/12-funcionarios.md) | Projeção pura sobre M4 |

## Camadas transversais

| # | Camada | Função |
|---|---|---|
| C1 | [Workflow Engine](./transversais/C1-workflow-engine.md) | Motor de processo regulatório |
| C2 | [Calendário Unificado](./transversais/C2-calendario-unificado.md) | Agenda agregada de obrigações |
| C3 | [360° do Empreendimento](./transversais/C3-360-empreendimento.md) | Dashboard consolidado por posto |
| C4 | [Sistema de Alertas](./transversais/C4-sistema-alertas.md) | Notificações + escalonamento |
| C5 | [Score de Compliance](./transversais/C5-score-compliance.md) | Indicador agregado transparente |
| C6 | [Biblioteca de Documentos](./transversais/C6-biblioteca-documentos.md) | Catálogo + busca + retenção |
| C7 | [Audit Trail](./transversais/C7-audit-trail.md) | Trilha imutável de auditoria |

## Plano de execução

[PLANO_EXECUCAO.md](./PLANO_EXECUCAO.md) — 9 fases, ~98 dev-semanas, 12 decisões arquiteturais a aprovar.

---

## Decisões arquiteturais (síntese)

| # | Tema | Camada | Status |
|---|---|---|---|
| 1 | Licença Ambiental como `Processo` (unificar) | M1 | Aguardando |
| 2 | `AtivoPosto` + `SistemaArmazenamento` + `EnsaioTecnico` | M2 | Aguardando |
| 3 | Separar domínio metrológico (INMETRO) do comercial-regulatório (ANP) | M3 | Aguardando |
| 4 | Pessoa + Vínculo + Aptidão computada | M4 | Aguardando |
| 5 | Processo Sancionador + Penalidade composta + PrazoProcessual | M5 | Aguardando |
| T1 | Workflow versionado + handlers de efeito | C1 | Aguardando |
| T2 | Calendário como projeção via providers | C2 | Aguardando |
| T3 | 360° via tabela cache + widgets contratuais | C3 | Aguardando |
| T4 | Alertas em 3 níveis + escalonamento | C4 | Aguardando |
| T5 | Score transparente com pesos por módulo | C5 | Aguardando |
| T6 | Documento centralizado + FTS + retenção | C6 | Aguardando |
| T7 | AuditLog + hash encadeado + exportador | C7 | Aguardando |
