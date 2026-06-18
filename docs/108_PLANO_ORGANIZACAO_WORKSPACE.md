# 108 — PLANO DE ORGANIZAÇÃO DO WORKSPACE (perder nada, consolidar tudo)

> Plano para reorganizar `/home/guilherme/Projetos VS CODE/` (3.884 arquivos, 15 pastas + soltos). Objetivo: estrutura padrão, caminhos previsíveis, zero perda. **Este é o PASSO 1** (organizar). Depois: consolidar conhecimento. Depois: próximos passos. NADA é executado sem seu OK — mover pastas no workspace é difícil de reverter.

---

## 1. Princípios inegociáveis (a "rede de segurança")

1. **Mover, nunca deletar.** Duplicado vai para quarentena, não para o lixo.
2. **Backup antes de tudo.** A raiz é repo git → `commit` de snapshot + um `.zip` externo. Reversível 100%.
3. **Manifesto de→para.** Toda movimentação registrada (origem → destino). Nada "some por esquecimento".
4. **Verificação por contagem.** Nº de arquivos antes == depois (3.884). Se não bater, parar.
5. **Repos aninhados são átomos.** `posto-sistema`, `posto-compliance-unico`, `itecologica` movem-se inteiros; nunca reorganizar por dentro deles.
6. **O sistema no ar não se mexe por último nem por capricho** — só se houver ganho claro (tem `.git`, deploy, paths).

---

## 2. A estrutura-alvo (taxonomia por propósito)

```
Projetos VS CODE/                    (raiz = repo git)
├── 00_MANIFESTO.md                  índice ÚNICO de tudo (de→para + status)
├── 01_PRODUTO/                      o sistema vivo
│   └── posto-sistema/               (= Posto/sistema; deployado)
├── 02_CONHECIMENTO/                 base normativa curada
│   ├── 00_governanca/               (de Diretrizes/02 — fonte/vigência/precedência)
│   ├── 01_modelo/                   base_modelo_conhecimento.json (FORMATO CANÔNICO)
│   ├── 02_blocos/                   por tema/UF (licenciamento, outorga, estanqueidade…)
│   └── 03_fontes_brutas/            ~300 PDFs/docx oficiais (de Diretrizes/07)
├── 03_METODOLOGIA/                  como se produz conhecimento e serviço
│   ├── agentes/                     (de HABILIS_AI/agentes)
│   └── pops_checklists/             (de Estanqueidade SASC; POPs, checklists)
├── 04_CASOS_REAIS/                  projetos/clientes (a prova + o aprendizado)
│   ├── auto-posto-america/          (de Z+Z - América)
│   ├── pgrss-senador-canedo/        (de HABILIS_AI)
│   └── …
├── 05_PRECIFICACAO/                 cotações reais + matrizes de preço (orçamento fiel)
├── 08_LEGADO/                       sistemas/protótipos antigos (read-only)
│   ├── posto-compliance-unico/      (app Analista — extrair o que vale antes)
│   ├── itecologica/
│   └── enviro-clarity/              (de INTERFACE)
└── 09_QUARENTENA/                   duplicados — NÃO deletar
    ├── itecologica-copia/
    └── sasc-v10-oficial-2/
```

Regra de caminho: **número + propósito**. Quem procura sabe onde está (produto, conhecimento, metodologia, casos, preço, legado, quarentena).

---

## 3. Padrões (convenções que param a bagunça futura)

- **Prefixo numérico** em todo topo de pasta (00–09) — ordena e dá endereço estável.
- **`_README.md` obrigatório** em cada pasta-acervo, com: *o que é · fonte · status · responsável · data*.
- **Tags de status** padronizadas: `VIVO` · `REFERENCIA` · `LEGADO` · `DUPLICADO` · `RASCUNHO`.
- **Conhecimento normativo** segue o **modelo canônico** (`base_modelo_conhecimento.json`) por bloco/tema.
- **Documentos do sistema** continuam em `01_PRODUTO/posto-sistema/docs` (já numerados 00–108).
- **Nomes sem acento/espaço** nos diretórios-padrão novos (evita o problema dos `+�` que apareceu nas referências).
- **Um índice só**: `00_MANIFESTO.md` na raiz aponta para tudo. Acabam os "três lugares para o mesmo tema".

---

## 4. Tratamento dos casos especiais (onde mora o risco)

| Caso | Decisão |
|---|---|
| Repos aninhados (posto-sistema, posto-compliance-unico, itecologica) | mover a pasta **inteira**; manter o `.git` interno; só atualizar o caminho. Não fazer `git mv` de repo-dentro-de-repo sem checar submódulo. |
| `posto-compliance-unico` (tem o app **Analista**) | vai para `08_LEGADO`, mas **antes** marcar no manifesto "extrair: app analista_v2 + questionário" como fonte futura. |
| Duplicados (`itecologica-copia`, `SASC (2)`) | `09_QUARENTENA` + nota do **canônico**. Comparar (diff) só depois, com calma. |
| Sistema no ar (`posto-sistema`) | mover para `01_PRODUTO/` **por último**, e validar que `.env`, `docker-compose`, scripts e o remoto `vps` continuam OK (o caminho do servidor é absoluto, não muda; o local sim). |
| Arquivos soltos da raiz (`DIAGNOSTICO_*`, `.codex`) | `DIAGNOSTICO_*` → `02_CONHECIMENTO` ou `00_` conforme conteúdo; `.codex` fica na raiz (config). |

---

## 5. Execução em fases (com portões de verificação)

| Fase | O que faz | Reversível? |
|---|---|---|
| 0 | **Snapshot**: `git add -A && git commit` na raiz + `.zip` externo do workspace | — (é o backup) |
| 1 | Criar a árvore-alvo vazia + `00_MANIFESTO.md` | trivial |
| 2 | **Mover** pastas-acervo (conhecimento, metodologia, casos, preço) para o destino, registrando de→para no manifesto | sim (manifesto/git) |
| 3 | **Quarentena** dos duplicados (sem deletar) | sim |
| 4 | Mover **legado** (posto-compliance-unico, itecologica, enviro-clarity) | sim |
| 5 | Mover **produto** (posto-sistema) + revalidar deploy/paths | sim |
| 6 | `_README.md` por pasta + status | trivial |
| 7 | **Verificação final**: contagem antes==depois (3.884) + manifesto completo | gate |

Cada fase = um commit na raiz. Se algo destoar, `git reset` volta.

---

## 6. O que NÃO faz parte deste plano (para não inflar)
- Não desduplicar conteúdo por dentro (comparar/mesclar arquivos) — isso é a **etapa 2 (consolidar conhecimento)**, depois.
- Não reescrever conhecimento nem código.
- Não decidir o modelo canônico ainda (só reservar o lugar dele) — decisão sua na consolidação.

---

## 7. Sequência macro (o que você pediu)
1. **Organizar** (este plano, 108) — reúne e padroniza, sem perder nada.
2. **Consolidar conhecimento** — eleger o modelo canônico, desduplicar conteúdo, montar os blocos.
3. **Próximos passos** — decididos depois, sobre base organizada.

---

## Resumo em uma frase
> Organizar = **mover (nunca apagar) tudo para uma árvore por propósito (produto/conhecimento/metodologia/casos/preço/legado/quarentena), com backup git antes, manifesto de→para e contagem de verificação** — para que, terminado, nada se perdeu e cada coisa tem um endereço previsível. Só depois consolidamos o conteúdo.

> ⚠️ Risco real: são 3.884 arquivos e 4 repos git aninhados. Por isso: backup primeiro, mover-não-deletar, e nada sem seu OK.
