# Débitos Técnicos — Acompanhamento

> Problemas conhecidos, com dono e fase planejada para resolução. Atualizado à medida que a execução avança.

## Classificação
- **Crítico**: afeta correção de dados ou operação.
- **Alto**: degrada UX/performance ou cria risco futuro.
- **Médio**: qualidade de código, não bloqueia.
- **Baixo**: cosmético ou nice-to-have.

---

## Tabela

| ID | Título | Severidade | Descrição | Origem | Resolve em |
|---|---|---|---|---|---|
| DT-01 | Decimals do Prisma vêm como `string` no JSON | Alto | API serializa `Decimal` (valorMulta, capacidade, volume, etc.) como string. Frontend recebe `"12800"` em vez de `12800`. Hoje há *workarounds* locais (`Number(v)` em formatters). Corrigir na raiz: transformer global do Prisma ou serializer do Fastify. | Investigação do bug B1 (Fase 0) | **Fase 1** (C6 Documentos / fundação) |
| DT-02 | Typecheck API falha com 2 erros em `tenants.routes.ts` | Médio | `primeiroAcesso` não existe em `UsuarioCreateInput` e `nome` não existe em tipo de evento de boas-vindas. Pré-existente. | Fase 0 typecheck | **Fase 1** (setup CI strict) |
| DT-03 | Typecheck Web falha com 6 erros | Médio | `formatDateTime` não exportado em `@/lib/utils` (2 ocorrências); `useEffect`/`AlertTriangle`/`Gavel`/`temResponsavel` importados mas não usados. Pré-existente. | Fase 0 typecheck | **Fase 1** (setup CI strict) |
| DT-04 | Legacy `Funcionario` flat (sem Pessoa/Vinculo) | Alto | Schema atual força semântica errada (AUSENTE→ATENCAO vs CRITICO, KPI por página). Mitigado temporariamente com lógica correta e KPI agregado. Solução definitiva: decisão arquitetural nº4. | Bug B2 (Fase 0) | **Fase 3c** (M4 SST) |
| DT-05 | Seed não popula treinamentos + EPIs por funcionário | Médio | 102 funcionários com ASOs mas zero treinamentos/EPIs ⇒ 100% críticos. Semanticamente correto, mas ruim para demo. | Validação B2 (Fase 0) | **Fase 3c** (seed de M4) |
| DT-06 | `AutoInfracao.valorMulta` sem formatação BRL em 2 telas (corrigido pontualmente) | Baixo | Além de Fiscalizações (listagem) e detalhe, `equipamento-historico.tsx` tinha o mesmo padrão. Todos corrigidos na Fase 0, mas fica risco de replicação. Utility centralizado recomendado. | Bug B1 (Fase 0) | **Fase 1** (utility `lib/format.ts` + migrar consumidores) |
| DT-07 | 11 models operacionais sem `empreendimentoId` | Alto | `CCR`, `CondicaoLicenca`, `CicloCondicionante`, `EvidenciaTarefa`, `LaudoAgua`, `PGRSEvidencia`, `PGRSExigencia`, `RecursoAdministrativo`, `TesteEstanqueidade`. Impacta queries por posto + isolamento multi-posto. | Auditoria Fase 0 (ver AUDITORIA_EMPREENDIMENTO_ID.md) | **Fases 2–7** (cada um na fase do seu módulo) |
| DT-08 | `Alerta.empreendimentoId` e `ContatoWhatsApp.empreendimentoId` opcionais (ambíguos) | Médio | Design não decidido: tenant-wide ou por empreendimento? | Auditoria Fase 0 | **Fase 1** (C4 redesign de Alertas com nível 3 camadas) |
| DT-09 | Filtro global de empreendimento aplicado só em 2 páginas | Alto | Fase 0 implementou infraestrutura (cookie + header + action + resolver) + aplicou em Funcionários e Fiscalizações. Faltam: Estanqueidade, ANP/INMETRO, Outorga, Monitoramento, MTR, PGRS, Regulatório Urbano, Alertas, SST dashboard. | Fase 0 | **Fase 1** (propagação para as 9 páginas restantes — trabalho mecânico) |
| DT-10 | Script de lint ausente: "model operacional sem empreendimentoId" | Baixo | CI não bloqueia criação de novos models sem campo obrigatório. | Auditoria Fase 0 | **Fase 1** (scripts/lint-empreendimento-id.ts) |
| DT-11 | Duas representações coexistindo: `LicencaAmbiental` flat + `Processo` workflow | Crítico | Decisão arquitetural nº1 pendente: unificar. Enquanto não resolvido, manter lógica duplicada é risco. | Arquitetura M1 | **Fase 2** |
| DT-12 | `Tanque` + `BombaAbastecimento` + `TesteEstanqueidade` flat vs `AtivoPosto`/`EnsaioTecnico` previstos | Crítico | Decisão arquitetural nº2 pendente. Schema novo (SistemaArmazenamento, EnsaioTecnico) exige migração. | Arquitetura M2 | **Fase 3a** |
| DT-13 | Ausência de `BicoBomba`, `LacreINMETRO`, `VerificacaoINMETRO`, SIMP | Crítico | Schema M3 inteiramente por criar. Hoje `BombaAbastecimento` é flat com `ultimaCalibracao`. | Arquitetura M3 | **Fase 3b** |
| DT-14 | Ausência de `ProcessoSancionador`, `Penalidade`, `PrazoProcessual` | Crítico | Prazos fatais sem motor `PrazoCalculator` com feriados UF. Risco regulatório real. | Arquitetura M5 | **Fase 4** |
| DT-15 | Ausência de `DefinicaoFluxoProcesso`, `TransicaoProcesso` | Crítico | Workflow Engine sem handlers de efeito + versionamento. | Arquitetura C1 | **Fase 2** |
| DT-16 | Ausência de `ObrigacaoAgendada` | Alto | Calendário unificado por módulo impossível sem modelo materializado. | Arquitetura C2 | **Fase 5** |
| DT-17 | AuditLog sem hash encadeado + exportador certificado | Médio | Existe `AuditLog` imutável, mas falta integridade verificável. | Arquitetura C7 | **Fase 1** |
| DT-18 | Biblioteca de documentos sem FTS + OCR centralizado | Alto | Documento existe, faltam `sha256`, `textoExtraido`, classificacaoPrivacidade, retidoAte, FTS Postgres. | Arquitetura C6 | **Fase 1** |
| DT-19 | Sistema de alertas monolítico (Alerta sem escalonamento real) | Alto | Existem `Alerta` + `AlertaDestinatario` + `RegraAutomatica`, mas sem `RegraAlerta` versionada, `EntregaAlerta`, escalonamento temporal. | Arquitetura C4 | **Fase 1** |
| DT-20 | Score de compliance opaco (snapshot sem breakdown) | Médio | `ComplianceSnapshot` existe, mas sem pesos por módulo, sem recomendações priorizadas, sem histórico tendência. | Arquitetura C5 | **Fase 5** |
| DT-21 | Ausência de `Resumo360Empreendimento` para 360° | Alto | Sem cache materializado, 360° não atinge budget <2s. | Arquitetura C3 | **Fase 5** |

---

## Regras para adicionar novos débitos
1. Cada débito tem um ID sequencial (DT-NN).
2. Registrar **severidade** + **onde foi detectado** (fase/bug).
3. Indicar **fase onde será resolvido** (não deixar "backlog").
4. Atualizar o arquivo imediatamente ao descobrir — não acumular em memória.

## Métricas
- **Total de débitos**: 21
- **Críticos**: 5
- **Altos**: 8
- **Médios**: 6
- **Baixos**: 2

Esta lista **não substitui** os issues/tickets do board de trabalho; serve como memória arquitetural compartilhada com a documentação.
