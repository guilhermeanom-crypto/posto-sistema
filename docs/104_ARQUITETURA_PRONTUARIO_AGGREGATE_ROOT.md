# 104 — ARQUITETURA: O PRONTUÁRIO REGULATÓRIO VIVO (Diagnostico como aggregate root)

> Desenho de consolidação. Tese: o sistema deixa de "gerir entidades" e passa a **operar o organismo regulatório de cada empreendimento no tempo**. O `Diagnostico` (cérebro) vira a coluna vertebral; `Processo` (rito) e `Condicionante` (acompanhamento) — que **já existem** — viram os órgãos ligados a ela por *derivação*, *reconciliação* e *eventos*.

---

## 0. A descoberta que torna isto REAL (não greenfield)

Os órgãos já estão no schema — só não conversam:

| Órgão | Já existe (evidência) | Falta |
|---|---|---|
| Cérebro (exame) | `Diagnostico` versionado + `DiagnosticoObrigacao` (status, consequência, multaMaxima, custoServico) | virar raiz |
| Rito (tratamento) | `Processo` (`status`, `faseAtualOrdem`, `numeroProtocolo`, `historicoFases`, `requisitos`) | ligar ao diagnóstico |
| Acompanhamento | `Condicionante` (`ciclos`, `gerarTarefaAuto`, `proximoVencimento`, `evidenciaExigida`) | fechar o loop com evidência |
| Hook do rito | `Diagnostico.fases` (Json) **vazio hoje** | projetar o estado do rito aqui |

**Conclusão:** o trabalho é **ligação + derivação**, não construção do zero. É por isso que "na realidade vai ser também".

---

## 1. Os três papéis (a separação que organiza tudo)

```
            PLANO                         EXECUÇÃO                     HISTÓRIA
   ┌─────────────────────┐      ┌──────────────────────┐     ┌────────────────────┐
   │   Diagnostico vN     │      │  Processo (rito)     │     │ EventoRegulatorio[]│
   │  (o que DEVE existir)│ ───► │  Condicionante       │ ──► │  (o filme: deriva, │
   │  determinístico      │ recon│  Tarefa (o que está  │ evt │   previsão, audit) │
   │  versionado          │ ◄─── │   sendo FEITO)       │     │  append-only       │
   └─────────────────────┘ evid └──────────────────────┘     └────────────────────┘
        aggregate root              projeções operacionais          trajetória
```

- **Diagnostico = PLANO.** Determinístico, recomputável, versionado. Diz *o que deveria existir* (obrigações aplicáveis + status + consequência + custo). É a **fonte da verdade analítica**.
- **Processo/Condicionante/Tarefa = EXECUÇÃO.** Mutáveis, tocados por humanos/órgãos. Dizem *o que está sendo feito*.
- **EventoRegulatorio = HISTÓRIA.** Append-only. É *o filme* (trajetória de risco, previsão, auditoria, input do agente).

A regra de ouro: **PLANO nunca é editado à mão; EXECUÇÃO nunca recalcula risco.** Eles se encontram na **reconciliação**.

---

## 2. A coluna vertebral: a função `reconciliar()`

O coração do organismo. Compara PLANO (último Diagnostico) × EXECUÇÃO (Processos/Condicionantes) e produz o **delta** — que É a fila de trabalho do analista e o input do agente.

```
reconciliar(empreendimentoId):
  diag = últimoDiagnostico(empreendimentoId)            # o plano
  exec = processos + condicionantes + tarefas abertas   # a execução
  para cada obrigação em diag.obrigacoes:
    estado = match(obrigação, exec) →
      • LACUNA      : gap diagnosticado, SEM processo/condicionante  → "abrir rito"
      • EM_CURSO    : gap COM processo aberto (fase atual = X)        → "acompanhar"
      • RESOLVIDO   : CONFORME com evidência válida                  → fecha loop
  órfãos = execução SEM obrigação que a justifique       → "revisar / caracterização incompleta"
  return { lacunas, emCurso, resolvidos, órfãos }
```

**Por que isto é o produto:** ninguém no mercado entrega o *delta plano×execução no tempo*. É o que transforma "lista de pendências" em "o que o analista tem que decidir agora".

---

## 3. O loop que faz o organismo respirar (fecha o ciclo)

Hoje só metade do ciclo existe (caracterização → exame). A evolução fecha o anel:

```
  caracterização física muda ─┐
  (CNAE, tanque, aquífero)     │  gatilho (JÁ EXISTE: agendarRecalculoDiagnostico)
                               ▼
                        ┌─────────────┐
                        │ Diagnostico │ ── deriva ──►  AÇÕES (abrir Processo / Condicionante)
                        │  (recalcula)│                         │
                        └─────────────┘                         ▼
                               ▲                          execução do rito
                               │                          (protocolo, fase, deferimento)
            evidência ─────────┘                                │
   (Processo DEFERIDO, Condicionante CUMPRIDA, Licença EMITIDA) ◄┘
```

**O elo que falta hoje:** quando um `Processo` é deferido ou uma `Condicionante` cumprida, isso deve entrar como **evidência** no `snapshot-builder` → o recálculo sobe a conformidade automaticamente. Exame → tratamento → **novo exame**. Esse é o anel que nenhum CRUD tem.

---

## 4. Derivação: do gap diagnosticado ao rito (o que conecta cérebro e órgão)

Cada `DiagnosticoObrigacao` em gap carrega o que precisa para *virar ação*:

| Campo (já existe) | Vira |
|---|---|
| `codigo` + `motivoAplicabilidade` | qual rito/ação abrir |
| `periodicidadeDerivada` | recorrência da condicionante/tarefa |
| `consequencia` + `multaMaxima` | a coluna "exposição evitada" do orçamento |
| `custoServico` | a coluna "custo de agir" (semente) |

Mapa de derivação (tabela de regras, não código solto): `obrigação → tipoProcesso | tipoCondicionante | tarefa`. Ex.: `AMB-001 (LO) → abre Processo(tipo=Licenciamento, órgão=enquadramento.orgaoCompetente)`; `AMB-006 (passivo) → abre Processo(tipo=Investigação CONAMA 420)`; `MON-001 (campanha) → Condicionante(periódica, gerarTarefaAuto)`.

**Princípio:** o diagnóstico **propõe**; o humano **confirma** a abertura (1 clique). Nunca cria rito às cegas — preserva juízo do analista.

---

## 5. O orçamento como PROJEÇÃO (mata o "foge muito" pela raiz)

Orçamento deixa de ser tabela divergente e vira **função pura sobre o aggregate** — recomputada, nunca uma segunda verdade:

```
orcamentoFiel(diagnostico) =
  para cada gap (obrigação A_RENOVAR | SEM_DADOS):
     CUSTO DE AGIR =
        honorários (horas × R$/h × fatorComplexidade)
      + custos diretos:
          taxaÓrgão[uf]                              ← base de fomento por UF
          laboratório(nAmostras)                     ← nAmostras = f(nPoços × parâmetros)
          perfuração(nPoços)                         ← nPoços = f(área, nTanques, classeAquífero)  ◄ CARACTERIZAÇÃO
          remediação(faixa)                          ← f(classificacaoAreaContaminada)
      + ART/RRT
     EXPOSIÇÃO EVITADA = parse(multaMaxima) + risco(embargo de consequencia)   ◄ JÁ EXISTE no diag
  →  { custoAgir: {min, provável, max}, exposicaoEvitada, ancora = exposição/custo }
```

A virada: **os drivers de custo (nº de poços, nº de amostras) saem da caracterização que o sistema JÁ coleta.** O orçamento para de ser "horas genéricas" e passa a *escalar com a física do posto*. E ganha a **segunda coluna** (exposição evitada) que transforma cotação em argumento de venda.

---

## 6. A trajetória como produto (o "filme, não foto")

`EventoRegulatorio` (append-only) — derivado dos pontos que já mudam:

```
EventoRegulatorio { empreendimentoId, tipo, refId, de, para, em, diagnosticoVersao }
  tipos: DIAGNOSTICO_RECALCULADO · RISCO_SUBIU · RISCO_DESCEU · FASE_AVANCOU ·
         CONDICIONANTE_CUMPRIDA · LICENCA_EMITIDA · OBRIGACAO_VENCENDO
```

Como o `Diagnostico` já é **versionado** (`@@unique([empreendimentoId, versao])`), a série de versões + eventos dá de graça:
- **gráfico de risco no tempo** (deriva);
- **previsão** ("em 90 dias a LO vence → cai para CRÍTICO");
- **base da assinatura** (monitoramento recorrente, não consultoria one-shot);
- **input do agente** e **trilha de auditoria** num só lugar.

---

## 7. O agente como animador (último, sobre a espinha pronta)

Com o organismo montado, o papel da IA fica trivial de definir (e poderoso):
- observa a **trajetória** → detecta deriva e dispara evento;
- lê o **delta da reconciliação** → propõe a próxima ação;
- **anima o rito**: rascunha a peça, prepara o protocolo, antecipa a exigência;
- nunca decide sozinho — opera *sobre* o prontuário, com humano no laço.

---

## 8. Plano de migração incremental (respeitando 468 testes + prod no ar)

| Fase | Entrega | Risco | Reversível |
|---|---|---|---|
| 1 | **Reconciliação read-only**: view que mostra o delta (lacuna/em-curso/órfão) ligando `DiagnosticoObrigacao` ↔ `Processo`/`Condicionante`. Não cria nada. | nenhum | — |
| 2 | **Fechar o loop**: estado operacional (Processo deferido / Condicionante cumprida) entra como evidência no snapshot-builder → recálculo sobe conformidade. | baixo | sim |
| 3 | **Derivação assistida**: do gap, botão "abrir rito" que cria `Processo`/`Condicionante` pela tabela de regras. | baixo | sim |
| 4 | **Orçamento-projeção** (2 colunas + drivers físicos + custos diretos + faixa). Aposenta budget-preview divergente. | médio | sim |
| 5 | **Timeline** (`EventoRegulatorio`) + gráfico de trajetória + previsão. | baixo (append-only) | sim |
| 6 | **Rito como máquina de estado** na UI (sobre `Processo.historicoFases` que já existe) + `Diagnostico.fases` projetado. | médio | sim |
| 7 | **Agente** anima a espinha. | médio | sim |

**Aposentadorias** (quando cada um for substituído): cockpit eixos, fallback hardcoded comercial, budget-preview como verdade paralela.

---

## 9. O que muda na forma de pensar o código

- **Um caso de uso central**: `obterProntuario(empreendimentoId)` devolve `{ diagnostico, reconciliacao, orcamento, trajetoria }` — uma chamada, um corpo. As ~45 telas viram *vistas* disso.
- **Escrita só por eventos de domínio**: caracterizou, protocolou, cumpriu, emitiu. Cada um recalcula o plano e registra evento. Nada de "editar o diagnóstico".
- **Reconciliação é o produto, não a tela.** A tela é o reflexo do delta.

---

## 10. Resumo executivo do desenho

> O `Diagnostico` deixa de ser uma tabela lida por uma aba e vira a **coluna vertebral**: o PLANO determinístico de que tudo deriva. `Processo` e `Condicionante` (que **já existem** com máquina de estado e ciclo de vida) viram a EXECUÇÃO, ligada ao plano por uma função de **reconciliação** que produz o delta — a fila de trabalho real. O **loop fecha** quando a execução vira evidência e re-alimenta o exame. O **orçamento** vira projeção fiel (custo de agir × exposição evitada, escalado pela caracterização). A **trajetória** versionada vira produto recorrente. E o **agente** anima tudo, por último.
>
> Não é um sistema novo. É o organismo que os órgãos já construídos estavam pedindo para formar.
