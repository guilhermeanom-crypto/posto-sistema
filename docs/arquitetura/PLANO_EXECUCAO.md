# Plano de Execução — Posto Compliance / Padrão de Gestão Integrada

> **Premissa**: 2 desenvolvedores backend/full-stack. Estimativas em **dev-semanas** (1 dev × 1 semana = 1 unidade).
> **Princípio**: cada fase termina **deployável** e com **valor entregue**, mesmo que parcial. Nada de "big bang".

## Princípios estratégicos

1. **Padrão antes de feature**: camadas transversais (Workflow, Documentos, Alertas, Audit) saem antes dos módulos consumirem.
2. **Coexistência durante migração**: tabela legada vira *view* sobre o modelo novo até deprecação. Zero downtime.
3. **Bugs visíveis (B1-B4)** entram na Fase 0.
4. **`empreendimentoId` global filter** entra cedo — impacto cross-cutting.
5. **Cada fase tem "Definition of Done" mensurável**.
6. **Paralelização** quando módulos não dependem entre si.
7. **Carga de produção real** entra a partir da Fase 7.

## Mapa de dependências

```
                       Fase 0 (Estabilização + B1-B4)
                                   │
                       Fase 1 (Fundações Transversais: C7, C6, C4)
                                   │
                       Fase 2 (Workflow Engine + M1 Licenças)
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
           Fase 3a (M2)       Fase 3b (M3)       Fase 3c (M4)
                └──────────────────┼──────────────────┘
                                   ▼
                       Fase 4 (M5 Fiscalizações)
                                   │
                       Fase 5 (C2 Calendário + C5 Score + C3 360°)
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
           Fase 6a (M6)       Fase 6b (M7)       Fase 6c (M8)
                └──────────────────┼──────────────────┘
                                   ▼
                       Fase 7 (M9 + M10 + M11 paralelo)
                                   │
                       Fase 8 (M12 Funcionários)
                                   │
                       Fase 9 (Hardening + Go-Live)
```

## Cronograma consolidado

| Fase | Conteúdo | Esforço (dev-sem) | Calendário (2 devs) | Acumulado |
|---|---|---:|---:|---:|
| 0 | Estabilização + B1-B4 | 2 | 1 sem | 1 sem |
| 1 | C7 + C6 + C4 (fundações) | 13 | 6.5 sem | 7.5 sem |
| 2 | C1 + M1 (workflow + Licenças) | 12 | 6 sem | 13.5 sem |
| 3 | M2 + M3 + M4 paralelo | 24 | 12 sem | 25.5 sem |
| 4 | M5 (Fiscalizações) | 8 | 4 sem | 29.5 sem |
| 5 | C2 + C5 + C3 (transversais finais) | 13 | 6.5 sem | 36 sem |
| 6 | M6 + M7 + M8 paralelo | 10 | 5 sem | 41 sem |
| 7 | M9 + M10 + M11 paralelo | 8 | 4 sem | 45 sem |
| 8 | M12 (Funcionários) | 2 | 1 sem | 46 sem |
| 9 | Hardening + Go-Live | 6 | 3 sem | 49 sem |
| **Total** | | **98** | **~49 sem ≈ 11.5 meses** | |

## Detalhamento por fase

### Fase 0 — Estabilização e bugs visíveis (1 sem)
- B1: corrigir formatação BRL em Fiscalizações
- B2: corrigir contagem KPI Funcionários
- B3: seed de templates de Checklist
- B4: replicar PGRS para todos os empreendimentos
- Filtro global de empreendimento + middleware
- Auditoria de `empreendimentoId` obrigatório
- Setup CI/observability + documentação arquitetural viva

### Fase 1 — Fundações transversais (6.5 sem)
- **C7 AuditLog**: hash encadeado, particionamento mensal, exportador certificado
- **C6 Documentos**: centralização, FTS, retenção legal, indexação por OCR
- **C4 Alertas**: 3 níveis (Regra/Alerta/Entrega), escalonamento, multi-canal

### Fase 2 — Workflow Engine + Módulo 1 (6 sem)
- C1: `DefinicaoFluxoProcesso` versionado, `TransicaoProcesso`, handlers de efeito
- M1: `ExigenciaProcesso`, `RecursoProcesso`, `DependenciaProcesso`, fluxos LP/LI/LO/LO-R
- Migração: `LicencaAmbiental` → view sobre `Processo`

### Fase 3 — Módulos 2, 3, 4 (12 sem em paralelo)
- M2: SASC com `AtivoPosto`, `SistemaArmazenamento`, `EnsaioTecnico`
- M3: SIMP, INMETRO/lacre/verificação, conciliação
- M4: Pessoa+Vínculo+Cargo+Matriz, Aptidão computada, eSocial S-2210/2220/2240

### Fase 4 — Módulo 5 Fiscalizações (4 sem)
- Processo sancionador + Penalidade composta
- `PrazoProcessual` com motor `PrazoCalculator` + calendário UF
- Embargo como estado derivado bloqueia operação

### Fase 5 — Camadas transversais finais (6.5 sem)
- C2 Calendário: providers por módulo + materialização
- C5 Score: subscores + algoritmo transparente + histórico
- C3 360°: cache + widgets + visões por papel

### Fase 6 — Módulos 6, 7, 8 (5 sem em paralelo)
- M6 Outorga, M7 Urbano, M8 Monitoramento

### Fase 7 — Módulos 9, 10, 11 (4 sem em paralelo)
- M9 MTR/CDF, M10 PGRS, M11 Checklists

### Fase 8 — Módulo 12 (1 sem)
- Funcionários como projeção pura de M4

### Fase 9 — Hardening + Go-Live (3 sem)
- Carga real (50 postos × 12 meses)
- E2E completos + performance budget + pen-test
- Treinamento + go-live faseado (piloto → ondas)

## Estratégia de migração

**Princípio**: coexistência, não big-bang. Tabelas legadas viram views.

| Legado | Novo | Estratégia |
|---|---|---|
| `LicencaAmbiental` | `Processo` (subtipo) | View de compatibilidade |
| `CondicaoLicenca` | `Condicionante` + `CicloCondicionante` | Backfill |
| `Tanque` | `AtivoPosto` (classe TANQUE) | View |
| `BombaAbastecimento` | `AtivoPosto` (BOMBA) + `BicoBomba` | View + split |
| `TesteEstanqueidade` | `EnsaioTecnico` | View |
| `Funcionario` | `Pessoa` + `VinculoEmpregaticio` | View |
| `MTR` | `MTRV2` | View |
| `CCR` | `CDF` | View |
| `AutoInfracao` | `AutoInfracaoV2` + `ProcessoSancionador` | View + wrap |
| `RecursoAdministrativo` | `RecursoProcessoSancionador` | Backfill |
| `PocoArtesiano` | `CaptacaoHidrica` | View |
| `LaudoAgua` | `LaudoAguaV2` | View |
| `AlvaraUrbanistico` | `AlvaraUrbanoV2` | View |
| `DocumentoSST` | `ProgramaSST` | View |

## Registro de riscos

| ID | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---:|---:|---|
| R1 | Migração de licenças quebra dados | Média | Alto | Dry-run staging + backup + rollback documentado |
| R2 | eSocial homologação atrasa | Alta | Médio | Iniciar adapter cedo + ambiente isolado |
| R3 | Cálculo de prazo perde caso = multa milionária | Baixa | Crítico | 200+ casos de teste + revisão jurídica |
| R4 | Performance do 360° degrada | Média | Alto | Tabela cache + budget + carga real cedo |
| R5 | Catálogo de normas por UF incompleto | Alta | Médio | Cobrir SP/MG/RJ/GO + flag não-catalogada |
| R6 | Aptidão SST com cálculo errado | Média | Alto | Auditoria + recalc por evento + override manual |
| R7 | OCR impreciso | Alta | Baixo | Sempre apresentar como sugestão |
| R8 | LGPD: vazamento de dado sensível | Baixa | Crítico | Criptografia + acesso por papel + pen-test |
| R9 | Rejeição de usuários | Média | Médio | Treinamento + transição gradual |
| R10 | Workflow Engine bug crítico | Baixa | Crítico | Cobertura >90% + revisão por par + deploy gradual |

## Decisões pendentes

12 decisões arquiteturais (5 módulo + 7 transversal). Ver [README](./README.md).
