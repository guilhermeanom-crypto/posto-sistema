# 109 — PLANO DE ORGANIZAÇÃO DO ACERVO CONSOLIDADO (computador inteiro + Drive)

> Evolui o 108 (que era só o workspace) para o escopo real: o conhecimento está em **4 fontes** — workspace, `~/Downloads`, pastas do `/home`, e Google Drive — além das **capturas** (fotos de documentos/cadernos). Objetivo: reunir tudo num **acervo único, por propósito, perdendo nada**. Este é o **PASSO 1 (organizar)**; depois consolida-se o conteúdo; depois os próximos passos. Nada é movido sem OK; fontes externas são **copiadas** (originais ficam até verificar).

---

## 1. As fontes do sprawl (mapeamento LOCAL concluído 2026-06-17)

| Fonte | Volume (domínio) | Exemplos | Status |
|---|---|---|---|
| `~/Documentos/` | **~1.837** | **portfólio real multi-setor**: PRAD/CAR/fazendas, mineração (Cobre-RO), arqueologia (Serranópolis), imobiliário (Vale do Rio Grande), **fiscalização/embargo real** (Autos de Infração, Termos de Embargo, Autocomposição Judicial), outorga/Veredas | ✅ mapeado |
| Workspace `Projetos VS CODE/` | ~3.884 (15 pastas) | sistema, Diretrizes, HABILIS_AI, Z+Z, SASC (docs/107) | ✅ mapeado |
| `~/Downloads/` | ~475 | propostas reais, controle interno Hábilis, matriz de postos, manuais, diagnósticos | ✅ mapeado |
| Pastas de projeto `/home` | — | `habilis/` (docs posto + py), `ana-assistente/`+`ana.py` (assistente "Ana"), `hab_chatbot_unificado/` (engine: rules/schemas/AGENTS), `posto-backup-*.bundle` | ✅ mapeado |
| Capturas (fotos) | 145 imgs | TR SEMMA Guapó, mapas mentais, cadernos, cotações H2S | ✅ mapeado |
| `~/Área de trabalho` | 0 | só atalhos (Chrome/Steam) | ✅ vazio |
| Google Drive | ? | leitura por pasta | ⏳ pendente `/mcp` |

### EXCLUIR do acervo (privacidade/ruído — confirmado no mapa)
- `consult/ABRPANG` — **pessoal/médico**, fora do domínio → não entra.
- `ana-assistente/.env` e segredos — **nunca** copiar para o acervo.
- `venv/` / `.venv/` (ana_assistente tem ~24k arquivos de venv) — ruído; só o código-fonte interessa.
- Qualquer pasta pessoal não-domínio (não foram listadas).

---

## 2. Princípios (perder nada — reforçados para fontes externas)

1. **Backup primeiro** — git commit da raiz do workspace + `.zip` geral. (Já existe um `posto-backup-*.bundle`.)
2. **Fonte externa = COPIAR, não mover.** Downloads e pastas do /home são copiados para o acervo; **os originais ficam** até a verificação fechar. (Dentro do workspace, mover com git.)
3. **Manifesto de→para** único — toda origem registrada.
4. **Verificação por contagem** por cluster (entrou == esperado).
5. **Nada é deletado** nesta etapa. Duplicado → quarentena.
6. **Drive só leitura, por pasta** — nada publicado, revogável.

---

## 3. O destino único — `ACERVO/` (por propósito)

```
Projetos VS CODE/ACERVO/            (versionado; ver decisão git em §6)
├── 00_MANIFESTO.md                 índice único + de→para de cada fonte + status
├── 01_normativo/                   leis, decretos, resoluções, manuais oficiais (Veredas, SEMAD, CONAMA, INMETRO)
├── 02_metodologia/                 frameworks, governança, POPs, agentes, base_modelo_conhecimento.json, mapas mentais
├── 03_matrizes/                    Matriz Postos, matriz de blocos, matrizes de precificação
├── 04_casos_reais/                 por cliente: auto-posto-america, fazenda-belchior, autoposto-centro-oeste, pgrss-senador-canedo, serranopolis…
├── 05_comercial_e_precos/          propostas reais, cotações (H2S), controle interno Hábilis, cronogramas
├── 06_capturas/                    fotos de doc/caderno/mapa + TRANSCRIÇÃO vinculada (regra obrigatória)
├── 07_dados_tecnicos/              shapefiles/GIS, planilhas técnicas
└── 08_legado_software/             ana-assistente, hab_chatbot, posto-compliance-unico, enviro-clarity, bundles
```

Regra de endereço: número + propósito. Quem procura sabe onde está.

---

## 4. Mapa fonte → destino

| De | Para |
|---|---|
| Diretrizes/02_governanca, 07_referencias | `01_normativo` + `02_metodologia` |
| HABILIS_AI (modelo + agentes + casos) | `02_metodologia` + `04_casos_reais` |
| Estanqueidade SASC (POPs/checklists) | `02_metodologia` |
| Z+Z América, casos do /Downloads (Belchior, CentroOeste, Serranópolis) | `04_casos_reais` |
| Propostas/cotações/controle interno/cronogramas (Downloads + Z+Z) | `05_comercial_e_precos` |
| Matriz Postos, matriz blocos, precificação logística | `03_matrizes` |
| Fotos (TR, mapas mentais, cadernos) | `06_capturas` (+ transcrição) |
| Shapefiles, metadados SICAE | `07_dados_tecnicos` |
| ana-*, hab_chatbot, posto-compliance-unico, enviro-clarity, bundle | `08_legado_software` |
| ITECOLOGICA-copia, SASC (2) | `09_QUARENTENA` (não deletar) |

---

## 5. Processo em fases (incremental, por prioridade)

| Fase | O que faz | Risco |
|---|---|---|
| 0 | Backup (git commit raiz + zip) | — |
| 1 | Criar `ACERVO/` + `00_MANIFESTO.md` | trivial |
| 2 | **Inventário completo** (só nomes) das 4 fontes → manifesto. Inclui mapear `~/Documentos`, `~/Área de trabalho` e o Drive | nenhum (read-only) |
| 3 | **Reunir por PRIORIDADE** (copiar/mover por cluster), começando pelos pequenos e valiosos: `06_capturas` (TR), `05_comercial_e_precos`, `03_matrizes` | baixo |
| 4 | Reunir o restante (normativo, casos, metodologia, legado) | baixo |
| 5 | Quarentena dos duplicados | baixo |
| 6 | `_README.md` + status por pasta | trivial |
| 7 | **Verificação** (contagem por cluster) + manifesto completo. Só então decidir sobre originais | gate |

Cada fase = um commit. Reversível.

---

## 6. Decisões que são SUAS (não decido por você)

1. **Onde fica o `ACERVO/`**: dentro do workspace (versionado em git — recomendo, é backup automático) **ou** pasta separada?
2. **Git rastreia binários** (PDFs/fotos)? Recomendo: estrutura/transcrições no git; binários grandes numa subpasta marcada (ou git-lfs depois). Evita inchar o repo.
3. **Originais externos**: manter (recomendo) ou remover após verificar? Sugiro **manter arquivados** por enquanto.
4. **Drive**: entra agora (você roda `/mcp`) ou só local primeiro?

---

## 7. Privacidade (a sua preocupação)
- Só **leitura**; nada publicado; Drive revogável.
- **Filtro por domínio** — pastas pessoais não entram no acervo.
- Conteúdo lido passa pela IA para organizar (igual ao que já fazemos com os locais) — não vira público.

---

## 8. Sequência macro (o que você pediu)
1. **Organizar** (este plano, 109) — reunir tudo num acervo único, sem perder nada.
2. **Consolidar conhecimento** — eleger modelo canônico, desduplicar conteúdo, montar blocos por tema/UF.
3. **Próximos passos** — sobre base organizada.

---

## Resumo em uma frase
> O conhecimento está em 4 lugares (workspace, Downloads, /home, Drive) + fotos. O plano reúne tudo num **`ACERVO/` por propósito**, **copiando** as fontes externas (originais preservados), com **backup, manifesto de→para e verificação por contagem** — começando pelos clusters pequenos e valiosos (o TR real, as propostas/preços reais, as matrizes). Só depois consolidamos o conteúdo. Perde-se nada; nada é movido sem seu OK.
