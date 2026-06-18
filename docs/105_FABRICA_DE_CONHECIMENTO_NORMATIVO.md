# 105 — A FÁBRICA DE CONHECIMENTO NORMATIVO (agente rascunha, humano assina, motor consulta)

> Desenho realista da consolidação do núcleo. Não é "agente mágico que cria a verdade". É uma **linha de produção** onde a máquina faz o trabalho-burro de ler/estruturar/rastrear, o **humano assina o juízo**, e o resultado vira um **fato normativo assinado** que o motor consulta — com a fonte sempre anexada. Junta a metodologia à mão (pasta `Diretrizes de Licenciamento`) com o sistema no ar.

---

## 0. A virada (a surpresa)

Três inversões que mudam tudo:

1. **O agente não escreve a verdade. Ele escreve a PERGUNTA + o RASCUNHO já citado.** A saída do agente é uma *ficha de curadoria* 90% pré-preenchida com a fonte, e 10% marcada **"PRECISA SUA DECISÃO"**. Você para de *produzir à mão* e passa a *julgar e assinar à mão* — 5–10x mais rápido, e exatamente onde mora o seu valor.

2. **Conhecimento deixa de ser CSV e vira LEDGER ASSINADO.** Cada fato carrega: fonte, ato, data, vigência, e **quem assinou**. Isso não é higiene de dado — é **ativo jurídico/comercial**: quando o cliente ou o órgão perguntar *"por que você diz que eu preciso disso?"*, você mostra o fato **assinado e datado** com a norma anexa.

3. **A base APRENDE com a operação.** Quando um caso real (processo no sistema) contradiz a base, isso vira **sinal de curadoria** — um candidato novo. A base não é curada uma vez; ela é alimentada por pesquisa **e** por casos reais. Confiabilidade **composta no tempo**.

---

## 1. A linha de produção (seus agentes, com o contrato certo)

Você já desenhou os papéis em `03_nucleo_pensante/agentes`. Eles estavam certos — faltava o **contrato** (rascunhador, não autoridade) e os **portões humanos**:

```
 FONTE BRUTA            MÁQUINA (rascunha, rastreia)           HUMANO (assina)         SISTEMA
 (350 arquivos,    ┌───────────┬───────────┬──────────┐    ┌──────────┐    ┌─────────────────┐
  leis, PDFs,      │ 01 Curador│02 Estrut. │03 Validad│    │ PORTÃO 1 │    │ FonteNormativa  │
  casos reais) ──► │  de fontes│ planilhas │ coerência│──► │ revisor  │──► │ + Regra assinada│──► MOTOR
                   │ (extrai)  │(preenche) │(checa)   │    │  assina  │    │ (RegulatoryMatrix│   consulta
                   └───────────┴───────────┴──────────┘    └──────────┘    │  + Obrigacoes)  │
                          │ 00 Orquestrador conduz              ▲          └─────────────────┘
                          │ 04 Auditor pós-carga ───────────────┘ PORTÃO 2 (auditoria amostral)
```

| Papel | Faz (máquina) | NÃO faz |
|---|---|---|
| 01 Curador de fontes | acha a norma, extrai trecho, anexa URL/página, propõe `status_vigencia` | **decidir** se é vigente |
| 02 Estruturador | preenche os campos do CSV/ficha no formato governado | inventar fundamento |
| 03 Validador coerência | cruza precedência (`105`), detecta conflito/duplicidade, marca dúvida | resolver o conflito |
| 04 Auditor pós-carga | confere amostra do que entrou × fonte | aprovar sozinho |
| **PORTÃO 1 (humano)** | **lê a ficha, decide, ASSINA** (`revisor_responsavel`) | — |

**Regra de ouro (já é a sua, `106`):** nada vira fato oficial `VIGENTE` sem passar pelo Portão 1. O agente **propõe**; você **dispõe**.

---

## 2. A Ficha de Curadoria (o artefato que a máquina entrega e você assina)

Esta é a peça central. O agente nunca te entrega "a resposta"; entrega **isto**, pronto para um SIM/NÃO:

```yaml
ficha: FC-AMB-GO-001
bloco: B01 (Licenciamento ambiental estadual — GO)
candidato_a: ObrigacaoRegulatoriaBase

# ─ pré-preenchido pela máquina (com fonte) ─
descricao:        "Licença de Operação (LO) vigente para o posto"
fundamento_legal: "Lei 20.694/2019 (GO) | CONAMA 273/2000"
orgao:            "SEMAD-GO"
fonte_primaria:   SRC-AMB-EST-GO-007   ← link p/ FonteNormativa (com URL, página, data)
trecho_extraido:  "...art. X exige licença de operação para..."  [pág. 12]
status_vigencia:  VIGENTE   (máquina inferiu; validar)
aplicabilidade:   { cnaePrefixos: ["4731"], uf: ["GO"] }
periodicidade:    QUADRIENAL
criticidade:      CRITICA
consequencia:     "Embargo / interdição"   multaMaxima: "R$ 10 mi"

# ─ o que a máquina NÃO resolve (seu juízo) ─
⚠ PRECISA SUA DECISÃO:
  - confirmar vigência da Lei 20.694/2019 (máquina não acessou o ato consolidado)
  - custoServicoRef p/ GO: [   ?   ]   ← valor real você define
  - precedência vs CONAMA 273 em caso de conflito de prazo

# ─ assinatura (Portão 1) ─
revisor_responsavel: [ ____ ]
assinado_em:         [ ____ ]
decisao:             [ APROVAR / AJUSTAR / REJEITAR ]
```

Você não escreve a obrigação. Você **revisa 1 tela e assina.** Isso é o "produzir à mão" virando "julgar à mão".

---

## 3. A ponte no código (o que falta no banco — e é pouco)

Hoje a governança vive nos CSVs de `Diretrizes` (`17_fontes_oficiais` tem fonte/vigência/revisor). O **sistema não carrega essa proveniência**. A consolidação técnica é **uma tabela + um vínculo**:

```
NOVO:  FonteNormativa  (= espelho de 17_fontes_oficiais.csv)
       { id, tipo, orgao, uf, numeroAto, dataPublicacao,
         statusVigencia, dataUltimaRevisao, revisorResponsavel,
         classificacaoAutenticidade, url, resumoCurado }

VÍNCULO:  ObrigacaoRegulatoriaBase / RegulatoryMatrix
       + fonteIds[]            ← de onde a regra vem
       + revisorResponsavel    ← quem assinou
       + vigenteAte            ← validade
```

**Efeito:** toda saída do motor passa a ser rastreável a um **fato assinado**. O diagnóstico deixa de dizer *"você precisa de LO"* e passa a dizer *"você precisa de LO — Lei 20.694/2019, SEMAD-GO, vigente, assinado por [RT] em [data], fonte [link]"*. Isso é o que torna o número **confiável de verdade** (e defensável).

---

## 4. Um bloco ponta a ponta — B01 (GO), o piloto real

```
1. FONTE BRUTA      LC 140/2011 + Lei 20.694/2019 + CONAMA 273/2000   (já em 17_fontes)
        │  01 Curador extrai trechos + URL + página
        ▼
2. FICHAS           FC-AMB-GO-001..00N  (uma por obrigação do bloco)   ← máquina rascunha
        │  03 Validador checa precedência (105) e duplicidade
        ▼
3. PORTÃO 1         você lê, ajusta custo/vigência, ASSINA             ← SUA MÃO (rápida)
        │  carga (107_CONTRATO_MODULO_IMPORTACOES)
        ▼
4. SISTEMA          FonteNormativa ← 17_fontes
                    RegulatoryMatrix ← enquadramento GO
                    ObrigacaoRegulatoriaBase ← obrigações assinadas
        │  04 Auditor confere amostra × fonte (Portão 2)
        ▼
5. MOTOR usa        diagnóstico do posto GO cita a fonte assinada       ← já no ar
```

Tudo isto **encaixa em tabelas que já existem** (`RegulatoryMatrix`, `ObrigacaoRegulatoriaBase`) + **uma nova** (`FonteNormativa`). Não é refazer o sistema — é alimentá-lo com base assinada.

---

## 5. O loop que faz a base aprender (a parte que ninguém tem)

```
  motor usa fato F  ──►  caso real (Processo no sistema) ──► órgão exigiu Y que F não previa
                                      │
                                      ▼
                            sinal de curadoria  ──►  ficha-candidata "revisar F / criar G"
                                      │  (alimenta a fábrica de novo, com SUA assinatura)
                                      ▼
                            base v(n+1)  — mais fiel que v(n)
```

Os **35 arquivos de "casos reais"** (`07_referencias_externas/04`) e os processos vivos viram **professores da base**. A confiabilidade não é estática — ela **sobe a cada caso conduzido**.

---

## 6. O que é máquina × o que é SUA mão (divisão honesta)

| Etapa | Máquina | Sua mão |
|---|---|---|
| Ler 350 arquivos, extrair, citar | ✅ tudo | — |
| Preencher os campos no formato governado | ✅ tudo | — |
| Detectar conflito/precedência/duplicidade | ✅ aponta | — |
| **Decidir vigência, custo real, interpretação** | propõe | ✅ **você assina** |
| Carregar no sistema | ✅ tudo | — |
| Auditar amostra | ✅ aponta | ✅ você confirma |

Sua mão encolhe de "escrever tudo" para "**assinar o que importa**". Isso é alcançável. O resto é fantasia, e eu não vou te vender.

---

## 7. Escopo realista (sem boiar no oceano)

- **Um bloco primeiro**: B01 (Licenciamento ambiental — GO). `VALIDADO_MINIMO`/P1 na sua matriz.
- **Uma UF**: GO (piloto `110`).
- **Critério de "pronto"**: o diagnóstico de um posto GO real sai **citando fonte assinada** ponta a ponta.
- Só depois: B03 (urbano), B04 (bombeiros), B02 (dossiê)… seguindo a `18_matriz_blocos`.

> Um bloco 100% correto, assinado e ligado ao motor **vale mais** que dezesseis pela metade.

---

## Resumo numa frase
> A "fábrica" não cria conhecimento sozinha — ela **transforma seu juízo em escala**: a máquina lê e rascunha com a fonte na mão, você assina, e cada fato assinado alimenta o motor *e* aprende com cada caso real. O agente que você queria sempre foi este: não um que *sabe*, mas um que *prepara para você decidir rápido*.
