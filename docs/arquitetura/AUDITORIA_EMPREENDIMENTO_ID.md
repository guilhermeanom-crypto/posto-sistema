# Auditoria — `empreendimentoId` obrigatório

> Executada na Fase 0. Identifica gaps no schema Prisma para o princípio "toda entidade operacional/regulatória nasce em um empreendimento específico".

## Princípio
- **Operacionais/regulatórios** ⇒ `empreendimentoId String` (obrigatório).
- **Catálogos globais ao tenant** (TipoProcesso, TipoDocumento, OrgaoRegulador, Distribuidora, etc.) ⇒ sem `empreendimentoId`.
- **Configuração compartilhada** ⇒ sem `empreendimentoId` (ex.: ChecklistTemplate). Contexto entra na execução.

## Resumo

| Métrica | Valor |
|---|---:|
| Modelos com `empreendimentoId String` (obrigatório) | 28 |
| Modelos com `empreendimentoId String?` (opcional — ambíguo) | 2 |
| Modelos sem `empreendimentoId` mas operacionais (gap) | 11 |
| Modelos sem `empreendimentoId` que são catálogos (correto) | 28 |
| **Total** | **71** |

## Gaps críticos (corrigir nas fases de cada módulo)

### Operacionais sem `empreendimentoId`

| Model | Módulo | Como derivar | Prioridade |
|---|---|---|---|
| `CCR` | M9 | `MTR.empreendimentoId` | Alta — Fase 7 |
| `CondicaoLicenca` | M1 | `LicencaAmbiental.empreendimentoId` | **Será absorvido por `Condicionante`** na Fase 2 |
| `CicloCondicionante` | M1 | `Condicionante.empreendimentoId` (já tem) | Alta — Fase 2 |
| `EvidenciaTarefa` | Cross | `Tarefa.empreendimentoId` (já tem) | Média — Fase 1 |
| `LaudoAgua` | M6 | `PocoArtesiano.empreendimentoId` | **Será absorvido por `LaudoAguaV2`** na Fase 6 |
| `PGRSEvidencia` | M10 | `PGRSExigencia → PGRS.empreendimentoId` | Média — Fase 7 |
| `PGRSExigencia` | M10 | `PGRS.empreendimentoId` | Média — Fase 7 |
| `RecursoAdministrativo` | M5 | `AutoInfracao.empreendimentoId` | **Será refeito como `RecursoProcessoSancionador`** na Fase 4 |
| `TesteEstanqueidade` | M2 | `Tanque.empreendimentoId` | **Será absorvido por `EnsaioTecnico`** na Fase 3a |

### Ambíguos (clarificar design)

| Model | Atual | Recomendação |
|---|---|---|
| `Alerta` | `empreendimentoId String?` | OK manter opcional — alerta pode ser tenant-wide (ex.: regra global) ou de empreendimento. Sistema novo `EntregaAlerta` (C4) cobre nuance. |
| `ContatoWhatsApp` | `empreendimentoId String?` | Considerar separar em `TenantContato` vs `EmpreendimentoContato`. Decisão: aguardar evolução do módulo de WhatsApp (não está em escopo Fase 0–9). |

## Decisão Fase 0
**Não corrigir agora**. Cada gap será tratado na fase do módulo correspondente, **junto com** a refatoração maior daquele módulo (decisões nº 1–5). Aplicar mudanças invasivas no schema sem refatoração maior é risco sem benefício.

## Aplicações futuras
- **Fase 1 (C4 Alertas)**: `EvidenciaTarefa.empreendimentoId` denormalizado para queries eficientes.
- **Fase 2 (M1 Licenças)**: `CondicaoLicenca` deprecada (vira `Condicionante`); `CicloCondicionante.empreendimentoId` adicionado por backfill.
- **Fase 3a (M2 SASC)**: `TesteEstanqueidade` deprecada (vira `EnsaioTecnico` com `empreendimentoId` obrigatório).
- **Fase 4 (M5 Fiscalizações)**: `RecursoAdministrativo` deprecada (vira `RecursoProcessoSancionador` ligado a `ProcessoSancionador.empreendimentoId`).
- **Fase 6 (M6 Outorga)**: `LaudoAgua` → `LaudoAguaV2` com FK direto a `CaptacaoHidrica.empreendimentoId`.
- **Fase 7 (M9 + M10)**: `CCR` → `CDF` com `empreendimentoId` obrigatório; `PGRSExigencia/Evidencia` ganham coluna.

## Verificação programática (a adicionar em CI)
Script `scripts/lint-empreendimento-id.ts` que falha se um novo model de `categoria operacional` for criado sem `empreendimentoId` — implementar na Fase 0.5 ou Fase 1.
