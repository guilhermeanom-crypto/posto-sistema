# Módulo 11 — Checklists Operacionais

> Protocolo padronizado executado sobre um alvo (empreendimento OU ativo). Item pode gerar Tarefa, alimentar evidência de condicionante, disparar fluxo em outro módulo.

## Decisão arquitetural nº11
Checklist é execução de protocolo padronizado sobre um alvo (empreendimento OU ativo específico). Resposta pode ser: simples (OK/NOK), medição (valor + unidade comparado a faixa), foto, assinatura.

## Base normativa
- **NR-20** — verificações pré-operacionais.
- **NR-1 (PGR)** — inspeções de segurança.
- **NBR 13784** — inspeção visual diária do SASC.
- **CETESB Portaria 75/2017** — verificações de descarga segura.
- **IT 25/27 do CBM** — inspeções diárias de combate a incêndio.

## Modelo (deltas)

```prisma
enum TipoItemChecklist {
  BOOLEANO ESCALA MEDIDA_NUMERICA FOTO_OBRIGATORIA TEXTO_LIVRE ASSINATURA CONTAGEM
}

// ChecklistItem ganha:
//   tipoItem TipoItemChecklist,
//   faixaEsperada Json?      // {min, max, unidade}
//   acaoSeNok Json?          // {criarTarefa: true, prioridade, responsavelPapel}
//   condicionanteVinculadaId String?  (M1)
//   ativoAlvoClasse ClasseAtivo?      (M2 — alvo do item)

// ChecklistExecucao ganha:
//   ativoAlvoId String?      // checklist sobre ativo específico
//   agendadaPara DateTime?
//   ciclo String?            // diaria-2026-04-15

// ChecklistResposta ganha:
//   valorMedido Decimal?
//   unidadeMedida String?
//   fotoDocumentoIds String[]
//   assinaturaPessoaId String?
//   tarefaGeradaId String?
```

## Templates obrigatórios (seed B3 — Fase 0 ✓ implementado)

| Template | Periodicidade | Alvo | Origem |
|---|---|---|---|
| Inspeção visual diária do SASC | Diária | Empreendimento | NBR 13784 |
| Verificação diária de bombas e bicos | Diária | Bomba (cada) | INMETRO + NR-20 |
| Descarga segura de combustível | Por carga | Tanque alvo | NR-20 + Portaria CETESB |
| Limpeza e drenagem do SAO | Mensal | SAO | CONAMA 273 |
| Verificação SPDA / aterramento | Anual | Empreendimento | NBR 5419 |
| Inspeção mensal de câmaras de contenção | Mensal | Câmara | NBR 13784 |
| Inspeção mensal de extintores e hidrantes | Mensal | Empreendimento | IT CBM |
| Teste trimestral da iluminação de emergência | Trimestral | Empreendimento | IT CBM |
| Inspeção semanal da pista | Semanal | Empreendimento | Operacional |
| Pré-turno NR-20 | Diária | Empreendimento | NR-20 |
| Inspeção mensal CIPA | Mensal | Empreendimento | NR-5 |

## Regras críticas
- **RD1**: item CRITICO em checklist ⇒ Tarefa criada automaticamente; supervisor notificado.
- **RD2**: checklist obrigatório não executado no ciclo ⇒ Tarefa de inadimplência + reflexo no score.
- **RM1**: item recorrentemente NOK em ciclos consecutivos ⇒ alerta de causa-raiz.

## Dependências cruzadas
- **M2 (Estanqueidade)**: inspeção visual SASC alimenta histórico do ativo.
- **M3 (ANP/INMETRO)**: verificação de bomba contribui para histórico.
- **M1 (Licenças)**: checklists podem ser evidências de condicionantes recorrentes.
- **M4 (SST)**: pré-turno NR-20 conecta com aptidão.

## Casos de borda
- Checklist iniciado e abandonado: limpar após X horas.
- Checklist offline (mobile sem internet): sincronização posterior.
- Ciclo perdido (posto fechado por feriado): permitir justificativa.
- Template alterado durante ciclo: execuções existentes mantêm versão anterior.

## Perguntas abertas
1. Mobile/PWA dedicado para execução em campo (câmera, GPS) — v1 ou v2?
2. Versionamento de templates — manter histórico de edits?
3. Geração de relatório consolidado mensal de não-conformidades?
