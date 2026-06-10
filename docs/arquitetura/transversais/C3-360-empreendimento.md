# Camada Transversal C3 — 360° do Empreendimento

> Página de aterrissagem do gestor por posto. Inverte: posto → tudo sobre ele.

## Decisão transversal nº3
360° é **composição declarativa de widgets**, cada um consumindo API contratual leve. Layout configurável por papel. Deve carregar em **<2s** com 100% dos dados via **agregadores cacheados** (`Resumo360Empreendimento`).

## Estrutura da página

```
/postos/[empreendimentoId]
├─ HEADER
│   ├─ Nome + endereço + CNPJ + bandeira + status operacional
│   ├─ Banner CRÍTICO (se há embargo/interdição vigente — vermelho)
│   ├─ Score de compliance (badge grande, com nível e tendência)
│   └─ Ações rápidas: Nova obrigação | Novo documento | Ver histórico
├─ TABS
│   ├─ Visão geral (default — composição de cards)
│   ├─ Linha do tempo
│   ├─ Documentos (biblioteca filtrada)
│   ├─ Pessoas (M12)
│   ├─ Infraestrutura (M2 — diagrama SASC)
│   ├─ Processos regulatórios (M1, M6, M7)
│   ├─ Operação ANP (M3)
│   ├─ Fiscalizações (M5)
│   ├─ Resíduos (M9 + M10)
│   ├─ Auditoria (C7)
│   └─ Configurações
└─ FOOTER
    └─ Última atualização, próxima recálculo do score
```

## Widgets da Visão Geral

| Widget | Fonte | Atualização |
|---|---|---|
| Score de compliance | C5 | Cron 1h |
| Próximas 5 obrigações | C2 | Cron 5min |
| Alertas abertos | C4 | Tempo real |
| Licenças vigentes + semáforo | M1 | Cron 1h |
| Infraestrutura SASC | M2 | Cron 1h |
| ANP/INMETRO + SIMP | M3 | Cron 1h |
| SST (% aptos + programas + acidentes 12m) | M4 | Cron 1h |
| Fiscalizações + valor em jogo | M5 | Tempo real (prazos) |
| Outorga + Monitoramento | M6 + M8 | Cron 1h |
| Urbano (alvará + AVCB + sanitária) | M7 | Cron 1h |
| Resíduos (MTRs + conciliação + meta) | M9 + M10 | Cron 1h |
| Checklists (% executados no ciclo) | M11 | Cron 30min |

## Modelo (cache)

```prisma
model Resumo360Empreendimento {
  empreendimentoId String @id
  scoreCompliance Int; nivelCompliance String
  
  licencasVigentes Int; licencasVencendo Int; licencasVencidas Int
  ativosOperacionais Int; ativosInterditados Int; ensaiosVencendo Int
  bombasOperacionais Int; bombasInterditadas Int
  simpStatusMesAtual String         // ENVIADO | PENDENTE | FORA_PRAZO
  pessoasAptas Int; pessoasInaptas Int; acidentes12m Int
  processosFiscaisAbertos Int
  prazoMaisProximo DateTime?; valorMultasEmJogo Decimal? @db.Decimal(14,2)
  embargoVigente Boolean
  outorgaStatus String?; pgrsStatus String?
  checklistsExecutadosCiclo Int; checklistsTotalCiclo Int
  
  ultimoRecalculoEm DateTime
  hashEntrada String                // detecta mudança
}
```

## Performance
- Recálculo por **evento** (mudança em entidade do posto dispara fila com debounce 30s) + **cron 1h**.
- Cada widget faz **1 query** ao resumo + lazy load para detalhes.
- Alvo: **<500ms** resumo + **<1.5s** widgets renderizando.

## Visões por papel
- **Executivo / Diretoria**: cards macro.
- **Compliance Officer**: tudo + filtros + war room.
- **RT**: programas, condicionantes, ensaios.
- **Gerente do posto**: pessoas, ativos, checklists.
- **Auditor**: tudo em leitura + linha do tempo + dossiê.

## Casos de borda
1. Posto recém-cadastrado: onboarding com checklist do que falta.
2. Posto desativado: 360° em modo "histórico/somente leitura".
3. Posto em embargo: banner sobrepõe tudo.
4. Falha em algum widget: placeholder "indisponível", não derruba a página.

## Perguntas abertas
1. Customização de layout por usuário (drag-drop) v2?
2. Exportar 360° como PDF (relatório executivo) v1?
3. Compartilhar 360° com link público (token) — risco LGPD.
